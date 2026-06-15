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
        .select("*, patients(full_name)")
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
      // 1. Insert consultation
      const { data: user } = await supabase.auth.getUser();
      const { data: consultation, error: cError } = await supabase
        .from("consultations")
        .insert({
          ...consultationData,
          doctor_id: consultationData.doctor_id || user.user?.id || null,
        })
        .select()
        .single();
      if (cError) throw cError;

      // 2. Insert consumables if present
      if (consumables && consumables.length > 0) {
        const consumablesWithId = consumables.map((item) => ({
          ...item,
          consultation_id: consultation.id,
        }));
        const { error: consError } = await supabase
          .from("consultation_consumables")
          .insert(consumablesWithId);
        if (consError) throw consError;
      }

      // 3. Mark appointment as completed
      await supabase
        .from("appointments")
        .update({ status: "completada" })
        .eq("id", consultationData.appointment_id);

      // 4. Create next appointment if next_appointment_date is provided
      if (consultationData.next_appointment_date) {
        const { data: origApp } = await supabase
          .from("appointments")
          .select("scheduled_at, doctor_id, reason, price")
          .eq("id", consultationData.appointment_id)
          .maybeSingle();

        let scheduledAt = `${consultationData.next_appointment_date}T09:00:00Z`;
        if (origApp?.scheduled_at) {
          try {
            const timePart = new Date(origApp.scheduled_at).toISOString().split("T")[1];
            scheduledAt = `${consultationData.next_appointment_date}T${timePart}`;
          } catch (e) {
            console.error("Error parsing scheduled_at:", e);
          }
        }

        await supabase
          .from("appointments")
          .insert({
            patient_id: consultationData.patient_id,
            doctor_id: origApp?.doctor_id || consultationData.doctor_id || user.user?.id || null,
            scheduled_at: scheduledAt,
            status: "programada",
            reason: "Próxima Cita",
            price: origApp?.price || 0,
            created_by: user.user?.id || null,
          });
      }

      return consultation;
    },
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: ["consultations"] });
      qc.invalidateQueries({ queryKey: ["consultation", variables.appointment_id] });
      qc.invalidateQueries({ queryKey: ["appointments"] });
      qc.invalidateQueries({ queryKey: ["patients"] });
      qc.invalidateQueries({ queryKey: ["clinical-notes"] });
    },
  });
}

export function useUpdateConsultation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, consumables, ...patch }: Partial<ConsultationInput> & { id: string }) => {
      // 1. Fetch current consultation data before update
      const { data: oldConsultation } = await supabase
        .from("consultations")
        .select("next_appointment_date, patient_id, appointment_id, doctor_id")
        .eq("id", id)
        .maybeSingle();

      // 2. Update consultation details
      const { data: consultation, error: cError } = await supabase
        .from("consultations")
        .update(patch)
        .eq("id", id)
        .select()
        .single();
      if (cError) throw cError;

      // 2. Update consumables if provided
      if (consumables) {
        // Delete existing ones
        const { error: delError } = await supabase
          .from("consultation_consumables")
          .delete()
          .eq("consultation_id", id);
        if (delError) throw delError;

        // Insert new ones
        if (consumables.length > 0) {
          const newConsumables = consumables.map((item) => ({
            ...item,
            consultation_id: id,
          }));
          const { error: insError } = await supabase
            .from("consultation_consumables")
            .insert(newConsumables);
          if (insError) throw insError;
        }
      }

      // 4. Handle next appointment date change
      if (patch.next_appointment_date && patch.next_appointment_date !== oldConsultation?.next_appointment_date) {
        const { data: user } = await supabase.auth.getUser();
        
        // Fetch original appointment to copy details
        const { data: origApp } = await supabase
          .from("appointments")
          .select("scheduled_at, doctor_id, reason, price")
          .eq("id", oldConsultation.appointment_id)
          .maybeSingle();

        let scheduledAt = `${patch.next_appointment_date}T09:00:00Z`;
        if (origApp?.scheduled_at) {
          try {
            const timePart = new Date(origApp.scheduled_at).toISOString().split("T")[1];
            scheduledAt = `${patch.next_appointment_date}T${timePart}`;
          } catch (e) {
            console.error("Error parsing scheduled_at:", e);
          }
        }

        // Check if there is already a scheduled next appointment created after the consultation's original appointment date
        const { data: existingNextApp } = await supabase
          .from("appointments")
          .select("id")
          .eq("patient_id", oldConsultation.patient_id)
          .eq("status", "programada")
          .gt("scheduled_at", origApp?.scheduled_at || new Date(0).toISOString())
          .order("scheduled_at", { ascending: true })
          .limit(1)
          .maybeSingle();

        if (existingNextApp) {
          // Update existing next appointment
          await supabase
            .from("appointments")
            .update({ scheduled_at: scheduledAt })
            .eq("id", existingNextApp.id);
        } else {
          // Create new next appointment
          await supabase
            .from("appointments")
            .insert({
              patient_id: oldConsultation.patient_id,
              doctor_id: origApp?.doctor_id || oldConsultation.doctor_id || user.user?.id || null,
              scheduled_at: scheduledAt,
              status: "programada",
              reason: "Próxima Cita",
              price: origApp?.price || 0,
              created_by: user.user?.id || null,
            });
        }
      }

      return consultation;
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["consultations"] });
      if (data?.appointment_id) {
        qc.invalidateQueries({ queryKey: ["consultation", data.appointment_id] });
      }
      qc.invalidateQueries({ queryKey: ["appointments"] });
      qc.invalidateQueries({ queryKey: ["patients"] });
      qc.invalidateQueries({ queryKey: ["clinical-notes"] });
    },
  });
}
