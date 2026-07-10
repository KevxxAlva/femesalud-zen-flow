-- Enable Realtime for core tables by adding them to the supabase_realtime publication
do $$
begin
  -- Add public.patients
  if not exists (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'patients'
  ) then
    alter publication supabase_realtime add table public.patients;
  end if;

  -- Add public.appointments
  if not exists (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'appointments'
  ) then
    alter publication supabase_realtime add table public.appointments;
  end if;

  -- Add public.clinical_notes
  if not exists (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'clinical_notes'
  ) then
    alter publication supabase_realtime add table public.clinical_notes;
  end if;

  -- Add public.consultations
  if not exists (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'consultations'
  ) then
    alter publication supabase_realtime add table public.consultations;
  end if;

  -- Add public.prescription_templates
  if not exists (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'prescription_templates'
  ) then
    alter publication supabase_realtime add table public.prescription_templates;
  end if;
end $$;
