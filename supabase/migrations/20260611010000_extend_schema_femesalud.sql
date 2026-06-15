-- Extended clinical schema for FemeSalud

-- 1. Create enum for visit type
CREATE TYPE public.visit_type_enum AS ENUM ('CONTROL', 'EMERGENCIA', 'CONSULTA_NUEVA', 'POST_TRATAMIENTO', 'OTRO');

-- 2. Create sequence for historia_number
CREATE SEQUENCE IF NOT EXISTS public.historia_number_seq START WITH 3000;

-- 3. Extend patients table
ALTER TABLE public.patients ADD COLUMN IF NOT EXISTS historia_number text UNIQUE DEFAULT nextval('public.historia_number_seq')::text;
ALTER TABLE public.patients ADD COLUMN IF NOT EXISTS first_visit_date date DEFAULT CURRENT_DATE;
ALTER TABLE public.patients ADD COLUMN IF NOT EXISTS marital_status text;
ALTER TABLE public.patients ADD COLUMN IF NOT EXISTS birthplace text;
ALTER TABLE public.patients ADD COLUMN IF NOT EXISTS education_level text;
ALTER TABLE public.patients ADD COLUMN IF NOT EXISTS occupation text;
ALTER TABLE public.patients ADD COLUMN IF NOT EXISTS ethnicity text;
ALTER TABLE public.patients ADD COLUMN IF NOT EXISTS family_history jsonb DEFAULT '{}'::jsonb;
ALTER TABLE public.patients ADD COLUMN IF NOT EXISTS personal_history jsonb DEFAULT '{}'::jsonb;
ALTER TABLE public.patients ADD COLUMN IF NOT EXISTS gynecological_data jsonb DEFAULT '{}'::jsonb;
ALTER TABLE public.patients ADD COLUMN IF NOT EXISTS obstetric_data jsonb DEFAULT '{}'::jsonb;
ALTER TABLE public.patients ADD COLUMN IF NOT EXISTS consultation_reason text;
ALTER TABLE public.patients ADD COLUMN IF NOT EXISTS current_illness text;

-- 4. Create consultations table
CREATE TABLE public.consultations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id uuid NOT NULL REFERENCES public.appointments(id) ON DELETE CASCADE,
  patient_id uuid NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  doctor_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  
  -- General info
  visit_type public.visit_type_enum NOT NULL DEFAULT 'CONTROL',
  is_first_visit boolean NOT NULL DEFAULT false,
  subjective_exam text,
  
  -- Vitals
  height_cm numeric(5,1),
  weight_kg numeric(5,1),
  bmi numeric(5,1),
  blood_pressure text,
  heart_rate integer,
  respiratory_rate integer,
  temperature numeric(4,1),
  
  -- Physical exam / review of systems
  skin text,
  head_neck text,
  breasts text,
  abdomen text,
  gynecological text,
  extremities text,
  neurological text,
  
  -- Colposcopy
  acetic_acid_test text,
  acetic_clock_position text,
  acetic_relative_position text,
  lugol_test text,
  lugol_clock_position text,
  lugol_relative_position text,
  
  -- Obstetrics (conditional)
  gestational_age text,
  fetal_weight numeric(7,1),
  obstetric_bp text,
  uterine_height numeric(5,1),
  presentation text,
  fetal_heart_rate integer,
  fetal_movements text,
  edema text,
  alarm_signs text,
  
  -- Plan / Treatment
  indications text,
  complementary_exams text,
  diagnosis text,
  plan text,
  next_appointment_date date,
  
  -- Marketing
  contact_channel text,
  
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- RLS & Grants for consultations
GRANT SELECT, INSERT, UPDATE, DELETE ON public.consultations TO authenticated;
GRANT ALL ON public.consultations TO service_role;

ALTER TABLE public.consultations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage all consultations"
  ON public.consultations FOR ALL
  TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Doctors manage consultations of their appointments"
  ON public.consultations FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.appointments a
      WHERE a.id = appointment_id AND a.doctor_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.appointments a
      WHERE a.id = appointment_id AND a.doctor_id = auth.uid()
    )
  );

CREATE TRIGGER trg_consultations_updated_at
  BEFORE UPDATE ON public.consultations
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 5. Create consultation_consumables table
CREATE TABLE public.consultation_consumables (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  consultation_id uuid NOT NULL REFERENCES public.consultations(id) ON DELETE CASCADE,
  item_name text NOT NULL,
  quantity numeric(10,2) NOT NULL DEFAULT 0.0,
  unit text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- RLS & Grants for consultation_consumables
GRANT SELECT, INSERT, UPDATE, DELETE ON public.consultation_consumables TO authenticated;
GRANT ALL ON public.consultation_consumables TO service_role;

ALTER TABLE public.consultation_consumables ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage all consultation consumables"
  ON public.consultation_consumables FOR ALL
  TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Doctors manage consumables of their consultations"
  ON public.consultation_consumables FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.consultations c
      JOIN public.appointments a ON a.id = c.appointment_id
      WHERE c.id = consultation_id AND a.doctor_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.consultations c
      JOIN public.appointments a ON a.id = c.appointment_id
      WHERE c.id = consultation_id AND a.doctor_id = auth.uid()
    )
  );
