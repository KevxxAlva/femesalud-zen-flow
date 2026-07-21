import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type FinancialAccount = {
  id: string;
  name: string;
  type: string;
  balance: number;
  status: "Active" | "Inactive";
};

export function useAccounts() {
  return useQuery({
    queryKey: ["financial_accounts"],
    queryFn: async (): Promise<FinancialAccount[]> => {
      const { data, error } = await supabase
        .from("financial_accounts")
        .select("*")
        .order("created_at", { ascending: true });
        
      if (error) throw error;
      return data as FinancialAccount[];
    },
  });
}

export function useCreateAccount() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (acc: Omit<FinancialAccount, "id">) => {
      const { data, error } = await supabase
        .from("financial_accounts")
        .insert(acc)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["financial_accounts"] });
    },
  });
}

export function useUpdateAccount() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (acc: FinancialAccount) => {
      const { data, error } = await supabase
        .from("financial_accounts")
        .update({
          name: acc.name,
          type: acc.type,
          balance: acc.balance,
          status: acc.status,
        })
        .eq("id", acc.id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["financial_accounts"] });
    },
  });
}

export function useDeleteAccount() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("financial_accounts")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["financial_accounts"] });
    },
  });
}
