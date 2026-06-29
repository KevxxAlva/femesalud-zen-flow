import { Plus, Clock, Stethoscope, Pencil, Calendar as CalIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { EmptyState } from "@/components/ui/empty-state";
import { type AppointmentWithPatient } from "@/lib/api/appointments";
import { formatToYMD, timeOnly } from "../AgendaUtils";

interface AgendaWeekViewProps {
  weekDays: Date[];
  today: string;
  appointmentsByDateMap: Map<string, AppointmentWithPatient[]>;
  doctorMap: Map<string, string>;
  onAddAppointment: (ymd: string) => void;
  onEdit: (a: AppointmentWithPatient) => void;
  onViewConsultation: (a: AppointmentWithPatient) => void;
}

export function AgendaWeekView({
  weekDays,
  today,
  appointmentsByDateMap,
  doctorMap,
  onAddAppointment,
  onEdit,
  onViewConsultation,
}: AgendaWeekViewProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-7 gap-3">
      {weekDays.map((day, idx) => {
        const ymd = formatToYMD(day);
        const dayAppointments = appointmentsByDateMap.get(ymd) || [];
        const isToday = today === ymd;

        return (
          <div
            key={idx}
            className={cn(
              "rounded-3xl border p-4 flex flex-col gap-3 min-h-[350px] transition-all duration-300",
              isToday ? "bg-card border-mauve ring-2 ring-mauve/10 shadow-md" : "bg-card/40 border-border/60",
            )}
          >
            <div className="flex items-center justify-between pb-2 border-b border-border/40">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  {day.toLocaleDateString("es-ES", { weekday: "short" })}
                </p>
                <h4 className="font-display text-sm md:text-base font-bold tracking-tight mt-0.5">
                  {day.getDate()} {day.toLocaleDateString("es-ES", { month: "short" })}
                </h4>
              </div>
              <button
                onClick={() => onAddAppointment(ymd)}
                className="flex h-7 w-7 items-center justify-center rounded-xl bg-muted/80 hover:bg-muted text-muted-foreground transition border border-border/20"
              >
                <Plus className="h-3.5 w-3.5" />
              </button>
            </div>

            <div className="p-4 pt-10 min-h-[150px]">
              {dayAppointments.length === 0 ? (
                <EmptyState icon={CalIcon} title="Día libre" description="" className="min-h-[120px] p-4 bg-transparent border-none" />
              ) : (
                dayAppointments.map((a) => (
                  <div
                    key={a.id}
                    className={cn(
                      "group relative flex flex-col gap-1 p-2 rounded-2xl border text-[11px] transition duration-200 hover:shadow-sm cursor-pointer mb-2",
                      a.status === "programada" ? "bg-mauve/10 border-mauve/30 text-mauve-foreground hover:bg-mauve/15" : "",
                      a.status === "completada" ? "bg-sage/15 border-sage/30 text-sage-foreground hover:bg-sage/20" : "",
                      a.status === "cancelada" ? "bg-destructive/10 border-destructive/30 text-destructive hover:bg-destructive/15" : ""
                    )}
                    onClick={() => onEdit(a)}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold flex items-center gap-1 text-[10px]">
                        <Clock className="h-2.5 w-2.5" /> {timeOnly(a.scheduled_at)}
                        {(a.status === "completada" || a.status === "programada") && (
                          <span
                            title={a.has_consultation ? "Ver/Editar consulta" : "Registrar consulta"}
                            onClick={(e) => {
                              e.stopPropagation();
                              onViewConsultation(a);
                            }}
                            className="cursor-pointer inline-flex items-center"
                          >
                            <Stethoscope
                              className={cn(
                                "h-2.5 w-2.5 ml-1 transition hover:scale-110",
                                a.has_consultation ? "text-sage-foreground font-bold" : "text-mauve"
                              )}
                            />
                          </span>
                        )}
                      </span>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onEdit(a);
                          }}
                          className="p-0.5 hover:bg-background/80 rounded transition"
                        >
                          <Pencil className="h-2.5 w-2.5 text-muted-foreground" />
                        </button>
                      </div>
                    </div>
                    <p className="font-semibold truncate">{a.patient_name}</p>
                    <p className="text-[9px] text-muted-foreground truncate">
                      {doctorMap.get(a.doctor_id) || "Doctor"}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
