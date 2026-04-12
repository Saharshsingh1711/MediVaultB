'use client'

import React, { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { SB_TABLES } from "@/lib/supabase/tables";
import { getUserRole } from "@/lib/supabase/roles";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  ShieldAlert,
  Clock,
  Heart,
  Zap,
  Activity,
  Thermometer,
  FileText,
  Pill,
  AlertTriangle,
  BrainCircuit,
  ExternalLink,
  User,
  Droplets,
  Phone,
  MapPin,
  Lock,
  CheckCircle2,
  XCircle,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
};

const itemFadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

type ViewState = "loading" | "error" | "unauthorized" | "success";

export default function SharedPatientView() {
  const params = useParams();
  const token = params.token as string;

  const [viewState, setViewState] = useState<ViewState>("loading");
  const [errorMessage, setErrorMessage] = useState("");
  const [profile, setProfile] = useState<any>(null);
  const [records, setRecords] = useState<any[]>([]);
  const [vitals, setVitals] = useState<any[]>([]);
  const [prescriptions, setPrescriptions] = useState<any[]>([]);
  const [expiresAt, setExpiresAt] = useState<string>("");
  const [doctorName, setDoctorName] = useState("");

  const supabase = createClient();

  useEffect(() => {
    async function validateAndFetch() {
      try {
        // 1. Check if logged in
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setViewState("unauthorized");
          setErrorMessage("You must be logged in as a doctor to view this patient record.");
          return;
        }

        // 2. Verify doctor role
        const role = await getUserRole(user.id);
        if (role !== "doctor") {
          setViewState("unauthorized");
          setErrorMessage("Only verified doctors can access shared patient records.");
          return;
        }

        // Get doctor info for access log
        const { data: doctorData } = await supabase
          .from(SB_TABLES.user_doctor)
          .select("first_name, second_name")
          .eq("user_id", user.id)
          .single();
        
        const dName = doctorData ? `Dr. ${doctorData.first_name} ${doctorData.second_name}` : "Doctor";
        setDoctorName(dName);

        // 3. Validate invite token
        const validateRes = await fetch(`/api/invite/validate?token=${encodeURIComponent(token)}`);
        const validateData = await validateRes.json();

        if (!validateData.valid) {
          setViewState("error");
          setErrorMessage(validateData.error || "This invite link is not valid.");
          return;
        }

        const patientId = validateData.patient_id;
        setExpiresAt(validateData.expires_at);

        // 4. Log the access
        await supabase.from(SB_TABLES.access_logs).insert({
          patient_id: patientId,
          doctor_id: user.id,
          doctor_name: dName,
          action: "SHARED_LINK_ACCESS",
          metadata: {
            token_preview: token.slice(-8),
            timestamp: new Date().toISOString(),
          },
        });

        // 5. Fetch patient data (all in parallel)
        const [profileRes, recordsRes, vitalsRes, prescriptionsRes] = await Promise.all([
          supabase
            .from(SB_TABLES.user_patient)
            .select("*")
            .eq("user_id", patientId)
            .single(),
          supabase
            .from(SB_TABLES.medical_records)
            .select("*")
            .eq("patient_id", patientId)
            .order("created_at", { ascending: false }),
          supabase
            .from(SB_TABLES.medical_vitals)
            .select("*")
            .eq("patient_id", patientId)
            .order("created_at", { ascending: false })
            .limit(5),
          supabase
            .from(SB_TABLES.prescriptions)
            .select("*")
            .eq("patient_id", patientId)
            .order("created_at", { ascending: false }),
        ]);

        setProfile(profileRes.data);
        setRecords(recordsRes.data || []);
        setVitals(vitalsRes.data || []);
        setPrescriptions(prescriptionsRes.data || []);
        setViewState("success");

      } catch (err: any) {
        console.error("Shared view error:", err);
        setViewState("error");
        setErrorMessage("An unexpected error occurred while loading this patient record.");
      }
    }

    validateAndFetch();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  // ─── Loading State ────────────────────────────────────
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
            <div className="absolute inset-3 rounded-full border-4 border-t-violet-500 border-transparent animate-spin" style={{ animationDirection: "reverse", animationDuration: "1.5s" }} />
          </div>
          <div className="space-y-3">
            <p className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.4em]">Verifying Clinical Credentials</p>
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Decrypting patient vault access token...</p>
          </div>
        </motion.div>
      </div>
    );
  }

  // ─── Error / Unauthorized States ──────────────────────
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

  // ─── Success: Patient Data View ───────────────────────
  const latestVital = vitals[0];
  const timeLeft = expiresAt ? Math.max(0, Math.floor((new Date(expiresAt).getTime() - Date.now()) / (1000 * 60 * 60))) : 0;

  return (
    <div className="min-h-screen bg-[#FBFBFF] relative overflow-hidden selection:bg-indigo-100 selection:text-indigo-900">
      {/* Decorative Background Elements */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-100/30 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-violet-100/30 rounded-full blur-[120px] pointer-events-none" />

      <motion.div
        initial="hidden"
        animate="visible"
        variants={fadeIn}
        className="max-w-7xl mx-auto space-y-12 relative z-10 px-4 md:px-6 py-12"
      >
        {/* Header Banner */}
        <header className="space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-8 border-b border-indigo-50">
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="h-3 w-3 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                <span className="text-[10px] font-black text-emerald-600 uppercase tracking-[0.3em]">Authorized Access — Shared Patient View</span>
              </div>
              <h1 className="text-4xl md:text-5xl font-black text-indigo-950 tracking-tighter italic font-heading">
                {profile?.first_name} {profile?.second_name}
                <span className="bg-gradient-to-r from-indigo-500 to-violet-500 bg-clip-text text-transparent">.</span>
              </h1>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest font-mono">
                Viewing as: <span className="text-indigo-600">{doctorName}</span>
              </p>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3 px-6 py-3 rounded-2xl bg-amber-50 border border-amber-100">
                <Clock className="h-4 w-4 text-amber-600" />
                <span className="text-[10px] font-black text-amber-700 uppercase tracking-widest">{timeLeft}h remaining</span>
              </div>
              <div className="flex items-center gap-3 px-6 py-3 rounded-2xl bg-emerald-50 border border-emerald-100">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                <span className="text-[10px] font-black text-emerald-700 uppercase tracking-widest">Read-Only</span>
              </div>
            </div>
          </div>
        </header>

        {/* Patient Demographics Card */}
        <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <motion.div variants={itemFadeIn} className="md:col-span-2 bg-white border border-indigo-100 rounded-[2.5rem] p-10 shadow-xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:scale-150 transition-transform duration-1000" />
            <div className="relative z-10 space-y-8">
              <div className="flex items-center gap-6">
                <div className="h-20 w-20 rounded-[1.5rem] bg-indigo-600 flex items-center justify-center text-white text-3xl font-black italic shadow-lg">
                  {profile?.first_name?.[0]}{profile?.second_name?.[0]}
                </div>
                <div className="space-y-2">
                  <h2 className="text-3xl font-black text-indigo-950 italic tracking-tighter">{profile?.first_name} {profile?.second_name}</h2>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest font-mono">
                    PID: {profile?.patient_id || profile?.user_id?.slice(0, 8).toUpperCase()}
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <InfoPill icon={User} label="Gender" value={profile?.gender || "—"} />
                <InfoPill icon={Droplets} label="Blood Group" value={profile?.blood_group || "—"} />
                <InfoPill icon={Phone} label="Emergency Contact" value={profile?.emergency_contact_name || "—"} />
                <InfoPill icon={MapPin} label="Location" value={profile?.address?.split(",").pop()?.trim() || "—"} />
              </div>
            </div>
          </motion.div>

          {/* Allergies */}
          <motion.div variants={itemFadeIn} className="bg-rose-50/50 border border-rose-100/50 rounded-[2.5rem] p-8 shadow-lg flex flex-col">
            <div className="flex items-center gap-3 text-rose-600 mb-6">
              <div className="p-2 rounded-xl bg-rose-100/50"><AlertTriangle className="h-5 w-5" /></div>
              <h4 className="text-[10px] font-black uppercase tracking-widest">Active Allergies</h4>
            </div>
            <div className="flex flex-wrap gap-2 flex-1">
              {profile?.active_allergies?.length > 0 ? (
                profile.active_allergies.map((a: string, i: number) => (
                  <span key={i} className="px-4 py-2 rounded-xl bg-white border border-rose-100 text-rose-600 text-[10px] font-black uppercase tracking-widest shadow-sm">{a}</span>
                ))
              ) : (
                <p className="text-xs text-slate-400 italic font-medium">No known allergies</p>
              )}
            </div>
          </motion.div>

          {/* Conditions */}
          <motion.div variants={itemFadeIn} className="bg-violet-50/50 border border-violet-100/50 rounded-[2.5rem] p-8 shadow-lg flex flex-col">
            <div className="flex items-center gap-3 text-violet-600 mb-6">
              <div className="p-2 rounded-xl bg-violet-100/50"><ShieldAlert className="h-5 w-5" /></div>
              <h4 className="text-[10px] font-black uppercase tracking-widest">Chronic Conditions</h4>
            </div>
            <div className="flex flex-wrap gap-2 flex-1">
              {profile?.chronic_conditions?.length > 0 ? (
                profile.chronic_conditions.map((c: string, i: number) => (
                  <span key={i} className="px-4 py-2 rounded-xl bg-white border border-violet-100 text-violet-600 text-[10px] font-black uppercase tracking-widest shadow-sm">{c}</span>
                ))
              ) : (
                <p className="text-xs text-slate-400 italic font-medium">No chronic conditions documented</p>
              )}
            </div>
          </motion.div>
        </motion.div>

        {/* Vitals Section */}
        <motion.div variants={fadeIn} initial="hidden" animate="visible" className="space-y-8">
          <div className="flex items-center justify-between px-2">
            <h2 className="text-3xl font-black text-indigo-950 italic tracking-tighter font-heading">Vital Telemetry.</h2>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">
              {latestVital ? `Last recorded: ${new Date(latestVital.created_at).toLocaleDateString()}` : "No data"}
            </span>
          </div>

          {latestVital ? (
            <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <VitalCard icon={Heart} label="Heart Rate" value={latestVital.heart_rate} unit="BPM" colorClass="text-rose-500" bgClass="bg-rose-50" />
              <VitalCard icon={Zap} label="SpO2" value={latestVital.spo2} unit="%" colorClass="text-indigo-600" bgClass="bg-indigo-50" />
              <VitalCard icon={Activity} label="Blood Pressure" value={latestVital.blood_pressure} colorClass="text-violet-600" bgClass="bg-violet-50" />
              <VitalCard icon={Thermometer} label="Temperature" value={latestVital.temperature} unit="°C" colorClass="text-amber-500" bgClass="bg-amber-50" />
            </motion.div>
          ) : (
            <div className="py-16 text-center border border-indigo-100 rounded-[2.5rem] bg-white shadow-sm">
              <Activity className="h-10 w-10 text-slate-200 mx-auto mb-4" />
              <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Vital telemetry stream empty</p>
            </div>
          )}
        </motion.div>

        {/* Records & Prescriptions Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Records (2/3) */}
          <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="lg:col-span-2 space-y-8">
            <div className="flex items-center justify-between px-2">
              <h2 className="text-3xl font-black text-indigo-950 italic tracking-tighter font-heading">Medical Records.</h2>
              <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">{records.length} indexed</span>
            </div>
            <div className="space-y-4">
              {records.length > 0 ? records.map(record => {
                const aiData = record.ai_summary ? (() => { try { return JSON.parse(record.ai_summary); } catch { return null; } })() : null;
                return (
                  <motion.div variants={itemFadeIn} key={record.id} className="group hover:border-indigo-200 border border-indigo-50 shadow-soft rounded-[2rem] bg-white p-6 transition-all duration-300">
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
                      <div className="flex items-center gap-6 w-full sm:w-auto">
                        <div className="h-12 w-12 rounded-2xl bg-indigo-50 flex shrink-0 items-center justify-center text-indigo-600 shadow-sm group-hover:bg-indigo-600 group-hover:text-white transition-all duration-500">
                          <FileText className="h-6 w-6" />
                        </div>
                        <div className="space-y-1 overflow-hidden">
                          <h4 className="text-base font-bold text-indigo-950 uppercase tracking-tight truncate">{record.title}</h4>
                          <p className="text-[10px] text-slate-400 font-mono font-black uppercase tracking-widest truncate">
                            {new Date(record.created_at).toLocaleDateString()} • {record.record_type}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 w-full sm:w-auto justify-end">
                        <span className={cn(
                          "hidden md:inline px-3 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest border font-mono",
                          record.ai_summary ? "bg-violet-50 text-violet-600 border-violet-100" : "bg-indigo-50 text-indigo-600 border-indigo-100"
                        )}>
                          {record.ai_summary ? "AI Analyzed" : "Indexed"}
                        </span>
                        {record.file_url && (
                          <a href={record.file_url} target="_blank" rel="noreferrer">
                            <Button variant="outline" size="sm" className="h-10 w-10 p-0 border-indigo-100 text-indigo-600 hover:bg-indigo-50 rounded-xl">
                              <ExternalLink className="h-4 w-4" />
                            </Button>
                          </a>
                        )}
                      </div>
                    </div>
                    {/* AI Summary Preview */}
                    {aiData && aiData.shortBrief && (
                      <div className="mt-4 p-4 rounded-2xl bg-gradient-to-r from-indigo-50/50 to-violet-50/50 border border-indigo-50">
                        <p className="text-xs text-slate-500 font-medium leading-relaxed line-clamp-2">
                          <span className="text-[9px] font-black text-violet-500 uppercase tracking-wider mr-2">AI:</span>
                          {aiData.shortBrief}
                        </p>
                      </div>
                    )}
                  </motion.div>
                );
              }) : (
                <div className="py-16 text-center border border-indigo-100 rounded-[2.5rem] bg-white shadow-sm">
                  <FileText className="h-10 w-10 text-slate-200 mx-auto mb-4" />
                  <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">No medical records on file</p>
                </div>
              )}
            </div>
          </motion.div>

          {/* Prescriptions (1/3) */}
          <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="space-y-8">
            <div className="flex items-center justify-between px-2">
              <h2 className="text-3xl font-black text-indigo-950 italic tracking-tighter font-heading">Prescriptions.</h2>
              <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">{prescriptions.length} Rx</span>
            </div>
            <div className="space-y-4">
              {prescriptions.length > 0 ? prescriptions.map(presc => (
                <motion.div variants={itemFadeIn} key={presc.id} className="border border-indigo-100 rounded-[2rem] shadow-lg bg-white p-6 group hover:border-indigo-200 transition-all duration-300">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="h-12 w-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 shadow-sm group-hover:scale-110 transition-transform">
                      <Pill className="h-6 w-6" />
                    </div>
                    <div className="space-y-0.5">
                      <h4 className="text-sm font-bold text-indigo-950 uppercase tracking-tight">{presc.medication_name}</h4>
                      <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">{presc.dosage}</p>
                    </div>
                  </div>
                  {presc.instructions && (
                    <div className="p-4 rounded-xl bg-indigo-50/50 border border-indigo-50">
                      <p className="text-xs text-slate-600 font-medium leading-relaxed italic border-l-4 border-indigo-300 pl-4">
                        {presc.instructions}
                      </p>
                    </div>
                  )}
                </motion.div>
              )) : (
                <div className="py-16 text-center border border-indigo-100 rounded-[2.5rem] bg-white shadow-sm">
                  <Pill className="h-10 w-10 text-slate-200 mx-auto mb-4" />
                  <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">No active prescriptions</p>
                </div>
              )}
            </div>

            {/* Current Medications */}
            {profile?.current_medications?.length > 0 && (
              <motion.div variants={itemFadeIn} className="bg-indigo-50/50 border border-indigo-100/50 rounded-[2rem] p-6 shadow-soft">
                <div className="flex items-center gap-3 text-indigo-600 mb-4">
                  <div className="p-2 rounded-xl bg-indigo-100/50"><Pill className="h-4 w-4" /></div>
                  <h4 className="text-[10px] font-black uppercase tracking-widest">Current Medications</h4>
                </div>
                <div className="flex flex-wrap gap-2">
                  {profile.current_medications.map((med: string, i: number) => (
                    <span key={i} className="px-3 py-1.5 rounded-lg bg-white border border-indigo-100 text-indigo-600 text-[10px] font-black uppercase tracking-widest shadow-sm">{med}</span>
                  ))}
                </div>
              </motion.div>
            )}
          </motion.div>
        </div>

        {/* Footer */}
        <footer className="pt-16 border-t border-indigo-100 flex flex-col md:flex-row justify-between items-end gap-10 opacity-60 hover:opacity-100 transition-all">
          <div className="space-y-3">
            <h3 className="text-3xl font-black text-indigo-950 italic tracking-tighter font-heading">Byteus.</h3>
            <div className="flex items-center gap-4 font-mono">
              <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest bg-white shadow-sm px-3 py-1 rounded-full border border-slate-100">SHARED VIEW — ENCRYPTED TRANSIT</span>
              <div className="h-px w-8 bg-slate-200" />
            </div>
          </div>
          <p className="max-w-md text-[9px] font-bold text-slate-400 uppercase tracking-widest text-right leading-relaxed font-mono italic">
            This is a time-limited, read-only view of patient data authorized via a secure invite token.
            All access is logged and audited.
          </p>
        </footer>
      </motion.div>
    </div>
  );
}

// ─── Helper Components ──────────────────────────────────

function InfoPill({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 p-4 rounded-2xl bg-indigo-50/50 border border-indigo-50">
      <Icon className="h-4 w-4 text-indigo-400 shrink-0" />
      <div className="min-w-0">
        <div className="text-[8px] font-black text-slate-400 uppercase tracking-widest">{label}</div>
        <div className="text-sm font-bold text-indigo-950 truncate">{value}</div>
      </div>
    </div>
  );
}

function VitalCard({ icon: Icon, label, value, unit, colorClass, bgClass }: any) {
  return (
    <motion.div variants={itemFadeIn} className="border border-indigo-100 rounded-[2rem] shadow-lg p-8 space-y-4 bg-white hover:border-indigo-200 transition-all">
      <div className={cn("h-12 w-12 rounded-2xl flex items-center justify-center", bgClass, colorClass)}>
        <Icon className="h-6 w-6" />
      </div>
      <div className="space-y-1">
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</p>
        <p className="text-3xl font-black text-indigo-950 italic tracking-tighter">
          {value || "—"}
          {unit && <span className="text-[10px] not-italic text-slate-400 font-medium tracking-normal ml-1">{unit}</span>}
        </p>
      </div>
    </motion.div>
  );
}
