import { useEffect, useState } from "react";
import { Command } from "cmdk";
import { Search, User, FileText, Calendar } from "lucide-react";
import { usePatients } from "@/lib/api/patients";
import { useNavigate } from "@tanstack/react-router";

export function CommandMenu() {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const { data: patients = [] } = usePatients(search);
  const navigate = useNavigate();

  // Toggle the menu when ⌘K or Ctrl+K is pressed
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
        shouldFilter={false} // We rely on the API to filter or we filter locally
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
          {search && patients.length === 0 && (
            <Command.Empty className="py-6 text-center text-sm text-muted-foreground">
              No se encontraron resultados para "{search}"
            </Command.Empty>
          )}

          {patients.length > 0 && (
            <Command.Group heading="Pacientes" className="text-xs font-bold text-muted-foreground px-2 py-2">
              {patients.slice(0, 10).map((p) => (
                <Command.Item
                  key={p.id}
                  value={p.id}
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
        </Command.List>
      </Command>
    </div>
  );
}
