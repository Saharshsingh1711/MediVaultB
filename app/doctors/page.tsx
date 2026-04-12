'use client'

import React, { useState, useEffect } from "react";
import { GlassCard } from "@/components/GlassCard";
import { Button } from "@/components/Button";
import { kmpSearch } from "@/lib/utils/kmp";
import { Search, User, FileText, Database, Shield, MapPin, DollarSign, ArrowRight, Star, Award, Loader2, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { SB_TABLES } from "@/lib/supabase/tables";
import { MOCK_DOCTORS_EXTENDED } from "@/lib/utils/mockDoctors";
// We use MOCK_RECORDS internally still since it represents personal records locally for the UI demo.

const MOCK_RECORDS = [
  { id: "1", title: "Allergy Report", content: "Severe Allergy to Penicillin confirmed in 2023.", type: "Lab Report" },
  { id: "2", title: "Cardiac Surgery", content: "Successful Cardiac bypass surgery performed.", type: "Surgery" },
  { id: "3", title: "Blood Test", content: "Glucose level indicates managed Diabetes.", type: "Lab Report" },
];

export default function DoctorsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchMode, setSearchMode] = useState<"specialists" | "records">("specialists");
  const [allDoctors, setAllDoctors] = useState<any[]>([]);
  const [doctors, setDoctors] = useState<any[]>([]);
  const [records, setRecords] = useState(MOCK_RECORDS);
  const [selectedCity, setSelectedCity] = useState("All Cities");
  const [cities, setCities] = useState<string[]>([]);
  const [syncStatus, setSyncStatus] = useState<Record<string, 'idle' | 'loading' | 'confirmed'>>({});

  const supabase = createClient();

  useEffect(() => {
    async function fetchDoctors() {
      const { data, error } = await supabase
        .from(SB_TABLES.user_doctor)
        .select('*');
      
      if (data && data.length > 0) {
        setAllDoctors(data);
        setDoctors(data);

        const uniqueCities = Array.from(new Set(data.map(d => d.city).filter(Boolean))) as string[];
        setCities(uniqueCities.sort());
      } else {
        // Fallback for demonstration since DB might be empty.
        setAllDoctors(MOCK_DOCTORS_EXTENDED);
        setDoctors(MOCK_DOCTORS_EXTENDED);

        const uniqueCities = Array.from(new Set(MOCK_DOCTORS_EXTENDED.map(d => d.city).filter(Boolean))) as string[];
        setCities(uniqueCities.sort());
      }
    }
    fetchDoctors();
  }, [supabase]);

  useEffect(() => {
    if (searchMode === "specialists") {
      const filtered = allDoctors.filter(doc => {
        const matchesQuery = doc.first_name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
                             doc.specialization?.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCity = selectedCity === "All Cities" || doc.city === selectedCity;
        return matchesQuery && matchesCity;
      });
      setDoctors(filtered);
    } else {
      const filtered = MOCK_RECORDS.filter(record => 
        kmpSearch(record.content, searchQuery) || 
        kmpSearch(record.title, searchQuery)
      );
      setRecords(filtered);
    }
  }, [searchQuery, searchMode, selectedCity, allDoctors]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const getMockRating = (xp: number) => {
      // Create a deterministic rating based on years of experience
      const base = 4.0;
      const boost = Math.min((xp || 0) * 0.06, 0.9);
      return (base + boost).toFixed(1);
  };

  const handleRequestSync = (doctorId: string) => {
    setSyncStatus(prev => ({ ...prev, [doctorId]: 'loading' }));
    
    // Simulate API delay for consultation booking confirmation
    setTimeout(() => {
      setSyncStatus(prev => ({ ...prev, [doctorId]: 'confirmed' }));
      
      // Save to localStorage for the /appointments page route
      try {
        const stored = localStorage.getItem('synced_appointments');
        const appointments = stored ? JSON.parse(stored) : [];
        if (!appointments.includes(doctorId)) {
          appointments.push(doctorId);
          localStorage.setItem('synced_appointments', JSON.stringify(appointments));
        }
      } catch (err) {
        console.error("Local storage sync error", err);
      }

      alert("✅ Secure sync protocol established. Consultation confirmed.");
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-[#FBFBFF] px-6 py-12 relative overflow-hidden flex flex-col items-center font-sans">
      {/* Decorative gradients */}
      <div className="absolute top-1/4 left-0 w-[600px] h-[600px] bg-indigo-100/20 rounded-full blur-[180px] pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-rose-100/20 rounded-full blur-[180px] pointer-events-none" />

      {/* Search Header */}
      <div className="w-full max-w-4xl space-y-10 mb-20 relative z-10">
        <div className="text-center space-y-4">
          <h1 className="text-5xl font-black tracking-tighter text-indigo-950 sm:text-7xl font-heading">
            Medivault <span className={cn("transition-colors duration-500", searchMode === "records" ? "text-rose-600" : "text-indigo-600")}>Discovery.</span>
          </h1>
          <p className="text-xs font-black text-slate-400 uppercase tracking-[0.3em]">
            {searchMode === "specialists" ? "Synchronized Specialist Network" : "Deep Scan Personal Pulse"}
          </p>
        </div>

        {/* Search Mode Toggle */}
        <div className="flex items-center justify-center p-1.5 bg-white border border-indigo-50 rounded-2xl max-w-sm mx-auto shadow-soft relative overflow-hidden">
          <div 
            className={cn(
              "absolute inset-y-1.5 w-[calc(50%-6px)] rounded-xl transition-all duration-500 ease-out shadow-soft bg-indigo-50 border border-indigo-100",
              searchMode === "records" ? "translate-x-full border-rose-100 bg-rose-50" : "translate-x-0"
            )}
          />
          <button 
            onClick={() => setSearchMode("specialists")}
            className={cn(
              "relative z-10 flex-1 flex items-center justify-center gap-2 py-3 text-[10px] font-black uppercase tracking-widest transition-colors duration-300",
              searchMode === "specialists" ? "text-indigo-600" : "text-slate-400 hover:text-slate-600"
            )}
          >
            <User className="h-3.5 w-3.5" />
            Specialists
          </button>
          <button 
            onClick={() => setSearchMode("records")}
            className={cn(
              "relative z-10 flex-1 flex items-center justify-center gap-2 py-3 text-[10px] font-black uppercase tracking-widest transition-colors duration-300",
              searchMode === "records" ? "text-rose-600" : "text-slate-400 hover:text-slate-600"
            )}
          >
            <FileText className="h-3.5 w-3.5" />
            Records
          </button>
        </div>

        <div className="relative group max-w-3xl mx-auto flex gap-4 mt-8">
          <div className="relative flex-1">
            <input
              type="text"
              placeholder={searchMode === "specialists" ? "Search specialists by name or specialization..." : "Scan records for triggers (e.g. Allergy)..."}
              value={searchQuery}
              onChange={handleSearch}
              className="w-full h-16 bg-white border border-indigo-100 rounded-3xl px-8 pr-16 text-indigo-950 text-lg shadow-soft focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-200 transition-all placeholder:text-slate-300 font-medium"
            />
            <div className="absolute right-5 top-1/2 -translate-y-1/2">
              <Search className={cn("h-6 w-6 transition-colors duration-500", searchMode === "records" ? "text-rose-400" : "text-indigo-400")} />
            </div>
          </div>
          {searchMode === "specialists" && (
            <select
              value={selectedCity}
              onChange={(e) => setSelectedCity(e.target.value)}
              className="h-16 bg-white border border-indigo-100 rounded-3xl px-6 text-indigo-950 font-black uppercase tracking-widest text-xs shadow-soft focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-200 cursor-pointer"
            >
              <option value="All Cities">All Cities</option>
              {cities.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* Results Grid */}
      <div className="w-full max-w-6xl grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 relative z-10">
        {searchMode === "specialists" ? (
          doctors.length > 0 ? (
            doctors.map((doc) => (
                <GlassCard key={doc.user_id} className="flex flex-col gap-6 p-8">
                <div className="flex items-center gap-4">
                  <div className="relative h-16 w-16 rounded-2xl overflow-hidden shadow-soft ring-4 ring-slate-50 flex-shrink-0 bg-indigo-50">
                    {doc.profilePicture ? (
                      <img src={doc.profilePicture} alt={doc.first_name} className="object-cover h-full w-full" />
                    ) : (
                      <div className="flex items-center justify-center h-full w-full text-indigo-300"><User className="h-6 w-6" /></div>
                    )}
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-xl font-bold text-indigo-950 truncate font-heading tracking-tight">Dr. {doc.first_name} {doc.second_name}</h3>
                    <p className="text-indigo-600 font-black uppercase tracking-widest text-[9px] truncate">{doc.specialization}</p>
                  </div>
                </div>
                
                <div className="space-y-3 pt-4 border-t border-indigo-50">
                  <div className="flex items-center gap-2 text-slate-500 text-xs font-bold tracking-tight">
                    <Star className="h-3.5 w-3.5 text-amber-400" />
                    {getMockRating(doc.yearsOfExperience)} <span className="text-slate-300 font-normal">({(doc.yearsOfExperience || 1) * 12 + 15} reviews)</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-500 text-xs font-bold tracking-tight">
                    <Award className="h-3.5 w-3.5 text-indigo-400" />
                    {doc.yearsOfExperience || 0}+ Years Experience
                  </div>
                  <div className="flex items-center gap-2 text-slate-500 text-xs font-bold tracking-tight">
                    <MapPin className="h-3.5 w-3.5 text-indigo-300" />
                    {doc.city}
                  </div>
                  <div className="flex items-center gap-2 text-slate-500 text-xs font-bold tracking-tight">
                    <DollarSign className="h-3.5 w-3.5 text-emerald-400" />
                    Consultation: ₹{doc.consultationFees || '1000'}
                  </div>
                </div>

                <Button 
                   variant="premium" 
                   className={cn(
                     "w-full h-12 text-[10px] group/btn transition-all duration-300",
                     syncStatus[doc.user_id] === 'confirmed' ? "bg-emerald-600 hover:bg-emerald-700 shadow-none border border-emerald-500" : ""
                   )}
                   disabled={syncStatus[doc.user_id] === 'loading' || syncStatus[doc.user_id] === 'confirmed'}
                   onClick={() => handleRequestSync(doc.user_id)}
                >
                  {syncStatus[doc.user_id] === 'loading' ? (
                     <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Initiating Protocol...</>
                  ) : syncStatus[doc.user_id] === 'confirmed' ? (
                     <><CheckCircle className="h-4 w-4 mr-2" /> Sync Confirmed</>
                  ) : (
                     <>Request Sync <ArrowRight className="h-3.5 w-3.5 ml-2 group-hover/btn:translate-x-1 transition-transform" /></>
                  )}
                </Button>
              </GlassCard>
            ))
          ) : (
            <NoResults />
          )
        ) : (
          records.length > 0 ? (
            records.map((record) => (
              <GlassCard key={record.id} className="flex flex-col gap-6 p-8 border-rose-100 bg-white hover:border-rose-300">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-rose-50 flex items-center justify-center text-rose-500 shadow-soft">
                      <Database className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-lg font-bold text-indigo-950 font-heading tracking-tight truncate">{record.title}</h4>
                      <p className="text-rose-500 font-black uppercase tracking-widest text-[9px]">{record.type}</p>
                    </div>
                  </div>
                  {record.content.includes("Severe") && <Shield className="h-5 w-5 text-rose-600 animate-pulse" />}
                </div>
                <p className="text-sm text-slate-500 italic leading-relaxed line-clamp-3 pl-4 border-l-2 border-rose-200 py-1">
                  {record.content}
                </p>
                <Button className="w-full h-12 bg-rose-600 hover:bg-rose-700 text-white shadow-soft text-[10px] font-black uppercase tracking-widest">
                  Reveal Pulse Data
                </Button>
              </GlassCard>
            ))
          ) : (
            <NoResults message="No matching medical patterns found." />
          )
        )}
      </div>
    </div>
  );
}

function NoResults({ message }: { message?: string }) {
  return (
    <div className="col-span-full py-32 text-center space-y-6">
      <div className="text-7xl opacity-50 grayscale select-none">🏥</div>
      <h3 className="text-xl font-bold text-slate-400 uppercase tracking-widest">
        {message || "No specialists found in current hub."}
      </h3>
      <Button variant="ghost" className="text-indigo-400 text-[10px] font-black uppercase tracking-widest hover:bg-indigo-50">
        Reset Search Parameters
      </Button>
    </div>
  );
}

