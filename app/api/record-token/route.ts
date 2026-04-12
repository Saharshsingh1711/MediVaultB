import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { SB_TABLES } from "@/lib/supabase/tables";
import crypto from "crypto";

const EXPIRY_MAP: Record<string, number> = {
  "1h": 1,
  "1d": 24,
  "1w": 24 * 7,
  "1m": 24 * 30,
  "1y": 24 * 365,
};

// POST: Generate a share token for a specific record
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify user is a patient
    const { data: patientData } = await supabase
      .from(SB_TABLES.user_patient)
      .select("user_id")
      .eq("user_id", user.id)
      .single();

    if (!patientData) {
      return NextResponse.json(
        { error: "Only patients can generate record share links" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { record_id, expires_in, doctor_email } = body;

    if (!record_id || !expires_in || !doctor_email) {
      return NextResponse.json(
        { error: "record_id and expires_in and doctor_email are required" },
        { status: 400 }
      );
    }

    // Verify the record belongs to this patient
    const { data: recordData } = await supabase
      .from(SB_TABLES.medical_records)
      .select("id, title")
      .eq("id", record_id)
      .eq("patient_id", user.id)
      .single();

    if (!recordData) {
      return NextResponse.json(
        { error: "Record not found or doesn't belong to you" },
        { status: 404 }
      );
    }

    const hours = EXPIRY_MAP[expires_in];
    if (!hours) {
      return NextResponse.json(
        { error: "Invalid expires_in value. Use: 1h, 1d, 1w, 1m, 1y" },
        { status: 400 }
      );
    }

    // Generate cryptographic token
    const token =
      crypto.randomUUID() + "-" + crypto.randomBytes(16).toString("hex");

    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + hours);

    // Insert using admin client to bypass RLS
    const adminSupabase = createAdminClient();
    const { data: shareToken, error } = await adminSupabase
      .from(SB_TABLES.record_share_tokens)
      .insert({
        record_id,
        patient_id: user.id,
        token,
        expires_at: expiresAt.toISOString(),
        claimed_by: [],
        record_title: recordData.title,
        is_revoked: false,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error("Token creation error:", error);
      return NextResponse.json(
        { error: "Failed to create share token" },
        { status: 500 }
      );
    }

    const baseUrl = request.nextUrl.origin;
    const shareUrl = `${baseUrl}/shared/record/${token}`;

    return NextResponse.json({
      success: true,
      token: {
        id: shareToken.id,
        token: shareToken.token,
        record_id: shareToken.record_id,
        record_title: recordData.title,
        expires_at: shareToken.expires_at,
        share_url: shareUrl,
      },
    });
  } catch (err: any) {
    console.error("Token generation error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// GET: Fetch all record share tokens for the current patient
export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const adminSupabase = createAdminClient();
    const { data: tokens, error } = await adminSupabase
      .from(SB_TABLES.record_share_tokens)
      .select("*, medical_records(title, record_type)")
      .eq("patient_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Fetch tokens error:", error);
      return NextResponse.json(
        { error: "Failed to fetch tokens" },
        { status: 500 }
      );
    }

    return NextResponse.json({ tokens: tokens || [] });
  } catch (err: any) {
    console.error("Fetch tokens error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PATCH: Revoke a record share token
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
    const { token_id } = body;

    if (!token_id) {
      return NextResponse.json(
        { error: "token_id is required" },
        { status: 400 }
      );
    }

    const adminSupabase = createAdminClient();
    const { error } = await adminSupabase
      .from(SB_TABLES.record_share_tokens)
      .update({ is_revoked: true })
      .eq("id", token_id)
      .eq("patient_id", user.id);

    if (error) {
      console.error("Revoke error:", error);
      return NextResponse.json(
        { error: "Failed to revoke token" },
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
