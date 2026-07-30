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

// Helpers to Pack/Unpack the JSON payload into `observaciones`
const packObservaciones = (data: Partial<ConsultationInput>) => {
  const json = {
    visit_type: data.visit_type,
    is_first_visit: data.is_first_visit,
    subjective_exam: data.subjective_exam,
    height_cm: data.height_cm, weight_kg: data.weight_kg, bmi: data.bmi,
    blood_pressure: data.blood_pressure, heart_rate: data.heart_rate,
    respiratory_rate: data.respiratory_rate, temperature: data.temperature,
    skin: data.skin, head_neck: data.head_neck, breasts: data.breasts, abdomen: data.abdomen,
    gynecological: data.gynecological, extremities: data.extremities, neurological: data.neurological,
    acetic_acid_test: data.acetic_acid_test, acetic_clock_position: data.acetic_clock_position,
    acetic_relative_position: data.acetic_relative_position, lugol_test: data.lugol_test,
    lugol_clock_position: data.lugol_clock_position, lugol_relative_position: data.lugol_relative_position,
    gestational_age: data.gestational_age, fetal_weight: data.fetal_weight,
    obstetric_bp: data.obstetric_bp, uterine_height: data.uterine_height,
    presentation: data.presentation, fetal_heart_rate: data.fetal_heart_rate,
    fetal_movements: data.fetal_movements, edema: data.edema, alarm_signs: data.alarm_signs,
    complementary_exams: data.complementary_exams, plan: data.plan,
    next_appointment_date: data.next_appointment_date, contact_channel: data.contact_channel,
    indications: data.indications, diagnosis: data.diagnosis
  };
  return JSON.stringify(json);
};

const unpackConsultation = (h: any): Consultation => {
  let extra: any = {};
  try {
     extra = h.notas_medicas ? JSON.parse(h.notas_medicas) : (h.observaciones ? JSON.parse(h.observaciones) : {});
  } catch(e) {}

  const patient = h.citas?.pacientes || h.pacientes || null;

  return {
    id: (h.id_consulta || h.id_historia || "").toString(),
    appointment_id: h.id_cita?.toString() || "",
    patient_id: h.citas?.id_paciente?.toString() || h.id_paciente?.toString() || "",
    doctor_id: h.id_medico?.toString() || null,
    
    visit_type: extra.visit_type || "CONTROL",
    is_first_visit: !!extra.is_first_visit,
    subjective_exam: h.sintomas || h.motivo_consulta || extra.subjective_exam || h.enfermedad_actual || null,
    
    height_cm: extra.height_cm || null,
    weight_kg: h.peso_kg || extra.weight_kg || null,
    bmi: extra.bmi || null,
    blood_pressure: h.presion_arterial || extra.blood_pressure || null,
    heart_rate: extra.heart_rate || null,
    respiratory_rate: extra.respiratory_rate || null,
    temperature: h.temperatura_c || extra.temperature || null,
    
    skin: extra.skin || null,
    head_neck: extra.head_neck || null,
    breasts: extra.breasts || null,
    abdomen: extra.abdomen || null,
    gynecological: extra.gynecological || h.examen_fisico || null,
    extremities: extra.extremities || null,
    neurological: extra.neurological || null,
    
    acetic_acid_test: extra.acetic_acid_test || null,
    acetic_clock_position: extra.acetic_clock_position || null,
    acetic_relative_position: extra.acetic_relative_position || null,
    lugol_test: extra.lugol_test || null,
    lugol_clock_position: extra.lugol_clock_position || null,
    lugol_relative_position: extra.lugol_relative_position || null,
    
    gestational_age: extra.gestational_age || null,
    fetal_weight: extra.fetal_weight || null,
    obstetric_bp: extra.obstetric_bp || null,
    uterine_height: extra.uterine_height || null,
    presentation: extra.presentation || null,
    fetal_heart_rate: extra.fetal_heart_rate || null,
    fetal_movements: extra.fetal_movements || null,
    edema: extra.edema || null,
    alarm_signs: extra.alarm_signs || null,
    
    indications: extra.indications || h.tratamiento || null,
    complementary_exams: extra.complementary_exams || null,
    diagnosis: h.diagnostico || extra.diagnosis || null,
    plan: extra.plan || null,
    next_appointment_date: extra.next_appointment_date || null,
    contact_channel: extra.contact_channel || null,
    
    created_at: h.fecha_hora || h.fecha_consulta || new Date().toISOString(),
    updated_at: h.fecha_hora || h.fecha_consulta || new Date().toISOString(),
    
    patient_name: patient ? `${patient.nombre} ${patient.apellido}` : "—",
    consumables: (h.insumos_consulta ?? []).map((i: any) => ({
      id: i.id_insumo,
      consultation_id: i.id_consulta || i.id_historia,
      item_name: i.nombre_insumo,
      quantity: i.cantidad,
      unit: null
    }))
  };
};

export function useConsultations(filters?: ConsultationFilters) {
  const queryKey = filters ? ["consultations", filters] : ["consultations"];
  return useQuery({
    queryKey,
    queryFn: async (): Promise<Consultation[]> => {
      let query = supabase
        .from("consultas")
        .select("*, citas(id_paciente, pacientes(nombre, apellido))")
        .order("fecha_hora", { ascending: false });

      if (filters?.from) {
        query = query.gte("fecha_hora", filters.from);
      }
      if (filters?.to) {
        query = query.lte("fecha_hora", filters.to + "T23:59:59.999Z");
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data ?? []).map(unpackConsultation);
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
        .from("consultas")
        .select("*, citas!inner(id_paciente, pacientes(nombre, apellido))")
        .eq("citas.id_paciente", parseInt(patientId))
        .order("fecha_hora", { ascending: false });
      if (error) throw error;
      
      const mapped = (data ?? []).map(unpackConsultation);
      
      // Fetch consumables separately just to be safe
      const consultaIds = mapped.map(c => parseInt(c.id)).filter(id => !isNaN(id));
      if (consultaIds.length > 0) {
        const { data: consumables } = await supabase.from("insumos_consulta").select("*").in("id_consulta", consultaIds);
        if (consumables && consumables.length > 0) {
          mapped.forEach(c => {
             const cons = consumables.filter(co => co.id_consulta === parseInt(c.id));
             if (cons.length > 0) {
                c.consumables = cons.map((i: any) => ({
                  id: i.id_insumo,
                  consultation_id: i.id_consulta,
                  item_name: i.nombre_insumo,
                  quantity: i.cantidad,
                  unit: null
                }));
             }
          });
        }
      }

      return mapped;
    },
  });
}

export function useConsultationByAppointment(appointmentId: string | undefined) {
  return useQuery({
    queryKey: ["consultation", appointmentId],
    queryFn: async (): Promise<Consultation | null> => {
      if (!appointmentId) return null;
      const { data, error } = await supabase
        .from("consultas")
        .select("*, citas(id_paciente, pacientes(nombre, apellido))")
        .eq("id_cita", parseInt(appointmentId))
        .maybeSingle();
      if (error && error.code !== 'PGRST116') throw error;
      if (!data) return null;
      
      const mapped = unpackConsultation(data);
      const idConsulta = parseInt(mapped.id);
      if (!isNaN(idConsulta)) {
        const { data: consumables } = await supabase.from("insumos_consulta").select("*").eq("id_consulta", idConsulta);
        if (consumables && consumables.length > 0) {
           mapped.consumables = consumables.map((i: any) => ({
             id: i.id_insumo,
             consultation_id: i.id_consulta,
             item_name: i.nombre_insumo,
             quantity: i.cantidad,
             unit: null
           }));
        }
      }

      return mapped;
    },
    enabled: !!appointmentId,
  });
}

export function useCreateConsultation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ consumables, ...consultationData }: ConsultationInput) => {
      // 1. Get or Create historias_clinicas
      const { data: hcList } = await supabase.from("historias_clinicas").select("id_historia").eq("id_paciente", parseInt(consultationData.patient_id));
      let id_historia = hcList?.[0]?.id_historia;
      if (!id_historia) {
         const { data: newHc, error: hcError } = await supabase.from("historias_clinicas").insert({ id_paciente: parseInt(consultationData.patient_id) }).select().single();
         if (hcError) throw hcError;
         id_historia = newHc.id_historia;
      }

      // 2. Insert consultation
      const jsonObservaciones = packObservaciones(consultationData);
      
      const { data: hc, error: cError } = await supabase
        .from("consultas")
        .insert({
          id_cita: parseInt(consultationData.appointment_id),
          id_historia: id_historia,
          id_medico: consultationData.doctor_id ? parseInt(consultationData.doctor_id) : null,
          diagnostico: consultationData.diagnosis || null,
          peso_kg: consultationData.weight_kg || null,
          presion_arterial: consultationData.blood_pressure || null,
          temperatura_c: consultationData.temperature || null,
          sintomas: consultationData.subjective_exam || null,
          motivo_consulta: consultationData.visit_type || null,
          notas_medicas: jsonObservaciones
        })
        .select()
        .single();
      if (cError) throw cError;

      // 3. Insert consumables if present
      if (consumables && consumables.length > 0) {
        const newConsumables = consumables.map((item) => ({
          id_consulta: hc.id_consulta,
          id_historia: id_historia, // In case DB still requires it
          nombre_insumo: item.item_name,
          cantidad: item.quantity
        }));
        // We catch errors silently here just in case schema is out of sync for consumables
        const { error: consError } = await supabase
          .from("insumos_consulta")
          .insert(newConsumables);
        if (consError) {
           console.warn("Error inserting consumables:", consError);
        }

        // Deduct from inventory
        for (const item of consumables) {
          const { data: stockItem } = await supabase
            .from("inventory_stocks")
            .select("id, quantity")
            .eq("name", item.item_name)
            .maybeSingle();
          if (stockItem) {
            await supabase
              .from("inventory_stocks")
              .update({ quantity: Math.max(0, stockItem.quantity - item.quantity) })
              .eq("id", stockItem.id);
          }
        }
      }

      // 4. Mark appointment as completed
      await supabase
        .from("citas")
        .update({ estado: "Completada" })
        .eq("id_cita", parseInt(consultationData.appointment_id));

      // 4. Create next appointment if next_appointment_date is provided
      if (consultationData.next_appointment_date) {
        const { data: origApp } = await supabase
          .from("citas")
          .select("fecha_hora, id_medico")
          .eq("id_cita", parseInt(consultationData.appointment_id))
          .maybeSingle();

        let scheduledAt = `${consultationData.next_appointment_date}T09:00:00Z`;
        if (origApp?.fecha_hora) {
          try {
            const timePart = new Date(origApp.fecha_hora).toISOString().split("T")[1];
            scheduledAt = `${consultationData.next_appointment_date}T${timePart}`;
          } catch (e) {}
        }

        await supabase
          .from("citas")
          .insert({
            id_paciente: parseInt(consultationData.patient_id),
            id_medico: origApp?.id_medico || (consultationData.doctor_id ? parseInt(consultationData.doctor_id) : null),
            fecha_hora: scheduledAt,
            estado: "Programada",
            motivo: "Próxima Cita"
          });
      }

      return unpackConsultation(hc);
    },
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: ["consultations"] });
      qc.invalidateQueries({ queryKey: ["consultation", variables.appointment_id] });
      qc.invalidateQueries({ queryKey: ["appointments"] });
      qc.invalidateQueries({ queryKey: ["patients"] });
      qc.invalidateQueries({ queryKey: ["clinical-notes"] });
      qc.invalidateQueries({ queryKey: ["inventory_stocks"] });
    },
  });
}

export function useUpdateConsultation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, consumables, ...patch }: Partial<ConsultationInput> & { id: string }) => {
      // 1. Fetch current consultation data before update
      const { data: oldHc } = await supabase
        .from("consultas")
        .select("*, citas(id_paciente)")
        .eq("id_consulta", parseInt(id))
        .maybeSingle();

      if (!oldHc) throw new Error("Consulta no encontrada");

      // Merge JSON for notas_medicas
      let oldJson: any = {};
      try { oldJson = JSON.parse(oldHc.notas_medicas || "{}"); } catch(e){}
      
      const newJson = { ...oldJson, ...patch };
      const jsonObservaciones = packObservaciones(newJson);

      const updateData: any = {
         notas_medicas: jsonObservaciones
      };
      if (patch.diagnosis !== undefined) updateData.diagnostico = patch.diagnosis;
      if (patch.weight_kg !== undefined) updateData.peso_kg = patch.weight_kg;
      if (patch.blood_pressure !== undefined) updateData.presion_arterial = patch.blood_pressure;
      if (patch.temperature !== undefined) updateData.temperatura_c = patch.temperature;
      if (patch.subjective_exam !== undefined) updateData.sintomas = patch.subjective_exam;
      if (patch.visit_type !== undefined) updateData.motivo_consulta = patch.visit_type;

      // 2. Update consultation details
      const { data: hc, error: cError } = await supabase
        .from("consultas")
        .update(updateData)
        .eq("id_consulta", parseInt(id))
        .select()
        .single();
      if (cError) throw cError;

      // 3. Update consumables if provided
      if (consumables) {
        // Fetch old consumables to restore inventory
        const { data: oldConsumables } = await supabase
          .from("insumos_consulta")
          .select("*")
          .eq("id_consulta", parseInt(id));
          
        if (oldConsumables) {
          for (const old of oldConsumables) {
            const { data: stockItem } = await supabase
              .from("inventory_stocks")
              .select("id, quantity")
              .eq("name", old.nombre_insumo)
              .maybeSingle();
            if (stockItem) {
              await supabase
                .from("inventory_stocks")
                .update({ quantity: stockItem.quantity + old.cantidad })
                .eq("id", stockItem.id);
            }
          }
        }

        // Try deleting by id_consulta first, then id_historia just in case
        await (supabase as any).from("insumos_consulta").delete().eq("id_consulta", parseInt(id));
        if (oldHc.id_historia) {
           await (supabase as any).from("insumos_consulta").delete().eq("id_historia", oldHc.id_historia);
        }

        if (consumables.length > 0) {
          const newConsumables = consumables.map((item) => ({
            id_consulta: parseInt(id),
            id_historia: oldHc.id_historia,
            nombre_insumo: item.item_name,
            cantidad: item.quantity
          }));
          const { error: insError } = await (supabase as any).from("insumos_consulta").insert(newConsumables);
          if (insError) {
             console.warn("Error inserting consumables on update:", insError);
          }
          
          // Deduct new consumables from inventory
          for (const item of consumables) {
            const { data: stockItem } = await supabase
              .from("inventory_stocks")
              .select("id, quantity")
              .eq("name", item.item_name)
              .maybeSingle();
            if (stockItem) {
              await supabase
                .from("inventory_stocks")
                .update({ quantity: Math.max(0, (stockItem.quantity || 0) - item.quantity) })
                .eq("id", stockItem.id);
            }
          }
        }
      }

      // 4. Handle next appointment date change
      if (patch.next_appointment_date && patch.next_appointment_date !== oldJson?.next_appointment_date) {
        
        const { data: origApp } = await supabase
          .from("citas")
          .select("fecha_hora, id_medico")
          .eq("id_cita", Number(oldHc.id_cita))
          .maybeSingle();

        let scheduledAt = `${patch.next_appointment_date}T09:00:00Z`;
        if (origApp?.fecha_hora) {
          try {
            const timePart = new Date(origApp.fecha_hora).toISOString().split("T")[1];
            scheduledAt = `${patch.next_appointment_date}T${timePart}`;
          } catch (e) {}
        }

        const patientId = oldHc.citas?.id_paciente;
        if (patientId) {
          const { data: existingNextApp } = await supabase
            .from("citas")
            .select("id_cita")
            .eq("id_paciente", patientId)
            .eq("estado", "Programada")
            .gt("fecha_hora", origApp?.fecha_hora || new Date(0).toISOString())
            .order("fecha_hora", { ascending: true })
            .limit(1)
            .maybeSingle();

          if (existingNextApp) {
            await supabase.from("citas").update({ fecha_hora: scheduledAt }).eq("id_cita", existingNextApp.id_cita);
          } else {
            await supabase.from("citas").insert({
              id_paciente: patientId,
              id_medico: origApp?.id_medico || oldHc.id_medico,
              fecha_hora: scheduledAt,
              estado: "Programada",
              motivo: "Próxima Cita"
            });
          }
        }
      }

      return unpackConsultation(hc);
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
