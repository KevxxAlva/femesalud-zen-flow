import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

// Mapping between DB tables and their corresponding React Query keys.
const TABLE_TO_QUERY_KEYS: Record<string, string[][]> = {
  pacientes: [["patients"], ["patients_count"], ["patients_paginated"], ["patients_recent"]],
  citas: [["appointments"]],
  consultas: [["consultations"], ["consultation"]],
  historias_clinicas: [["clinical_notes"]],
  servicios: [["services"]],
  facturas: [["monthly_payments"], ["dashboard_stats"]],
  pagos: [["monthly_payments"], ["dashboard_stats"]],
  clinic_info: [["clinic_info"]],
  financial_purchases: [["financial_accounts"], ["dashboard_stats"]],
  inventory_stocks: [["inventory_stocks"]],
  financial_accounts: [["financial_accounts"]],
  inventory_peripherals: [["inventory_peripherals"]],
  medicos: [["doctors"]],
  usuarios: [["users"]]
};

export function useRealtimeSync() {
  const queryClient = useQueryClient();

  useEffect(() => {
    // Escuchar cambios globales en toda la base de datos (schema 'public')
    const channel = supabase
      .channel('schema-db-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public' },
        (payload) => {
          const table = payload.table;

          // Encontrar las keys a invalidar según la tabla modificada
          const queryKeys = TABLE_TO_QUERY_KEYS[table];

          if (queryKeys && queryKeys.length > 0) {
            queryKeys.forEach((key) => {
              // Invalidar el query en react-query para que haga refetch automáticamente en background
              queryClient.invalidateQueries({ queryKey: key });
            });
          } else {
             // Fallback si no está explícitamente definida: invalidar el nombre de la tabla
             queryClient.invalidateQueries({ queryKey: [table] });
          }
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('[Realtime] Conectado a Supabase exitosamente.');
        }
      });

    // Cleanup: desuscribirse cuando se desmonte el layout para no duplicar escuchas
    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);
}
