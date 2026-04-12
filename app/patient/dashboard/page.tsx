'use client'

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { SB_TABLES } from "@/lib/supabase/tables";
import RecordUpload from "@/components/RecordUpload";
import EmergencyQR from "@/components/EmergencyQR";
import AccessLogs from "@/components/AccessLogs";
import SystemActivityLog from "@/components/SystemActivityLog";
import { calculateHealthSyncScore } from "@/lib/utils/healthScore";
import { LayoutDashboard, FileText, Shield, ShieldCheck, Activity, Calendar, ExternalLink, Mail, Trash2, Pill, Zap, Heart, Thermometer, BrainCircuit, Share2, Copy, Link, Clock, CheckCircle2, XCircle, Loader2, ChevronDown, KeyRound } from "lucide-react";
import AIBriefModal from "@/components/AIBriefModal";
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

export default function PatientDashboard() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'records' | 'health' | 'security' | 'share'>('dashboard');
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [records, setRecords] = useState<any[]>([]);
  const [prescriptions, setPrescriptions] = useState<any[]>([]);
  const [vitals, setVitals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBriefRecord, setSelectedBriefRecord] = useState<any>(null);
  const [invites, setInvites] = useState<any[]>([]);
  const [generatingInvite, setGeneratingInvite] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  // Record token sharing state
  const [recordTokens, setRecordTokens] = useState<any[]>([]);
  const [selectedRecordId, setSelectedRecordId] = useState<string>("");
  const [selectedExpiry, setSelectedExpiry] = useState<string>("1d");
  const [generatingRecordToken, setGeneratingRecordToken] = useState(false);
  const [showRecordDropdown, setShowRecordDropdown] = useState(false);

  const [accessDocEmail, setAccessDocEmail] = useState("");
  const supabase = createClient();

  useEffect(() => {
    async function fetchData() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        setUser(user);

        // Fetch Profile
        const profileDataP = supabase
          .from(SB_TABLES.user_patient)
          .select('*')
          .eq('user_id', user.id)
          .single();


        // Fetch Records
        const recordsDataP = supabase
          .from(SB_TABLES.medical_records)
          .select('*')
          .eq('patient_id', user.id)
          .order('created_at', { ascending: false });


        // Fetch Prescriptions
        const prescriptionsDataP = supabase
          .from(SB_TABLES.prescriptions)
          .select('*')
          .eq('patient_id', user.id)
          .order('created_at', { ascending: false });


        // Fetch Vitals
        const vitalsDataP = supabase
          .from(SB_TABLES.medical_vitals)
          .select('*')
          .eq('patient_id', user.id)
          .order('created_at', { ascending: false });


        const [{ data: profileData }, { data: recordsData }, { data: prescriptionsData }, { data: vitalsData }] = await Promise.all([profileDataP, recordsDataP, prescriptionsDataP, vitalsDataP])

        setVitals(vitalsData || []);
        setPrescriptions(prescriptionsData || []);
        setRecords(recordsData || []);
        setProfile(profileData);

        setLoading(false);
      } catch (e) {
        console.error("Error fetching data:", e);
        setLoading(false);
      }
    }
    fetchData();

    // REAL-TIME: Listen for new prescriptions
    const channel = supabase
      .channel('patient_alerts')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'prescriptions' }, (payload) => {
        setPrescriptions(prev => [payload.new, ...prev]);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [supabase]);

  // Fetch invites and record tokens when share tab is active
  useEffect(() => {
    if (activeTab !== 'share') return;
    async function fetchShareData() {
      const [invitesRes, tokensRes] = await Promise.all([
        fetch('/api/invite'),
        fetch('/api/record-token'),
      ]);
      const invitesData = await invitesRes.json();
      const tokensData = await tokensRes.json();
      setInvites(invitesData.invites || []);
      setRecordTokens(tokensData.tokens || []);
    }
    fetchShareData();
  }, [activeTab]);

  const handleGenerateInvite = async () => {
    setGeneratingInvite(true);
    try {
      const res = await fetch('/api/invite', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setInvites(prev => [{ ...data.invite, share_url: data.invite.share_url, is_revoked: false, created_at: new Date().toISOString() }, ...prev]);
      } else {
        alert('Failed to generate invite link.');
      }
    } catch { alert('Network error generating invite.'); }
    setGeneratingInvite(false);
  };

  const handleRevokeInvite = async (inviteId: string) => {
    if (!window.confirm('Revoke this invite? Doctors will no longer be able to access your records via this link.')) return;
    try {
      const res = await fetch('/api/invite', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ invite_id: inviteId }),
      });
      const data = await res.json();
      if (data.success) {
        setInvites(prev => prev.map(inv => inv.id === inviteId ? { ...inv, is_revoked: true } : inv));
      }
    } catch { alert('Failed to revoke invite.'); }
  };

  const handleCopyLink = (invite: any) => {
    const url = invite.share_url || `${window.location.origin}/shared/${invite.token}`;
    navigator.clipboard.writeText(url);
    setCopiedId(invite.id || invite.token);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Record token handlers
  const handleGenerateRecordToken = async () => {
    if (!selectedRecordId) {
      alert('Please select a record to share.');
      return;
    }
    setGeneratingRecordToken(true);
    try {
      const res = await fetch('/api/record-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ record_id: selectedRecordId, expires_in: selectedExpiry, doctor_email: accessDocEmail }),
      });
      const data = await res.json();
      if (data.success) {
        // Copy the URL to clipboard immediately
        navigator.clipboard.writeText(data.token.share_url);
        setRecordTokens(prev => [{
          id: data.token.id,
          token: data.token.token,
          record_id: data.token.record_id,
          expires_at: data.token.expires_at,
          is_revoked: false,
          created_at: new Date().toISOString(),
          share_url: data.token.share_url,
          medical_records: { title: data.token.record_title, record_type: '' },
        }, ...prev]);
        setCopiedId(data.token.id);
        setTimeout(() => setCopiedId(null), 3000);
      } else {
        alert(data.error || 'Failed to generate record share link.');
      }
    } catch { alert('Network error generating record token.'); }
    setGeneratingRecordToken(false);
  };

  const handleRevokeRecordToken = async (tokenId: string) => {
    if (!window.confirm('Revoke this record share link? Doctors will lose access to this specific record via this link.')) return;
    try {
      const res = await fetch('/api/record-token', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token_id: tokenId }),
      });
      const data = await res.json();
      if (data.success) {
        setRecordTokens(prev => prev.map(t => t.id === tokenId ? { ...t, is_revoked: true } : t));
      }
    } catch { alert('Failed to revoke record token.'); }
  };

  const handleCopyRecordTokenLink = (token: any) => {
    const url = token.share_url || `${window.location.origin}/shared/record/${token.token}`;
    navigator.clipboard.writeText(url);
    setCopiedId(token.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const EXPIRY_LABELS: Record<string, string> = {
    '1h': '1 Hour',
    '1d': '1 Day',
    '1w': '1 Week',
    '1m': '1 Month',
    '1y': '1 Year',
  };

  const handleDeleteRecord = async (recordId: string, fileUrl: string) => {
    if (!window.confirm("Are you sure you want to permanently delete this medical record? This action cannot be undone.")) return;

    try {
      let fileName = "";
      if (fileUrl.includes('patient_records/')) {
        fileName = fileUrl.split('patient_records/')[1];
      } else {
        const urlParts = fileUrl.split('/');
        fileName = urlParts.slice(-2).join('/');
      }

      const { error: storageError } = await supabase.storage
        .from('patient_records')
        .remove([fileName]);

      if (storageError) {
        console.error("Storage Deletion Warning:", storageError);
      }

      const { error: dbError } = await supabase
        .from(SB_TABLES.medical_records)
        .delete()
        .eq('id', recordId);

      if (dbError) throw dbError;

      setRecords(prev => prev.filter(r => r.id !== recordId));
      alert("✅ Record successfully purged from your clinical vault.");

    } catch (err: any) {
      console.error("Deletion Error:", err);
      alert(`❌ Failed to delete record: ${err.message || "Unknown clinical error occurred."}`);
    }
  };

  const healthScore = profile ? calculateHealthSyncScore({
    profile: {
      blood_group: profile.blood_group,
      emergency_contact_name: profile.emergency_contact_name,
      emergency_contact_phone: profile.emergency_contact_phone,
      address: profile.address,
      gender: profile.gender,
      profile_picture_url: profile.profile_picture_url,
    },
    recordsCount: records.length,
    lastUploadDate: records[0]?.created_at
  }) : 0;

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-6 selection:bg-indigo-100 selection:text-indigo-900">
        <div className="h-16 w-16 rounded-full border-t-4 border-indigo-600 animate-spin" />
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] animate-pulse italic">Synchronizing Vault Terminal...</p>
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden pt-8 md:pt-0 pb-20 selection:bg-indigo-100 selection:text-indigo-900 min-h-screen bg-[#FBFBFF]">
      {/* Decorative Background Elements */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-100/30 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-violet-100/30 rounded-full blur-[120px] pointer-events-none" />

      <motion.div
        initial="hidden"
        animate="visible"
        variants={fadeIn}
        className="max-w-7xl mx-auto space-y-16 relative z-10 px-4 md:px-6"
      >
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-8 pb-10 border-b border-indigo-50">
          <div className="space-y-3">
            <h1 className="text-4xl md:text-5xl xl:text-6xl font-black text-indigo-950 tracking-tighter italic font-heading">
              Medical <span className="bg-gradient-to-r from-indigo-500 to-violet-500 bg-clip-text text-transparent">Intelligence Hub.</span>
            </h1>
            <div className="flex items-center gap-3">
              <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest font-mono">
                Session Key: <span className="text-indigo-600">ID-{user?.id.slice(0, 8).toUpperCase()}</span> — Clinical Protection Active
              </p>
            </div>
          </div>

          <nav className="flex bg-white p-1.5 rounded-3xl border border-indigo-100 shadow-sm">
            {[
              { id: 'dashboard', icon: LayoutDashboard, label: 'Hub' },
              { id: 'records', icon: FileText, label: 'Records' },
              { id: 'health', icon: Activity, label: 'Health' },
              { id: 'share', icon: Share2, label: 'Share' },
              { id: 'security', icon: Shield, label: 'Security' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={cn(
                  "flex items-center gap-2 px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all duration-300",
                  activeTab === tab.id ? "bg-indigo-600 text-white shadow-md scale-105" : "text-slate-500 hover:text-indigo-600 hover:bg-slate-50"
                )}
              >
                <tab.icon className="h-4 w-4" /> <span className="hidden sm:inline">{tab.label}</span>
              </button>
            ))}
          </nav>
        </header>

        <div className="flex flex-col gap-12">
          {/* Main Contextual Content Area */}
          <div className={cn(
            "flex-1 min-w-0 transition-all duration-700",
            activeTab === 'dashboard' ? "w-full" : "lg:flex-row flex flex-col gap-16"
          )}>
            <div className={cn(
              "flex-1 min-w-0",
              activeTab !== 'dashboard' && "lg:w-[65%]"
            )}>

              {activeTab === 'dashboard' && (
                <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="space-y-12">
                  {/* Top Statistics Tier */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {/* Health Sync Card (Elevated) */}
                    <motion.div variants={itemFadeIn} className="bg-indigo-600 text-white p-8 rounded-[2.5rem] shadow-xl relative overflow-hidden group/h">
                      <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover/h:scale-150 transition-transform duration-1000" />
                      <div className="relative z-10 space-y-6">
                        <div className="flex items-center justify-between">
                          <h4 className="text-[10px] font-black uppercase tracking-widest text-indigo-100">Sync Level</h4>
                          <Activity className="h-5 w-5 text-indigo-200" />
                        </div>
                        <div className="text-6xl font-black tracking-tighter italic font-heading">{healthScore}%</div>
                        <div className="h-1.5 w-full bg-white/20 rounded-full overflow-hidden">
                          <div className="h-full bg-white rounded-full transition-all duration-1000" style={{ width: `${healthScore}%` }} />
                        </div>
                      </div>
                    </motion.div>

                    {/* Quick Actions & High Priority Intel */}
                    <motion.div variants={itemFadeIn} className="border border-indigo-100 rounded-[2.5rem] bg-white shadow-lg p-8 flex flex-col justify-between group hover:border-indigo-200 transition-all">
                      <div className="space-y-4">
                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">Clinical Ingestion</h4>
                        <RecordUpload onUploadComplete={() => window.location.reload()} />
                      </div>
                      <div className="flex items-center justify-between pt-6 border-t border-slate-50 mt-auto">
                        <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">Total Clinical Node: {records.length}</span>
                        <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                      </div>
                    </motion.div>

                    {/* Active Protocols Card */}
                    <motion.div variants={itemFadeIn} className="border border-indigo-100 rounded-[2.5rem] bg-white shadow-lg p-8 flex flex-col justify-between group hover:border-indigo-200 transition-all">
                      <div className="space-y-2">
                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">Active Protocols</h4>
                        <p className="text-4xl lg:text-5xl font-black text-indigo-950 italic tracking-tighter">{prescriptions.length} <span className="text-sm font-medium not-italic text-slate-400 tracking-normal ml-2">Indexed Rx</span></p>
                      </div>
                      <Button variant="outline" size="sm" onClick={() => setActiveTab('health')} className="w-full mt-6 h-12 rounded-2xl border-indigo-100 text-indigo-600 hover:bg-indigo-50 hover:text-indigo-700 transition-all font-bold uppercase tracking-widest text-[9px]">
                        View Medication Plan
                      </Button>
                    </motion.div>
                  </div>

                  {/* Main Content Tier */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 pt-4">
                    {/* Left: Records Stream (2/3) */}
                    <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="lg:col-span-2 space-y-8">
                      <div className="flex items-center justify-between px-2">
                        <h2 className="text-3xl font-black text-indigo-950 italic tracking-tighter font-heading">Clinical Intelligence Log.</h2>
                        <Button variant="ghost" className="text-indigo-600 text-[10px] font-black uppercase tracking-widest hover:bg-indigo-50" onClick={() => setActiveTab('records')}>Full Library</Button>
                      </div>
                      <div className="space-y-4">
                        {records.slice(0, 4).map(record => {
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
                                <div className="flex items-center gap-6 w-full sm:w-auto justify-end">
                                  <span className={cn(
                                    "hidden md:inline px-3 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest border font-mono transition-all",
                                    record.ai_summary ? "bg-violet-50 text-violet-600 border-violet-100" : record.raw_text_content ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-indigo-50 text-indigo-600 border-indigo-100 animate-pulse"
                                  )}>
                                    {record.ai_summary ? "AI Analyzed" : record.raw_text_content ? "Deciphered" : "Decrypting..."}
                                  </span>
                                  <div className="flex items-center gap-2">
                                    <Button variant="outline" size="sm" className="h-10 px-3 border-indigo-100 text-indigo-600 hover:bg-indigo-50 rounded-xl text-[9px] font-black uppercase tracking-widest" onClick={() => setSelectedBriefRecord(record)}>
                                      <BrainCircuit className="h-4 w-4 mr-1" /> Brief
                                    </Button>
                                    <a href={record.file_url} target="_blank" rel="noreferrer">
                                      <Button variant="outline" size="sm" className="h-10 w-10 p-0 border-indigo-100 text-indigo-600 hover:bg-indigo-50 rounded-xl"><ExternalLink className="h-4 w-4" /></Button>
                                    </a>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="h-10 w-10 p-0 border-rose-100 text-rose-500 hover:bg-rose-50 hover:text-rose-600 rounded-xl"
                                      onClick={() => handleDeleteRecord(record.id, record.file_url)}
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </div>
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
                        })}
                      </div>
                    </motion.div>

                    {/* Right: Emergency & System Intel (1/3) */}
                    <motion.div variants={itemFadeIn} className="space-y-8">
                      <h3 className="text-[10px] font-black text-rose-500 uppercase tracking-widest ml-1 mb-2 italic">Critical Access</h3>
                      <EmergencyQR patientId={user?.id || ""} patientName={`${profile?.first_name} ${profile?.second_name}`} />

                      <div className="pt-4">
                        <h3 className="text-[10px] font-black text-indigo-400 uppercase tracking-widest ml-1 mb-4 italic">System Logs</h3>
                        <SystemActivityLog />
                      </div>
                    </motion.div>
                  </div>
                </motion.div>
              )}

              {activeTab === 'records' && (
                <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="space-y-12">
                  <motion.div variants={itemFadeIn} className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <h2 className="text-4xl font-black text-indigo-950 italic tracking-tighter font-heading">Clinical Artifacts.</h2>
                    <div className="w-full md:w-[350px]">
                      <RecordUpload onUploadComplete={() => window.location.reload()} />
                    </div>
                  </motion.div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                    {records.map(record => (
                      <motion.div variants={itemFadeIn} key={record.id} className="hover:border-indigo-200 border border-indigo-100 rounded-[2.5rem] shadow-xl transition-all bg-white p-6 md:p-10 flex flex-col gap-6 overflow-hidden min-w-0">
                        <div className="flex items-center justify-between">
                          <div className="h-14 w-14 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 font-black text-xl shadow-sm">
                            {record.record_type[0]}
                          </div>
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] italic">{new Date(record.created_at).toLocaleDateString()}</span>
                        </div>
                        <h4 className="text-2xl md:text-3xl font-black text-indigo-950 uppercase tracking-tighter italic leading-none truncate" title={record.title}>{record.title}</h4>
                        <div className="p-6 rounded-[2rem] bg-indigo-50/50 border border-indigo-50 relative group/box overflow-hidden">
                          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest italic leading-relaxed border-l-2 border-indigo-300 pl-4 relative z-10">
                            Clinical metadata securely indexed. <span className="text-indigo-600">AI Brief available.</span>
                          </p>
                        </div>
                        <div className="flex flex-wrap gap-3 mt-4">
                          <Button
                            className="flex-1 text-[10px] font-bold uppercase tracking-widest h-14 rounded-2xl bg-indigo-600 hover:bg-indigo-700 shadow-md"
                            onClick={() => setSelectedBriefRecord(record)}
                          >
                            <BrainCircuit className="h-4 w-4 mr-2" /> View AI Brief
                          </Button>
                          <a href={record.file_url} target="_blank" rel="noreferrer" className="flex-none">
                            <Button variant="outline" className="px-6 h-14 rounded-2xl border-indigo-100 text-indigo-600 hover:bg-indigo-50 transition-all shadow-sm">
                              <ExternalLink className="h-5 w-5" />
                            </Button>
                          </a>
                          <Button
                            variant="outline"
                            className="px-6 h-14 rounded-2xl border-rose-100 text-rose-600 hover:bg-rose-50 transition-all shadow-sm"
                            onClick={() => handleDeleteRecord(record.id, record.file_url)}
                          >
                            <Trash2 className="h-5 w-5" />
                          </Button>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              )}

              {activeTab === 'health' && (
                <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="space-y-16">
                  <motion.div variants={itemFadeIn} className="flex items-center justify-between px-2">
                    <h2 className="text-4xl font-black text-indigo-950 italic tracking-tighter font-heading">Vital Metrics.</h2>
                    <div className="flex items-center gap-3">
                      <div className="h-2 w-2 rounded-full bg-indigo-600 animate-ping" />
                      <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">Real-time Telemetry Active</span>
                    </div>
                  </motion.div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                    {/* Vitals Snapshot */}
                    <div className="space-y-10">
                      <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 italic">Intelligence Baseline</h3>
                      {vitals.length > 0 ? (
                        <motion.div variants={staggerContainer} className="grid grid-cols-2 gap-6">
                          <motion.div variants={itemFadeIn} className="border border-indigo-100 rounded-[2.5rem] shadow-lg p-8 space-y-4 bg-white hover:border-indigo-200 transition-all">
                            <div className="h-12 w-12 rounded-2xl bg-rose-50 flex items-center justify-center text-rose-600">
                              <Heart className="h-6 w-6" />
                            </div>
                            <div className="space-y-1">
                              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Rate</p>
                              <p className="text-3xl font-black text-indigo-950 italic tracking-tighter">{vitals[0].heart_rate} <span className="text-[10px] not-italic text-slate-400 font-medium tracking-normal">BPM</span></p>
                            </div>
                          </motion.div>
                          <motion.div variants={itemFadeIn} className="border border-indigo-100 rounded-[2.5rem] shadow-lg p-8 space-y-4 bg-white hover:border-indigo-200 transition-all">
                            <div className="h-12 w-12 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600">
                              <Zap className="h-6 w-6" />
                            </div>
                            <div className="space-y-1">
                              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Saturation</p>
                              <p className="text-3xl font-black text-indigo-950 italic tracking-tighter">{vitals[0].spo2}<span className="text-[10px] not-italic text-slate-400 font-medium tracking-normal">%</span></p>
                            </div>
                          </motion.div>
                          <motion.div variants={itemFadeIn} className="border border-indigo-100 rounded-[2.5rem] shadow-lg p-8 space-y-4 bg-white hover:border-indigo-200 transition-all">
                            <div className="h-12 w-12 rounded-2xl bg-violet-50 flex items-center justify-center text-violet-600">
                              <Activity className="h-6 w-6" />
                            </div>
                            <div className="space-y-1">
                              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Pressure</p>
                              <p className="text-3xl font-black text-indigo-950 italic tracking-tighter">{vitals[0].blood_pressure}</p>
                            </div>
                          </motion.div>
                          <motion.div variants={itemFadeIn} className="border border-indigo-100 rounded-[2.5rem] shadow-lg p-8 space-y-4 bg-white hover:border-indigo-200 transition-all">
                            <div className="h-12 w-12 rounded-2xl bg-orange-50 flex items-center justify-center text-orange-600">
                              <Thermometer className="h-6 w-6" />
                            </div>
                            <div className="space-y-1">
                              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Core Temp</p>
                              <p className="text-3xl font-black text-indigo-950 italic tracking-tighter">{vitals[0].temperature}<span className="text-[10px] not-italic text-slate-400 font-medium tracking-normal">°C</span></p>
                            </div>
                          </motion.div>
                        </motion.div>
                      ) : (
                        <motion.div variants={itemFadeIn} className="py-20 text-center border border-indigo-100 rounded-[2.5rem] shadow-soft bg-white">
                          <Activity className="h-12 w-12 text-slate-200 mx-auto mb-4" />
                          <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Vital telemetry stream empty</p>
                        </motion.div>
                      )}
                    </div>

                    {/* Prescriptions */}
                    <div className="space-y-10">
                      <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 italic">Active Protocols</h3>
                      <motion.div variants={staggerContainer} className="space-y-6">
                        {prescriptions.length > 0 ? prescriptions.map(presc => (
                          <motion.div variants={itemFadeIn} key={presc.id} className="border border-indigo-100 rounded-[2.5rem] shadow-lg bg-white p-8 group hover:border-indigo-200 transition-all duration-300">
                            <div className="flex items-center gap-6 mb-8">
                              <div className="h-14 w-14 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 shadow-sm group-hover:scale-110 transition-transform">
                                <Pill className="h-7 w-7" />
                              </div>
                              <div className="space-y-1">
                                <h4 className="text-xl font-bold text-indigo-950 uppercase tracking-tight ">{presc.medication_name}</h4>
                                <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">{presc.dosage}</p>
                              </div>
                            </div>
                            <div className="p-6 rounded-2xl bg-indigo-50/50 border border-indigo-50">
                              <p className="text-sm text-slate-600 font-medium leading-relaxed italic border-l-4 border-indigo-300 pl-6">
                                {presc.instructions}
                              </p>
                            </div>
                          </motion.div>
                        )) : (
                          <motion.div variants={itemFadeIn} className="py-20 text-center border border-indigo-100 rounded-[2.5rem] shadow-soft bg-white">
                            <Pill className="h-12 w-12 text-slate-200 mx-auto mb-4" />
                            <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">No active protocols indexed</p>
                          </motion.div>
                        )}
                      </motion.div>
                    </div>
                  </div>
                </motion.div>
              )}

              {activeTab === 'share' && (
                <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="space-y-12">
                  <motion.div variants={itemFadeIn} className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="space-y-2">
                      <h2 className="text-4xl font-black text-indigo-950 italic tracking-tighter font-heading">Share Access.</h2>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Generate secure invite links for your doctors</p>
                    </div>
                    <Button
                      onClick={handleGenerateInvite}
                      disabled={generatingInvite}
                      className="h-14 px-8 rounded-3xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-md text-[10px] uppercase tracking-widest font-bold disabled:opacity-50"
                    >
                      {generatingInvite ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Link className="h-4 w-4 mr-2" />}
                      {generatingInvite ? 'Generating...' : 'Generate Invite Link'}
                    </Button>
                  </motion.div>

                  {/* Info Card */}
                  <motion.div variants={itemFadeIn} className="bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-[2.5rem] p-10 shadow-xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                    <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-8">
                      <div className="space-y-3">
                        <div className="h-10 w-10 rounded-xl bg-white/20 flex items-center justify-center">
                          <Link className="h-5 w-5" />
                        </div>
                        <h4 className="text-sm font-bold">Secure Token</h4>
                        <p className="text-[10px] font-medium text-indigo-100 uppercase tracking-widest leading-relaxed">Each link uses a cryptographic token that can't be guessed.</p>
                      </div>
                      <div className="space-y-3">
                        <div className="h-10 w-10 rounded-xl bg-white/20 flex items-center justify-center">
                          <Clock className="h-5 w-5" />
                        </div>
                        <h4 className="text-sm font-bold">72-Hour Expiry</h4>
                        <p className="text-[10px] font-medium text-indigo-100 uppercase tracking-widest leading-relaxed">Links auto-expire after 72 hours. You can revoke them anytime.</p>
                      </div>
                      <div className="space-y-3">
                        <div className="h-10 w-10 rounded-xl bg-white/20 flex items-center justify-center">
                          <Shield className="h-5 w-5" />
                        </div>
                        <h4 className="text-sm font-bold">Doctor Verified</h4>
                        <p className="text-[10px] font-medium text-indigo-100 uppercase tracking-widest leading-relaxed">Only verified doctors can open the link. All access is logged.</p>
                      </div>
                    </div>
                  </motion.div>

                  {/* Active Invites List */}
                  <motion.div variants={staggerContainer} className="space-y-6">
                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2 italic">Your Invite Links</h3>
                    {invites.length > 0 ? invites.map(invite => {
                      const isExpired = new Date(invite.expires_at) < new Date();
                      const isRevoked = invite.is_revoked;
                      const isActive = !isExpired && !isRevoked;
                      const hoursLeft = Math.max(0, Math.floor((new Date(invite.expires_at).getTime() - Date.now()) / (1000 * 60 * 60)));
                      const inviteUrl = invite.share_url || `${window.location.origin}/shared/${invite.token}`;
                      const inviteKey = invite.id || invite.token;

                      return (
                        <motion.div variants={itemFadeIn} key={inviteKey} className={cn(
                          "border rounded-[2rem] bg-white p-8 transition-all shadow-soft",
                          isActive ? "border-indigo-100 hover:border-indigo-200" : "border-slate-100 opacity-60"
                        )}>
                          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
                            <div className="flex items-center gap-6 w-full lg:w-auto">
                              <div className={cn(
                                "h-14 w-14 rounded-2xl flex items-center justify-center shrink-0 shadow-sm",
                                isActive ? "bg-indigo-50 text-indigo-600" : isRevoked ? "bg-rose-50 text-rose-500" : "bg-slate-50 text-slate-400"
                              )}>
                                {isActive ? <Link className="h-6 w-6" /> : isRevoked ? <XCircle className="h-6 w-6" /> : <Clock className="h-6 w-6" />}
                              </div>
                              <div className="space-y-2 overflow-hidden flex-1">
                                <div className="flex items-center gap-3 flex-wrap">
                                  <span className={cn(
                                    "px-3 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest border font-mono",
                                    isActive ? "bg-emerald-50 text-emerald-600 border-emerald-100" : isRevoked ? "bg-rose-50 text-rose-600 border-rose-100" : "bg-slate-50 text-slate-500 border-slate-100"
                                  )}>
                                    {isActive ? 'Active' : isRevoked ? 'Revoked' : 'Expired'}
                                  </span>
                                  {isActive && (
                                    <span className="text-[9px] font-black text-amber-600 uppercase tracking-widest flex items-center gap-1">
                                      <Clock className="h-3 w-3" /> {hoursLeft}h remaining
                                    </span>
                                  )}
                                </div>
                                <p className="text-[10px] font-mono font-bold text-slate-400 truncate">
                                  ...{invite.token?.slice(-16)}
                                </p>
                                <p className="text-[9px] text-slate-400 font-mono uppercase tracking-widest">
                                  Created {new Date(invite.created_at).toLocaleDateString()} • Expires {new Date(invite.expires_at).toLocaleDateString()}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-3 w-full lg:w-auto justify-end">
                              {isActive && (
                                <>
                                  <Button
                                    variant="outline"
                                    onClick={() => handleCopyLink(invite)}
                                    className={cn(
                                      "h-12 px-6 rounded-2xl text-[9px] font-black uppercase tracking-widest transition-all",
                                      copiedId === inviteKey
                                        ? "bg-emerald-50 border-emerald-200 text-emerald-600"
                                        : "border-indigo-100 text-indigo-600 hover:bg-indigo-50"
                                    )}
                                  >
                                    {copiedId === inviteKey ? <CheckCircle2 className="h-4 w-4 mr-2" /> : <Copy className="h-4 w-4 mr-2" />}
                                    {copiedId === inviteKey ? 'Copied!' : 'Copy Link'}
                                  </Button>
                                  <Button
                                    variant="outline"
                                    onClick={() => handleRevokeInvite(invite.id)}
                                    className="h-12 px-6 rounded-2xl border-rose-100 text-rose-500 hover:bg-rose-50 hover:text-rose-600 text-[9px] font-black uppercase tracking-widest"
                                  >
                                    <XCircle className="h-4 w-4 mr-2" /> Revoke
                                  </Button>
                                </>
                              )}
                            </div>
                          </div>
                        </motion.div>
                      );
                    }) : (
                      <motion.div variants={itemFadeIn} className="py-20 text-center border border-indigo-100 border-dotted rounded-[3rem] bg-white">
                        <Share2 className="h-12 w-12 text-slate-200 mx-auto mb-6" />
                        <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">No invite links generated yet</p>
                        <p className="text-[9px] text-slate-300 font-bold uppercase tracking-widest mt-2">Click "Generate Invite Link" to create one</p>
                      </motion.div>
                    )}
                  </motion.div>

                  {/* ─── Share Individual Record Section ─── */}
                  <motion.div variants={itemFadeIn} className="pt-12 border-t border-indigo-50 space-y-8">
                    <div className="space-y-2">
                      <h3 className="text-3xl font-black text-indigo-950 italic tracking-tighter font-heading">Share Individual Record<span className="text-indigo-600">.</span></h3>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Generate a time-limited link for a specific medical record</p>
                    </div>

                    {/* Token Generation Form */}
                    <motion.div variants={itemFadeIn} className="border border-indigo-100 rounded-[2.5rem] bg-white shadow-xl p-8 space-y-6">
                      {/* Record Selector */}
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Select Record</label>
                        <div className="relative">
                          <button
                            onClick={() => setShowRecordDropdown(!showRecordDropdown)}
                            className="w-full flex items-center justify-between px-5 py-4 rounded-2xl bg-slate-50 border border-slate-100 hover:border-indigo-200 transition-all text-sm font-bold text-indigo-950"
                          >
                            <span className={cn(!selectedRecordId && "text-slate-300")}>
                              {selectedRecordId
                                ? records.find((r: any) => r.id === selectedRecordId)?.title || "Select a record"
                                : "Select a record to share..."}
                            </span>
                            <ChevronDown className={cn("h-4 w-4 text-slate-400 transition-transform", showRecordDropdown && "rotate-180")} />
                          </button>
                          {showRecordDropdown && (
                            <div className="absolute top-full left-0 right-0 mt-2 max-h-64 overflow-y-auto rounded-2xl bg-white border border-indigo-100 shadow-premium z-50 p-2 animate-in slide-in-from-top-2 duration-200">
                              {records.length > 0 ? records.map((record: any) => (
                                <button
                                  key={record.id}
                                  onClick={() => {
                                    setSelectedRecordId(record.id);
                                    setShowRecordDropdown(false);
                                  }}
                                  className={cn(
                                    "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all",
                                    selectedRecordId === record.id
                                      ? "bg-indigo-50 text-indigo-700"
                                      : "hover:bg-slate-50 text-slate-600"
                                  )}
                                >
                                  <FileText className="h-4 w-4 text-indigo-400 shrink-0" />
                                  <div className="min-w-0">
                                    <p className="text-sm font-bold truncate">{record.title}</p>
                                    <p className="text-[9px] font-mono text-slate-400 uppercase tracking-widest">
                                      {record.record_type} • {new Date(record.created_at).toLocaleDateString()}
                                    </p>
                                  </div>
                                </button>
                              )) : (
                                <p className="text-xs text-slate-400 font-bold text-center py-6">No records uploaded yet</p>
                              )}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Doctor Email</label>
                        <div className="flex flex-wrap gap-2">
                          <input value={accessDocEmail} onChange={(e) => setAccessDocEmail(e.target.value)} placeholder="Doctor Emails, split by (,)" className="w-full px-5 py-4 rounded-2xl bg-slate-50 border border-slate-100 hover:border-indigo-200 focus:border-indigo-300 focus:outline-none transition-all text-sm font-bold text-indigo-950 placeholder:text-slate-300" />
                        </div>
                      </div>

                      {/* Expiry Selector */}
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Access Duration</label>
                        <div className="flex flex-wrap gap-2">
                          {Object.entries(EXPIRY_LABELS).map(([key, label]) => (
                            <button
                              key={key}
                              onClick={() => setSelectedExpiry(key)}
                              className={cn(
                                "px-5 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest border transition-all",
                                selectedExpiry === key
                                  ? "bg-indigo-600 text-white border-indigo-600 shadow-md"
                                  : "bg-white text-slate-500 border-slate-200 hover:border-indigo-200 hover:text-indigo-600"
                              )}
                            >
                              {label}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Generate Button */}
                      <Button
                        onClick={handleGenerateRecordToken}
                        disabled={generatingRecordToken || !selectedRecordId}
                        className="w-full h-16 rounded-3xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:shadow-premium text-white text-[10px] uppercase tracking-widest font-bold disabled:opacity-50 transition-all ring-2 ring-indigo-600/20"
                      >
                        {generatingRecordToken ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <KeyRound className="h-4 w-4 mr-2" />}
                        {generatingRecordToken ? 'Generating Token...' : 'Generate Record Share Link'}
                      </Button>
                    </motion.div>

                    {/* Active Record Tokens List */}
                    <motion.div variants={staggerContainer} className="space-y-6">
                      <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2 italic">Your Record Share Links</h4>
                      {recordTokens.length > 0 ? recordTokens.map(token => {
                        const isExpired = new Date(token.expires_at) < new Date();
                        const isRevoked = token.is_revoked;
                        const isActive = !isExpired && !isRevoked;
                        const hoursLeft = Math.max(0, Math.floor((new Date(token.expires_at).getTime() - Date.now()) / (1000 * 60 * 60)));
                        const daysLeft = Math.floor(hoursLeft / 24);
                        const timeDisplay = daysLeft > 0 ? `${daysLeft}d ${hoursLeft % 24}h` : `${hoursLeft}h`;
                        const recordTitle = token.medical_records?.title || 'Unknown Record';

                        return (
                          <motion.div variants={itemFadeIn} key={token.id} className={cn(
                            "border rounded-[2rem] bg-white p-8 transition-all shadow-soft",
                            isActive ? "border-indigo-100 hover:border-indigo-200" : "border-slate-100 opacity-60"
                          )}>
                            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
                              <div className="flex items-center gap-6 w-full lg:w-auto">
                                <div className={cn(
                                  "h-14 w-14 rounded-2xl flex items-center justify-center shrink-0 shadow-sm",
                                  isActive ? "bg-violet-50 text-violet-600" : isRevoked ? "bg-rose-50 text-rose-500" : "bg-slate-50 text-slate-400"
                                )}>
                                  <KeyRound className="h-6 w-6" />
                                </div>
                                <div className="space-y-2 overflow-hidden flex-1">
                                  <div className="flex items-center gap-3 flex-wrap">
                                    <span className="text-sm font-bold text-indigo-950 truncate">{recordTitle}</span>
                                    <span className={cn(
                                      "px-3 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest border font-mono",
                                      isActive ? "bg-emerald-50 text-emerald-600 border-emerald-100" : isRevoked ? "bg-rose-50 text-rose-600 border-rose-100" : "bg-slate-50 text-slate-500 border-slate-100"
                                    )}>
                                      {isActive ? 'Active' : isRevoked ? 'Revoked' : 'Expired'}
                                    </span>
                                    {isActive && (
                                      <span className="text-[9px] font-black text-amber-600 uppercase tracking-widest flex items-center gap-1">
                                        <Clock className="h-3 w-3" /> {timeDisplay} remaining
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-[10px] font-mono font-bold text-slate-400 truncate">
                                    ...{token.token?.slice(-16)}
                                  </p>
                                  <p className="text-[9px] text-slate-400 font-mono uppercase tracking-widest">
                                    Created {new Date(token.created_at).toLocaleDateString()} • Expires {new Date(token.expires_at).toLocaleDateString()}
                                    {token.claimed_by?.length > 0 && ` • ${token.claimed_by.length} doctor(s) accessed`}
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center gap-3 w-full lg:w-auto justify-end">
                                {isActive && (
                                  <>
                                    <Button
                                      variant="outline"
                                      onClick={() => handleCopyRecordTokenLink(token)}
                                      className={cn(
                                        "h-12 px-6 rounded-2xl text-[9px] font-black uppercase tracking-widest transition-all",
                                        copiedId === token.id
                                          ? "bg-emerald-50 border-emerald-200 text-emerald-600"
                                          : "border-indigo-100 text-indigo-600 hover:bg-indigo-50"
                                      )}
                                    >
                                      {copiedId === token.id ? <CheckCircle2 className="h-4 w-4 mr-2" /> : <Copy className="h-4 w-4 mr-2" />}
                                      {copiedId === token.id ? 'Copied!' : 'Copy Link'}
                                    </Button>
                                    <Button
                                      variant="outline"
                                      onClick={() => handleRevokeRecordToken(token.id)}
                                      className="h-12 px-6 rounded-2xl border-rose-100 text-rose-500 hover:bg-rose-50 hover:text-rose-600 text-[9px] font-black uppercase tracking-widest"
                                    >
                                      <XCircle className="h-4 w-4 mr-2" /> Revoke
                                    </Button>
                                  </>
                                )}
                              </div>
                            </div>
                          </motion.div>
                        );
                      }) : (
                        <motion.div variants={itemFadeIn} className="py-16 text-center border border-violet-100 border-dotted rounded-[3rem] bg-white">
                          <KeyRound className="h-12 w-12 text-slate-200 mx-auto mb-6" />
                          <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">No record share links generated yet</p>
                          <p className="text-[9px] text-slate-300 font-bold uppercase tracking-widest mt-2">Select a record above and generate a share link</p>
                        </motion.div>
                      )}
                    </motion.div>
                  </motion.div>
                </motion.div>
              )}

              {activeTab === 'security' && (
                <motion.div variants={fadeIn} initial="hidden" animate="visible">
                  <AccessLogs patientId={user?.id || ""} />
                </motion.div>
              )}

            </div>

            {/* Persistent Sidebar Info (Only for non-Hub tabs) */}
            {activeTab !== 'dashboard' && (
              <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="lg:w-[35%] space-y-12">
                {/* Health Score Card */}
                <motion.div variants={itemFadeIn} className="bg-white border border-indigo-100 rounded-[2.5rem] p-10 shadow-xl relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:scale-150 transition-transform duration-1000" />
                  <div className="text-center space-y-10 relative z-10">
                    <div className="space-y-2">
                      <h4 className="text-[10px] font-black text-indigo-400 uppercase tracking-widest italic">Health Sync Level</h4>
                      <div className="text-7xl font-black text-indigo-950 tracking-tighter italic font-heading">{healthScore}%</div>
                    </div>

                    <div className="relative h-3 w-full bg-slate-100 rounded-full overflow-hidden p-0.5 border border-slate-200/50">
                      <div
                        className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full transition-all duration-1000 ease-out shadow-sm"
                        style={{ width: `${healthScore}%` }}
                      />
                    </div>

                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest leading-relaxed">
                      Medical profile <span className="text-indigo-600">{healthScore}%</span> synchronized across clinical nodes.
                    </p>

                    {/* Status Mini-Grid */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-left space-y-2 p-6 rounded-2xl bg-indigo-50/50 border border-indigo-50">
                        <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest italic">Sync Status</div>
                        <div className="flex items-center gap-2 cursor-default">
                          <div className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                          <span className="text-[10px] font-black text-indigo-900 uppercase tracking-widest font-mono">Optimized</span>
                        </div>
                      </div>
                      <div className="text-left space-y-2 p-6 rounded-2xl bg-indigo-50/50 border border-indigo-50">
                        <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest italic">Clinical Node</div>
                        <div className="flex items-center gap-2 cursor-default text-indigo-600">
                          <Activity className="h-3.5 w-3.5" />
                          <span className="text-[10px] font-black uppercase tracking-widest font-mono">Primary-V3</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>

                <motion.div variants={itemFadeIn} className="p-8 rounded-[2.5rem] bg-indigo-950 text-white space-y-6 shadow-2xl relative overflow-hidden group">
                  <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                  <div className="flex items-center gap-4 relative z-10">
                    <div className="h-10 w-10 rounded-xl bg-indigo-600 flex items-center justify-center">
                      <ShieldCheck className="h-5 w-5" />
                    </div>
                    <h4 className="text-[10px] font-black uppercase tracking-widest leading-none">Terminal Encryption</h4>
                  </div>
                  <p className="text-[10px] text-indigo-200 font-bold leading-relaxed uppercase tracking-widest relative z-10">
                    Sovereign end-to-end clinical protection active.
                  </p>
                </motion.div>

                <motion.div variants={itemFadeIn}>
                  <SystemActivityLog />
                </motion.div>
              </motion.div>
            )}
          </div>
        </div>

        {/* Branding & Versioning */}
        <footer className="pt-24 border-t border-slate-200 flex flex-col md:flex-row justify-between items-end gap-10">
          <div className="space-y-3">
            <h3 className="text-3xl font-black text-indigo-950 italic tracking-tighter font-heading">Byteus.</h3>
            <div className="flex items-center gap-4">
              <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest font-mono bg-white shadow-sm px-3 py-1 rounded-full border border-slate-100 selection:bg-slate-200">v1.2.0 — Enterprise Sentinel</span>
              <div className="h-px w-8 bg-slate-200" />
            </div>
          </div>
          <p className="max-w-md text-[9px] font-bold text-slate-400 uppercase tracking-widest text-right leading-relaxed font-mono italic">
            Authorized clinical instrument. All cryptographic signatures are verified by sovereign authorities. Unauthorized access attempts are logged and reported.
          </p>
        </footer>
      </motion.div>

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
