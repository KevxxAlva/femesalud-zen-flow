import { Link, useRouterState } from "@tanstack/react-router";
import {
  Home,
  Calendar,
  Users,
  FileText,
  FlaskConical,
  Receipt,
  Package,
  Stethoscope,
  UserRound,
  Settings,
  Heart,
} from "lucide-react";
import { cn } from "@/lib/utils";

const modules = [
  { title: "Inicio", url: "/", icon: Home },
  { title: "Agenda", url: "/agenda", icon: Calendar },
  { title: "Pacientes", url: "/pacientes", icon: Users },
  { title: "Historias Clínicas", url: "/historias", icon: FileText },
  { title: "Laboratorio", url: "/laboratorio", icon: FlaskConical },
  { title: "Facturación", url: "/facturacion", icon: Receipt },
  { title: "Inventario", url: "/inventario", icon: Package },
  { title: "Servicios Médicos", url: "/servicios", icon: Stethoscope },
  { title: "Doctores", url: "/doctores", icon: UserRound },
  { title: "Configuración", url: "/configuracion", icon: Settings },
];

export function AppSidebar() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <aside className="fixed left-4 top-4 bottom-4 z-30 hidden w-64 flex-col rounded-3xl glass-card shadow-sm md:flex">
      <div className="flex items-center gap-2.5 px-6 pt-6 pb-8">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-mauve to-mauve-soft shadow-sm">
          <Heart className="h-5 w-5 text-primary-foreground" fill="currentColor" />
        </div>
        <div>
          <h1 className="text-base font-semibold tracking-tight">FemeSalud</h1>
          <p className="text-[11px] text-muted-foreground">Premium Clinical Suite</p>
        </div>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3">
        {modules.map((m) => {
          const active = pathname === m.url;
          const Icon = m.icon;
          return (
            <Link
              key={m.url}
              to={m.url}
              className={cn(
                "group flex items-center gap-3 rounded-2xl px-3.5 py-2.5 text-sm font-medium transition-all duration-300",
                active
                  ? "bg-gradient-to-r from-mauve to-mauve-soft text-primary-foreground shadow-sm shadow-mauve/30"
                  : "text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
              )}
            >
              <Icon
                className={cn(
                  "h-[18px] w-[18px] transition-transform duration-300",
                  active ? "scale-110" : "group-hover:scale-105",
                )}
                strokeWidth={active ? 2.4 : 2}
              />
              <span>{m.title}</span>
            </Link>
          );
        })}
      </nav>

      <div className="m-3 rounded-2xl bg-gradient-to-br from-blush/60 to-accent/50 p-4">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-full bg-gradient-to-br from-mauve to-blush" />
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">Dra. Lucía Vega</p>
            <p className="truncate text-[11px] text-muted-foreground">Ginecología</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
