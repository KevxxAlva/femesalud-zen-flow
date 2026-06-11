import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface ClinicalAttachment {
  path: string;
  name: string;
  type: string;
  size: number;
}

export interface ClinicalNote {
  id: string;
  patient_id: string;
  author_id: string | null;
  title: string;
  content: string;
  note_date: string;
  attachments: ClinicalAttachment[];
  created_at: string;
  updated_at: string;
}

export type ClinicalNoteInput = {
  patient_id: string;
  title: string;
  content?: string;
  note_date?: string;
  attachments?: ClinicalAttachment[];
};

export const CLINICAL_BUCKET = "clinical-attachments";

export function useClinicalNotes(patientId: string | undefined) {
  return useQuery({
    queryKey: ["clinical_notes", patientId],
    enabled: !!patientId,
    queryFn: async (): Promise<ClinicalNote[]> => {
      const { data, error } = await supabase
        .from("clinical_notes")
        .select("*")
        .eq("patient_id", patientId!)
        .order("note_date", { ascending: false });
      if (error) throw error;
      return (data ?? []).map((n: any) => ({
        ...n,
        attachments: Array.isArray(n.attachments) ? n.attachments : [],
      }));
    },
  });
}

export function useCreateClinicalNote() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: ClinicalNoteInput) => {
      const { data: u } = await supabase.auth.getUser();
      const { attachments, ...rest } = input;
      const { data, error } = await supabase
        .from("clinical_notes")
        .insert({ ...rest, attachments: (attachments ?? []) as any, author_id: u.user?.id })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_d, v) => qc.invalidateQueries({ queryKey: ["clinical_notes", v.patient_id] }),
  });
}

export function useDeleteClinicalNote() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, attachments }: { id: string; patient_id: string; attachments?: ClinicalAttachment[] }) => {
      if (attachments && attachments.length) {
        await supabase.storage.from(CLINICAL_BUCKET).remove(attachments.map((a) => a.path));
      }
      const { error } = await supabase.from("clinical_notes").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_d, v) => qc.invalidateQueries({ queryKey: ["clinical_notes", v.patient_id] }),
  });
}

export async function uploadClinicalAttachments(
  patientId: string,
  files: File[],
): Promise<ClinicalAttachment[]> {
  const out: ClinicalAttachment[] = [];
  for (const file of files) {
    const safe = file.name.replace(/[^\w.\-]+/g, "_");
    const path = `${patientId}/${Date.now()}_${Math.random().toString(36).slice(2, 8)}_${safe}`;
    const { error } = await supabase.storage.from(CLINICAL_BUCKET).upload(path, file, {
      contentType: file.type || "application/octet-stream",
      upsert: false,
    });
    if (error) throw error;
    out.push({ path, name: file.name, type: file.type, size: file.size });
  }
  return out;
}

export async function getAttachmentUrl(path: string): Promise<string> {
  const { data, error } = await supabase.storage.from(CLINICAL_BUCKET).createSignedUrl(path, 60 * 30);
  if (error) throw error;
  return data.signedUrl;
}
