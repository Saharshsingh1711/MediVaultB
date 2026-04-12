'use client'

import React from "react";
import { GlassCard } from "@/components/GlassCard";
import { Button } from "@/components/Button";
import { Calendar, Clock, User, CheckCircle, XCircle, Search, ChevronRight, Filter } from "lucide-react";
import { cn } from "@/lib/utils";

export default function DoctorAppointments() {
  return (
    <div className="min-h-screen bg-[#FBFBFF] px-6 py-12 relative overflow-hidden selection:bg-indigo-100 selection:text-indigo-900">
      {/* Decorative Background Elements */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-100/30 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-violet-100/30 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-7xl mx-auto space-y-12 relative z-10">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-8 pb-10 border-b border-indigo-50">
          <div className="space-y-3">
            <h1 className="text-4xl font-black text-indigo-950 tracking-tighter italic font-heading">Consultation <span className="not-italic text-indigo-600">Hub.</span></h1>
            <p className="text-slate-400 font-black uppercase tracking-widest text-[10px] italic">Manage your patient consultations with clinical precision.</p>
          </div>
          <div className="flex flex-col md:flex-row gap-4">
             <div className="relative group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300 group-focus-within:text-indigo-600 transition-colors" />
                <input 
                  className="pl-12 pr-6 py-4 bg-white border border-indigo-50 rounded-2xl text-sm font-bold shadow-soft focus:outline-none focus:border-indigo-500/50 transition-all text-indigo-950 w-full md:w-80 placeholder:text-slate-300" 
                  placeholder="Registry Search..." 
                />
             </div>
             <Button variant="outline" className="h-14 border-indigo-50 bg-white hover:bg-indigo-50 px-6 rounded-2xl shadow-soft">
                <Filter className="h-4 w-4" />
             </Button>
          </div>
        </header>

        <div className="space-y-10">
          <div className="flex items-center gap-8 text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 italic ml-2">
             <span className="text-indigo-600 cursor-pointer hover:text-indigo-700 transition-colors relative after:content-[''] after:absolute after:-bottom-2 after:left-0 after:w-full after:h-0.5 after:bg-indigo-600">All Scheduled Sessions</span>
             <span className="cursor-pointer hover:text-indigo-600 transition-colors">Today's Pulse</span>
             <span className="cursor-pointer hover:text-indigo-600 transition-colors">Pending Clearances</span>
          </div>

          <div className="grid grid-cols-1 gap-6">
            {[
              { id: "APT-001", patient: "John Doe", time: "10:30 AM", date: "April 03, 2026", type: "Annual Physical Triage", status: "Active" },
              { id: "APT-002", patient: "Sarah Smith", time: "11:15 AM", date: "April 03, 2026", type: "Laboratory Analytics Review", status: "Pending" },
              { id: "APT-003", patient: "Mike Johnson", time: "01:00 PM", date: "April 03, 2026", type: "Cardiovascular Protocol", status: "Active" },
              { id: "APT-004", patient: "Emily Brown", time: "09:00 AM", date: "April 04, 2026", type: "General Assessment", status: "Active" }
            ].map((appt, i) => (
              <GlassCard 
                key={i} 
                className={cn(
                    "flex flex-col md:flex-row items-center justify-between gap-10 border-indigo-50 group hover:border-indigo-200 transition-all p-8 bg-white shadow-soft rounded-[2.5rem]",
                    appt.status === 'Pending' && "border-amber-100 bg-amber-50/20"
                )}
              >
                <div className="flex items-center gap-8 w-full md:w-auto">
                    <div className="h-20 w-20 rounded-3xl bg-indigo-50 border border-indigo-100 flex flex-col items-center justify-center text-indigo-600 shadow-soft transition-transform group-hover:scale-105">
                        <span className="text-[9px] font-black uppercase tracking-widest opacity-50">APT</span>
                        <span className="text-xl font-black italic tracking-tighter">{appt.id.split('-')[1]}</span>
                    </div>
                    <div>
                        <h4 className="text-2xl font-black text-indigo-950 uppercase tracking-tighter italic font-heading group-hover:text-indigo-600 transition-colors">{appt.patient}</h4>
                        <div className="flex items-center gap-6 text-[10px] font-black text-slate-400 mt-2 uppercase tracking-widest font-mono italic">
                            <span className="flex items-center gap-2"><Clock className="h-3.5 w-3.5" /> {appt.time}</span>
                            <span className="flex items-center gap-2"><Calendar className="h-3.5 w-3.5" /> {appt.date}</span>
                        </div>
                    </div>
                </div>

                <div className="flex flex-col items-start md:items-center gap-2 w-full md:w-auto px-10 border-indigo-50 md:border-x">
                    <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest italic">Protocol Assignment</span>
                    <span className="text-xs font-black text-indigo-950 uppercase italic tracking-tight">{appt.type}</span>
                </div>

                <div className="flex items-center gap-4 w-full md:w-auto justify-end">
                    {appt.status === "Pending" ? (
                      <>
                        <Button variant="ghost" size="sm" className="h-14 px-8 text-emerald-600 hover:bg-emerald-50 gap-3 border border-emerald-100 rounded-2xl shadow-soft font-black uppercase text-[10px] tracking-widest">
                            <CheckCircle className="h-4 w-4" /> Finalize
                        </Button>
                        <Button variant="ghost" size="sm" className="h-14 px-8 text-rose-600 hover:bg-rose-50 gap-3 border border-rose-100 rounded-2xl shadow-soft font-black uppercase text-[10px] tracking-widest">
                            <XCircle className="h-4 w-4" /> Cancel
                        </Button>
                      </>
                    ) : (
                      <Button variant="premium" className="h-14 px-10 rounded-2xl shadow-premium text-[10px] uppercase tracking-widest flex gap-3 group/btn">
                        Manage Protocol
                        <ChevronRight className="h-4 w-4 group-hover/btn:translate-x-1 transition-transform" />
                      </Button>
                    )}
                </div>
              </GlassCard>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
