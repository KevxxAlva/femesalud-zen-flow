import { useMemo, useState } from "react";
import { Plus, Calendar as CalIcon, Clock, Pencil, Trash2, CheckCircle2, XCircle, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { AppointmentForm } from "@/components/AppointmentForm";
import { store, useStore, type Appointment, type AppointmentStatus } from "@/lib/store";
import { cn } from "@/lib/utils";

const FILTERS = ["todas", "programada", "completada", "cancelada"] as const;

const statusBg: Record<AppointmentStatus, string> = {
  programada: "bg-mauve/15 text-mauve",
  completada: "bg-sage/50 text-sage-foreground",
  cancelada: "bg-destructive/15 text-destructive",
};

const todayISO = () => new Date().toISOString().slice(0, 10);

export function AgendaPage() {
  const appointments = useStore((s) => s.appointments);
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("todas");
  const [scope, setScope] = useState<"hoy" | "semana" | "todas">("todas");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Appointment | null>(null);
  const [toDelete, setToDelete] = useState<Appointment | null>(null);

  const today = todayISO();
  const weekEnd = useMemo(() => {
    const d = new Date(); d.setDate(d.getDate() + 7);
    return d.toISOString().slice(0, 10);
  }, []);

  const filtered = useMemo(() => {
    return appointments
      .filter((a) => {
        if (filter !== "todas" && a.status !== filter) return false;
        if (scope === "hoy" && a.date !== today) return false;
        if (scope === "semana" && (a.date < today || a.date > weekEnd)) return false;
        return true;
      })
      .sort((a, b) => (b.date + b.time).localeCompare(a.date + a.time));
  }, [appointments, filter, scope, today, weekEnd]);

  const grouped = useMemo(() => {
    const map = new Map<string, Appointment[]>();
    for (const a of filtered) {
      const list = map.get(a.date) ?? [];
      list.push(a);
      map.set(a.date, list);
    }
    return Array.from(map.entries()).sort(([a], [b]) => b.localeCompare(a));
  }, [filtered]);

  const counts = useMemo(() => ({
    todas: appointments.length,
    programada: appointments.filter((a) => a.status === "programada").length,
    completada: appointments.filter((a) => a.status === "completada").length,
    cancelada: appointments.filter((a) => a.status === "cancelada").length,
  }), [appointments]);

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

      {/* Quick filters */}
      <div className="rounded-3xl glass-card p-4 shadow-sm">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
            <Filter className="h-3.5 w-3.5" /> Estado
          </div>
          <div className="flex flex-wrap gap-1.5">
            {FILTERS.map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={cn(
                  "rounded-full px-3.5 py-1.5 text-xs font-medium capitalize transition-all duration-300",
                  filter === f
                    ? "bg-gradient-to-r from-mauve to-mauve-soft text-primary-foreground shadow-sm shadow-mauve/20"
                    : "bg-muted/60 text-muted-foreground hover:bg-muted",
                )}
              >
                {f} · {counts[f]}
              </button>
            ))}
          </div>
          <div className="mx-2 hidden h-5 w-px bg-border md:block" />
          <div className="flex gap-1.5">
            {(["hoy", "semana", "todas"] as const).map((s) => (
              <button
                key={s}
                onClick={() => setScope(s)}
                className={cn(
                  "rounded-full px-3.5 py-1.5 text-xs font-medium capitalize transition-all duration-300",
                  scope === s
                    ? "bg-foreground text-background"
                    : "bg-muted/60 text-muted-foreground hover:bg-muted",
                )}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Timeline grouped by date */}
      {grouped.length === 0 ? (
        <div className="rounded-3xl glass-card p-12 text-center shadow-sm">
          <CalIcon className="mx-auto h-10 w-10 text-muted-foreground" />
          <p className="mt-3 text-sm text-muted-foreground">No hay citas que coincidan con los filtros.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {grouped.map(([date, items]) => {
            const d = new Date(date);
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
                  {items.sort((a, b) => a.time.localeCompare(b.time)).map((a) => (
                    <div key={a.id} className="group flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border/60 bg-card/60 p-3.5 transition-all duration-300 hover:bg-card hover:shadow-sm">
                      <div className="flex items-center gap-3">
                        <div className="flex w-16 items-center justify-center gap-1 rounded-xl bg-muted px-2 py-1.5 text-xs font-semibold">
                          <Clock className="h-3 w-3 text-mauve" /> {a.time}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold">{a.patientName}</p>
                          <p className="truncate text-xs text-muted-foreground">{a.reason} · {a.doctor}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={cn("rounded-full px-2.5 py-0.5 text-[11px] font-medium capitalize", statusBg[a.status])}>
                          {a.status}
                        </span>
                        {a.status === "programada" && (
                          <>
                            <button
                              onClick={() => store.updateAppointment(a.id, { status: "completada" })}
                              className="flex h-8 w-8 items-center justify-center rounded-xl text-muted-foreground transition hover:bg-sage/30 hover:text-sage-foreground"
                              aria-label="Marcar completada"
                            >
                              <CheckCircle2 className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => store.updateAppointment(a.id, { status: "cancelada" })}
                              className="flex h-8 w-8 items-center justify-center rounded-xl text-muted-foreground transition hover:bg-destructive/10 hover:text-destructive"
                              aria-label="Cancelar"
                            >
                              <XCircle className="h-4 w-4" />
                            </button>
                          </>
                        )}
                        <button
                          onClick={() => { setEditing(a); setFormOpen(true); }}
                          className="flex h-8 w-8 items-center justify-center rounded-xl text-muted-foreground transition hover:bg-mauve/10 hover:text-mauve"
                          aria-label="Editar"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => setToDelete(a)}
                          className="flex h-8 w-8 items-center justify-center rounded-xl text-muted-foreground transition hover:bg-destructive/10 hover:text-destructive"
                          aria-label="Eliminar"
                        >
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
              Se eliminará la cita de {toDelete?.patientName} el {toDelete && new Date(toDelete.date).toLocaleDateString("es-ES")} a las {toDelete?.time}.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => { if (toDelete) store.deleteAppointment(toDelete.id); setToDelete(null); }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
