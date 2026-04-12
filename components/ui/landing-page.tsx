"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import Link from "next/link"
import { motion } from "framer-motion"
import {
  Menu,
  X,
  ArrowRight,
  ChevronRight,
  Mail,
  MapPin,
  Phone,
  ArrowUpRight,
  Sparkles,
  Zap,
  Shield,
  Search,
  Activity,
  Heart,
  Star,
  ActivitySquare,
  FileText,
  Clock,
  Briefcase,
  Camera,
  MessageCircle,
  Code
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"

// Animation variants
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

export function DesignAgency() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [scrollY, setScrollY] = useState(0)

  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY)
    }

    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen)
  }

  return (
    <div className="flex min-h-screen flex-col bg-[#FBFBFF] text-slate-900 selection:bg-indigo-100 selection:text-indigo-900 overflow-hidden">


      <main className="flex-1">
        {/* Hero Section */}
        <section className="w-full relative overflow-hidden min-h-[600px] md:min-h-[700px] lg:min-h-[800px] flex items-center">
          {/* Background Image */}
          <div className="absolute inset-0 z-0">
            <Image
              src="/hero-art.jpeg"
              alt="Medivault Hero Background"
              fill
              className="object-cover"
              priority
            />
          </div>

          {/* Left-to-right dark gradient overlay */}
          <div className="absolute inset-0 z-[1] bg-gradient-to-r from-[#FBFBFF] via-[#FBFBFF]/90 via-45% to-transparent" />
          <div className="absolute inset-0 z-[1] bg-gradient-to-r from-indigo-950/10 via-transparent to-transparent" />

          {/* Content */}
          <div className="container px-4 md:px-6 relative z-10 mx-auto py-20 md:py-32">
            <div className="max-w-2xl">
              <motion.div
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeIn}
                className="flex flex-col justify-center space-y-6"
              >
                {/* Glassmorphism text container */}
                <div className="backdrop-blur-md bg-white/30 border border-white/40 rounded-[2.5rem] p-8 md:p-12 shadow-xl space-y-6">
                  <div className="space-y-4">
                    <motion.div
                      initial={{ opacity: 0, scale: 0.8 }}
                      whileInView={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.5 }}
                      className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/80 border border-indigo-100 shadow-sm"
                    >
                      <span className="px-2 py-0.5 rounded-full bg-indigo-600 text-[10px] font-black text-white uppercase tracking-widest">New</span>
                      <span className="text-xs font-bold text-indigo-950 tracking-tight">Revolutionizing Medical Record Management</span>
                    </motion.div>
                    <motion.h1
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.7, delay: 0.2 }}
                      className="text-5xl md:text-6xl xl:text-7xl font-black text-indigo-950 leading-[1.1] tracking-tighter font-heading"
                    >
                      Bring your <span className="bg-gradient-to-r from-indigo-500 to-violet-500 bg-clip-text text-transparent">Medical Legacy</span> to life in seconds.
                    </motion.h1>
                    <motion.p
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.7, delay: 0.4 }}
                      className="max-w-[550px] text-lg md:text-xl text-slate-600 font-medium leading-relaxed"
                    >
                      The intelligent medical vault designed for the next generation of healthcare. Secure, searchable, and always accessible when every second counts.
                    </motion.p>
                  </div>
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.7, delay: 0.6 }}
                    className="flex flex-col gap-4 sm:flex-row"
                  >
                    <Link href="/register">
                      <Button size="lg" className="rounded-3xl h-14 px-8 bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg group">
                        Get Started — it's free
                        <motion.span
                          initial={{ x: 0 }}
                          whileHover={{ x: 5 }}
                          transition={{ type: "spring", stiffness: 400, damping: 10 }}
                        >
                          <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                        </motion.span>
                      </Button>
                    </Link>
                    <Link href="#features">
                      <Button variant="outline" size="lg" className="rounded-3xl h-14 px-8 border-indigo-200 bg-white/80 hover:bg-white">
                        Explore Features
                      </Button>
                    </Link>
                  </motion.div>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Client / Partners Logos */}
        <section id="clients" className="w-full py-12 md:py-16 border-y border-indigo-100 bg-white/50">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeIn}
            className="container px-4 md:px-6 mx-auto"
          >
            <div className="flex flex-col items-center justify-center space-y-4 text-center py-6">
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
                className="text-xs font-bold text-slate-400 uppercase tracking-widest"
              >
                Trusted by Top Hospitals
              </motion.div>
            </div>
            <motion.div
              variants={staggerContainer}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="mx-auto grid grid-cols-2 items-center justify-center gap-8 py-8 md:grid-cols-4 max-w-5xl"
            >
              {["MAYO CLINIC", "CLEVELAND CLINIC", "JOHNS HOPKINS", "STANFORD HEALTH"].map((clinic, i) => (
                <motion.div
                  key={i}
                  variants={itemFadeIn}
                  whileHover={{ scale: 1.05 }}
                  className="flex items-center justify-center text-slate-400 font-black text-xl hover:text-indigo-500 transition-colors tracking-tighter"
                >
                  {clinic}
                </motion.div>
              ))}
            </motion.div>
          </motion.div>
        </section>

        {/* Features Section */}
        <section id="features" className="w-full py-20 md:py-32">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeIn}
            className="container px-4 md:px-6 mx-auto"
          >
            <div className="flex flex-col items-center justify-center space-y-4 text-center mb-16">
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
                className="inline-block rounded-full bg-indigo-50 border border-indigo-100 px-3 py-1 text-sm font-medium text-indigo-600"
              >
                Ecosystem
              </motion.div>
              <motion.h2
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="text-4xl md:text-5xl font-black text-indigo-950 font-heading tracking-tighter"
              >
                Engineered for Reliability
              </motion.h2>
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                className="mx-auto max-w-[700px] text-slate-500 text-lg md:text-xl font-medium"
              >
                Three pillars of the Medivault ecosystem.
              </motion.p>
            </div>
            
            <motion.div
              variants={staggerContainer}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="mx-auto grid max-w-6xl items-center gap-6 md:grid-cols-2 lg:grid-cols-3"
            >
              {[
                {
                  icon: <Shield className="h-8 w-8" />,
                  title: "Immutable Vault",
                  description:
                    "End-to-end encrypted storage for every clinical document. Your privacy is non-negotiable.",
                  color: "bg-indigo-600",
                },
                {
                  icon: <Zap className="h-8 w-8" />,
                  title: "KMP Discovery",
                  description:
                    "Search through years of records in linear time using our advanced pattern-matching engine.",
                  color: "bg-violet-600",
                },
                {
                  icon: <Star className="h-8 w-8" />,
                  title: "Golden Hour",
                  description:
                    "Instant triage access via secure protocols ensures life-saving data is always reachable.",
                  color: "bg-amber-500",
                },
              ].map((service, index) => (
                <motion.div
                  key={index}
                  variants={itemFadeIn}
                  whileHover={{ y: -5, transition: { duration: 0.3 } }}
                  className="group relative overflow-hidden rounded-[2rem] border border-indigo-100 bg-white p-8 shadow-sm transition-all hover:shadow-xl"
                >
                  <div className={`h-14 w-14 rounded-2xl flex items-center justify-center text-white mb-6 shadow-md transition-transform duration-500 group-hover:scale-110 ${service.color}`}>
                    {service.icon}
                  </div>
                  <h3 className="text-2xl font-bold font-heading text-indigo-950 mb-3">{service.title}</h3>
                  <p className="text-slate-500 font-medium leading-relaxed">{service.description}</p>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>
        </section>

        {/* Workflows Bento Grid */}
        <section id="workflows" className="w-full py-20 md:py-32 bg-indigo-50/50 border-y border-indigo-100/50">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeIn}
            className="container px-4 md:px-6 mx-auto"
          >
            <div className="flex flex-col items-center justify-center space-y-4 text-center mb-16">
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
                className="inline-block rounded-full bg-white border border-indigo-100 px-3 py-1 text-sm font-medium text-indigo-600 shadow-sm"
              >
                Workflows
              </motion.div>
              <motion.h2
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="text-4xl md:text-5xl font-black text-indigo-950 font-heading tracking-tighter"
              >
                How Medivault Works
              </motion.h2>
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                className="mx-auto max-w-[700px] text-slate-500 text-lg md:text-xl font-medium"
              >
                A seamless experience designed for both patients and healthcare providers.
              </motion.p>
            </div>

            <motion.div
              variants={staggerContainer}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="mx-auto grid max-w-7xl gap-4 py-8 md:grid-cols-4 md:grid-rows-2"
            >
              {/* Providers Experience */}
              <motion.div
                variants={itemFadeIn}
                whileHover={{ scale: 1.02 }}
                transition={{ duration: 0.3 }}
                className="group relative overflow-hidden rounded-[2rem] md:col-span-2 md:row-span-2 h-[400px] md:h-auto shadow-sm border border-indigo-100"
              >
                <div className="absolute inset-0 bg-gradient-to-t from-indigo-950/90 via-indigo-900/40 to-transparent opacity-60 transition-opacity group-hover:opacity-80 z-10"></div>
                <Image
                  src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=1200&auto=format&fit=crop"
                  alt="Provider Dashboard"
                  fill
                  className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 flex flex-col justify-end p-8 text-white z-20">
                  <h3 className="text-2xl font-bold font-heading mb-2">Provider Experience</h3>
                  <p className="text-indigo-100 mb-4 font-medium">Verify credentials, search for patients, and leverage AI insights instantly.</p>
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                  >
                    <Button
                      variant="outline"
                      size="sm"
                      className="rounded-full bg-white/20 backdrop-blur-md border-white/40 text-white hover:bg-white hover:text-indigo-900 transition-colors"
                    >
                      Providers Setup <ArrowUpRight className="ml-2 h-4 w-4" />
                    </Button>
                  </motion.div>
                </div>
              </motion.div>

              <motion.div
                variants={itemFadeIn}
                whileHover={{ scale: 1.02 }}
                transition={{ duration: 0.3 }}
                className="group relative overflow-hidden rounded-[2rem] h-[250px] shadow-sm border border-indigo-100 md:col-span-2"
              >
                <div className="absolute inset-0 bg-gradient-to-t from-violet-950/80 to-transparent opacity-60 group-hover:opacity-80 transition-opacity z-10"></div>
                <Image
                  src="https://images.unsplash.com/photo-1579684385127-1ef15d508118?q=80&w=600&auto=format&fit=crop"
                  alt="Patient Mobile App"
                  fill
                  className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 flex flex-col justify-end p-6 text-white z-20">
                  <h3 className="text-xl font-bold font-heading">Patient Experience</h3>
                  <p className="text-sm text-violet-100">Upload records, control access, and link with specialists.</p>
                </div>
              </motion.div>

              <motion.div
                variants={itemFadeIn}
                whileHover={{ scale: 1.02 }}
                transition={{ duration: 0.3 }}
                className="group relative overflow-hidden rounded-[2rem] h-[250px] shadow-sm border border-indigo-100"
              >
                <div className="absolute inset-0 bg-gradient-to-t from-indigo-950/80 to-transparent opacity-60 group-hover:opacity-80 transition-opacity z-10"></div>
                <Image
                  src="https://images.unsplash.com/photo-1555421689-d68471e189f2?q=80&w=600&auto=format&fit=crop"
                  alt="Secure Records"
                  fill
                  className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 flex flex-col justify-end p-6 text-white z-20">
                  <h3 className="text-lg font-bold font-heading">Analytics</h3>
                  <p className="text-sm text-indigo-100">AI-driven summaries</p>
                </div>
              </motion.div>

              <motion.div
                variants={itemFadeIn}
                whileHover={{ scale: 1.02 }}
                transition={{ duration: 0.3 }}
                className="group relative overflow-hidden rounded-[2rem] h-[250px] shadow-sm border border-indigo-100"
              >
                <div className="absolute inset-0 bg-gradient-to-t from-indigo-950/80 to-transparent opacity-60 group-hover:opacity-80 transition-opacity z-10"></div>
                <Image
                  src="https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?q=80&w=600&auto=format&fit=crop"
                  alt="Triage"
                  fill
                  className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 flex flex-col justify-end p-6 text-white z-20">
                  <h3 className="text-lg font-bold font-heading">Triage</h3>
                  <p className="text-sm text-indigo-100">Golden hour tech</p>
                </div>
              </motion.div>
            </motion.div>
            
            {/* Detailed Step-by-Step Workflows */}
            <div className="mt-24 space-y-24">
              {/* Patients Workflow */}
              <motion.div
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeIn}
              >
                 <div className="mb-10 text-center">
                     <div className="inline-flex items-center justify-center px-4 py-1.5 rounded-full bg-violet-100 border border-violet-200 text-violet-700 font-bold text-sm tracking-widest uppercase mb-4">Patient Experience</div>
                 </div>
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-12 relative">
                   <div className="hidden md:block absolute top-[3rem] left-[15%] right-[15%] h-0.5 bg-gradient-to-r from-violet-200 via-indigo-200 to-violet-200 z-0"></div>
                   <div className="relative z-10 flex flex-col items-center text-center space-y-6 group">
                     <div className="w-24 h-24 rounded-full bg-white border-4 text-violet-600 group-hover:border-violet-100 border-violet-50 transition-colors shadow-soft flex items-center justify-center text-3xl font-black font-heading">01</div>
                     <div className="space-y-3">
                       <h3 className="text-2xl font-bold text-indigo-950">Register & Connect</h3>
                       <p className="text-slate-500 font-medium leading-relaxed">Create your secure Medivault ID and instantly link with top-tier hospitals and specialists.</p>
                     </div>
                   </div>
                   <div className="relative z-10 flex flex-col items-center text-center space-y-6 group">
                     <div className="w-24 h-24 rounded-full bg-white border-4 text-violet-600 group-hover:border-violet-100 border-violet-50 transition-colors shadow-soft flex items-center justify-center text-3xl font-black font-heading">02</div>
                     <div className="space-y-3">
                       <h3 className="text-2xl font-bold text-indigo-950">Digitize Records</h3>
                       <p className="text-slate-500 font-medium leading-relaxed">Upload past medical history, lab reports, and prescriptions into your personal encrypted vault.</p>
                     </div>
                   </div>
                   <div className="relative z-10 flex flex-col items-center text-center space-y-6 group">
                     <div className="w-24 h-24 rounded-full bg-white border-4 text-violet-600 group-hover:border-violet-100 border-violet-50 transition-colors shadow-soft flex items-center justify-center text-3xl font-black font-heading">03</div>
                     <div className="space-y-3">
                       <h3 className="text-2xl font-bold text-indigo-950">Grant Access</h3>
                       <p className="text-slate-500 font-medium leading-relaxed">Control who sees your data. Instantly grant emergency access to verified doctors when seconds count.</p>
                     </div>
                   </div>
                 </div>
              </motion.div>

              {/* Doctors Workflow */}
              <motion.div
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeIn}
              >
                 <div className="mb-10 text-center">
                     <div className="inline-flex items-center justify-center px-4 py-1.5 rounded-full bg-indigo-100 border border-indigo-200 text-indigo-700 font-bold text-sm tracking-widest uppercase mb-4">Provider Experience</div>
                 </div>
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-12 relative">
                   <div className="hidden md:block absolute top-[3rem] left-[15%] right-[15%] h-0.5 bg-gradient-to-r from-indigo-200 via-violet-200 to-indigo-200 z-0"></div>
                   <div className="relative z-10 flex flex-col items-center text-center space-y-6 group">
                     <div className="w-24 h-24 rounded-full bg-white border-4 text-indigo-600 group-hover:border-indigo-100 border-indigo-50 transition-colors shadow-soft flex items-center justify-center text-3xl font-black font-heading">01</div>
                     <div className="space-y-3">
                       <h3 className="text-2xl font-bold text-indigo-950">Verify Credentials</h3>
                       <p className="text-slate-500 font-medium leading-relaxed">Onboard through our rigorous verification process to join the Medivault specialist network.</p>
                     </div>
                   </div>
                   <div className="relative z-10 flex flex-col items-center text-center space-y-6 group">
                     <div className="w-24 h-24 rounded-full bg-white border-4 text-indigo-600 group-hover:border-indigo-100 border-indigo-50 transition-colors shadow-soft flex items-center justify-center text-3xl font-black font-heading">02</div>
                     <div className="space-y-3">
                       <h3 className="text-2xl font-bold text-indigo-950">Discover & Request</h3>
                       <p className="text-slate-500 font-medium leading-relaxed">Search for patients via Medivault ID and request instant access to their full medical history.</p>
                     </div>
                   </div>
                   <div className="relative z-10 flex flex-col items-center text-center space-y-6 group">
                     <div className="w-24 h-24 rounded-full bg-white border-4 text-indigo-600 group-hover:border-indigo-100 border-indigo-50 transition-colors shadow-soft flex items-center justify-center text-3xl font-black font-heading">03</div>
                     <div className="space-y-3">
                       <h3 className="text-2xl font-bold text-indigo-950">Clinical Insights</h3>
                       <p className="text-slate-500 font-medium leading-relaxed">Leverage AI-driven summaries and high-density dashboard views to make split-second clinical decisions.</p>
                     </div>
                   </div>
                 </div>
              </motion.div>
            </div>
          </motion.div>
        </section>

        {/* Metrics/Stats Section */}
        <section id="metrics" className="w-full py-20 md:py-32 bg-indigo-950 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/3 w-[800px] h-[800px] bg-indigo-500/20 blur-[120px] rounded-full pointer-events-none"></div>
          <div className="absolute bottom-0 left-0 translate-y-1/2 -translate-x-1/3 w-[600px] h-[600px] bg-violet-600/20 blur-[120px] rounded-full pointer-events-none"></div>
          
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-16 relative z-10 px-4 md:px-6"
          >
             {[
                { value: "2M+", label: "Records Secured" },
                { value: "99.9%", label: "Uptime Guarantee"  },
                { value: "150+", label: "Partner Clinics" },
                { value: "<1s", label: "Retrieval Time" }
             ].map((stat, idx) => (
                <motion.div key={idx} variants={itemFadeIn} className="space-y-4 text-center group">
                  <div className="text-4xl md:text-6xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-br from-white to-indigo-200 group-hover:scale-105 transition-transform duration-500">
                    {stat.value}
                  </div>
                  <div className="text-sm font-bold tracking-widest text-indigo-300 uppercase">
                    {stat.label}
                  </div>
                </motion.div>
             ))}
          </motion.div>
        </section>

        {/* Testimonials */}
        <section id="testimonials" className="w-full py-20 md:py-32">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeIn}
            className="container px-4 md:px-6 mx-auto relative z-10"
          >
            <div className="flex flex-col items-center justify-center space-y-4 text-center mb-16">
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
                className="inline-block rounded-full bg-indigo-50 border border-indigo-100 px-3 py-1 text-sm font-medium text-indigo-600 shadow-sm"
              >
                Testimonials
              </motion.div>
              <motion.h2
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="text-4xl md:text-5xl font-black font-heading tracking-tighter text-indigo-950"
              >
                What Providers & Patients Say
              </motion.h2>
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                className="mx-auto max-w-[700px] text-slate-500 text-lg md:text-xl font-medium"
              >
                Hear from those who rely on Medivault every day.
              </motion.p>
            </div>
            <motion.div
               variants={staggerContainer}
               initial="hidden"
               whileInView="visible"
               viewport={{ once: true }}
               className="mx-auto grid max-w-6xl gap-6 md:grid-cols-2"
            >
              {[
                {
                  quote:
                    "Medivault transformed our emergency response. Searching for a patient’s allergy records literally takes an instant, saving precious seconds during critical interventions.",
                  author: "Dr. Sarah Johnson",
                  company: "Emergency Trauma, Johns Hopkins",
                },
                {
                  quote:
                    "Having my entire medical history secured on my phone gives me such peace of mind. I'm always prepared when changing specialists.",
                  author: "Michael Chen",
                  company: "Patient user since 2023",
                },
              ].map((testimonial, index) => (
                <motion.div
                  key={index}
                  variants={itemFadeIn}
                  whileHover={{ y: -5 }}
                  className="flex flex-col justify-between rounded-[2rem] border border-indigo-100 bg-white p-8 shadow-md"
                >
                  <div>
                    <div className="flex gap-1 text-amber-400 mb-6">
                      {[...Array(5)].map((_, i) => (
                        <svg
                          key={i}
                          xmlns="http://www.w3.org/2000/svg"
                          width="24"
                          height="24"
                          viewBox="0 0 24 24"
                          fill="currentColor"
                          className="h-5 w-5"
                        >
                          <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                        </svg>
                      ))}
                    </div>
                    <blockquote className="text-lg font-medium leading-relaxed text-indigo-950">"{testimonial.quote}"</blockquote>
                  </div>
                  <div className="mt-8 flex items-center">
                    <div className="h-12 w-12 rounded-full bg-indigo-600 flex items-center justify-center text-xl font-bold font-heading text-white">
                      {testimonial.author.charAt(0)}
                    </div>
                    <div className="ml-4">
                      <p className="font-bold font-heading text-lg text-indigo-950">{testimonial.author}</p>
                      <p className="text-sm text-slate-500 font-medium">{testimonial.company}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>
        </section>

        {/* Contact/CTA Section */}
        <section id="contact" className="w-full py-20 md:py-32">
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
                 <h2 className="text-4xl md:text-5xl font-black text-indigo-950 font-heading tracking-tighter">Ready to secure your medical future?</h2>
                 <p className="text-xl text-slate-500 font-medium max-w-2xl mx-auto">Join thousands of patients and doctors already experiencing the next generation of healthcare data management.</p>
                 <div className="flex justify-center pt-4">
                   <Link href="/register">
                     <Button size="lg" className="rounded-3xl h-16 px-12 text-lg bg-indigo-600 hover:bg-indigo-700 text-white shadow-xl shadow-indigo-200/50 hover:-translate-y-1 transition-all">
                       Create Free Account
                     </Button>
                   </Link>
                 </div>
               </div>
            </div>
          </motion.div>
        </section>
      </main>

      {/* Footer */}
      <footer className="w-full border-t border-indigo-100 bg-white py-12">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeIn}
          className="container mx-auto px-4 md:px-6 flex flex-col md:flex-row justify-between items-center gap-8 text-slate-400 text-xs font-bold uppercase tracking-widest"
        >
          <div className="flex items-center gap-3">
             <div className="h-8 w-8 rounded-xl bg-indigo-600 flex items-center justify-center shadow-sm">
                <span className="text-white text-xs font-black">M</span>
             </div>
             <span className="font-heading text-lg tracking-tight text-indigo-950 normal-case font-black">Medivault.</span>
          </div>
          
          <div className="flex flex-wrap justify-center gap-6 md:gap-8">
            <Link href="#features" className="hover:text-indigo-600 transition-colors">Features</Link>
            <Link href="#workflows" className="hover:text-indigo-600 transition-colors">Workflows</Link>
            <Link href="#metrics" className="hover:text-indigo-600 transition-colors">Metrics</Link>
            <Link href="/login" className="hover:text-indigo-600 transition-colors">Log In</Link>
          </div>
          
          <div className="flex items-center gap-4">
             <Link href="#" className="hover:text-indigo-600 transition-colors"><MessageCircle className="h-4 w-4" /></Link>
             <Link href="#" className="hover:text-indigo-600 transition-colors"><Briefcase className="h-4 w-4" /></Link>
             <Link href="#" className="hover:text-indigo-600 transition-colors"><Code className="h-4 w-4" /></Link>
          </div>
        </motion.div>
        
        <div className="container mx-auto px-4 md:px-6 pt-8 mt-8 border-t border-slate-100 flex flex-col md:flex-row items-center justify-center gap-4 text-xs font-medium text-slate-400">
          <p>© {new Date().getFullYear()} Medivault Corp. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}
