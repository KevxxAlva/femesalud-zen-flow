import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type AppointmentStatus = "programada" | "completada" | "cancelada";

export interface Appointment {
  id: string;
  patient_id: string;
  doctor_id: string;
  scheduled_at: string;
  duration_minutes: number;
  status: string;
  reason: string | null;
  notes: string | null;
  price: number | null;
  created_at: string;
  updated_at: string;
}

export interface AppointmentWithPatient extends Appointment {
  patient_name?: string;
  has_consultation?: boolean;
}

export type AppointmentInput = {
  patient_id: string;
  doctor_id: string;
  scheduled_at: string;
  duration_minutes?: number;
  status?: string;
  reason?: string | null;
  notes?: string | null;
  price?: number | null;
};

export function useAppointments() {
  return useQuery({
    queryKey: ["appointments"],
    queryFn: async (): Promise<AppointmentWithPatient[]> => {
      const { data, error } = await supabase
        .from("appointments")
        .select("*, patients(full_name), consultations(id)")
        .order("scheduled_at", { ascending: false });
      if (error) throw error;
      return (data ?? []).map((a: any) => ({
        ...a,
        patient_name: a.patients?.full_name ?? "—",
        has_consultation: !!a.consultations && a.consultations.length > 0,
      }));
    },
  });
}

export function useCreateAppointment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: AppointmentInput) => {
      const { data: user } = await supabase.auth.getUser();
      const { error, data } = await supabase
        .from("appointments")
        .insert({ ...input, created_by: user.user?.id })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["appointments"] }),
  });
}

export function useUpdateAppointment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...patch }: Partial<AppointmentInput> & { id: string }) => {
      const { error, data } = await supabase.from("appointments").update(patch).eq("id", id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["appointments"] }),
  });
}

export function useDeleteAppointment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("appointments").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["appointments"] }),
  });
}
