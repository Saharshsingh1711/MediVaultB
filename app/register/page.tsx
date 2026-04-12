'use client'

import React from "react";
import Link from "next/link";
import { GlassCard } from "@/components/GlassCard";
import { Button } from "@/components/Button";
import { User, Stethoscope, ArrowRight, ShieldCheck, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

export default function RegisterPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-24 bg-[#FBFBFF] relative overflow-hidden font-sans">
      {/* Decorative gradients */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-indigo-100/30 rounded-full blur-[150px] -z-0" />
      <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-violet-100/30 rounded-full blur-[150px] -z-0" />

      <div className="w-full max-w-5xl space-y-16 relative z-10">
        <div className="text-center space-y-6 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white border border-indigo-100 shadow-soft">
            <ShieldCheck className="h-4 w-4 text-emerald-500" />
            <p className="text-[10px] font-black text-indigo-950 uppercase tracking-widest">Verified Multi-Chain Security</p>
          </div>
          <h1 className="text-5xl md:text-7xl font-black text-indigo-950 leading-[1] tracking-tighter font-heading">
            Join the Healthcare <br /> <span className="text-indigo-600">Revolution.</span>
          </h1>
          <p className="text-lg text-slate-500 font-medium max-w-2xl mx-auto tracking-tight">
            The next generation of medical intelligence. Secure your medical legacy and access a network of synchronized healthcare professionals.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* Patient Card */}
          <GlassCard className="flex flex-col gap-8 p-10 group relative overflow-hidden border-indigo-50 hover:border-indigo-200">
            <div className="relative z-10">
              <div className="h-16 w-16 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-premium transform group-hover:rotate-6 transition-transform duration-500 mb-8">
                <User className="h-8 w-8" />
              </div>
              <div className="space-y-4">
                <h3 className="text-3xl font-black text-indigo-950 tracking-tighter font-heading uppercase">Patient Hub</h3>
                <p className="text-slate-500 font-medium leading-relaxed">
                  Take control of your medical history. Store records, manage appointments, and enable emergency triage instantly.
                </p>
              </div>
            </div>
            
            <div className="space-y-3 pt-4 border-t border-indigo-50 relative z-10">
              <Link href="/register/patient" className="block">
                <Button variant="premium" className="w-full h-14 group/btn">
                  Start Patient Onboarding
                  <ArrowRight className="h-4 w-4 ml-2 group-hover/btn:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <Link href="/login?role=patient" className="block">
                <Button variant="ghost" className="w-full text-indigo-400 font-bold tracking-tight">
                  Already have a signal? Login
                </Button>
              </Link>
            </div>
          </GlassCard>

          {/* Doctor Card */}
          <GlassCard className="flex flex-col gap-8 p-10 group relative overflow-hidden border-violet-50 hover:border-violet-200">
            <div className="relative z-10">
              <div className="h-16 w-16 bg-violet-600 rounded-2xl flex items-center justify-center text-white shadow-premium shadow-violet-500/20 transform group-hover:-rotate-6 transition-transform duration-500 mb-8">
                <Stethoscope className="h-8 w-8" />
              </div>
              <div className="space-y-4">
                <h3 className="text-3xl font-black text-indigo-950 tracking-tighter font-heading uppercase">Doctor Portal</h3>
                <p className="text-slate-500 font-medium leading-relaxed">
                  Modernize your practice. Verify patient history in linear time, issue prescriptions, and provide smarter clinical care.
                </p>
              </div>
            </div>
            
            <div className="space-y-3 pt-4 border-t border-violet-50 relative z-10">
              <Link href="/register/doctor" className="block">
                <Button variant="primary" className="w-full h-14 bg-violet-600 hover:bg-violet-700 shadow-violet-500/20 group/btn">
                  Apply for Practitioner Access
                  <ArrowRight className="h-4 w-4 ml-2 group-hover/btn:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <Link href="/login?role=doctor" className="block">
                <Button variant="ghost" className="w-full text-violet-400 font-bold tracking-tight">
                  Log in to Doctor Hub
                </Button>
              </Link>
            </div>
          </GlassCard>
        </div>

        {/* Bottom Trust Section */}
        <div className="flex flex-col items-center gap-6 pt-12">
          <div className="h-px w-24 bg-indigo-100" />
          <div className="flex items-center gap-4 text-xs font-black uppercase tracking-[0.3em] text-slate-300">
            <Zap className="h-4 w-4 text-amber-500" />
            Join 150,000+ Health Nodes
          </div>
        </div>
      </div>
    </div>
  );
}
