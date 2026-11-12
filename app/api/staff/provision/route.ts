import { NextRequest, NextResponse } from "next/server";
import { provisionStaffAccount } from "@/app/actions";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { shopId, email, userId, fullName, role } = body;

    if (!shopId || !email) {
      return NextResponse.json(
        { success: false, error: "shopId and email are required fields." },
        { status: 400 }
      );
    }

    const result = await provisionStaffAccount({
      shopId,
      email,
      userId,
      fullName,
      role
    });

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 422 }
      );
    }

    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "Failed to process provisioning request." },
      { status: 500 }
    );
  }
}
