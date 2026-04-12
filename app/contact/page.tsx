"use client"

import React from "react"
import { Mail, Phone, MapPin, Send, Globe, Share2, MessageSquare } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { motion } from "framer-motion"

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

export default function ContactPage() {
  return (
    <div className="flex min-h-screen flex-col bg-[#FBFBFF] text-slate-900 pb-24 relative overflow-hidden selection:bg-indigo-100 selection:text-indigo-900">
      {/* Decorative Background Elements */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-indigo-100/30 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/4 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-violet-100/30 rounded-full blur-[120px] translate-y-1/2 -translate-x-1/4 pointer-events-none" />

      <main className="flex-1">
        {/* Header */}
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
                 <span className="text-xs font-bold text-indigo-950 uppercase tracking-widest">Connect with Us</span>
               </motion.div>
               <motion.h1
                 initial={{ opacity: 0, y: 20 }}
                 whileInView={{ opacity: 1, y: 0 }}
                 transition={{ duration: 0.7, delay: 0.2 }}
                 className="text-5xl md:text-6xl xl:text-7xl font-black text-indigo-950 leading-[1.1] tracking-tighter font-heading"
               >
                 Get in <span className="bg-gradient-to-r from-indigo-500 to-violet-500 bg-clip-text text-transparent">Touch.</span>
               </motion.h1>
               <motion.p
                 initial={{ opacity: 0, y: 20 }}
                 whileInView={{ opacity: 1, y: 0 }}
                 transition={{ duration: 0.7, delay: 0.4 }}
                 className="mx-auto max-w-[600px] text-lg md:text-xl text-slate-500 font-medium leading-relaxed"
               >
                 Our specialized support team is available 24/7 for critical inquiries and infrastructure assistance.
               </motion.p>
             </motion.div>
           </div>
        </section>

        {/* Contact Block */}
        <section className="w-full py-20 px-6 max-w-7xl mx-auto">
          <motion.div
             initial="hidden"
             whileInView="visible"
             viewport={{ once: true }}
             variants={staggerContainer}
             className="grid grid-cols-1 lg:grid-cols-3 gap-16"
          >
            {/* Contact Details */}
            <motion.div variants={itemFadeIn} className="space-y-12">
               <h2 className="text-3xl md:text-4xl font-black tracking-tighter font-heading text-indigo-950">Communication Channels.</h2>
               <div className="space-y-8">
                  {[
                    { icon: Mail, label: "Digital Correspondence", text: "support@medivault.io", color: "text-indigo-600", bg: "bg-indigo-50 border border-indigo-100" },
                    { icon: Phone, label: "Infrastructure Support", text: "+1 (555) 782-2458", color: "text-violet-600", bg: "bg-violet-50 border border-violet-100" },
                    { icon: MapPin, label: "Founding Hub", text: "San Francisco, California, US", color: "text-rose-600", bg: "bg-rose-50 border border-rose-100" }
                  ].map((item, i) => (
                    <div key={i} className="flex gap-6 items-center group">
                      <div className={`h-14 w-14 rounded-2xl flex items-center justify-center transition-all group-hover:scale-110 shadow-soft ${item.bg} ${item.color}`}>
                        <item.icon className="h-6 w-6" />
                      </div>
                      <div>
                          <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">{item.label}</h4>
                          <p className="text-lg font-bold text-indigo-950 tracking-tight">{item.text}</p>
                      </div>
                    </div>
                  ))}
               </div>

               <div className="space-y-6 pt-12 border-t border-indigo-100/50">
                  <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Global Presence</h4>
                  <div className="flex gap-4">
                    {[Globe, Share2, MessageSquare].map((Icon, idx) => (
                      <Button key={idx} variant="outline" size="icon" className="h-12 w-12 rounded-2xl border-indigo-100 hover:bg-indigo-50 hover:text-indigo-600 transition-all shadow-sm">
                          <Icon className="h-5 w-5" />
                      </Button>
                    ))}
                  </div>
               </div>
            </motion.div>

            {/* Contact Form */}
            <motion.div variants={itemFadeIn} className="lg:col-span-2 relative">
               <div className="absolute -inset-4 bg-indigo-100/30 rounded-[3rem] blur-2xl z-0" />
               <div className="relative z-10 p-10 lg:p-14 space-y-12 border border-indigo-100 shadow-xl bg-white rounded-[2.5rem]">
                  <div className="space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-3">
                         <label className="text-xs font-bold uppercase tracking-widest text-slate-500 ml-1">Full Identity</label>
                         <Input 
                           className="h-14 bg-slate-50 border-slate-100 rounded-2xl px-6 text-indigo-950" 
                           placeholder="Enter your name" 
                         />
                      </div>
                      <div className="space-y-3">
                         <label className="text-xs font-bold uppercase tracking-widest text-slate-500 ml-1">Email Terminal</label>
                         <Input 
                           type="email"
                           className="h-14 bg-slate-50 border-slate-100 rounded-2xl px-6 text-indigo-950" 
                           placeholder="email@example.com" 
                         />
                      </div>
                    </div>
                    <div className="space-y-3">
                       <label className="text-xs font-bold uppercase tracking-widest text-slate-500 ml-1">Inquiry Category</label>
                       <select className="flex h-14 w-full items-center justify-between bg-slate-50 border border-slate-100 rounded-2xl px-6 text-sm font-bold uppercase tracking-widest text-indigo-950 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:ring-offset-2 transition-all cursor-pointer appearance-none">
                          <option>General Support</option>
                          <option>Partnership Inquiry</option>
                          <option>Security Reporting</option>
                          <option>Medical Partnership</option>
                       </select>
                    </div>
                    <div className="space-y-3">
                       <label className="text-xs font-bold uppercase tracking-widest text-slate-500 ml-1">Detailed Message</label>
                       <Textarea 
                         className="bg-slate-50 border-slate-100 rounded-[2rem] px-6 py-5 text-indigo-950 min-h-[180px] resize-none" 
                         placeholder="What can we solve for you?" 
                         rows={6}
                       />
                    </div>
                  </div>
                  <Button size="lg" className="w-full h-16 rounded-3xl text-white bg-indigo-600 hover:bg-indigo-700 shadow-md group">
                    Initiate Transmission
                    <Send className="h-4 w-4 ml-4 transition-transform group-hover:translate-x-1 group-hover:-translate-y-1" />
                  </Button>
               </div>
            </motion.div>
          </motion.div>
        </section>
      </main>
    </div>
  )
}
