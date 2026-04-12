'use client'

import React, { useState, useEffect } from "react";
import { GlassCard } from "@/components/GlassCard";
import { Button } from "@/components/Button";
import { scanCriticalInsights } from "@/lib/utils/kmp";
import { Shield, AlertCircle, Phone, MapPin, Heart, Activity, Loader2, Hospital, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

const CRITICAL_KEYWORDS = ["Diabetes", "Asthma", "Allergy", "Cardiac", "Chronic", "Hypertension", "Epilepsy", "Penicillin"];

interface PatientData {
  first_name: string;
  second_name: string;
  blood_group: string;
  emergency_contact_phone: string;
  emergency_contact_name: string;
}

interface MedicalRecord {
  id: string;
  title: string;
  content: string;
  record_type: string;
  is_emergency_flag: boolean;
}

export default function EmergencyTriageView({ params }: { params: { id: string } }) {
  const [patient, setPatient] = useState<PatientData | null>(null);
  const [criticalInsights, setCriticalInsights] = useState<string[]>([]);
  const [records, setRecords] = useState<MedicalRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchEmergencyData() {
      // In a real app, this would fetch from Supabase (using a public or authorized key)
      const mockPatient = {
        first_name: "Saharsh",
        second_name: "Singh",
        blood_group: "O+",
        emergency_contact_name: "Anubhav Anand",
        emergency_contact_phone: "+1 234 567 890"
      };

      const mockRecords: MedicalRecord[] = [
        {
          id: "1",
          title: "Chronic Allergies",
          content: "Patient is allergic to Penicillin and Shellfish. Severe Asthma history.",
          record_type: "Prescription",
          is_emergency_flag: true
        },
        {
          id: "2",
          title: "Cardiac History",
          content: "Previous cardiac monitoring. No active medication. Diabetes managed with diet.",
          record_type: "Lab Report",
          is_emergency_flag: true
        }
      ];

      setPatient(mockPatient);
      setRecords(mockRecords);
      
      const combinedText = mockRecords.map(r => r.content).join(" ");
      const foundInsights = scanCriticalInsights(combinedText, CRITICAL_KEYWORDS);
      setCriticalInsights(foundInsights);
      setLoading(false);
    }

    fetchEmergencyData();
  }, [params.id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FBFBFF] flex flex-col items-center justify-center gap-8 relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-rose-100/50 rounded-full blur-[100px] animate-pulse" />
        <div className="relative">
            <div className="h-24 w-24 rounded-full border-4 border-rose-50 border-t-rose-600 animate-spin shadow-soft" />
            <div className="absolute inset-0 flex items-center justify-center text-rose-600">
                <Heart className="h-8 w-8 animate-pulse" />
            </div>
        </div>
        <div className="text-center space-y-3 relative z-10">
            <h2 className="text-2xl font-black text-indigo-950 uppercase tracking-tighter italic font-heading">Protocol Initialization.</h2>
            <p className="text-[10px] text-rose-500 font-black uppercase tracking-[0.3em] animate-pulse">Accessing Sovereign Biological Data</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FBFBFF] px-6 py-12 relative overflow-hidden font-sans pb-40 selection:bg-rose-100 selection:text-rose-950">
      {/* High-visibility Emergency Header */}
      <div className="fixed top-0 left-0 w-full h-2 bg-rose-600 z-[100] animate-pulse shadow-premium shadow-rose-600/20" />
      <div className="fixed top-2 left-0 w-full h-16 bg-white/80 backdrop-blur-xl flex items-center justify-center gap-4 border-b border-rose-100 z-[90] shadow-soft">
        <div className="h-8 w-8 rounded-lg bg-rose-600 flex items-center justify-center text-white shadow-soft">
            <Shield className="h-5 w-5" />
        </div>
        <span className="text-rose-600 font-black uppercase tracking-[0.3em] text-[10px] italic">Emergency Protocol GH-001 Verified for clinical scan</span>
      </div>

      {/* Decorative Background Elements */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-rose-50/50 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-40 left-0 w-[500px] h-[500px] bg-indigo-50/50 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-4xl mx-auto pt-24 space-y-16 relative z-10">
        {/* Patient Hero Info */}
        <div className="text-center space-y-10">
          <div className="inline-flex h-20 w-20 rounded-[2rem] bg-rose-50 border border-rose-100 items-center justify-center text-rose-600 shadow-soft rotate-3 hover:rotate-0 transition-transform">
            <Heart className="h-10 w-10" />
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
                    <span className="text-2xl font-black text-indigo-950 uppercase tracking-[0.2em] font-heading">{params.id.slice(0, 8)}</span>
                    <span className="text-[8px] font-black text-slate-300 uppercase tracking-widest">Vault ID</span>
                </div>
            </div>
          </div>
        </div>

        {/* Critical Alerts (KMP Derived) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {criticalInsights.map((insight, idx) => (
            <div key={idx} className="p-8 bg-white border border-rose-100 rounded-[2.5rem] flex items-center gap-8 relative overflow-hidden group shadow-premium hover:scale-[1.02] transition-transform">
              <div className="absolute inset-0 bg-rose-50/30 animate-pulse group-hover:bg-rose-50/50 transition-colors" />
              <div className="h-16 w-16 rounded-[1.5rem] bg-rose-600/10 flex items-center justify-center text-rose-600 shadow-soft relative z-10">
                <AlertCircle className="h-8 w-8" />
              </div>
              <div className="relative z-10 space-y-1">
                <h4 className="text-rose-600 font-black uppercase tracking-tight text-3xl font-heading italic">{insight}</h4>
                <p className="text-[10px] text-rose-400 font-black uppercase tracking-[0.3em] italic">Intelligence Marker</p>
              </div>
            </div>
          ))}
        </div>

        {/* Quick Contacts */}
        <div className="space-y-8">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] ml-2 italic">Emergency Surveillance Contacts</h3>
            <GlassCard className="border-indigo-50 bg-white p-10 rounded-[3rem] shadow-soft">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-10">
                <div className="flex items-center gap-8">
                  <div className="h-20 w-20 rounded-3xl bg-indigo-50 flex items-center justify-center text-indigo-600 shadow-soft">
                    <Phone className="h-10 w-10" />
                  </div>
                  <div className="space-y-2">
                    <h4 className="text-3xl font-black text-indigo-950 uppercase tracking-tighter italic font-heading">{patient?.emergency_contact_name}</h4>
                    <p className="text-indigo-600 font-black uppercase tracking-widest text-[9px] italic bg-indigo-50 px-3 py-1 rounded-full w-fit">Primary Kinsman Protocol</p>
                  </div>
                </div>
                <a 
                  href={`tel:${patient?.emergency_contact_phone}`} 
                  className="w-full md:w-auto"
                >
                  <Button variant="premium" className="w-full h-20 px-12 rounded-[2rem] shadow-premium text-xl uppercase tracking-tighter">
                    Initialize Call
                  </Button>
                </a>
              </div>
            </GlassCard>
        </div>

        {/* Medical History Summary (Emergency Flagged Only) */}
        <div className="space-y-10">
          <div className="flex items-center justify-between px-2">
            <h3 className="text-3xl font-black text-indigo-950 uppercase tracking-tighter italic font-heading">Critical <span className="text-rose-600">Documentation.</span></h3>
            <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest italic font-mono">Archive Access Active</span>
          </div>
          <div className="space-y-8">
            {records.map(record => (
              <GlassCard key={record.id} className="border-rose-100 hover:border-rose-300 transition-all p-10 bg-white shadow-soft rounded-[3.5rem] group">
                <div className="space-y-8">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-5">
                      <div className="h-10 w-10 rounded-xl bg-rose-50 flex items-center justify-center text-rose-600 shadow-soft group-hover:scale-110 transition-transform">
                        <Activity className="h-5 w-5" />
                      </div>
                      <span className="text-[10px] font-black text-rose-500 uppercase tracking-widest italic">{record.record_type}</span>
                    </div>
                    <div className="h-2 w-2 rounded-full bg-rose-600 animate-ping" />
                  </div>
                  <h4 className="text-4xl font-black text-indigo-950 uppercase tracking-tighter italic font-heading leading-tight">{record.title}</h4>
                  <div className="p-10 rounded-[2.5rem] bg-rose-50/30 border border-rose-50 relative shadow-inner">
                    <p className="text-lg text-rose-950 font-bold leading-relaxed italic border-l-4 border-rose-200 pl-10 py-2">
                      {record.content}
                    </p>
                  </div>
                </div>
              </GlassCard>
            ))}
          </div>
        </div>
      </div>
      
      {/* Footer Branding */}
      <footer className="max-w-4xl mx-auto pt-40 pb-20 opacity-20 hover:opacity-100 transition-all text-center space-y-4 group">
          <h4 className="text-4xl font-black text-indigo-950 italic tracking-tighter font-heading">Byteus Instrument.</h4>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] italic">Clinical Surveillance Cluster Active — Protocol GH-001</p>
      </footer>
    </div>
  );
}
