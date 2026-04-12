-- MEDIVAULT: Per-Record Token Sharing Setup
-- Run this in the Supabase SQL Editor

-- 1. CREATE TABLE: record_share_tokens
CREATE TABLE IF NOT EXISTS public.record_share_tokens (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    record_id UUID NOT NULL REFERENCES public.medical_records(id) ON DELETE CASCADE,
    patient_id UUID NOT NULL REFERENCES public.user_patient(user_id) ON DELETE CASCADE,
    token TEXT NOT NULL UNIQUE,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    is_revoked BOOLEAN DEFAULT false,
    claimed_by UUID[] DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Add missing columns if this table already existed in an older schema
ALTER TABLE public.record_share_tokens
    ADD COLUMN IF NOT EXISTS claimed_by UUID[] DEFAULT '{}';

-- Create index on token for fast lookups
CREATE INDEX IF NOT EXISTS idx_record_share_tokens_token ON public.record_share_tokens(token);
CREATE INDEX IF NOT EXISTS idx_record_share_tokens_record ON public.record_share_tokens(record_id);
CREATE INDEX IF NOT EXISTS idx_record_share_tokens_patient ON public.record_share_tokens(patient_id);

-- 2. ENABLE ROW LEVEL SECURITY
ALTER TABLE public.record_share_tokens ENABLE ROW LEVEL SECURITY;

-- 3. RLS POLICIES
DROP POLICY IF EXISTS "Patients manage own record tokens" ON public.record_share_tokens;
DROP POLICY IF EXISTS "Patients insert own record tokens" ON public.record_share_tokens;
DROP POLICY IF EXISTS "Patients update own record tokens" ON public.record_share_tokens;
DROP POLICY IF EXISTS "Doctors read record tokens" ON public.record_share_tokens;
DROP POLICY IF EXISTS "Doctors update claimed_by" ON public.record_share_tokens;

-- Patients can read their own tokens
CREATE POLICY "Patients manage own record tokens"
ON public.record_share_tokens FOR SELECT
TO authenticated
USING (patient_id = auth.uid());

-- Patients can insert their own tokens
CREATE POLICY "Patients insert own record tokens"
ON public.record_share_tokens FOR INSERT
TO authenticated
WITH CHECK (patient_id = auth.uid());

-- Patients can update (revoke) their own tokens
CREATE POLICY "Patients update own record tokens"
ON public.record_share_tokens FOR UPDATE
TO authenticated
USING (patient_id = auth.uid())
WITH CHECK (patient_id = auth.uid());

-- Doctors can read any token (for validation when opening shared links)
CREATE POLICY "Doctors read record tokens"
ON public.record_share_tokens FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_doctor
    WHERE user_id = auth.uid()
  )
);

-- Doctors can update tokens (to add themselves to claimed_by)
CREATE POLICY "Doctors update claimed_by"
ON public.record_share_tokens FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_doctor
    WHERE user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_doctor
    WHERE user_id = auth.uid()
  )
);
