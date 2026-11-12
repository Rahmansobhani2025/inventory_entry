import { GoogleGenAI } from "@google/genai";
import { NextRequest, NextResponse } from "next/server";

const apiKey = process.env.GEMINI_API_KEY;

function getGeminiClient() {
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY environment variable is missing.");
  }
  return new GoogleGenAI({
    apiKey: apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      }
    }
  });
}

export async function POST(req: NextRequest) {
  try {
    if (!apiKey) {
      return NextResponse.json(
        { error: "Gemini API key is not configured in this applet yet." },
        { status: 500 }
      );
    }

    const { imageUrls } = await req.json();

    if (!imageUrls || !Array.isArray(imageUrls) || imageUrls.length < 2) {
      return NextResponse.json(
        { error: "imageUrls must contain at least 2 image URLs." },
        { status: 400 }
      );
    }

    const ai = getGeminiClient();

    // 1. Fetch both original images
    const fetchPromises = imageUrls.slice(0, 2).map(async (url: string, idx: number) => {
      try {
        if (!url || typeof url !== "string") return null;

        // Handle data: URIs directly without calling fetch
        if (url.startsWith("data:")) {
          const match = url.match(/^data:([^;]+);base64,([\s\S]+)$/);
          if (match) {
            return {
              inlineData: {
                mimeType: match[1] || "image/jpeg",
                data: match[2],
              },
            };
          }
          const commaIdx = url.indexOf(",");
          if (commaIdx !== -1) {
            const rawHeader = url.substring(0, commaIdx);
            const rawData = url.substring(commaIdx + 1);
            const mimeMatch = rawHeader.match(/data:([^;]+)/);
            return {
              inlineData: {
                mimeType: mimeMatch ? mimeMatch[1] : "image/jpeg",
                data: rawData,
              },
            };
          }
          return null;
        }

        const res = await fetch(url);
        if (!res.ok) {
          throw new Error(`Failed to fetch image at index ${idx}`);
        }
        const buffer = await res.arrayBuffer();
        const base64 = Buffer.from(buffer).toString("base64");
        
        let mimeType = "image/jpeg";
        const cleanUrl = url.toLowerCase().split("?")[0];
        if (cleanUrl.endsWith(".png")) {
          mimeType = "image/png";
        } else if (cleanUrl.endsWith(".webp")) {
          mimeType = "image/webp";
        } else if (res.headers.get("content-type")) {
          mimeType = res.headers.get("content-type") || "image/jpeg";
        }

        return {
          inlineData: {
            data: base64,
            mimeType: mimeType,
          },
        };
      } catch (err) {
        console.error(`Error loading image index ${idx} url: ${url}`, err);
        return null;
      }
    });

    const resolvedParts = await Promise.all(fetchPromises);
    const validImageParts = resolvedParts.filter((p) => p !== null) as Array<{
      inlineData: { data: string; mimeType: string };
    }>;

    if (validImageParts.length < 2) {
      return NextResponse.json(
        { error: "Failed to download or process both source images correctly." },
        { status: 400 }
      );
    }

    // 2. Instruct Gemini 2.5 flash image to combine the two images side-by-side and remove elements' backgrounds
    const promptText = `
You are a precise e-commerce image processing engine. Your exclusive task is to take two input image URLs of the same eyeglass frame (Image 1: Flat front view, Image 2: Perspective side angle view) that were saved to cloudinary and merge them side by side into a single storefront-ready image.

CRITICAL PROCESSING RULES:
1. BACKGROUND REMOVAL: Isolate the eyeglass frames completely from both images. Strip out all background elements, surface textures, or original shadows. Place the isolated frames onto a uniform, seamless pure white (#FFFFFF) canvas.
2. VISUAL PRESERVATION: Do not alter, hallucinate, or redraw any physical features of the eyeglasses. The lenses, frame textures, colors, metal accents, and logos must match the source files exactly.
3. GRID ARRANGEMENT: Arrange the final output side-by-side:
   - LEFT SIDE: The flat, symmetrical front-facing view (Image 1), perfectly leveled horizontally.
   - RIGHT SIDE: The 3D perspective angle view (Image 2).
4. DIMENSIONS & SCALE: Both frames must be scaled identically in vertical height and centered cleanly with generous, balanced white space padding on all sides.

OUTPUT DIRECTIVE:
Return only the generated image asset immediately. Do not include any introductory or concluding conversational text.
`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-image",
      contents: [
        {
          role: "user",
          parts: [
            ...validImageParts,
            { text: promptText }
          ]
        }
      ],
      config: {
        systemInstruction: "You are a precise e-commerce image processing engine. Your exclusive task is to take two input images of the same eyeglass frame and merge them side by side into a single storefront-ready image on a pure white background.",
        imageConfig: {
          aspectRatio: "1:1"
        }
      }
    });

    // 3. Scan the response parts for the generated image
    let base64Output = "";
    let mimeTypeOutput = "image/png";

    if (response.candidates?.[0]?.content?.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
          base64Output = part.inlineData.data || "";
          if (part.inlineData.mimeType) {
            mimeTypeOutput = part.inlineData.mimeType;
          }
          break;
        }
      }
    }

    if (!base64Output) {
      throw new Error("Gemini did not return an updated/combined image asset.");
    }

    // 4. Upload Gemini's combined output image directly to Cloudinary (with fallback to data URL)
    let finalUrl = `data:${mimeTypeOutput};base64,${base64Output}`;
    try {
      const cloudinaryRes = await fetch("https://api.cloudinary.com/v1_1/dkzznbzes/image/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          file: `data:${mimeTypeOutput};base64,${base64Output}`,
          upload_preset: "inventory_preset"
        })
      });

      if (cloudinaryRes.ok) {
        const cloudinaryJson = await cloudinaryRes.json();
        if (cloudinaryJson.secure_url) {
          finalUrl = cloudinaryJson.secure_url;
        }
      }
    } catch (cErr) {
      console.warn("Cloudinary upload failed in optimize route, returning data URI:", cErr);
    }

    return NextResponse.json({ success: true, url: finalUrl });
  } catch (err: any) {
    console.error("Gemini optimize image endpoint error:", err);
    return NextResponse.json(
      { error: err.message || "Failed during Gemini image combination." },
      { status: 500 }
    );
  }
}
