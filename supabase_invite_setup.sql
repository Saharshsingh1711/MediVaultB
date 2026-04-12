-- MEDIVAULT: Patient Invite Links Setup
-- Run this in the Supabase SQL Editor

-- 1. CREATE TABLE: patient_invites
CREATE TABLE IF NOT EXISTS public.patient_invites (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    patient_id UUID NOT NULL REFERENCES public.user_patient(user_id) ON DELETE CASCADE,
    token TEXT NOT NULL UNIQUE,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    is_revoked BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create index on token for fast lookups
CREATE INDEX IF NOT EXISTS idx_patient_invites_token ON public.patient_invites(token);

-- 2. ENABLE ROW LEVEL SECURITY
ALTER TABLE public.patient_invites ENABLE ROW LEVEL SECURITY;

-- 3. RLS POLICIES
DROP POLICY IF EXISTS "Patients manage own invites" ON public.patient_invites;
DROP POLICY IF EXISTS "Patients insert own invites" ON public.patient_invites;
DROP POLICY IF EXISTS "Doctors read invites for validation" ON public.patient_invites;
DROP POLICY IF EXISTS "Service role full access invites" ON public.patient_invites;

-- Allow patients to read their own invites
CREATE POLICY "Patients manage own invites"
ON public.patient_invites FOR SELECT
TO authenticated
USING (patient_id = auth.uid());

-- Allow patients to insert their own invites
CREATE POLICY "Patients insert own invites"
ON public.patient_invites FOR INSERT
TO authenticated
WITH CHECK (patient_id = auth.uid());

-- Allow patients to update (revoke) their own invites
DROP POLICY IF EXISTS "Patients revoke own invites" ON public.patient_invites;
CREATE POLICY "Patients revoke own invites"
ON public.patient_invites FOR UPDATE
TO authenticated
USING (patient_id = auth.uid())
WITH CHECK (patient_id = auth.uid());

-- Allow doctors to read any invite (for token validation on shared page)
CREATE POLICY "Doctors read invites for validation"
ON public.patient_invites FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_doctor
    WHERE user_id = auth.uid()
  )
);

-- Allow service role (API routes using admin client) full access
-- This is handled automatically by the SUPABASE_SECRET_KEY bypassing RLS
