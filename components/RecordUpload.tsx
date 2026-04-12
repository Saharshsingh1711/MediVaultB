'use client'

import React, { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "./Button";
import { FileText, Loader2, Upload, AlertCircle, CheckCircle, Sparkles, BrainCircuit } from "lucide-react";
import { SB_TABLES } from "@/lib/supabase/tables";
import { cn } from "@/lib/utils";

export default function RecordUpload({ onUploadComplete }: { onUploadComplete?: () => void }) {
  const [isUploading, setIsUploading] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const supabase = createClient();

  const extractTextFromPDF = async (file: File): Promise<string> => {
    setIsScanning(true);
    setProgress(10);
    setStatusText("Loading PDF engine...");

    try {
      const pdfjs = await import("pdfjs-dist");
      pdfjs.GlobalWorkerOptions.workerSrc = `/pdf.worker.min.mjs`;

      setProgress(20);
      setStatusText("Parsing document structure...");

      const arrayBuffer = await file.arrayBuffer();
      const loadingTask = pdfjs.getDocument({ data: arrayBuffer });
      const pdf = await loadingTask.promise;
      const numPages = pdf.numPages;
      let fullText = "";

      // Attempt 1: Extract selectable text layer
      for (let i = 1; i <= Math.min(numPages, 10); i++) {
        setProgress(20 + Math.round((i / Math.min(numPages, 10)) * 20));
        setStatusText(`Extracting text layer — page ${i}/${Math.min(numPages, 10)}...`);

        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items
          .map((item: any) => item.str)
          .join(" ");
        fullText += pageText + "\n\n";
      }

      // Check if we got meaningful text
      const cleanedText = fullText.replace(/\s+/g, " ").trim();
      if (cleanedText.length > 20) {
        return cleanedText;
      }

      // Attempt 2: OCR fallback for scanned/image-based PDFs
      console.log("PDF text layer empty — falling back to OCR...");
      setProgress(45);
      setStatusText("Scanned PDF detected — starting OCR...");

      const Tesseract = (await import("tesseract.js")).default;
      let ocrText = "";

      for (let i = 1; i <= Math.min(numPages, 5); i++) {
        setProgress(45 + Math.round((i / Math.min(numPages, 5)) * 30));
        setStatusText(`OCR scanning page ${i}/${Math.min(numPages, 5)}...`);

        const page = await pdf.getPage(i);
        const viewport = page.getViewport({ scale: 2.0 }); // Higher scale = better OCR

        // Render page to canvas
        const canvas = document.createElement("canvas");
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        const ctx = canvas.getContext("2d")!;

        await page.render({ canvasContext: ctx, viewport, canvas } as any).promise;

        // Convert canvas to image data and run OCR
        const imageData = canvas.toDataURL("image/png");
        const { data: { text: pageOcrText } } = await Tesseract.recognize(
          imageData,
          "eng",
          {
            logger: (m: any) => {
              if (m.status === "recognizing text") {
                setStatusText(`OCR page ${i} — ${Math.round(m.progress * 100)}%`);
              }
            },
          }
        );

        ocrText += pageOcrText + "\n\n";

        // Cleanup canvas
        canvas.remove();
      }

      return ocrText.trim();
    } catch (err: any) {
      console.log("PDF Text Extraction Error:", err);
      return "";
    } finally {
      setIsScanning(false);
    }
  };

  const extractTextFromImage = async (file: File): Promise<string> => {
    setIsScanning(true);
    setProgress(10);
    setStatusText("Loading OCR engine...");

    try {
      const Tesseract = (await import("tesseract.js")).default;

      const fileReader = new FileReader();
      const imageData = await new Promise<string>((resolve, reject) => {
        fileReader.onload = () => resolve(fileReader.result as string);
        fileReader.onerror = reject;
        fileReader.readAsDataURL(file);
      });

      setProgress(20);
      setStatusText("Scanning image for text...");

      const { data: { text } } = await Tesseract.recognize(
        imageData,
        'eng',
        {
          logger: m => {
            if (m.status === 'recognizing text') {
              setProgress(20 + Math.round(m.progress * 40));
              setStatusText("Recognizing text patterns...");
            }
          }
        }
      );

      return text;
    } catch (err: any) {
      console.log("OCR Error:", err);
      return "";
    } finally {
      setIsScanning(false);
    }
  };

  const analyzeWithGroq = async (text: string, title: string) => {
    setIsAnalyzing(true);
    setProgress(65);
    setStatusText("AI analysis in progress...");

    try {
      const response = await fetch("/api/analyze-pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, title }),
      });

      setProgress(85);
      setStatusText("Generating clinical summary...");

      if (!response.ok) {
        console.log("Groq API Error:", response.status);
        return null;
      }

      const data = await response.json();
      return data.summary || null;
    } catch (err) {
      console.log("AI Analysis Error:", err);
      return null;
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setMessage(null);
    setProgress(0);
    setStatusText("Initializing secure upload...");

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Unauthorized access.");

      // Verify this user is a registered patient before uploading
      const { data: patientProfile } = await supabase
        .from(SB_TABLES.user_patient)
        .select('user_id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (!patientProfile) throw new Error("Only registered patients can upload records. Please sign up as a patient first.");

      // Step 1: Upload to Supabase Storage
      setProgress(5);
      setStatusText("Uploading to secure vault...");
      const fileName = `${user.id}/${Date.now()}_${file.name}`;
      const { data: storageData, error: storageError } = await supabase.storage
        .from('patient_records')
        .upload(fileName, file);

      if (storageError) throw storageError;

      const { data: { publicUrl } } = supabase.storage
        .from('patient_records')
        .getPublicUrl(fileName);

      // Step 2: Extract text from the document
      let extractedText = "";
      if (file.type === "application/pdf") {
        extractedText = await extractTextFromPDF(file);
      } else {
        extractedText = await extractTextFromImage(file);
      }

      // Step 3: Analyze with Groq AI
      const docTitle = file.name.split('.')[0];
      let aiSummary = null;
      if (extractedText && extractedText.trim().length > 10) {
        aiSummary = await analyzeWithGroq(extractedText, docTitle);
      }

      setProgress(90);
      setStatusText("Indexing clinical record...");

      // Step 4: Save record to database
      const { error: dbError } = await supabase
        .from(SB_TABLES.medical_records)
        .insert({
          patient_id: user.id,
          title: docTitle,
          record_type: file.type.includes('pdf') ? 'PDF Document' : 'Image Scan',
          raw_text_content: extractedText || "",
          ai_summary: aiSummary ? JSON.stringify(aiSummary) : null,
          file_url: publicUrl,
          is_emergency_flag: false,
        });

      if (dbError) throw dbError;

      setProgress(100);
      setStatusText("Complete!");
      setMessage(aiSummary
        ? "✅ Document analyzed & indexed by AI"
        : "✅ Document uploaded — AI analysis unavailable"
      );
      if (onUploadComplete) onUploadComplete();

    } catch (err: any) {
      console.log(err);
      setMessage(`❌ Upload failed: ${err.message}`);
    } finally {
      setIsUploading(false);
      setIsScanning(false);
      setIsAnalyzing(false);
      setTimeout(() => setProgress(0), 2000);
    }
  };

  const isProcessing = isUploading || isScanning || isAnalyzing;

  return (
    <div className="space-y-6">
      {/* Upload Trigger */}
      <div className="relative group">
        <input
          type="file"
          onChange={handleFileUpload}
          disabled={isProcessing}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed z-20"
          accept="image/*,application/pdf"
        />
        <Button
          variant="premium"
          className={cn(
            "w-full flex items-center justify-center gap-3 h-16 group-hover:scale-[1.01] transition-all relative z-10",
            isProcessing && "opacity-50"
          )}
        >
          {isProcessing ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <Upload className="h-5 w-5" />
          )}
          <span className="font-bold tracking-tight">
            {isAnalyzing ? "AI Analyzing..." : isScanning ? "Extracting Text..." : isUploading ? "Uploading..." : "Ingest New Health Legacy"}
          </span>
        </Button>
      </div>

      {/* Progress Feedback */}
      {isProcessing && (
        <div className="p-6 rounded-3xl bg-white border border-indigo-50 shadow-soft animate-in fade-in slide-in-from-top-2 duration-500 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
                {isAnalyzing ? <BrainCircuit className="h-4 w-4 animate-pulse" /> : isScanning ? <FileText className="h-4 w-4" /> : <Sparkles className="h-4 w-4" />}
              </div>
              <span className="text-[10px] font-black text-indigo-950 uppercase tracking-widest">
                {isAnalyzing ? "GROQ AI ANALYSIS" : isScanning ? "TEXT EXTRACTION" : "VAULT SYNC"}
              </span>
            </div>
            <span className="text-xs font-black text-indigo-600 font-heading">{progress}%</span>
          </div>

          <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden p-0.5">
            <div
              className={cn(
                "h-full rounded-full transition-all duration-300 shadow-[0_0_10px_rgba(99,102,241,0.3)]",
                isAnalyzing ? "bg-gradient-to-r from-violet-500 to-fuchsia-500" : "bg-indigo-600"
              )}
              style={{ width: `${progress}%` }}
            />
          </div>

          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest text-center">
            {statusText}
          </p>
        </div>
      )}

      {message && (
        <div className={cn(
          "p-4 rounded-2xl text-xs font-black uppercase tracking-widest flex items-center justify-center gap-3 animate-in zoom-in-95 duration-300 border shadow-soft",
          message.startsWith('✅') ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-rose-50 text-rose-600 border-rose-100'
        )}>
          {message.startsWith('✅') ? <CheckCircle className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
          {message}
        </div>
      )}
    </div>
  );
}
