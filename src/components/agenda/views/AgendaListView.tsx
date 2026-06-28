import { Calendar as CalIcon, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { type AppointmentWithPatient } from "@/lib/api/appointments";
import { AgendaAppointmentCard } from "../AgendaAppointmentCard";

interface AgendaListViewProps {
  paginatedGrouped: [string, AppointmentWithPatient[]][];
  totalDays: number;
  today: string;
  doctorMap: Map<string, string>;
  listPage: number;
  totalPages: number;
  itemsPerPage: number;
  setListPage: (p: number | ((prev: number) => number)) => void;
  onSendWhatsApp: (a: AppointmentWithPatient) => void;
  onChangeStatus: (id: string, status: string) => void;
  onViewConsultation: (a: AppointmentWithPatient) => void;
  onEdit: (a: AppointmentWithPatient) => void;
  onDelete: (a: AppointmentWithPatient) => void;
}

export function AgendaListView({
  paginatedGrouped,
  totalDays,
  today,
  doctorMap,
  listPage,
  totalPages,
  itemsPerPage,
  setListPage,
  onSendWhatsApp,
  onChangeStatus,
  onViewConsultation,
  onEdit,
  onDelete,
}: AgendaListViewProps) {
  if (totalDays === 0) {
    return (
      <div className="rounded-3xl glass-card p-12 text-center shadow-sm">
        <CalIcon className="mx-auto h-10 w-10 text-muted-foreground" />
        <p className="mt-3 text-sm text-muted-foreground">No hay citas que coincidan con los filtros.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {paginatedGrouped.map(([date, items]) => {
        const d = new Date(date + "T00:00:00");
        const isToday = date === today;
        return (
          <section key={date} className="rounded-3xl glass-card p-5 shadow-sm border border-border/40">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-wider text-muted-foreground">
                  {isToday ? "Hoy" : d.toLocaleDateString("es-ES", { weekday: "long" })}
                </p>
                <h3 className="font-display text-lg font-semibold tracking-tight">
                  {d.toLocaleDateString("es-ES", { day: "2-digit", month: "long", year: "numeric" })}
                </h3>
              </div>
              <span className="rounded-full bg-muted px-2.5 py-0.5 text-[11px] font-medium text-muted-foreground">
                {items.length} {items.length === 1 ? "cita" : "citas"}
              </span>
            </div>
            
            <div className="space-y-2">
              {items.map((a) => (
                <AgendaAppointmentCard
                  key={a.id}
                  appointment={a}
                  doctorName={doctorMap.get(a.doctor_id) || "Doctor"}
                  variant="list"
                  onSendWhatsApp={onSendWhatsApp}
                  onChangeStatus={onChangeStatus}
                  onViewConsultation={onViewConsultation}
                  onEdit={onEdit}
                  onDelete={onDelete}
                />
              ))}
            </div>
          </section>
        );
      })}

      {totalPages > 1 && (
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-3xl glass-card p-4 shadow-sm border border-border/40 animate-fade-in mt-4">
          <p className="text-xs text-muted-foreground">
            Mostrando <span className="font-semibold text-foreground">{(listPage - 1) * itemsPerPage + 1} - {Math.min(totalDays, listPage * itemsPerPage)}</span> de <span className="font-semibold text-foreground">{totalDays}</span> días con citas
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={listPage === 1}
              onClick={() => setListPage((prev: number) => Math.max(1, prev - 1))}
              className="rounded-xl flex items-center gap-1 h-9 cursor-pointer"
            >
              <ChevronLeft className="h-4 w-4" /> Anterior
            </Button>
            <span className="text-xs font-semibold px-3 py-1 bg-muted/60 rounded-lg">
              {listPage} / {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={listPage === totalPages}
              onClick={() => setListPage((prev: number) => Math.min(totalPages, prev + 1))}
              className="rounded-xl flex items-center gap-1 h-9 cursor-pointer"
            >
              Siguiente <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
