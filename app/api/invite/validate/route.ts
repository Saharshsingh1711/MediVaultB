import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { SB_TABLES } from "@/lib/supabase/tables";

// GET: Validate an invite token and return the patient_id if valid
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get("token");

    if (!token) {
      return NextResponse.json(
        { error: "Token is required", valid: false },
        { status: 400 }
      );
    }

    // Use admin client to bypass RLS — this endpoint needs to work for any authenticated user
    const adminSupabase = createAdminClient();

    const { data: invite, error } = await adminSupabase
      .from(SB_TABLES.patient_invites)
      .select("*")
      .eq("token", token)
      .single();

    if (error || !invite) {
      return NextResponse.json(
        { error: "Invalid or unknown invite token", valid: false },
        { status: 404 }
      );
    }

    // Check if revoked
    if (invite.is_revoked) {
      return NextResponse.json(
        { error: "This invite has been revoked by the patient", valid: false },
        { status: 410 }
      );
    }

    // Check if expired
    const now = new Date();
    const expiresAt = new Date(invite.expires_at);
    if (now > expiresAt) {
      return NextResponse.json(
        { error: "This invite link has expired", valid: false },
        { status: 410 }
      );
    }

    return NextResponse.json({
      valid: true,
      patient_id: invite.patient_id,
      expires_at: invite.expires_at,
    });
  } catch (err: any) {
    console.error("Token validation error:", err);
    return NextResponse.json(
      { error: "Internal server error", valid: false },
      { status: 500 }
    );
  }
}
