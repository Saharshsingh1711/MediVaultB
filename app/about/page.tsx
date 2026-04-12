"use client"

import React from "react"
import { Shield, Target, Users, Zap, Heart, Database, ArrowRight, CheckCircle2 } from "lucide-react"
import Link from "next/link"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"

const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6 },
  },
}

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
}

const itemFadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5 },
  },
}

export default function AboutPage() {
  return (
    <div className="flex min-h-screen flex-col bg-[#FBFBFF] text-slate-900 pb-24 relative overflow-hidden selection:bg-indigo-100 selection:text-indigo-900">
      {/* Decorative Background Elements */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-indigo-100/30 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/4 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-violet-100/30 rounded-full blur-[120px] translate-y-1/2 -translate-x-1/4 pointer-events-none" />

      <main className="flex-1">
        <section className="w-full py-12 md:py-24 lg:py-32 xl:py-48 relative overflow-hidden">
           <div className="container px-4 md:px-6 relative z-10 mx-auto">
             <motion.div
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeIn}
                className="text-center space-y-6"
             >
               <motion.div
                 initial={{ opacity: 0, scale: 0.8 }}
                 whileInView={{ opacity: 1, scale: 1 }}
                 transition={{ duration: 0.5 }}
                 className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white border border-indigo-100 shadow-sm"
               >
                 <span className="text-xs font-bold text-indigo-950 uppercase tracking-widest">Our Vision</span>
               </motion.div>
               <motion.h1
                 initial={{ opacity: 0, y: 20 }}
                 whileInView={{ opacity: 1, y: 0 }}
                 transition={{ duration: 0.7, delay: 0.2 }}
                 className="text-5xl md:text-6xl xl:text-7xl font-black text-indigo-950 leading-[1.1] tracking-tighter font-heading"
               >
                 The Future of <span className="bg-gradient-to-r from-indigo-500 to-violet-500 bg-clip-text text-transparent">Medical Data.</span>
               </motion.h1>
               <motion.p
                 initial={{ opacity: 0, y: 20 }}
                 whileInView={{ opacity: 1, y: 0 }}
                 transition={{ duration: 0.7, delay: 0.4 }}
                 className="mx-auto max-w-[700px] text-lg md:text-xl text-slate-500 font-medium leading-relaxed"
               >
                 Medivault is a high-performance medical record ecosystem designed for the next generation of healthcare. We bridge the gap between patient privacy and emergency accessibility.
               </motion.p>
             </motion.div>
           </div>
        </section>

        {/* Mission Grid */}
        <section className="w-full py-20 px-6 max-w-7xl mx-auto">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="grid grid-cols-1 md:grid-cols-2 gap-20 items-center border-y border-indigo-100/50 py-16"
          >
            <motion.div variants={itemFadeIn} className="space-y-10">
              <h2 className="text-4xl md:text-5xl font-black tracking-tighter font-heading text-indigo-950">Our Core Mission.</h2>
              <p className="text-slate-500 leading-relaxed text-lg font-medium">
                In a world where medical data is fragmented and often inaccessible during critical "Golden Hour" emergencies, Medivault provides a unified, secure, and lightning-fast platform for both patients and providers.
              </p>
              <div className="space-y-6">
                {[
                  { icon: Shield, title: "Zero-Knowledge Privacy", desc: "Your records are encrypted and accessible only by you or authorized emergency triage." },
                  { icon: Zap, title: "KMP Search Engine", desc: "Proprietary algorithms for linear-time health pattern recognition across decades of data." },
                  { icon: Heart, title: "Emergency Synergy", desc: "Instantly bridge the gap between first responders and your medical history." }
                ].map((item, i) => (
                  <div key={i} className="flex gap-6 group">
                    <div className="h-14 w-14 shrink-0 rounded-2xl bg-white border border-indigo-100 flex items-center justify-center text-indigo-600 transition-all group-hover:bg-indigo-600 group-hover:text-white shadow-soft">
                      <item.icon className="h-6 w-6" />
                    </div>
                    <div className="flex-1 space-y-1">
                      <h4 className="font-bold text-indigo-950 uppercase tracking-widest text-[10px]">{item.title}</h4>
                      <p className="text-slate-500 text-sm font-medium leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
            <motion.div variants={itemFadeIn} className="relative">
              <div className="absolute -inset-4 bg-indigo-100/50 rounded-[3rem] blur-2xl" />
              <div className="relative aspect-square md:aspect-[4/5] flex items-center justify-center rounded-[2rem] overflow-hidden border border-indigo-100 shadow-xl bg-white p-12 hover:-translate-y-2 transition-transform duration-500">
                 <div className="flex flex-col items-center gap-6 text-center">
                  <div className="relative">
                      <div className="absolute inset-0 bg-indigo-50/50 blur-3xl rounded-full" />
                      <Database className="h-32 w-32 text-indigo-600/20 relative z-10" />
                  </div>
                  <div className="space-y-2">
                      <span className="text-xs font-black uppercase tracking-widest text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full">Protocol Zero</span>
                      <p className="text-slate-500 text-sm font-medium max-w-[200px] mt-4">Ensuring 99.99% availability for clinical retrieval.</p>
                  </div>
                 </div>
              </div>
            </motion.div>
          </motion.div>
        </section>

        {/* System Architecture Section */}
        <section className="w-full py-20 px-6 max-w-7xl mx-auto">
           <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeIn}
            className="text-center space-y-2 mb-12"
           >
             <h2 className="text-4xl md:text-5xl font-black text-indigo-950 font-heading tracking-tighter">Enterprise Architecture</h2>
             <p className="text-slate-500 text-lg md:text-xl font-medium max-w-2xl mx-auto">How your data travels securely from upload to emergency retrieval.</p>
           </motion.div>
           
           <motion.div
             initial="hidden"
             whileInView="visible"
             viewport={{ once: true }}
             variants={staggerContainer}
             className="relative p-8 md:p-12 bg-white border border-indigo-100 shadow-xl rounded-[2.5rem] group"
           >
              <div className="absolute inset-0 bg-gradient-to-r from-indigo-50/30 to-violet-50/30 opacity-0 group-hover:opacity-100 transition-opacity duration-1000 rounded-[2.5rem]"></div>
              
              <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8 text-center">
                 {/* Step 1 */}
                 <motion.div variants={itemFadeIn} className="flex-1 space-y-3">
                    <div className="w-14 h-14 mx-auto bg-indigo-50 border border-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center shadow-sm">
                       <Users className="h-6 w-6" />
                    </div>
                    <h4 className="text-base font-bold text-indigo-950">Patient Upload</h4>
                    <p className="text-sm font-medium text-slate-500 leading-relaxed">Raw medical data is uploaded via our secure gateway.</p>
                 </motion.div>
                 
                 <ArrowRight className="hidden md:block h-6 w-6 text-indigo-200" />
                 
                 {/* Step 2 */}
                 <motion.div variants={itemFadeIn} className="flex-1 space-y-3">
                    <div className="w-14 h-14 mx-auto bg-violet-50 border border-violet-100 text-violet-600 rounded-2xl flex items-center justify-center shadow-sm">
                       <Shield className="h-6 w-6" />
                    </div>
                    <h4 className="text-base font-bold text-indigo-950">AES Encryption</h4>
                    <p className="text-sm font-medium text-slate-500 leading-relaxed">Data is encrypted at rest and in transit instantly.</p>
                 </motion.div>
                 
                 <ArrowRight className="hidden md:block h-6 w-6 text-indigo-200" />
                 
                 {/* Step 3 */}
                 <motion.div variants={itemFadeIn} className="flex-1 space-y-3">
                    <div className="w-14 h-14 mx-auto bg-indigo-600 text-white rounded-2xl flex items-center justify-center shadow-md">
                       <Database className="h-6 w-6" />
                    </div>
                    <h4 className="text-base font-bold text-indigo-950">Immutable Vault</h4>
                    <p className="text-sm font-medium text-slate-500 leading-relaxed">Stored in our high-availability distributed database.</p>
                 </motion.div>

                 <ArrowRight className="hidden md:block h-6 w-6 text-indigo-200" />
                 
                 {/* Step 4 */}
                 <motion.div variants={itemFadeIn} className="flex-1 space-y-3">
                    <div className="w-14 h-14 mx-auto bg-emerald-50 border border-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center shadow-sm">
                       <Target className="h-6 w-6" />
                    </div>
                    <h4 className="text-base font-bold text-indigo-950">Emergency Auth</h4>
                    <p className="text-sm font-medium text-slate-500 leading-relaxed">Authorized doctors instantly retrieve decrypted data.</p>
                 </motion.div>
              </div>
           </motion.div>
        </section>

        {/* Vision Footer */}
        <section className="w-full py-24 md:py-32">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeIn}
            className="container max-w-5xl mx-auto"
           >
            <div className="bg-gradient-to-br from-indigo-50 to-violet-50 rounded-[3rem] p-12 md:p-20 text-center border border-indigo-100/50 shadow-soft relative overflow-hidden group">
               <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/5 to-violet-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
               <div className="relative z-10 space-y-8">
                 <h3 className="text-3xl md:text-5xl font-black tracking-tighter text-indigo-950/90 max-w-3xl mx-auto font-heading leading-tight">
                  Empowering individuals to own their health narrative through <span className="bg-gradient-to-r from-indigo-500 to-violet-500 bg-clip-text text-transparent">cryptography & design.</span>
                 </h3>
                 <div className="flex justify-center pt-4 gap-4 flex-col sm:flex-row">
                   <Link href="/register">
                     <Button size="lg" className="rounded-3xl h-14 px-8 text-white bg-indigo-600 hover:bg-indigo-700 shadow-md">
                       Join the Evolution
                     </Button>
                   </Link>
                   <Link href="/">
                     <Button variant="outline" size="lg" className="rounded-3xl h-14 px-8 border-indigo-200 bg-white hover:bg-slate-50">
                       Return Home
                     </Button>
                   </Link>
                 </div>
               </div>
            </div>
           </motion.div>
        </section>
      </main>
    </div>
  )
}
