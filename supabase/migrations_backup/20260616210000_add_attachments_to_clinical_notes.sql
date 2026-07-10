-- Add attachments column to public.clinical_notes if it doesn't exist
ALTER TABLE public.clinical_notes
  ADD COLUMN IF NOT EXISTS attachments jsonb NOT NULL DEFAULT '[]'::jsonb;
