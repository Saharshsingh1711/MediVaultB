'use client'

import React from 'react';
import { ShieldCheck, Loader2 } from 'lucide-react';
import { cn } from "@/lib/utils";

interface LoadingOverlayProps {
  message?: string;
}

export default function LoadingOverlay({ message = "Processing..." }: LoadingOverlayProps) {
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-indigo-950/20 backdrop-blur-xl animate-in fade-in duration-500">
      <div className="flex flex-col items-center gap-8 p-16 rounded-[3rem] bg-white border border-indigo-50 shadow-premium relative overflow-hidden">
        {/* Animated Background Decoration */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-violet-500/5 rounded-full blur-3xl" />
        
        {/* Spinner & Icon Container */}
        <div className="relative">
          <div className="h-24 w-24 rounded-full border-t-4 border-l-4 border-indigo-600 animate-spin" />
          <div className="absolute inset-0 flex items-center justify-center">
            <ShieldCheck className="h-10 w-10 text-indigo-600 animate-pulse" />
          </div>
        </div>

        {/* Message */}
        <div className="flex flex-col items-center gap-3 text-center relative z-10">
          <h3 className="text-3xl font-black text-indigo-950 tracking-tighter italic font-heading">
            Medivault<span className="text-indigo-600">.</span>
          </h3>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] animate-pulse">
            {message}
          </p>
        </div>

        {/* Loading Bar Container */}
        <div className="w-56 h-2 bg-slate-50 rounded-full overflow-hidden mt-2 p-0.5 border border-slate-100">
          <div className="h-full bg-indigo-600 rounded-full shadow-[0_0_15px_rgba(99,102,241,0.5)] animate-[loading-bar_2s_infinite_ease-in-out]" />
        </div>
      </div>

      <style jsx>{`
        @keyframes loading-bar {
          0% { transform: translateX(-100%); width: 20%; }
          50% { transform: translateX(100%); width: 50%; }
          100% { transform: translateX(-100%); width: 20%; }
        }
      `}</style>
    </div>
  );
}
