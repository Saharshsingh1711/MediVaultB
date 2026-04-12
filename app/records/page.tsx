'use client'

import React, { useState, useEffect, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { SB_TABLES } from "@/lib/supabase/tables";
import { getUserRole, UserRole } from "@/lib/supabase/roles";
import { cn } from "@/lib/utils";
import { Button } from "@/components/Button";
import AIBriefModal from "@/components/AIBriefModal";
import RecordUpload from "@/components/RecordUpload";
import {
  FileText,
  ExternalLink,
  Trash2,
  BrainCircuit,
  Search,
  Filter,
  User,
  Stethoscope,
  ShieldCheck,
  Calendar,
  SlidersHorizontal,
  ChevronDown,
  AlertTriangle,
  Loader2,
  FolderOpen,
  Clock,
  Activity,
} from "lucide-react";
import Link from "next/link";
import { Session } from "@supabase/supabase-js";



export default function RecordsPage() {
  const [user, setUser] = useState<any>(null);
  const [userRole, setUserRole] = useState<UserRole>("none");
  const [records, setRecords] = useState<MedicalRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [sortOrder, setSortOrder] = useState<"newest" | "oldest">("newest");
  const [showFilters, setShowFilters] = useState(false);
  const [selectedBriefRecord, setSelectedBriefRecord] = useState<any>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [auth, setAuth] = useState();

  const supabase = useMemo(() => createClient(), []);



  useEffect(() => {
    let isMounted = true;
    const abortController = new AbortController();
    async function fetchRecords(session: Session) {
      if (!isMounted) return;
      try {
        const { user } = session;
        console.log({ user }, "b")
        if (!user) {
          setLoading(false);
          return;
        }

        setUser(user);
        console.log("c")

        const role = await getUserRole(user.id);
        if (!isMounted) return;
        console.log({ role },)
        console.log("d")
        setUserRole(role);

        if (role === "doctor") {
          const res = await fetch(`/api/get-records-by-doc`, { signal: abortController.signal });
          const data = await res.json();
          if (!isMounted) return;
          setRecords(data.records || []);
        } else if (role === "patient") {
          // Patients: fetch only their own records (RLS enforces this too)
          const { data: recordsData, error: recordsError } = await supabase
            .from(SB_TABLES.medical_records)
            .select("*")
            .eq("patient_id", user.id)
            .order("created_at", { ascending: false });

          if (recordsError) {
            console.error("Error fetching records:", recordsError);
            setLoading(false);
            return;
          }
          if (!isMounted) return;
          setRecords(recordsData || []);
        }


      } catch (error) {
        console.log(error)
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    const { data: { subscription: { unsubscribe } } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        // fetch data
        fetchRecords(session);
        console.log(session)
      } else {
        if (isMounted) {
          setUser(null);
          setUserRole("none");
          setRecords([]);
          setLoading(false);
        }
      }
    });

    console.log("a")


    return () => {
      isMounted = false;
      unsubscribe();
      abortController.abort();
    }
  }, []);

  const handleDeleteRecord = async (recordId: string, fileUrl: string) => {
    if (!window.confirm("Are you sure you want to permanently delete this medical record? This action cannot be undone.")) return;

    setDeletingId(recordId);
    try {
      let fileName = "";
      if (fileUrl.includes("patient_records/")) {
        fileName = fileUrl.split("patient_records/")[1];
      } else {
        const urlParts = fileUrl.split("/");
        fileName = urlParts.slice(-2).join("/");
      }

      await supabase.storage
        .from("patient_records")
        .remove([fileName]);

      const { error: dbError } = await supabase
        .from(SB_TABLES.medical_records)
        .delete()
        .eq("id", recordId);

      if (dbError) throw dbError;

      setRecords((prev) => prev.filter((r) => r.id !== recordId));
    } catch (err: any) {
      console.error("Deletion Error:", err);
      alert(`❌ Failed to delete record: ${err.message || "Unknown error"}`);
    } finally {
      setDeletingId(null);
    }
  };

  // Derive unique record types for filter dropdown
  const recordTypes = useMemo(() => {
    const types = new Set(records.map((r) => r.record_type));
    return Array.from(types);
  }, [records]);

  // Filter & search logic
  const filteredRecords = useMemo(() => {
    let result = [...records];

    // Search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (r) =>
          r.title.toLowerCase().includes(q) ||
          r.record_type.toLowerCase().includes(q) ||
          (r.patient_name && r.patient_name.toLowerCase().includes(q)) ||
          (r.patient_email && r.patient_email.toLowerCase().includes(q))
      );
    }

    // Filter by type
    if (filterType !== "all") {
      result = result.filter((r) => r.record_type === filterType);
    }

    // Sort
    result.sort((a, b) => {
      const dateA = new Date(a.created_at).getTime();
      const dateB = new Date(b.created_at).getTime();
      return sortOrder === "newest" ? dateB - dateA : dateA - dateB;
    });

    return result;
  }, [records, searchQuery, filterType, sortOrder]);

  // Group records by patient (for doctor view)
  const groupedByPatient = useMemo(() => {
    if (userRole !== "doctor") return null;
    const groups: Record<string, { name: string; email: string; records: MedicalRecord[] }> = {};
    for (const r of filteredRecords) {
      if (!groups[r.patient_id]) {
        groups[r.patient_id] = {
          name: r.patient_name || "Unknown",
          email: r.patient_email || "",
          records: [],
        };
      }
      groups[r.patient_id].records.push(r);
    }
    return groups;
  }, [filteredRecords, userRole]);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-6">
        <div className="h-16 w-16 rounded-full border-t-4 border-indigo-600 animate-spin" />
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] animate-pulse italic">
          Loading Clinical Records...
        </p>
      </div>
    );
  }

  if (userRole === "none") {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-6">
        <div className="h-16 w-16 rounded-2xl bg-rose-50 flex items-center justify-center text-rose-500">
          <AlertTriangle className="h-8 w-8" />
        </div>
        <p className="text-sm font-bold text-slate-600">Unauthorized access. Please log in.</p>
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden pt-8 md:pt-0 pb-20 selection:bg-indigo-100 selection:text-indigo-900 min-h-screen bg-[#FBFBFF]">
      {/* Decorative Background Elements */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-100/30 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-violet-100/30 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-7xl mx-auto space-y-12 relative z-10 px-4 md:px-6">
        {/* Header */}
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-8 pb-10 border-b border-indigo-50">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center text-white shadow-premium">
                <FolderOpen className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-4xl md:text-5xl font-black text-indigo-950 tracking-tighter italic font-heading">
                  {userRole === "doctor" ? (
                    <>Patient <span className="bg-gradient-to-r from-indigo-500 to-violet-500 bg-clip-text text-transparent">Records Vault.</span></>
                  ) : (
                    <>My <span className="bg-gradient-to-r from-indigo-500 to-violet-500 bg-clip-text text-transparent">Clinical Records.</span></>
                  )}
                </h1>
              </div>
            </div>
            <div className="flex items-center gap-3 ml-1">
              <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest font-mono">
                {userRole === "doctor" ? (
                  <>
                    <Stethoscope className="h-3 w-3 inline mr-1" />
                    Doctor Access — <span className="text-indigo-600">{filteredRecords.length} Records Across {groupedByPatient ? Object.keys(groupedByPatient).length : 0} Patients</span>
                  </>
                ) : (
                  <>
                    <User className="h-3 w-3 inline mr-1" />
                    Session: <span className="text-indigo-600">ID-{user?.id.slice(0, 8).toUpperCase()}</span> — {filteredRecords.length} Records Indexed
                  </>
                )}
              </p>
            </div>
          </div>

          {/* Upload button for patients */}
          {userRole === "patient" && (
            <div className="w-full md:w-[350px]">
              <RecordUpload onUploadComplete={() => window.location.reload()} />
            </div>
          )}
        </header>

        {/* Search & Filter Bar */}
        <div className="space-y-4">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="relative flex-1 group">
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300 group-focus-within:text-indigo-500 transition-colors" />
              <input
                type="text"
                placeholder={userRole === "doctor" ? "Search by title, type, or patient name..." : "Search your records..."}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-5 py-4 rounded-2xl bg-white border border-indigo-100 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:bg-white focus:border-indigo-200 transition-all font-bold text-sm text-indigo-950 shadow-soft"
              />
            </div>

            {/* Filter Toggle */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={cn(
                "flex items-center gap-2 px-6 py-4 rounded-2xl border font-bold text-xs uppercase tracking-widest transition-all shadow-soft",
                showFilters
                  ? "bg-indigo-600 text-white border-indigo-600"
                  : "bg-white text-slate-500 border-indigo-100 hover:text-indigo-600 hover:border-indigo-200"
              )}
            >
              <SlidersHorizontal className="h-4 w-4" />
              Filters
              <ChevronDown className={cn("h-4 w-4 transition-transform", showFilters && "rotate-180")} />
            </button>
          </div>

          {/* Filter Panel */}
          {showFilters && (
            <div className="flex flex-wrap gap-4 p-6 rounded-2xl bg-white border border-indigo-50 shadow-soft animate-in slide-in-from-top-2 duration-300">
              {/* Type Filter */}
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                  Record Type
                </label>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setFilterType("all")}
                    className={cn(
                      "px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all",
                      filterType === "all"
                        ? "bg-indigo-600 text-white border-indigo-600"
                        : "bg-white text-slate-500 border-slate-200 hover:border-indigo-200 hover:text-indigo-600"
                    )}
                  >
                    All
                  </button>
                  {recordTypes.map((type) => (
                    <button
                      key={type}
                      onClick={() => setFilterType(type)}
                      className={cn(
                        "px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all",
                        filterType === type
                          ? "bg-indigo-600 text-white border-indigo-600"
                          : "bg-white text-slate-500 border-slate-200 hover:border-indigo-200 hover:text-indigo-600"
                      )}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              {/* Sort */}
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                  Sort By
                </label>
                <div className="flex gap-2">
                  <button
                    onClick={() => setSortOrder("newest")}
                    className={cn(
                      "px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all",
                      sortOrder === "newest"
                        ? "bg-indigo-600 text-white border-indigo-600"
                        : "bg-white text-slate-500 border-slate-200 hover:border-indigo-200 hover:text-indigo-600"
                    )}
                  >
                    Newest First
                  </button>
                  <button
                    onClick={() => setSortOrder("oldest")}
                    className={cn(
                      "px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all",
                      sortOrder === "oldest"
                        ? "bg-indigo-600 text-white border-indigo-600"
                        : "bg-white text-slate-500 border-slate-200 hover:border-indigo-200 hover:text-indigo-600"
                    )}
                  >
                    Oldest First
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Records Display */}
        {filteredRecords.length === 0 ? (
          <div className="py-32 text-center border border-indigo-100 border-dashed rounded-[3rem] bg-white">
            <FolderOpen className="h-16 w-16 text-slate-200 mx-auto mb-6" />
            <p className="text-sm font-bold text-slate-500 mb-2">
              {searchQuery || filterType !== "all" ? "No records match your filters." : "No clinical records found."}
            </p>
            <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">
              {userRole === "patient" ? "Upload your first medical document to get started." : "No records have been shared with you yet. Ask patients to share records via token links."}
            </p>
          </div>
        ) : userRole === "doctor" && groupedByPatient ? (
          /* Doctor View: Grouped by patient */
          <div className="space-y-16">
            {Object.entries(groupedByPatient).map(([patientId, group]) => (
              <div key={patientId} className="space-y-6">
                {/* Patient Header */}
                <div className="flex items-center gap-4 px-2">
                  <div className="h-12 w-12 rounded-full bg-indigo-600 flex items-center justify-center text-white text-sm font-bold shadow-premium ring-4 ring-white">
                    {group.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-2xl font-black text-indigo-950 tracking-tight italic font-heading">
                      {group.name}
                    </h3>
                    <div className="flex items-center gap-3">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest font-mono">
                        {group.email}
                      </p>
                      <span className="text-[9px] font-black text-indigo-600 uppercase tracking-widest bg-indigo-50 px-2.5 py-1 rounded-lg border border-indigo-100">
                        {group.records.length} {group.records.length === 1 ? "Record" : "Records"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Patient Records Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {group.records.map((record) => (
                    <RecordCard
                      key={record.id}
                      record={record}
                      userRole={userRole}
                      onBrief={() => setSelectedBriefRecord(record)}
                      onDelete={() => handleDeleteRecord(record.id, record.file_url)}
                      isDeleting={deletingId === record.id}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* Patient View: Flat grid */
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {filteredRecords.map((record) => (
              <RecordCard
                key={record.id}
                record={record}
                userRole={userRole}
                onBrief={() => setSelectedBriefRecord(record)}
                onDelete={() => handleDeleteRecord(record.id, record.file_url)}
                isDeleting={deletingId === record.id}
              />
            ))}
          </div>
        )}

        {/* Footer */}
        <footer className="pt-16 border-t border-indigo-50 flex flex-col md:flex-row justify-between items-end gap-8">
          <div className="flex items-center gap-3">
            <ShieldCheck className="h-4 w-4 text-emerald-500" />
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
              End-to-End Clinical Encryption Active
            </span>
          </div>
          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest text-right font-mono italic">
            MediVault Records Terminal v1.2 — Sovereign data protection
          </p>
        </footer>
      </div>

      {/* AI Brief Modal */}
      <AIBriefModal
        isOpen={!!selectedBriefRecord}
        onClose={() => setSelectedBriefRecord(null)}
        recordTitle={selectedBriefRecord?.title || ""}
        rawText={selectedBriefRecord?.raw_text_content || ""}
        fileUrl={selectedBriefRecord?.file_url || ""}
        aiSummary={selectedBriefRecord?.ai_summary || null}
      />
    </div>
  );
}

/* ─── Record Card Component ─── */
function RecordCard({
  record,
  userRole,
  onBrief,
  onDelete,
  isDeleting,
}: {
  record: MedicalRecord;
  userRole: UserRole;
  onBrief: () => void;
  onDelete: () => void;
  isDeleting: boolean;
}) {
  const aiData = record.ai_summary
    ? (() => {
      try { return JSON.parse(record.ai_summary); } catch { return null; }
    })()
    : null;

  return (
    <div className="group hover:border-indigo-200 border border-indigo-100 rounded-[2.5rem] shadow-soft hover:shadow-premium transition-all duration-500 bg-white p-8 flex flex-col gap-5 relative overflow-hidden">
      {/* Hover Decoration */}
      <div className="absolute top-0 right-0 w-40 h-40 bg-indigo-50/50 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />

      {/* Top Row: Icon + Date + Type Badge */}
      <div className="flex items-center justify-between relative z-10">
        <div className="h-14 w-14 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 font-black text-xl shadow-sm group-hover:bg-indigo-600 group-hover:text-white group-hover:scale-110 transition-all duration-500">
          <FileText className="h-7 w-7" />
        </div>
        <div className="flex items-center gap-3">
          <span
            className={cn(
              "px-3 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest border font-mono transition-all",
              record.ai_summary
                ? "bg-violet-50 text-violet-600 border-violet-100"
                : record.raw_text_content
                  ? "bg-emerald-50 text-emerald-600 border-emerald-100"
                  : "bg-indigo-50 text-indigo-600 border-indigo-100"
            )}
          >
            {record.ai_summary ? "AI Analyzed" : record.raw_text_content ? "Deciphered" : "Unprocessed"}
          </span>
          {record.is_emergency_flag && (
            <span className="px-3 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest border bg-rose-50 text-rose-600 border-rose-100 flex items-center gap-1">
              <AlertTriangle className="h-3 w-3" />
              Emergency
            </span>
          )}
        </div>
      </div>

      {/* Title */}
      <h4 className="text-2xl font-black text-indigo-950 uppercase tracking-tighter italic leading-none relative z-10">
        {record.title}
      </h4>

      {/* Meta Info */}
      <div className="flex items-center gap-4 flex-wrap">
        <span className="text-[10px] text-slate-400 font-mono font-black uppercase tracking-widest flex items-center gap-1.5">
          <Calendar className="h-3 w-3" />
          {new Date(record.created_at).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
          })}
        </span>
        <span className="text-[10px] text-slate-400 font-mono font-black uppercase tracking-widest flex items-center gap-1.5">
          <Clock className="h-3 w-3" />
          {new Date(record.created_at).toLocaleTimeString("en-US", {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </span>
        <span className="text-[10px] text-indigo-500 font-black uppercase tracking-widest">
          {record.record_type}
        </span>
      </div>

      {/* AI Summary Preview */}
      {aiData && aiData.shortBrief && (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-indigo-50/50 to-violet-50/50 border border-indigo-50 relative z-10">
          <p className="text-xs text-slate-500 font-medium leading-relaxed line-clamp-2">
            <span className="text-[9px] font-black text-violet-500 uppercase tracking-wider mr-2">
              AI:
            </span>
            {aiData.shortBrief}
          </p>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3 mt-auto pt-2 relative z-10">
        <Button
          className="flex-1 text-[10px] font-bold uppercase tracking-widest h-12 rounded-2xl bg-indigo-600 hover:bg-indigo-700 shadow-md"
          onClick={onBrief}
        >
          <BrainCircuit className="h-4 w-4 mr-2" />
          AI Brief
        </Button>
        <a href={record.file_url} target="_blank" rel="noreferrer" className="flex-none">
          <Button
            variant="outline"
            className="px-5 h-12 rounded-2xl border-indigo-100 text-indigo-600 hover:bg-indigo-50 transition-all shadow-sm"
          >
            <ExternalLink className="h-4 w-4" />
          </Button>
        </a>
        {userRole === "patient" && (
          <Button
            variant="outline"
            className="px-5 h-12 rounded-2xl border-rose-100 text-rose-500 hover:bg-rose-50 hover:text-rose-600 transition-all shadow-sm"
            onClick={onDelete}
            disabled={isDeleting}
          >
            {isDeleting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Trash2 className="h-4 w-4" />
            )}
          </Button>
        )}
      </div>
    </div>
  );
}