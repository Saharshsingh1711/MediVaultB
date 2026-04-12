'use client'

import React, { useState, useEffect, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { SB_TABLES } from "@/lib/supabase/tables";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import {
  Search,
  FileText,
  Download,
  ExternalLink,
  Activity,
  Shield,
  Users,
  ChevronDown,
  BrainCircuit,
  Image,
  File,
  Filter,
  Loader2,
  FolderOpen,
  User,
  Droplets,
  Link2,
  CheckCircle2,
  X,
  Eye,
} from "lucide-react";

// ─── Animation Variants ────────────────────────────────
const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.08 } },
};

const itemFadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

// ─── Filter Categories ─────────────────────────────────
const CATEGORIES = [
  { id: "all", label: "All Records", icon: FolderOpen },
  { id: "pdf", label: "PDF Documents", icon: FileText },
  { id: "image", label: "Image Scans", icon: Image },
  { id: "ai", label: "AI Analyzed", icon: BrainCircuit },
  { id: "other", label: "Other Files", icon: File },
] as const;

type CategoryId = (typeof CATEGORIES)[number]["id"];

// ─── Helpers ────────────────────────────────────────────
function matchesCategory(record: any, category: CategoryId): boolean {
  if (category === "all") return true;
  if (category === "ai") return !!record.ai_summary;
  const type = (record.record_type || "").toLowerCase();
  if (category === "pdf") return type.includes("pdf");
  if (category === "image") return type.includes("image") || type.includes("scan") || type.includes("x-ray") || type.includes("mri");
  // "other" — anything that isn't pdf or image
  return !type.includes("pdf") && !type.includes("image") && !type.includes("scan") && !type.includes("x-ray") && !type.includes("mri");
}

function parseAiSummary(raw: string | null) {
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

// ═══════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════
export default function DoctorDocuments() {
  const supabase = createClient();

  // ─── State ──────────────────────────────────────────
  const [doctor, setDoctor] = useState<any>(null);
  const [linkedPatients, setLinkedPatients] = useState<any[]>([]);
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [records, setRecords] = useState<any[]>([]);
  const [loadingPatients, setLoadingPatients] = useState(true);
  const [loadingRecords, setLoadingRecords] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<CategoryId>("all");
  const [showPatientPicker, setShowPatientPicker] = useState(false);
  const [patientSearch, setPatientSearch] = useState("");

  // ─── Init: Get doctor + linked patients ─────────────
  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setDoctor(user);

      // Fetch unique patients this doctor has accessed via shared links
      const { data: accessData } = await supabase
        .from(SB_TABLES.access_logs)
        .select("patient_id, created_at, metadata")
        .eq("doctor_id", user.id)
        .eq("action", "SHARED_LINK_ACCESS")
        .order("created_at", { ascending: false });

      if (!accessData || accessData.length === 0) {
        setLinkedPatients([]);
        setLoadingPatients(false);
        return;
      }

      // Deduplicate by patient_id
      const seen = new Set<string>();
      const unique = accessData.filter((entry) => {
        if (seen.has(entry.patient_id)) return false;
        seen.add(entry.patient_id);
        return true;
      });

      // Fetch profiles
      const patientIds = unique.map((u) => u.patient_id);
      const { data: profiles } = await supabase
        .from(SB_TABLES.user_patient)
        .select("*")
        .in("user_id", patientIds);

      const enriched = unique.map((entry) => ({
        ...entry,
        profile: profiles?.find((p) => p.user_id === entry.patient_id) || null,
      }));

      setLinkedPatients(enriched);
      setLoadingPatients(false);
    }
    init();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ─── Fetch records when patient changes ─────────────
  useEffect(() => {
    if (!selectedPatientId || !doctor) return;

    async function fetchRecords() {
      setLoadingRecords(true);
      setRecords([]);

      const { data, error } = await supabase
        .from(SB_TABLES.medical_records)
        .select("*")
        .eq("patient_id", selectedPatientId)
        .order("created_at", { ascending: false });

      if (!error && data) {
        setRecords(data);
      }

      // Log the document library access
      await supabase.from(SB_TABLES.access_logs).insert({
        patient_id: selectedPatientId,
        doctor_id: doctor.id,
        doctor_name: "Doctor",
        action: "DOCUMENT_LIBRARY_ACCESS",
        metadata: {
          records_count: data?.length || 0,
          timestamp: new Date().toISOString(),
        },
      });

      setLoadingRecords(false);
    }
    fetchRecords();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedPatientId]);

  // ─── Derived: filtered records ──────────────────────
  const filteredRecords = useMemo(() => {
    let result = records;

    // Category filter
    result = result.filter((r) => matchesCategory(r, activeCategory));

    // Text search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter((r) => {
        const title = (r.title || "").toLowerCase();
        const type = (r.record_type || "").toLowerCase();
        const ai = parseAiSummary(r.ai_summary);
        const brief = (ai?.shortBrief || "").toLowerCase();
        return title.includes(q) || type.includes(q) || brief.includes(q);
      });
    }

    return result;
  }, [records, activeCategory, searchQuery]);

  // ─── Derived: selected patient profile ──────────────
  const selectedPatient = linkedPatients.find((lp) => lp.patient_id === selectedPatientId);

  // ─── Derived: filtered patient list for picker ──────
  const filteredPatients = useMemo(() => {
    if (!patientSearch.trim()) return linkedPatients;
    const q = patientSearch.toLowerCase();
    return linkedPatients.filter((lp) => {
      const name = `${lp.profile?.first_name || ""} ${lp.profile?.second_name || ""}`.toLowerCase();
      const pid = (lp.profile?.patient_id || "").toLowerCase();
      return name.includes(q) || pid.includes(q);
    });
  }, [linkedPatients, patientSearch]);

  // ─── Category counts ───────────────────────────────
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const cat of CATEGORIES) {
      counts[cat.id] = records.filter((r) => matchesCategory(r, cat.id)).length;
    }
    return counts;
  }, [records]);

  // ═══════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════
  return (
    <div className="min-h-screen bg-[#FBFBFF] px-4 md:px-6 py-12 relative overflow-hidden selection:bg-indigo-100 selection:text-indigo-900">
      {/* Decorative Background */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-indigo-100/30 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-40 left-0 w-[500px] h-[500px] bg-violet-100/30 rounded-full blur-[120px] pointer-events-none" />

      <motion.div
        initial="hidden"
        animate="visible"
        variants={fadeIn}
        className="max-w-7xl mx-auto space-y-12 relative z-10"
      >
        {/* ─── Header ──────────────────────────────────── */}
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-8 pb-10 border-b border-indigo-50">
          <div className="space-y-3">
            <div className="flex items-center gap-4">
              <div className="h-10 w-10 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-md">
                <FolderOpen className="h-6 w-6" />
              </div>
              <h1 className="text-4xl md:text-5xl font-black text-indigo-950 tracking-tighter italic font-heading">
                Document{" "}
                <span className="bg-gradient-to-r from-indigo-500 to-violet-500 bg-clip-text text-transparent">
                  Library.
                </span>
              </h1>
            </div>
            <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px] italic ml-14">
              Browse & search patient medical records
            </p>
          </div>

          {/* Search Bar */}
          <div className="relative group w-full md:w-96">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300 group-focus-within:text-indigo-600 transition-colors" />
            <input
              id="doc-search"
              className="pl-12 pr-6 py-4 bg-white border border-indigo-50 rounded-2xl text-sm font-bold shadow-sm focus:outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/10 transition-all text-indigo-950 w-full placeholder:text-slate-300"
              placeholder="Search records by title, type, AI brief..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-4 top-1/2 -translate-y-1/2 h-6 w-6 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-all"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>
        </header>

        {/* ─── Patient Selector ────────────────────────── */}
        <motion.div variants={itemFadeIn} className="space-y-4">
          <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2 italic">
            Select Patient Vault
          </h3>

          {loadingPatients ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 text-indigo-400 animate-spin" />
              <span className="ml-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                Loading linked patients...
              </span>
            </div>
          ) : linkedPatients.length === 0 ? (
            <div className="py-20 text-center border-2 border-dotted border-indigo-100 rounded-[3rem] bg-indigo-50/20">
              <Link2 className="h-16 w-16 text-slate-200 mx-auto mb-6" />
              <p className="text-slate-400 font-black uppercase tracking-widest text-[10px] italic">
                No patients have shared access with you yet
              </p>
              <p className="text-[9px] text-slate-300 font-bold uppercase tracking-widest mt-2">
                Patients can share invite links from their dashboard
              </p>
            </div>
          ) : (
            <div className="relative">
              {/* Selected Patient / Trigger */}
              <button
                id="patient-selector"
                onClick={() => setShowPatientPicker(!showPatientPicker)}
                className={cn(
                  "w-full flex items-center justify-between p-6 rounded-[2rem] border transition-all duration-300 shadow-sm bg-white group",
                  showPatientPicker
                    ? "border-indigo-400 ring-4 ring-indigo-500/10"
                    : "border-indigo-100 hover:border-indigo-200 hover:shadow-md"
                )}
              >
                {selectedPatient ? (
                  <div className="flex items-center gap-5">
                    <div className="h-14 w-14 rounded-[1.25rem] bg-indigo-600 flex items-center justify-center text-white text-xl font-black italic shadow-lg shrink-0">
                      {selectedPatient.profile?.first_name?.[0]}
                      {selectedPatient.profile?.second_name?.[0]}
                    </div>
                    <div className="text-left space-y-1">
                      <h3 className="text-xl font-black text-indigo-950 italic tracking-tighter">
                        {selectedPatient.profile?.first_name}{" "}
                        {selectedPatient.profile?.second_name}
                      </h3>
                      <div className="flex items-center gap-4 flex-wrap">
                        {selectedPatient.profile?.blood_group && (
                          <span className="flex items-center gap-1.5 text-[9px] font-black text-rose-600 uppercase tracking-widest">
                            <Droplets className="h-3 w-3" />{" "}
                            {selectedPatient.profile.blood_group}
                          </span>
                        )}
                        <span className="flex items-center gap-1.5 text-[9px] font-black text-indigo-500 uppercase tracking-widest">
                          <FileText className="h-3 w-3" />{" "}
                          {records.length} records
                        </span>
                        {selectedPatient.profile?.patient_id && (
                          <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest font-mono">
                            PID: {selectedPatient.profile.patient_id}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-4">
                    <div className="h-14 w-14 rounded-[1.25rem] bg-indigo-50 flex items-center justify-center text-indigo-300 shrink-0">
                      <User className="h-7 w-7" />
                    </div>
                    <div className="text-left space-y-1">
                      <h3 className="text-lg font-bold text-slate-400 italic tracking-tight">
                        Select a patient to browse records
                      </h3>
                      <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest">
                        {linkedPatients.length} patients linked
                      </p>
                    </div>
                  </div>
                )}
                <div
                  className={cn(
                    "h-10 w-10 rounded-full flex items-center justify-center transition-all border border-indigo-100 shrink-0",
                    showPatientPicker
                      ? "bg-indigo-600 text-white rotate-180"
                      : "bg-slate-50 text-slate-400 group-hover:bg-indigo-50 group-hover:text-indigo-600"
                  )}
                >
                  <ChevronDown className="h-5 w-5" />
                </div>
              </button>

              {/* Patient Dropdown */}
              {showPatientPicker && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className="absolute z-30 top-full left-0 right-0 mt-3 bg-white border border-indigo-100 rounded-[2rem] shadow-xl overflow-hidden"
                >
                  {/* Search within dropdown */}
                  <div className="p-4 border-b border-indigo-50">
                    <div className="relative group">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300" />
                      <input
                        id="patient-search"
                        className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-indigo-50 rounded-xl text-sm font-bold focus:outline-none focus:border-indigo-300 text-indigo-950 placeholder:text-slate-300"
                        placeholder="Search patients..."
                        value={patientSearch}
                        onChange={(e) => setPatientSearch(e.target.value)}
                        autoFocus
                      />
                    </div>
                  </div>

                  {/* Patient Options */}
                  <div className="max-h-80 overflow-y-auto py-2">
                    {filteredPatients.length > 0 ? (
                      filteredPatients.map((entry) => {
                        const p = entry.profile;
                        const isSelected = entry.patient_id === selectedPatientId;
                        return (
                          <button
                            key={entry.patient_id}
                            onClick={() => {
                              setSelectedPatientId(entry.patient_id);
                              setShowPatientPicker(false);
                              setPatientSearch("");
                              setActiveCategory("all");
                              setSearchQuery("");
                            }}
                            className={cn(
                              "w-full flex items-center gap-4 px-6 py-4 transition-all text-left",
                              isSelected
                                ? "bg-indigo-50"
                                : "hover:bg-slate-50"
                            )}
                          >
                            <div
                              className={cn(
                                "h-11 w-11 rounded-xl flex items-center justify-center text-base font-black italic shrink-0 shadow-sm",
                                isSelected
                                  ? "bg-indigo-600 text-white"
                                  : "bg-indigo-50 text-indigo-600"
                              )}
                            >
                              {p?.first_name?.[0]}
                              {p?.second_name?.[0]}
                            </div>
                            <div className="flex-1 min-w-0 space-y-0.5">
                              <h4 className="text-sm font-bold text-indigo-950 tracking-tight truncate">
                                {p?.first_name || "Unknown"}{" "}
                                {p?.second_name || "Patient"}
                              </h4>
                              <div className="flex items-center gap-3 flex-wrap">
                                {p?.blood_group && (
                                  <span className="text-[8px] font-black text-rose-500 uppercase tracking-widest">
                                    {p.blood_group}
                                  </span>
                                )}
                                {p?.gender && (
                                  <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">
                                    {p.gender}
                                  </span>
                                )}
                                <span className="text-[8px] font-black text-indigo-400 uppercase tracking-widest">
                                  Linked{" "}
                                  {new Date(
                                    entry.created_at
                                  ).toLocaleDateString()}
                                </span>
                              </div>
                            </div>
                            {isSelected && (
                              <CheckCircle2 className="h-5 w-5 text-indigo-600 shrink-0" />
                            )}
                          </button>
                        );
                      })
                    ) : (
                      <div className="py-8 text-center">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                          No patients match your search
                        </p>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </div>
          )}
        </motion.div>

        {/* ─── Content: Category Sidebar + Document Grid ─ */}
        {selectedPatientId && (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-12">
            {/* Category Sidebar */}
            <motion.div
              variants={staggerContainer}
              initial="hidden"
              animate="visible"
              className="space-y-10 hidden lg:block"
            >
              <div className="space-y-6">
                <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 italic ml-2">
                  Classification
                </h4>
                <div className="space-y-2">
                  {CATEGORIES.map((cat) => {
                    const Icon = cat.icon;
                    const isActive = activeCategory === cat.id;
                    const count = categoryCounts[cat.id] || 0;
                    return (
                      <motion.button
                        variants={itemFadeIn}
                        key={cat.id}
                        onClick={() => setActiveCategory(cat.id)}
                        className={cn(
                          "w-full flex items-center justify-between gap-3 px-5 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer border",
                          isActive
                            ? "bg-indigo-600 text-white border-transparent shadow-lg"
                            : "bg-white text-slate-500 border-indigo-50 hover:border-indigo-200 hover:text-indigo-600 shadow-sm"
                        )}
                      >
                        <div className="flex items-center gap-3">
                          <Icon className="h-4 w-4" />
                          <span>{cat.label}</span>
                        </div>
                        <span
                          className={cn(
                            "px-2.5 py-0.5 rounded-lg text-[9px] font-black tabular-nums",
                            isActive
                              ? "bg-white/20 text-white"
                              : "bg-indigo-50 text-indigo-600"
                          )}
                        >
                          {count}
                        </span>
                      </motion.button>
                    );
                  })}
                </div>
              </div>

              {/* Selected Patient Quick Info */}
              {selectedPatient?.profile && (
                <motion.div
                  variants={itemFadeIn}
                  className="p-6 rounded-[2rem] bg-indigo-50/50 border border-indigo-100/50 space-y-4"
                >
                  <h4 className="text-[9px] font-black text-indigo-600 uppercase tracking-widest flex items-center gap-2">
                    <Shield className="h-3.5 w-3.5" /> Patient Info
                  </h4>
                  <div className="space-y-3">
                    {selectedPatient.profile.gender && (
                      <div className="flex items-center justify-between">
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                          Gender
                        </span>
                        <span className="text-xs font-bold text-indigo-950">
                          {selectedPatient.profile.gender}
                        </span>
                      </div>
                    )}
                    {selectedPatient.profile.blood_group && (
                      <div className="flex items-center justify-between">
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                          Blood
                        </span>
                        <span className="text-xs font-bold text-rose-600">
                          {selectedPatient.profile.blood_group}
                        </span>
                      </div>
                    )}
                    {selectedPatient.profile.active_allergies?.length > 0 && (
                      <div className="pt-2 border-t border-indigo-100/50">
                        <span className="text-[8px] font-black text-rose-500 uppercase tracking-widest">
                          Allergies
                        </span>
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {selectedPatient.profile.active_allergies.map(
                            (a: string, i: number) => (
                              <span
                                key={i}
                                className="px-2.5 py-1 rounded-lg bg-white border border-rose-100 text-rose-600 text-[8px] font-black uppercase tracking-widest shadow-sm"
                              >
                                {a}
                              </span>
                            )
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </motion.div>

            {/* Mobile Category Pills */}
            <div className="lg:hidden flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
              {CATEGORIES.map((cat) => {
                const Icon = cat.icon;
                const isActive = activeCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    onClick={() => setActiveCategory(cat.id)}
                    className={cn(
                      "flex items-center gap-2 px-4 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest whitespace-nowrap border transition-all shrink-0",
                      isActive
                        ? "bg-indigo-600 text-white border-transparent shadow-md"
                        : "bg-white text-slate-500 border-indigo-50"
                    )}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    {cat.label}
                    <span
                      className={cn(
                        "px-1.5 py-0.5 rounded-md text-[8px]",
                        isActive
                          ? "bg-white/20"
                          : "bg-indigo-50 text-indigo-600"
                      )}
                    >
                      {categoryCounts[cat.id] || 0}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Documents Grid */}
            <div className="lg:col-span-3 space-y-8">
              {/* Results Header */}
              <div className="flex items-center justify-between px-2">
                <h2 className="text-3xl font-black text-indigo-950 italic tracking-tighter font-heading">
                  Records.
                </h2>
                <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest italic font-mono">
                  {filteredRecords.length} of {records.length} indexed
                </span>
              </div>

              {loadingRecords ? (
                <div className="py-24 flex flex-col items-center justify-center gap-6">
                  <div className="relative mx-auto w-20 h-20">
                    <div className="absolute inset-0 rounded-full border-4 border-indigo-100" />
                    <div className="absolute inset-0 rounded-full border-4 border-t-indigo-600 animate-spin" />
                    <div
                      className="absolute inset-3 rounded-full border-4 border-t-violet-500 border-transparent animate-spin"
                      style={{
                        animationDirection: "reverse",
                        animationDuration: "1.5s",
                      }}
                    />
                  </div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    Fetching patient vault...
                  </p>
                </div>
              ) : filteredRecords.length > 0 ? (
                <motion.div
                  variants={staggerContainer}
                  initial="hidden"
                  animate="visible"
                  className="grid grid-cols-1 md:grid-cols-2 gap-6"
                >
                  {filteredRecords.map((record) => {
                    const aiData = parseAiSummary(record.ai_summary);
                    const type = (record.record_type || "").toLowerCase();
                    const isPdf = type.includes("pdf");
                    const isImage =
                      type.includes("image") ||
                      type.includes("scan") ||
                      type.includes("x-ray") ||
                      type.includes("mri");

                    return (
                      <motion.div
                        variants={itemFadeIn}
                        key={record.id}
                        className="group hover:border-indigo-200 border border-indigo-50 shadow-sm rounded-[2.5rem] bg-white p-7 transition-all duration-300 flex flex-col gap-6 hover:shadow-lg"
                      >
                        {/* Top Row: Icon + Actions */}
                        <div className="flex items-center justify-between">
                          <div
                            className={cn(
                              "h-14 w-14 rounded-[1.25rem] flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform",
                              isPdf
                                ? "bg-rose-50 text-rose-500"
                                : isImage
                                ? "bg-violet-50 text-violet-500"
                                : "bg-indigo-50 text-indigo-600"
                            )}
                          >
                            {isPdf ? (
                              <FileText className="h-7 w-7" />
                            ) : isImage ? (
                              <Image className="h-7 w-7" />
                            ) : (
                              <File className="h-7 w-7" />
                            )}
                          </div>
                          <div className="flex gap-2">
                            {record.file_url && (
                              <>
                                <a
                                  href={record.file_url}
                                  target="_blank"
                                  rel="noreferrer"
                                >
                                  <Button
                                    variant="outline"
                                    size="icon"
                                    className="h-11 w-11 rounded-xl border-indigo-50 hover:bg-indigo-600 hover:text-white hover:border-transparent transition-all shadow-sm"
                                  >
                                    <Eye className="h-5 w-5" />
                                  </Button>
                                </a>
                                <a
                                  href={record.file_url}
                                  download
                                >
                                  <Button
                                    variant="outline"
                                    size="icon"
                                    className="h-11 w-11 rounded-xl border-indigo-50 hover:bg-indigo-600 hover:text-white hover:border-transparent transition-all shadow-sm"
                                  >
                                    <Download className="h-5 w-5" />
                                  </Button>
                                </a>
                              </>
                            )}
                          </div>
                        </div>

                        {/* Title & Meta */}
                        <div className="space-y-2 flex-1">
                          <h3 className="text-lg font-black uppercase text-indigo-950 tracking-tighter italic leading-tight line-clamp-2">
                            {record.title}
                          </h3>
                          <div className="flex items-center gap-3 flex-wrap">
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest font-mono">
                              {new Date(
                                record.created_at
                              ).toLocaleDateString("en-IN", {
                                day: "2-digit",
                                month: "short",
                                year: "numeric",
                              })}
                            </span>
                            <span className="h-1 w-1 rounded-full bg-slate-200" />
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest font-mono">
                              {record.record_type}
                            </span>
                          </div>
                        </div>

                        {/* AI Summary Snippet */}
                        {aiData?.shortBrief && (
                          <div className="p-4 rounded-2xl bg-gradient-to-r from-indigo-50/50 to-violet-50/50 border border-indigo-50">
                            <p className="text-xs text-slate-500 font-medium leading-relaxed line-clamp-3">
                              <span className="text-[9px] font-black text-violet-500 uppercase tracking-wider mr-2">
                                AI BRIEF:
                              </span>
                              {aiData.shortBrief}
                            </p>
                          </div>
                        )}

                        {/* Footer: Tags */}
                        <div className="flex items-center justify-between pt-4 border-t border-indigo-50">
                          <div className="flex gap-2 flex-wrap">
                            <span
                              className={cn(
                                "px-3 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest border font-mono",
                                record.ai_summary
                                  ? "bg-violet-50 text-violet-600 border-violet-100"
                                  : "bg-slate-50 text-slate-400 border-slate-100"
                              )}
                            >
                              {record.ai_summary ? "AI Analyzed" : "Indexed"}
                            </span>
                            {record.is_emergency_flag && (
                              <span className="px-3 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest bg-rose-50 text-rose-600 border border-rose-100 animate-pulse">
                                Emergency
                              </span>
                            )}
                          </div>
                          {!record.file_url && (
                            <span className="text-[8px] font-black text-slate-300 uppercase tracking-widest italic">
                              No file attached
                            </span>
                          )}
                        </div>
                      </motion.div>
                    );
                  })}
                </motion.div>
              ) : records.length > 0 ? (
                /* Has records but none match filters */
                <div className="py-20 text-center border border-indigo-100 border-dotted rounded-[3rem] bg-white">
                  <Search className="h-12 w-12 text-slate-200 mx-auto mb-6" />
                  <p className="text-slate-400 font-black uppercase tracking-widest text-[10px] italic">
                    No records match your current filters
                  </p>
                  <button
                    onClick={() => {
                      setSearchQuery("");
                      setActiveCategory("all");
                    }}
                    className="mt-4 text-[10px] font-black text-indigo-600 uppercase tracking-widest hover:underline"
                  >
                    Clear Filters
                  </button>
                </div>
              ) : (
                /* Patient has no records at all */
                <div className="py-24 text-center border-2 border-dotted border-indigo-100 rounded-[3rem] bg-indigo-50/20">
                  <FileText className="h-16 w-16 text-slate-200 mx-auto mb-6" />
                  <p className="text-slate-400 font-black uppercase tracking-widest text-[10px] italic">
                    No medical records on file for this patient
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ─── Empty State: No patient selected ────────── */}
        {!selectedPatientId && !loadingPatients && linkedPatients.length > 0 && (
          <motion.div
            variants={itemFadeIn}
            initial="hidden"
            animate="visible"
            className="py-20 text-center border border-indigo-100 border-dotted bg-white rounded-[3rem] shadow-sm"
          >
            <FolderOpen className="h-16 w-16 text-slate-200 mx-auto mb-6" />
            <p className="text-slate-500 font-black uppercase tracking-widest text-[10px] px-8 italic leading-relaxed">
              Select a patient above to browse their document library
            </p>
          </motion.div>
        )}

        {/* ─── Footer ──────────────────────────────────── */}
        <footer className="pt-16 border-t border-indigo-100 flex flex-col md:flex-row justify-between items-end gap-10 opacity-60 hover:opacity-100 transition-all">
          <div className="space-y-3">
            <h3 className="text-3xl font-black text-indigo-950 italic tracking-tighter font-heading">
              Byteus.
            </h3>
            <div className="flex items-center gap-4 font-mono">
              <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest bg-white shadow-sm px-3 py-1 rounded-full border border-slate-100">
                DOCUMENT VAULT — ENCRYPTED TRANSIT
              </span>
              <div className="h-px w-8 bg-slate-200" />
            </div>
          </div>
          <p className="max-w-md text-[9px] font-bold text-slate-400 uppercase tracking-widest text-right leading-relaxed font-mono italic">
            All document access is logged and audited. Read-only clinical view
            authorized via secure invite tokens.
          </p>
        </footer>
      </motion.div>

      {/* ─── Click-away overlay for patient picker ───── */}
      {showPatientPicker && (
        <div
          className="fixed inset-0 z-20"
          onClick={() => {
            setShowPatientPicker(false);
            setPatientSearch("");
          }}
        />
      )}
    </div>
  );
}
