-- MEDIVAULT SUPABASE SETUP (SQL EDITOR)

-- 1. STORAGE BUCKET: patient_records
-- Create the bucket for medical records (if not already there)
INSERT INTO storage.buckets (id, name, public)
VALUES ('patient_records', 'patient_records', true)
ON CONFLICT (id) DO NOTHING;


-- 2. STORAGE POLICIES
-- Clean up existing policies to avoid conflicts
DROP POLICY IF EXISTS "Patients Upload Own Records" ON storage.objects;
DROP POLICY IF EXISTS "Patients Read Own Records" ON storage.objects;
DROP POLICY IF EXISTS "Doctors Read Triage Records" ON storage.objects;
DROP POLICY IF EXISTS "Patients Delete Own Records" ON storage.objects;

-- Allow patients to upload their own records
CREATE POLICY "Patients Upload Own Records" 
ON storage.objects FOR INSERT 
TO authenticated 
WITH CHECK (bucket_id = 'patient_records' AND (auth.uid())::text = (storage.foldername(name))[1]);

-- Allow patients to read their own records
CREATE POLICY "Patients Read Own Records" 
ON storage.objects FOR SELECT 
TO authenticated 
USING (bucket_id = 'patient_records' AND (auth.uid())::text = (storage.foldername(name))[1]);

-- Allow verified doctors to read triage records
CREATE POLICY "Doctors Read Triage Records" 
ON storage.objects FOR SELECT 
TO authenticated 
USING (
  bucket_id = 'patient_records' AND 
  EXISTS (
    SELECT 1 FROM public.user_doctor 
    WHERE user_id = auth.uid()
  )
);

-- Allow patients to delete their own records from storage
CREATE POLICY "Patients Delete Own Records" 
ON storage.objects FOR DELETE 
TO authenticated 
USING (bucket_id = 'patient_records' AND (auth.uid())::text = (storage.foldername(name))[1]);


-- 3. ACCESS LOGS TABLE
-- Create table for real-time security auditing
CREATE TABLE IF NOT EXISTS public.access_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    patient_id UUID NOT NULL REFERENCES public.user_patient(user_id) ON DELETE CASCADE,
    doctor_id UUID NOT NULL REFERENCES public.user_doctor(user_id) ON DELETE CASCADE,
    doctor_name TEXT NOT NULL,
    action TEXT NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable Row Level Security
ALTER TABLE public.access_logs ENABLE ROW LEVEL SECURITY;

-- Enable Realtime for access_logs
-- This handles potential publication errors by checking existence
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
        AND schemaname = 'public' 
        AND tablename = 'access_logs'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.access_logs;
    END IF;
END $$;

-- Policies for Access Logs
DROP POLICY IF EXISTS "Patients Read Their Own Access Logs" ON public.access_logs;
DROP POLICY IF EXISTS "Doctors Insert Access Logs on Triage" ON public.access_logs;

CREATE POLICY "Patients Read Their Own Access Logs" 
ON public.access_logs FOR SELECT 
TO authenticated 
USING (patient_id = auth.uid());

CREATE POLICY "Doctors Insert Access Logs on Triage" 
ON public.access_logs FOR INSERT 
TO authenticated 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_doctor 
    WHERE user_id = auth.uid()
  )
);


-- 4. MEDICAL RECORDS TABLE SCHEMA (REFINEMENT)
-- Ensure medical_records table exists and has all required columns
CREATE TABLE IF NOT EXISTS public.medical_records (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    patient_id UUID NOT NULL REFERENCES public.user_patient(user_id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    record_type TEXT NOT NULL,
    raw_data TEXT,
    file_url TEXT,
    is_emergency_flag BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Ensure columns exist if table was already created manually
ALTER TABLE public.medical_records 
ADD COLUMN IF NOT EXISTS patient_id UUID REFERENCES public.user_patient(user_id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS title TEXT,
ADD COLUMN IF NOT EXISTS record_type TEXT,
ADD COLUMN IF NOT EXISTS raw_text_content TEXT,
ADD COLUMN IF NOT EXISTS ai_summary TEXT,
ADD COLUMN IF NOT EXISTS is_emergency_flag BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS file_url TEXT;

-- RELAX CONSTRAINTS: Drop the restrictive check on record_type if it exists
-- This allows for flexible types like 'PDF Document' and 'Image Scan'
ALTER TABLE public.medical_records 
DROP CONSTRAINT IF EXISTS medical_records_record_type_check;


-- Enable Row Level Security
ALTER TABLE public.medical_records ENABLE ROW LEVEL SECURITY;

-- Policies for Medical Records
DROP POLICY IF EXISTS "Patients Insert Own Records" ON public.medical_records;
DROP POLICY IF EXISTS "Patients Select Own Records" ON public.medical_records;
DROP POLICY IF EXISTS "Doctors Select Patient Records" ON public.medical_records;
DROP POLICY IF EXISTS "Patients Delete Own Records" ON public.medical_records;

-- Allow patients to insert only their own records
CREATE POLICY "Patients Insert Own Records" 
ON public.medical_records FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = patient_id);

-- Allow patients to view only their own records
CREATE POLICY "Patients Select Own Records" 
ON public.medical_records FOR SELECT 
TO authenticated 
USING (auth.uid() = patient_id);

-- Allow verified doctors to view all records (for triage/assessment)
CREATE POLICY "Doctors Select Patient Records" 
ON public.medical_records FOR SELECT 
TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM public.user_doctor 
    WHERE user_id = auth.uid()
  )
);

-- Allow patients to delete only their own records
CREATE POLICY "Patients Delete Own Records" 
ON public.medical_records FOR DELETE 
TO authenticated 
USING (auth.uid() = patient_id);
-- 5. CLINICAL DATA SCHEMA (Vitals & Prescriptions)

-- Table for patient vital signs
CREATE TABLE IF NOT EXISTS public.medical_vitals (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    patient_id UUID NOT NULL REFERENCES public.user_patient(user_id) ON DELETE CASCADE,
    blood_pressure TEXT, -- format: 120/80
    heart_rate INTEGER, -- bpm
    spo2 INTEGER, -- oxygen saturation %
    temperature DECIMAL(4,1), -- Celsius
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Table for doctor prescriptions
CREATE TABLE IF NOT EXISTS public.prescriptions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    patient_id UUID NOT NULL REFERENCES public.user_patient(user_id) ON DELETE CASCADE,
    doctor_id UUID NOT NULL REFERENCES public.user_doctor(user_id) ON DELETE CASCADE,
    medication_name TEXT NOT NULL,
    dosage TEXT NOT NULL,
    instructions TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enhance patient profile with clinical arrays
ALTER TABLE public.user_patient 
ADD COLUMN IF NOT EXISTS active_allergies TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS current_medications TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS chronic_conditions TEXT[] DEFAULT '{}';

-- Enable Row Level Security
ALTER TABLE public.medical_vitals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prescriptions ENABLE ROW LEVEL SECURITY;

-- Vitals Policies
DROP POLICY IF EXISTS "Patients view own vitals" ON public.medical_vitals;
DROP POLICY IF EXISTS "Doctors manage all vitals" ON public.medical_vitals;

CREATE POLICY "Patients view own vitals" 
ON public.medical_vitals FOR SELECT 
TO authenticated 
USING (patient_id = auth.uid());

CREATE POLICY "Doctors manage all vitals" 
ON public.medical_vitals FOR ALL 
TO authenticated 
USING (EXISTS (SELECT 1 FROM public.user_doctor WHERE user_id = auth.uid()));

-- Prescriptions Policies
DROP POLICY IF EXISTS "Patients view own prescriptions" ON public.prescriptions;
DROP POLICY IF EXISTS "Doctors manage all prescriptions" ON public.prescriptions;

CREATE POLICY "Patients view own prescriptions" 
ON public.prescriptions FOR SELECT 
TO authenticated 
USING (patient_id = auth.uid());

CREATE POLICY "Doctors manage all prescriptions" 
ON public.prescriptions FOR ALL 
TO authenticated 
USING (EXISTS (SELECT 1 FROM public.user_doctor WHERE user_id = auth.uid()));

-- Enable Realtime for prescriptions and vitals (for instant updates)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'prescriptions') THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.prescriptions;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'medical_vitals') THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.medical_vitals;
    END IF;
END $$;
