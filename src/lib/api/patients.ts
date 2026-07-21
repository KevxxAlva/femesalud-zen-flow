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

// Helper to map DB record to Patient interface
const mapPatient = (p: any): Patient => ({
  id: p.id_paciente.toString(),
  full_name: `${p.nombre} ${p.apellido}`,
  email: p.email,
  phone: p.telefono,
  birth_date: p.fecha_nacimiento,
  address: p.direccion,
  status: "activo", // Defaulting since we didn't add it to DB yet
  assigned_doctor_id: null,
  notes: null,
  created_at: p.creado_en || new Date().toISOString(),
  updated_at: p.creado_en || new Date().toISOString(),
  document_id: p.documento_identidad,
  historia_number: p.historias_clinicas?.[0]?.id_historia?.toString() || null,
  first_visit_date: null,
  marital_status: null,
  birthplace: null,
  education_level: null,
  occupation: null,
  ethnicity: null,
  family_history: {
    mother: null,
    father: null,
    siblings: null,
    children: p.historias_clinicas?.[0]?.antecedentes_familiares || null,
  },
  personal_history: {
    alcohol: null,
    drugs: null,
    tobacco: null,
    base_pathology: p.historias_clinicas?.[0]?.enfermedades_cronicas || null,
    surgical: null,
    allergies: p.historias_clinicas?.[0]?.alergias || null,
  },
  gynecological_data: null,
  obstetric_data: null,
  consultation_reason: null,
  current_illness: null,
});

export function usePatients() {
  return useQuery({
    queryKey: ["patients"],
    queryFn: async (): Promise<Patient[]> => {
      const { data, error } = await supabase
        .from("pacientes")
        .select("id_paciente, nombre, apellido, email, telefono, creado_en, documento_identidad, historias_clinicas(id_historia)")
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
        .select("id_paciente, nombre, apellido, email, telefono, creado_en, documento_identidad, historias_clinicas(id_historia)")
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
        .select("id_paciente, nombre, apellido, email, telefono, creado_en, documento_identidad, historias_clinicas(id_historia)", { count: "exact" })
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

      const { error, data } = await supabase
        .from("pacientes")
        .insert({ 
          nombre, 
          apellido, 
          email: input.email, 
          telefono: input.phone,
          documento_identidad: input.document_id || Math.random().toString().slice(2, 10),
          fecha_nacimiento: input.birth_date
        })
        .select()
        .single();
      if (error) throw error;
      return mapPatient(data);
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

      const { error, data } = await supabase.from("pacientes").update(updateData).eq("id_paciente", parseInt(id)).select().single();
      if (error) throw error;
      return mapPatient(data);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["patients"] });
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
