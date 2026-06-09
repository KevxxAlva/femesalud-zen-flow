import { useMemo, useState } from "react";
import { Plus, Calendar as CalIcon, Clock, Pencil, Trash2, CheckCircle2, XCircle, Filter, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { AppointmentForm } from "@/components/AppointmentForm";
import { useAppointments, useUpdateAppointment, useDeleteAppointment, type AppointmentWithPatient } from "@/lib/api/appointments";
import { useDoctors } from "@/lib/api/profiles";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

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

export function AgendaPage() {
  const { data: appointments = [], isLoading } = useAppointments();
  const { data: doctors = [] } = useDoctors();
  const update = useUpdateAppointment();
  const del = useDeleteAppointment();

  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("todas");
  const [scope, setScope] = useState<"hoy" | "semana" | "todas">("todas");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<AppointmentWithPatient | null>(null);
  const [toDelete, setToDelete] = useState<AppointmentWithPatient | null>(null);

  const today = new Date().toISOString().slice(0, 10);
  const weekEnd = useMemo(() => {
    const d = new Date(); d.setDate(d.getDate() + 7);
    return d.toISOString().slice(0, 10);
  }, []);

  const doctorMap = useMemo(() => new Map(doctors.map((d) => [d.id, d.full_name || d.email])), [doctors]);

  const filtered = useMemo(() => {
    return appointments.filter((a) => {
      const d = dateOnly(a.scheduled_at);
      if (filter !== "todas" && a.status !== filter) return false;
      if (scope === "hoy" && d !== today) return false;
      if (scope === "semana" && (d < today || d > weekEnd)) return false;
      return true;
    });
  }, [appointments, filter, scope, today, weekEnd]);

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

  const counts = useMemo(() => ({
    todas: appointments.length,
    programada: appointments.filter((a) => a.status === "programada").length,
    completada: appointments.filter((a) => a.status === "completada").length,
    cancelada: appointments.filter((a) => a.status === "cancelada").length,
  }), [appointments]);

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

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div className="ml-14 md:ml-0">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Módulo</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">Agenda</h1>
          <p className="text-sm text-muted-foreground">{filtered.length} citas mostradas</p>
        </div>
        <Button onClick={() => { setEditing(null); setFormOpen(true); }} className="rounded-2xl bg-gradient-to-r from-mauve to-mauve-soft text-primary-foreground shadow-sm shadow-mauve/30 hover:opacity-95">
          <Plus className="mr-1 h-4 w-4" /> Nueva cita
        </Button>
      </header>

      <div className="rounded-3xl glass-card p-4 shadow-sm">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
            <Filter className="h-3.5 w-3.5" /> Estado
          </div>
          <div className="flex flex-wrap gap-1.5">
            {FILTERS.map((f) => (
              <button key={f} onClick={() => setFilter(f)} className={cn(
                "rounded-full px-3.5 py-1.5 text-xs font-medium capitalize transition-all duration-300",
                filter === f ? "bg-gradient-to-r from-mauve to-mauve-soft text-primary-foreground shadow-sm shadow-mauve/20" : "bg-muted/60 text-muted-foreground hover:bg-muted",
              )}>
                {f} · {counts[f]}
              </button>
            ))}
          </div>
          <div className="mx-2 hidden h-5 w-px bg-border md:block" />
          <div className="flex gap-1.5">
            {(["hoy", "semana", "todas"] as const).map((s) => (
              <button key={s} onClick={() => setScope(s)} className={cn(
                "rounded-full px-3.5 py-1.5 text-xs font-medium capitalize transition-all duration-300",
                scope === s ? "bg-foreground text-background" : "bg-muted/60 text-muted-foreground hover:bg-muted",
              )}>{s}</button>
            ))}
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="rounded-3xl glass-card p-12 text-center"><Loader2 className="mx-auto h-6 w-6 animate-spin text-muted-foreground" /></div>
      ) : grouped.length === 0 ? (
        <div className="rounded-3xl glass-card p-12 text-center shadow-sm">
          <CalIcon className="mx-auto h-10 w-10 text-muted-foreground" />
          <p className="mt-3 text-sm text-muted-foreground">No hay citas que coincidan con los filtros.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {grouped.map(([date, items]) => {
            const d = new Date(date + "T00:00:00");
            const isToday = date === today;
            return (
              <section key={date} className="rounded-3xl glass-card p-5 shadow-sm">
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
                            <button onClick={() => changeStatus(a.id, "completada")} className="flex h-8 w-8 items-center justify-center rounded-xl text-muted-foreground transition hover:bg-sage/30 hover:text-sage-foreground" aria-label="Marcar completada">
                              <CheckCircle2 className="h-4 w-4" />
                            </button>
                            <button onClick={() => changeStatus(a.id, "cancelada")} className="flex h-8 w-8 items-center justify-center rounded-xl text-muted-foreground transition hover:bg-destructive/10 hover:text-destructive" aria-label="Cancelar">
                              <XCircle className="h-4 w-4" />
                            </button>
                          </>
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
        </div>
      )}

      <AppointmentForm open={formOpen} onOpenChange={setFormOpen} appointment={editing} />

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
    </div>
  );
}
