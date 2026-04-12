'use client'

import React, { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { SB_TABLES } from "@/lib/supabase/tables";
import { GlassCard } from "./GlassCard";
import { Button } from "./Button";
import { Pill, Activity, CheckCircle, Loader2, X, Send, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface PrescriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  patientId: string;
  patientName: string;
  doctorId: string;
}

export default function PrescriptionModal({ isOpen, onClose, patientId, patientName, doctorId }: PrescriptionModalProps) {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [formData, setFormData] = useState({
    medication_name: "",
    dosage: "",
    instructions: "",
    sync_nhs: true
  });
  const supabase = createClient();

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase
        .from(SB_TABLES.prescriptions)
        .insert({
          patient_id: patientId,
          doctor_id: doctorId,
          medication_name: formData.medication_name,
          dosage: formData.dosage,
          instructions: formData.instructions
        });

      if (error) throw error;

      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        onClose();
        setFormData({ medication_name: "", dosage: "", instructions: "", sync_nhs: true });
      }, 2000);
      
    } catch (err: any) {
      console.error("Prescription Error:", err);
      alert(`Failed to issue prescription: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-6 bg-indigo-950/20 backdrop-blur-xl animate-in fade-in duration-300">
      <div className="max-w-xl w-full relative z-10 animate-in zoom-in-95 duration-500">
        <GlassCard className="border-indigo-50/50 shadow-premium p-10 bg-white/95 backdrop-blur-md">
          <button 
            onClick={onClose} 
            className="absolute top-8 right-8 text-slate-400 hover:text-indigo-600 transition-colors p-2 hover:bg-indigo-50 rounded-xl"
          >
            <X className="h-5 w-5" />
          </button>

          <div className="space-y-10">
              <header className="flex items-center gap-5">
                  <div className="h-14 w-14 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-premium transform -rotate-3">
                      <Pill className="h-7 w-7" />
                  </div>
                  <div>
                      <h2 className="text-3xl font-black text-indigo-950 tracking-tighter font-heading">Clinical <span className="text-indigo-600">Protocol.</span></h2>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Pharmacological Directive For: <span className="text-indigo-600">{patientName}</span></p>
                  </div>
              </header>

              {success ? (
                  <div className="py-20 flex flex-col items-center justify-center gap-6 animate-in zoom-in-95 duration-500">
                      <div className="h-20 w-20 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-500 shadow-soft">
                        <CheckCircle className="h-10 w-10" />
                      </div>
                      <div className="text-center space-y-2">
                          <p className="text-2xl font-black text-indigo-950 tracking-tight font-heading">Protocol Dispatched.</p>
                          <p className="text-xs text-slate-500 font-bold tracking-tight">Intelligence successfully synchronized with the Patient Hub.</p>
                      </div>
                  </div>
              ) : (
                  <form onSubmit={handleSubmit} className="space-y-8">
                      <div className="space-y-6">
                          <div className="space-y-2">
                              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Prescription Marker</label>
                              <div className="relative group">
                                <Activity className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300 group-focus-within:text-indigo-500 transition-colors" />
                                <input 
                                    required
                                    value={formData.medication_name}
                                    onChange={e => setFormData({...formData, medication_name: e.target.value})}
                                    placeholder="e.g. Paracetamol 500mg"
                                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl pl-11 pr-5 py-4 text-indigo-950 text-sm font-bold focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:bg-white transition-all placeholder:text-slate-300"
                                />
                              </div>
                          </div>
                          <div className="space-y-2">
                              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Dosage Schedule</label>
                              <div className="relative group">
                                <Sparkles className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300 group-focus-within:text-indigo-500 transition-colors" />
                                <input 
                                    required
                                    value={formData.dosage}
                                    onChange={e => setFormData({...formData, dosage: e.target.value})}
                                    placeholder="e.g. TWICE DAILY (BID)"
                                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl pl-11 pr-5 py-4 text-indigo-950 text-sm font-bold focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:bg-white transition-all placeholder:text-slate-300"
                                />
                              </div>
                          </div>
                          <div className="space-y-2">
                              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Clinical Instructions</label>
                              <textarea 
                                  rows={3}
                                  value={formData.instructions}
                                  onChange={e => setFormData({...formData, instructions: e.target.value})}
                                  placeholder="Special administration instructions..."
                                  className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 text-indigo-950 text-sm font-bold focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:bg-white transition-all placeholder:text-slate-300 min-h-[100px]"
                              />
                          </div>
                      </div>

                      <div className="p-5 rounded-2xl bg-indigo-50/50 border border-indigo-100/50 flex items-center justify-between">
                          <div className="flex items-center gap-3">
                              <div className="h-8 w-8 rounded-lg bg-emerald-500 text-white flex items-center justify-center shadow-soft">
                                <Activity className="h-4 w-4" />
                              </div>
                              <div className="flex flex-col">
                                <span className="text-[10px] font-black text-indigo-950 uppercase tracking-widest">Global Health Sync</span>
                                <span className="text-[9px] font-bold text-slate-400">Verifying with National Repositories</span>
                              </div>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer">
                              <input type="checkbox" checked={formData.sync_nhs} onChange={e => setFormData({...formData, sync_nhs: e.target.checked})} className="sr-only peer" />
                              <div className="w-12 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                          </label>
                      </div>

                      <Button 
                          disabled={loading}
                          variant="premium"
                          className="w-full h-16 group"
                      >
                          {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5 group-hover:-translate-y-1 group-hover:translate-x-1 transition-transform" />}
                          Broadcasting Clinical Pulse
                      </Button>
                  </form>
              )}
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
