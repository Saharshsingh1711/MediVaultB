'use client'

import React, { useEffect, useState, useRef } from "react";

const STRINGS = [
  "[AUTH] Supabase RLS Handshake: VALID",
  "[KMP] Indexing raw_text_data...",
  "[OCR] Page 1 processed: Blood Report",
  "[HUB] Synchronizing Clinical Parameters",
  "[SECURITY] Vault Integrity Check: PASS",
  "[PROTOCOL] Broadcasting Prescription GH-102",
  "[ENGINE] Byteus V1.0.4 Cold Boot: OK",
  "[STORAGE] Encrypting health_records bucket",
  "[TRIAGE] Monitoring Emergency Surges",
  "[SYSTEM] Kernel Latency: 0.2ms"
];

export default function SystemActivityLog() {
  const [logs, setLogs] = useState<string[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const interval = setInterval(() => {
      const newLog = STRINGS[Math.floor(Math.random() * STRINGS.length)];
      setLogs(prev => [...prev.slice(-12), `${new Date().toLocaleTimeString()} ${newLog}`]);
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  return (
    <div className="space-y-3">
        <h4 className="text-[9px] font-black text-slate-700 uppercase tracking-widest ml-1 italic">System Activity Log</h4>
        <div 
            ref={scrollRef}
            className="h-32 bg-black border border-white/5 rounded-md p-3 overflow-hidden flex flex-col gap-1.5"
        >
            {logs.map((log, i) => (
                <p key={i} className="text-[9px] font-bold text-emerald-500/80 font-mono tracking-tighter truncate animate-in fade-in slide-in-from-bottom-1 duration-300">
                    {log}
                </p>
            ))}
            {logs.length === 0 && (
                <p className="text-[9px] font-bold text-slate-800 font-mono italic">Initializing clinical buffer...</p>
            )}
        </div>
    </div>
  );
}
