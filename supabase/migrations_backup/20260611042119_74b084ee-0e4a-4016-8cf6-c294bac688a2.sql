
ALTER TABLE public.clinical_notes
  ADD COLUMN IF NOT EXISTS attachments jsonb NOT NULL DEFAULT '[]'::jsonb;

-- Storage policies for the 'clinical-attachments' bucket.
-- Path convention: <patient_id>/<filename-or-subpath>
CREATE POLICY "clinical_attachments_admin_all"
ON storage.objects FOR ALL TO authenticated
USING (bucket_id = 'clinical-attachments' AND public.is_admin(auth.uid()))
WITH CHECK (bucket_id = 'clinical-attachments' AND public.is_admin(auth.uid()));

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
