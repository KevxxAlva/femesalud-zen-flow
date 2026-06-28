import { Clock, MessageCircle, CheckCircle2, XCircle, Stethoscope, Pencil, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { type AppointmentWithPatient } from "@/lib/api/appointments";
import { statusBg, timeOnly } from "./AgendaUtils";

interface AgendaAppointmentCardProps {
  appointment: AppointmentWithPatient;
  doctorName: string;
  onSendWhatsApp: (a: AppointmentWithPatient) => void;
  onChangeStatus: (id: string, status: string) => void;
  onViewConsultation: (a: AppointmentWithPatient) => void;
  onEdit: (a: AppointmentWithPatient) => void;
  onDelete: (a: AppointmentWithPatient) => void;
  variant?: "list" | "timeline" | "compact";
}

export function AgendaAppointmentCard({
  appointment: a,
  doctorName,
  onSendWhatsApp,
  onChangeStatus,
  onViewConsultation,
  onEdit,
  onDelete,
  variant = "list",
}: AgendaAppointmentCardProps) {
  
  if (variant === "compact") {
    const time = timeOnly(a.scheduled_at);
    return (
      <div
        onClick={(e) => {
          e.stopPropagation();
          onEdit(a);
        }}
        className={cn(
          "text-[9px] font-semibold px-1.5 py-0.5 rounded border-l-2 truncate cursor-pointer transition hover:opacity-90",
          a.status === "programada" ? "bg-mauve/10 border-mauve text-mauve-foreground" : "",
          a.status === "completada" ? "bg-sage/20 border-sage text-sage-foreground" : "",
          a.status === "cancelada" ? "bg-destructive/10 border-destructive text-destructive" : ""
        )}
        title={`${time} - ${a.patient_name}`}
      >
        {time} {a.patient_name}
      </div>
    );
  }

  return (
    <div className={cn(
      "group flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border/60 bg-card/60 p-3.5 transition-all duration-300 hover:bg-card hover:shadow-sm",
      variant === "timeline" ? "flex-1" : ""
    )}>
      <div className="flex items-center gap-3">
        {variant === "timeline" ? (
          <div className="flex w-20 flex-col items-center justify-center gap-0.5 rounded-xl bg-muted px-2 py-1 text-xs font-bold">
            <span className="text-[9px] text-muted-foreground uppercase">Hora</span>
            <span className="text-sm text-mauve font-extrabold">{timeOnly(a.scheduled_at)}</span>
          </div>
        ) : (
          <div className="flex w-16 items-center justify-center gap-1 rounded-xl bg-muted px-2 py-1.5 text-xs font-semibold">
            <Clock className="h-3 w-3 text-mauve" /> {timeOnly(a.scheduled_at)}
          </div>
        )}
        <div className="min-w-0">
          <p className={cn("truncate font-bold", variant === "timeline" ? "text-sm md:text-base" : "text-sm")}>
            {a.patient_name}
          </p>
          <p className={cn("truncate text-muted-foreground", variant === "timeline" ? "text-xs mt-0.5" : "text-xs")}>
            {a.reason || "—"} · {doctorName}
          </p>
        </div>
      </div>
      
      <div className="flex items-center gap-2">
        <span className={cn("rounded-full px-2.5 py-0.5 text-[11px] font-medium capitalize", statusBg[a.status])}>
          {a.status}
        </span>
        
        {a.status === "programada" && (
          <>
            <button
              onClick={() => onSendWhatsApp(a)}
              className="flex h-8 w-8 items-center justify-center rounded-xl text-muted-foreground transition hover:bg-emerald-500/15 hover:text-emerald-600 cursor-pointer"
              title="Enviar recordatorio de WhatsApp"
              aria-label="WhatsApp"
            >
              <MessageCircle className="h-4 w-4" />
            </button>
            <button 
              onClick={() => onChangeStatus(a.id, "completada")} 
              className="flex h-8 w-8 items-center justify-center rounded-xl text-muted-foreground transition hover:bg-sage/30 hover:text-sage-foreground cursor-pointer" 
              aria-label="Marcar completada"
            >
              <CheckCircle2 className="h-4 w-4" />
            </button>
            <button 
              onClick={() => onChangeStatus(a.id, "cancelada")} 
              className="flex h-8 w-8 items-center justify-center rounded-xl text-muted-foreground transition hover:bg-destructive/10 hover:text-destructive cursor-pointer" 
              aria-label="Cancelar"
            >
              <XCircle className="h-4 w-4" />
            </button>
          </>
        )}
        
        {(a.status === "completada" || a.status === "programada") && (
          <button
            onClick={() => onViewConsultation(a)}
            className={cn(
              "flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-xl transition cursor-pointer",
              a.has_consultation
                ? "bg-sage/20 text-sage-foreground hover:bg-sage/30"
                : "bg-mauve/15 text-mauve hover:bg-mauve/25"
            )}
          >
            <Stethoscope className="h-3.5 w-3.5" />
            {a.has_consultation ? "Ver Consulta" : "Reg. Consulta"}
          </button>
        )}
        
        <button 
          onClick={() => onEdit(a)} 
          className="flex h-8 w-8 items-center justify-center rounded-xl text-muted-foreground transition hover:bg-mauve/10 hover:text-mauve" 
          aria-label="Editar"
        >
          <Pencil className="h-3.5 w-3.5" />
        </button>
        
        <button 
          onClick={() => onDelete(a)} 
          className="flex h-8 w-8 items-center justify-center rounded-xl text-muted-foreground transition hover:bg-destructive/10 hover:text-destructive" 
          aria-label="Eliminar"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
