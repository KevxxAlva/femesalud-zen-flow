-- ============================================
-- FEMESALUD DATABASE SCHEMA (CONSOLIDATED)
-- ============================================

-- 1. ENUMS AND CUSTOM TYPES
CREATE TYPE public.app_role AS ENUM ('admin', 'doctor');
CREATE TYPE public.visit_type_enum AS ENUM ('CONTROL', 'EMERGENCIA', 'CONSULTA_NUEVA', 'POST_TRATAMIENTO', 'OTRO');

-- 2. SEQUENCES
CREATE SEQUENCE IF NOT EXISTS public.historia_number_seq START WITH 3000;

-- 3. TABLES DEFINITIONS

-- profiles (User profiles linked to auth.users)
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NOT NULL DEFAULT '',
  email text NOT NULL DEFAULT '',
  avatar_url text,
  specialty text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- user_roles (Roles assigned to users)
CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

-- patients (Patient clinical registries)
CREATE TABLE public.patients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name text NOT NULL,
  email text,
  phone text,
  birth_date date,
  address text,
  status text NOT NULL DEFAULT 'activo',
  assigned_doctor_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  notes text,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  document_id text,
  historia_number text UNIQUE DEFAULT nextval('public.historia_number_seq')::text,
  first_visit_date date DEFAULT CURRENT_DATE,
  marital_status text,
  birthplace text,
  education_level text,
  occupation text,
  ethnicity text,
  family_history jsonb DEFAULT '{}'::jsonb,
  personal_history jsonb DEFAULT '{}'::jsonb,
  gynecological_data jsonb DEFAULT '{}'::jsonb,
  obstetric_data jsonb DEFAULT '{}'::jsonb,
  consultation_reason text,
  current_illness text
);

-- appointments (Agendación de citas)
CREATE TABLE public.appointments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  doctor_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  scheduled_at timestamptz NOT NULL,
  duration_minutes int NOT NULL DEFAULT 30,
  status text NOT NULL DEFAULT 'programada',
  reason text,
  notes text,
  price numeric(10,2) DEFAULT 0,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- clinical_notes (Notas clínicas libres)
CREATE TABLE public.clinical_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  author_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  title text NOT NULL,
  content text NOT NULL DEFAULT '',
  note_date timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- lab_results (Resultados de laboratorio)
CREATE TABLE public.lab_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id uuid NOT NULL REFERENCES public.appointments(id) ON DELETE CASCADE,
  patient_id uuid NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  test_type text NOT NULL,
  result text,
  status text NOT NULL DEFAULT 'pendiente',
  file_url text,
  result_date timestamptz,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- consultations (Consultas médicas estructuradas)
CREATE TABLE public.consultations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id uuid NOT NULL REFERENCES public.appointments(id) ON DELETE CASCADE,
  patient_id uuid NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  doctor_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  visit_type public.visit_type_enum NOT NULL DEFAULT 'CONTROL',
  is_first_visit boolean NOT NULL DEFAULT false,
  subjective_exam text,
  height_cm numeric(5,1),
  weight_kg numeric(5,1),
  bmi numeric(5,1),
  blood_pressure text,
  heart_rate integer,
  respiratory_rate integer,
  temperature numeric(4,1),
  skin text,
  head_neck text,
  breasts text,
  abdomen text,
  gynecological text,
  extremities text,
  neurological text,
  acetic_acid_test text,
  acetic_clock_position text,
  acetic_relative_position text,
  lugol_test text,
  lugol_clock_position text,
  lugol_relative_position text,
  gestational_age text,
  fetal_weight numeric(7,1),
  obstetric_bp text,
  uterine_height numeric(5,1),
  presentation text,
  fetal_heart_rate integer,
  fetal_movements text,
  edema text,
  alarm_signs text,
  indications text,
  complementary_exams text,
  diagnosis text,
  plan text,
  next_appointment_date date,
  contact_channel text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- consultation_consumables (Materiales consumidos en la consulta)
CREATE TABLE public.consultation_consumables (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  consultation_id uuid NOT NULL REFERENCES public.consultations(id) ON DELETE CASCADE,
  item_name text NOT NULL,
  quantity numeric(10,2) NOT NULL DEFAULT 0.0,
  unit text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 4. DATABASE FUNCTIONS AND PROCEDURES

-- has_role (Security Definer helper to check roles)
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- is_admin (Security Definer helper to check admin role)
CREATE OR REPLACE FUNCTION public.is_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT public.has_role(_user_id, 'admin'::public.app_role)
$$;

-- set_updated_at (Trigger function to automatically update updated_at columns)
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

-- handle_new_user (Auto-creation of profiles and admin role assignment for testing)
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
  
  -- Assign admin role to all registered users for testing and deployment ease
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'admin'::public.app_role)
  ON CONFLICT (user_id, role) DO NOTHING;
  
  RETURN NEW;
END;
$function$;

-- 5. FUNCTION SECURITY AND PERMISSIONS
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.set_updated_at() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.is_admin(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin(uuid) TO authenticated;

-- 6. TRIGGERS CREATION
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER patients_updated_at BEFORE UPDATE ON public.patients
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER appointments_updated_at BEFORE UPDATE ON public.appointments
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER trg_clinical_notes_updated_at BEFORE UPDATE ON public.clinical_notes
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER trg_lab_results_updated_at BEFORE UPDATE ON public.lab_results
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER trg_consultations_updated_at BEFORE UPDATE ON public.consultations
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 7. ROLES GRANTS
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;

GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.patients TO authenticated;
GRANT ALL ON public.patients TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.appointments TO authenticated;
GRANT ALL ON public.appointments TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.clinical_notes TO authenticated;
GRANT ALL ON public.clinical_notes TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.lab_results TO authenticated;
GRANT ALL ON public.lab_results TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.consultations TO authenticated;
GRANT ALL ON public.consultations TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.consultation_consumables TO authenticated;
GRANT ALL ON public.consultation_consumables TO service_role;

-- 8. ROW LEVEL SECURITY (RLS) ACTIVATION
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clinical_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lab_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consultations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consultation_consumables ENABLE ROW LEVEL SECURITY;

-- 9. SECURITY POLICIES

-- profiles
CREATE POLICY "Users view own profile" ON public.profiles
  FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "Admins view all profiles" ON public.profiles
  FOR SELECT TO authenticated USING (public.is_admin(auth.uid()));
CREATE POLICY "Users view doctors profiles" ON public.profiles
  FOR SELECT TO authenticated USING (public.has_role(id, 'doctor'::public.app_role));
CREATE POLICY "Users update own profile" ON public.profiles
  FOR UPDATE TO authenticated USING (auth.uid() = id);
CREATE POLICY "Admins update any profile" ON public.profiles
  FOR UPDATE TO authenticated USING (public.is_admin(auth.uid()));

-- user_roles
CREATE POLICY "Users view own roles" ON public.user_roles
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins view all roles" ON public.user_roles
  FOR SELECT TO authenticated USING (public.is_admin(auth.uid()));
CREATE POLICY "Admins manage roles" ON public.user_roles
  FOR ALL TO authenticated USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

-- patients
CREATE POLICY "Admins manage all patients" ON public.patients
  FOR ALL TO authenticated USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));
CREATE POLICY "Doctors view assigned patients" ON public.patients
  FOR SELECT TO authenticated USING (assigned_doctor_id = auth.uid());
CREATE POLICY "Doctors insert patients" ON public.patients
  FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'doctor'::public.app_role) AND assigned_doctor_id = auth.uid());
CREATE POLICY "Doctors update assigned patients" ON public.patients
  FOR UPDATE TO authenticated USING (assigned_doctor_id = auth.uid()) WITH CHECK (assigned_doctor_id = auth.uid());
CREATE POLICY "Doctors delete assigned patients" ON public.patients
  FOR DELETE TO authenticated USING (assigned_doctor_id = auth.uid());

-- appointments
CREATE POLICY "Admins manage all appointments" ON public.appointments
  FOR ALL TO authenticated USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));
CREATE POLICY "Doctors view own appointments" ON public.appointments
  FOR SELECT TO authenticated USING (doctor_id = auth.uid());
CREATE POLICY "Doctors insert own appointments" ON public.appointments
  FOR INSERT TO authenticated WITH CHECK (doctor_id = auth.uid());
CREATE POLICY "Doctors update own appointments" ON public.appointments
  FOR UPDATE TO authenticated USING (doctor_id = auth.uid()) WITH CHECK (doctor_id = auth.uid());
CREATE POLICY "Doctors delete own appointments" ON public.appointments
  FOR DELETE TO authenticated USING (doctor_id = auth.uid());

-- clinical_notes
CREATE POLICY "Admins manage all clinical notes" ON public.clinical_notes
  FOR ALL TO authenticated USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));
CREATE POLICY "Doctors manage notes of their patients" ON public.clinical_notes
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.patients p WHERE p.id = patient_id AND p.assigned_doctor_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.patients p WHERE p.id = patient_id AND p.assigned_doctor_id = auth.uid()));

-- lab_results
CREATE POLICY "Admins manage all lab results" ON public.lab_results
  FOR ALL TO authenticated USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));
CREATE POLICY "Doctors manage lab results of their appointments" ON public.lab_results
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.appointments a WHERE a.id = appointment_id AND a.doctor_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.appointments a WHERE a.id = appointment_id AND a.doctor_id = auth.uid()));

-- consultations
CREATE POLICY "Admins manage all consultations" ON public.consultations
  FOR ALL TO authenticated USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));
CREATE POLICY "Doctors manage consultations of their appointments" ON public.consultations
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.appointments a WHERE a.id = appointment_id AND a.doctor_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.appointments a WHERE a.id = appointment_id AND a.doctor_id = auth.uid()));

-- consultation_consumables
CREATE POLICY "Admins manage all consultation consumables" ON public.consultation_consumables
  FOR ALL TO authenticated USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));
CREATE POLICY "Doctors manage consumables of their consultations" ON public.consultation_consumables
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.consultations c JOIN public.appointments a ON a.id = c.appointment_id WHERE c.id = consultation_id AND a.doctor_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.consultations c JOIN public.appointments a ON a.id = c.appointment_id WHERE c.id = consultation_id AND a.doctor_id = auth.uid()));

-- 10. INDEXES CREATION
CREATE INDEX idx_patients_assigned_doctor ON public.patients(assigned_doctor_id);
CREATE INDEX idx_patients_status ON public.patients(status);

CREATE INDEX idx_appointments_doctor ON public.appointments(doctor_id);
CREATE INDEX idx_appointments_patient ON public.appointments(patient_id);
CREATE INDEX idx_appointments_scheduled ON public.appointments(scheduled_at);
CREATE INDEX idx_appointments_status ON public.appointments(status);

CREATE INDEX idx_clinical_notes_patient ON public.clinical_notes(patient_id, note_date DESC);

CREATE INDEX idx_lab_results_appointment ON public.lab_results(appointment_id);
CREATE INDEX idx_lab_results_patient ON public.lab_results(patient_id, created_at DESC);

-- 11. INITIAL SEEDING FOR MOCK ADMIN/DOCTOR USER
-- Seeding default user auth
INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, aud, role)
VALUES (
  'e0000000-0000-0000-0000-000000000001',
  'doctor@femesalud.example.com',
  crypt('password123', gen_salt('bf', 10)),
  now(),
  '{"provider":"email","providers":["email"]}'::jsonb,
  '{"full_name":"Dra. Carli Solé Aquino"}'::jsonb,
  'authenticated',
  'authenticated'
) ON CONFLICT (id) DO NOTHING;

-- Seeding profile
INSERT INTO public.profiles (id, full_name, email, specialty)
VALUES (
  'e0000000-0000-0000-0000-000000000001',
  'Dra. Carli Solé Aquino',
  'doctor@femesalud.example.com',
  'Ginecología y Obstetricia'
) ON CONFLICT (id) DO UPDATE SET specialty = 'Ginecología y Obstetricia';

-- Seeding admin user_role
INSERT INTO public.user_roles (user_id, role)
VALUES (
  'e0000000-0000-0000-0000-000000000001',
  'admin'::public.app_role
) ON CONFLICT (user_id, role) DO NOTHING;
