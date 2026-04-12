'use client'

import React, { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { ShieldCheck, History, Clock, Hospital, ExternalLink } from "lucide-react";
import { GlassCard } from "./GlassCard";
import { Button } from "./Button";
import { SB_TABLES } from "@/lib/supabase/tables";

interface AccessLog {
  id: string;
  doctor_name: string;
  action: string;
  metadata?: any;
  created_at: string;
}

export default function AccessLogs({ patientId }: { patientId: string }) {
  const [logs, setLogs] = useState<AccessLog[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    async function fetchLogs() {
      // In a real scenario, this would be from 'access_logs' table
      const { data, error } = await supabase
        .from('access_logs')
        .select('*')
        .eq('patient_id', patientId)
        .order('created_at', { ascending: false });

      if (!error && data) {
        setLogs(data);
      }
      setLoading(false);
    }

    fetchLogs();

    // REALTIME: Listen for new access logs
    const channel = supabase
      .channel('access-logs-channel')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'access_logs',
          filter: `patient_id=eq.${patientId}`
        },
        (payload) => {
          setLogs(prev => [payload.new as AccessLog, ...prev]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [patientId, supabase]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-20 gap-4">
        <ShieldCheck className="h-12 w-12 text-indigo-600 animate-pulse" />
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Scanning Sovereignty Audit...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <header className="flex items-center justify-between px-2">
        <div className="space-y-2">
          <h2 className="text-2xl font-black text-indigo-950 tracking-tighter font-heading">Sovereignty <span className="text-indigo-600">Audit.</span></h2>
          <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em]">Real-time synchronization of vault interactions</p>
        </div>
        <div className="px-4 py-2 rounded-full bg-indigo-50 border border-indigo-100 text-[9px] font-black text-indigo-600 uppercase tracking-widest flex items-center gap-2 shadow-soft">
          <div className="h-2 w-2 rounded-full bg-indigo-500 animate-pulse" /> Live Pulse
        </div>
      </header>

      <div className="space-y-4">
        {logs.length === 0 ? (
          <GlassCard className="flex flex-col items-center justify-center p-20 gap-4 border-dashed border-indigo-100 bg-transparent">
            <History className="h-10 w-10 text-indigo-100" />
            <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">No clinical accesses recorded in this session.</p>
          </GlassCard>
        ) : (
          logs.map((log) => (
            <GlassCard key={log.id} className="flex items-center justify-between group p-6">
              <div className="flex items-center gap-6">
                <div className="h-14 w-14 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                  <Hospital className="h-7 w-7" />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-bold text-indigo-950 tracking-tight">{log.doctor_name}</h4>
                    <span className="px-2 py-0.5 rounded-lg bg-emerald-50 text-[8px] font-black text-emerald-600 uppercase tracking-widest">Verified ID</span>
                  </div>
                  <p className="text-sm text-slate-500 font-medium tracking-tight">
                    {log.action} — <span className="text-indigo-600 font-black uppercase tracking-wider text-[9px]">Auth Success</span>
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-8">
                <div className="text-right hidden sm:block">
                  <div className="text-[10px] font-black text-indigo-950 uppercase tracking-widest flex items-center justify-end gap-1">
                    <Clock className="h-3 w-3 text-indigo-400" /> {new Date(log.created_at).toLocaleTimeString()}
                  </div>
                  <div className="text-[9px] text-slate-400 font-bold uppercase tracking-[0.2em]">{new Date(log.created_at).toLocaleDateString()}</div>
                </div>
                <Button variant="ghost" className="opacity-0 group-hover:opacity-100 transition-all hover:bg-slate-50">
                  <ExternalLink className="h-4 w-4 text-indigo-400" />
                </Button>
              </div>
            </GlassCard>
          ))
        )}
      </div>

      <div className="p-8 rounded-[2rem] bg-amber-50 border border-amber-100 flex items-start gap-5 shadow-soft">
        <div className="h-12 w-12 shrink-0 rounded-2xl bg-white flex items-center justify-center text-amber-500 shadow-soft">
           <ShieldCheck className="h-6 w-6" />
        </div>
        <div className="space-y-1">
          <h4 className="text-sm font-black text-amber-600 uppercase tracking-widest">Unrecognized Access?</h4>
          <p className="text-[11px] text-amber-900/60 font-medium leading-relaxed max-w-2xl">
            Every access is recorded using your biometric baseline. If you do not recognize an entry, immediately revoke the Golden Hour Emergency Access QR code in Security Settings.
          </p>
        </div>
      </div>
    </div>
  );
}
