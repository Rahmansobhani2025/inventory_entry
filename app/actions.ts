"use server";

import { createClient } from "@supabase/supabase-js";

export async function getGeminiCredentials() {
  return {
    apiKey: process.env.GEMINI_API_KEY || "",
    modelName: process.env.NEXT_PUBLIC_GEMINI_MODEL || "gemini-2.5-flash-image"
  };
}

export async function getServerTimestamp() {
  return Date.now();
}

/**
 * Server action to automatically provision and link staff accounts:
 * - Populates `shop_staff_credentials` with (shop_id, user_id, email, role)
 * - Populates `profiles` row matching auth.users.id with (shop_id, role, full_name, email)
 */
export async function provisionStaffAccount(payload: {
  shopId: string;
  email: string;
  userId?: string;
  fullName?: string;
  role?: string;
}) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

  if (!supabaseUrl || !supabaseAnonKey) {
    return { success: false, error: "Database configuration is not available." };
  }

  const { shopId, email, userId, fullName, role = "staff" } = payload;

  if (!shopId || !email) {
    return { success: false, error: "shopId and email are required." };
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey);
  const normalizedEmail = email.toLowerCase().trim();

  try {
    let resolvedUserId = userId;

    // If userId not explicitly provided, attempt to locate user from profiles or credentials
    if (!resolvedUserId) {
      const { data: existingProfile } = await supabase
        .from("profiles")
        .select("id")
        .eq("email", normalizedEmail)
        .maybeSingle();

      if (existingProfile?.id) {
        resolvedUserId = existingProfile.id;
      } else {
        const { data: existingCred } = await supabase
          .from("shop_staff_credentials")
          .select("user_id")
          .eq("email", normalizedEmail)
          .maybeSingle();

        if (existingCred?.user_id) {
          resolvedUserId = existingCred.user_id;
        }
      }
    }

    // 1. Populate/Upsert into shop_staff_credentials
    const staffCredPayload: Record<string, any> = {
      shop_id: shopId,
      email: normalizedEmail,
      role: role || "staff",
      ...(resolvedUserId ? { user_id: resolvedUserId } : {})
    };

    // Check if an existing credential record exists by user_id or email
    let existingCredId: string | number | null = null;
    if (resolvedUserId) {
      const { data: byUser } = await supabase
        .from("shop_staff_credentials")
        .select("id")
        .eq("user_id", resolvedUserId)
        .maybeSingle();
      if (byUser?.id) existingCredId = byUser.id;
    }
    if (!existingCredId) {
      const { data: byEmail } = await supabase
        .from("shop_staff_credentials")
        .select("id")
        .eq("email", normalizedEmail)
        .maybeSingle();
      if (byEmail?.id) existingCredId = byEmail.id;
    }

    if (existingCredId) {
      await supabase
        .from("shop_staff_credentials")
        .update(staffCredPayload)
        .eq("id", existingCredId);
    } else {
      await supabase
        .from("shop_staff_credentials")
        .insert(staffCredPayload);
    }

    // 2. If resolvedUserId is present, populate/upsert profiles table
    if (resolvedUserId) {
      const profilePayload: Record<string, any> = {
        id: resolvedUserId,
        shop_id: shopId,
        email: normalizedEmail,
        role: role || "staff",
        full_name: fullName || normalizedEmail.split("@")[0],
        updated_at: new Date().toISOString()
      };

      const { error: profileErr } = await supabase
        .from("profiles")
        .upsert(profilePayload, { onConflict: "id" });

      if (profileErr) {
        console.warn("Server action: profiles upsert notice:", profileErr);
      }
    }

    return {
      success: true,
      data: {
        shopId,
        email: normalizedEmail,
        userId: resolvedUserId || null,
        role
      }
    };
  } catch (err: any) {
    console.error("provisionStaffAccount error:", err);
    return { success: false, error: err.message || "Failed to provision staff account." };
  }
}
