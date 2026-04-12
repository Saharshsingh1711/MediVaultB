'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { login } from './actions'
import { GlassCard } from '@/components/GlassCard'
import { Button } from '@/components/Button'
import { User, Stethoscope, ShieldCheck, Mail, Lock, ChevronLeft, ArrowRight } from 'lucide-react'
import LoadingOverlay from '@/components/LoadingOverlay'
import Link from 'next/link'
import { cn } from '@/lib/utils'

export default function LoginPage() {
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isPending, setIsPending] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()

  const [activeRole, setActiveRole] = useState<'patient' | 'doctor'>(
    (searchParams.get('role') as 'patient' | 'doctor') || 'patient'
  )

  const isDoctor = activeRole === 'doctor'
  const placeholder = isDoctor ? 'doctor@medivault.com' : 'patient@medivault.com'

  async function handleSubmit(formData: FormData) {
    setIsPending(true)
    setErrorMessage(null)

    const result = await login(formData)

    if (result?.success) {
      if (result.role === "doctor") {
        router.push("/doctor/dashboard")
      } else {
        router.push("/patient/dashboard")
      }
      router.refresh()
    } else if (result?.error) {
      setErrorMessage(result.error)
    }

    setIsPending(false)
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12 bg-[#FBFBFF] relative overflow-hidden font-sans">
      {isPending && <LoadingOverlay message="Securing Vault Connection..." />}

      {/* Decorative gradients */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full max-w-lg bg-indigo-200/20 blur-[120px] rounded-full -z-0" />

      <div className="w-full max-w-md relative z-10 space-y-8">
        {/* Back Link */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-400 hover:text-indigo-600 transition-colors group"
        >
          <ChevronLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
          Back to Terminal
        </Link>

        <GlassCard className="p-10 shadow-premium border-indigo-50/50">
          <div className="flex flex-col gap-10">
            <div className="space-y-4 text-center">
              <div className="inline-flex items-center justify-center h-12 w-12 rounded-2xl bg-indigo-600 text-white shadow-premium transform -rotate-3 mb-2">
                <Lock className="h-6 w-6" />
              </div>
              <h2 className="text-4xl font-black text-indigo-950 tracking-tighter font-heading">
                Initialize <span className="text-indigo-600">Access.</span>
              </h2>
              <p className="text-sm font-bold text-slate-400 uppercase tracking-[0.2em]">
                Secure Synchronization Hub
              </p>
            </div>

            {/* Role Switcher */}
            <div className="flex p-1.5 bg-slate-50 border border-slate-100 rounded-2xl relative">
              <div
                className={cn(
                  "absolute inset-y-1.5 w-[calc(50%-6px)] rounded-xl transition-all duration-500 ease-out shadow-soft bg-white border border-indigo-50",
                  isDoctor ? "translate-x-full" : "translate-x-0"
                )}
              />
              <button
                onClick={() => setActiveRole('patient')}
                className={cn(
                  "relative z-10 flex-1 flex items-center justify-center gap-2 py-3 text-xs font-black uppercase tracking-widest transition-colors duration-300",
                  !isDoctor ? "text-indigo-600" : "text-slate-400 hover:text-slate-600"
                )}
              >
                <User className="h-4 w-4" /> Patient
              </button>
              <button
                onClick={() => setActiveRole('doctor')}
                className={cn(
                  "relative z-10 flex-1 flex items-center justify-center gap-2 py-3 text-xs font-black uppercase tracking-widest transition-colors duration-300",
                  isDoctor ? "text-indigo-600" : "text-slate-400 hover:text-slate-600"
                )}
              >
                <Stethoscope className="h-4 w-4" /> Doctor
              </button>
            </div>

            <form action={handleSubmit} className="flex flex-col gap-6">
              <input type="hidden" name="intendedRole" value={activeRole} />

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">
                  Vault ID (Email or Patient ID)
                </label>
                <div className="relative group">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300 group-focus-within:text-indigo-500 transition-colors" />
                  <input
                    name="email"
                    type="text"
                    placeholder={isDoctor ? "doctor@medivault.com" : "patient@medivault.com or PAT-001"}
                    required
                    className="w-full pl-11 pr-5 py-4 rounded-2xl bg-slate-50 border border-slate-100 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:bg-white focus:border-indigo-100 transition-all font-bold text-sm text-indigo-950"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">
                  Access Key
                </label>
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300 group-focus-within:text-indigo-500 transition-colors" />
                  <input
                    name="password"
                    type="password"
                    placeholder="••••••••"
                    required
                    className="w-full pl-11 pr-5 py-4 rounded-2xl bg-slate-50 border border-slate-100 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:bg-white focus:border-indigo-100 transition-all font-bold text-sm text-indigo-950"
                  />
                </div>
              </div>

              <Button
                type="submit"
                variant="premium"
                disabled={isPending}
                className="mt-4 h-16 group"
              >
                {isPending ? "Validating Signal..." : "Authorize Pulse"}
                <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
            </form>

            {errorMessage && (
              <div className="p-4 rounded-2xl bg-rose-50 text-rose-600 text-xs font-black uppercase tracking-widest text-center border border-rose-100 animate-shake">
                {errorMessage}
              </div>
            )}

            <div className="text-center pt-8 border-t border-slate-50 space-y-4">
              <div className="flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-300">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" /> Multi-Layer Encryption Active
              </div>
              <p className="text-xs font-bold text-slate-400 tracking-tight">
                New to the network?
                <Link href="/register" className="ml-1 text-indigo-600 hover:text-indigo-700 transition-colors underline underline-offset-4">Create Vault</Link>
              </p>
            </div>
          </div>
        </GlassCard>
      </div>
    </div>
  )
}