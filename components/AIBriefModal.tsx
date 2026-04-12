'use client'

import React, { useState, useEffect } from "react";
import { X, ExternalLink, BrainCircuit, Loader2, FileCheck, Stethoscope, ClipboardList, AlertTriangle, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

interface AISummaryData {
  shortBrief: string;
  keyFindings: string[];
  recommendations: string[];
  confidenceScore: number;
  documentType: string;
}

interface AIBriefModalProps {
  isOpen: boolean;
  onClose: () => void;
  recordTitle: string;
  rawText: string | null;
  fileUrl: string;
  aiSummary: string | null;
}

export default function AIBriefModal({ isOpen, onClose, recordTitle, rawText, fileUrl, aiSummary }: AIBriefModalProps) {
  const [summary, setSummary] = useState<AISummaryData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    // If we already have a stored AI summary, use it
    if (aiSummary) {
      try {
        const parsed = JSON.parse(aiSummary);
        setSummary(parsed);
        setError(null);
        return;
      } catch {
        // Fall through to fetch
      }
    }

    // If we have raw text but no stored summary, fetch one live
    if (rawText && rawText.trim().length > 10) {
      fetchAnalysis();
    } else {
      setSummary({
        shortBrief: `The document "${recordTitle}" could not be analyzed — insufficient text was extracted from the file.`,
        keyFindings: [
          "The uploaded document may be a scanned image without selectable text.",
          "Try uploading a text-based PDF for better AI analysis.",
          "Manual review of the original document is recommended.",
        ],
        recommendations: ["Upload a text-based PDF or consult your physician for interpretation."],
        confidenceScore: 0,
        documentType: "Unknown",
      });
    }
  }, [isOpen, aiSummary, rawText, recordTitle]);

  const fetchAnalysis = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/analyze-pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: rawText, title: recordTitle }),
      });

      if (!response.ok) throw new Error(`Analysis failed (${response.status})`);

      const data = await response.json();
      if (data.summary) {
        setSummary(data.summary);
      } else {
        throw new Error("No summary returned");
      }
    } catch (err: any) {
      setError(err.message || "Failed to analyze document");
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  const confidenceColor = (score: number) => {
    if (score >= 80) return "text-emerald-600 bg-emerald-50 border-emerald-100";
    if (score >= 50) return "text-amber-600 bg-amber-50 border-amber-100";
    return "text-rose-600 bg-rose-50 border-rose-100";
  };

  const docTypeIcon = (type: string) => {
    const lower = type?.toLowerCase() || "";
    if (lower.includes("lab")) return <Stethoscope className="h-4 w-4" />;
    if (lower.includes("prescription")) return <ClipboardList className="h-4 w-4" />;
    if (lower.includes("imaging")) return <FileCheck className="h-4 w-4" />;
    return <BrainCircuit className="h-4 w-4" />;
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-indigo-950/20 backdrop-blur-md animate-in fade-in duration-300" onClick={onClose}>
      <div className="max-w-[560px] w-full relative z-10 animate-in zoom-in-95 duration-500 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="bg-white rounded-[2rem] shadow-premium overflow-hidden border border-indigo-50">
          {/* Header */}
          <div className="p-8 pb-6 border-b border-slate-50 relative">
            <button 
                onClick={onClose}
                className="absolute top-6 right-6 text-slate-400 hover:text-indigo-600 transition-colors p-2 hover:bg-slate-50 rounded-xl"
            >
                <X className="h-5 w-5" />
            </button>
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center text-white shadow-md">
                 <BrainCircuit className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-xl font-black text-indigo-950 italic tracking-tight font-heading">Groq AI Analysis</h3>
                <p className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em]">Powered by LLaMA 3.3 70B</p>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-8 space-y-6 bg-slate-50/30">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-16 gap-4">
                <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center shadow-lg">
                  <Loader2 className="h-7 w-7 text-white animate-spin" />
                </div>
                <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest animate-pulse">Analyzing with Groq AI...</p>
              </div>
            ) : error ? (
              <div className="flex flex-col items-center justify-center py-12 gap-4">
                <div className="h-14 w-14 rounded-2xl bg-rose-50 flex items-center justify-center text-rose-500">
                  <AlertTriangle className="h-7 w-7" />
                </div>
                <p className="text-sm font-bold text-rose-600 text-center">{error}</p>
                <button 
                  onClick={fetchAnalysis}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-indigo-50 text-indigo-600 text-[10px] font-black uppercase tracking-widest hover:bg-indigo-100 transition-all"
                >
                  <RefreshCw className="h-3.5 w-3.5" /> Retry Analysis
                </button>
              </div>
            ) : summary ? (
              <>
                {/* Confidence & Type Badges */}
                <div className="flex items-center gap-3 flex-wrap">
                  <span className={cn(
                    "px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest border",
                    confidenceColor(summary.confidenceScore)
                  )}>
                    Confidence: {summary.confidenceScore}%
                  </span>
                  {summary.documentType && summary.documentType !== "Unknown" && (
                    <span className="px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest border bg-indigo-50 text-indigo-600 border-indigo-100 flex items-center gap-1.5">
                      {docTypeIcon(summary.documentType)}
                      {summary.documentType}
                    </span>
                  )}
                </div>

                {/* Short Brief */}
                <div className="space-y-3">
                   <h4 className="text-xs font-black text-indigo-950 uppercase tracking-widest">Summary</h4>
                   <div className="p-5 rounded-2xl bg-white border border-indigo-50 shadow-sm">
                     <p className="text-sm font-medium text-slate-600 leading-relaxed">
                       {summary.shortBrief}
                     </p>
                   </div>
                </div>

                {/* Key Findings */}
                {summary.keyFindings?.length > 0 && (
                  <div className="space-y-4">
                     <h4 className="text-xs font-black text-indigo-950 uppercase tracking-widest">Key Findings</h4>
                     <ul className="space-y-3">
                       {summary.keyFindings.map((finding, idx) => (
                          <li key={idx} className="flex items-start gap-3 p-4 rounded-xl bg-white border border-indigo-50 shadow-sm">
                             <div className="h-1.5 w-1.5 rounded-full bg-indigo-500 mt-2 flex-shrink-0" />
                             <span className="text-sm font-medium text-slate-600 leading-relaxed">{finding}</span>
                          </li>
                       ))}
                     </ul>
                  </div>
                )}

                {/* Recommendations */}
                {summary.recommendations?.length > 0 && (
                  <div className="space-y-4">
                     <h4 className="text-xs font-black text-indigo-950 uppercase tracking-widest flex items-center gap-2">
                       <Stethoscope className="h-3.5 w-3.5 text-indigo-400" />
                       Recommendations
                     </h4>
                     <ul className="space-y-3">
                       {summary.recommendations.map((rec, idx) => (
                          <li key={idx} className="flex items-start gap-3 p-4 rounded-xl bg-violet-50/50 border border-violet-100">
                             <span className="text-[10px] font-black text-violet-500 mt-0.5">→</span>
                             <span className="text-sm font-medium text-slate-600 leading-relaxed">{rec}</span>
                          </li>
                       ))}
                     </ul>
                  </div>
                )}
              </>
            ) : null}
          </div>

          {/* Footer */}
          <div className="p-6 md:px-8 border-t border-slate-50 flex flex-col md:flex-row items-center justify-between gap-4 bg-white">
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest ml-2 hidden md:block">
               AI-generated — Not a medical diagnosis.
            </p>
            <a href={fileUrl} target="_blank" rel="noreferrer" className="w-full md:w-auto">
              <button className="w-full flex items-center justify-center gap-2 h-12 px-6 rounded-2xl border-2 border-indigo-100 text-indigo-600 bg-indigo-50/50 hover:bg-indigo-100/50 hover:border-indigo-200 transition-all shadow-soft text-[10px] font-black uppercase tracking-widest">
                 <ExternalLink className="h-4 w-4" />
                 View Original
              </button>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
