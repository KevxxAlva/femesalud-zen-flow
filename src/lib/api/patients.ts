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
        .select("id, full_name, email, phone, status, assigned_doctor_id, created_at, updated_at, document_id, historia_number, birth_date")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data as any) as Patient[];
    },
  });
}

export function usePatientCount() {
  return useQuery({
    queryKey: ["patients_count"],
    queryFn: async (): Promise<number> => {
      const { count, error } = await supabase
        .from("patients")
        .select("id", { count: "exact", head: true });
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
        .from("patients")
        .select("created_at")
        .gte("created_at", fourteenDaysAgo.toISOString());
      if (error) throw error;
      return (data as any) || [];
    },
  });
}

export function usePatientsCountByDateRange(from?: string, to?: string) {
  return useQuery({
    queryKey: ["patients_count_range", from, to],
    queryFn: async (): Promise<number> => {
      let query = supabase
        .from("patients")
        .select("id", { count: "exact", head: true });
      if (from) {
        query = query.gte("created_at", from);
      }
      if (to) {
        query = query.lte("created_at", to + "T23:59:59.999Z");
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
        .from("patients")
        .select("id, full_name, email, phone, status, assigned_doctor_id, created_at, updated_at, document_id, historia_number")
        .order("updated_at", { ascending: false })
        .limit(limit);
      if (error) throw error;
      return (data as any) as Patient[];
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
        .from("patients")
        .select("id, full_name, email, phone, status, assigned_doctor_id, created_at, updated_at, document_id, historia_number, birth_date", { count: "exact" })
        .order("created_at", { ascending: false })
        .range(from, to);

      if (search) {
        query = query.or(
          `full_name.ilike.%${search}%,email.ilike.%${search}%,document_id.ilike.%${search}%`
        );
      }

      if (status) {
        query = query.eq("status", status);
      }

      const { data, error, count } = await query;
      if (error) throw error;
      return { data: (data as any) as Patient[], count: count ?? 0 };
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
      // Validate uniqueness
      if (input.document_id) {
        const { data: existingDocs } = await supabase
          .from("patients")
          .select("id")
          .eq("document_id", input.document_id);
        if (existingDocs && existingDocs.length > 0) {
          throw new Error("Ya existe un paciente con este mismo número de cédula/pasaporte.");
        }
      }

      if (input.full_name) {
        const { data: existingNames } = await supabase
          .from("patients")
          .select("id")
          .ilike("full_name", input.full_name.trim());
        if (existingNames && existingNames.length > 0) {
          throw new Error("Ya existe un paciente registrado con este mismo nombre completo.");
        }
      }

      const { data: user } = await supabase.auth.getUser();
      const { error, data } = await supabase
        .from("patients")
        .insert({ ...input, created_by: user.user?.id })
        .select()
        .single();
      if (error) throw error;
      return (data as any) as Patient;
    },
    onMutate: async (newPatient) => {
      await qc.cancelQueries({ queryKey: ["patients_paginated"] });
      await qc.cancelQueries({ queryKey: ["patients_recent"] });
      const previousPaginated = qc.getQueriesData({ queryKey: ["patients_paginated"] });
      const previousRecent = qc.getQueriesData({ queryKey: ["patients_recent"] });
      
      const tempId = crypto.randomUUID();
      const optimisticPatient = {
        id: tempId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        status: newPatient.status || "nuevo",
        ...newPatient,
      } as Patient;

      qc.setQueriesData({ queryKey: ["patients_paginated"] }, (old: any) => {
        if (!old) return old;
        return { ...old, data: [optimisticPatient, ...old.data], count: old.count + 1 };
      });
      qc.setQueriesData({ queryKey: ["patients_recent"] }, (old: any) => {
        if (!old) return old;
        return [optimisticPatient, ...old].slice(0, 5);
      });

      return { previousPaginated, previousRecent };
    },
    onError: (err, newPatient, context: any) => {
      if (context?.previousPaginated) {
        context.previousPaginated.forEach(([queryKey, data]: any) => qc.setQueryData(queryKey, data));
      }
      if (context?.previousRecent) {
        context.previousRecent.forEach(([queryKey, data]: any) => qc.setQueryData(queryKey, data));
      }
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ["patients"] });
      qc.invalidateQueries({ queryKey: ["patient"] });
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
      // Validate uniqueness
      if (patch.document_id) {
        const { data: existingDocs } = await supabase
          .from("patients")
          .select("id")
          .eq("document_id", patch.document_id)
          .neq("id", id);
        if (existingDocs && existingDocs.length > 0) {
          throw new Error("Ya existe otro paciente con este mismo número de cédula/pasaporte.");
        }
      }

      if (patch.full_name) {
        const { data: existingNames } = await supabase
          .from("patients")
          .select("id")
          .ilike("full_name", patch.full_name.trim())
          .neq("id", id);
        if (existingNames && existingNames.length > 0) {
          throw new Error("Ya existe otro paciente registrado con este mismo nombre completo.");
        }
      }

      const { error, data } = await supabase.from("patients").update(patch).eq("id", id).select().single();
      if (error) throw error;
      return (data as any) as Patient;
    },
    onMutate: async (updatedPatient) => {
      await qc.cancelQueries({ queryKey: ["patients_paginated"] });
      await qc.cancelQueries({ queryKey: ["patients_recent"] });
      await qc.cancelQueries({ queryKey: ["patient", updatedPatient.id] });
      
      const previousPaginated = qc.getQueriesData({ queryKey: ["patients_paginated"] });
      const previousRecent = qc.getQueriesData({ queryKey: ["patients_recent"] });
      const previousPatient = qc.getQueryData(["patient", updatedPatient.id]);

      qc.setQueriesData({ queryKey: ["patients_paginated"] }, (old: any) => {
        if (!old) return old;
        return {
          ...old,
          data: old.data.map((p: any) => (p.id === updatedPatient.id ? { ...p, ...updatedPatient } : p)),
        };
      });
      qc.setQueriesData({ queryKey: ["patients_recent"] }, (old: any) => {
        if (!old) return old;
        return old.map((p: any) => (p.id === updatedPatient.id ? { ...p, ...updatedPatient } : p));
      });
      if (previousPatient) {
        qc.setQueryData(["patient", updatedPatient.id], { ...(previousPatient as any), ...updatedPatient });
      }

      return { previousPaginated, previousRecent, previousPatient };
    },
    onError: (err, updatedPatient, context: any) => {
      if (context?.previousPaginated) {
        context.previousPaginated.forEach(([queryKey, data]: any) => qc.setQueryData(queryKey, data));
      }
      if (context?.previousRecent) {
        context.previousRecent.forEach(([queryKey, data]: any) => qc.setQueryData(queryKey, data));
      }
      if (context?.previousPatient) {
        qc.setQueryData(["patient", updatedPatient.id], context.previousPatient);
      }
    },
    onSettled: (data, error, variables) => {
      qc.invalidateQueries({ queryKey: ["patients"] });
      qc.invalidateQueries({ queryKey: ["patient", variables.id] });
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
      const { error } = await supabase.from("patients").delete().eq("id", id);
      if (error) throw error;
    },
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: ["patients_paginated"] });
      await qc.cancelQueries({ queryKey: ["patients_recent"] });
      
      const previousPaginated = qc.getQueriesData({ queryKey: ["patients_paginated"] });
      const previousRecent = qc.getQueriesData({ queryKey: ["patients_recent"] });

      qc.setQueriesData({ queryKey: ["patients_paginated"] }, (old: any) => {
        if (!old) return old;
        return {
          ...old,
          data: old.data.filter((p: any) => p.id !== id),
          count: old.count - 1,
        };
      });
      qc.setQueriesData({ queryKey: ["patients_recent"] }, (old: any) => {
        if (!old) return old;
        return old.filter((p: any) => p.id !== id);
      });

      return { previousPaginated, previousRecent };
    },
    onError: (err, id, context: any) => {
      if (context?.previousPaginated) {
        context.previousPaginated.forEach(([queryKey, data]: any) => qc.setQueryData(queryKey, data));
      }
      if (context?.previousRecent) {
        context.previousRecent.forEach(([queryKey, data]: any) => qc.setQueryData(queryKey, data));
      }
    },
    onSettled: (data, error, id) => {
      qc.invalidateQueries({ queryKey: ["patients"] });
      qc.invalidateQueries({ queryKey: ["patient", id] });
      qc.invalidateQueries({ queryKey: ["patients_count"] });
      qc.invalidateQueries({ queryKey: ["patients_paginated"] });
      qc.invalidateQueries({ queryKey: ["patients_recent"] });
      qc.invalidateQueries({ queryKey: ["appointments"] });
    },
  });
}
