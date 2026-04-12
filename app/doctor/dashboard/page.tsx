'use client'

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Users, Calendar, FileText, Activity, Shield, ArrowRight, Search, Plus, Zap, AlertTriangle, X, Link2, Heart, Thermometer, Pill, Droplets, ChevronDown, ExternalLink, BrainCircuit } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { SB_TABLES } from "@/lib/supabase/tables";
import { scanCriticalInsights, EMERGENCY_KEYWORDS } from "@/lib/utils/kmp";
import EmergencySnapshot from "@/components/EmergencySnapshot";
import ClinicalInsightsModal from "@/components/ClinicalInsightsModal";
import PrescriptionModal from "@/components/PrescriptionModal";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

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

export default function DoctorDashboard() {
  const [doctor, setDoctor] = useState<any>(null);
  const [patientsInQueue, setPatientsInQueue] = useState<any[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<any>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [insights, setInsights] = useState<string[]>([]);
  const [showInsights, setShowInsights] = useState(false);
  const [showPrescription, setShowPrescription] = useState(false);
  const [recentDocs, setRecentDocs] = useState<any[]>([]);
  const [activeView, setActiveView] = useState<'triage' | 'patients'>('triage');
  const [linkedPatients, setLinkedPatients] = useState<any[]>([]);
  const [expandedPatientId, setExpandedPatientId] = useState<string | null>(null);
  const [patientDetails, setPatientDetails] = useState<Record<string, any>>({});
  
  const supabase = createClient();

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setDoctor(user);

      // Fetch Recent Records (for analysis list)
      const { data: records } = await supabase
        .from(SB_TABLES.medical_records)
        .select(`
          id, 
          title, 
          created_at, 
          patient_id,
          user_patient(first_name, second_name)
        `)
        .order('created_at', { ascending: false })
        .limit(5);
      
      setRecentDocs(records || []);

      // Initial Queue Fetch (mocking queue as those who recently accessed triage)
      const { data: queue } = await supabase
        .from(SB_TABLES.access_logs)
        .select('*, user_patient(first_name, second_name, blood_group)')
        .order('created_at', { ascending: false })
        .limit(5);
      
      setPatientsInQueue(queue || []);
    }
    init();

    // REAL-TIME: Listen for new emergency scans/referrals
    const channel = supabase
      .channel('emergency_pulse')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'access_logs' }, (payload) => {
        setPatientsInQueue(prev => [payload.new, ...prev]);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [supabase]);

  // Fetch linked patients (from accepted invite links)
  useEffect(() => {
    if (activeView !== 'patients' || !doctor) return;
    async function fetchLinkedPatients() {
      // Get all SHARED_LINK_ACCESS logs for this doctor
      const { data: accessData } = await supabase
        .from(SB_TABLES.access_logs)
        .select('patient_id, created_at, metadata')
        .eq('doctor_id', doctor.id)
        .eq('action', 'SHARED_LINK_ACCESS')
        .order('created_at', { ascending: false });

      if (!accessData || accessData.length === 0) {
        setLinkedPatients([]);
        return;
      }

      // Deduplicate by patient_id (keep the most recent access)
      const seen = new Set<string>();
      const unique = accessData.filter(entry => {
        if (seen.has(entry.patient_id)) return false;
        seen.add(entry.patient_id);
        return true;
      });

      // Fetch each patient's profile
      const patientIds = unique.map(u => u.patient_id);
      const { data: profiles } = await supabase
        .from(SB_TABLES.user_patient)
        .select('*')
        .in('user_id', patientIds);

      const enriched = unique.map(entry => ({
        ...entry,
        profile: profiles?.find(p => p.user_id === entry.patient_id) || null,
      }));

      setLinkedPatients(enriched);
    }
    fetchLinkedPatients();
  }, [activeView, doctor, supabase]);

  // Fetch expanded patient's full data
  const handleExpandPatient = async (patientId: string) => {
    if (expandedPatientId === patientId) {
      setExpandedPatientId(null);
      return;
    }
    setExpandedPatientId(patientId);

    // If already fetched, skip
    if (patientDetails[patientId]) return;

    const [recordsRes, vitalsRes, prescriptionsRes] = await Promise.all([
      supabase
        .from(SB_TABLES.medical_records)
        .select('*')
        .eq('patient_id', patientId)
        .order('created_at', { ascending: false }),
      supabase
        .from(SB_TABLES.medical_vitals)
        .select('*')
        .eq('patient_id', patientId)
        .order('created_at', { ascending: false })
        .limit(3),
      supabase
        .from(SB_TABLES.prescriptions)
        .select('*')
        .eq('patient_id', patientId)
        .order('created_at', { ascending: false }),
    ]);

    setPatientDetails(prev => ({
      ...prev,
      [patientId]: {
        records: recordsRes.data || [],
        vitals: vitalsRes.data || [],
        prescriptions: prescriptionsRes.data || [],
      },
    }));
  };

  const handleAnalyzeRecords = async (patientId: string, firstName: string, secondName: string) => {
    setIsAnalyzing(true);
    setShowInsights(true);
    setSelectedPatient({ id: patientId, firstName, secondName });

    try {
      await supabase.from(SB_TABLES.access_logs).insert({
        patient_id: patientId,
        doctor_id: doctor.id,
        doctor_name: "Dr. Medical",
        action: "DEEP_SCAN_ANALYSIS",
        metadata: { tool: "KMP_ENGINE_V1", timestamp: new Date().toISOString() }
      });

      const { data: records } = await supabase
        .from(SB_TABLES.medical_records)
        .select('raw_text_content')
        .eq('patient_id', patientId);
      
      const megaText = records?.map(r => r.raw_text_content).join(" ") || "";
      const matches = scanCriticalInsights(megaText, EMERGENCY_KEYWORDS);
      setInsights(matches);
      
    } catch (err) {
      console.error("Analysis Failed:", err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FBFBFF] px-4 md:px-6 py-12 relative overflow-hidden selection:bg-indigo-100 selection:text-indigo-900">
      {/* Decorative Background Elements */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-100/30 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-violet-100/30 rounded-full blur-[120px] pointer-events-none" />

      <motion.div 
        initial="hidden"
        animate="visible"
        variants={fadeIn}
        className="max-w-7xl mx-auto space-y-12 relative z-10"
      >
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-8 pb-10 border-b border-indigo-50">
          <div className="space-y-4">
            <div className="flex items-center gap-4">
                <div className="h-10 w-10 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-md animate-pulse">
                    <Zap className="h-6 w-6" />
                </div>
                <h1 className="text-4xl md:text-5xl xl:text-6xl font-black text-indigo-950 tracking-tighter italic font-heading">
                    Golden Hour <span className="bg-gradient-to-r from-indigo-500 to-violet-500 bg-clip-text text-transparent">Triage Engine.</span>
                </h1>
            </div>
            <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px] italic ml-14">Medical Protocol V4.2 — Dynamic Intelligence Active</p>
          </div>
          
          <div className="flex gap-4">
            <Button 
                onClick={() => {
                    if (selectedPatient) setShowPrescription(true);
                    else alert("Select a patient from the queue to prescribe medication.");
                }}
                className="h-14 px-8 rounded-3xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-md text-[10px] uppercase tracking-widest font-bold font-mono"
            >
                <Plus className="h-4 w-4 mr-2" /> New Protocol
            </Button>
          </div>
        </header>

        {/* View Toggle: Triage / My Patients */}
        <motion.div variants={itemFadeIn} className="flex bg-white p-1.5 rounded-3xl border border-indigo-100 shadow-sm w-fit">
          {[
            { id: 'triage', icon: Zap, label: 'Triage Engine' },
            { id: 'patients', icon: Users, label: 'My Patients' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveView(tab.id as any)}
              className={cn(
                "flex items-center gap-2 px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all duration-300",
                activeView === tab.id ? "bg-indigo-600 text-white shadow-md scale-105" : "text-slate-500 hover:text-indigo-600 hover:bg-slate-50"
              )}
            >
              <tab.icon className="h-4 w-4" /> <span className="hidden sm:inline">{tab.label}</span>
            </button>
          ))}
        </motion.div>

        {activeView === 'triage' && (
        <>
        {/* Global Stats */}
        <motion.div variants={staggerContainer} className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {[
            { label: "Clinical Queue", value: patientsInQueue.length.toString(), icon: Users, color: "text-indigo-600", bg: "bg-indigo-50" },
            { label: "Critical Flags", value: "3", icon: AlertTriangle, color: "text-rose-600", bg: "bg-rose-50" },
            { label: "Pulse Capacity", value: "82%", icon: Activity, color: "text-violet-600", bg: "bg-violet-50" },
            { label: "Audit Level", value: "100%", icon: Shield, color: "text-emerald-600", bg: "bg-emerald-50" }
          ].map((stat, i) => (
            <motion.div variants={itemFadeIn} key={i} className="flex flex-col gap-4 border border-indigo-100 rounded-[2rem] group hover:border-indigo-200 transition-all bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div className={cn("h-10 w-10 rounded-xl flex items-center justify-center shadow-sm transition-transform group-hover:scale-110", stat.bg, stat.color)}>
                    <stat.icon className="h-4 w-4" />
                </div>
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest italic">{stat.label}</span>
              </div>
              <div className="text-4xl font-black text-indigo-950 italic tracking-tighter">{stat.value}</div>
            </motion.div>
          ))}
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Real-time Triage Queue */}
          <motion.div variants={staggerContainer} className="lg:col-span-2 space-y-8">
            <div className="flex items-center justify-between px-2">
              <div className="flex items-center gap-4">
                <div className="h-2 w-2 rounded-full bg-indigo-600 animate-ping" />
                <h2 className="text-3xl font-black uppercase tracking-tighter text-indigo-950 italic font-heading">Clinical Surge.</h2>
              </div>
              <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest italic font-mono">Real-time Hub Active</span>
            </div>
            
            <div className="space-y-4">
              {patientsInQueue.length > 0 ? patientsInQueue.map((entry, i) => (
                <motion.div variants={itemFadeIn} 
                    key={i} 
                    onClick={() => setSelectedPatient({ 
                        id: entry.patient_id, 
                        firstName: entry.user_patient?.first_name || "Unknown", 
                        secondName: entry.user_patient?.second_name || "Patient" 
                    })}
                    className={cn(
                        "flex flex-col md:flex-row items-center justify-between gap-6 group cursor-pointer transition-all border border-indigo-100 rounded-[2rem] p-6 shadow-sm bg-white",
                        selectedPatient?.id === entry.patient_id ? "border-indigo-500 ring-4 ring-indigo-500/10 bg-indigo-50/10" : "hover:border-indigo-200 hover:shadow-md"
                    )}
                >
                  <div className="flex items-center gap-6 w-full md:w-auto">
                    <div className="h-14 w-14 rounded-2xl bg-indigo-50 shrink-0 flex items-center justify-center text-indigo-600 font-black text-xl italic shadow-sm group-hover:scale-110 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                      {entry.user_patient?.first_name?.[0] || "P"}
                    </div>
                    <div className="space-y-1">
                      <h4 className="text-xl font-bold text-indigo-950 uppercase tracking-tight flex flex-wrap items-center gap-3">
                        {entry.user_patient?.first_name} {entry.user_patient?.second_name}
                        {entry.action === "EMERGENCY_TRIAGE_ACCESS" && <span className="text-[8px] bg-rose-600 text-white px-3 py-1 rounded-full animate-pulse shadow-sm">EMERGENCY</span>}
                      </h4>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest font-mono">
                        {entry.user_patient?.blood_group ? `BLOOD: ${entry.user_patient.blood_group}` : "SYNC PENDING"} • {new Date(entry.created_at).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-6 w-full md:w-auto justify-between md:justify-end">
                    <span className="md:inline px-3 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest border bg-indigo-50 text-indigo-600 border-indigo-100 font-mono">
                      IN-QUEUE
                    </span>
                    <div className={cn("h-10 w-10 rounded-full flex items-center justify-center transition-all", selectedPatient?.id === entry.patient_id ? "bg-indigo-100 text-indigo-600 scale-110" : "bg-slate-50 text-slate-300 group-hover:bg-indigo-50 group-hover:text-indigo-600")}>
                        <ArrowRight className="h-4 w-4" />
                    </div>
                  </div>
                </motion.div>
              )) : (
                <div className="py-24 text-center border-2 border-dotted border-indigo-100 rounded-[3rem] bg-indigo-50/20">
                    <Users className="h-16 w-16 text-slate-200 mx-auto mb-6" />
                    <p className="text-slate-400 font-black uppercase tracking-widest text-[10px] italic">Clinical buffers at nominal levels</p>
                </div>
              )}
            </div>
          </motion.div>

          {/* Emergency Snapshot / Deep Analytics */}
          <motion.div variants={staggerContainer} className="space-y-10">
            <h2 className="text-3xl font-black uppercase tracking-tighter text-indigo-950 italic font-heading">Intelligence Brief.</h2>
            
            {selectedPatient ? (
                <motion.div variants={fadeIn} className="space-y-10">
                    <div className="flex items-center justify-between bg-white border border-indigo-100 p-6 rounded-[2rem] shadow-sm">
                        <div className="space-y-1">
                            <h3 className="text-sm font-bold text-indigo-950 uppercase tracking-tight">Triage: <span className="text-indigo-600">{selectedPatient.firstName}</span></h3>
                            <div className="flex items-center gap-2">
                                <div className="h-1.5 w-1.5 rounded-full bg-indigo-600 animate-pulse" />
                                <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest font-mono">Protocol GH-001 Verified</p>
                            </div>
                        </div>
                        <button onClick={() => setSelectedPatient(null)} className="h-8 w-8 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 hover:text-indigo-600 hover:bg-white transition-all shadow-sm"><X className="h-4 w-4" /></button>
                    </div>
                    
                    <div className="rounded-[2.5rem] overflow-hidden shadow-lg border border-indigo-100 bg-white">
                        <EmergencySnapshot patientId={selectedPatient.id} />
                    </div>
                    
                    <Button 
                        onClick={() => handleAnalyzeRecords(selectedPatient.id, selectedPatient.firstName, selectedPatient.secondName)}
                        className="w-full h-16 bg-white hover:bg-slate-50 border border-indigo-100 text-indigo-600 font-black uppercase tracking-widest transition-all shadow-md rounded-[2rem] text-xs gap-3"
                    >
                        <Search className="h-5 w-5" /> Initialize Deep Scan
                    </Button>
                </motion.div>
            ) : (
                <motion.div variants={itemFadeIn} className="py-20 text-center border border-indigo-100 border-dotted bg-white rounded-[3rem] shadow-sm">
                    <Shield className="h-10 w-10 text-slate-200 mx-auto mb-6" />
                    <p className="text-slate-500 font-black uppercase tracking-widest text-[9px] px-8 italic leading-relaxed">Select biological profile from clinical surge to initialize assessment</p>
                </motion.div>
            )}

            <motion.div variants={itemFadeIn} className="space-y-6 pt-6">
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2 italic">Clinical History Access</h3>
                {recentDocs.map((doc, i) => (
                    <div key={i} className="border border-indigo-50 hover:border-indigo-100 bg-white flex items-center justify-between p-4 px-6 group transition-all shadow-sm rounded-2xl">
                        <div className="flex items-center gap-4 truncate">
                            <div className="h-10 w-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-300 group-hover:text-indigo-500 group-hover:bg-indigo-50 transition-colors shrink-0">
                                <FileText className="h-5 w-5" />
                            </div>
                            <div className="space-y-0.5 truncate pr-4">
                                <h4 className="text-xs font-bold text-indigo-950 uppercase tracking-tight truncate">{doc.title}</h4>
                                <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest font-mono truncate">{doc.user_patient?.first_name} • {new Date(doc.created_at).toLocaleDateString()}</p>
                            </div>
                        </div>
                        <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => handleAnalyzeRecords(doc.patient_id, doc.user_patient?.first_name, doc.user_patient?.second_name)}
                            className="h-10 w-10 shrink-0 rounded-xl border border-transparent hover:border-indigo-100 hover:bg-indigo-50 text-slate-300 hover:text-indigo-600 transition-all"
                        >
                            <ArrowRight className="h-4 w-4" />
                        </Button>
                    </div>
                ))}
            </motion.div>
          </motion.div>
        </div>
        </>
        )}

        {/* ═══════════════════════════════════════════════════════ */}
        {/* MY PATIENTS TAB                                         */}
        {/* ═══════════════════════════════════════════════════════ */}
        {activeView === 'patients' && (
          <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="space-y-12">
            {/* Header */}
            <motion.div variants={itemFadeIn} className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="space-y-2">
                <h2 className="text-4xl font-black text-indigo-950 italic tracking-tighter font-heading">Linked Patients.</h2>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Patients who shared access via invite links</p>
              </div>
              <div className="flex items-center gap-3 px-6 py-3 rounded-2xl bg-indigo-50 border border-indigo-100">
                <Link2 className="h-4 w-4 text-indigo-600" />
                <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">{linkedPatients.length} Linked</span>
              </div>
            </motion.div>

            {/* Patients List */}
            {linkedPatients.length > 0 ? linkedPatients.map((entry) => {
              const p = entry.profile;
              const isExpanded = expandedPatientId === entry.patient_id;
              const details = patientDetails[entry.patient_id];

              return (
                <motion.div
                  variants={itemFadeIn}
                  key={entry.patient_id}
                  className={cn(
                    "border rounded-[2.5rem] bg-white shadow-lg transition-all overflow-hidden",
                    isExpanded ? "border-indigo-300 ring-4 ring-indigo-500/10" : "border-indigo-100 hover:border-indigo-200"
                  )}
                >
                  {/* Patient Header — Clickable */}
                  <button
                    onClick={() => handleExpandPatient(entry.patient_id)}
                    className="w-full p-8 flex flex-col sm:flex-row items-center justify-between gap-6 text-left"
                  >
                    <div className="flex items-center gap-6 w-full sm:w-auto">
                      <div className="h-16 w-16 rounded-[1.25rem] bg-indigo-600 flex items-center justify-center text-white text-2xl font-black italic shadow-lg shrink-0">
                        {p?.first_name?.[0]}{p?.second_name?.[0]}
                      </div>
                      <div className="space-y-2">
                        <h3 className="text-2xl font-black text-indigo-950 italic tracking-tighter">
                          {p?.first_name || "Unknown"} {p?.second_name || "Patient"}
                        </h3>
                        <div className="flex items-center gap-4 flex-wrap">
                          {p?.blood_group && (
                            <span className="flex items-center gap-1.5 text-[9px] font-black text-rose-600 uppercase tracking-widest">
                              <Droplets className="h-3 w-3" /> {p.blood_group}
                            </span>
                          )}
                          <span className="flex items-center gap-1.5 text-[9px] font-black text-indigo-600 uppercase tracking-widest">
                            <Link2 className="h-3 w-3" /> Linked {new Date(entry.created_at).toLocaleDateString()}
                          </span>
                          {p?.gender && (
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                              {p.gender}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 w-full sm:w-auto justify-end">
                      <span className="px-4 py-2 rounded-xl text-[8px] font-black uppercase tracking-widest border bg-emerald-50 text-emerald-600 border-emerald-100 font-mono">
                        Authorized
                      </span>
                      <div className={cn(
                        "h-10 w-10 rounded-full flex items-center justify-center transition-all border border-indigo-100",
                        isExpanded ? "bg-indigo-600 text-white rotate-180" : "bg-slate-50 text-slate-400"
                      )}>
                        <ChevronDown className="h-5 w-5" />
                      </div>
                    </div>
                  </button>

                  {/* Expanded Content */}
                  {isExpanded && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.4 }}
                      className="border-t border-indigo-100"
                    >
                      <div className="p-8 space-y-10">
                        {/* Clinical Alerts Row */}
                        {(p?.active_allergies?.length > 0 || p?.chronic_conditions?.length > 0 || p?.current_medications?.length > 0) && (
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {/* Allergies */}
                            <div className="p-6 rounded-[2rem] bg-rose-50/50 border border-rose-100/50">
                              <h4 className="text-[9px] font-black text-rose-600 uppercase tracking-widest mb-3 flex items-center gap-2">
                                <AlertTriangle className="h-3.5 w-3.5" /> Allergies
                              </h4>
                              <div className="flex flex-wrap gap-2">
                                {p?.active_allergies?.map((a: string, i: number) => (
                                  <span key={i} className="px-3 py-1.5 rounded-lg bg-white border border-rose-100 text-rose-600 text-[9px] font-black uppercase tracking-widest shadow-sm">{a}</span>
                                ))}
                                {(!p?.active_allergies || p.active_allergies.length === 0) && (
                                  <span className="text-[10px] text-slate-400 italic">None documented</span>
                                )}
                              </div>
                            </div>
                            {/* Conditions */}
                            <div className="p-6 rounded-[2rem] bg-violet-50/50 border border-violet-100/50">
                              <h4 className="text-[9px] font-black text-violet-600 uppercase tracking-widest mb-3 flex items-center gap-2">
                                <Shield className="h-3.5 w-3.5" /> Conditions
                              </h4>
                              <div className="flex flex-wrap gap-2">
                                {p?.chronic_conditions?.map((c: string, i: number) => (
                                  <span key={i} className="px-3 py-1.5 rounded-lg bg-white border border-violet-100 text-violet-600 text-[9px] font-black uppercase tracking-widest shadow-sm">{c}</span>
                                ))}
                                {(!p?.chronic_conditions || p.chronic_conditions.length === 0) && (
                                  <span className="text-[10px] text-slate-400 italic">None documented</span>
                                )}
                              </div>
                            </div>
                            {/* Medications */}
                            <div className="p-6 rounded-[2rem] bg-indigo-50/50 border border-indigo-100/50">
                              <h4 className="text-[9px] font-black text-indigo-600 uppercase tracking-widest mb-3 flex items-center gap-2">
                                <Pill className="h-3.5 w-3.5" /> Medications
                              </h4>
                              <div className="flex flex-wrap gap-2">
                                {p?.current_medications?.map((m: string, i: number) => (
                                  <span key={i} className="px-3 py-1.5 rounded-lg bg-white border border-indigo-100 text-indigo-600 text-[9px] font-black uppercase tracking-widest shadow-sm">{m}</span>
                                ))}
                                {(!p?.current_medications || p.current_medications.length === 0) && (
                                  <span className="text-[10px] text-slate-400 italic">None documented</span>
                                )}
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Vitals */}
                        {details?.vitals?.length > 0 && (
                          <div className="space-y-4">
                            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">Latest Vitals</h4>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                              <div className="p-5 rounded-2xl bg-white border border-indigo-100 shadow-sm space-y-2">
                                <div className="flex items-center gap-2 text-rose-500"><Heart className="h-4 w-4" /><span className="text-[9px] font-black uppercase tracking-widest">Heart Rate</span></div>
                                <p className="text-2xl font-black text-indigo-950 italic tracking-tighter">{details.vitals[0].heart_rate} <span className="text-[10px] not-italic text-slate-400">BPM</span></p>
                              </div>
                              <div className="p-5 rounded-2xl bg-white border border-indigo-100 shadow-sm space-y-2">
                                <div className="flex items-center gap-2 text-indigo-600"><Zap className="h-4 w-4" /><span className="text-[9px] font-black uppercase tracking-widest">SpO2</span></div>
                                <p className="text-2xl font-black text-indigo-950 italic tracking-tighter">{details.vitals[0].spo2}<span className="text-[10px] not-italic text-slate-400">%</span></p>
                              </div>
                              <div className="p-5 rounded-2xl bg-white border border-indigo-100 shadow-sm space-y-2">
                                <div className="flex items-center gap-2 text-violet-600"><Activity className="h-4 w-4" /><span className="text-[9px] font-black uppercase tracking-widest">BP</span></div>
                                <p className="text-2xl font-black text-indigo-950 italic tracking-tighter">{details.vitals[0].blood_pressure}</p>
                              </div>
                              <div className="p-5 rounded-2xl bg-white border border-indigo-100 shadow-sm space-y-2">
                                <div className="flex items-center gap-2 text-amber-500"><Thermometer className="h-4 w-4" /><span className="text-[9px] font-black uppercase tracking-widest">Temp</span></div>
                                <p className="text-2xl font-black text-indigo-950 italic tracking-tighter">{details.vitals[0].temperature}<span className="text-[10px] not-italic text-slate-400">°C</span></p>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Medical Records */}
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">Medical Records</h4>
                            <span className="text-[9px] font-black text-indigo-400 uppercase tracking-widest">{details?.records?.length || 0} indexed</span>
                          </div>
                          {details?.records?.length > 0 ? (
                            <div className="space-y-3">
                              {details.records.map((rec: any) => {
                                const aiData = rec.ai_summary ? (() => { try { return JSON.parse(rec.ai_summary); } catch { return null; } })() : null;
                                return (
                                  <div key={rec.id} className="group border border-indigo-50 hover:border-indigo-100 rounded-2xl bg-white p-5 transition-all shadow-sm">
                                    <div className="flex items-center justify-between gap-4">
                                      <div className="flex items-center gap-4">
                                        <div className="h-10 w-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 shrink-0 group-hover:bg-indigo-600 group-hover:text-white transition-all"><FileText className="h-5 w-5" /></div>
                                        <div className="space-y-0.5">
                                          <h5 className="text-sm font-bold text-indigo-950 uppercase tracking-tight">{rec.title}</h5>
                                          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest font-mono">{new Date(rec.created_at).toLocaleDateString()} • {rec.record_type}</p>
                                        </div>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        {rec.ai_summary && <span className="hidden md:inline px-2 py-1 rounded-md text-[8px] font-black uppercase tracking-widest bg-violet-50 text-violet-600 border border-violet-100">AI</span>}
                                        {rec.file_url && (
                                          <a href={rec.file_url} target="_blank" rel="noreferrer">
                                            <Button variant="outline" size="sm" className="h-9 w-9 p-0 border-indigo-100 text-indigo-600 hover:bg-indigo-50 rounded-lg">
                                              <ExternalLink className="h-4 w-4" />
                                            </Button>
                                          </a>
                                        )}
                                      </div>
                                    </div>
                                    {aiData?.shortBrief && (
                                      <div className="mt-3 p-3 rounded-xl bg-gradient-to-r from-indigo-50/50 to-violet-50/50 border border-indigo-50">
                                        <p className="text-xs text-slate-500 font-medium leading-relaxed line-clamp-2">
                                          <span className="text-[9px] font-black text-violet-500 uppercase tracking-wider mr-2">AI:</span>{aiData.shortBrief}
                                        </p>
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          ) : details ? (
                            <div className="py-10 text-center border border-indigo-50 rounded-2xl bg-indigo-50/20">
                              <FileText className="h-8 w-8 text-slate-200 mx-auto mb-3" />
                              <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">No records on file</p>
                            </div>
                          ) : (
                            <div className="py-10 text-center">
                              <div className="h-8 w-8 rounded-full border-2 border-t-indigo-600 border-indigo-100 animate-spin mx-auto mb-3" />
                              <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Loading clinical data...</p>
                            </div>
                          )}
                        </div>

                        {/* Prescriptions */}
                        {details?.prescriptions?.length > 0 && (
                          <div className="space-y-4">
                            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">Active Prescriptions</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {details.prescriptions.map((rx: any) => (
                                <div key={rx.id} className="p-5 rounded-2xl bg-white border border-indigo-100 shadow-sm flex items-center gap-4 group hover:border-indigo-200 transition-all">
                                  <div className="h-10 w-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 shrink-0 group-hover:scale-110 transition-transform"><Pill className="h-5 w-5" /></div>
                                  <div className="space-y-0.5">
                                    <h5 className="text-sm font-bold text-indigo-950 uppercase tracking-tight">{rx.medication_name}</h5>
                                    <p className="text-[9px] font-black text-indigo-600 uppercase tracking-widest">{rx.dosage}</p>
                                    {rx.instructions && <p className="text-[10px] text-slate-400 font-medium italic truncate">{rx.instructions}</p>}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Actions */}
                        <div className="flex gap-4 pt-4 border-t border-indigo-50">
                          <Button
                            onClick={() => handleAnalyzeRecords(entry.patient_id, p?.first_name || 'Patient', p?.second_name || '')}
                            className="h-12 px-6 rounded-2xl bg-white hover:bg-indigo-50 border border-indigo-100 text-indigo-600 font-black uppercase tracking-widest text-[9px] gap-2 shadow-sm"
                          >
                            <Search className="h-4 w-4" /> Deep Scan
                          </Button>
                          <Button
                            onClick={() => {
                              setSelectedPatient({ id: entry.patient_id, firstName: p?.first_name, secondName: p?.second_name });
                              setShowPrescription(true);
                            }}
                            className="h-12 px-6 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-black uppercase tracking-widest text-[9px] gap-2 shadow-md"
                          >
                            <Plus className="h-4 w-4" /> Prescribe
                          </Button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </motion.div>
              );
            }) : (
              <motion.div variants={itemFadeIn} className="py-24 text-center border-2 border-dotted border-indigo-100 rounded-[3rem] bg-indigo-50/20">
                <Link2 className="h-16 w-16 text-slate-200 mx-auto mb-6" />
                <p className="text-slate-400 font-black uppercase tracking-widest text-[10px] italic">No patients have shared access with you yet</p>
                <p className="text-[9px] text-slate-300 font-bold uppercase tracking-widest mt-2">Patients can share invite links from their dashboard</p>
              </motion.div>
            )}
          </motion.div>
        )}

        {/* Branding */}
        <footer className="pt-24 border-t border-indigo-100 flex flex-col md:flex-row justify-between items-end gap-10 opacity-60 hover:opacity-100 transition-all group">
            <div className="space-y-3">
                <h3 className="text-3xl font-black text-indigo-950 italic tracking-tighter font-heading">Byteus.</h3>
                <div className="flex items-center gap-4 font-mono">
                    <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest bg-white shadow-sm px-3 py-1 rounded-full border border-slate-100">ENGINE: V1.0.4 — CLINICAL CLUSTER</span>
                    <div className="h-px w-8 bg-slate-200" />
                </div>
            </div>
            <p className="max-w-md text-[9px] font-bold text-slate-400 uppercase tracking-widest text-right leading-relaxed font-mono italic">
                Diagnostic instrument for authorized clinical investigation. All biological telemetry is verified by sovereign cryptographic keys.
            </p>
        </footer>
      </motion.div>

      {/* Modals */}
      <ClinicalInsightsModal 
        isOpen={showInsights}
        onClose={() => setShowInsights(false)}
        matches={insights}
        patientName={selectedPatient ? `${selectedPatient.firstName} ${selectedPatient.secondName}` : "Awaiting..."}
        isScanning={isAnalyzing}
      />

      <PrescriptionModal 
        isOpen={showPrescription}
        onClose={() => setShowPrescription(false)}
        patientId={selectedPatient?.id || ""}
        patientName={selectedPatient ? `${selectedPatient.firstName} ${selectedPatient.secondName}` : "Patient"}
        doctorId={doctor?.id || ""}
      />
    </div>
  );
}
