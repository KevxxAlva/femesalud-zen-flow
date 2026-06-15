import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface ClinicInfo {
  id: number;
  name: string;
  address_line1: string;
  address_line2: string;
  phone: string;
  rif: string;
  updated_at: string;
}

export function useClinicInfo() {
  return useQuery({
    queryKey: ["clinic_info"],
    queryFn: async (): Promise<ClinicInfo> => {
      const { data, error } = await supabase
        .from("clinic_info")
        .select("*")
        .eq("id", 1)
        .single();
      if (error) throw error;
      return data;
    },
  });
}

export function useUpdateClinicInfo() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (info: Partial<Omit<ClinicInfo, "id" | "updated_at">>) => {
      const { error } = await supabase
        .from("clinic_info")
        .update({
          ...info,
          updated_at: new Date().toISOString(),
        })
        .eq("id", 1);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["clinic_info"] });
    },
  });
}
