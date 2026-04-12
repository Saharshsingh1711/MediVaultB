'use client'

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "./Button";
import { createClient } from "@/lib/supabase/client";
import { logout } from "@/app/logout/action";
import {
  User,
  LogOut,
  LayoutDashboard,
  Menu,
  X,
  Search,
  Calendar,
  Zap,
  Settings,
  Home,
  FileText,
  ChevronRight
} from "lucide-react";
import { usePathname } from "next/navigation";
import { getUserRole, UserRole } from "@/lib/supabase/roles";
import LoadingOverlay from "./LoadingOverlay";
import EmergencyQR from "./EmergencyQR";
import { cn } from "@/lib/utils";

export default function Sidebar() {
  const [user, setUser] = useState<any>(null);
  const [userRole, setUserRole] = useState<UserRole>("none");
  const [loading, setLoading] = useState(true);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [showGoldenHour, setShowGoldenHour] = useState(false);
  const pathname = usePathname();
  const supabase = createClient();

  useEffect(() => {
    async function getUser() {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error || !user) {
        setUser(null);
        setUserRole("none");
      } else {
        setUser(user);
        const role = await getUserRole(user.id);
        setUserRole(role);
      }
      setLoading(false);
    }
    getUser();
  }, [supabase]);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    await supabase.auth.signOut();
    await logout();
  };

  const patientLinks = [
    { label: "My Hub", href: "/patient/dashboard", icon: LayoutDashboard },
    { label: "Find Doctors", href: "/doctors", icon: Search },
    { label: "Appointments", href: "/appointments", icon: Calendar },
    { label: "Golden Hour", href: "/dashboard/shift-summary", icon: Zap },
    { label: "Records", href: "/records", icon: FileText },
  ];


  const doctorLinks = [
    { label: "Doctor Hub", href: "/doctor/dashboard", icon: LayoutDashboard },
    { label: "Appointments", href: "/doctor/appointments", icon: Calendar },
    { label: "Documents", href: "/doctor/documents", icon: FileText },
    { label: "Records", href: "/records", icon: FileText },
  ];

  const links = userRole === "doctor" ? doctorLinks : patientLinks;

  const NavContent = () => (
    <div className="flex flex-col h-full py-8 px-6 bg-white">
      {/* Brand */}
      <div className="mb-12 px-2">
        <Link
          href="/"
          className="flex items-center gap-2 group"
          onClick={() => setIsMobileOpen(false)}
        >
          <div className="h-8 w-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-black text-lg shadow-premium transform group-hover:rotate-6 transition-transform">
            M
          </div>
          <span className="text-xl font-black tracking-tight text-indigo-950 font-heading">
            MEDIVAULT<span className="text-indigo-600">.</span>
          </span>
        </Link>
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 space-y-2">
        <div className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-6 px-4">
          Clinical Menu
        </div>
        {links.map((link) => {
          const Icon = link.icon;
          const isActive = pathname === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              onClick={(e) => {
                if (link.label === "Golden Hour") {
                  e.preventDefault();
                  setShowGoldenHour(true);
                  setIsMobileOpen(false);
                } else {
                  setIsMobileOpen(false);
                }
              }}
              className={cn(
                "flex items-center justify-between gap-3 px-4 py-3.5 rounded-2xl transition-all duration-300 group overflow-hidden relative",
                isActive
                  ? "bg-indigo-50 text-indigo-700 shadow-soft"
                  : "text-slate-500 hover:bg-slate-50 hover:text-indigo-600"
              )}
            >
              <div className="flex items-center gap-3 relative z-10">
                <Icon className={cn("h-5 w-5 transition-transform duration-300 group-hover:scale-110", isActive ? "text-indigo-600" : "text-slate-400 group-hover:text-indigo-600")} />
                <span className="text-sm font-bold tracking-tight">{link.label}</span>
              </div>
              {isActive && <ChevronRight className="h-4 w-4 text-indigo-400 animate-in fade-in slide-in-from-left-2 duration-300" />}
            </Link>
          );
        })}
      </nav>

      {/* User Area - Bottom */}
      <div className="mt-auto space-y-4 pt-8 border-t border-indigo-50">
        {!loading && user && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 px-3 py-3 rounded-3xl bg-slate-50 border border-slate-100">
              <div className="h-10 w-10 rounded-full bg-indigo-600 flex items-center justify-center text-white text-xs font-bold shadow-soft ring-4 ring-white">
                {user.email?.[0].toUpperCase()}
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-sm font-bold text-slate-900 truncate tracking-tight">{user.email?.split('@')[0]}</span>
                <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">{userRole} hub</span>
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="flex items-center gap-3 w-full px-5 py-3.5 rounded-2xl hover:bg-rose-50 text-slate-500 hover:text-rose-600 transition-all font-bold group"
            >
              <LogOut className="h-5 w-5 transition-transform group-hover:-translate-x-1" />
              <span className="text-sm">Log out of vault</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <>
      {isLoggingOut && <LoadingOverlay message="Securing Vault..." />}
      {/* Mobile Toggle */}
      <button
        onClick={() => setIsMobileOpen(!isMobileOpen)}
        className="fixed top-5 left-5 z-[60] md:hidden p-3 rounded-2xl bg-white border border-indigo-100 shadow-premium text-indigo-600"
      >
        {isMobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
      </button>

      {/* Sidebar - Desktop Overlay */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-50 w-72 h-screen bg-white border-r border-indigo-50 shadow-premium transition-transform duration-500 ease-in-out font-sans",
        isMobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
      )}>
        <NavContent />
      </aside>

      {/* Golden Hour Modal */}
      {showGoldenHour && user && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-indigo-950/20 backdrop-blur-xl animate-in fade-in duration-300">
          <div className="relative w-full max-w-lg">
            <button
              onClick={() => setShowGoldenHour(false)}
              className="absolute -top-12 right-0 p-2 text-indigo-950/40 hover:text-indigo-950 transition-colors"
            >
              <X className="h-8 w-8" />
            </button>
            <EmergencyQR patientId={user.id} patientName={user.email?.split('@')[0] || "Patient"} />
          </div>
        </div>
      )}

      {/* Mobile Background Overlay */}
      {(isMobileOpen || showGoldenHour) && (
        <div
          className="fixed inset-0 z-40 bg-indigo-950/10 backdrop-blur-sm md:hidden animate-in fade-in duration-300"
          onClick={() => {
            setIsMobileOpen(false);
            setShowGoldenHour(false);
          }}
        />
      )}
    </>
  );
}
