import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { SB_TABLES } from "@/lib/supabase/tables";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(request: NextRequest) {
    const supabase = await createClient();
    const supabaseAdmin = await createAdminClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // ── Source 1: Records from individual record share tokens ──
    const tokenRecordIds = new Set<string>();

    const { data: tokensData } = await supabaseAdmin
        .from(SB_TABLES.record_share_tokens)
        .select("record_id, expires_at")
        .contains("claimed_by", [user.id])
        .eq("is_revoked", false);

    const now = new Date();
    for (const t of tokensData || []) {
        if (new Date(t.expires_at) > now) {
            tokenRecordIds.add(t.record_id);
        }
    }

    // ── Source 2: ALL records from patients who shared via invite links ──
    // Find patients linked to this doctor via access_logs
    const linkedPatientIds = new Set<string>();

    const { data: accessData } = await supabaseAdmin
        .from(SB_TABLES.access_logs)
        .select("patient_id")
        .eq("doctor_id", user.id)
        .eq("action", "SHARED_LINK_ACCESS");

    for (const entry of accessData || []) {
        linkedPatientIds.add(entry.patient_id);
    }

    // Also check active (non-revoked, non-expired) patient invites claimed by this doctor
    const { data: inviteAccessData } = await supabaseAdmin
        .from(SB_TABLES.access_logs)
        .select("patient_id")
        .eq("doctor_id", user.id)
        .in("action", ["SHARED_LINK_ACCESS", "DOCUMENT_LIBRARY_ACCESS"]);

    for (const entry of inviteAccessData || []) {
        linkedPatientIds.add(entry.patient_id);
    }

    // ── Fetch records from both sources ──
    let allRecords: any[] = [];

    // Fetch records by individual token IDs
    if (tokenRecordIds.size > 0) {
        const { data: tokenRecords } = await supabaseAdmin
            .from(SB_TABLES.medical_records)
            .select("*")
            .in("id", [...tokenRecordIds])
            .order("created_at", { ascending: false });

        if (tokenRecords) allRecords.push(...tokenRecords);
    }

    // Fetch ALL records from linked patients
    if (linkedPatientIds.size > 0) {
        const { data: patientRecords } = await supabaseAdmin
            .from(SB_TABLES.medical_records)
            .select("*")
            .in("patient_id", [...linkedPatientIds])
            .order("created_at", { ascending: false });

        if (patientRecords) allRecords.push(...patientRecords);
    }

    // Deduplicate by record ID (a record might appear from both sources)
    const seen = new Set<string>();
    allRecords = allRecords.filter(r => {
        if (seen.has(r.id)) return false;
        seen.add(r.id);
        return true;
    });

    // Sort by created_at descending
    allRecords.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    // ── Enrich with patient names ──
    const uniquePatientIds = [...new Set(allRecords.map((r: any) => r.patient_id))];

    let patientMap: Record<string, { name: string; email: string }> = {};

    if (uniquePatientIds.length > 0) {
        const { data: patientsData } = await supabaseAdmin
            .from(SB_TABLES.user_patient)
            .select("user_id, first_name, second_name, email")
            .in("user_id", uniquePatientIds);

        if (patientsData) {
            for (const p of patientsData) {
                patientMap[p.user_id] = {
                    name: `${p.first_name || ""} ${p.second_name || ""}`.trim() || "Unknown",
                    email: p.email || "",
                };
            }
        }
    }

    const enrichedRecords: MedicalRecord[] = allRecords.map((r: any) => ({
        ...r,
        patient_name: patientMap[r.patient_id]?.name || "Unknown Patient",
        patient_email: patientMap[r.patient_id]?.email || "",
    }));

    return NextResponse.json({ records: enrichedRecords });
}