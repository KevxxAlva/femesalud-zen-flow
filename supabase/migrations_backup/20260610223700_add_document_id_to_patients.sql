-- Add document_id column to public.patients table
ALTER TABLE public.patients ADD COLUMN IF NOT EXISTS document_id text;
