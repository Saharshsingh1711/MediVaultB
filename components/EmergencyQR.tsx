'use client'

import React from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Shield, Zap, Download, Share2 } from 'lucide-react';
import { GlassCard } from './GlassCard';
import { Button } from './Button';

interface EmergencyQRProps {
  patientId: string;
  patientName: string;
}

export default function EmergencyQR({ patientId, patientName }: EmergencyQRProps) {
  const triageUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/triage/${patientId}`;

  const downloadQR = () => {
    const svg = document.getElementById('emergency-qr');
    if (!svg) return;
    
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx?.drawImage(img, 0, 0);
      const pngFile = canvas.toDataURL('image/png');
      const downloadLink = document.createElement('a');
      downloadLink.download = `Medivault_Emergency_QR_${patientName.replace(/\s+/g, '_')}.png`;
      downloadLink.href = pngFile;
      downloadLink.click();
    };
    img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
  };

  return (
    <GlassCard className="flex flex-col gap-6 p-6 border-rose-500/20 bg-rose-500/5 overflow-hidden relative group/qr">
      {/* Decorative Emergency Background */}
      <div className="absolute -top-12 -right-12 w-32 h-32 bg-rose-600/10 rounded-full blur-2xl animate-pulse" />
      
      <div className="space-y-1 relative z-10">
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-600/10 border border-rose-500/20 text-[8px] font-black text-rose-500 uppercase tracking-widest animate-pulse">
          <Zap className="h-2.5 w-2.5 fill-rose-500" /> Golden Hour Protocol
        </div>
        <h3 className="text-xl font-black text-white uppercase tracking-tighter italic">Emergency Pulse</h3>
        <p className="text-[10px] text-slate-400 font-medium leading-tight">Instant clinical triage access for verified responders.</p>
      </div>

      <div className="relative p-5 bg-white rounded-2xl shadow-[0_0_40px_rgba(225,29,72,0.15)] mx-auto group-hover/qr:scale-[1.02] transition-transform duration-500">
        <QRCodeSVG 
          id="emergency-qr"
          value={triageUrl} 
          size={160}
          level="H"
          includeMargin={true}
          imageSettings={{
            src: "/favicon.ico",
            x: undefined,
            y: undefined,
            height: 32,
            width: 32,
            excavate: true,
          }}
        />
        <div className="absolute inset-0 border-4 border-rose-600/5 rounded-2xl pointer-events-none" />
      </div>

      <div className="grid grid-cols-2 gap-3 w-full">
        <Button 
          variant="outline" 
          onClick={downloadQR}
          className="flex items-center justify-center gap-2 border-white/5 hover:bg-white/5 text-[9px] font-black uppercase tracking-widest py-3 h-auto"
        >
          <Download className="h-3.5 w-3.5" /> Save
        </Button>
        <Button 
          variant="primary" 
          onClick={() => navigator.share?.({ title: 'My Medivault Emergency QR', url: triageUrl })}
          className="flex items-center justify-center gap-2 bg-rose-600 hover:bg-rose-500 text-[9px] font-black uppercase tracking-widest py-3 h-auto shadow-[0_0_15px_rgba(225,29,72,0.3)]"
        >
          <Share2 className="h-3.5 w-3.5" /> Share
        </Button>
      </div>

      <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-black/40 border border-white/5 w-full">
        <Shield className="h-4 w-4 text-rose-500 shrink-0" />
        <p className="text-[8px] text-slate-500 font-bold uppercase tracking-wider leading-snug">
          Data restricted to verified clinicians with active signatures.
        </p>
      </div>
    </GlassCard>
  );
}
