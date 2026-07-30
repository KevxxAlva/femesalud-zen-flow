import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { logAuditAction } from "@/lib/api/audit";

export type AppointmentStatus = "programada" | "completada" | "cancelada" | "no_asistio";

export interface Appointment {
  id: string;
  patient_id: string;
  doctor_id: string;
  scheduled_at: string;
  duration_minutes: number;
  status: string;
  reason: string | null;
  notes: string | null;
  price: number | null;
  payment_method: string | null;
  payment_reference: string | null;
  created_at: string;
  updated_at: string;
}

export interface AppointmentWithPatient extends Appointment {
  patient_name?: string;
  has_consultation?: boolean;
}

export type AppointmentInput = {
  patient_id: string;
  doctor_id: string;
  scheduled_at: string;
  duration_minutes?: number;
  status?: string;
  reason?: string | null;
  notes?: string | null;
  price?: number | null;
  payment_method?: string | null;
  payment_reference?: string | null;
};

export interface AppointmentFilters {
  from?: string;
  to?: string;
  status?: string;
  limit?: number;
}

export function useAppointments(filters?: AppointmentFilters) {
  const queryKey = filters ? ["appointments", filters] : ["appointments"];
  return useQuery({
    queryKey,
    queryFn: async (): Promise<AppointmentWithPatient[]> => {
      let query = supabase
        .from("citas")
        .select(`
          id_cita, 
          id_paciente, 
          id_medico, 
          fecha_hora, 
          estado, 
          motivo, 
          pacientes(nombre, apellido), 
          consultas(id_consulta)
        `)
        .order("fecha_hora", { ascending: false });

      if (filters?.from) {
        query = query.gte("fecha_hora", filters.from);
      }
      if (filters?.to) {
        query = query.lte("fecha_hora", filters.to + "T23:59:59.999Z");
      }
      if (filters?.status) {
        query = query.eq("estado", filters.status);
      }
      if (filters?.limit) {
        query = query.limit(filters.limit);
      }

      const { data, error } = await query;
      if (error) throw error;
      
      const results = data ?? [];
      const patientIds = [...new Set(results.map((a: any) => a.id_paciente).filter(Boolean))];
      let facturas: any[] = [];
      
      if (patientIds.length > 0) {
        const { data: fData } = await supabase
          .from("facturas")
          .select("id_factura, id_paciente, total_general, estado_pago, fecha_emision")
          .in("id_paciente", patientIds);
        facturas = fData || [];
      }
      
      return results.map((a: any) => {
        const citaDate = a.fecha_hora.split('T')[0];
        const f = facturas.find(fac => fac.id_paciente === a.id_paciente && (fac.fecha_emision || "").startsWith(citaDate));
        
        return {
          id: a.id_cita.toString(),
          patient_id: a.id_paciente?.toString() || "",
          doctor_id: a.id_medico?.toString() || "",
          scheduled_at: a.fecha_hora,
          duration_minutes: 30, // mock duration
          status: a.estado?.toLowerCase() || "programada",
          reason: a.motivo,
          notes: null,
          price: f ? f.total_general : null,
          payment_method: f?.estado_pago === 'Pagada' ? 'Pagado' : null,
          payment_reference: null,
          created_at: a.fecha_hora,
          updated_at: a.fecha_hora,
          patient_name: a.pacientes ? `${a.pacientes.nombre} ${a.pacientes.apellido}` : "—",
          has_consultation: !!a.consultas && a.consultas.length > 0,
        };
      });
    },
  });
}

export function useCreateAppointment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: AppointmentInput) => {
      const { error, data: citaData } = await supabase
        .from("citas")
        .insert({ 
          id_paciente: parseInt(input.patient_id),
          id_medico: parseInt(input.doctor_id),
          fecha_hora: input.scheduled_at,
          motivo: input.reason,
          estado: input.status || 'Programada'
        })
        .select()
        .single();
        
      if (error) throw error;
      
      return citaData;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["appointments"] }),
  });
}

export function useUpdateAppointment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...patch }: Partial<AppointmentInput> & { id: string }) => {
      const idCita = parseInt(id);

      // Fetch existing cita to get patient_id if needed for Facturas
      const { data: existingCita } = await supabase.from("citas").select("id_paciente").eq("id_cita", idCita).single();

      // 1. Update Citas table
      const updateData: any = {};
      if (patch.scheduled_at) updateData.fecha_hora = patch.scheduled_at;
      if (patch.reason) updateData.motivo = patch.reason;
      if (patch.status) updateData.estado = patch.status;
      if (patch.patient_id) updateData.id_paciente = parseInt(patch.patient_id);
      if (patch.doctor_id) updateData.id_medico = parseInt(patch.doctor_id);

      if (Object.keys(updateData).length > 0) {
        const { error } = await supabase.from("citas").update(updateData).eq("id_cita", idCita);
        if (error) throw error;
      }

      // 2. Handle Facturas and Pagos
      if (patch.price !== undefined || patch.payment_method !== undefined || patch.status !== undefined) {
        let facturaId;
        
        // Since id_cita is gone from facturas, we'll try to find an invoice for this patient today
        const today = new Date().toISOString().split('T')[0];
        const { data: existFList } = await supabase
          .from("facturas")
          .select("id_factura, total_general")
          .eq("id_paciente", existingCita?.id_paciente || 0)
          .gte("fecha_emision", today)
          .order("id_factura", { ascending: false })
          .limit(1);
          
        const existF = existFList?.[0] || null;
        
        let targetPrice = patch.price !== undefined && patch.price !== null ? patch.price : (existF ? existF.total_general : 0);
        let fEstado = patch.status === 'completada' ? (patch.payment_method ? 'Pagada' : 'Pendiente') : 'Pendiente';
        if (patch.status === 'cancelada') fEstado = 'Cancelada';

        if (existF) {
          facturaId = existF.id_factura;
          await supabase.from("facturas").update({ 
             total_general: targetPrice, 
             subtotal: targetPrice,
             monto_paciente: targetPrice,
             estado_pago: fEstado 
          }).eq("id_factura", facturaId);
        } else {
          // Only create if price > 0, or payment is attempted, or appointment is completed
          if (targetPrice > 0 || patch.payment_method || patch.status === 'completada') {
            const { data: newF, error: newFError } = await supabase.from("facturas").insert({
              id_paciente: existingCita?.id_paciente,
              total_general: targetPrice,
              subtotal: targetPrice,
              monto_paciente: targetPrice,
              estado_pago: fEstado,
              fecha_emision: new Date().toISOString()
            }).select("id_factura").single();
            if (newFError) throw newFError;
            facturaId = newF?.id_factura;
          }
        }

        // 3. Handle Pagos
        if (facturaId && patch.payment_method) {
           const { data: existP } = await supabase.from("pagos").select("id_pago, monto, metodo_pago").eq("id_factura", facturaId).maybeSingle();
           
           // Fetch the payment method to get its account_id
           const { data: pm } = await supabase.from("payment_methods").select("account_id").eq("name", patch.payment_method).maybeSingle();
           const newAccountId = pm?.account_id;

           if (existP) {
              // Revert old account balance if it was a different method or different amount
              let oldAccountId = null;
              if (existP.metodo_pago !== patch.payment_method) {
                 const { data: oldPm } = await supabase.from("payment_methods").select("account_id").eq("name", existP.metodo_pago).maybeSingle();
                 oldAccountId = oldPm?.account_id;
              } else {
                 oldAccountId = newAccountId;
              }

              if (oldAccountId) {
                 const { data: oldAcc } = await supabase.from("financial_accounts").select("balance").eq("id", oldAccountId).maybeSingle();
                 if (oldAcc) {
                    await supabase.from("financial_accounts").update({ balance: oldAcc.balance - (existP.monto || 0) }).eq("id", oldAccountId);
                 }
              }

              // Add to new account balance
              if (newAccountId) {
                 const { data: newAcc } = await supabase.from("financial_accounts").select("balance").eq("id", newAccountId).maybeSingle();
                 if (newAcc) {
                    await supabase.from("financial_accounts").update({ balance: newAcc.balance + targetPrice }).eq("id", newAccountId);
                 }
              }

              await supabase.from("pagos").update({ 
                metodo_pago: patch.payment_method, 
                referencia: patch.payment_reference || null,
                monto: targetPrice
              }).eq("id_pago", existP.id_pago);
           } else {
              // Add to new account balance
              if (newAccountId) {
                 const { data: newAcc } = await supabase.from("financial_accounts").select("balance").eq("id", newAccountId).maybeSingle();
                 if (newAcc) {
                    await supabase.from("financial_accounts").update({ balance: newAcc.balance + targetPrice }).eq("id", newAccountId);
                 }
              }

              await supabase.from("pagos").insert({
                id_factura: facturaId,
                metodo_pago: patch.payment_method,
                referencia: patch.payment_reference || null,
                monto: targetPrice
              });
           }
        }
      }
      
      return { id };
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["appointments"] });
      qc.invalidateQueries({ queryKey: ["financial_accounts"] });
    },
  });
}

export function useDeleteAppointment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      // Delete related consultas first to avoid foreign key constraint
      await supabase.from("consultas").delete().eq("id_cita", parseInt(id));

      const { error } = await supabase.from("citas").delete().eq("id_cita", parseInt(id));
      if (error) throw error;

      // Log audit action silently
      await logAuditAction("DELETE", "APPOINTMENT", id, { message: "Cita eliminada" });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["appointments"] }),
  });
}
