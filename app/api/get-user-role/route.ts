import { createAdminClient } from "@/lib/supabase/admin";
import { SB_TABLES } from "@/lib/supabase/tables";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
    try {
        const url = new URL(request.url);
        const userId = url.searchParams.get("userId");

        if (!userId) return NextResponse.json({ error: "User ID is required" }, { status: 400 });

        const supabaseAdmin = await createAdminClient();

        console.log("testing for patient role")

        // Check if patient
        const { data: patientData, error: patientError } = await supabaseAdmin
            .from(SB_TABLES.user_patient)
            .select("user_id")
            .eq("user_id", userId)
            .maybeSingle();

        console.log({ patientError, patientData })

        if (patientError) return NextResponse.json({ error: "Internal server error" }, { status: 500 });

        if (patientData) return NextResponse.json({ role: "patient" });

        console.log("testing for doc role")

        // Check if doctor
        const { data: docData, error: docError } = await supabaseAdmin
            .from(SB_TABLES.user_doctor)
            .select("user_id")
            .eq("user_id", userId)
            .maybeSingle();

        console.log({ docError, docData })

        if (docError) return NextResponse.json({ error: "Internal server error" }, { status: 500 });

        if (docData) return NextResponse.json({ role: "doctor" });

        return NextResponse.json({ role: "none" });
    } catch (e) {
        console.log(e);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}