-- Phase 0 & Phase 1 Optimizations Migration

-- 1. Correct handle_new_user() function
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (id, full_name, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    NEW.email
  ) ON CONFLICT (id) DO NOTHING;
  
  -- Assign admin role to the first user, and doctor to subsequent users
  IF (SELECT count(*) FROM public.user_roles WHERE role = 'admin') = 0 THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'admin'::public.app_role)
    ON CONFLICT (user_id, role) DO NOTHING;
  ELSE
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'doctor'::public.app_role)
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$function$;

-- 2. Drop permissive storage policies
DROP POLICY IF EXISTS "Authenticated users can upload clinical attachments" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can view clinical attachments" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete clinical attachments" ON storage.objects;

-- 3. Assert restrictive storage policies
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND schemaname = 'storage' AND policyname = 'clinical_attachments_admin_all'
  ) THEN
    CREATE POLICY "clinical_attachments_admin_all"
    ON storage.objects FOR ALL TO authenticated
    USING (bucket_id = 'clinical-attachments' AND public.is_admin(auth.uid()))
    WITH CHECK (bucket_id = 'clinical-attachments' AND public.is_admin(auth.uid()));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND schemaname = 'storage' AND policyname = 'clinical_attachments_doctor_select'
  ) THEN
    CREATE POLICY "clinical_attachments_doctor_select"
    ON storage.objects FOR SELECT TO authenticated
    USING (
      bucket_id = 'clinical-attachments'
      AND EXISTS (
        SELECT 1 FROM public.patients p
        WHERE p.id::text = (storage.foldername(name))[1]
        AND p.assigned_doctor_id = auth.uid()
      )
    );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND schemaname = 'storage' AND policyname = 'clinical_attachments_doctor_insert'
  ) THEN
    CREATE POLICY "clinical_attachments_doctor_insert"
    ON storage.objects FOR INSERT TO authenticated
    WITH CHECK (
      bucket_id = 'clinical-attachments'
      AND EXISTS (
        SELECT 1 FROM public.patients p
        WHERE p.id::text = (storage.foldername(name))[1]
        AND p.assigned_doctor_id = auth.uid()
      )
    );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND schemaname = 'storage' AND policyname = 'clinical_attachments_doctor_update'
  ) THEN
    CREATE POLICY "clinical_attachments_doctor_update"
    ON storage.objects FOR UPDATE TO authenticated
    USING (
      bucket_id = 'clinical-attachments'
      AND EXISTS (
        SELECT 1 FROM public.patients p
        WHERE p.id::text = (storage.foldername(name))[1]
        AND p.assigned_doctor_id = auth.uid()
      )
    );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND schemaname = 'storage' AND policyname = 'clinical_attachments_doctor_delete'
  ) THEN
    CREATE POLICY "clinical_attachments_doctor_delete"
    ON storage.objects FOR DELETE TO authenticated
    USING (
      bucket_id = 'clinical-attachments'
      AND EXISTS (
        SELECT 1 FROM public.patients p
        WHERE p.id::text = (storage.foldername(name))[1]
        AND p.assigned_doctor_id = auth.uid()
      )
    );
  END IF;
END $$;

-- 4. Create clinic_info table
CREATE TABLE IF NOT EXISTS public.clinic_info (
  id integer PRIMARY KEY,
  name text NOT NULL,
  address_line1 text NOT NULL,
  address_line2 text NOT NULL,
  phone text NOT NULL,
  rif text NOT NULL,
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on clinic_info
ALTER TABLE public.clinic_info ENABLE ROW LEVEL SECURITY;

-- Create policies for clinic_info
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'clinic_info' AND schemaname = 'public' AND policyname = 'Anyone authenticated can read clinic info'
  ) THEN
    CREATE POLICY "Anyone authenticated can read clinic info"
    ON public.clinic_info FOR SELECT TO authenticated
    USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'clinic_info' AND schemaname = 'public' AND policyname = 'Only admins can update clinic info'
  ) THEN
    CREATE POLICY "Only admins can update clinic info"
    ON public.clinic_info FOR UPDATE TO authenticated
    USING (public.is_admin(auth.uid()));
  END IF;
END $$;

-- Populate clinic_info with default row if it's empty
INSERT INTO public.clinic_info (id, name, address_line1, address_line2, phone, rif, updated_at)
VALUES (
  1,
  'Femesalud',
  'Calle las Flores entre González Padrón y Shettino, Número 16.',
  'Valle de la Pascua, Estado Guárico.',
  '0412/8299890 0424/4609387',
  'J-12345678-9',
  now()
)
ON CONFLICT (id) DO NOTHING;

-- 5. Create Missing Indexes for Performance
CREATE INDEX IF NOT EXISTS idx_consultations_appointment ON public.consultations(appointment_id);
CREATE INDEX IF NOT EXISTS idx_consultations_patient ON public.consultations(patient_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_consultations_created ON public.consultations(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_consultations_doctor ON public.consultations(doctor_id);

CREATE INDEX IF NOT EXISTS idx_consumables_consultation ON public.consultation_consumables(consultation_id);

CREATE INDEX IF NOT EXISTS idx_appointments_status_scheduled ON public.appointments(status, scheduled_at);

CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE INDEX IF NOT EXISTS idx_patients_fullname_trgm ON public.patients USING gin(full_name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_patients_created ON public.patients(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_templates_created_by ON public.prescription_templates(created_by);
