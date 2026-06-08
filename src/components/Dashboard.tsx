import {
  Activity,
  CalendarClock,
  TrendingUp,
  Users,
  Sparkles,
  ArrowUpRight,
  Clock,
  Plus,
  Search,
  Bell,
} from "lucide-react";
import { cn } from "@/lib/utils";

const kpis = [
  {
    label: "Consultas hoy",
    value: "24",
    delta: "+12%",
    icon: CalendarClock,
    tone: "mauve",
    spark: [6, 9, 7, 12, 10, 14, 18, 16, 20, 24],
  },
  {
    label: "Pacientes atendidos",
    value: "187",
    delta: "+5%",
    icon: Users,
    tone: "blush",
    spark: [40, 52, 48, 60, 55, 70, 68, 82, 90, 95],
  },
  {
    label: "Ingresos del mes",
    value: "$48.2k",
    delta: "+18%",
    icon: TrendingUp,
    tone: "sage",
    spark: [10, 14, 12, 18, 22, 20, 28, 32, 30, 38],
  },
];

const appointments = [
  { time: "09:00", name: "María Fernández", reason: "Control prenatal", status: "Confirmada" },
  { time: "10:30", name: "Sofía Castillo", reason: "Revisión anual", status: "En sala" },
  { time: "11:45", name: "Camila Torres", reason: "Ecografía", status: "Pendiente" },
  { time: "13:15", name: "Valentina Ríos", reason: "Consulta general", status: "Confirmada" },
  { time: "15:00", name: "Isabella Núñez", reason: "Seguimiento", status: "Confirmada" },
];

const patients = [
  { name: "Ana Morales", tag: "Control", tone: "sage", initials: "AM" },
  { name: "Luciana Paz", tag: "Lab pendiente", tone: "blush", initials: "LP" },
  { name: "Renata Silva", tag: "Receta enviada", tone: "mauve", initials: "RS" },
  { name: "Daniela Ortiz", tag: "Nueva", tone: "sage", initials: "DO" },
];

function Sparkline({ data, className }: { data: number[]; className?: string }) {
  const w = 120;
  const h = 36;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const pts = data
    .map((v, i) => {
      const x = (i / (data.length - 1)) * w;
      const y = h - ((v - min) / range) * h;
      return `${x},${y}`;
    })
    .join(" ");
  const area = `0,${h} ${pts} ${w},${h}`;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className={cn("h-9 w-full", className)} preserveAspectRatio="none">
      <polygon points={area} fill="currentColor" opacity="0.15" />
      <polyline points={pts} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

const toneMap: Record<string, string> = {
  mauve: "text-mauve",
  blush: "text-blush-foreground",
  sage: "text-sage-foreground",
};
const tagBg: Record<string, string> = {
  mauve: "bg-mauve/15 text-mauve",
  blush: "bg-blush/60 text-blush-foreground",
  sage: "bg-sage/50 text-sage-foreground",
};
const statusBg: Record<string, string> = {
  Confirmada: "bg-sage/50 text-sage-foreground",
  "En sala": "bg-mauve/15 text-mauve",
  Pendiente: "bg-blush/60 text-blush-foreground",
};

export function Dashboard() {
  return (
    <div className="space-y-6">
      {/* Top bar */}
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Lunes · 08 Junio 2026
          </p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">Buen día, Dra. Lucía</h1>
        </div>
        <div className="flex items-center gap-2">
          <div className="hidden items-center gap-2 rounded-2xl glass-card px-4 py-2.5 sm:flex">
            <Search className="h-4 w-4 text-muted-foreground" />
            <input
              placeholder="Buscar pacientes, citas..."
              className="w-56 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
          </div>
          <button className="rounded-2xl glass-card p-2.5 transition hover:bg-accent">
            <Bell className="h-4 w-4" />
          </button>
          <button className="flex items-center gap-2 rounded-2xl bg-gradient-to-r from-mauve to-mauve-soft px-4 py-2.5 text-sm font-medium text-primary-foreground shadow-sm shadow-mauve/30 transition hover:shadow-md">
            <Plus className="h-4 w-4" />
            Nueva cita
          </button>
        </div>
      </header>

      {/* Bento grid */}
      <div className="grid grid-cols-12 gap-5">
        {/* Hero welcome */}
        <div className="relative col-span-12 overflow-hidden rounded-3xl bg-gradient-to-br from-mauve via-mauve-soft to-blush p-8 text-primary-foreground shadow-sm lg:col-span-8">
          <div className="absolute -right-16 -top-16 h-64 w-64 rounded-full bg-white/15 blur-3xl" />
          <div className="absolute -bottom-10 right-20 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
          <div className="relative max-w-lg">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1 text-[11px] font-medium backdrop-blur">
              <Sparkles className="h-3 w-3" />
              Resumen inteligente del día
            </div>
            <h2 className="mt-4 font-display text-3xl font-semibold leading-tight tracking-tight md:text-4xl">
              Tu jornada luce tranquila y bien organizada.
            </h2>
            <p className="mt-2 text-sm text-primary-foreground/85">
              Tienes 24 consultas programadas, 3 resultados de laboratorio por revisar y 2 recetas pendientes de firma.
            </p>
            <div className="mt-6 flex flex-wrap gap-2">
              <button className="rounded-2xl bg-white px-4 py-2 text-sm font-medium text-mauve transition hover:bg-white/90">
                Ver agenda completa
              </button>
              <button className="rounded-2xl bg-white/15 px-4 py-2 text-sm font-medium backdrop-blur transition hover:bg-white/25">
                Revisar laboratorios
              </button>
            </div>
          </div>
        </div>

        {/* Activity card */}
        <div className="col-span-12 rounded-3xl glass-card p-6 shadow-sm lg:col-span-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Pulso de la clínica
              </p>
              <h3 className="mt-1 text-lg font-semibold">Actividad ahora</h3>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-sage/40 text-sage-foreground">
              <Activity className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-5 space-y-3">
            {[
              { label: "Ocupación de salas", value: 72, tone: "bg-mauve" },
              { label: "Tiempo medio consulta", value: 58, tone: "bg-blush-foreground" },
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

        {/* KPI cards */}
        {kpis.map((k) => {
          const Icon = k.icon;
          return (
            <div key={k.label} className="col-span-12 rounded-3xl glass-card p-5 shadow-sm sm:col-span-6 lg:col-span-4">
              <div className="flex items-start justify-between">
                <div className={cn("flex h-10 w-10 items-center justify-center rounded-2xl bg-muted", toneMap[k.tone])}>
                  <Icon className="h-5 w-5" />
                </div>
                <span className="inline-flex items-center gap-1 rounded-full bg-sage/40 px-2 py-0.5 text-[11px] font-medium text-sage-foreground">
                  <ArrowUpRight className="h-3 w-3" />
                  {k.delta}
                </span>
              </div>
              <div className="mt-4 flex items-end justify-between gap-3">
                <div>
                  <p className="text-xs text-muted-foreground">{k.label}</p>
                  <p className="font-display text-2xl font-semibold tracking-tight">{k.value}</p>
                </div>
                <div className={cn("w-24", toneMap[k.tone])}>
                  <Sparkline data={k.spark} />
                </div>
              </div>
            </div>
          );
        })}

        {/* Appointments timeline */}
        <div className="col-span-12 rounded-3xl glass-card p-6 shadow-sm lg:col-span-7">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Línea de tiempo
              </p>
              <h3 className="mt-1 text-lg font-semibold">Próximas citas</h3>
            </div>
            <button className="text-xs font-medium text-mauve hover:underline">Ver agenda →</button>
          </div>

          <div className="relative mt-6 pl-6">
            <div className="absolute left-2 top-1 bottom-1 w-px bg-gradient-to-b from-mauve via-blush to-transparent" />
            {appointments.map((a) => (
              <div key={a.time} className="relative mb-5 last:mb-0">
                <div className="absolute -left-[18px] top-1.5 h-3 w-3 rounded-full border-2 border-background bg-gradient-to-br from-mauve to-mauve-soft shadow-sm" />
                <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-border/60 bg-card/50 p-3.5 transition-all duration-300 hover:bg-card hover:shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5 rounded-xl bg-muted px-2.5 py-1 text-xs font-medium">
                      <Clock className="h-3 w-3 text-mauve" />
                      {a.time}
                    </div>
                    <div>
                      <p className="text-sm font-semibold">{a.name}</p>
                      <p className="text-xs text-muted-foreground">{a.reason}</p>
                    </div>
                  </div>
                  <span className={cn("rounded-full px-2.5 py-0.5 text-[11px] font-medium", statusBg[a.status])}>
                    {a.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent patients */}
        <div className="col-span-12 rounded-3xl glass-card p-6 shadow-sm lg:col-span-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Atendidos recientemente
              </p>
              <h3 className="mt-1 text-lg font-semibold">Pacientes recientes</h3>
            </div>
            <button className="text-xs font-medium text-mauve hover:underline">Ver todos →</button>
          </div>
          <ul className="mt-5 space-y-2.5">
            {patients.map((p) => (
              <li
                key={p.name}
                className="flex items-center justify-between rounded-2xl p-2.5 transition-all duration-300 hover:bg-muted/60"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-mauve/80 to-blush text-sm font-semibold text-primary-foreground shadow-sm">
                    {p.initials}
                  </div>
                  <div>
                    <p className="text-sm font-semibold">{p.name}</p>
                    <p className="text-[11px] text-muted-foreground">Última visita · hoy</p>
                  </div>
                </div>
                <span className={cn("rounded-full px-2.5 py-0.5 text-[11px] font-medium", tagBg[p.tone])}>
                  {p.tag}
                </span>
              </li>
            ))}
          </ul>

          <div className="mt-5 rounded-2xl border border-dashed border-mauve/30 bg-mauve/5 p-3.5">
            <p className="text-xs text-muted-foreground">
              <span className="font-semibold text-mauve">Tip:</span> Puedes adjuntar notas de voz a cada historia clínica desde el detalle del paciente.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
