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

function SidebarBody({ onNavigate }: { onNavigate?: () => void }) {
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
    <div className="flex flex-col h-full bg-white text-[#2b3674] border-r border-[#f0f2f5]">
      {/* Logo Area */}
      <div className="pt-6 px-6 pb-4">
        <div className="flex items-center gap-2 mb-6">
          <div className="text-[#4361ee]">
            <Building2 className="h-6 w-6" strokeWidth={2.5} />
          </div>
          <span className="font-bold text-xl tracking-tight text-[#2b3674]">FemeSalud</span>
        </div>

        {/* Clinic Info Box */}
        <div className="bg-[#f8f9fb] border border-[#f0f2f5] rounded-xl p-3 flex gap-3 items-center mb-6">
          <div className="bg-white p-2 rounded-lg shadow-sm">
            <Building2 className="h-4 w-4 text-[#a3aed1]" />
          </div>
          <div>
            <p className="text-xs font-bold text-[#2b3674] leading-tight">{clinic?.name || "Clínica FemeSalud"}</p>
            <p className="text-[9px] text-[#a3aed1] font-medium leading-tight mt-0.5 truncate max-w-[140px]">
              {clinic?.address_line1 || "Valle de la Pascua, Guárico"}
            </p>
          </div>
        </div>
      </div>

      {/* Navigation List */}
      <nav className="flex-1 w-full overflow-y-auto no-scrollbar px-4 pb-6 flex flex-col gap-1">
        {navigation.map((m, i) => {
          if (m.adminOnly && !isAdmin) return null;

          if (m.category) {
            return (
              <div key={`cat-${i}`} className="mt-4 mb-1 px-3">
                <span className="text-[10px] font-bold text-[#a3aed1] uppercase tracking-wider">
                  {m.category}
                </span>
              </div>
            );
          }

          const active = pathname === m.url || (m.url !== "/" && !m.url?.startsWith("#") && pathname.startsWith(m.url || ""));
          const Icon = m.icon;
          const isDummy = m.url?.startsWith("#");

          return (
            <Link
              key={m.title}
              to={isDummy ? "/" : m.url!}
              onClick={(e) => {
                if (isDummy) e.preventDefault();
                else if (onNavigate) onNavigate();
              }}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group text-sm font-bold",
                active
                  ? "bg-[#4361ee] text-white shadow-md shadow-blue-500/20"
                  : "text-[#a3aed1] hover:text-[#2b3674] hover:bg-[#f8f9fb]"
              )}
            >
              <Icon
                className={cn(
                  "h-4 w-4",
                  active ? "text-white" : "text-[#a3aed1] group-hover:text-[#2b3674]"
                )}
                strokeWidth={2.5}
              />
              <span>{m.title}</span>
            </Link>
          );
        })}

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group text-sm font-bold text-[#a3aed1] hover:text-red-500 hover:bg-red-50 mt-2"
        >
          <LogOut className="h-4 w-4 text-[#a3aed1] group-hover:text-red-500" strokeWidth={2.5} />
          <span>Log out</span>
        </button>
      </nav>
    </div>
  );
}

export function AppSidebar() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="fixed left-0 top-0 bottom-0 z-30 hidden w-[260px] flex-col bg-white md:flex shadow-[4px_0_24px_rgba(0,0,0,0.02)]">
        {/* Collapse Button (Decorative based on image) */}
        <button className="absolute -right-3 top-8 h-6 w-6 bg-white border border-[#f0f2f5] rounded-full flex items-center justify-center text-[#a3aed1] hover:text-[#2b3674] shadow-sm z-40">
          <ChevronLeft className="h-3 w-3" strokeWidth={3} />
        </button>
        <SidebarBody />
      </aside>

      {/* Mobile Toggle */}
      <button
        onClick={() => setMobileOpen(true)}
        aria-label="Abrir menú"
        className="fixed left-4 top-4 z-40 flex h-11 w-11 items-center justify-center rounded-2xl bg-white shadow-sm border border-[#f0f2f5] md:hidden text-[#2b3674]"
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Mobile Backdrop */}
      <div
        onClick={() => setMobileOpen(false)}
        className={cn(
          "fixed inset-0 z-40 bg-black/20 backdrop-blur-sm transition-opacity duration-300 md:hidden",
          mobileOpen ? "opacity-100" : "pointer-events-none opacity-0"
        )}
      />
      
      {/* Mobile Sidebar */}
      <aside
        className={cn(
          "fixed left-0 top-0 bottom-0 z-50 flex w-[260px] flex-col bg-white shadow-2xl transition-transform duration-300 ease-out md:hidden",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <button
          onClick={() => setMobileOpen(false)}
          className="absolute right-4 top-6 flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 z-50"
        >
          <X className="h-4 w-4" />
        </button>
        <SidebarBody onNavigate={() => setMobileOpen(false)} />
      </aside>
    </>
  );
}
