import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { type AppointmentWithPatient } from "@/lib/api/appointments";
import { formatToYMD, WEEKDAYS_ES } from "../AgendaUtils";
import { AgendaAppointmentCard } from "../AgendaAppointmentCard";

interface AgendaMonthViewProps {
  monthDays: Date[];
  currentDate: Date;
  appointmentsByDateMap: Map<string, AppointmentWithPatient[]>;
  onDayClick: (d: Date) => void;
  onAddAppointment: (ymd: string) => void;
  onEdit: (a: AppointmentWithPatient) => void;
  onDropAppointment?: (appointmentId: string, ymd: string) => void;
}

export function AgendaMonthView({
  monthDays,
  currentDate,
  appointmentsByDateMap,
  onDayClick,
  onAddAppointment,
  onEdit,
  onDropAppointment,
}: AgendaMonthViewProps) {
  return (
    <div className="rounded-3xl glass-card p-5 border border-border/40 shadow-sm overflow-x-auto">
      <div className="min-w-[700px]">
        {/* Weekdays row */}
        <div className="grid grid-cols-7 gap-2 text-center font-bold text-xs text-muted-foreground mb-3 uppercase tracking-wider">
          {WEEKDAYS_ES.map((day) => (
            <div key={day} className="py-1">
              <span>{day}</span>
            </div>
          ))}
        </div>
        
        {/* Calendar grid */}
        <div className="grid grid-cols-7 gap-2">
          {monthDays.map((day, idx) => {
            const ymd = formatToYMD(day);
            const dayAppointments = appointmentsByDateMap.get(ymd) || [];
            const isCurrentMonth = day.getMonth() === currentDate.getMonth();
            const isToday = formatToYMD(new Date()) === ymd;

            return (
              <div
                key={idx}
                onClick={() => onDayClick(day)}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  const id = e.dataTransfer.getData("appointmentId");
                  if (id && onDropAppointment) {
                    onDropAppointment(id, ymd);
                  }
                }}
                className={cn(
                  "group min-h-[110px] flex flex-col justify-between p-2.5 rounded-2xl border transition-all duration-300 cursor-pointer relative",
                  isCurrentMonth ? "bg-card/40 border-border/60" : "bg-muted/10 border-transparent opacity-40",
                  isToday ? "ring-2 ring-mauve border-transparent bg-mauve/[0.03]" : "",
                  "hover:bg-card hover:shadow-md hover:-translate-y-0.5"
                )}
              >
                <div className="flex items-center justify-between">
                  <span
                    className={cn(
                      "flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold transition-colors",
                      isToday ? "bg-mauve text-primary-foreground" : "text-muted-foreground group-hover:text-foreground"
                    )}
                  >
                    {day.getDate()}
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onAddAppointment(ymd);
                    }}
                    className="opacity-0 group-hover:opacity-100 hover:bg-muted p-1 rounded-lg transition-all h-6 w-6 flex items-center justify-center border border-border/40"
                  >
                    <Plus className="h-3 w-3 text-muted-foreground" />
                  </button>
                </div>
                
                {/* Render appointments */}
                <div className="mt-2 space-y-1 overflow-hidden flex-1 flex flex-col justify-end">
                  {dayAppointments.slice(0, 3).map((a) => (
                    <AgendaAppointmentCard
                      key={a.id}
                      appointment={a}
                      doctorName="" // Optional in compact mode
                      variant="compact"
                      onSendWhatsApp={() => {}}
                      onChangeStatus={() => {}}
                      onViewConsultation={() => {}}
                      onEdit={onEdit}
                      onDelete={() => {}}
                      draggable
                      onDragStart={(e) => {
                        e.dataTransfer.setData("appointmentId", a.id);
                      }}
                    />
                  ))}
                  {dayAppointments.length > 3 && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDayClick(day);
                      }}
                      className="text-[9px] font-extrabold text-mauve hover:text-mauve-soft text-left px-1 hover:underline mt-0.5"
                    >
                      + {dayAppointments.length - 3} más
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
