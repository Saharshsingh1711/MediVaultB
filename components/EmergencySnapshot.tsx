'use client'

import React, { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { SB_TABLES } from "@/lib/supabase/tables";
import { GlassCard } from "./GlassCard";
import { Activity, AlertTriangle, Pill, Heart, Zap, Thermometer, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface Vitals {
  blood_pressure: string;
  heart_rate: number;
  spo2: number;
  temperature: number;
  created_at: string;
}

export default function EmergencySnapshot({ patientId }: { patientId: string }) {
  const [vitals, setVitals] = useState<Vitals[]>([]);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    async function fetchTriageData() {
      const { data: vitalsData } = await supabase
        .from(SB_TABLES.medical_vitals)
        .select('*')
        .eq('patient_id', patientId)
        .order('created_at', { ascending: false })
        .limit(3);
      
      setVitals(vitalsData || []);

      const { data: profileData } = await supabase
        .from(SB_TABLES.user_patient)
        .select('active_allergies, current_medications, chronic_conditions')
        .eq('user_id', patientId)
        .single();
      
      setProfile(profileData);
      setLoading(false);
    }
    fetchTriageData();
  }, [patientId, supabase]);

  if (loading) return (
    <div className="h-48 flex items-center justify-center">
      <div className="flex flex-col items-center gap-4 animate-pulse">
        <Activity className="h-8 w-8 text-indigo-200" />
        <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.3em]">Synchronizing Snapshot...</p>
      </div>
    </div>
  );

  const latestVital = vitals[0];

  const VitalCard = ({ icon: Icon, label, value, unit, colorClass, bgClass }: any) => (
    <div className={cn("p-5 rounded-3xl bg-white border border-slate-100 shadow-soft flex flex-col gap-2 transition-all hover:shadow-premium group", bgClass)}>
      <div className={cn("flex items-center gap-2", colorClass)}>
        <Icon className="h-4 w-4" />
        <span className="text-[9px] font-black uppercase tracking-widest">{label}</span>
      </div>
      <div className="flex items-baseline gap-1">
        <span className="text-2xl font-black text-indigo-950 font-heading tracking-tight italic">{value || "--"}</span>
        {unit && <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{unit}</span>}
      </div>
    </div>
  );

  return (
    <div className="space-y-8">
      {/* Vitals Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <VitalCard 
          icon={Heart} 
          label="Heart Rate" 
          value={latestVital?.heart_rate} 
          unit="BPM" 
          colorClass="text-rose-500" 
        />
        <VitalCard 
          icon={Zap} 
          label="SpO2" 
          value={latestVital?.spo2} 
          unit="%" 
          colorClass="text-indigo-600" 
        />
        <VitalCard 
          icon={Activity} 
          label="BP" 
          value={latestVital?.blood_pressure} 
          colorClass="text-indigo-600" 
        />
        <VitalCard 
          icon={Thermometer} 
          label="Temp" 
          value={latestVital?.temperature} 
          unit="°C" 
          colorClass="text-amber-500" 
        />
      </div>

      {/* Critical Alert Arrays */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Allergies Case */}
        <div className="p-8 rounded-[2rem] bg-rose-50/50 border border-rose-100/50 shadow-soft h-full flex flex-col">
          <div className="flex items-center gap-3 text-rose-600 mb-6">
            <div className="p-2 rounded-xl bg-rose-100/50">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <h4 className="text-sm font-black uppercase tracking-widest font-heading">Active Allergies</h4>
          </div>
          <div className="flex flex-wrap gap-2">
            {profile?.active_allergies?.length > 0 ? (
              profile.active_allergies.map((allergy: string, i: number) => (
                <span key={i} className="px-4 py-2 rounded-xl bg-white border border-rose-100 text-rose-600 text-[10px] font-black uppercase tracking-widest shadow-sm">
                  {allergy}
                </span>
              ))
            ) : (
              <div className="flex items-center gap-2 text-slate-400 py-2 italic font-medium text-xs">
                No known clinical allergies detected
              </div>
            )}
          </div>
        </div>

        {/* Medication Case */}
        <div className="p-8 rounded-[2rem] bg-indigo-50/50 border border-indigo-100/50 shadow-soft h-full flex flex-col">
          <div className="flex items-center gap-3 text-indigo-600 mb-6">
            <div className="p-2 rounded-xl bg-indigo-100/50">
              <Pill className="h-5 w-5" />
            </div>
            <h4 className="text-sm font-black uppercase tracking-widest font-heading">Current Meds</h4>
          </div>
          <div className="flex flex-wrap gap-2">
            {profile?.current_medications?.length > 0 ? (
              profile.current_medications.map((med: string, i: number) => (
                <span key={i} className="px-4 py-2 rounded-xl bg-white border border-indigo-100 text-indigo-600 text-[10px] font-black uppercase tracking-widest shadow-sm">
                  {med}
                </span>
              ))
            ) : (
              <div className="flex items-center gap-2 text-slate-400 py-2 italic font-medium text-xs">
                No active pharmacological regimens
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
