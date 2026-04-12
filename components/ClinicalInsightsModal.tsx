'use client'

import React from "react";
import { GlassCard } from "./GlassCard";
import { Button } from "./Button";
import { ShieldAlert, CheckCircle, Search, Mail, X, Activity, Scan, ShieldCheck, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface ClinicalInsightsModalProps {
  isOpen: boolean;
  onClose: () => void;
  matches: string[];
  patientName: string;
  isScanning: boolean;
}

export default function ClinicalInsightsModal({ isOpen, onClose, matches, patientName, isScanning }: ClinicalInsightsModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-indigo-950/20 backdrop-blur-xl animate-in fade-in duration-300">
      <div className="max-w-2xl w-full relative z-10 animate-in zoom-in-95 duration-500">
        <GlassCard className="border-indigo-50/50 shadow-premium p-8 md:p-10 bg-white/95 backdrop-blur-md max-h-[85vh] overflow-y-auto custom-scrollbar">
          <button 
              onClick={onClose}
              className="absolute top-8 right-8 text-slate-400 hover:text-indigo-600 transition-colors p-2 hover:bg-indigo-50 rounded-xl"
          >
              <X className="h-5 w-5" />
          </button>

          <div className="space-y-10">
            <header className="flex items-center gap-5">
              <div className={cn(
                "h-14 w-14 rounded-2xl flex items-center justify-center shadow-premium transform -rotate-3 transition-colors duration-500",
                isScanning ? "bg-indigo-600 text-white" : matches.length > 0 ? "bg-rose-600 text-white" : "bg-emerald-600 text-white"
              )}>
                {isScanning ? <Search className="h-7 w-7 animate-spin" /> : matches.length > 0 ? <ShieldAlert className="h-7 w-7" /> : <ShieldCheck className="h-7 w-7" />}
              </div>
              <div>
                <h2 className="text-3xl font-black text-indigo-950 tracking-tighter font-heading italic">Clinical <span className="not-italic text-indigo-600">Intelligence.</span></h2>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Sovereign Target: <span className="text-indigo-600 italic">{patientName}</span></p>
              </div>
            </header>

            {isScanning ? (
              <div className="py-12 space-y-8 flex flex-col items-center justify-center">
                  <div className="relative">
                    <div className="h-24 w-24 rounded-full border-4 border-indigo-50 flex items-center justify-center relative overflow-hidden">
                      <div className="absolute inset-0 bg-indigo-500/10 animate-pulse" />
                      <Scan className="h-10 w-10 text-indigo-600 animate-pulse" />
                    </div>
                  </div>
                  <div className="space-y-3 text-center">
                    <p className="text-sm font-black text-indigo-950 uppercase tracking-widest animate-pulse">Pattern Matching Active</p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono">Real-time KMP Pattern Scanning: 0.2ms latency</p>
                  </div>
              </div>
            ) : (
              <div className="space-y-8">
                {matches.length > 0 ? (
                  <>
                    <div className="p-5 rounded-2xl bg-rose-50 border border-rose-100 text-rose-600 text-xs font-black flex items-center gap-3 uppercase tracking-widest animate-pulse shadow-soft">
                      <ShieldAlert className="h-5 w-5" />
                      Critical Emergency Markers Detected
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      {matches.map((insight, i) => (
                        <div key={i} className="p-5 rounded-3xl bg-white border border-rose-50 flex flex-col gap-1 group hover:border-rose-100 transition-all shadow-soft hover:shadow-premium">
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest font-mono">Marker ID</span>
                          <span className="text-xl font-black text-indigo-950 uppercase tracking-tighter italic font-heading group-hover:text-rose-600 transition-colors">{insight}</span>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="py-16 flex flex-col items-center justify-center gap-6 bg-emerald-50/50 rounded-[2.5rem] border border-emerald-100 shadow-soft">
                      <div className="h-16 w-16 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 shadow-soft">
                        <CheckCircle className="h-8 w-8" />
                      </div>
                      <div className="text-center space-y-2">
                          <p className="text-2xl font-black text-indigo-950 tracking-tight font-heading">Protocol Clean.</p>
                          <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">No predefined emergency keywords matched in current session.</p>
                      </div>
                  </div>
                )}

                <div className="pt-8 border-t border-slate-50 flex gap-4">
                  <Button variant="premium" className="flex-1 h-16 group" onClick={onClose}>
                      Acknowledge Briefing
                      <ChevronRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
                  </Button>
                  <Button variant="outline" className="px-6 border-indigo-100 text-indigo-400 hover:bg-indigo-50 transition-colors h-16 rounded-3xl">
                      <Mail className="h-5 w-5" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
