import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Database } from "@/integrations/supabase/types";

export type Service = Database["public"]["Tables"]["servicios"]["Row"];
export type ServiceInsert = Database["public"]["Tables"]["servicios"]["Insert"];
export type ServiceUpdate = Database["public"]["Tables"]["servicios"]["Update"];

export function useServices() {
  return useQuery({
    queryKey: ["services"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("servicios")
        .select("*")
        .order("nombre_servicio", { ascending: true });

      if (error) {
        toast.error("Error loading treatments", { description: error.message });
        throw error;
      }
      return data as Service[];
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
        toast.error("Error creating treatment", { description: error.message });
        throw error;
      }
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["services"] });
      toast.success("Treatment added successfully");
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
        toast.error("Error updating treatment", { description: error.message });
        throw error;
      }
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["services"] });
      toast.success("Treatment updated successfully");
    },
  });
}

export function useDeleteService() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      const { error } = await supabase.from("servicios").delete().eq("id_servicio", id);
      if (error) {
        toast.error("Error deleting treatment", { description: error.message });
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["services"] });
      toast.success("Treatment deleted successfully");
    },
  });
}
