import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type PatientStatus = "activo" | "en_tratamiento" | "alta" | "nuevo";

export interface Patient {
  id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  birth_date: string | null;
  address: string | null;
  status: string;
  assigned_doctor_id: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  document_id: string | null;
  historia_number: string | null;
  first_visit_date: string | null;
  marital_status: string | null;
  birthplace: string | null;
  education_level: string | null;
  occupation: string | null;
  ethnicity: string | null;
  family_history: {
    mother: string | null;
    father: string | null;
    siblings: string | null;
    children: string | null;
  } | null;
  personal_history: {
    alcohol: string | null;
    drugs: string | null;
    tobacco: string | null;
    base_pathology: string | null;
    surgical: string | null;
    allergies: string | null;
  } | null;
  gynecological_data: {
    menarche: number | string | null;
    sexarche: number | string | null;
    menstrual_cycle: string | null;
    dysmenorrhea: string | null;
    nps: number | string | null;
    its: string | null;
    cytology: string | null;
    contraceptives: string | null;
  } | null;
  obstetric_data: {
    g: number | string | null;
    p: number | string | null;
    c: number | string | null;
    a: number | string | null;
    pig: string | null;
    em: number | string | null;
    ee: number | string | null;
    complications: string | null;
    fum: string | null;
    eg: string | null;
    fpp: string | null;
    num_consultations: number | string | null;
    vaccines: string | null;
  } | null;
  consultation_reason: string | null;
  current_illness: string | null;
}

export type PatientInput = Omit<Patient, "id" | "created_at" | "updated_at">;

export function usePatients() {
  return useQuery({
    queryKey: ["patients"],
    queryFn: async (): Promise<Patient[]> => {
      const { data, error } = await supabase
        .from("patients")
        .select("id, full_name, email, phone, status, assigned_doctor_id, created_at, updated_at, document_id, historia_number")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data as any) as Patient[];
    },
  });
}

export function usePatient(id: string | undefined | null) {
  return useQuery({
    queryKey: ["patient", id],
    queryFn: async (): Promise<Patient> => {
      if (!id) throw new Error("No patient ID provided");
      const { data, error } = await supabase
        .from("patients")
        .select("*")
        .eq("id", id)
        .single();
      if (error) throw error;
      return (data as any) as Patient;
    },
    enabled: !!id,
  });
}

export function useCreatePatient() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: Partial<PatientInput> & { full_name: string; assigned_doctor_id: string }) => {
      const { data: user } = await supabase.auth.getUser();
      const { error, data } = await supabase
        .from("patients")
        .insert({ ...input, created_by: user.user?.id })
        .select()
        .single();
      if (error) throw error;
      return (data as any) as Patient;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["patients"] }),
  });
}

export function useUpdatePatient() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...patch }: Partial<PatientInput> & { id: string }) => {
      const { error, data } = await supabase.from("patients").update(patch).eq("id", id).select().single();
      if (error) throw error;
      return (data as any) as Patient;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["patients"] }),
  });
}

export function useDeletePatient() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("patients").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["patients"] });
      qc.invalidateQueries({ queryKey: ["appointments"] });
    },
  });
}
