import { useMemo } from "react";
import {
  Activity, CalendarClock, TrendingUp, Users, Sparkles, ArrowUpRight,
  Clock, Plus, Search, Bell,
} from "lucide-react";
import { Link } from "@tanstack/react-router";
import { cn } from "@/lib/utils";
import { usePatients } from "@/lib/api/patients";
import { useAppointments } from "@/lib/api/appointments";
import { useAuthSession, useIsAdmin } from "@/hooks/useAuth";
import { useMyProfile, useDoctors } from "@/lib/api/profiles";

function Sparkline({ data, className }: { data: number[]; className?: string }) {
  const w = 120, h = 36;
  const max = Math.max(...data, 1);
  const min = Math.min(...data);
  const range = max - min || 1;
  const pts = data.map((v, i) => `${(i / Math.max(data.length - 1, 1)) * w},${h - ((v - min) / range) * h}`).join(" ");
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className={cn("h-9 w-full", className)} preserveAspectRatio="none">
      <polygon points={`0,${h} ${pts} ${w},${h}`} fill="currentColor" opacity="0.15" />
      <polyline points={pts} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

const statusBg: Record<string, string> = {
  programada: "bg-mauve/15 text-mauve",
  completada: "bg-sage/50 text-sage-foreground",
  cancelada: "bg-destructive/15 text-destructive",
};

const tagBg: Record<string, string> = {
  activo: "bg-sage/50 text-sage-foreground",
  en_tratamiento: "bg-mauve/15 text-mauve",
  nuevo: "bg-blush/60 text-blush-foreground",
  alta: "bg-muted text-muted-foreground",
};

const initials = (n: string) => (n || "?").split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase();

export function Dashboard() {
  const { user } = useAuthSession();
  const isAdmin = useIsAdmin();
  const { data: profile } = useMyProfile(user?.id);
  const { data: patients = [] } = usePatients();
  const { data: appointments = [] } = useAppointments();
  const { data: doctors = [] } = useDoctors();

  const doctorMap = useMemo(() => new Map(doctors.map((d) => [d.id, d.full_name || d.email])), [doctors]);
  const today = new Date().toISOString().slice(0, 10);

  const stats = useMemo(() => {
    const todays = appointments.filter((a) => a.scheduled_at.slice(0, 10) === today);
    const upcoming = appointments
      .filter((a) => a.status === "programada" && a.scheduled_at.slice(0, 10) >= today)
      .sort((a, b) => a.scheduled_at.localeCompare(b.scheduled_at))
      .slice(0, 5);
    const recent = [...patients]
      .sort((a, b) => b.updated_at.localeCompare(a.updated_at))
      .slice(0, 4);
    const completed = appointments.filter((a) => a.status === "completada");
    const income = completed.reduce((acc, a) => acc + (Number(a.price) || 220), 0);
    const consultSpark = Array.from({ length: 10 }).map((_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (9 - i));
      const iso = d.toISOString().slice(0, 10);
      return appointments.filter((a) => a.scheduled_at.slice(0, 10) === iso).length;
    });
    const patientSpark = Array.from({ length: 10 }).map((_, i) => Math.max(1, patients.length - (9 - i)));
    const incomeSpark = consultSpark.map((v) => 10 + v * 4);
    return { todays, upcoming, recent, income, completed: completed.length, consultSpark, patientSpark, incomeSpark };
  }, [appointments, patients, today]);

  const displayName = profile?.full_name?.trim() || user?.email?.split("@")[0] || "Doctor";

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="ml-14 md:ml-0">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground" suppressHydrationWarning>
            {new Date().toLocaleDateString("es-ES", { weekday: "long", day: "2-digit", month: "long", year: "numeric" })}
          </p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">Buen día, {displayName}</h1>
        </div>
        <div className="flex items-center gap-2">
          <div className="hidden items-center gap-2 rounded-2xl glass-card px-4 py-2.5 sm:flex">
            <Search className="h-4 w-4 text-muted-foreground" />
            <input placeholder="Buscar pacientes, citas..." className="w-56 bg-transparent text-sm outline-none placeholder:text-muted-foreground" />
          </div>
          <button className="rounded-2xl glass-card p-2.5 transition hover:bg-accent"><Bell className="h-4 w-4" /></button>
          <Link to="/agenda" className="flex items-center gap-2 rounded-2xl bg-gradient-to-r from-mauve to-mauve-soft px-4 py-2.5 text-sm font-medium text-primary-foreground shadow-sm shadow-mauve/30 transition hover:shadow-md">
            <Plus className="h-4 w-4" /> Nueva cita
          </Link>
        </div>
      </header>

      <div className="grid grid-cols-12 gap-5">
        <div className="relative col-span-12 overflow-hidden rounded-3xl bg-gradient-to-br from-mauve via-mauve-soft to-blush p-8 text-primary-foreground shadow-sm lg:col-span-8">
          <div className="absolute -right-16 -top-16 h-64 w-64 rounded-full bg-white/15 blur-3xl" />
          <div className="absolute -bottom-10 right-20 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
          <div className="relative max-w-lg">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1 text-[11px] font-medium backdrop-blur">
              <Sparkles className="h-3 w-3" /> Resumen inteligente del día
            </div>
            <h2 className="mt-4 font-display text-3xl font-semibold leading-tight tracking-tight md:text-4xl">
              {isAdmin ? "Visión completa de la clínica." : "Tu jornada luce tranquila."}
            </h2>
            <p className="mt-2 text-sm text-primary-foreground/85">
              Hoy hay {stats.todays.length} citas, {patients.length} pacientes {isAdmin ? "en total" : "asignados"} y {stats.completed} consultas completadas.
            </p>
            <div className="mt-6 flex flex-wrap gap-2">
              <Link to="/agenda" className="rounded-2xl bg-white px-4 py-2 text-sm font-medium text-mauve transition hover:bg-white/90">Ver agenda</Link>
              <Link to="/pacientes" className="rounded-2xl bg-white/15 px-4 py-2 text-sm font-medium backdrop-blur transition hover:bg-white/25">Ver pacientes</Link>
            </div>
          </div>
        </div>

        <div className="col-span-12 rounded-3xl glass-card p-6 shadow-sm lg:col-span-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Pulso de la clínica</p>
              <h3 className="mt-1 text-lg font-semibold">Actividad ahora</h3>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-sage/40 text-sage-foreground">
              <Activity className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-5 space-y-3">
            {[
              { label: "Ocupación de salas", value: Math.min(100, stats.todays.length * 12), tone: "bg-mauve" },
              { label: "Citas completadas", value: Math.min(100, stats.completed * 15), tone: "bg-blush-foreground" },
              { label: "Satisfacción", value: 94, tone: "bg-sage-foreground" },
            ].map((m) => (
              <div key={m.label}>
                <div className="mb-1 flex justify-between text-xs">
                  <span className="text-muted-foreground">{m.label}</span>
                  <span className="font-medium">{m.value}%</span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                  <div className={cn("h-full rounded-full transition-all", m.tone)} style={{ width: `${m.value}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {[
          { label: "Consultas hoy", value: stats.todays.length.toString(), delta: "+12%", icon: CalendarClock, tone: "text-mauve", spark: stats.consultSpark },
          { label: "Pacientes totales", value: patients.length.toString(), delta: "+5%", icon: Users, tone: "text-blush-foreground", spark: stats.patientSpark },
          { label: "Ingresos del mes", value: `$${(stats.income / 1000).toFixed(1)}k`, delta: "+18%", icon: TrendingUp, tone: "text-sage-foreground", spark: stats.incomeSpark },
        ].map((k) => {
          const Icon = k.icon;
          return (
            <div key={k.label} className="col-span-12 rounded-3xl glass-card p-5 shadow-sm sm:col-span-6 lg:col-span-4">
              <div className="flex items-start justify-between">
                <div className={cn("flex h-10 w-10 items-center justify-center rounded-2xl bg-muted", k.tone)}>
                  <Icon className="h-5 w-5" />
                </div>
                <span className="inline-flex items-center gap-1 rounded-full bg-sage/40 px-2 py-0.5 text-[11px] font-medium text-sage-foreground">
                  <ArrowUpRight className="h-3 w-3" />{k.delta}
                </span>
              </div>
              <div className="mt-4 flex items-end justify-between gap-3">
                <div>
                  <p className="text-xs text-muted-foreground">{k.label}</p>
                  <p className="font-display text-2xl font-semibold tracking-tight">{k.value}</p>
                </div>
                <div className={cn("w-24", k.tone)}><Sparkline data={k.spark} /></div>
              </div>
            </div>
          );
        })}

        <div className="col-span-12 rounded-3xl glass-card p-6 shadow-sm lg:col-span-7">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Línea de tiempo</p>
              <h3 className="mt-1 text-lg font-semibold">Próximas citas</h3>
            </div>
            <Link to="/agenda" className="text-xs font-medium text-mauve hover:underline">Ver agenda →</Link>
          </div>

          <div className="relative mt-6 pl-6">
            <div className="absolute left-2 top-1 bottom-1 w-px bg-gradient-to-b from-mauve via-blush to-transparent" />
            {stats.upcoming.length === 0 && (
              <p className="py-6 text-center text-sm text-muted-foreground">No hay citas programadas.</p>
            )}
            {stats.upcoming.map((a) => {
              const d = a.scheduled_at.slice(0, 10);
              const dt = new Date(a.scheduled_at);
              const pad = (n: number) => String(n).padStart(2, "0");
              const time = `${pad(dt.getHours())}:${pad(dt.getMinutes())}`;
              return (
                <div key={a.id} className="relative mb-5 last:mb-0">
                  <div className="absolute -left-[18px] top-1.5 h-3 w-3 rounded-full border-2 border-background bg-gradient-to-br from-mauve to-mauve-soft shadow-sm" />
                  <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-border/60 bg-card/50 p-3.5 transition-all duration-300 hover:bg-card hover:shadow-sm">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1.5 rounded-xl bg-muted px-2.5 py-1 text-xs font-medium" suppressHydrationWarning>
                        <Clock className="h-3 w-3 text-mauve" />
                        {d === today ? "Hoy" : new Date(d + "T00:00:00").toLocaleDateString("es-ES", { day: "2-digit", month: "short" })} · {time}
                      </div>
                      <div>
                        <p className="text-sm font-semibold">{a.patient_name}</p>
                        <p className="text-xs text-muted-foreground">{a.reason || "—"} · {doctorMap.get(a.doctor_id) || "Doctor"}</p>
                      </div>
                    </div>
                    <span className={cn("rounded-full px-2.5 py-0.5 text-[11px] font-medium capitalize", statusBg[a.status])}>
                      {a.status}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="col-span-12 rounded-3xl glass-card p-6 shadow-sm lg:col-span-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Atendidos recientemente</p>
              <h3 className="mt-1 text-lg font-semibold">Pacientes recientes</h3>
            </div>
            <Link to="/pacientes" className="text-xs font-medium text-mauve hover:underline">Ver todos →</Link>
          </div>
          <ul className="mt-5 space-y-2.5">
            {stats.recent.length === 0 && <li className="py-6 text-center text-sm text-muted-foreground">Aún no hay pacientes.</li>}
            {stats.recent.map((p) => (
              <li key={p.id} className="flex items-center justify-between rounded-2xl p-2.5 transition-all duration-300 hover:bg-muted/60">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-mauve/80 to-blush text-sm font-semibold text-primary-foreground shadow-sm">
                    {initials(p.full_name)}
                  </div>
                  <div>
                    <p className="text-sm font-semibold">{p.full_name}</p>
                    <p className="text-[11px] text-muted-foreground" suppressHydrationWarning>
                      {doctorMap.get(p.assigned_doctor_id ?? "") || "Sin asignar"}
                    </p>
                  </div>
                </div>
                <span className={cn("rounded-full px-2.5 py-0.5 text-[11px] font-medium", tagBg[p.status] || "bg-muted text-muted-foreground")}>
                  {p.status}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
