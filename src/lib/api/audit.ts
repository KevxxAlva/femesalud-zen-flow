import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export type AuditLog = {
  id: string;
  action_type: string;
  entity_type: string;
  entity_id: string;
  user_id: string;
  details: any;
  created_at: string;
};

// API to log an action manually
export async function logAuditAction(
  actionType: string,
  entityType: string,
  entityId: string,
  details: any = {}
) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase
      .from("audit_logs")
      .insert({
        action_type: actionType,
        entity_type: entityType,
        entity_id: String(entityId),
        user_id: user.id,
        details: details,
      })
      .select()
      .single();

    if (error) {
      console.error("Audit Log Error:", error);
      return null;
    }
    return data;
  } catch (error) {
    console.error("Audit Log Exception:", error);
    return null;
  }
}

// Hook to fetch logs for admin
export function useAuditLogs(limit = 100) {
  return useQuery({
    queryKey: ["audit_logs", limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("audit_logs")
        .select(`
          *,
          perfiles:user_id (full_name, email)
        `)
        .order("created_at", { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data;
    },
  });
}
