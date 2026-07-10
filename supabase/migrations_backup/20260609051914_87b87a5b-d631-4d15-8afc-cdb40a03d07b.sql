
-- ============================================
-- FASE 1: Auth, Roles, Pacientes y Citas
-- ============================================

-- 1. Enum de roles
CREATE TYPE public.app_role AS ENUM ('admin', 'doctor');

-- 2. Tabla profiles (datos públicos del usuario)
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NOT NULL DEFAULT '',
  email text NOT NULL DEFAULT '',
  avatar_url text,
  specialty text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 3. Tabla user_roles (separada para evitar privilege escalation)
CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- 4. Función has_role (SECURITY DEFINER para evitar recursión RLS)
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

-- 5. Función helper: ¿es admin?
CREATE OR REPLACE FUNCTION public.is_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT public.has_role(_user_id, 'admin'::public.app_role)
$$;

-- 6. Trigger para auto-crear profile en signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    NEW.email
  );
  -- Default role: doctor (admin debe promoverlos manualmente)
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'doctor'::public.app_role);
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 7. Función updated_at compartida
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

-- 8. Políticas profiles
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

CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 9. Políticas user_roles
CREATE POLICY "Users view own roles" ON public.user_roles
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins view all roles" ON public.user_roles
  FOR SELECT TO authenticated USING (public.is_admin(auth.uid()));
CREATE POLICY "Admins manage roles" ON public.user_roles
  FOR ALL TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

-- 10. Tabla patients
CREATE TABLE public.patients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name text NOT NULL,
  email text,
  phone text,
  birth_date date,
  gender text,
  address text,
  status text NOT NULL DEFAULT 'activo',
  assigned_doctor_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  notes text,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.patients TO authenticated;
GRANT ALL ON public.patients TO service_role;
ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage all patients" ON public.patients
  FOR ALL TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));
CREATE POLICY "Doctors view assigned patients" ON public.patients
  FOR SELECT TO authenticated
  USING (assigned_doctor_id = auth.uid());
CREATE POLICY "Doctors insert patients" ON public.patients
  FOR INSERT TO authenticated
  WITH CHECK (
    public.has_role(auth.uid(), 'doctor'::public.app_role)
    AND assigned_doctor_id = auth.uid()
  );
CREATE POLICY "Doctors update assigned patients" ON public.patients
  FOR UPDATE TO authenticated
  USING (assigned_doctor_id = auth.uid())
  WITH CHECK (assigned_doctor_id = auth.uid());
CREATE POLICY "Doctors delete assigned patients" ON public.patients
  FOR DELETE TO authenticated
  USING (assigned_doctor_id = auth.uid());

CREATE TRIGGER patients_updated_at BEFORE UPDATE ON public.patients
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX idx_patients_assigned_doctor ON public.patients(assigned_doctor_id);
CREATE INDEX idx_patients_status ON public.patients(status);

-- 11. Tabla appointments
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
GRANT SELECT, INSERT, UPDATE, DELETE ON public.appointments TO authenticated;
GRANT ALL ON public.appointments TO service_role;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage all appointments" ON public.appointments
  FOR ALL TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));
CREATE POLICY "Doctors view own appointments" ON public.appointments
  FOR SELECT TO authenticated USING (doctor_id = auth.uid());
CREATE POLICY "Doctors insert own appointments" ON public.appointments
  FOR INSERT TO authenticated WITH CHECK (doctor_id = auth.uid());
CREATE POLICY "Doctors update own appointments" ON public.appointments
  FOR UPDATE TO authenticated
  USING (doctor_id = auth.uid()) WITH CHECK (doctor_id = auth.uid());
CREATE POLICY "Doctors delete own appointments" ON public.appointments
  FOR DELETE TO authenticated USING (doctor_id = auth.uid());

CREATE TRIGGER appointments_updated_at BEFORE UPDATE ON public.appointments
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX idx_appointments_doctor ON public.appointments(doctor_id);
CREATE INDEX idx_appointments_patient ON public.appointments(patient_id);
CREATE INDEX idx_appointments_scheduled ON public.appointments(scheduled_at);
CREATE INDEX idx_appointments_status ON public.appointments(status);
