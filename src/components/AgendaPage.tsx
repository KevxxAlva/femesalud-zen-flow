import { useMemo, useState, useEffect } from "react";
import { Plus, Filter, Loader2, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { TableSkeleton } from "@/components/ui/table-skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AppointmentForm } from "@/components/AppointmentForm";
import { ConsultationForm } from "@/components/ConsultationForm";
import { useAppointments, useUpdateAppointment, useDeleteAppointment, type AppointmentWithPatient } from "@/lib/api/appointments";
import { useDoctors } from "@/lib/api/profiles";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

import { FILTERS, MONTHS_ES, dateOnly, getWeekDays, getCalendarMonthDays, formatToYMD } from "./agenda/AgendaUtils";
import { AgendaListView } from "./agenda/views/AgendaListView";
import { AgendaMonthView } from "./agenda/views/AgendaMonthView";
import { AgendaWeekView } from "./agenda/views/AgendaWeekView";
import { AgendaDayView } from "./agenda/views/AgendaDayView";

export function AgendaPage() {
  const [viewMode, setViewMode] = useState<"list" | "calendar">("calendar");
  const [calendarView, setCalendarView] = useState<"day" | "week" | "month">("month");
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [defaultFormDate, setDefaultFormDate] = useState<string | undefined>(undefined);

  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("todas");
  const [scope, setScope] = useState<"hoy" | "semana" | "todas">("todas");

  const queryRange = useMemo(() => {
    if (viewMode === "list" && scope === "todas") {
      const from = new Date(currentDate.getFullYear(), currentDate.getMonth() - 6, 1);
      const to = new Date(currentDate.getFullYear(), currentDate.getMonth() + 12, 0);
      return { from: formatToYMD(from), to: formatToYMD(to) };
    }
    const from = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1);
    const to = new Date(currentDate.getFullYear(), currentDate.getMonth() + 2, 0);
    return { from: formatToYMD(from), to: formatToYMD(to) };
  }, [currentDate.getFullYear(), currentDate.getMonth(), viewMode, scope]);

  const { data: appointments = [], isLoading } = useAppointments(queryRange);
  const { data: doctors = [] } = useDoctors();
  const update = useUpdateAppointment();
  const del = useDeleteAppointment();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<AppointmentWithPatient | null>(null);
  const [toDelete, setToDelete] = useState<AppointmentWithPatient | null>(null);
  
  const [listPage, setListPage] = useState(1);
  const itemsPerPage = 15;

  useEffect(() => {
    setListPage(1);
  }, [filter, scope, viewMode]);

  const [consultationOpen, setConsultationOpen] = useState(false);
  const [consultationApp, setConsultationApp] = useState<AppointmentWithPatient | null>(null);

  const today = formatToYMD(new Date());
  const weekEnd = useMemo(() => {
    const d = new Date(); d.setDate(d.getDate() + 7);
    return formatToYMD(d);
  }, []);

  const ymdSelected = formatToYMD(currentDate);
  const doctorMap = useMemo(() => new Map(doctors.map((d) => [d.id, d.full_name || d.email])), [doctors]);

  const filtered = useMemo(() => {
    return appointments.filter((a) => {
      const d = dateOnly(a.scheduled_at);
      if (filter !== "todas" && a.status !== filter) return false;
      if (viewMode === "list") {
        if (scope === "hoy" && d !== today) return false;
        if (scope === "semana" && (d < today || d > weekEnd)) return false;
      }
      return true;
    });
  }, [appointments, filter, scope, today, weekEnd, viewMode]);

  const dayAppointments = useMemo(() => {
    return filtered
      .filter((a) => dateOnly(a.scheduled_at) === ymdSelected)
      .sort((a, b) => a.scheduled_at.localeCompare(b.scheduled_at));
  }, [filtered, ymdSelected]);

  const grouped = useMemo(() => {
    const map = new Map<string, AppointmentWithPatient[]>();
    for (const a of filtered) {
      const d = dateOnly(a.scheduled_at);
      const list = map.get(d) ?? [];
      list.push(a);
      map.set(d, list);
    }
    return Array.from(map.entries()).sort(([a], [b]) => b.localeCompare(a));
  }, [filtered]);

  const appointmentsByDateMap = useMemo(() => {
    const map = new Map<string, AppointmentWithPatient[]>();
    for (const a of filtered) {
      const d = dateOnly(a.scheduled_at);
      const list = map.get(d) ?? [];
      list.push(a);
      map.set(d, list);
    }
    for (const list of map.values()) {
      list.sort((a, b) => a.scheduled_at.localeCompare(b.scheduled_at));
    }
    return map;
  }, [filtered]);

  const totalPages = Math.ceil(grouped.length / itemsPerPage);
  const paginatedGrouped = useMemo(() => {
    const start = (listPage - 1) * itemsPerPage;
    return grouped.slice(start, start + itemsPerPage);
  }, [grouped, listPage]);

  const counts = useMemo(() => ({
    todas: appointments.length,
    programada: appointments.filter((a) => a.status === "programada").length,
    completada: appointments.filter((a) => a.status === "completada").length,
    cancelada: appointments.filter((a) => a.status === "cancelada").length,
  }), [appointments]);

  const handleSendWhatsAppReminder = async (appointment: AppointmentWithPatient) => {
    try {
      const { data: patient, error } = await supabase
        .from("patients")
        .select("phone, full_name")
        .eq("id", appointment.patient_id)
        .single();

      if (error || !patient || !patient.phone) {
        toast.error("El paciente no tiene un número de teléfono registrado.");
        return;
      }
      const cleanPhone = patient.phone.replace(/\D/g, "");
      if (!cleanPhone) {
        toast.error("El número de teléfono registrado no es válido.");
        return;
      }

      const dt = new Date(appointment.scheduled_at);
      const dateStr = dt.toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long" });
      const pad = (n: number) => String(n).padStart(2, "0");
      const timeStr = `${pad(dt.getHours())}:${pad(dt.getMinutes())}`;

      const docName = doctorMap.get(appointment.doctor_id) || "el especialista";
      const text = `Hola *${patient.full_name}*, le escribimos de *FemeSalud* para recordarle su cita médica el día *${dateStr}* a las *${timeStr}* con *${docName}*. Por favor, confirme su asistencia respondiendo a este mensaje. ¡Que tenga un excelente día!`;

      window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`, "_blank", "noopener");
    } catch (e) {
      toast.error("Error al generar el recordatorio");
    }
  };

  const changeStatus = async (id: string, status: string) => {
    try { await update.mutateAsync({ id, status }); toast.success("Estado actualizado"); }
    catch (err) { toast.error(err instanceof Error ? err.message : "Error"); }
  };

  const handleDelete = async () => {
    if (!toDelete) return;
    try { await del.mutateAsync(toDelete.id); toast.success("Cita eliminada"); }
    catch (err) { toast.error(err instanceof Error ? err.message : "Error"); }
    setToDelete(null);
  };

  const handleDropAppointment = async (appointmentId: string, newYMD: string) => {
    try {
      const a = appointments.find(x => x.id === appointmentId);
      if (!a) return;
      const oldDate = new Date(a.scheduled_at);
      const [y, m, d] = newYMD.split('-');
      oldDate.setFullYear(parseInt(y), parseInt(m) - 1, parseInt(d));
      await update.mutateAsync({ id: appointmentId, scheduled_at: oldDate.toISOString() });
      toast.success("Cita reprogramada con éxito");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error al reprogramar");
    }
  };

  const handlePrev = () => {
    setCurrentDate((prev) => {
      const d = new Date(prev);
      if (calendarView === "month") d.setMonth(d.getMonth() - 1);
      else if (calendarView === "week") d.setDate(d.getDate() - 7);
      else if (calendarView === "day") d.setDate(d.getDate() - 1);
      return d;
    });
  };

  const handleNext = () => {
    setCurrentDate((prev) => {
      const d = new Date(prev);
      if (calendarView === "month") d.setMonth(d.getMonth() + 1);
      else if (calendarView === "week") d.setDate(d.getDate() + 7);
      else if (calendarView === "day") d.setDate(d.getDate() + 1);
      return d;
    });
  };

  const weekDays = useMemo(() => getWeekDays(currentDate), [currentDate]);
  const monthDays = useMemo(() => getCalendarMonthDays(currentDate), [currentDate]);

  const handleAddAppointment = (ymd?: string) => {
    setDefaultFormDate(ymd);
    setEditing(null);
    setFormOpen(true);
  };

  const handleEditAppointment = (a: AppointmentWithPatient) => {
    setEditing(a);
    setFormOpen(true);
  };

  const handleViewConsultation = (a: AppointmentWithPatient) => {
    setConsultationApp(a);
    setConsultationOpen(true);
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div className="ml-14 md:ml-0">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Módulo</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight font-display">Agenda</h1>
          <p className="text-sm text-muted-foreground">
            {viewMode === "list" ? `${filtered.length} citas mostradas` : "Vista de Calendario"}
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 bg-muted/60 p-1 rounded-2xl border border-border/30 shadow-sm animate-fade-in">
            <button
              onClick={() => setViewMode("calendar")}
              className={cn(
                "rounded-xl px-4 py-1.5 text-xs font-semibold transition-all duration-300 cursor-pointer",
                viewMode === "calendar" ? "bg-background text-foreground shadow-sm font-bold" : "text-muted-foreground hover:text-foreground"
              )}
            >
              Calendario
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={cn(
                "rounded-xl px-4 py-1.5 text-xs font-semibold transition-all duration-300 cursor-pointer",
                viewMode === "list" ? "bg-background text-foreground shadow-sm font-bold" : "text-muted-foreground hover:text-foreground"
              )}
            >
              Lista
            </button>
          </div>
          <Button onClick={() => handleAddAppointment()} className="rounded-2xl bg-gradient-to-r from-mauve to-mauve-soft text-primary-foreground shadow-sm shadow-mauve/30 hover:opacity-95 transition-all duration-300 hover:scale-[1.02]">
            <Plus className="mr-1 h-4 w-4" /> Nueva cita
          </Button>
        </div>
      </header>

      {/* FILTER BAR */}
      <div className="rounded-3xl glass-card p-4 shadow-sm border border-border/40">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
            <Filter className="h-3.5 w-3.5" /> Estado
          </div>
          <div className="flex flex-wrap gap-1.5">
            {FILTERS.map((f) => (
              <button key={f} onClick={() => setFilter(f)} className={cn(
                "rounded-full px-3.5 py-1.5 text-xs font-medium capitalize transition-all duration-300 cursor-pointer",
                filter === f ? "bg-gradient-to-r from-mauve to-mauve-soft text-primary-foreground shadow-sm shadow-mauve/20" : "bg-muted/60 text-muted-foreground hover:bg-muted",
              )}>
                {f} · {counts[f]}
              </button>
            ))}
          </div>

          {viewMode === "list" && (
            <>
              <div className="mx-2 hidden h-5 w-px bg-border md:block" />
              <div className="flex gap-1.5">
                {(["hoy", "semana", "todas"] as const).map((s) => (
                  <button key={s} onClick={() => setScope(s)} className={cn(
                    "rounded-full px-3.5 py-1.5 text-xs font-medium capitalize transition-all duration-300 cursor-pointer",
                    scope === s ? "bg-foreground text-background" : "bg-muted/60 text-muted-foreground hover:bg-muted",
                  )}>{s}</button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* CALENDAR NAVIGATION */}
      <div className="rounded-3xl glass-card p-4 shadow-sm border border-border/40 animate-fade-in">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={handlePrev} className="rounded-xl hover:bg-muted/80 h-9 w-9">
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={() => setCurrentDate(new Date())} className="rounded-xl px-4 font-semibold text-xs border-border/50 h-9 hover:bg-muted/20">
              Hoy
            </Button>
            <Button variant="ghost" size="icon" onClick={handleNext} className="rounded-xl hover:bg-muted/80 h-9 w-9">
              <ChevronRight className="h-4 w-4" />
            </Button>
            
            <div className="flex flex-wrap items-center gap-1.5 font-display font-bold text-sm md:text-base tracking-tight ml-2">
              <select
                value={currentDate.getMonth()}
                onChange={(e) => setCurrentDate(new Date(currentDate.getFullYear(), Number(e.target.value), 1))}
                className="bg-muted hover:bg-muted-soft text-foreground font-bold px-3 py-1.5 rounded-2xl text-xs md:text-sm cursor-pointer outline-none border border-border/30 capitalize transition duration-200"
              >
                {MONTHS_ES.map((m, idx) => (
                  <option key={m} value={idx} className="bg-card text-foreground font-semibold text-sm">{m}</option>
                ))}
              </select>
              <select
                value={currentDate.getFullYear()}
                onChange={(e) => setCurrentDate(new Date(Number(e.target.value), currentDate.getMonth(), 1))}
                className="bg-muted hover:bg-muted-soft text-foreground font-bold px-3 py-1.5 rounded-2xl text-xs md:text-sm cursor-pointer outline-none border border-border/30 transition duration-200"
              >
                {Array.from({ length: 11 }, (_, i) => 2018 + i).map((y) => (
                  <option key={y} value={y} className="bg-card text-foreground font-semibold text-sm">{y}</option>
                ))}
              </select>
              {viewMode === "calendar" && calendarView === "week" && (
                <span className="text-xs text-muted-foreground font-normal ml-2">
                  (Semana del {weekDays[0].getDate()} al {weekDays[6].getDate()})
                </span>
              )}
              {viewMode === "calendar" && calendarView === "day" && (
                <span className="text-xs text-muted-foreground font-normal ml-2">
                  ({currentDate.toLocaleDateString("es-ES", { weekday: "long", day: "numeric" })})
                </span>
              )}
            </div>
          </div>
          
          {viewMode === "calendar" && (
            <div className="flex gap-1 bg-muted/60 p-1 rounded-2xl border border-border/30 shadow-sm">
              {(["day", "week", "month"] as const).map((v) => (
                <button
                  key={v}
                  onClick={() => setCalendarView(v)}
                  className={cn(
                    "rounded-xl px-4 py-1.5 text-xs font-semibold capitalize transition-all duration-300 cursor-pointer",
                    calendarView === v ? "bg-background text-foreground shadow-sm font-bold" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {v === "day" ? "Día" : v === "week" ? "Semana" : "Mes"}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {isLoading ? (
        <TableSkeleton columns={5} rows={5} />
      ) : viewMode === "list" ? (
        <AgendaListView
          paginatedGrouped={paginatedGrouped}
          totalDays={grouped.length}
          today={today}
          doctorMap={doctorMap}
          listPage={listPage}
          totalPages={totalPages}
          itemsPerPage={itemsPerPage}
          setListPage={setListPage}
          onSendWhatsApp={handleSendWhatsAppReminder}
          onChangeStatus={changeStatus}
          onViewConsultation={handleViewConsultation}
          onEdit={handleEditAppointment}
          onDelete={setToDelete}
        />
      ) : (
        <div className="animate-fade-in">
          {calendarView === "month" && (
            <AgendaMonthView
              monthDays={monthDays}
              currentDate={currentDate}
              appointmentsByDateMap={appointmentsByDateMap}
              onDayClick={(d) => { setCurrentDate(d); setCalendarView("day"); }}
              onAddAppointment={handleAddAppointment}
              onEdit={handleEditAppointment}
              onDropAppointment={handleDropAppointment}
            />
          )}

          {calendarView === "week" && (
            <AgendaWeekView
              weekDays={weekDays}
              today={today}
              appointmentsByDateMap={appointmentsByDateMap}
              doctorMap={doctorMap}
              onAddAppointment={handleAddAppointment}
              onEdit={handleEditAppointment}
              onViewConsultation={handleViewConsultation}
              onDropAppointment={handleDropAppointment}
            />
          )}

          {calendarView === "day" && (
            <AgendaDayView
              currentDate={currentDate}
              ymdSelected={ymdSelected}
              dayAppointments={dayAppointments}
              doctorMap={doctorMap}
              onAddAppointment={handleAddAppointment}
              onSendWhatsApp={handleSendWhatsAppReminder}
              onChangeStatus={changeStatus}
              onViewConsultation={handleViewConsultation}
              onEdit={handleEditAppointment}
              onDelete={setToDelete}
              onDropAppointment={handleDropAppointment}
            />
          )}
        </div>
      )}

      {/* Dialogs */}
      <AppointmentForm open={formOpen} onOpenChange={setFormOpen} appointment={editing} defaultDate={defaultFormDate} />
      <ConsultationForm open={consultationOpen} onOpenChange={setConsultationOpen} appointment={consultationApp} />

      <AlertDialog open={!!toDelete} onOpenChange={(o) => !o && setToDelete(null)}>
        <AlertDialogContent className="rounded-3xl">
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar cita?</AlertDialogTitle>
            <AlertDialogDescription>La cita de {toDelete?.patient_name} se eliminará. Esta acción no se puede deshacer.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
