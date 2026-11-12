import { NextRequest, NextResponse } from "next/server";

interface SupabaseMediaItem {
  media_url?: string;
  media_type?: string;
  is_primary?: boolean;
}

interface SupabaseInventoryItem {
  frame_name?: string;
  brand?: string;
  price?: number;
  model_name?: string;
  material?: string;
  front_size?: number;
  bridge_size?: number;
  temple_length?: number;
  inventory_media?: SupabaseMediaItem[];
  [key: string]: unknown;
}

interface SupabaseRecommendationItem {
  id: string;
  created_at: string;
  match_score?: number;
  reasoning?: string;
  reasoning_ar?: string;
  is_purchased?: boolean;
  profiles?: {
    full_name?: string;
    email?: string;
  } | null;
  inventory?: SupabaseInventoryItem | null;
}

const FALLBACK_LEADS = [
  {
    id: "mock-lead-101",
    created_at: new Date(Date.now() - 3600000 * 1.2).toISOString(),
    match_score: 98,
    reasoning: "EXECUTIVE STYLE MAPPING: Strong rectangular acetate rims match robust lower-jaw traits. Extremely handsome choice for Saudi executive wear.",
    reasoning_ar: "مخطط الطابع التنفيذي: إطار مستطيل متين يبرز زوايا الفك السفلي القوية. اختيار فاخر للمظهر العملي الرسمي.",
    is_purchased: false,
    profiles: {
      full_name: "Faisal Al-Harthi",
      email: "faisal.harthi@optic.sa"
    },
    inventory: {
      frame_name: "Tom Ford TF5488-B Gold",
      brand: "Tom Ford",
      price: 380.00,
      model_name: "TF5488-B",
      material: "Acetate",
      image_url: "https://images.unsplash.com/photo-1591076482161-42ce6da69f67?auto=format&fit=crop&q=80&w=400",
      front_size: 52,
      bridge_size: 18,
      temple_length: 145
    }
  },
  {
    id: "mock-lead-102",
    created_at: new Date(Date.now() - 3600000 * 18).toISOString(),
    match_score: 95,
    reasoning: "MINIMALIST TITANIUM FIT: Perfect match for oval profiles. Crafted from lightweight medical-grade titanium for elite daily comfort.",
    reasoning_ar: "تعديل التيتانيوم البسيط: مثالي للملامح البيضاوية. صُنِع من تيتانيوم طبي خفيف للغاية لراحة يومية استثنائية.",
    is_purchased: false,
    profiles: {
      full_name: "Leena Jaradat",
      email: "leena.jaradat@vision.jo"
    },
    inventory: {
      frame_name: "Cartier CT0011O Rimless",
      brand: "Cartier",
      price: 980.00,
      model_name: "CT0011O",
      material: "Titanium Gold",
      image_url: "https://images.unsplash.com/photo-1511499767150-a48a237f0083?auto=format&fit=crop&q=80&w=400",
      front_size: 53,
      bridge_size: 18,
      temple_length: 140
    }
  },
  {
    id: "mock-lead-103",
    created_at: new Date(Date.now() - 86400000).toISOString(),
    match_score: 91,
    reasoning: "VINTAGE ACETATE VIBE: Classic round tortoise frame balances defined high cheekbone structure.",
    reasoning_ar: "مظهر أسيتات كلاسيكي: إطار دائري مرقط متناسق مميز يخلق توازناً جميلاً مع عظام الخد البارزة والمحددة.",
    is_purchased: true,
    profiles: {
      full_name: "Rahman Sobhani",
      email: "rahman.sobhani@gmail.com"
    },
    inventory: {
      frame_name: "Gregory Peck Tortoise",
      brand: "Oliver Peoples",
      price: 395.00,
      model_name: "Gregory Peck Classic",
      material: "Acetate Frame",
      image_url: "https://images.unsplash.com/photo-1572635196237-14b3f281503f?auto=format&fit=crop&q=80&w=400",
      front_size: 47,
      bridge_size: 23,
      temple_length: 150
    }
  },
  {
    id: "mock-lead-104",
    created_at: new Date(Date.now() - 172800000).toISOString(),
    match_score: 89,
    reasoning: "TR90 PERFORMANCE DESIGN: Durable memory thermopolymer structure engineered for active operations.",
    reasoning_ar: "تصميم الأداء العالي TR90: هيكل مرن مقاوم للصدمات والحرارة مصمم للمغامرات وأسلوب الحياة الرياضي الديناميكي.",
    is_purchased: false,
    profiles: {
      full_name: "Maha Obeidat",
      email: "maha.obeidat@gmail.com"
    },
    inventory: {
      frame_name: "Oakley Holbrook Matte Black",
      brand: "Oakley",
      price: 152.00,
      model_name: "OO9102 Black",
      material: "O Matter (R) Active",
      image_url: "https://images.unsplash.com/photo-1577803645773-f96470509666?auto=format&fit=crop&q=80&w=400",
      front_size: 55,
      bridge_size: 18,
      temple_length: 137
    }
  }
];

export async function GET() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return NextResponse.json({
      success: true,
      data: FALLBACK_LEADS,
      isConfigured: false,
    });
  }

  try {
    const query = new URLSearchParams({
      select: "id,created_at,match_score,reasoning,reasoning_ar,is_purchased,profiles:user_id(full_name,email),inventory:inventory_id(frame_name,brand,price,model_name,material,front_size,bridge_size,temple_length,inventory_media!inventory_media_inventory_id_fkey(media_url,media_type,is_primary))",
      order: "created_at.desc",
    });

    const res = await fetch(`${supabaseUrl}/rest/v1/recommendations?${query.toString()}`, {
      method: "GET",
      headers: {
        apikey: supabaseAnonKey,
        Authorization: `Bearer ${supabaseAnonKey}`,
        "Content-Type": "application/json",
      },
      cache: "no-store",
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.warn("Supabase rest query returned status:", res.status, errorText);
      return NextResponse.json({
        success: true,
        data: FALLBACK_LEADS,
        isConfigured: true,
        isFallback: true,
        errorMessage: errorText,
      });
    }

    const rawData: SupabaseRecommendationItem[] = await res.json();

    const formatted = rawData.map((item) => {
      const inv = item.inventory;
      let finalImageUrl: string | null = null;
      if (inv) {
        const mediaList =
          (inv["inventory_media!inventory_media_inventory_id_fkey"] as SupabaseMediaItem[] | undefined) ||
          inv.inventory_media ||
          [];
        if (Array.isArray(mediaList) && mediaList.length > 0) {
          const primary = mediaList.find((m) => m?.is_primary === true);
          finalImageUrl = primary?.media_url || mediaList[0]?.media_url || null;
        }
      }

      return {
        id: item.id,
        created_at: item.created_at,
        match_score: item.match_score || 0,
        reasoning: item.reasoning || "",
        reasoning_ar: item.reasoning_ar || "",
        is_purchased: !!item.is_purchased,
        profiles: item.profiles
          ? {
              full_name: item.profiles.full_name || "Guest Customer",
              email: item.profiles.email || "",
            }
          : null,
        inventory: inv
          ? {
              frame_name: inv.frame_name || "Eyewear Frame",
              brand: inv.brand || "Envision",
              price: Number(inv.price) || 0,
              model_name: inv.model_name || null,
              material: inv.material || null,
              image_url: finalImageUrl,
              front_size: inv.front_size || null,
              bridge_size: inv.bridge_size || null,
              temple_length: inv.temple_length || null,
            }
          : null,
      };
    });

    return NextResponse.json({
      success: true,
      data: formatted,
      isConfigured: true,
      isFallback: false,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("API /api/shop/leads error:", message);
    return NextResponse.json({
      success: true,
      data: FALLBACK_LEADS,
      isConfigured: true,
      isFallback: true,
      errorMessage: message,
    });
  }
}

export async function PATCH(req: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  try {
    const body = await req.json();
    const { id, is_purchased } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: "Missing recommendation id" }, { status: 400 });
    }

    if (!supabaseUrl || !supabaseAnonKey) {
      return NextResponse.json({ success: true, isLocalOnly: true });
    }

    const res = await fetch(`${supabaseUrl}/rest/v1/recommendations?id=eq.${encodeURIComponent(id)}`, {
      method: "PATCH",
      headers: {
        apikey: supabaseAnonKey,
        Authorization: `Bearer ${supabaseAnonKey}`,
        "Content-Type": "application/json",
        Prefer: "return=representation",
      },
      body: JSON.stringify({ is_purchased: !!is_purchased }),
    });

    if (!res.ok) {
      const errorText = await res.text();
      return NextResponse.json({ success: false, error: errorText }, { status: res.status });
    }

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
