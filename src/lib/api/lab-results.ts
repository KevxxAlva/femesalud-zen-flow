import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type LabStatus = "pendiente" | "completado";

export interface LabResult {
  id: string;
  appointment_id: string;
  patient_id: string;
  test_type: string;
  result: string | null;
  status: string;
  file_url: string | null;
  result_date: string | null;
  created_at: string;
  updated_at: string;
}

export interface LabResultWithMeta extends LabResult {
  patient_name?: string;
  scheduled_at?: string;
  doctor_id?: string;
}

export type LabResultInput = {
  appointment_id: string;
  patient_id: string;
  test_type: string;
  result?: string | null;
  status?: string;
  file_url?: string | null;
  result_date?: string | null;
};

export function useLabResults() {
  return useQuery({
    queryKey: ["lab_results"],
    queryFn: async (): Promise<LabResultWithMeta[]> => {
      const { data, error } = await supabase
        .from("lab_results")
        .select("*, patients(full_name), appointments(scheduled_at, doctor_id)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []).map((r: any) => ({
        ...r,
        patient_name: r.patients?.full_name ?? "—",
        scheduled_at: r.appointments?.scheduled_at,
        doctor_id: r.appointments?.doctor_id,
      }));
    },
  });
}

export function useCreateLabResult() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: LabResultInput) => {
      const { data: u } = await supabase.auth.getUser();
      const { data, error } = await supabase
        .from("lab_results")
        .insert({ ...input, created_by: u.user?.id })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["lab_results"] }),
  });
}

export function useUpdateLabResult() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...patch }: Partial<LabResultInput> & { id: string }) => {
      const { data, error } = await supabase.from("lab_results").update(patch).eq("id", id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["lab_results"] }),
  });
}

export function useDeleteLabResult() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("lab_results").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["lab_results"] }),
  });
}
