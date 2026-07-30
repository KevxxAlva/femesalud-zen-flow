import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { logAuditAction } from "@/lib/api/audit";

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

// Helper to map DB record to Patient interface
const mapPatient = (p: any): Patient => {
  const hc = Array.isArray(p.historias_clinicas) ? p.historias_clinicas[0] : (p.historias_clinicas || {});
  const extras = typeof hc.datos_extras === 'object' && hc.datos_extras !== null ? hc.datos_extras : {};

  return {
    id: p.id_paciente?.toString(),
    full_name: `${p.nombre} ${p.apellido}`.trim(),
    email: p.email,
    phone: p.telefono,
    birth_date: p.fecha_nacimiento,
    address: p.direccion,
    status: extras.status || "activo",
    assigned_doctor_id: extras.assigned_doctor_id || null,
    notes: extras.notes || null,
    created_at: p.creado_en || new Date().toISOString(),
    updated_at: p.creado_en || new Date().toISOString(),
    document_id: p.documento_identidad,
    historia_number: hc.id_historia?.toString() || extras.historia_number || null,
    first_visit_date: extras.first_visit_date || null,
    marital_status: extras.marital_status || null,
    birthplace: extras.birthplace || null,
    education_level: extras.education_level || null,
    occupation: extras.occupation || null,
    ethnicity: extras.ethnicity || null,
    family_history: {
      mother: extras.family_history?.mother || null,
      father: extras.family_history?.father || null,
      siblings: extras.family_history?.siblings || null,
      children: hc.antecedentes_familiares || extras.family_history?.children || null,
    },
    personal_history: {
      alcohol: extras.personal_history?.alcohol || null,
      drugs: extras.personal_history?.drugs || null,
      tobacco: extras.personal_history?.tobacco || null,
      base_pathology: hc.enfermedades_cronicas || extras.personal_history?.base_pathology || null,
      surgical: extras.personal_history?.surgical || null,
      allergies: hc.alergias || extras.personal_history?.allergies || null,
    },
    gynecological_data: extras.gynecological_data || null,
    obstetric_data: extras.obstetric_data || null,
    consultation_reason: extras.consultation_reason || null,
    current_illness: extras.current_illness || null,
  };
};

export function usePatients() {
  return useQuery({
    queryKey: ["patients"],
    queryFn: async (): Promise<Patient[]> => {
      const { data, error } = await supabase
        .from("pacientes")
        .select("id_paciente, nombre, apellido, email, telefono, fecha_nacimiento, creado_en, documento_identidad, historias_clinicas(id_historia)")
        .order("creado_en", { ascending: false });
      if (error) throw error;
      return (data ?? []).map(mapPatient);
    },
  });
}

export function usePatientCount() {
  return useQuery({
    queryKey: ["patients_count"],
    queryFn: async (): Promise<number> => {
      const { count, error } = await supabase
        .from("pacientes")
        .select("id_paciente", { count: "exact", head: true });
      if (error) throw error;
      return count ?? 0;
    },
  });
}

export function usePatientsGrowth() {
  return useQuery({
    queryKey: ["patients_growth"],
    queryFn: async (): Promise<{ created_at: string }[]> => {
      const fourteenDaysAgo = new Date();
      fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);
      const { data, error } = await supabase
        .from("pacientes")
        .select("creado_en")
        .gte("creado_en", fourteenDaysAgo.toISOString());
      if (error) throw error;
      return (data ?? []).map(d => ({ created_at: d.creado_en }));
    },
  });
}

export function usePatientsCountByDateRange(from?: string, to?: string) {
  return useQuery({
    queryKey: ["patients_count_range", from, to],
    queryFn: async (): Promise<number> => {
      let query = supabase
        .from("pacientes")
        .select("id_paciente", { count: "exact", head: true });
      if (from) {
        query = query.gte("creado_en", from);
      }
      if (to) {
        query = query.lte("creado_en", to + "T23:59:59.999Z");
      }
      const { count, error } = await query;
      if (error) throw error;
      return count ?? 0;
    },
  });
}

export function useRecentPatients(limit: number = 5) {
  return useQuery({
    queryKey: ["patients_recent", limit],
    queryFn: async (): Promise<Patient[]> => {
      const { data, error } = await supabase
        .from("pacientes")
        .select("id_paciente, nombre, apellido, email, telefono, fecha_nacimiento, creado_en, documento_identidad, historias_clinicas(id_historia)")
        .order("creado_en", { ascending: false })
        .limit(limit);
      if (error) throw error;
      return (data ?? []).map(mapPatient);
    },
  });
}

export function usePaginatedPatients(
  page: number = 1,
  pageSize: number = 10,
  search?: string,
  status?: PatientStatus
) {
  return useQuery({
    queryKey: ["patients_paginated", page, pageSize, search, status],
    queryFn: async (): Promise<{ data: Patient[]; count: number }> => {
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;

      let query = supabase
        .from("pacientes")
        .select("id_paciente, nombre, apellido, email, telefono, fecha_nacimiento, creado_en, documento_identidad, historias_clinicas(id_historia)", { count: "exact" })
        .order("creado_en", { ascending: false })
        .range(from, to);

      if (search) {
        query = query.or(
          `nombre.ilike.%${search}%,apellido.ilike.%${search}%,email.ilike.%${search}%,documento_identidad.ilike.%${search}%`
        );
      }

      // We don't have status in DB yet, ignore status filter

      const { data, error, count } = await query;
      if (error) throw error;
      return { data: (data ?? []).map(mapPatient), count: count ?? 0 };
    },
  });
}

export function usePatient(id: string | undefined | null) {
  return useQuery({
    queryKey: ["patient", id],
    queryFn: async (): Promise<Patient> => {
      if (!id) throw new Error("No patient ID provided");
      const { data, error } = await supabase
        .from("pacientes")
        .select("*, historias_clinicas(*)")
        .eq("id_paciente", parseInt(id))
        .single();
      if (error) throw error;
      return mapPatient(data);
    },
    enabled: !!id,
  });
}

export function useCreatePatient() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: Partial<PatientInput> & { full_name: string; assigned_doctor_id: string }) => {
      const names = input.full_name.split(' ');
      const nombre = names[0];
      const apellido = names.slice(1).join(' ') || '';

      const { error: patientError, data: patientData } = await supabase
        .from("pacientes")
        .insert({ 
          nombre, 
          apellido, 
          email: input.email, 
          telefono: input.phone,
          documento_identidad: input.document_id || Math.random().toString().slice(2, 10),
          fecha_nacimiento: input.birth_date,
          direccion: input.address
        })
        .select()
        .single();
      if (patientError) throw patientError;

      const {
        status, assigned_doctor_id, notes, historia_number, first_visit_date, 
        marital_status, birthplace, education_level, occupation, ethnicity,
        family_history, personal_history, gynecological_data, obstetric_data,
        consultation_reason, current_illness
      } = input;
      
      const datos_extras = {
        status, assigned_doctor_id, notes, historia_number, first_visit_date, 
        marital_status, birthplace, education_level, occupation, ethnicity,
        family_history, personal_history, gynecological_data, obstetric_data,
        consultation_reason, current_illness
      };

      const { error: hcError, data: hcData } = await supabase
        .from("historias_clinicas")
        .insert({
          id_paciente: patientData.id_paciente,
          alergias: input.personal_history?.allergies || null,
          enfermedades_cronicas: input.personal_history?.base_pathology || null,
          antecedentes_familiares: input.family_history?.children || null,
          datos_extras
        })
        .select()
        .single();
      if (hcError) console.error("Error creating historia clinica", hcError);

      return mapPatient({ ...patientData, historias_clinicas: hcData });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["patients"] });
      qc.invalidateQueries({ queryKey: ["patients_count"] });
      qc.invalidateQueries({ queryKey: ["patients_paginated"] });
      qc.invalidateQueries({ queryKey: ["patients_recent"] });
    },
  });
}

export function useUpdatePatient() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...patch }: Partial<PatientInput> & { id: string }) => {
      const updateData: any = {};
      if (patch.full_name) {
        const names = patch.full_name.split(' ');
        updateData.nombre = names[0];
        updateData.apellido = names.slice(1).join(' ') || '';
      }
      if (patch.email !== undefined) updateData.email = patch.email;
      if (patch.phone !== undefined) updateData.telefono = patch.phone;
      if (patch.document_id !== undefined) updateData.documento_identidad = patch.document_id;
      if (patch.birth_date !== undefined) updateData.fecha_nacimiento = patch.birth_date;
      if (patch.address !== undefined) updateData.direccion = patch.address;

      const { error: patientError, data: patientData } = await supabase
        .from("pacientes")
        .update(updateData)
        .eq("id_paciente", parseInt(id))
        .select()
        .single();
      if (patientError) throw patientError;

      const {
        status, assigned_doctor_id, notes, historia_number, first_visit_date, 
        marital_status, birthplace, education_level, occupation, ethnicity,
        family_history, personal_history, gynecological_data, obstetric_data,
        consultation_reason, current_illness
      } = patch;
      
      const extrasToMerge: any = {};
      if (status !== undefined) extrasToMerge.status = status;
      if (assigned_doctor_id !== undefined) extrasToMerge.assigned_doctor_id = assigned_doctor_id;
      if (notes !== undefined) extrasToMerge.notes = notes;
      if (historia_number !== undefined) extrasToMerge.historia_number = historia_number;
      if (first_visit_date !== undefined) extrasToMerge.first_visit_date = first_visit_date;
      if (marital_status !== undefined) extrasToMerge.marital_status = marital_status;
      if (birthplace !== undefined) extrasToMerge.birthplace = birthplace;
      if (education_level !== undefined) extrasToMerge.education_level = education_level;
      if (occupation !== undefined) extrasToMerge.occupation = occupation;
      if (ethnicity !== undefined) extrasToMerge.ethnicity = ethnicity;
      if (family_history !== undefined) extrasToMerge.family_history = family_history;
      if (personal_history !== undefined) extrasToMerge.personal_history = personal_history;
      if (gynecological_data !== undefined) extrasToMerge.gynecological_data = gynecological_data;
      if (obstetric_data !== undefined) extrasToMerge.obstetric_data = obstetric_data;
      if (consultation_reason !== undefined) extrasToMerge.consultation_reason = consultation_reason;
      if (current_illness !== undefined) extrasToMerge.current_illness = current_illness;

      const { data: currentHc } = await supabase.from("historias_clinicas").select("*").eq("id_paciente", parseInt(id)).maybeSingle();
      const currentExtras = typeof currentHc?.datos_extras === 'object' && currentHc?.datos_extras !== null ? currentHc.datos_extras : {};
      const newExtras = { ...currentExtras, ...extrasToMerge };

      const { error: hcError, data: hcData } = await supabase
        .from("historias_clinicas")
        .upsert({
          ...(currentHc?.id_historia ? { id_historia: currentHc.id_historia } : {}),
          id_paciente: parseInt(id),
          alergias: patch.personal_history?.allergies !== undefined ? patch.personal_history?.allergies : currentHc?.alergias,
          enfermedades_cronicas: patch.personal_history?.base_pathology !== undefined ? patch.personal_history?.base_pathology : currentHc?.enfermedades_cronicas,
          antecedentes_familiares: patch.family_history?.children !== undefined ? patch.family_history?.children : currentHc?.antecedentes_familiares,
          datos_extras: newExtras
        }, { onConflict: "id_paciente" })
        .select()
        .single();
      
      if (hcError && hcError.code !== '23505') console.error("Error upserting historia clinica", hcError);

      return mapPatient({ ...patientData, historias_clinicas: hcData || currentHc });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["patients"] });
      qc.invalidateQueries({ queryKey: ["patient"] });
      qc.invalidateQueries({ queryKey: ["patients_count"] });
      qc.invalidateQueries({ queryKey: ["patients_paginated"] });
      qc.invalidateQueries({ queryKey: ["patients_recent"] });
    },
  });
}

export function useDeletePatient() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("pacientes").delete().eq("id_paciente", parseInt(id));
      if (error) throw error;

      // Log audit action silently
      await logAuditAction("DELETE", "PATIENT", id, { message: "Paciente eliminado" });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["patients"] });
      qc.invalidateQueries({ queryKey: ["patients_count"] });
      qc.invalidateQueries({ queryKey: ["patients_paginated"] });
      qc.invalidateQueries({ queryKey: ["patients_recent"] });
      qc.invalidateQueries({ queryKey: ["appointments"] });
    },
  });
}
