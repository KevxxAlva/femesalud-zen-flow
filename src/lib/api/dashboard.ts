import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

// Helper to get dates for the last 7 days (including today)
const getLast7Days = () => {
  const dates = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    dates.push(d.toISOString().split("T")[0]);
  }
  return dates;
};

export function useDashboardStats() {
  return useQuery({
    queryKey: ["dashboard_stats"],
    queryFn: async () => {
      const dates = getLast7Days();
      const todayStr = dates[6];
      const yesterdayStr = dates[5];
      const sevenDaysAgo = dates[0];

      // Fetch Appointments (citas) for the last 7 days
      const { data: citasData } = await supabase
        .from("citas")
        .select("fecha_hora, estado")
        .gte("fecha_hora", `${sevenDaysAgo}T00:00:00.000Z`);

      // Fetch Labs (examenes_laboratorio) for the last 7 days
      // examenes_laboratorio doesn't have a reliable date field in the schema snippet besides fecha_resultado,
      // but let's assume fecha_resultado is what we use, or we just fetch all and filter if it's missing.
      const { data: labsData } = await supabase
        .from("examenes_laboratorio")
        .select("fecha_resultado");

      // Fetch Invoices (facturas) for the last 7 days
      const { data: invoicesData } = await supabase
        .from("facturas")
        .select("fecha_emision, estado_pago")
        .gte("fecha_emision", `${sevenDaysAgo}T00:00:00.000Z`);

      const citas = citasData || [];
      const labs = labsData || [];
      const invoices = invoicesData || [];

      // Helper to count by day
      const countByDay = (items: any[], dateField: string) => {
        return dates.map(date => {
          return items.filter(item => item[dateField] && item[dateField].startsWith(date)).length;
        });
      };

      const citasByDay = countByDay(citas, "fecha_hora");
      const labsByDay = countByDay(labs, "fecha_resultado");
      const invoicesByDay = countByDay(invoices, "fecha_emision");

      const getChange = (today: number, yesterday: number) => {
        if (yesterday === 0) return today > 0 ? 100 : 0;
        return Math.round(((today - yesterday) / yesterday) * 100);
      };

      // OFFLINE WORK (All Appointments)
      const offlineToday = citasByDay[6];
      const offlineYesterday = citasByDay[5];
      const offlineChange = getChange(offlineToday, offlineYesterday);

      // ONLINE WORK (Simulated as 15% of offline work for visual purposes until schema is updated)
      const onlineByDay = citasByDay.map(c => Math.ceil(c * 0.15));
      const onlineToday = onlineByDay[6];
      const onlineYesterday = onlineByDay[5];
      const onlineChange = getChange(onlineToday, onlineYesterday);

      // LAB WORK
      const labToday = labsByDay[6];
      const labYesterday = labsByDay[5];
      const labChange = getChange(labToday, labYesterday);

      // SCHEDULED EVENTS (Today's counts)
      const totalScheduled = offlineToday + labToday + invoicesByDay[6];
      const scheduledEvents = {
        consultations: offlineToday,
        labs: labToday,
        invoices: invoicesByDay[6],
        donutPercentage: totalScheduled > 0 ? 100 : 0 // Simply showing 100% of today's work if there is any
      };

      // PLANS DONE (Completed vs Scheduled for today)
      const citasTodayCompleted = citas.filter(c => c.fecha_hora.startsWith(todayStr) && c.estado === "completada").length;
      const invoicesTodayPaid = invoices.filter(i => i.fecha_emision?.startsWith(todayStr) && (i.estado_pago === "pagado" || i.estado_pago === "Paid")).length;
      
      const plansDone = {
        consultations: offlineToday > 0 ? Math.round((citasTodayCompleted / offlineToday) * 100) : 0,
        labs: labToday > 0 ? 100 : 0, // Mocked to 100% since labs don't have 'status' yet
        invoices: invoicesByDay[6] > 0 ? Math.round((invoicesTodayPaid / invoicesByDay[6]) * 100) : 0,
      };

      return {
        offlineWork: {
          total: offlineToday,
          change: offlineChange,
          sparkline: citasByDay,
        },
        onlineWork: {
          total: onlineToday,
          change: onlineChange,
          sparkline: onlineByDay,
        },
        labWork: {
          total: labToday,
          change: labChange,
          sparkline: labsByDay,
        },
        scheduledEvents,
        plansDone
      };
    }
  });
}

export function useMonthlyPayments() {
  return useQuery({
    queryKey: ["monthly_payments"],
    queryFn: async () => {
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const { data, error } = await supabase
        .from("facturas")
        .select("total_general, estado_pago")
        .gte("fecha_emision", startOfMonth.toISOString());
        
      if (error) throw error;
      
      const paidInvoices = (data || []).filter(i => i.estado_pago === "pagado" || i.estado_pago === "Paid");
      const total = paidInvoices.reduce((sum, f) => sum + (Number(f.total_general) || 0), 0);
      return total;
    }
  });
}
