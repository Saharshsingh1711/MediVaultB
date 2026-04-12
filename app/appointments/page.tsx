'use client'

import React, { useState, useEffect } from "react";
import { GlassCard } from "@/components/GlassCard";
import { Button } from "@/components/Button";
import { Calendar, Clock, User, CheckCircle, Video, Search, Filter, ShieldCheck, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";
import { MOCK_DOCTORS_EXTENDED } from "@/lib/utils/mockDoctors";
import Link from "next/link";

export default function PatientAppointments() {
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load booked appointments from localStorage
    try {
      const stored = localStorage.getItem('synced_appointments');
      if (stored) {
        const docIds = JSON.parse(stored);
        
        // Find these doctors in MOCK_DOCTORS_EXTENDED
        // In a real app, this would be a Supabase fetch: .in('user_id', docIds)
        const matched = docIds.map((id: string) => {
           const doc = MOCK_DOCTORS_EXTENDED.find(d => d.user_id === id);
           return doc ? {
               ...doc,
               appointmentDate: new Date(Date.now() + 86400000 * (1 + Math.floor(Math.random() * 5))).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' }),
               appointmentTime: `${Math.floor(Math.random() * 6) + 9}:00 AM`,
           } : null;
        }).filter(Boolean);
        
        setAppointments(matched);
      }
    } catch(e) {
      console.error(e);
    }
    setLoading(false);
  }, []);

  return (
    <div className="min-h-screen bg-[#FBFBFF] px-6 py-12 relative overflow-hidden selection:bg-indigo-100 selection:text-indigo-900">
      {/* Decorative Background Elements */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-100/30 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-violet-100/30 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-7xl mx-auto space-y-12 relative z-10">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-8 pb-10 border-b border-indigo-50">
          <div className="space-y-3">
            <h1 className="text-4xl font-black text-indigo-950 tracking-tighter italic font-heading">My Scheduled <span className="not-italic text-indigo-600">Consultations.</span></h1>
            <p className="text-slate-400 font-black uppercase tracking-widest text-[10px] italic">Active network sync protocols with verified specialists.</p>
          </div>
          <div className="flex flex-col md:flex-row gap-4">
             <div className="relative group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300 group-focus-within:text-indigo-600 transition-colors" />
                <input 
                  className="pl-12 pr-6 py-4 bg-white border border-indigo-50 rounded-2xl text-sm font-bold shadow-soft focus:outline-none focus:border-indigo-500/50 transition-all text-indigo-950 w-full md:w-80 placeholder:text-slate-300" 
                  placeholder="Search network..." 
                />
             </div>
             <Button variant="outline" className="h-14 border-indigo-50 bg-white hover:bg-indigo-50 px-6 rounded-2xl shadow-soft">
                <Filter className="h-4 w-4" />
             </Button>
          </div>
        </header>

        <div className="space-y-10">
          <div className="flex items-center gap-8 text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 italic ml-2">
             <span className="text-indigo-600 cursor-pointer hover:text-indigo-700 transition-colors relative after:content-[''] after:absolute after:-bottom-2 after:left-0 after:w-full after:h-0.5 after:bg-indigo-600">Upcoming Syncs</span>
             <span className="cursor-pointer hover:text-indigo-600 transition-colors">Historical Logs</span>
          </div>

          <div className="grid grid-cols-1 gap-6">
            {!loading && appointments.length === 0 ? (
                <div className="py-20 text-center space-y-4 bg-white/50 border border-indigo-50 rounded-3xl backdrop-blur-xl">
                   <div className="text-5xl opacity-30 grayscale mb-6">🩺</div>
                   <h3 className="text-xl font-bold text-indigo-900 tracking-tight font-heading">No consultations booked.</h3>
                   <p className="text-slate-500 text-sm font-medium">You haven't requested any specialist syncs yet.</p>
                   <Link href="/doctors">
                     <Button className="mt-4 px-8 bg-indigo-600 shadow-premium" variant="premium">Discover Specialists</Button>
                   </Link>
                </div>
            ) : (
             appointments.map((appt, i) => (
              <GlassCard 
                key={i} 
                className="flex flex-col xl:flex-row items-center justify-between gap-10 border-indigo-50 group hover:border-indigo-200 transition-all p-8 bg-white shadow-soft rounded-[2.5rem]"
              >
                <div className="flex items-center gap-8 w-full xl:w-auto">
                    <div className="relative h-20 w-20 rounded-3xl bg-indigo-50 border border-indigo-100 flex flex-col items-center justify-center text-indigo-600 shadow-soft transition-transform group-hover:scale-105 overflow-hidden flex-shrink-0">
                       <img src={appt.profilePicture} alt={appt.first_name} className="object-cover h-full w-full" />
                       <div className="absolute inset-0 ring-4 ring-inset ring-white/10" />
                    </div>
                    <div className="min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="text-2xl font-black text-indigo-950 uppercase tracking-tighter truncate font-heading group-hover:text-indigo-600 transition-colors">Dr. {appt.first_name} {appt.second_name}</h4>
                          <ShieldCheck className="h-5 w-5 text-emerald-500" />
                        </div>
                        <p className="text-indigo-600 font-black uppercase tracking-widest text-[9px] truncate mb-2">{appt.specialization}</p>
                        
                        <div className="flex items-center gap-6 text-[10px] font-black text-slate-400 mt-2 uppercase tracking-widest font-mono italic">
                            <span className="flex items-center gap-2"><MapPin className="h-3.5 w-3.5" /> {appt.city}</span>
                        </div>
                    </div>
                </div>

                <div className="flex flex-col items-start xl:items-center gap-4 w-full xl:w-auto px-10 border-indigo-50 xl:border-x py-4 xl:py-0">
                    <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest italic flex items-center gap-2">
                        <CheckCircle className="h-3.5 w-3.5 text-emerald-400" /> Confirmed Protocol
                    </span>
                    <div className="flex flex-row xl:flex-col gap-6 xl:gap-2">
                        <div className="flex items-center gap-3 text-indigo-950 font-bold">
                            <Calendar className="h-4 w-4 text-indigo-400" /> {appt.appointmentDate}
                        </div>
                        <div className="flex items-center gap-3 text-indigo-950 font-bold">
                            <Clock className="h-4 w-4 text-indigo-400" /> {appt.appointmentTime}
                        </div>
                    </div>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-4 w-full xl:w-auto justify-end">
                    <Button variant="outline" className="h-14 w-full sm:w-auto px-6 border-indigo-100 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 gap-3 rounded-2xl shadow-soft font-black uppercase text-[10px] tracking-widest transition-colors">
                        Reschedule
                    </Button>
                    <Button variant="premium" className="h-14 w-full sm:w-auto px-8 rounded-2xl shadow-premium text-[10px] bg-emerald-600 hover:bg-emerald-700 uppercase tracking-widest flex gap-3 group/btn">
                        <Video className="h-4 w-4" />
                        Join Tele-Sync
                    </Button>
                </div>
              </GlassCard>
             ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
