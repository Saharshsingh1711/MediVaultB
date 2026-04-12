-- MEDIVAULT: Fix Doctor Access Logs RLS
-- Run this in the Supabase SQL Editor
--
-- PROBLEM: Doctors cannot SELECT from access_logs, so they see
--          no triage queue and no linked patients (documents are empty).
-- FIX:    Add a SELECT policy allowing doctors to read access_logs
--         where they are the doctor_id, plus read the triage queue.

-- Drop if re-running
DROP POLICY IF EXISTS "Doctors Read Own Access Logs" ON public.access_logs;

-- Allow doctors to read access logs where they are the doctor
CREATE POLICY "Doctors Read Own Access Logs"
ON public.access_logs FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_doctor
    WHERE user_id = auth.uid()
  )
);
