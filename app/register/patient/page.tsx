'use client'

import React, { useState } from "react";
import { GlassCard } from "@/components/GlassCard";
import { Button } from "@/components/Button";
import { cn } from "@/lib/utils";

export default function PatientRegisterPage() {
  const [isPending, setIsPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsPending(true);
    setMessage(null);

    const formData = new FormData(e.currentTarget);
    
    try {
      const res = await fetch("/api/sign-up-patient", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (res.ok) {
        setMessage("✅ Registration successful! Entering your Vault...");
        setTimeout(() => window.location.href = "/patient/dashboard", 1500);
      } else {
        setMessage(`❌ Error: ${data.error}`);
      }

    } catch (err) {
      setMessage("❌ Network error. Please try again.");
    } finally {
      setIsPending(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FBFBFF] px-6 py-24 relative overflow-hidden flex justify-center selection:bg-indigo-100 selection:text-indigo-900">
      {/* Decorative Background Elements */}
      <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-indigo-100/30 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-violet-100/30 rounded-full blur-[120px] pointer-events-none" />

      <GlassCard className="w-full max-w-2xl border-indigo-50 shadow-premium p-10 md:p-16">
        <div className="space-y-12">
          <div className="text-center space-y-4">
            <h1 className="text-4xl font-black text-indigo-950 tracking-tighter italic font-heading">
                Patient <span className="not-italic text-indigo-600">Registration.</span>
            </h1>
            <p className="text-slate-500 font-medium text-lg tracking-tight">Complete your medical profile to get started.</p>
          </div>

          {message && (
             <div className={cn(
                "p-5 rounded-[1.5rem] text-center text-sm font-black uppercase tracking-widest shadow-soft animate-in zoom-in-95 duration-300",
                message.startsWith('✅') ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-rose-50 text-rose-600 border border-rose-100'
            )}>
              {message}
            </div>
          )}

          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-3">
              <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">First Name</label>
              <input name="first_name" required className="w-full h-14 px-6 rounded-2xl bg-slate-50 border border-slate-100 text-indigo-950 focus:bg-white focus:outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all font-medium placeholder:text-slate-300" placeholder="John" />
            </div>
            <div className="space-y-3">
              <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Middle Name (Optional)</label>
              <input name="middle_name" className="w-full h-14 px-6 rounded-2xl bg-slate-50 border border-slate-100 text-indigo-950 focus:bg-white focus:outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all font-medium placeholder:text-slate-300" placeholder="Quincy" />
            </div>
            <div className="space-y-3">
              <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Last Name</label>
              <input name="second_name" required className="w-full h-14 px-6 rounded-2xl bg-slate-50 border border-slate-100 text-indigo-950 focus:bg-white focus:outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all font-medium placeholder:text-slate-300" placeholder="Doe" />
            </div>
            <div className="space-y-3">
              <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Age</label>
              <input name="age" type="number" required className="w-full h-14 px-6 rounded-2xl bg-slate-50 border border-slate-100 text-indigo-950 focus:bg-white focus:outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all font-medium placeholder:text-slate-300" placeholder="25" />
            </div>

            <div className="space-y-3 md:col-span-2">
              <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Email Address</label>
              <input name="email" type="email" required className="w-full h-14 px-6 rounded-2xl bg-slate-50 border border-slate-100 text-indigo-950 focus:bg-white focus:outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all font-medium placeholder:text-slate-300" placeholder="john.doe@example.com" />
            </div>
            <div className="space-y-3 md:col-span-2">
              <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Password</label>
              <input name="password" type="password" required className="w-full h-14 px-6 rounded-2xl bg-slate-50 border border-slate-100 text-indigo-950 focus:bg-white focus:outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all font-medium placeholder:text-slate-300" placeholder="••••••••" />
            </div>

            {/* Health Basics */}
            <div className="space-y-3">
              <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Gender</label>
              <select name="gender" required className="w-full h-14 px-6 rounded-2xl bg-slate-50 border border-slate-100 text-indigo-950 focus:bg-white focus:outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all font-black text-xs uppercase tracking-widest cursor-pointer appearance-none">
                <option value="MALE">Male</option>
                <option value="FEMALE">Female</option>
                <option value="OTHER">Other</option>
              </select>
            </div>
            <div className="space-y-3">
              <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Blood Group</label>
              <input name="blood_group" className="w-full h-14 px-6 rounded-2xl bg-slate-50 border border-slate-100 text-indigo-950 focus:bg-white focus:outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all font-medium placeholder:text-slate-300" placeholder="O+" />
            </div>

            <div className="space-y-8 md:col-span-2 mt-4 pt-8 border-t border-slate-50">
               <div className="flex items-center gap-6">
                 <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-indigo-400 whitespace-nowrap">Emergency Contact</h3>
                 <div className="h-px bg-indigo-50 flex-1" />
              </div>
            </div>
            
            <div className="space-y-3">
              <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Emergency Name</label>
              <input name="emergency_contact_name" required className="w-full h-14 px-6 rounded-2xl bg-slate-50 border border-slate-100 text-indigo-950 focus:bg-white focus:outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all font-medium placeholder:text-slate-300" placeholder="Jane Doe" />
            </div>
            <div className="space-y-3">
              <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Emergency Phone</label>
              <input name="emergency_contact_phone" required className="w-full h-14 px-6 rounded-2xl bg-slate-50 border border-slate-100 text-indigo-950 focus:bg-white focus:outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all font-medium placeholder:text-slate-300" placeholder="+1 234 567 890" />
            </div>

            <div className="space-y-8 md:col-span-2 mt-4 pt-8 border-t border-slate-50">
               <div className="flex items-center gap-6">
                 <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-indigo-400 whitespace-nowrap">Identity Verification</h3>
                 <div className="h-px bg-indigo-50 flex-1" />
              </div>
            </div>

            <div className="space-y-3 md:col-span-2">
              <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Phone Number</label>
              <input name="phone_number" required className="w-full h-14 px-6 rounded-2xl bg-slate-50 border border-slate-100 text-indigo-950 focus:bg-white focus:outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all font-medium placeholder:text-slate-300" placeholder="+1 234 567 890" />
            </div>
            <div className="space-y-3 md:col-span-2">
              <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Registered Address</label>
              <textarea name="address" required className="w-full px-6 py-4 rounded-[2rem] bg-slate-50 border border-slate-100 text-indigo-950 focus:bg-white focus:outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all font-medium min-h-[120px] resize-none shadow-soft" placeholder="123 Health St, Wellness City" />
            </div>
            
            <div className="space-y-6 md:col-span-2 p-8 rounded-[2rem] bg-indigo-50/30 border border-indigo-100">
              <label className="text-[10px] font-black text-indigo-950 uppercase tracking-widest ml-1 italic">Profile Picture (High-Res Identification)</label>
              <input name="profilePicture" type="file" accept="image/*" required className="w-full text-xs font-black text-indigo-400 file:mr-6 file:py-3 file:px-8 file:rounded-xl file:border-0 file:text-[10px] file:font-black file:uppercase file:tracking-widest file:bg-indigo-600 file:text-white hover:file:bg-indigo-700 transition-all cursor-pointer" />
            </div>

            <div className="md:col-span-2 pt-12 flex justify-center">
              <Button type="submit" disabled={isPending} variant="premium" className="w-full max-w-sm h-18 text-base">
                {isPending ? "Entering your Vault..." : "Finalize Registration"}
              </Button>
            </div>
          </form>
        </div>
      </GlassCard>
    </div>
  );
}
