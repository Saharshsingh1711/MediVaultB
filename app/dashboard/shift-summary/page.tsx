'use client'

import React, { useState, useEffect } from "react";
import { GlassCard } from "@/components/GlassCard";
import { Button } from "@/components/Button";
import { scanCriticalInsights } from "@/lib/utils/kmp";
import { Loader2, Activity, Zap, Shield, AlertTriangle, ChevronRight, Search, FileText } from "lucide-react";
import { cn } from "@/lib/utils";

// Keywords to scan using KMP
const CRITICAL_KEYWORDS = ["Diabetes", "Asthma", "Allergy", "Cardiac", "Chronic", "Hypertension", "Epilepsy", "Penicillin"];

interface MedicalRecord {
  id: string;
  title: string;
  content: string;
  record_type: string;
  is_emergency_flag: boolean;
  created_at: string;
}

export default function ShiftSummaryPage() {
  const [records, setRecords] = useState<MedicalRecord[]>([]);
  const [insights, setInsights] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      // In a real app, this would fetch from Supabase
      const mockRecords: MedicalRecord[] = [
        {
          id: "1",
          title: "Annual Health Report",
          content: "Patient shows history of Diabetes and Mild Hypertension. Routine blood sugar monitoring required.",
          record_type: "Lab Report",
          is_emergency_flag: true,
          created_at: "2024-03-20"
        },
        {
          id: "2",
          title: "Prescription Update",
          content: "Prescribed inhaler for chronic Asthma. Avoid contact with known allergens.",
          record_type: "Prescription",
          is_emergency_flag: true,
          created_at: "2024-03-25"
        },
        {
          id: "3",
          title: "Emergency Intake",
          content: "Cardiac monitoring initiated. Patient allergic to Penicillin.",
          record_type: "Surgery",
          is_emergency_flag: true,
          created_at: "2024-03-28"
        }
      ];

      setRecords(mockRecords);
      
      // Combine all raw text content for KMP scanning
      const combinedText = mockRecords.map(r => r.content).join(" ");
      const foundInsights = scanCriticalInsights(combinedText, CRITICAL_KEYWORDS);
      
      setInsights(foundInsights.slice(0, 5)); // Limit to Top 5
      setLoading(false);
    }

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FBFBFF] flex flex-col items-center justify-center gap-8 relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-100/50 rounded-full blur-[100px] animate-pulse" />
        <div className="relative">
            <div className="h-24 w-24 rounded-full border-4 border-indigo-50 border-t-indigo-600 animate-spin shadow-soft" />
            <div className="absolute inset-0 flex items-center justify-center text-indigo-600">
                <Zap className="h-8 w-8 animate-pulse" />
            </div>
        </div>
        <div className="text-center space-y-3 relative z-10">
            <h2 className="text-2xl font-black text-indigo-950 uppercase tracking-tighter italic font-heading">KMP Intelligence Analysis.</h2>
            <p className="text-[10px] text-indigo-400 font-black uppercase tracking-[0.3em] animate-pulse">Running Linear-Time Pattern Matching</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FBFBFF] px-6 py-32 relative overflow-hidden selection:bg-indigo-100 selection:text-indigo-950 font-sans">
      {/* Background effects */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-indigo-100/30 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-violet-100/30 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-7xl mx-auto space-y-16 relative z-10">
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-8 pb-10 border-b border-indigo-50">
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-2xl bg-amber-50 flex items-center justify-center text-amber-500 shadow-soft rotate-3">
                <Zap className="h-7 w-7" />
              </div>
              <h1 className="text-5xl font-black text-indigo-950 tracking-tighter italic font-heading">Shift <span className="text-indigo-600">Snapshot.</span></h1>
            </div>
            <p className="text-lg text-slate-400 font-bold uppercase tracking-widest text-[10px] italic max-w-2xl bg-white px-4 py-2 rounded-xl border border-indigo-50 w-fit">
              Medical intelligence patterns identified across clinical wallet via KMP indexing protocols.
            </p>
          </div>
          <div className="flex gap-4">
             <Button variant="outline" className="h-14 px-8 rounded-2xl border-indigo-100 italic font-black uppercase tracking-widest text-[10px] shadow-soft">
                Re-Index Wallet
             </Button>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Top 5 Critical Insights Card */}
          <GlassCard className="lg:col-span-1 border-indigo-50 bg-white shadow-premium p-10 rounded-[3rem] space-y-10 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50/50 rounded-full blur-3xl -mr-10 -mt-10" />
            
            <div className="space-y-10 relative z-10">
              <div className="flex items-center justify-between">
                <h3 className="text-2xl font-black text-indigo-950 uppercase tracking-tighter italic font-heading">Deep <span className="text-indigo-600">Scan.</span></h3>
                <Shield className="h-7 w-7 text-indigo-600" />
              </div>
              
              <div className="space-y-4">
                {insights.length > 0 ? (
                  insights.map((insight, idx) => (
                    <div 
                      key={idx} 
                      className={cn(
                        "p-6 rounded-[1.5rem] border flex items-center justify-between transition-all hover:scale-[1.05] shadow-soft",
                        ["Diabetes", "Asthma", "Cardiac"].includes(insight) 
                        ? 'bg-rose-50 border-rose-100 text-rose-600' 
                        : 'bg-white border-indigo-50 text-indigo-950'
                      )}
                    >
                      <div className="flex items-center gap-4">
                        <Activity className="h-5 w-5 opacity-50" />
                        <span className="font-black uppercase tracking-widest text-[11px] italic">{insight} Trigger</span>
                      </div>
                      {["Diabetes", "Asthma", "Cardiac"].includes(insight) && (
                        <AlertTriangle className="h-5 w-5 animate-pulse" />
                      )}
                    </div>
                  ))
                ) : (
                  <p className="text-slate-300 text-center py-20 italic font-black uppercase tracking-[0.3em] text-[10px]">Registry Scan Clear.</p>
                )}
              </div>
              
              <Button variant="premium" className="w-full h-16 rounded-2xl shadow-premium uppercase tracking-[0.2em] text-[10px] flex gap-3">
                Export Intelligence Report
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </GlassCard>

          {/* Records Scanned */}
          <div className="lg:col-span-2 space-y-10">
            <h3 className="text-2xl font-black text-indigo-950 uppercase tracking-tighter italic font-heading ml-2 border-l-4 border-indigo-600 pl-6">Verified <span className="text-indigo-600">Registry.</span></h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {records.map(record => (
                <GlassCard key={record.id} className="border-indigo-50 bg-white/50 hover:bg-white hover:border-indigo-200 transition-all p-8 rounded-[2.5rem] shadow-soft group">
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div className="px-4 py-1 rounded-full bg-indigo-50 text-indigo-600 text-[9px] font-black uppercase tracking-widest">
                        {record.record_type}
                      </div>
                      <span className="text-[10px] font-black text-slate-300 font-mono italic">{record.created_at}</span>
                    </div>
                    <div className="space-y-2">
                        <h4 className="text-2xl font-black text-indigo-950 uppercase tracking-tighter italic font-heading group-hover:text-indigo-600 transition-colors uppercase">{record.title}</h4>
                        <p className="text-sm text-slate-500 font-bold leading-relaxed italic border-l-2 border-indigo-50 pl-4 py-1">
                          {record.content}
                        </p>
                    </div>
                    <div className="pt-4 flex justify-end">
                        <Button variant="ghost" className="h-10 px-4 rounded-xl border border-indigo-50 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                            <FileText className="h-4 w-4" />
                        </Button>
                    </div>
                  </div>
                </GlassCard>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
