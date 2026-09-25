import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface SpecialtyItem {
  id_especialidad: number;
  nombre: string;
}

export interface Service {
  id_servicio: number;
  nombre_servicio: string;
  codigo_medico: string | null;
  descripcion: string | null;
  costo_base: number;
  id_especialidad: number | null;
  especialidades?: SpecialtyItem | null;
}

export type ServiceInsert = Omit<Service, "id_servicio" | "especialidades">;
export type ServiceUpdate = Partial<ServiceInsert>;

export function useSpecialties() {
  return useQuery({
    queryKey: ["specialties"],
    queryFn: async (): Promise<SpecialtyItem[]> => {
      const { data, error } = await supabase
        .from("especialidades")
        .select("id_especialidad, nombre")
        .order("nombre", { ascending: true });

      if (error) {
        console.error("Error cargando especialidades:", error);
        throw error;
      }
      return data ?? [];
    },
  });
}

export function useServices() {
  return useQuery({
    queryKey: ["services"],
    queryFn: async (): Promise<Service[]> => {
      // 1. Fetch all raw services
      const { data: rawServices, error: servError } = await supabase
        .from("servicios")
        .select("*")
        .order("nombre_servicio", { ascending: true });

      if (servError) {
        console.error("Error al cargar los servicios:", servError);
        toast.error("Error al cargar los servicios", { description: servError.message });
        throw servError;
      }

      // 2. Fetch specialties to map names
      const { data: rawSpecialties, error: specError } = await supabase
        .from("especialidades")
        .select("id_especialidad, nombre");

      if (specError) {
        console.warn("Advertencia al cargar especialidades:", specError);
      }

      const specMap = new Map<number, SpecialtyItem>();
      (rawSpecialties || []).forEach((esp) => {
        specMap.set(esp.id_especialidad, esp);
      });

      // 3. Assemble services with their specialty object
      return (rawServices || []).map((s: any) => ({
        ...s,
        especialidades: s.id_especialidad ? specMap.get(s.id_especialidad) || null : null,
      })) as Service[];
    },
  });
}

export function useCreateService() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (service: ServiceInsert) => {
      const { data, error } = await supabase
        .from("servicios")
        .insert(service)
        .select()
        .single();

      if (error) {
        toast.error("Error al crear el servicio", { description: error.message });
        throw error;
      }
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["services"] });
      toast.success("Servicio médico añadido con éxito");
    },
  });
}

export function useUpdateService() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: { id: number; data: ServiceUpdate }) => {
      const { data, error } = await supabase
        .from("servicios")
        .update(params.data)
        .eq("id_servicio", params.id)
        .select()
        .single();

      if (error) {
        toast.error("Error al actualizar el servicio", { description: error.message });
        throw error;
      }
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["services"] });
      toast.success("Servicio médico actualizado con éxito");
    },
  });
}

export function useDeleteService() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      const { error } = await supabase.from("servicios").delete().eq("id_servicio", id);
      if (error) {
        toast.error("Error al eliminar el servicio", { description: error.message });
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["services"] });
      toast.success("Servicio médico eliminado con éxito");
    },
  });
}
