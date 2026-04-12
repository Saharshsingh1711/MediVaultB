'use client'

import React, { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { SB_TABLES } from "@/lib/supabase/tables";
import { getUserRole } from "@/lib/supabase/roles";
import { GlassCard } from "@/components/GlassCard";
import { Button } from "@/components/Button";
import { scanCriticalInsights } from "@/lib/utils/kmp";
import { Shield, AlertCircle, Phone, Heart, Activity, Loader2, Hospital, Stethoscope, Mail, MapPin, ChevronRight, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

const CRITICAL_KEYWORDS = ["Diabetes", "Asthma", "Allergy", "Cardiac", "Chronic", "Hypertension", "Epilepsy", "Penicillin"];

export default function TriagePage({ params }: { params: { id: string } }) {
  const [patient, setPatient] = useState<any>(null);
  const [records, setRecords] = useState<any[]>([]);
  const [criticalInsights, setCriticalInsights] = useState<string[]>([]);
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    async function authorizeAndFetch() {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setIsAuthorized(false);
        setLoading(false);
        return;
      }

      const role = await getUserRole(user.id);
      if (role !== "doctor") {
        setIsAuthorized(false);
        setLoading(false);
        return;
      }

      setIsAuthorized(true);

      // Fetch Patient Data
      const { data: patientData } = await supabase
        .from(SB_TABLES.user_patient)
        .select('*')
        .eq('user_id', params.id)
        .single();

      if (patientData) {
        setPatient(patientData);

        // Fetch Medical Records
        const { data: recordsData } = await supabase
          .from(SB_TABLES.medical_records)
          .select('*')
          .eq('patient_id', params.id);

        if (recordsData) {
          setRecords(recordsData);
          const combinedText = recordsData.map(r => r.raw_data || "").join(" ");
          const insights = scanCriticalInsights(combinedText, CRITICAL_KEYWORDS);
          setCriticalInsights(insights);
        }

        // LOG ACCESS
        await supabase.from(SB_TABLES.access_logs).insert({
          patient_id: params.id,
          doctor_id: user.id,
          doctor_name: user.email?.split('@')[0] || "Verified Doctor",
          action: "EMERGENCY_TRIAGE_ACCESS",
          metadata: { hospital: "GENERAL_EMERGENCY", timestamp: new Date().toISOString() }
        });
      }

      setLoading(false);
    }

    authorizeAndFetch();
  }, [params.id, supabase]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FBFBFF] flex flex-col items-center justify-center gap-8 relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-100/50 rounded-full blur-[100px] animate-pulse" />
        <div className="relative">
            <div className="h-24 w-24 rounded-full border-4 border-indigo-50 border-t-indigo-600 animate-spin shadow-soft" />
            <div className="absolute inset-0 flex items-center justify-center">
                <Shield className="h-8 w-8 text-indigo-600 animate-pulse" />
            </div>
        </div>
        <div className="text-center space-y-3 relative z-10">
            <h2 className="text-2xl font-black text-indigo-950 uppercase tracking-tighter italic font-heading">Secure Access Sync.</h2>
            <p className="text-[10px] text-indigo-400 font-bold uppercase tracking-[0.3em] animate-pulse">Verification Protocol Active</p>
        </div>
      </div>
    );
  }

  if (isAuthorized === false) {
    return (
      <div className="min-h-screen bg-[#FBFBFF] flex flex-col items-center justify-center p-6 text-center">
        <GlassCard className="max-w-md p-12 border-rose-100 bg-white shadow-premium rounded-[3rem] flex flex-col items-center gap-8">
            <div className="h-24 w-24 rounded-3xl bg-rose-50 flex items-center justify-center text-rose-600 shadow-soft rotate-6">
                <Shield className="h-12 w-12" />
            </div>
            <div className="space-y-4">
                <h2 className="text-3xl font-black text-indigo-950 uppercase tracking-tighter italic font-heading">Access Blocked.</h2>
                <p className="text-sm text-slate-400 font-bold uppercase tracking-widest leading-relaxed px-4">
                    Clinical authorization failed. This medical vault is protected by sovereign encryption.
                </p>
            </div>
            <a href="/login?role=doctor" className="w-full">
                <Button variant="premium" className="w-full h-16 rounded-2xl shadow-premium uppercase tracking-widest text-[10px]">
                    Verify Clinical Credentials
                </Button>
            </a>
        </GlassCard>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FBFBFF] px-6 py-12 relative overflow-hidden font-sans pb-40 selection:bg-rose-100 selection:text-rose-950">
       {/* Emergency Indicators */}
      <div className="fixed top-0 left-0 w-full h-2 bg-rose-600 z-[100] animate-pulse shadow-premium shadow-rose-600/20" />
      
      {/* Decorative Background Elements */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-rose-50/50 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-40 left-0 w-[500px] h-[500px] bg-indigo-50/50 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-5xl mx-auto space-y-16 relative z-10">
        
        {/* Patient Identity */}
        <div className="text-center space-y-8 pt-10">
           <div className="inline-flex items-center gap-3 px-6 py-2 rounded-full bg-rose-50 border border-rose-100 text-rose-600 text-[10px] font-black uppercase tracking-[0.3em] shadow-soft">
              <Hospital className="h-4 w-4" /> EMERGENCY PROTOCOL: GH-001
           </div>
           <div className="space-y-4">
                <h1 className="text-7xl font-black text-indigo-950 uppercase tracking-tighter italic font-heading">
                    {patient?.first_name} <span className="text-rose-600">{patient?.second_name}</span>
                </h1>
                <div className="flex items-center justify-center gap-8">
                    <div className="flex flex-col items-center">
                        <span className="text-2xl font-black text-rose-600 uppercase tracking-[0.2em] font-heading">{patient?.blood_group}</span>
                        <span className="text-[8px] font-black text-slate-300 uppercase tracking-widest">Blood Type</span>
                    </div>
                    <div className="h-10 w-px bg-slate-100" />
                    <div className="flex flex-col items-center">
                        <span className="text-2xl font-black text-indigo-950 uppercase tracking-[0.2em] font-heading">{patient?.age}</span>
                        <span className="text-[8px] font-black text-slate-300 uppercase tracking-widest">Biological Age</span>
                    </div>
                </div>
           </div>
        </div>

        {/* Critical AI Insights */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
           {criticalInsights.length > 0 ? criticalInsights.map((insight, idx) => (
             <div key={idx} className="p-8 bg-white border border-rose-100 rounded-[2.5rem] flex items-center gap-8 relative overflow-hidden group shadow-premium hover:scale-[1.02] transition-transform">
                <div className="absolute inset-0 bg-rose-50/30 animate-pulse group-hover:bg-rose-50/50 transition-colors" />
                <div className="h-16 w-16 rounded-[1.5rem] bg-rose-600/10 flex items-center justify-center text-rose-600 shadow-soft relative z-10">
                    <AlertCircle className="h-8 w-8" />
                </div>
                <div className="relative z-10 space-y-1">
                    <h4 className="text-rose-600 font-black uppercase tracking-tight text-3xl font-heading italic">{insight}</h4>
                    <p className="text-[10px] text-rose-400 font-black uppercase tracking-[0.3em] italic">Critical Marker Confirmed</p>
                </div>
             </div>
           )) : (
             <div className="md:col-span-2 p-10 bg-emerald-50 border border-emerald-100 rounded-[3rem] flex items-center gap-8 shadow-soft">
                <div className="h-16 w-16 rounded-[1.5rem] bg-emerald-100 flex items-center justify-center text-emerald-600 shadow-soft">
                    <Shield className="h-8 w-8" />
                </div>
                <div className="space-y-1">
                    <h4 className="text-emerald-600 font-black uppercase tracking-tight text-3xl font-heading italic">Negative Marker Scan</h4>
                    <p className="text-[10px] text-emerald-400 font-black uppercase tracking-[0.3em] italic">No Critical Biological Alerts Detected</p>
                </div>
             </div>
           )}
        </div>

        {/* Vital Contacts */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            <GlassCard className="border-indigo-50 bg-white p-10 rounded-[3rem] shadow-soft space-y-8">
                <div className="flex items-center gap-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] italic">
                    <Phone className="h-4 w-4" /> Emergency Baseline
                </div>
                <div className="space-y-8">
                    <div className="flex items-center justify-between group">
                        <div className="space-y-2">
                            <p className="text-[9px] font-black text-indigo-600 uppercase tracking-widest italic">Primary Kinsman</p>
                            <h4 className="text-2xl font-black text-indigo-950 uppercase tracking-tighter italic font-heading">{patient?.emergency_contact_name}</h4>
                        </div>
                        <a href={`tel:${patient?.emergency_contact_phone}`}>
                            <button className="h-16 w-16 rounded-[1.5rem] bg-indigo-600 text-white flex items-center justify-center shadow-premium hover:scale-110 transition-transform">
                                <Phone className="h-6 w-6" />
                            </button>
                        </a>
                    </div>
                </div>
            </GlassCard>

            <GlassCard className="border-indigo-50 bg-white p-10 rounded-[3rem] shadow-soft space-y-8">
                 <div className="flex items-center gap-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] italic">
                    <MapPin className="h-4 w-4" /> Biological Origin
                </div>
                <div className="space-y-4">
                    <div className="space-y-2">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest italic">Registered Domain</p>
                        <p className="text-lg font-black text-indigo-950 uppercase tracking-tighter italic font-heading leading-tight">{patient?.address}</p>
                    </div>
                </div>
            </GlassCard>
        </div>

        {/* Clinical Documentation Artifacts */}
        <div className="space-y-10">
             <div className="flex items-center justify-between px-2">
                <h3 className="text-3xl font-black text-indigo-950 uppercase tracking-tighter italic font-heading">Vault <span className="text-indigo-600">Artifacts.</span></h3>
                <span className="text-[10px] font-black text-rose-500 uppercase tracking-widest italic animate-pulse">Clinical Scan Logged</span>
             </div>
             <div className="space-y-8">
                {records.map(record => (
                  <GlassCard key={record.id} className="border-indigo-50 hover:border-indigo-200 transition-all p-10 bg-white shadow-soft rounded-[3rem]">
                     <div className="space-y-8">
                        <div className="flex items-center justify-between">
                             <div className="flex items-center gap-5">
                                <div className="h-10 w-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 shadow-soft">
                                    <Activity className="h-5 w-5" />
                                </div>
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">{record.record_type}</span>
                             </div>
                             <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest font-mono italic">{new Date(record.created_at).toLocaleDateString()}</span>
                        </div>
                        <h4 className="text-3xl font-black text-indigo-950 uppercase tracking-tighter italic font-heading">{record.title}</h4>
                        <div className="p-8 rounded-[2rem] bg-slate-50 border border-slate-100 relative group hover:bg-white hover:border-indigo-100 transition-all shadow-inner">
                            <div className="absolute top-6 right-6 text-slate-200 group-hover:text-indigo-300 transition-colors"><Mail className="h-6 w-6" /></div>
                            <p className="text-sm text-slate-500 font-bold leading-relaxed italic border-l-4 border-indigo-200 pl-8">
                                {record.raw_data || "Awaiting intelligence extraction by sovereign scanner..."}
                            </p>
                        </div>
                     </div>
                  </GlassCard>
                ))}
             </div>
        </div>

      </div>

      {/* Floating Action for Doctor */}
      <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[100] w-full max-w-sm px-6">
         <GlassCard className="bg-white/80 border-indigo-50 backdrop-blur-2xl shadow-premium flex items-center justify-between p-6 rounded-[2rem]">
            <div className="flex items-center gap-5">
                <div className="h-12 w-12 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-soft">
                    <Stethoscope className="h-7 w-7" />
                </div>
                <div>
                    <h4 className="text-[11px] font-black text-indigo-950 uppercase tracking-widest italic">Clinical Access</h4>
                    <p className="text-[9px] text-indigo-400 font-bold uppercase tracking-widest italic">Protocol Verified</p>
                </div>
            </div>
            <Button 
                variant="outline" 
                onClick={() => window.history.back()}
                className="text-[9px] font-black uppercase tracking-widest border-indigo-100 hover:bg-indigo-50 h-10 px-4 rounded-xl shadow-soft"
            >
                Exit Protocol
            </Button>
         </GlassCard>
      </div>

    </div>
  );
}
