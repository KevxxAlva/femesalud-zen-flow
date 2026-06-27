import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useRealtimeSync() {
  const queryClient = useQueryClient();

  useEffect(() => {
    // Channel for patients
    const patientsChannel = supabase
      .channel("patients-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "patients" },
        () => {
          queryClient.invalidateQueries({ queryKey: ["patients"] });
          queryClient.invalidateQueries({ queryKey: ["patient"] });
          queryClient.invalidateQueries({ queryKey: ["patients_count"] });
          queryClient.invalidateQueries({ queryKey: ["patients_paginated"] });
          queryClient.invalidateQueries({ queryKey: ["patients_recent"] });
        }
      )
      .subscribe();

    // Channel for appointments
    const appointmentsChannel = supabase
      .channel("appointments-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "appointments" },
        () => {
          queryClient.invalidateQueries({ queryKey: ["appointments"] });
          queryClient.invalidateQueries({ queryKey: ["appointments_growth"] });
          queryClient.invalidateQueries({ queryKey: ["patients_count"] });
          queryClient.invalidateQueries({ queryKey: ["patients_count_range"] });
        }
      )
      .subscribe();

    // Channel for consultations
    const consultationsChannel = supabase
      .channel("consultations-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "consultations" },
        () => {
          queryClient.invalidateQueries({ queryKey: ["consultations"] });
          queryClient.invalidateQueries({ queryKey: ["consultation"] });
          // Invalidate appointments because consultations are joined/checked in appointments
          queryClient.invalidateQueries({ queryKey: ["appointments"] });
        }
      )
      .subscribe();

    // Channel for clinical notes
    const clinicalNotesChannel = supabase
      .channel("clinical-notes-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "clinical_notes" },
        () => {
          queryClient.invalidateQueries({ queryKey: ["clinical_notes"] });
        }
      )
      .subscribe();

    // Channel for prescription templates
    const templatesChannel = supabase
      .channel("templates-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "prescription_templates" },
        () => {
          queryClient.invalidateQueries({ queryKey: ["prescription_templates"] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(patientsChannel);
      supabase.removeChannel(appointmentsChannel);
      supabase.removeChannel(consultationsChannel);
      supabase.removeChannel(clinicalNotesChannel);
      supabase.removeChannel(templatesChannel);
    };
  }, [queryClient]);
}
