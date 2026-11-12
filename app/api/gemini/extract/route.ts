import { GoogleGenAI, Type } from "@google/genai";
import { NextRequest, NextResponse } from "next/server";

const apiKey = process.env.GEMINI_API_KEY;

// Lazy initialization of Gemini client to prevent crash on startup if key is missing
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

    if (!imageUrls || !Array.isArray(imageUrls) || imageUrls.length === 0) {
      return NextResponse.json(
        { error: "imageUrls must be a non-empty array of strings." },
        { status: 400 }
      );
    }

    // Initialize the client
    const ai = getGeminiClient();

    // Fetch the images and convert them into Base64 inline parts for Gemini
    const fetchPromises = imageUrls.map(async (url: string, idx: number) => {
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

    if (validImageParts.length === 0) {
      return NextResponse.json(
        { error: "Failed to download/process any of the provided images." },
        { status: 400 }
      );
    }

    // Build descriptions for images based on their index in the sequential inputs
    const descriptionText = `
You are the high-speed data extraction engine for "Envision Eyewear".
Your job is to assist field agents in Jordan and Saudi Arabia to digitalize optical shop inventories with 100% accuracy.

We have captured sequentially taken photos of a luxury eyeglass frame:
${imageUrls.map((_, idx) => {
  const labels = [
    "Photo 1: Frame Front Angle (Catalog view for visual style, design, color reference)",
    "Photo 2: Frame Profile Angle (Catalog angle of temples)",
    "Photo 3: Inner Bridge Sizing Stamp",
    "Photo 4: Inner Temple Sizing Stamp",
    "Photo 5: Lens Frame Sizing Stamp"
  ];
  return `- ${labels[idx] || `Photo ${idx + 1}`}`;
}).join("\n")}

Please inspect these images meticulously to extract:
1. **brand**: Identify the brand/designer name (e.g., Tom Ford, Gucci, Ray-Ban, Chanel, etc.). CRITICAL: If the brand cannot be clearly identified or deducted from the images, return an empty string "" or null (Do NOT return 'unknown', 'N/A' or guess).
2. **model_name**: Extract the specific model number or style code (e.g., TF5488, GG0024S, RX5154). CRITICAL: If the model name or code is not clearly identifiable, return an empty string "" or null (Do NOT return 'unknown', 'N/A' or guess).
3. **front_size**: The eye size / lens width (usually first number in a sequence like 51, 52, 53, 54, etc.). Must be numeric or null if unreadable.
4. **bridge_size**: The bridge width (typically between 14 and 24, e.g. 18, 19, 20). Must be numeric or null if unreadable.
5. **temple_length**: The temple arm length (typically between 135 and 150, e.g. 140, 145). Must be numeric or null if unreadable.
6. **frame_material**: Categorize material strictly as one of the following exact options: Acetate, Metal, Titanium, TR90, Acetate & Metal (Combination), Acetate & Titanium (Combination), Metal & TR90 (Combination), Titanium & TR90 (Combination), Carbon Fiber, Stainless Steel, Ultem, Wood / Bamboo, or Other / Unknown.
7. **price**: CRITICAL constraint: Do NOT output a price unless there is an clear, explicit price printed or handwritten on an attached shop sticker/price tag in the photos. If no explicit shop tags with prices are readable, return null.
8. **alt_text**: A professional visual "alt_text" vector embedding string. It should capture the "vibe", shape (aviator, cat-eye, round, rectangular, square), style characteristics, frame color, and lens color with an elegant tone (e.g. "Classic dark tortoiseshell rectangular acetate frame with clean gold hinges for an intelligent professional signature").
9. **agent_instruction**: Provide a single precise sentence telling the field agent what specific detail they should verify on the physical frame (e.g., "Double-check if there is a logo on the outer temple arm" or "Confirm if the bridge stamp says 18 or 19 because it was slightly blurry").

Strict Output Rules:
- Return ONLY JSON matching the schema.
- If a measurement or name cannot be determined, return null or empty string "". Do not make up mock numbers or output placeholder words.
`;

    const requestConfig = {
      systemInstruction: "You are the high-speed data extraction engine for \"Envision Eyewear\". Your job is to assist field agents in Jordan and Saudi Arabia to digitalize optical shop inventories with 100% accuracy.",
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          brand: {
            type: Type.STRING,
            description: "Extracted Brand name (return null or empty string if not clearly deducted)",
          },
          model_name: {
            type: Type.STRING,
            description: "Extracted Model / SKU name or number (return null or empty string if not clearly deducted)",
          },
          front_size: {
            type: Type.NUMBER,
            description: "Numeric front lens width size in millimeters (or null)",
          },
          bridge_size: {
            type: Type.NUMBER,
            description: "Numeric bridge distance in millimeters (or null)",
          },
          temple_length: {
            type: Type.NUMBER,
            description: "Numeric temple arm length in millimeters (or null)",
          },
          frame_material: {
            type: Type.STRING,
            description: "Frame Material option - Acetate, Metal, Titanium, TR90, Acetate & Metal (Combination), Acetate & Titanium (Combination), Metal & TR90 (Combination), Titanium & TR90 (Combination), Carbon Fiber, Stainless Steel, Ultem, Wood / Bamboo, or Other / Unknown",
          },
          price: {
            type: Type.NUMBER,
            description: "Extracted price tag numeric value (return null if not printed on an explicit tag)",
          },
          alt_text: {
            type: Type.STRING,
            description: "Luxury visual alt text descriptor of the design, style and feel",
          },
          agent_instruction: {
            type: Type.STRING,
            description: "Single-sentence check or attention instruction for the agent operator",
          },
        },
        required: ["frame_material", "alt_text", "agent_instruction"],
      },
    };

    const contentsPayload = [
      {
        role: "user",
        parts: [
          ...validImageParts,
          { text: descriptionText },
        ],
      }
    ];

    let response;
    try {
      response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: contentsPayload,
        config: requestConfig,
      });
    } catch (primaryErr: any) {
      const errStr = primaryErr?.message || String(primaryErr);
      const isTemporaryDemand =
        primaryErr?.status === 503 ||
        primaryErr?.code === 503 ||
        /503|unavailable|high demand|overloaded/i.test(errStr);

      if (isTemporaryDemand) {
        console.warn("gemini-3.5-flash is experiencing high demand. Falling back to gemini-2.5-flash...");
        try {
          response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: contentsPayload,
            config: requestConfig,
          });
        } catch (fallbackErr: any) {
          throw fallbackErr;
        }
      } else {
        throw primaryErr;
      }
    }

    const parsedText = response.text ? response.text.trim() : "{}";
    
    return NextResponse.json(JSON.parse(parsedText));
  } catch (err: any) {
    console.error("Extraction API Error: ", err);

    let raw = err?.message || String(err);
    let isHighDemand = false;
    let isRateLimited = false;

    try {
      const parsed = JSON.parse(raw);
      if (parsed?.error?.code === 503 || parsed?.error?.status === "UNAVAILABLE") {
        isHighDemand = true;
      } else if (parsed?.error?.code === 429 || parsed?.error?.status === "RESOURCE_EXHAUSTED") {
        isRateLimited = true;
      }
    } catch {}

    if (/503|unavailable|high demand|overloaded/i.test(raw)) {
      isHighDemand = true;
    } else if (/429|quota|rate limit|exhausted/i.test(raw)) {
      isRateLimited = true;
    }

    if (isHighDemand) {
      return NextResponse.json(
        {
          error: "The AI inspection service is currently experiencing high demand. Please try again in a few moments, or enter the frame details manually.",
          code: 503,
          isHighDemand: true,
        },
        { status: 503 }
      );
    }

    if (isRateLimited) {
      return NextResponse.json(
        {
          error: "The AI inspection service has temporarily reached its request limit. Please wait a moment before trying again.",
          code: 429,
          isRateLimited: true,
        },
        { status: 429 }
      );
    }

    return NextResponse.json(
      {
        error: "The AI service is momentarily unavailable. Please try again in a moment, or enter the frame details manually.",
        code: 500
      },
      { status: 500 }
    );
  }
}
