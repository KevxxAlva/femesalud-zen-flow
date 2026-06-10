import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface ClinicalNote {
  id: string;
  patient_id: string;
  author_id: string | null;
  title: string;
  content: string;
  note_date: string;
  created_at: string;
  updated_at: string;
}

export type ClinicalNoteInput = {
  patient_id: string;
  title: string;
  content?: string;
  note_date?: string;
};

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
      return data ?? [];
    },
  });
}

export function useCreateClinicalNote() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: ClinicalNoteInput) => {
      const { data: u } = await supabase.auth.getUser();
      const { data, error } = await supabase
        .from("clinical_notes")
        .insert({ ...input, author_id: u.user?.id })
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
    mutationFn: async ({ id }: { id: string; patient_id: string }) => {
      const { error } = await supabase.from("clinical_notes").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_d, v) => qc.invalidateQueries({ queryKey: ["clinical_notes", v.patient_id] }),
  });
}
