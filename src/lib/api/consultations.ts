import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type VisitType = "CONTROL" | "EMERGENCIA" | "CONSULTA_NUEVA" | "POST_TRATAMIENTO" | "OTRO";

export interface ConsultationConsumable {
  id?: string;
  consultation_id?: string;
  item_name: string;
  quantity: number;
  unit: string | null;
}

export interface Consultation {
  id: string;
  appointment_id: string;
  patient_id: string;
  doctor_id: string | null;
  visit_type: VisitType;
  is_first_visit: boolean;
  subjective_exam: string | null;
  
  // Vitals
  height_cm: number | null;
  weight_kg: number | null;
  bmi: number | null;
  blood_pressure: string | null;
  heart_rate: number | null;
  respiratory_rate: number | null;
  temperature: number | null;
  
  // Physical exam
  skin: string | null;
  head_neck: string | null;
  breasts: string | null;
  abdomen: string | null;
  gynecological: string | null;
  extremities: string | null;
  neurological: string | null;
  
  // Colposcopy
  acetic_acid_test: string | null;
  acetic_clock_position: string | null;
  acetic_relative_position: string | null;
  lugol_test: string | null;
  lugol_clock_position: string | null;
  lugol_relative_position: string | null;
  
  // Obstetrics
  gestational_age: string | null;
  fetal_weight: number | null;
  obstetric_bp: string | null;
  uterine_height: number | null;
  presentation: string | null;
  fetal_heart_rate: number | null;
  fetal_movements: string | null;
  edema: string | null;
  alarm_signs: string | null;
  
  // Treatment
  indications: string | null;
  complementary_exams: string | null;
  diagnosis: string | null;
  plan: string | null;
  next_appointment_date: string | null;
  
  // Marketing
  contact_channel: string | null;
  
  created_at: string;
  updated_at: string;

  // Joined fields
  consumables?: ConsultationConsumable[];
  patient_name?: string;
}

export type ConsultationInput = Omit<Consultation, "id" | "created_at" | "updated_at" | "consumables" | "patient_name"> & {
  consumables?: Omit<ConsultationConsumable, "id" | "consultation_id">[];
};

export interface ConsultationFilters {
  from?: string;
  to?: string;
}

export function useConsultations(filters?: ConsultationFilters) {
  const queryKey = filters ? ["consultations", filters] : ["consultations"];
  return useQuery({
    queryKey,
    queryFn: async (): Promise<Consultation[]> => {
      let query = supabase
        .from("consultations")
        .select("id, appointment_id, patient_id, doctor_id, visit_type, is_first_visit, diagnosis, contact_channel, created_at, indications, patients(full_name)")
        .order("created_at", { ascending: false });

      if (filters?.from) {
        query = query.gte("created_at", filters.from);
      }
      if (filters?.to) {
        query = query.lte("created_at", filters.to + "T23:59:59.999Z");
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data ?? []).map((c: any) => ({
        ...c,
        patient_name: c.patients?.full_name ?? "—",
      }));
    },
  });
}

export function usePatientConsultations(patientId: string | undefined) {
  return useQuery({
    queryKey: ["consultations", "patient", patientId],
    enabled: !!patientId,
    queryFn: async (): Promise<Consultation[]> => {
      if (!patientId) return [];
      const { data, error } = await supabase
        .from("consultations")
        .select("*, patients(full_name), consultation_consumables(*)")
        .eq("patient_id", patientId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []).map((c: any) => ({
        ...c,
        patient_name: c.patients?.full_name ?? "—",
        consumables: c.consultation_consumables ?? [],
      }));
    },
  });
}

export function useConsultationByAppointment(appointmentId: string | undefined) {
  return useQuery({
    queryKey: ["consultation", appointmentId],
    queryFn: async (): Promise<Consultation | null> => {
      if (!appointmentId) return null;
      const { data, error } = await supabase
        .from("consultations")
        .select("*, consultation_consumables(*)")
        .eq("appointment_id", appointmentId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!appointmentId,
  });
}

export function useCreateConsultation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ consumables, ...consultationData }: ConsultationInput) => {
      const { data, error } = await supabase.rpc("create_consultation_rpc", {
        p_consultation: consultationData as any,
        p_consumables: (consumables ?? []) as any,
      });
      if (error) throw error;
      return data as Consultation;
    },
    onMutate: async (newConsultation) => {
      await qc.cancelQueries({ queryKey: ["consultations"] });
      await qc.cancelQueries({ queryKey: ["consultations", "patient", newConsultation.patient_id] });
      await qc.cancelQueries({ queryKey: ["consultation", newConsultation.appointment_id] });

      const previousConsultations = qc.getQueriesData({ queryKey: ["consultations"] });
      const previousPatientConsultations = qc.getQueriesData({ queryKey: ["consultations", "patient", newConsultation.patient_id] });
      const previousConsultation = qc.getQueryData(["consultation", newConsultation.appointment_id]);

      const optimisticConsultation = {
        id: crypto.randomUUID(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        ...newConsultation,
      } as Consultation;

      qc.setQueriesData({ queryKey: ["consultations"] }, (old: any) => {
        if (!old) return old;
        if (Array.isArray(old)) return [optimisticConsultation, ...old];
        return old;
      });

      qc.setQueriesData({ queryKey: ["consultations", "patient", newConsultation.patient_id] }, (old: any) => {
        if (!old) return old;
        if (Array.isArray(old)) return [optimisticConsultation, ...old];
        return old;
      });

      qc.setQueryData(["consultation", newConsultation.appointment_id], optimisticConsultation);

      return { previousConsultations, previousPatientConsultations, previousConsultation };
    },
    onError: (err, newConsultation, context: any) => {
      if (context?.previousConsultations) {
        context.previousConsultations.forEach(([queryKey, data]: any) => qc.setQueryData(queryKey, data));
      }
      if (context?.previousPatientConsultations) {
        context.previousPatientConsultations.forEach(([queryKey, data]: any) => qc.setQueryData(queryKey, data));
      }
      if (context?.previousConsultation !== undefined) {
        qc.setQueryData(["consultation", newConsultation.appointment_id], context.previousConsultation);
      }
    },
    onSettled: (_, __, variables) => {
      qc.invalidateQueries({ queryKey: ["consultations"] });
      qc.invalidateQueries({ queryKey: ["consultation", variables.appointment_id] });
      qc.invalidateQueries({ queryKey: ["consultations", "patient", variables.patient_id] });
      qc.invalidateQueries({ queryKey: ["appointments"] });
      qc.invalidateQueries({ queryKey: ["patients"] });
      qc.invalidateQueries({ queryKey: ["clinical_notes"] });
    },
  });
}

export function useUpdateConsultation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, consumables, ...patch }: Partial<ConsultationInput> & { id: string }) => {
      const { data, error } = await supabase.rpc("update_consultation_rpc", {
        p_consultation_id: id,
        p_patch: patch as any,
        p_consumables: consumables as any,
      });
      if (error) throw error;
      return data as Consultation;
    },
    onMutate: async (updatedConsultation) => {
      await qc.cancelQueries({ queryKey: ["consultations"] });
      
      const previousConsultations = qc.getQueriesData({ queryKey: ["consultations"] });
      const previousPatientConsultations = qc.getQueriesData({ queryKey: ["consultations", "patient"] });

      qc.setQueriesData({ queryKey: ["consultations"] }, (old: any) => {
        if (!old || !Array.isArray(old)) return old;
        return old.map((c: any) => c.id === updatedConsultation.id ? { ...c, ...updatedConsultation } : c);
      });

      qc.setQueriesData({ queryKey: ["consultations", "patient"] }, (old: any) => {
        if (!old || !Array.isArray(old)) return old;
        return old.map((c: any) => c.id === updatedConsultation.id ? { ...c, ...updatedConsultation } : c);
      });

      let previousConsultation = undefined;
      if (updatedConsultation.appointment_id) {
         await qc.cancelQueries({ queryKey: ["consultation", updatedConsultation.appointment_id] });
         previousConsultation = qc.getQueryData(["consultation", updatedConsultation.appointment_id]);
         qc.setQueryData(["consultation", updatedConsultation.appointment_id], (old: any) => old ? { ...old, ...updatedConsultation } : old);
      }

      return { previousConsultations, previousPatientConsultations, previousConsultation, appointment_id: updatedConsultation.appointment_id };
    },
    onError: (err, updatedConsultation, context: any) => {
      if (context?.previousConsultations) {
        context.previousConsultations.forEach(([queryKey, data]: any) => qc.setQueryData(queryKey, data));
      }
      if (context?.previousPatientConsultations) {
        context.previousPatientConsultations.forEach(([queryKey, data]: any) => qc.setQueryData(queryKey, data));
      }
      if (context?.appointment_id && context.previousConsultation !== undefined) {
        qc.setQueryData(["consultation", context.appointment_id], context.previousConsultation);
      }
    },
    onSettled: (data) => {
      qc.invalidateQueries({ queryKey: ["consultations"] });
      if (data?.appointment_id) {
        qc.invalidateQueries({ queryKey: ["consultation", data.appointment_id] });
      }
      qc.invalidateQueries({ queryKey: ["consultations", "patient"] });
      qc.invalidateQueries({ queryKey: ["appointments"] });
      qc.invalidateQueries({ queryKey: ["patients"] });
      qc.invalidateQueries({ queryKey: ["clinical_notes"] });
    },
  });
}

export interface PrescriptionTemplate {
  id: string;
  title: string;
  indications: string;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export function usePrescriptionTemplates() {
  return useQuery({
    queryKey: ["prescription_templates"],
    queryFn: async (): Promise<PrescriptionTemplate[]> => {
      const { data, error } = await supabase
        .from("prescription_templates")
        .select("*")
        .order("title", { ascending: true });
      if (error) throw error;
      return data as PrescriptionTemplate[];
    },
  });
}

export function useCreatePrescriptionTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { title: string; indications: string }) => {
      const { data: user } = await supabase.auth.getUser();
      const { data, error } = await supabase
        .from("prescription_templates")
        .insert({
          title: input.title,
          indications: input.indications,
          created_by: user.user?.id || null,
        })
        .select()
        .single();
      if (error) throw error;
      return data as PrescriptionTemplate;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["prescription_templates"] });
    },
  });
}

export function useDeletePrescriptionTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("prescription_templates")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["prescription_templates"] });
    },
  });
}
