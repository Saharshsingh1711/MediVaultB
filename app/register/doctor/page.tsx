'use client'

import React, { useState } from "react";
import { GlassCard } from "@/components/GlassCard";
import { Button } from "@/components/Button";
import { cn } from "@/lib/utils";

export default function DoctorRegisterPage() {
  const [isPending, setIsPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsPending(true);
    setMessage(null);

    const formData = new FormData(e.currentTarget);
    
    // Add default consultation fees if empty
    const fees = formData.get("consultationFees") as string;
    if (!fees || fees.trim() === "") {
      formData.set("consultationFees", "500");
    }

    // Convert booleans to strings for the API
    formData.set("acceptedTerms", formData.get("acceptedTerms") === "on" ? "true" : "false");
    formData.set("availableForChat", formData.get("availableForChat") === "on" ? "true" : "false");

    // Convert comma-separated strings to JSON arrays as required by the API
    const parseToArray = (key: string) => {
      const val = formData.get(key) as string;
      const arr = val ? val.split(",").map(s => s.trim()).filter(s => s.length > 0) : [];
      formData.set(key, JSON.stringify(arr));
    };

    parseToArray("languagesSpoken");
    parseToArray("areaOfExpertise");
    parseToArray("awards");

    try {
      const res = await fetch("/api/sign-up-doc", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (res.ok) {
        setMessage("✅ Registration successful! Redirecting to login...");
        setTimeout(() => window.location.href = "/login", 2000);
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
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-100/30 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-violet-100/30 rounded-full blur-[120px] pointer-events-none" />

      <GlassCard className="w-full max-w-5xl border-indigo-50 shadow-premium p-10 md:p-16">
        <div className="space-y-16">
          <div className="text-center space-y-4">
            <h1 className="text-4xl md:text-5xl font-black text-indigo-950 tracking-tighter italic font-heading">
                Doctor <span className="not-italic text-indigo-600">Registration.</span>
            </h1>
            <p className="text-slate-500 font-medium text-lg tracking-tight">Join our network of world-class medical professionals.</p>
          </div>

          {message && (
            <div className={cn(
                "p-5 rounded-[1.5rem] text-center text-sm font-black uppercase tracking-widest shadow-soft animate-in zoom-in-95 duration-300",
                message.startsWith('✅') ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-rose-50 text-rose-600 border border-rose-100'
            )}>
              {message}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-20">
            {/* Section 1: Basic Information */}
            <section className="space-y-10">
              <div className="flex items-center gap-6">
                 <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-indigo-400 whitespace-nowrap">Identity & Contact</h3>
                 <div className="h-px bg-indigo-50 flex-1" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="space-y-3">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">First Name</label>
                  <input name="first_name" required className="w-full h-14 px-6 rounded-2xl bg-slate-50 border border-slate-100 text-indigo-950 focus:bg-white focus:outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all font-medium placeholder:text-slate-300" placeholder="John" />
                </div>
                <div className="space-y-3">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Middle Name</label>
                  <input name="middle_name" className="w-full h-14 px-6 rounded-2xl bg-slate-50 border border-slate-100 text-indigo-950 focus:bg-white focus:outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all font-medium placeholder:text-slate-300" placeholder="Quincy" />
                </div>
                <div className="space-y-3">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Last Name</label>
                  <input name="second_name" required className="w-full h-14 px-6 rounded-2xl bg-slate-50 border border-slate-100 text-indigo-950 focus:bg-white focus:outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all font-medium placeholder:text-slate-300" placeholder="Doe" />
                </div>
                <div className="space-y-3">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Date of Birth</label>
                  <input name="dateOfBirth" type="date" required className="w-full h-14 px-6 rounded-2xl bg-slate-50 border border-slate-100 text-indigo-950 focus:bg-white focus:outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all font-medium" />
                </div>
                <div className="space-y-3">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Gender</label>
                  <select name="gender" required className="w-full h-14 px-6 rounded-2xl bg-slate-50 border border-slate-100 text-indigo-950 focus:bg-white focus:outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all font-black text-xs uppercase tracking-widest appearance-none cursor-pointer">
                    <option value="MALE">Male</option>
                    <option value="FEMALE">Female</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>
                <div className="space-y-3">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Phone Number</label>
                  <input name="phone_number" required className="w-full h-14 px-6 rounded-2xl bg-slate-50 border border-slate-100 text-indigo-950 focus:bg-white focus:outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all font-medium placeholder:text-slate-300" placeholder="+1 234 567 890" />
                </div>
                <div className="space-y-3 md:col-span-2">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Email Address (Credential)</label>
                  <input name="email" type="email" required className="w-full h-14 px-6 rounded-2xl bg-slate-50 border border-slate-100 text-indigo-950 focus:bg-white focus:outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all font-medium placeholder:text-slate-300" placeholder="dr.john@medivault.com" />
                </div>
                <div className="space-y-3">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Security Key (Password)</label>
                  <input name="password" type="password" required className="w-full h-14 px-6 rounded-2xl bg-slate-50 border border-slate-100 text-indigo-950 focus:bg-white focus:outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all font-medium placeholder:text-slate-300" placeholder="••••••••" />
                </div>
              </div>
            </section>

            {/* Section 2: Professional Portfolio */}
            <section className="space-y-10">
              <div className="flex items-center gap-6">
                 <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-indigo-400 whitespace-nowrap">Clinical Portfolio</h3>
                 <div className="h-px bg-indigo-50 flex-1" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-3">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Registration Number</label>
                  <input name="registrationNumber" required className="w-full h-14 px-6 rounded-2xl bg-slate-50 border border-slate-100 text-indigo-950 focus:bg-white focus:outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all font-medium" placeholder="REG-123456" />
                </div>
                <div className="space-y-3">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Primary Degree</label>
                  <input name="primaryDegree" required className="w-full h-14 px-6 rounded-2xl bg-slate-50 border border-slate-100 text-indigo-950 focus:bg-white focus:outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all font-medium" placeholder="MBBS, MD" />
                </div>
                <div className="space-y-3">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Specialization</label>
                  <input name="specialization" required className="w-full h-14 px-6 rounded-2xl bg-slate-50 border border-slate-100 text-indigo-950 focus:bg-white focus:outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all font-medium" placeholder="Cardiology" />
                </div>
                <div className="space-y-3">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Years of Experience</label>
                  <input name="yearsOfExperience" type="number" required className="w-full h-14 px-6 rounded-2xl bg-slate-50 border border-slate-100 text-indigo-950 focus:bg-white focus:outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all font-medium" placeholder="10" />
                </div>
                <div className="space-y-3">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Clinic / Hospital Name</label>
                  <input name="clinicName" className="w-full h-14 px-6 rounded-2xl bg-slate-50 border border-slate-100 text-indigo-950 focus:bg-white focus:outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all font-medium" placeholder="Wellness Heart Center" />
                </div>
                <div className="space-y-3">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Consultation Fees ($)</label>
                  <input name="consultationFees" type="number" className="w-full h-14 px-6 rounded-2xl bg-slate-50 border border-slate-100 text-indigo-950 focus:bg-white focus:outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all font-medium" placeholder="500" />
                </div>

                <div className="space-y-3 md:col-span-2">
                   <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Areas of Expertise (Comma-separated)</label>
                   <input name="areaOfExpertise" className="w-full h-14 px-6 rounded-2xl bg-slate-50 border border-slate-100 text-indigo-950 focus:bg-white focus:outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all font-medium" placeholder="Echocardiography, Heart Failure, Interventional Cardiology" />
                </div>

                <div className="space-y-3">
                   <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Languages Spoken (Comma-separated)</label>
                   <input name="languagesSpoken" className="w-full h-14 px-6 rounded-2xl bg-slate-50 border border-slate-100 text-indigo-950 focus:bg-white focus:outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all font-medium" placeholder="English, Hindi, German" />
                </div>

                <div className="space-y-3">
                   <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Awards & Recognition (Comma-separated)</label>
                   <input name="awards" className="w-full h-14 px-6 rounded-2xl bg-slate-50 border border-slate-100 text-indigo-950 focus:bg-white focus:outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all font-medium" placeholder="Doctor of the Year 2023, Global Health Award" />
                </div>

                <div className="space-y-3 md:col-span-2">
                   <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Professional Bio</label>
                   <textarea name="aboutDoctor" className="w-full min-h-[160px] px-6 py-5 rounded-[2rem] bg-slate-50 border border-slate-100 text-indigo-950 focus:bg-white focus:outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all font-medium resize-none shadow-soft" placeholder="Brief summary of your professional journey..." />
                </div>
              </div>
            </section>

            {/* Section 3: Localization */}
            <section className="space-y-10">
              <div className="flex items-center gap-6">
                 <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-indigo-400 whitespace-nowrap">Geolocation</h3>
                 <div className="h-px bg-indigo-50 flex-1" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="space-y-3">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Primary City</label>
                  <input name="city" required className="w-full h-14 px-6 rounded-2xl bg-slate-50 border border-slate-100 text-indigo-950 focus:bg-white focus:outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all font-medium" placeholder="New York" />
                </div>
                <div className="space-y-3">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">State / Region</label>
                  <input name="state" required className="w-full h-14 px-6 rounded-2xl bg-slate-50 border border-slate-100 text-indigo-950 focus:bg-white focus:outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all font-medium" placeholder="NY" />
                </div>
                <div className="space-y-3">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Country</label>
                  <input name="country" required className="w-full h-14 px-6 rounded-2xl bg-slate-50 border border-slate-100 text-indigo-950 focus:bg-white focus:outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all font-medium" placeholder="USA" />
                </div>
                <div className="space-y-3 md:col-span-3">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Full Work Address</label>
                  <textarea name="address" required className="w-full px-6 py-4 rounded-[2rem] bg-slate-50 border border-slate-100 text-indigo-950 focus:bg-white focus:outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all font-medium min-h-[120px] resize-none shadow-soft" placeholder="123 Medical Way, Suite 100" />
                </div>
              </div>
            </section>

            {/* Section 4: Documentation */}
            <section className="space-y-10">
              <div className="flex items-center gap-6">
                 <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-indigo-400 whitespace-nowrap">Verification Assets</h3>
                 <div className="h-px bg-indigo-50 flex-1" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <div className="p-8 rounded-[2rem] bg-indigo-50/30 border border-indigo-100 space-y-4">
                  <label className="text-[10px] font-black text-indigo-950 uppercase tracking-widest ml-1 italic">Profile Picture (High-Res)</label>
                  <input name="profilePicture" type="file" required className="w-full text-xs font-black text-indigo-400 file:mr-6 file:py-3 file:px-8 file:rounded-2xl file:border-0 file:text-[10px] file:font-black file:uppercase file:tracking-widest file:bg-indigo-600 file:text-white hover:file:bg-indigo-700 transition-all cursor-pointer" />
                </div>
                <div className="p-8 rounded-[2rem] bg-indigo-50/30 border border-indigo-100 space-y-4">
                  <label className="text-[10px] font-black text-indigo-950 uppercase tracking-widest ml-1 italic">Registration Certificate</label>
                  <input name="registrationCertificate" type="file" required className="w-full text-xs font-black text-indigo-400 file:mr-6 file:py-3 file:px-8 file:rounded-2xl file:border-0 file:text-[10px] file:font-black file:uppercase file:tracking-widest file:bg-slate-200 file:text-slate-600 hover:file:bg-slate-300 transition-all cursor-pointer" />
                </div>
                <div className="p-8 rounded-[2rem] bg-indigo-50/30 border border-indigo-100 space-y-4">
                  <label className="text-[10px] font-black text-indigo-950 uppercase tracking-widest ml-1 italic">Degree Certificate</label>
                  <input name="degreeCertificate" type="file" required className="w-full text-xs font-black text-indigo-400 file:mr-6 file:py-3 file:px-8 file:rounded-2xl file:border-0 file:text-[10px] file:font-black file:uppercase file:tracking-widest file:bg-slate-200 file:text-slate-600 hover:file:bg-slate-300 transition-all cursor-pointer" />
                </div>
                <div className="p-8 rounded-[2rem] bg-indigo-50/30 border border-indigo-100 space-y-4">
                  <label className="text-[10px] font-black text-indigo-950 uppercase tracking-widest ml-1 italic">Valid Government ID</label>
                  <input name="governmentId" type="file" required className="w-full text-xs font-black text-indigo-400 file:mr-6 file:py-3 file:px-8 file:rounded-2xl file:border-0 file:text-[10px] file:font-black file:uppercase file:tracking-widest file:bg-slate-200 file:text-slate-600 hover:file:bg-slate-300 transition-all cursor-pointer" />
                </div>
              </div>
            </section>

            <div className="pt-16 text-center flex flex-col items-center gap-12">
               <div className="flex flex-col md:flex-row gap-12 bg-slate-50 p-6 rounded-[2rem] border border-slate-100">
                  <div className="flex items-center gap-4 text-slate-500 group cursor-pointer">
                    <input type="checkbox" name="availableForChat" className="w-6 h-6 rounded-lg border-slate-200 bg-white text-indigo-600 focus:ring-0 cursor-pointer" />
                    <span className="text-xs font-black uppercase tracking-widest group-hover:text-indigo-600 transition-colors">Telehealth Active</span>
                  </div>
                  <div className="flex items-center gap-4 text-slate-500 group cursor-pointer">
                    <input type="checkbox" name="acceptedTerms" required className="w-6 h-6 rounded-lg border-slate-200 bg-white text-indigo-600 focus:ring-0 cursor-pointer" />
                    <span className="text-xs font-black uppercase tracking-widest group-hover:text-indigo-600 transition-colors">Healthcare Protocol</span>
                  </div>
               </div>

              <Button type="submit" disabled={isPending} variant="premium" className="w-full max-w-sm h-18 text-base">
                {isPending ? "Synchronizing Vault..." : "Finalize Clinical Registration"}
              </Button>
            </div>
          </form>
        </div>
      </GlassCard>
    </div>
  );
}
