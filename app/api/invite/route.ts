import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { SB_TABLES } from "@/lib/supabase/tables";
import crypto from "crypto";

// POST: Generate a new invite link
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify the user is a patient
    const { data: patientData } = await supabase
      .from(SB_TABLES.user_patient)
      .select("user_id")
      .eq("user_id", user.id)
      .single();

    if (!patientData) {
      return NextResponse.json(
        { error: "Only patients can generate invite links" },
        { status: 403 }
      );
    }

    // Generate a cryptographically secure token
    const token = crypto.randomUUID() + "-" + crypto.randomBytes(16).toString("hex");

    // Set expiry to 72 hours from now
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 72);

    // Insert using admin client to bypass RLS for insert
    const adminSupabase = createAdminClient();
    const { data: invite, error } = await adminSupabase
      .from(SB_TABLES.patient_invites)
      .insert({
        patient_id: user.id,
        token,
        expires_at: expiresAt.toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error("Invite creation error:", error);
      return NextResponse.json(
        { error: "Failed to create invite" },
        { status: 500 }
      );
    }

    // Build the full shareable URL
    const baseUrl = request.nextUrl.origin;
    const shareUrl = `${baseUrl}/shared/${token}`;

    return NextResponse.json({
      success: true,
      invite: {
        id: invite.id,
        token: invite.token,
        expires_at: invite.expires_at,
        share_url: shareUrl,
      },
    });
  } catch (err: any) {
    console.error("Invite generation error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// GET: Fetch all active invites for the current patient
export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: invites, error } = await supabase
      .from(SB_TABLES.patient_invites)
      .select("*")
      .eq("patient_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Fetch invites error:", error);
      return NextResponse.json(
        { error: "Failed to fetch invites" },
        { status: 500 }
      );
    }

    return NextResponse.json({ invites: invites || [] });
  } catch (err: any) {
    console.error("Fetch invites error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PATCH: Revoke an invite
export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { invite_id } = body;

    if (!invite_id) {
      return NextResponse.json(
        { error: "invite_id is required" },
        { status: 400 }
      );
    }

    // Use admin client to perform the update, since RLS update may have issues
    const adminSupabase = createAdminClient();
    const { error } = await adminSupabase
      .from(SB_TABLES.patient_invites)
      .update({ is_revoked: true })
      .eq("id", invite_id)
      .eq("patient_id", user.id);

    if (error) {
      console.error("Revoke error:", error);
      return NextResponse.json(
        { error: "Failed to revoke invite" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("Revoke error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
