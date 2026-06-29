import { CalendarClock } from "lucide-react";
import type { AppointmentWithPatient } from "@/lib/api/appointments";

interface ReportsPlanificacionTableProps {
  upcoming: AppointmentWithPatient[];
  doctorMap: Map<string, string>;
}

export function ReportsPlanificacionTable({ upcoming, doctorMap }: ReportsPlanificacionTableProps) {
  return (
    <div className="rounded-3xl glass-card p-6 shadow-sm border border-border/40">
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Planificación</p>
          <h3 className="mt-1 text-base font-semibold flex items-center gap-2">
            <CalendarClock className="h-5 w-5 text-mauve" /> Próximas citas ({upcoming.length})
          </h3>
        </div>
      </div>
      <div className="overflow-hidden rounded-2xl border border-border/60">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-left text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-4 py-2.5 whitespace-nowrap">Fecha / Hora</th>
                <th className="px-4 py-2.5 whitespace-nowrap">Paciente</th>
                <th className="px-4 py-2.5 whitespace-nowrap">Médico</th>
                <th className="px-4 py-2.5 whitespace-nowrap">Motivo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {upcoming.slice(0, 10).map((a) => {
                const dt = new Date(a.scheduled_at);
                const pad = (n: number) => String(n).padStart(2, "0");
                return (
                  <tr key={a.id} className="hover:bg-muted/30">
                    <td className="px-4 py-3 text-xs">
                      {dt.toLocaleDateString("es-ES", { day: "2-digit", month: "short" })} · {pad(dt.getHours())}:{pad(dt.getMinutes())}
                    </td>
                    <td className="px-4 py-3 font-semibold">{a.patient_name}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{doctorMap.get(a.doctor_id) ?? "—"}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{a.reason ?? "—"}</td>
                  </tr>
                );
              })}
              {upcoming.length === 0 && (
                <tr><td colSpan={4} className="px-4 py-6 text-center text-xs text-muted-foreground">No hay citas próximas programadas.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
