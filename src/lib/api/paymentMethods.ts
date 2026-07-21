import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type PaymentMethod = {
  id: string;
  name: string;
  category: string;
  status: "Active" | "Inactive";
};

export function usePaymentMethods() {
  return useQuery({
    queryKey: ["payment_methods"],
    queryFn: async (): Promise<PaymentMethod[]> => {
      const { data, error } = await supabase
        .from("payment_methods")
        .select("*")
        .order("created_at", { ascending: true });
        
      if (error) throw error;
      return data as PaymentMethod[];
    },
  });
}

export function useCreatePaymentMethod() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (method: Omit<PaymentMethod, "id">) => {
      const { data, error } = await supabase
        .from("payment_methods")
        .insert(method)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["payment_methods"] });
    },
  });
}

export function useUpdatePaymentMethod() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (method: PaymentMethod) => {
      const { data, error } = await supabase
        .from("payment_methods")
        .update({
          name: method.name,
          category: method.category,
          status: method.status,
        })
        .eq("id", method.id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["payment_methods"] });
    },
  });
}

export function useDeletePaymentMethod() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("payment_methods")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["payment_methods"] });
    },
  });
}
