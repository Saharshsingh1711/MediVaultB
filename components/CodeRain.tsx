'use client'

import React, { useEffect, useState } from "react";

const FRAGMENTS = [
  "BP 120/80 HR 72 SpO2 98%",
  "PENICILLIN ALLERGY DETECTED",
  "RHYTHM: SINUS BRADYCARDIA",
  "GLUCOSE: 5.4 MMOL/L",
  "ST SEGMENT ELEVATION: NEG",
  "PATIENT ID: XP-2003-4",
  "KMP SEARCHING RAW_TEXT_DATA",
  "BYTEUS ENGINE V1.0.4",
  "ANALYSIS BUFFER 0.2ms",
  "OCR RELAY ACTIVE",
  "EMERGENCY PROTOCOL GH-102"
];

export default function CodeRain() {
  const [activeFragments, setActiveFragments] = useState<string[]>([]);

  useEffect(() => {
    const interval = setInterval(() => {
      const count = Math.floor(Math.random() * 5) + 3;
      const newFragments = Array.from({ length: count }, () => FRAGMENTS[Math.floor(Math.random() * FRAGMENTS.length)]);
      setActiveFragments(newFragments);
    }, 150);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative h-48 w-full bg-black border border-white/5 rounded-md overflow-hidden flex flex-col items-center justify-center gap-2">
        <div className="absolute inset-0 grid grid-cols-3 gap-1 opacity-20 pointer-events-none">
            {activeFragments.map((text, i) => (
                <div key={i} className="text-[10px] font-mono text-emerald-500/50 break-all select-none">
                    {text.repeat(10)}
                </div>
            ))}
        </div>
        
        <div className="relative z-10 w-full px-12 space-y-4">
            <div className="flex items-center justify-between text-[10px] font-black text-rose-500 uppercase tracking-widest italic animate-pulse">
                <span>Scanning Clinical Vault...</span>
                <span>82% INDEXED</span>
            </div>
            <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden border border-white/5">
                <div className="h-full bg-rose-600 w-4/5 shadow-[0_0_15px_#e11d48]" />
            </div>
            <p className="text-center text-[9px] font-bold text-slate-600 uppercase tracking-widest">
                Executing KMP deep scan across 124 encrypted clinical artifacts...
            </p>
        </div>
    </div>
  );
}
