
-- clinical_notes
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

GRANT SELECT, INSERT, UPDATE, DELETE ON public.clinical_notes TO authenticated;
GRANT ALL ON public.clinical_notes TO service_role;

ALTER TABLE public.clinical_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage all clinical notes"
  ON public.clinical_notes FOR ALL
  TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Doctors manage notes of their patients"
  ON public.clinical_notes FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.patients p
      WHERE p.id = patient_id AND p.assigned_doctor_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.patients p
      WHERE p.id = patient_id AND p.assigned_doctor_id = auth.uid()
    )
  );

CREATE INDEX idx_clinical_notes_patient ON public.clinical_notes(patient_id, note_date DESC);

CREATE TRIGGER trg_clinical_notes_updated_at
  BEFORE UPDATE ON public.clinical_notes
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- lab_results
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

GRANT SELECT, INSERT, UPDATE, DELETE ON public.lab_results TO authenticated;
GRANT ALL ON public.lab_results TO service_role;

ALTER TABLE public.lab_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage all lab results"
  ON public.lab_results FOR ALL
  TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Doctors manage lab results of their appointments"
  ON public.lab_results FOR ALL
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

CREATE INDEX idx_lab_results_appointment ON public.lab_results(appointment_id);
CREATE INDEX idx_lab_results_patient ON public.lab_results(patient_id, created_at DESC);

CREATE TRIGGER trg_lab_results_updated_at
  BEFORE UPDATE ON public.lab_results
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
