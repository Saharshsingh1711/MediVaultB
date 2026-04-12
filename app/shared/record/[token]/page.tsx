'use client'

import React, { useState, useEffect, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { SB_TABLES } from "@/lib/supabase/tables";
import { getUserRole } from "@/lib/supabase/roles";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  Clock,
  FileText,
  ExternalLink,
  Lock,
  CheckCircle2,
  XCircle,
  BrainCircuit,
  User,
  Calendar,
  ShieldCheck,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/Button";
import Link from "next/link";

const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
};

type ViewState = "loading" | "error" | "unauthorized" | "success";

export default function SharedRecordView() {
  const params = useParams();
  const token = params.token as string;

  const [viewState, setViewState] = useState<ViewState>("loading");
  const [errorMessage, setErrorMessage] = useState("");
  const [record, setRecord] = useState<any>(null);
  const [patientProfile, setPatientProfile] = useState<any>(null);
  const [expiresAt, setExpiresAt] = useState<string>("");
  const [doctorName, setDoctorName] = useState("");

  const supabase = createClient()

  useEffect(() => {
    async function validateAndFetch() {
      try {
        // 1. Check if logged in
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setViewState("unauthorized");
          setErrorMessage("You must be logged in as a doctor to view this shared record.");
          return;
        }

        // 2. Verify doctor role
        const role = await getUserRole(user.id);
        if (role !== "doctor") {
          setViewState("unauthorized");
          setErrorMessage("Only verified doctors can access shared patient records.");
          return;
        }

        // Get doctor info
        const { data: doctorData } = await supabase
          .from(SB_TABLES.user_doctor)
          .select("first_name, second_name")
          .eq("user_id", user.id)
          .single();

        const dName = doctorData
          ? `Dr. ${doctorData.first_name} ${doctorData.second_name}`
          : "Doctor";
        setDoctorName(dName);

        // 3. Validate token and claim it
        const validateRes = await fetch(
          `/api/record-token/validate?token=${encodeURIComponent(token)}&doctor_id=${user.id}`
        );
        const validateData = await validateRes.json();

        if (!validateData.valid) {
          setViewState("error");
          setErrorMessage(validateData.error || "This share link is not valid.");
          return;
        }

        setExpiresAt(validateData.expires_at);

        // 4. Fetch the specific record
        const { data: recordData, error: recordError } = await supabase
          .from(SB_TABLES.medical_records)
          .select("*")
          .eq("id", validateData.record_id)
          .single();

        if (recordError || !recordData) {
          setViewState("error");
          setErrorMessage("The shared record could not be found.");
          return;
        }

        setRecord(recordData);

        // 5. Fetch patient profile
        const { data: profileData } = await supabase
          .from(SB_TABLES.user_patient)
          .select("first_name, second_name, email, blood_group, gender")
          .eq("user_id", validateData.patient_id)
          .single();

        setPatientProfile(profileData);

        // 6. Log access
        await supabase.from(SB_TABLES.access_logs).insert({
          patient_id: validateData.patient_id,
          doctor_id: user.id,
          doctor_name: dName,
          action: "RECORD_TOKEN_ACCESS",
          metadata: {
            record_id: validateData.record_id,
            record_title: recordData.title,
            token_preview: token.slice(-8),
            timestamp: new Date().toISOString(),
          },
        });

        setViewState("success");
      } catch (err: any) {
        console.error("Shared record view error:", err);
        setViewState("error");
        setErrorMessage("An unexpected error occurred while loading this record.");
      }
    }

    validateAndFetch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, supabase]);

  // ─── Loading State ────────────────────
  if (viewState === "loading") {
    return (
      <div className="min-h-screen bg-[#FBFBFF] flex items-center justify-center selection:bg-indigo-100 selection:text-indigo-900">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center space-y-8"
        >
          <div className="relative mx-auto w-24 h-24">
            <div className="absolute inset-0 rounded-full border-4 border-indigo-100" />
            <div className="absolute inset-0 rounded-full border-4 border-t-indigo-600 animate-spin" />
            <div
              className="absolute inset-3 rounded-full border-4 border-t-violet-500 border-transparent animate-spin"
              style={{ animationDirection: "reverse", animationDuration: "1.5s" }}
            />
          </div>
          <div className="space-y-3">
            <p className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.4em]">
              Verifying Record Access Token
            </p>
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
              Decrypting shared record access...
            </p>
          </div>
        </motion.div>
      </div>
    );
  }

  // ─── Error / Unauthorized ─────────────
  if (viewState === "error" || viewState === "unauthorized") {
    return (
      <div className="min-h-screen bg-[#FBFBFF] flex items-center justify-center p-6 selection:bg-indigo-100 selection:text-indigo-900">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="max-w-lg w-full text-center space-y-10"
        >
          <div className="mx-auto h-24 w-24 rounded-[2rem] bg-rose-50 border border-rose-100 flex items-center justify-center shadow-lg">
            {viewState === "unauthorized" ? (
              <Lock className="h-12 w-12 text-rose-500" />
            ) : (
              <XCircle className="h-12 w-12 text-rose-500" />
            )}
          </div>
          <div className="space-y-4">
            <h1 className="text-4xl font-black text-indigo-950 italic tracking-tighter font-heading">
              {viewState === "unauthorized" ? "Access Restricted." : "Link Invalid."}
            </h1>
            <p className="text-sm text-slate-500 font-medium leading-relaxed max-w-md mx-auto">
              {errorMessage}
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/login">
              <Button className="h-14 px-8 rounded-3xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-md text-[10px] uppercase tracking-widest font-bold">
                Login as Doctor
              </Button>
            </Link>
            <Link href="/">
              <Button variant="outline" className="h-14 px-8 rounded-3xl border-indigo-100 text-indigo-600 hover:bg-indigo-50 text-[10px] uppercase tracking-widest font-bold">
                Return Home
              </Button>
            </Link>
          </div>
        </motion.div>
      </div>
    );
  }

  // ─── Success: Record View ─────────────
  const timeLeft = expiresAt
    ? Math.max(0, Math.floor((new Date(expiresAt).getTime() - Date.now()) / (1000 * 60 * 60)))
    : 0;

  const aiData = record?.ai_summary
    ? (() => { try { return JSON.parse(record.ai_summary); } catch { return null; } })()
    : null;

  return (
    <div className="min-h-screen bg-[#FBFBFF] relative overflow-hidden selection:bg-indigo-100 selection:text-indigo-900">
      {/* Decorative Background Elements */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-100/30 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-violet-100/30 rounded-full blur-[120px] pointer-events-none" />

      <motion.div
        initial="hidden"
        animate="visible"
        variants={fadeIn}
        className="max-w-4xl mx-auto space-y-12 relative z-10 px-4 md:px-6 py-12"
      >
        {/* Header */}
        <header className="space-y-6 pb-8 border-b border-indigo-50">
          <div className="flex items-center gap-3">
            <div className="h-3 w-3 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
            <span className="text-[10px] font-black text-emerald-600 uppercase tracking-[0.3em]">
              Authorized Record Access — Shared View
            </span>
          </div>

          <h1 className="text-4xl md:text-5xl font-black text-indigo-950 tracking-tighter italic font-heading">
            {record?.title}
            <span className="bg-gradient-to-r from-indigo-500 to-violet-500 bg-clip-text text-transparent">.</span>
          </h1>

          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-50 border border-indigo-100">
              <User className="h-3.5 w-3.5 text-indigo-500" />
              <span className="text-[10px] font-black text-indigo-700 uppercase tracking-widest">
                {patientProfile ? `${patientProfile.first_name} ${patientProfile.second_name}` : "Patient"}
              </span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-50 border border-amber-100">
              <Clock className="h-3.5 w-3.5 text-amber-600" />
              <span className="text-[10px] font-black text-amber-700 uppercase tracking-widest">
                {timeLeft}h remaining
              </span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-50 border border-emerald-100">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
              <span className="text-[10px] font-black text-emerald-700 uppercase tracking-widest">
                Read-Only
              </span>
            </div>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest font-mono">
              Viewing as: <span className="text-indigo-600">{doctorName}</span>
            </span>
          </div>
        </header>

        {/* Record Card */}
        <div className="bg-white border border-indigo-100 rounded-[2.5rem] p-10 shadow-xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:scale-150 transition-transform duration-1000" />

          <div className="relative z-10 space-y-8">
            {/* Record Meta */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-6">
                <div className="h-16 w-16 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 shadow-sm">
                  <FileText className="h-8 w-8" />
                </div>
                <div className="space-y-2">
                  <h2 className="text-3xl font-black text-indigo-950 font-heading italic tracking-tighter">
                    {record?.title}
                  </h2>
                  <div className="flex items-center gap-4">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest font-mono flex items-center gap-1.5">
                      <Calendar className="h-3 w-3" />
                      {new Date(record?.created_at).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </span>
                    <span className="px-3 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest border bg-indigo-50 text-indigo-600 border-indigo-100 font-mono">
                      {record?.record_type}
                    </span>
                    {record?.is_emergency_flag && (
                      <span className="px-3 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest border bg-rose-50 text-rose-600 border-rose-100 flex items-center gap-1">
                        <AlertTriangle className="h-3 w-3" />
                        Emergency
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* AI Summary */}
            {aiData && (
              <div className="space-y-6 mt-8">
                {/* AI Confidence */}
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center text-white shadow-md">
                    <BrainCircuit className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-indigo-950 uppercase tracking-tight">AI Clinical Brief</h4>
                    <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Groq AI Analysis</p>
                  </div>
                  {aiData.confidenceScore && (
                    <span className={cn(
                      "ml-auto px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest border",
                      aiData.confidenceScore >= 80 ? "bg-emerald-50 text-emerald-600 border-emerald-100" :
                        aiData.confidenceScore >= 50 ? "bg-amber-50 text-amber-600 border-amber-100" :
                          "bg-rose-50 text-rose-600 border-rose-100"
                    )}>
                      Confidence: {aiData.confidenceScore}%
                    </span>
                  )}
                </div>

                {/* Summary */}
                {aiData.shortBrief && (
                  <div className="p-6 rounded-2xl bg-gradient-to-r from-indigo-50/50 to-violet-50/50 border border-indigo-50">
                    <p className="text-sm font-medium text-slate-600 leading-relaxed">
                      {aiData.shortBrief}
                    </p>
                  </div>
                )}

                {/* Key Findings */}
                {aiData.keyFindings?.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="text-xs font-black text-indigo-950 uppercase tracking-widest">Key Findings</h4>
                    <ul className="space-y-2">
                      {aiData.keyFindings.map((finding: string, idx: number) => (
                        <li key={idx} className="flex items-start gap-3 p-4 rounded-xl bg-white border border-indigo-50 shadow-sm">
                          <div className="h-1.5 w-1.5 rounded-full bg-indigo-500 mt-2 flex-shrink-0" />
                          <span className="text-sm font-medium text-slate-600 leading-relaxed">{finding}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Recommendations */}
                {aiData.recommendations?.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="text-xs font-black text-indigo-950 uppercase tracking-widest">Recommendations</h4>
                    <ul className="space-y-2">
                      {aiData.recommendations.map((rec: string, idx: number) => (
                        <li key={idx} className="flex items-start gap-3 p-4 rounded-xl bg-violet-50/50 border border-violet-100">
                          <span className="text-[10px] font-black text-violet-500 mt-0.5">→</span>
                          <span className="text-sm font-medium text-slate-600 leading-relaxed">{rec}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {/* Raw Text Preview (if no AI but text exists) */}
            {!aiData && record?.raw_text_content && (
              <div className="p-6 rounded-2xl bg-slate-50 border border-slate-100 max-h-64 overflow-y-auto">
                <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-3">Extracted Text</h4>
                <p className="text-sm font-medium text-slate-600 leading-relaxed whitespace-pre-wrap">
                  {record.raw_text_content.slice(0, 2000)}
                  {record.raw_text_content.length > 2000 && "..."}
                </p>
              </div>
            )}

            {/* View Original */}
            {record?.file_url && (
              <a href={record.file_url} target="_blank" rel="noreferrer">
                <Button variant="outline" className="h-14 px-8 rounded-2xl border-indigo-100 text-indigo-600 hover:bg-indigo-50 transition-all shadow-sm text-[10px] font-black uppercase tracking-widest w-full md:w-auto">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  View Original Document
                </Button>
              </a>
            )}
          </div>
        </div>

        {/* Patient Info Sidebar */}
        {patientProfile && (
          <div className="bg-white border border-indigo-100 rounded-[2.5rem] p-8 shadow-soft">
            <div className="flex items-center gap-4 mb-6">
              <div className="h-12 w-12 rounded-full bg-indigo-600 flex items-center justify-center text-white text-sm font-bold shadow-premium ring-4 ring-white">
                {patientProfile.first_name?.[0]?.toUpperCase()}
              </div>
              <div>
                <h4 className="text-sm font-bold text-indigo-950">
                  {patientProfile.first_name} {patientProfile.second_name}
                </h4>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  {patientProfile.gender || "—"} • {patientProfile.blood_group || "—"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-[10px] font-black text-slate-300 uppercase tracking-widest">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
              All access is logged and audited
            </div>
          </div>
        )}

        {/* Footer */}
        <footer className="pt-12 border-t border-indigo-50 flex flex-col md:flex-row justify-between items-end gap-8">
          <div className="flex items-center gap-3">
            <ShieldCheck className="h-4 w-4 text-emerald-500" />
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
              Encrypted Transit — Read-Only Access
            </span>
          </div>
          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest text-right font-mono italic">
            MediVault Shared Record Viewer — Time-limited access via secure token
          </p>
        </footer>
      </motion.div>
    </div>
  );
}
