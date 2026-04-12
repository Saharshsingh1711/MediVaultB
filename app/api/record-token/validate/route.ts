import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { SB_TABLES } from "@/lib/supabase/tables";

// GET: Validate a record share token and claim it for the doctor
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get("token");
    const doctorId = searchParams.get("doctor_id");

    if (!token) {
      return NextResponse.json(
        { error: "Token is required", valid: false },
        { status: 400 }
      );
    }

    const adminSupabase = createAdminClient();

    const { data: shareToken, error } = await adminSupabase
      .from(SB_TABLES.record_share_tokens)
      .select("*")
      .eq("token", token)
      .single();

    if (error || !shareToken) {
      return NextResponse.json(
        { error: "Invalid or unknown record share token", valid: false },
        { status: 404 }
      );
    }

    // Check if revoked
    if (shareToken.is_revoked) {
      return NextResponse.json(
        { error: "This share link has been revoked by the patient", valid: false },
        { status: 410 }
      );
    }

    // Check if expired
    const now = new Date();
    const expiresAt = new Date(shareToken.expires_at);
    if (now > expiresAt) {
      return NextResponse.json(
        { error: "This share link has expired", valid: false },
        { status: 410 }
      );
    }

    // If doctor_id provided, add to claimed_by array if not already present
    if (doctorId) {
      const claimedBy: string[] = shareToken.claimed_by || [];
      if (!claimedBy.includes(doctorId)) {
        const updatedClaimedBy = [...claimedBy, doctorId];
        await adminSupabase
          .from(SB_TABLES.record_share_tokens)
          .update({ claimed_by: updatedClaimedBy })
          .eq("id", shareToken.id);
      }
    }

    return NextResponse.json({
      valid: true,
      record_id: shareToken.record_id,
      patient_id: shareToken.patient_id,
      expires_at: shareToken.expires_at,
    });
  } catch (err: any) {
    console.error("Token validation error:", err);
    return NextResponse.json(
      { error: "Internal server error", valid: false },
      { status: 500 }
    );
  }
}
