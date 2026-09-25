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
    queryFn: async () => {
      const { data, error } = await supabase
        .from("servicios")
        .select("*, especialidades(id_especialidad, nombre)")
        .order("nombre_servicio", { ascending: true });

      if (error) {
        toast.error("Error al cargar los servicios", { description: error.message });
        throw error;
      }
      return (data ?? []) as unknown as Service[];
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
        .select("*, especialidades(id_especialidad, nombre)")
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
        .select("*, especialidades(id_especialidad, nombre)")
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
