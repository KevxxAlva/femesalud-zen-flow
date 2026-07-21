import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type Peripheral = {
  id: string;
  name: string;
  assigned_to: string;
  condition: "Good" | "Needs Repair" | "Replaced";
};

export function usePeripherals() {
  return useQuery({
    queryKey: ["inventory_peripherals"],
    queryFn: async (): Promise<Peripheral[]> => {
      const { data, error } = await supabase
        .from("inventory_peripherals")
        .select("*")
        .order("created_at", { ascending: true });
        
      if (error) throw error;
      return data as Peripheral[];
    },
  });
}

export function useCreatePeripheral() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (item: Omit<Peripheral, "id">) => {
      const { data, error } = await supabase
        .from("inventory_peripherals")
        .insert(item)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["inventory_peripherals"] });
    },
  });
}

export function useUpdatePeripheral() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (item: Peripheral) => {
      const { data, error } = await supabase
        .from("inventory_peripherals")
        .update({
          name: item.name,
          assigned_to: item.assigned_to,
          condition: item.condition,
        })
        .eq("id", item.id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["inventory_peripherals"] });
    },
  });
}

export function useDeletePeripheral() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("inventory_peripherals")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["inventory_peripherals"] });
    },
  });
}
