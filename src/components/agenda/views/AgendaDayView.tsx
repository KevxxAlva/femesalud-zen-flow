import { Plus, Calendar as CalIcon, Clock, MoreVertical, CreditCard, Stethoscope, Video } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { EmptyState } from "@/components/ui/empty-state";
import { type AppointmentWithPatient } from "@/lib/api/appointments";
import { MONTHS_ES } from "../AgendaUtils";
import { AgendaAppointmentCard } from "../AgendaAppointmentCard";

interface AgendaDayViewProps {
  currentDate: Date;
  ymdSelected: string;
  dayAppointments: AppointmentWithPatient[];
  doctorMap: Map<string, string>;
  onAddAppointment: (ymd: string) => void;
  onSendWhatsApp: (a: AppointmentWithPatient) => void;
  onChangeStatus: (id: string, status: string) => void;
  onViewConsultation: (a: AppointmentWithPatient) => void;
  onEdit: (a: AppointmentWithPatient) => void;
  onDelete: (a: AppointmentWithPatient) => void;
}

export function AgendaDayView({
  currentDate,
  ymdSelected,
  dayAppointments,
  doctorMap,
  onAddAppointment,
  onSendWhatsApp,
  onChangeStatus,
  onViewConsultation,
  onEdit,
  onDelete,
}: AgendaDayViewProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
      {/* Left panel: Selected Date details card */}
      <div className="lg:col-span-1 space-y-4">
        <div className="rounded-3xl glass-card p-5 border border-border/40 shadow-sm flex flex-col items-center text-center">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Fecha Seleccionada</p>
          <h2 className="font-display text-5xl font-extrabold tracking-tight text-mauve mt-2">
            {currentDate.getDate()}
          </h2>
          <p className="font-bold text-sm mt-1 capitalize">
            {currentDate.toLocaleDateString("es-ES", { weekday: "long" })}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            de {MONTHS_ES[currentDate.getMonth()]} del {currentDate.getFullYear()}
          </p>
          <Button
            onClick={() => onAddAppointment(ymdSelected)}
            className="w-full mt-5 rounded-2xl bg-gradient-to-r from-mauve to-mauve-soft text-primary-foreground shadow-sm shadow-mauve/20 hover:opacity-95 transition-all duration-300 hover:scale-[1.02]"
          >
            <Plus className="h-4 w-4 mr-1" /> Programar Cita
          </Button>
        </div>
      </div>

      {/* Right panel: Timeline of the day */}
      <div className="lg:col-span-3 space-y-4">
        <div className="rounded-3xl glass-card p-6 border border-border/40 shadow-sm min-h-[350px]">
          <h3 className="font-display text-base md:text-lg font-bold mb-5 flex items-center justify-between border-b border-border/20 pb-3">
            <span>Citas Programadas</span>
            <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
              {dayAppointments.length} {dayAppointments.length === 1 ? "cita" : "citas"}
            </span>
          </h3>

          {dayAppointments.length === 0 ? (
            <div className="h-full flex items-center justify-center">
              <EmptyState icon={CalIcon} title="Día libre" description="No hay citas programadas para este día. Usa el botón a la izquierda para agendar una." />
            </div>
          ) : (
            <div className="space-y-3 relative before:absolute before:left-8 before:top-4 before:bottom-4 before:w-0.5 before:bg-border/30">
              {dayAppointments.map((a) => (
                <div key={a.id} className="relative pl-14 group flex">
                  {/* Timeline bullet */}
                  <div className={cn(
                    "absolute left-8 top-5 -translate-x-1/2 flex h-3.5 w-3.5 items-center justify-center rounded-full border bg-background z-10 transition-all",
                    a.status === "programada" ? "border-mauve ring-4 ring-mauve/10" : "",
                    a.status === "completada" ? "border-sage ring-4 ring-sage/10" : "",
                    a.status === "cancelada" ? "border-destructive ring-4 ring-destructive/10" : ""
                  )} />
                  
                  {/* Appointment card */}
                  <AgendaAppointmentCard
                    appointment={a}
                    doctorName={doctorMap.get(a.doctor_id) || "Doctor"}
                    variant="timeline"
                    onSendWhatsApp={onSendWhatsApp}
                    onChangeStatus={onChangeStatus}
                    onViewConsultation={onViewConsultation}
                    onEdit={onEdit}
                    onDelete={onDelete}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
