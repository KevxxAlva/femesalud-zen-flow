import { useMemo, useState, useEffect } from "react";
import { Plus, Calendar as CalIcon, Clock, Pencil, Trash2, CheckCircle2, XCircle, Filter, Loader2, ChevronLeft, ChevronRight, Stethoscope, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { AppointmentForm } from "@/components/AppointmentForm";
import { ConsultationForm } from "@/components/ConsultationForm";
import { useAppointments, useUpdateAppointment, useDeleteAppointment, type AppointmentWithPatient } from "@/lib/api/appointments";
import { useDoctors } from "@/lib/api/profiles";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

const FILTERS = ["todas", "programada", "completada", "cancelada"] as const;
const statusBg: Record<string, string> = {
  programada: "bg-mauve/15 text-mauve",
  completada: "bg-sage/50 text-sage-foreground",
  cancelada: "bg-destructive/15 text-destructive",
};

function dateOnly(iso: string) { return iso.slice(0, 10); }
function timeOnly(iso: string) {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

// Calendar Calculation Helpers
function getMonday(d: Date) {
  const date = new Date(d);
  const day = date.getDay();
  // adjust when day is sunday (0)
  const diff = date.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(date.setDate(diff));
}

function getWeekDays(d: Date) {
  const start = getMonday(d);
  const days = [];
  for (let i = 0; i < 7; i++) {
    const next = new Date(start);
    next.setDate(start.getDate() + i);
    days.push(next);
  }
  return days;
}

function getStartOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

function getCalendarMonthDays(d: Date) {
  const start = getStartOfMonth(d);
  let dayOfWeek = start.getDay();
  // We want Lunes (1) to be index 0, Domingo (0) to be index 6
  let offset = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  
  const calendarStart = new Date(start);
  calendarStart.setDate(start.getDate() - offset);
  
  const days = [];
  // We always render 42 days (6 weeks) to maintain a stable size grid
  for (let i = 0; i < 42; i++) {
    const next = new Date(calendarStart);
    next.setDate(calendarStart.getDate() + i);
    days.push(next);
  }
  return days;
}

function formatToYMD(d: Date) {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

const MONTHS_ES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
];
const WEEKDAYS_ES = [
  "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"
];

export function AgendaPage() {
  // Navigation states & modes
  const [viewMode, setViewMode] = useState<"list" | "calendar">("calendar");
  const [calendarView, setCalendarView] = useState<"day" | "week" | "month">("month");
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [defaultFormDate, setDefaultFormDate] = useState<string | undefined>(undefined);

  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("todas");
  const [scope, setScope] = useState<"hoy" | "semana" | "todas">("todas");

  // Compute query range dynamically based on active navigation and scope
  const queryRange = useMemo(() => {
    if (viewMode === "list" && scope === "todas") {
      const fromDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - 6, 1);
      const toDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 12, 0);
      return {
        from: fromDate.toISOString().slice(0, 10),
        to: toDate.toISOString().slice(0, 10),
      };
    }
    const fromDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1);
    const toDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 2, 0);
    return {
      from: fromDate.toISOString().slice(0, 10),
      to: toDate.toISOString().slice(0, 10),
    };
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

  // Consultation states
  const [consultationOpen, setConsultationOpen] = useState(false);
  const [consultationApp, setConsultationApp] = useState<AppointmentWithPatient | null>(null);

  const today = new Date().toISOString().slice(0, 10);
  const weekEnd = useMemo(() => {
    const d = new Date(); d.setDate(d.getDate() + 7);
    return d.toISOString().slice(0, 10);
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

      const doctorName = doctorMap.get(appointment.doctor_id) || "el especialista";
      const text = `Hola *${patient.full_name}*, le escribimos de *FemeSalud* para recordarle su cita médica el día *${dateStr}* a las *${timeStr}* con *${doctorName}*. Por favor, confirme su asistencia respondiendo a este mensaje. ¡Que tenga un excelente día!`;

      const url = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`;
      window.open(url, "_blank", "noopener");
    } catch (e) {
      toast.error("Error al generar el recordatorio");
      console.error(e);
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

  const handlePrev = () => {
    setCurrentDate((prev) => {
      const d = new Date(prev);
      if (calendarView === "month") {
        d.setMonth(d.getMonth() - 1);
      } else if (calendarView === "week") {
        d.setDate(d.getDate() - 7);
      } else if (calendarView === "day") {
        d.setDate(d.getDate() - 1);
      }
      return d;
    });
  };

  const handleNext = () => {
    setCurrentDate((prev) => {
      const d = new Date(prev);
      if (calendarView === "month") {
        d.setMonth(d.getMonth() + 1);
      } else if (calendarView === "week") {
        d.setDate(d.getDate() + 7);
      } else if (calendarView === "day") {
        d.setDate(d.getDate() + 1);
      }
      return d;
    });
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  // Memoized lists of days for Week & Month views
  const weekDays = useMemo(() => getWeekDays(currentDate), [currentDate]);
  const monthDays = useMemo(() => getCalendarMonthDays(currentDate), [currentDate]);

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
          {/* List/Calendar Switcher */}
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

          <Button onClick={() => { setDefaultFormDate(undefined); setEditing(null); setFormOpen(true); }} className="rounded-2xl bg-gradient-to-r from-mauve to-mauve-soft text-primary-foreground shadow-sm shadow-mauve/30 hover:opacity-95 transition-all duration-300 hover:scale-[1.02]">
            <Plus className="mr-1 h-4 w-4" /> Nueva cita
          </Button>
        </div>
      </header>

      {/* FILTER BAR - Applies to both views (Status only in Calendar, Status + Scope in List) */}
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

      {/* CALENDAR NAVIGATION - Visible in both Calendar and List Modes */}
      <div className="rounded-3xl glass-card p-4 shadow-sm border border-border/40 animate-fade-in">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={handlePrev} className="rounded-xl hover:bg-muted/80 h-9 w-9">
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={handleToday} className="rounded-xl px-4 font-semibold text-xs border-border/50 h-9 hover:bg-muted/20">
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
                  <option key={m} value={idx} className="bg-card text-foreground font-semibold text-sm">
                    {m}
                  </option>
                ))}
              </select>
              <select
                value={currentDate.getFullYear()}
                onChange={(e) => setCurrentDate(new Date(Number(e.target.value), currentDate.getMonth(), 1))}
                className="bg-muted hover:bg-muted-soft text-foreground font-bold px-3 py-1.5 rounded-2xl text-xs md:text-sm cursor-pointer outline-none border border-border/30 transition duration-200"
              >
                {Array.from({ length: 11 }, (_, i) => 2018 + i).map((y) => (
                  <option key={y} value={y} className="bg-card text-foreground font-semibold text-sm">
                    {y}
                  </option>
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

      {/* RENDER VIEWS */}
      {isLoading ? (
        <div className="rounded-3xl glass-card p-12 text-center"><Loader2 className="mx-auto h-6 w-6 animate-spin text-muted-foreground" /></div>
      ) : viewMode === "list" ? (
        /* LIST VIEW (ORIGINAL IMPLEMENTATION) */
        grouped.length === 0 ? (
          <div className="rounded-3xl glass-card p-12 text-center shadow-sm">
            <CalIcon className="mx-auto h-10 w-10 text-muted-foreground" />
            <p className="mt-3 text-sm text-muted-foreground">No hay citas que coincidan con los filtros.</p>
          </div>
        ) : (
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
                    {items.sort((a, b) => a.scheduled_at.localeCompare(b.scheduled_at)).map((a) => (
                      <div key={a.id} className="group flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border/60 bg-card/60 p-3.5 transition-all duration-300 hover:bg-card hover:shadow-sm">
                        <div className="flex items-center gap-3">
                          <div className="flex w-16 items-center justify-center gap-1 rounded-xl bg-muted px-2 py-1.5 text-xs font-semibold">
                            <Clock className="h-3 w-3 text-mauve" /> {timeOnly(a.scheduled_at)}
                          </div>
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold">{a.patient_name}</p>
                            <p className="truncate text-xs text-muted-foreground">{a.reason || "—"} · {doctorMap.get(a.doctor_id) || "Doctor"}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={cn("rounded-full px-2.5 py-0.5 text-[11px] font-medium capitalize", statusBg[a.status])}>{a.status}</span>
                          {a.status === "programada" && (
                            <>
                              <button
                                onClick={() => handleSendWhatsAppReminder(a)}
                                className="flex h-8 w-8 items-center justify-center rounded-xl text-muted-foreground transition hover:bg-emerald-500/15 hover:text-emerald-600 cursor-pointer"
                                title="Enviar recordatorio de WhatsApp"
                                aria-label="WhatsApp"
                              >
                                <MessageCircle className="h-4 w-4" />
                              </button>
                              <button onClick={() => changeStatus(a.id, "completada")} className="flex h-8 w-8 items-center justify-center rounded-xl text-muted-foreground transition hover:bg-sage/30 hover:text-sage-foreground cursor-pointer" aria-label="Marcar completada">
                                <CheckCircle2 className="h-4 w-4" />
                              </button>
                              <button onClick={() => changeStatus(a.id, "cancelada")} className="flex h-8 w-8 items-center justify-center rounded-xl text-muted-foreground transition hover:bg-destructive/10 hover:text-destructive cursor-pointer" aria-label="Cancelar">
                                <XCircle className="h-4 w-4" />
                              </button>
                            </>
                          )}
                          {(a.status === "completada" || a.status === "programada") && (
                            <button
                              onClick={() => {
                                setConsultationApp(a);
                                setConsultationOpen(true);
                              }}
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
                          <button onClick={() => { setEditing(a); setFormOpen(true); }} className="flex h-8 w-8 items-center justify-center rounded-xl text-muted-foreground transition hover:bg-mauve/10 hover:text-mauve" aria-label="Editar">
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                          <button onClick={() => setToDelete(a)} className="flex h-8 w-8 items-center justify-center rounded-xl text-muted-foreground transition hover:bg-destructive/10 hover:text-destructive" aria-label="Eliminar">
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              );
            })}

            {totalPages > 1 && (
              <div className="flex flex-wrap items-center justify-between gap-4 rounded-3xl glass-card p-4 shadow-sm border border-border/40 animate-fade-in mt-4">
                <p className="text-xs text-muted-foreground">
                  Mostrando <span className="font-semibold text-foreground">{(listPage - 1) * itemsPerPage + 1} - {Math.min(grouped.length, listPage * itemsPerPage)}</span> de <span className="font-semibold text-foreground">{grouped.length}</span> días con citas
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={listPage === 1}
                    onClick={() => setListPage((prev) => Math.max(1, prev - 1))}
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
                    onClick={() => setListPage((prev) => Math.min(totalPages, prev + 1))}
                    className="rounded-xl flex items-center gap-1 h-9 cursor-pointer"
                  >
                    Siguiente <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        )
      ) : (
        /* CALENDAR SUB-VIEWS */
        <div className="animate-fade-in">
          {calendarView === "month" && (
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
                        onClick={() => {
                          setCurrentDate(day);
                          setCalendarView("day");
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
                              setDefaultFormDate(ymd);
                              setEditing(null);
                              setFormOpen(true);
                            }}
                            className="opacity-0 group-hover:opacity-100 hover:bg-muted p-1 rounded-lg transition-all h-6 w-6 flex items-center justify-center border border-border/40"
                          >
                            <Plus className="h-3 w-3 text-muted-foreground" />
                          </button>
                        </div>
                        
                        {/* Render appointments */}
                        <div className="mt-2 space-y-1 overflow-hidden flex-1 flex flex-col justify-end">
                          {dayAppointments.slice(0, 3).map((a) => {
                            const time = timeOnly(a.scheduled_at);
                            return (
                              <div
                                key={a.id}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setEditing(a);
                                  setFormOpen(true);
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
                          })}
                          {dayAppointments.length > 3 && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setCurrentDate(day);
                                setCalendarView("day");
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
          )}

          {calendarView === "week" && (
            <div className="grid grid-cols-1 md:grid-cols-7 gap-3">
              {weekDays.map((day, idx) => {
                const ymd = formatToYMD(day);
                const dayAppointments = appointmentsByDateMap.get(ymd) || [];
                const isToday = formatToYMD(new Date()) === ymd;

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
                        onClick={() => {
                          setDefaultFormDate(ymd);
                          setEditing(null);
                          setFormOpen(true);
                        }}
                        className="flex h-7 w-7 items-center justify-center rounded-xl bg-muted/80 hover:bg-muted text-muted-foreground transition border border-border/20"
                      >
                        <Plus className="h-3.5 w-3.5" />
                      </button>
                    </div>

                    <div className="space-y-2 flex-1 overflow-y-auto max-h-[400px] pr-1">
                      {dayAppointments.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground border border-dashed border-border/50 rounded-2xl h-full min-h-[100px]">
                          <span className="text-[10px] font-medium">Sin citas</span>
                        </div>
                      ) : (
                        dayAppointments.map((a) => (
                          <div
                            key={a.id}
                            className={cn(
                              "group relative flex flex-col gap-1 p-2 rounded-2xl border text-[11px] transition duration-200 hover:shadow-sm cursor-pointer",
                              a.status === "programada" ? "bg-mauve/10 border-mauve/30 text-mauve-foreground hover:bg-mauve/15" : "",
                              a.status === "completada" ? "bg-sage/15 border-sage/30 text-sage-foreground hover:bg-sage/20" : "",
                              a.status === "cancelada" ? "bg-destructive/10 border-destructive/30 text-destructive hover:bg-destructive/15" : ""
                            )}
                            onClick={() => {
                              setEditing(a);
                              setFormOpen(true);
                            }}
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-bold flex items-center gap-1 text-[10px]">
                                <Clock className="h-2.5 w-2.5" /> {timeOnly(a.scheduled_at)}
                                {(a.status === "completada" || a.status === "programada") && (
                                  <span
                                    title={a.has_consultation ? "Ver/Editar consulta" : "Registrar consulta"}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setConsultationApp(a);
                                      setConsultationOpen(true);
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
                                    setEditing(a);
                                    setFormOpen(true);
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
          )}

          {calendarView === "day" && (
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
                    onClick={() => {
                      setDefaultFormDate(ymdSelected);
                      setEditing(null);
                      setFormOpen(true);
                    }}
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
                    <div className="flex flex-col items-center justify-center py-16 text-center text-muted-foreground h-full">
                      <CalIcon className="h-10 w-10 text-muted-foreground/40 mb-3 animate-pulse" />
                      <p className="font-semibold text-sm">No hay citas programadas para este día.</p>
                      <p className="text-xs text-muted-foreground mt-1">Usa el botón a la izquierda para agendar una.</p>
                    </div>
                  ) : (
                    <div className="space-y-3 relative before:absolute before:left-8 before:top-4 before:bottom-4 before:w-0.5 before:bg-border/30">
                      {dayAppointments.map((a) => (
                        <div key={a.id} className="relative pl-14 group">
                          {/* Timeline bullet */}
                          <div className={cn(
                            "absolute left-8 top-5 -translate-x-1/2 flex h-3.5 w-3.5 items-center justify-center rounded-full border bg-background z-10 transition-all",
                            a.status === "programada" ? "border-mauve ring-4 ring-mauve/10" : "",
                            a.status === "completada" ? "border-sage ring-4 ring-sage/10" : "",
                            a.status === "cancelada" ? "border-destructive ring-4 ring-destructive/10" : ""
                          )} />
                          
                          {/* Appointment card */}
                          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border/60 bg-card/60 p-3.5 transition-all duration-300 hover:bg-card hover:shadow-sm">
                            <div className="flex items-center gap-3">
                              <div className="flex w-20 flex-col items-center justify-center gap-0.5 rounded-xl bg-muted px-2 py-1 text-xs font-bold">
                                <span className="text-[9px] text-muted-foreground uppercase">Hora</span>
                                <span className="text-sm text-mauve font-extrabold">{timeOnly(a.scheduled_at)}</span>
                              </div>
                              <div className="min-w-0">
                                <p className="truncate text-sm md:text-base font-bold">{a.patient_name}</p>
                                <p className="truncate text-xs text-muted-foreground mt-0.5">
                                  {a.reason || "—"} · {doctorMap.get(a.doctor_id) || "Doctor"}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className={cn("rounded-full px-2.5 py-0.5 text-[11px] font-medium capitalize", statusBg[a.status])}>{a.status}</span>
                              {a.status === "programada" && (
                                <>
                                  <button
                                    onClick={() => handleSendWhatsAppReminder(a)}
                                    className="flex h-8 w-8 items-center justify-center rounded-xl text-muted-foreground transition hover:bg-emerald-500/15 hover:text-emerald-600 cursor-pointer"
                                    title="Enviar recordatorio de WhatsApp"
                                    aria-label="WhatsApp"
                                  >
                                    <MessageCircle className="h-4 w-4" />
                                  </button>
                                  <button onClick={() => changeStatus(a.id, "completada")} className="flex h-8 w-8 items-center justify-center rounded-xl text-muted-foreground transition hover:bg-sage/30 hover:text-sage-foreground cursor-pointer" aria-label="Marcar completada">
                                    <CheckCircle2 className="h-4 w-4" />
                                  </button>
                                  <button onClick={() => changeStatus(a.id, "cancelada")} className="flex h-8 w-8 items-center justify-center rounded-xl text-muted-foreground transition hover:bg-destructive/10 hover:text-destructive cursor-pointer" aria-label="Cancelar">
                                    <XCircle className="h-4 w-4" />
                                  </button>
                                </>
                              )}
                              {(a.status === "completada" || a.status === "programada") && (
                                <button
                                  onClick={() => {
                                    setConsultationApp(a);
                                    setConsultationOpen(true);
                                  }}
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
                              <button onClick={() => { setEditing(a); setFormOpen(true); }} className="flex h-8 w-8 items-center justify-center rounded-xl text-muted-foreground transition hover:bg-mauve/10 hover:text-mauve" aria-label="Editar">
                                <Pencil className="h-3.5 w-3.5" />
                              </button>
                              <button onClick={() => setToDelete(a)} className="flex h-8 w-8 items-center justify-center rounded-xl text-muted-foreground transition hover:bg-destructive/10 hover:text-destructive" aria-label="Eliminar">
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Appointment form dialog */}
      <AppointmentForm 
        open={formOpen} 
        onOpenChange={setFormOpen} 
        appointment={editing} 
        defaultDate={defaultFormDate}
      />

      {/* Delete Confirmation Alert Dialog */}
      <AlertDialog open={!!toDelete} onOpenChange={(o) => !o && setToDelete(null)}>
        <AlertDialogContent className="rounded-3xl">
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar cita?</AlertDialogTitle>
            <AlertDialogDescription>
              La cita de {toDelete?.patient_name} se eliminará. Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Consultation form dialog */}
      <ConsultationForm
        open={consultationOpen}
        onOpenChange={setConsultationOpen}
        appointment={consultationApp}
      />
    </div>
  );
}
