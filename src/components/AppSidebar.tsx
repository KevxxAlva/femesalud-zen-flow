import { useState } from "react";
import { Link, useRouterState, useRouter } from "@tanstack/react-router";
import {
  LayoutGrid, Calendar, UserRound, Stethoscope, Users,
  Wallet, ReceiptText, Bookmark, CreditCard,
  Box, Monitor, RotateCw, Headphones, Settings,
  Menu, X, LogOut, ChevronLeft, Building2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuthSession, useIsAdmin } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { useClinicInfo } from "@/lib/api/clinic";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { ChevronRight } from "lucide-react";
type ModuleDef = {
  category?: string;
  title?: string;
  url?: string;
  icon?: any;
  badge?: number;
  adminOnly?: boolean;
};

const navigation: ModuleDef[] = [
  { title: "Dashboard", url: "/", icon: LayoutGrid },
  { category: "CLÍNICA" },
  { title: "Agenda", url: "/agenda", icon: Calendar },
  { title: "Pacientes", url: "/pacientes", icon: UserRound },
  { title: "Tratamientos", url: "/servicios", icon: Stethoscope },
  { title: "Personal", url: "/doctores", icon: Users, adminOnly: true },
  { category: "FINANZAS" },
  { title: "Cuentas", url: "/cuentas", icon: Wallet, adminOnly: true },
  { title: "Ventas", url: "/facturacion", icon: ReceiptText },
  { title: "Compras", url: "/compras", icon: Bookmark, adminOnly: true },
  { title: "Métodos de Pago", url: "/metodos-pago", icon: CreditCard, adminOnly: true },
  { category: "ACTIVOS FÍSICOS" },
  { title: "Inventario", url: "/stocks", icon: Box, adminOnly: true },
  { title: "Periféricos", url: "/peripherals", icon: Monitor, adminOnly: true },
  { category: "OTROS" },
  { title: "Reportes", url: "/reportes", icon: RotateCw },
  { title: "Atención al Cliente", url: "/support", icon: Headphones },
  { title: "Configuración", url: "/configuracion", icon: Settings, adminOnly: true },
];

function SidebarBody({ onNavigate, isCollapsed }: { onNavigate?: () => void, isCollapsed?: boolean }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const isAdmin = useIsAdmin();
  const router = useRouter();
  const qc = useQueryClient();
  const { data: clinic } = useClinicInfo();

  const handleLogout = async () => {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    router.navigate({ to: "/auth", replace: true });
  };

  return (
    <TooltipProvider delayDuration={0}>
      <div className="flex flex-col h-full bg-card text-foreground border-r border-border/40 overflow-hidden">
        {/* Logo Area */}
        <div className={cn("pt-6 pb-4", isCollapsed ? "px-2" : "px-6")}>
          <div className={cn("flex items-center mb-6", isCollapsed ? "justify-center" : "gap-2")}>
            <div className="text-primary flex-shrink-0 bg-primary/10 p-2 rounded-xl">
              <Building2 className="h-6 w-6" strokeWidth={2.5} />
            </div>
            {!isCollapsed && <span className="font-display font-bold text-xl tracking-tight text-foreground truncate bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/70">FemeSalud</span>}
          </div>

          {/* Clinic Info Box */}
          {!isCollapsed && (
            <div className="bg-muted border border-border/40 rounded-xl p-3 flex gap-3 items-center mb-6">
              <div className="bg-background p-2 rounded-lg shadow-sm">
                <Building2 className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="overflow-hidden">
                <p className="text-xs font-bold text-foreground leading-tight truncate">{clinic?.name || "Clínica FemeSalud"}</p>
                <p className="text-[9px] text-muted-foreground font-medium leading-tight mt-0.5 truncate">
                  {clinic?.address_line1 || "Valle de la Pascua, Guárico"}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Navigation List */}
        <nav className="flex-1 w-full overflow-y-auto no-scrollbar px-4 pb-6 flex flex-col gap-1">
          {navigation.map((m, i) => {
            if (m.adminOnly && !isAdmin) return null;

            if (m.category) {
              if (isCollapsed) {
                return <div key={`cat-${i}`} className="mt-4 mb-1 border-t border-border/40" />;
              }
              return (
                <div key={`cat-${i}`} className="mt-4 mb-1 px-3">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider truncate">
                    {m.category}
                  </span>
                </div>
              );
            }

            const active = pathname === m.url || (m.url !== "/" && !m.url?.startsWith("#") && pathname.startsWith(m.url || ""));
            const Icon = m.icon;
            const isDummy = m.url?.startsWith("#");

            const linkContent = (
              <Link
                key={m.title}
                to={isDummy ? "/" : m.url!}
                onClick={(e) => {
                  if (isDummy) e.preventDefault();
                  else if (onNavigate) onNavigate();
                }}
                className={cn(
                  "flex items-center rounded-xl transition-all duration-200 group text-sm font-bold",
                  isCollapsed ? "justify-center h-10 w-10 mx-auto" : "gap-3 px-3 py-2.5",
                  active
                    ? "bg-gradient-to-r from-primary to-primary/90 text-primary-foreground shadow-lg shadow-primary/25 border border-primary/20"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                )}
              >
                <Icon
                  className={cn(
                    "h-4 w-4 flex-shrink-0",
                    active ? "text-primary-foreground" : "text-muted-foreground group-hover:text-foreground"
                  )}
                  strokeWidth={2.5}
                />
                {!isCollapsed && <span className="truncate">{m.title}</span>}
              </Link>
            );

            if (isCollapsed) {
              return (
                <Tooltip key={m.title}>
                  <TooltipTrigger asChild>
                    {linkContent}
                  </TooltipTrigger>
                  <TooltipContent side="right" className="font-bold">
                    {m.title}
                  </TooltipContent>
                </Tooltip>
              );
            }
            return linkContent;
          })}

          <div className={cn("mt-auto pt-2 flex flex-col gap-2", isCollapsed ? "items-center" : "px-2")}>
            {/* Logout */}
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={handleLogout}
                  className={cn(
                    "flex items-center rounded-xl transition-all duration-200 group text-sm font-bold text-muted-foreground hover:text-destructive hover:bg-destructive/10",
                    isCollapsed ? "justify-center h-10 w-10" : "flex-1 gap-3 px-3 py-2.5"
                  )}
                >
                  <LogOut className="h-4 w-4 text-muted-foreground group-hover:text-destructive flex-shrink-0" strokeWidth={2.5} />
                  {!isCollapsed && <span>Log out</span>}
                </button>
              </TooltipTrigger>
              {isCollapsed && <TooltipContent side="right" className="font-bold">Cerrar Sesión</TooltipContent>}
            </Tooltip>
            
            <div className={cn("flex", isCollapsed ? "justify-center w-full" : "justify-end w-full")}>
               <ThemeToggle />
            </div>
          </div>
        </nav>
      </div>
    </TooltipProvider>
  );
}

export function AppSidebar({ isCollapsed, onToggle }: { isCollapsed?: boolean; onToggle?: () => void }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className={cn(
        "fixed left-0 top-0 bottom-0 z-30 hidden flex-col bg-card md:flex shadow-[4px_0_24px_rgba(0,0,0,0.02)] transition-all duration-300",
        isCollapsed ? "w-[80px]" : "w-[260px]"
      )}>
        {/* Collapse Button */}
        <button 
          onClick={onToggle}
          className="absolute -right-3 top-8 h-6 w-6 bg-card border border-border/40 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground shadow-sm z-40 transition-transform hover:scale-110"
        >
          {isCollapsed ? (
            <ChevronRight className="h-3 w-3" strokeWidth={3} />
          ) : (
            <ChevronLeft className="h-3 w-3" strokeWidth={3} />
          )}
        </button>
        <SidebarBody isCollapsed={isCollapsed} />
      </aside>

      {/* Mobile Toggle */}
      <button
        onClick={() => setMobileOpen(true)}
        aria-label="Abrir menú"
        className="fixed left-4 top-4 z-40 flex h-11 w-11 items-center justify-center rounded-2xl bg-card shadow-sm border border-border/40 md:hidden text-foreground"
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Mobile Drawer Overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm transition-opacity md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}
      
      {/* Mobile Sidebar */}
      <aside
        className={cn(
          "fixed left-0 top-0 bottom-0 z-50 flex w-[260px] flex-col bg-card shadow-2xl transition-transform duration-300 ease-out md:hidden border-r border-border/40",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <button
          onClick={() => setMobileOpen(false)}
          className="absolute right-4 top-6 flex h-8 w-8 items-center justify-center rounded-full bg-muted text-muted-foreground hover:bg-muted/80 z-50"
        >
          <X className="h-4 w-4" />
        </button>
        <SidebarBody onNavigate={() => setMobileOpen(false)} />
      </aside>
    </>
  );
}
