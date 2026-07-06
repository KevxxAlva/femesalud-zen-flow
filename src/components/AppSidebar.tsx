import { useState } from "react";
import { Link, useRouterState, useRouter } from "@tanstack/react-router";
import { motion } from "framer-motion";
import {
  Home, Calendar, Users, FileText, Receipt, FileBarChart,
  Stethoscope, UserRound, Settings, Heart, Menu, X, LogOut, Shield,
  Sun, Moon, Megaphone,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuthSession, useIsAdmin } from "@/hooks/useAuth";
import { useMyProfile } from "@/lib/api/profiles";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { useTheme } from "@/hooks/useTheme";

const baseModules = [
  { title: "Inicio", url: "/", icon: Home },
  { title: "Agenda", url: "/agenda", icon: Calendar },
  { title: "Pacientes", url: "/pacientes", icon: Users },
  { title: "Historias Clínicas", url: "/historias", icon: FileText },
  { title: "Reportes", url: "/reportes", icon: FileBarChart },
  { title: "Facturación", url: "/facturacion", icon: Receipt },
  { title: "Servicios Médicos", url: "/servicios", icon: Stethoscope },
  { title: "Marketing / CRM", url: "/crm", icon: Megaphone },
] as const;

const adminModules = [
  { title: "Doctores", url: "/doctores", icon: UserRound },
  { title: "Configuración", url: "/configuracion", icon: Settings },
] as const;

const initials = (n: string) =>
  (n || "U").split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase();

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, x: -20, filter: "blur(4px)" },
  show: { 
    opacity: 1, 
    x: 0, 
    filter: "blur(0px)",
    transition: { type: "spring", stiffness: 300, damping: 24 } 
  },
};

function SidebarBody({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { user } = useAuthSession();
  const { data: profile } = useMyProfile(user?.id);
  const isAdmin = useIsAdmin();
  const router = useRouter();
  const qc = useQueryClient();
  const { isDark, toggleTheme } = useTheme();

  const modules = [...baseModules, ...(isAdmin ? adminModules : [])];

  const handleLogout = async () => {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    router.navigate({ to: "/auth", replace: true });
  };

  return (
    <>
      <div className="flex items-center gap-2.5 px-6 pt-6 pb-6">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-mauve to-mauve-soft shadow-sm">
          <Heart className="h-5 w-5 text-primary-foreground" fill="currentColor" />
        </div>
        <div>
          <h1 className="text-base font-semibold tracking-tight">FemeSalud</h1>
          <p className="text-[11px] text-muted-foreground">Premium Clinical Suite</p>
        </div>
      </div>
      <motion.nav 
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="flex-1 space-y-1 overflow-y-auto px-3"
      >
        {modules.map((m) => {
          const active = pathname === m.url;
          const Icon = m.icon;
          return (
            <motion.div key={m.url} variants={itemVariants}>
              <Link
                to={m.url}
                onClick={onNavigate}
                className={cn(
                  "group flex items-center gap-3 rounded-2xl px-3.5 py-2.5 text-sm font-medium transition-all duration-300",
                  active
                    ? "bg-gradient-to-r from-mauve to-mauve-soft text-primary-foreground shadow-sm shadow-mauve/30"
                    : "text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground hover:scale-[1.02]",
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
            </motion.div>
          );
        })}
      </motion.nav>
      <div className="m-3 rounded-2xl bg-gradient-to-br from-blush/60 to-accent/50 p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-mauve to-blush text-xs font-semibold text-primary-foreground">
            {initials(profile?.full_name || user?.email || "U")}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold">
              {profile?.full_name?.trim() || user?.email?.split("@")[0] || "Usuario"}
            </p>
            <p className="truncate text-[11px] text-muted-foreground flex items-center gap-1">
              {isAdmin && <Shield className="h-3 w-3 text-mauve" />}
              {isAdmin ? "Administrador" : profile?.specialty || "Doctor"}
            </p>
          </div>
          <button
            onClick={toggleTheme}
            aria-label="Cambiar tema"
            className="flex h-8 w-8 items-center justify-center rounded-xl text-muted-foreground transition hover:bg-mauve/10 hover:text-mauve"
          >
            {isDark ? <Sun className="h-4.5 w-4.5" /> : <Moon className="h-4.5 w-4.5" />}
          </button>
          <button
            onClick={handleLogout}
            aria-label="Cerrar sesión"
            className="flex h-8 w-8 items-center justify-center rounded-xl text-muted-foreground transition hover:bg-destructive/10 hover:text-destructive"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </>
  );
}

export function AppSidebar() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      <aside className="fixed left-4 top-4 bottom-4 z-30 hidden w-64 flex-col rounded-3xl glass-card shadow-sm md:flex">
        <SidebarBody />
      </aside>

      <button
        onClick={() => setMobileOpen(true)}
        aria-label="Abrir menú"
        className="fixed left-4 top-4 z-40 flex h-11 w-11 items-center justify-center rounded-2xl glass-card shadow-sm md:hidden"
      >
        <Menu className="h-5 w-5" />
      </button>

      <div
        onClick={() => setMobileOpen(false)}
        className={cn(
          "fixed inset-0 z-40 bg-foreground/30 backdrop-blur-sm transition-opacity duration-300 md:hidden",
          mobileOpen ? "opacity-100" : "pointer-events-none opacity-0",
        )}
      />
      <aside
        className={cn(
          "fixed left-3 top-3 bottom-3 z-50 flex w-64 flex-col rounded-3xl glass-card shadow-lg transition-all duration-300 ease-out md:hidden",
          mobileOpen ? "translate-x-0 opacity-100" : "-translate-x-[110%] opacity-0",
        )}
      >
        <button
          onClick={() => setMobileOpen(false)}
          aria-label="Cerrar menú"
          className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-xl text-muted-foreground hover:bg-muted"
        >
          <X className="h-4 w-4" />
        </button>
        <SidebarBody onNavigate={() => setMobileOpen(false)} />
      </aside>
    </>
  );
}
