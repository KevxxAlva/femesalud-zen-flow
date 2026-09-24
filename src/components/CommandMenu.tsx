import { useEffect, useState } from "react";
import { Command } from "cmdk";
import { Search, User, FileText, Calendar, Plus, CalendarPlus, UserPlus } from "lucide-react";
import { usePatients } from "@/lib/api/patients";
import { useAppointments } from "@/lib/api/appointments";
import { useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function CommandMenu() {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const { data: patients = [] } = usePatients();
  const { data: appointments = [] } = useAppointments();
  const { data: invoices = [] } = useQuery({
    queryKey: ["global-search-invoices"],
    queryFn: async () => {
      const { data } = await supabase
        .from("facturas")
        .select("id_factura, total_general, fecha_emision, pacientes(nombre, apellido)");
      return data || [];
    }
  });
  
  const navigate = useNavigate();
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-start justify-center pt-[15vh]">
      <Command 
        className="w-full max-w-lg bg-card rounded-2xl shadow-2xl border border-border/50 overflow-hidden flex flex-col"
        label="Global Command Menu"
      >
        <div className="flex items-center px-4 py-3 border-b border-border/30 gap-3">
          <Search className="w-5 h-5 text-muted-foreground" />
          <Command.Input 
            value={search}
            onValueChange={setSearch}
            className="flex-1 bg-transparent outline-none placeholder:text-muted-foreground text-foreground text-base"
            placeholder="Buscar pacientes por nombre o cédula..." 
            autoFocus 
          />
          <button 
            onClick={() => setOpen(false)}
            className="text-[10px] uppercase font-bold text-muted-foreground bg-muted/50 px-2 py-1 rounded"
          >
            ESC
          </button>
        </div>

        <Command.List className="max-h-[300px] overflow-y-auto p-2 scrollbar-thin">
          <Command.Empty className="py-6 text-center text-sm text-muted-foreground">
            No se encontraron resultados.
          </Command.Empty>

          <Command.Group heading="Acciones Rápidas" className="text-xs font-bold text-muted-foreground px-2 py-2">
            <Command.Item
              onSelect={() => {
                navigate({ to: "/agenda" });
                setOpen(false);
                setSearch("");
              }}
              className="flex items-center gap-3 px-3 py-3 rounded-xl cursor-pointer aria-selected:bg-primary/10 aria-selected:text-primary text-foreground transition-colors mt-1"
            >
              <div className="h-8 w-8 bg-primary/10 rounded-full flex items-center justify-center text-primary">
                <CalendarPlus className="w-4 h-4" />
              </div>
              <span className="text-sm font-semibold flex-1">Nueva Cita</span>
            </Command.Item>
            <Command.Item
              onSelect={() => {
                navigate({ to: "/pacientes" });
                setOpen(false);
                setSearch("");
              }}
              className="flex items-center gap-3 px-3 py-3 rounded-xl cursor-pointer aria-selected:bg-primary/10 aria-selected:text-primary text-foreground transition-colors mt-1"
            >
              <div className="h-8 w-8 bg-primary/10 rounded-full flex items-center justify-center text-primary">
                <UserPlus className="w-4 h-4" />
              </div>
              <span className="text-sm font-semibold flex-1">Nuevo Paciente</span>
            </Command.Item>
          </Command.Group>

          {patients.length > 0 && (
            <Command.Group heading="Pacientes" className="text-xs font-bold text-muted-foreground px-2 py-2">
              {patients.map((p) => (
                <Command.Item
                  key={p.id}
                  value={`paciente ${p.full_name} ${p.document_id || ""}`}
                  onSelect={() => {
                    navigate({ to: "/pacientes/$patientId", params: { patientId: p.id } });
                    setOpen(false);
                    setSearch("");
                  }}
                  className="flex items-center gap-3 px-3 py-3 rounded-xl cursor-pointer aria-selected:bg-primary/10 aria-selected:text-primary text-foreground transition-colors mt-1"
                >
                  <div className="h-8 w-8 bg-primary/10 rounded-full flex items-center justify-center text-primary">
                    <User className="w-4 h-4" />
                  </div>
                  <div className="flex flex-col flex-1">
                    <span className="text-sm font-semibold">{p.full_name}</span>
                    {p.document_id && <span className="text-xs text-muted-foreground">C.I. {p.document_id}</span>}
                  </div>
                </Command.Item>
              ))}
            </Command.Group>
          )}

          {appointments.length > 0 && (
            <Command.Group heading="Citas" className="text-xs font-bold text-muted-foreground px-2 py-2">
              {appointments.map((a) => (
                <Command.Item
                  key={a.id}
                  value={`cita ${a.patient_name} ${a.reason || ""} ${new Date(a.scheduled_at).toLocaleDateString()}`}
                  onSelect={() => {
                    navigate({ to: "/agenda" });
                    setOpen(false);
                    setSearch("");
                  }}
                  className="flex items-center gap-3 px-3 py-3 rounded-xl cursor-pointer aria-selected:bg-primary/10 aria-selected:text-primary text-foreground transition-colors mt-1"
                >
                  <div className="h-8 w-8 bg-secondary/10 rounded-full flex items-center justify-center text-secondary">
                    <Calendar className="w-4 h-4" />
                  </div>
                  <div className="flex flex-col flex-1">
                    <span className="text-sm font-semibold">Cita con {a.patient_name}</span>
                    <span className="text-xs text-muted-foreground">
                      {new Date(a.scheduled_at).toLocaleDateString()} {new Date(a.scheduled_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </Command.Item>
              ))}
            </Command.Group>
          )}

          {invoices.length > 0 && (
            <Command.Group heading="Facturas" className="text-xs font-bold text-muted-foreground px-2 py-2">
              {invoices.map((f) => (
                <Command.Item
                  key={f.id_factura}
                  value={`factura ${f.id_factura} ${f.pacientes?.nombre || ""} ${f.pacientes?.apellido || ""}`}
                  onSelect={() => {
                    navigate({ to: "/facturacion" });
                    setOpen(false);
                    setSearch("");
                  }}
                  className="flex items-center gap-3 px-3 py-3 rounded-xl cursor-pointer aria-selected:bg-primary/10 aria-selected:text-primary text-foreground transition-colors mt-1"
                >
                  <div className="h-8 w-8 bg-mauve/10 rounded-full flex items-center justify-center text-mauve">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div className="flex flex-col flex-1">
                    <span className="text-sm font-semibold">INV-{f.id_factura.toString().padStart(4, '0')}</span>
                    <span className="text-xs text-muted-foreground">
                      {f.pacientes ? `${f.pacientes.nombre} ${f.pacientes.apellido}` : "Paciente Desconocido"} - ${f.total_general}
                    </span>
                  </div>
                </Command.Item>
              ))}
            </Command.Group>
          )}
        </Command.List>
      </Command>
    </div>
  );
}
