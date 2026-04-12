'use client'

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "./Button";
import { createClient } from "@/lib/supabase/client";
import { logout } from "@/app/logout/action";
import { User, LogOut, LayoutDashboard, ChevronDown, Menu, X } from "lucide-react";
import { usePathname } from "next/navigation";
import LoadingOverlay from "./LoadingOverlay";
import { getUserRole, UserRole } from "@/lib/supabase/roles";
import { cn } from "@/lib/utils";

export default function Navbar() {
  const [user, setUser] = useState<any>(null);
  const [userRole, setUserRole] = useState<UserRole>("none");
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const pathname = usePathname();
  const supabase = createClient();

  useEffect(() => {
    let mounted = true;

    async function initializeAuth() {
      // Single call to get initial session
      const { data: { session } } = await supabase.auth.getSession();

      if (!mounted) return;

      if (session?.user) {
        setUser(session.user);
        const role = await getUserRole(session.user.id);
        if (mounted) setUserRole(role);
      }
      setLoading(false);
    }

    initializeAuth();

    // Listener for subsequent changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;

      if (session?.user) {
        setUser(session.user);
        const role = await getUserRole(session.user.id);
        if (mounted) setUserRole(role);
      } else {
        setUser(null);
        setUserRole("none");
      }
      setLoading(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [supabase, pathname]);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    await supabase.auth.signOut();
    await logout();
    setIsOpen(false);
  };

  const isGatePage = pathname === "/" ||
    pathname.startsWith("/register") ||
    pathname.startsWith("/login") ||
    pathname === "/about" ||
    pathname === "/contact";

  if (!isGatePage) return null;

  const showProfile = user && !isGatePage;

  const navLinks = !showProfile ? [
    { name: "About", href: "/about" },
    { name: "Contact", href: "/contact" },
  ] : userRole === "doctor" ? [
    { name: "Appointments", href: "/doctor/appointments" },
    { name: "Documents", href: "/doctor/documents" },

  ] : [
    { name: "Find Doctors", href: "/doctors" },
    { name: "Appointments", href: "/appointments" },
    { name: "Golden Hour", href: "/dashboard/shift-summary" },

  ];

  return (
    <>
      {isLoggingOut && <LoadingOverlay message="Securing Vault..." />}
      <header className="fixed top-0 left-0 right-0 z-50 bg-[#FBFBFF]/80 backdrop-blur-xl border-b border-indigo-100/50">
        <nav className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          {/* Brand - Left */}
          <div className="flex-1 flex justify-start">
            <Link href="/" className="flex items-center gap-2 group">
              <div className="h-8 w-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-black text-lg shadow-premium transform group-hover:rotate-6 transition-transform">
                M
              </div>
              <span className="text-xl font-black tracking-tight text-indigo-950 font-heading">
                MEDIVAULT<span className="text-indigo-600">.</span>
              </span>
            </Link>
          </div>

          {/* Navigation Links - Center */}
          <div className="hidden md:flex items-center justify-center gap-10 flex-1">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                className="text-sm font-bold text-slate-500 hover:text-indigo-600 transition-colors tracking-tight"
              >
                {link.name}
              </Link>
            ))}
          </div>

          {/* Auth / Profile - Right */}
          <div className="flex-1 flex items-center justify-end gap-3 text-sm">
            {loading ? (
              <div className="h-10 w-32 rounded-full bg-slate-100 animate-pulse" />
            ) : showProfile ? (
              <div className="relative">
                <button
                  onClick={() => setIsOpen(!isOpen)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-indigo-100 hover:bg-indigo-50 transition-all"
                >
                  <div className="h-7 w-7 rounded-full bg-indigo-600 flex items-center justify-center text-white text-xs font-bold shadow-soft">
                    {user.email?.[0].toUpperCase()}
                  </div>
                  <ChevronDown className={cn("h-4 w-4 text-indigo-400 transition-transform", isOpen && "rotate-180")} />
                </button>

                {isOpen && (
                  <div className="absolute top-full right-0 mt-3 w-64 p-2 rounded-2xl bg-white border border-indigo-100 shadow-premium animate-in fade-in slide-in-from-top-2 duration-200">
                    <Link
                      href={userRole === "doctor" ? "/doctor/dashboard" : "/patient/dashboard"}
                      onClick={() => setIsOpen(false)}
                      className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-indigo-50 text-slate-600 hover:text-indigo-950 transition-all font-bold group"
                    >
                      <LayoutDashboard className="h-4 w-4 text-indigo-400" />
                      {userRole === "doctor" ? "Doctor Dashboard" : "Patient Dashboard"}
                    </Link>
                    <div className="h-px bg-indigo-50 my-1 mx-2" />
                    <button
                      onClick={handleLogout}
                      className="flex items-center gap-3 w-full px-4 py-3 rounded-xl hover:bg-rose-50 text-slate-600 hover:text-rose-600 transition-all font-bold"
                    >
                      <LogOut className="h-4 w-4" />
                      Logout
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-4">
                <Link href="/login" className="font-bold text-slate-600 hover:text-indigo-600 transition-colors">
                  Login
                </Link>
                <Link href="/register">
                  <Button variant="premium" size="sm" className="shadow-premium">
                    Get Started — it's free
                  </Button>
                </Link>
              </div>
            )}

            {/* Mobile Menu Button */}
            <button className="md:hidden p-2 text-slate-600" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
              {mobileMenuOpen ? <X /> : <Menu />}
            </button>
          </div>
        </nav>
      </header>
    </>
  );
}

