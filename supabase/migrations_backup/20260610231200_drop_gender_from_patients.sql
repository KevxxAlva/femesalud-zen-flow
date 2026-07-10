-- Drop gender column from public.patients table
ALTER TABLE public.patients DROP COLUMN IF EXISTS gender;
