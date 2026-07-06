import { useState } from "react";
import { Megaphone, Search, MessageCircle, Send, CheckSquare, Square, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { usePaginatedPatients } from "@/lib/api/patients";
import { TableSkeleton } from "@/components/ui/table-skeleton";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export function CrmPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("todos");
  const [page, setPage] = useState(1);
  const itemsPerPage = 20;

  const { data: result, isLoading } = usePaginatedPatients(
    page,
    itemsPerPage,
    search || undefined,
    statusFilter === "todos" ? undefined : (statusFilter as any)
  );

  const patients = result?.data || [];
  const totalCount = result?.count || 0;
  const totalPages = Math.ceil(totalCount / itemsPerPage);

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const toggleSelectAll = () => {
    if (selectedIds.size === patients.length && patients.length > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(patients.map((p) => p.id)));
    }
  };

  const toggleSelect = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const handleSendBulk = () => {
    if (selectedIds.size === 0) {
      toast.error("Selecciona al menos un paciente para la campaña.");
      return;
    }
    
    // Filtramos solo los pacientes que tienen teléfono
    const selectedPatients = patients.filter(p => selectedIds.has(p.id) && p.phone);
    if (selectedPatients.length === 0) {
      toast.error("Ninguno de los pacientes seleccionados tiene número de teléfono.");
      return;
    }

    if (selectedPatients.length === 1) {
      // Single message via wa.me
      const p = selectedPatients[0];
      const cleanPhone = p.phone!.replace(/\D/g, "");
      const text = `Hola ${p.full_name}, le escribimos de FemeSalud...`;
      window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`, "_blank");
    } else {
      // For multiple, since wa.me only supports one number, we can generate a comma-separated list of numbers
      // that the user can copy to create a Broadcast List (Lista de Difusión) in WhatsApp Business.
      const phones = selectedPatients.map(p => p.phone!.replace(/\D/g, "")).join(", ");
      navigator.clipboard.writeText(phones);
      toast.success("Números copiados al portapapeles. Pégalos en WhatsApp Business para crear tu lista de difusión.");
    }
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div className="ml-14 md:ml-0">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Marketing</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight font-display flex items-center gap-2">
            CRM y Fidelización <Megaphone className="h-6 w-6 text-mauve" />
          </h1>
          <p className="text-sm text-muted-foreground">
            Crea listas de difusión y envía recordatorios masivos a tus pacientes.
          </p>
        </div>
      </header>

      {/* Control Panel */}
      <div className="rounded-3xl glass-card p-4 shadow-sm border border-border/40 animate-fade-in flex flex-col md:flex-row gap-4 justify-between items-center">
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <div className="relative max-w-sm w-full md:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar paciente..."
              className="pl-9 rounded-2xl border-border/50 bg-background/50 h-10"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full md:w-[180px] rounded-2xl h-10 bg-background/50 border-border/50">
              <Filter className="mr-2 h-4 w-4 text-muted-foreground" />
              <SelectValue placeholder="Estado" />
            </SelectTrigger>
            <SelectContent className="rounded-2xl">
              <SelectItem value="todos">Todos los estados</SelectItem>
              <SelectItem value="nuevo">Nuevos</SelectItem>
              <SelectItem value="activo">Activos</SelectItem>
              <SelectItem value="en_tratamiento">En tratamiento</SelectItem>
              <SelectItem value="alta">De Alta</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Button 
          onClick={handleSendBulk}
          disabled={selectedIds.size === 0}
          className="rounded-2xl w-full md:w-auto bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-sm shadow-emerald-500/30 hover:opacity-95 transition-all h-10"
        >
          <MessageCircle className="mr-2 h-4 w-4" />
          {selectedIds.size > 1 ? `Generar Lista de Difusión (${selectedIds.size})` : "Enviar Mensaje"}
        </Button>
      </div>

      {/* Data Table */}
      <div className="rounded-3xl glass-card border border-border/40 overflow-hidden shadow-sm animate-fade-in">
        <div className="overflow-x-auto">
          {isLoading ? (
            <TableSkeleton columns={4} rows={10} />
          ) : patients.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground">
              <Megaphone className="h-12 w-12 mx-auto mb-3 opacity-20" />
              <p>No se encontraron pacientes para esta campaña.</p>
            </div>
          ) : (
            <table className="w-full text-sm text-left">
              <thead className="bg-muted/40 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-6 py-4">
                    <button onClick={toggleSelectAll} className="text-muted-foreground hover:text-foreground">
                      {selectedIds.size === patients.length && patients.length > 0 ? (
                        <CheckSquare className="h-5 w-5 text-mauve" />
                      ) : (
                        <Square className="h-5 w-5" />
                      )}
                    </button>
                  </th>
                  <th className="px-6 py-4">Paciente</th>
                  <th className="px-6 py-4">Contacto</th>
                  <th className="px-6 py-4">Estado</th>
                  <th className="px-6 py-4 text-right">Acción Rápida</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/20">
                {patients.map((p) => {
                  const isSelected = selectedIds.has(p.id);
                  const cleanPhone = p.phone ? p.phone.replace(/\D/g, "") : "";
                  
                  return (
                    <tr 
                      key={p.id} 
                      className={cn(
                        "transition-colors hover:bg-muted/20 cursor-pointer",
                        isSelected && "bg-mauve/5 hover:bg-mauve/10"
                      )}
                      onClick={(e) => {
                        // Prevent toggling if clicking on buttons
                        if ((e.target as HTMLElement).closest("button")) return;
                        toggleSelect(p.id);
                      }}
                    >
                      <td className="px-6 py-4">
                        {isSelected ? <CheckSquare className="h-5 w-5 text-mauve" /> : <Square className="h-5 w-5 text-muted-foreground/50" />}
                      </td>
                      <td className="px-6 py-4 font-medium text-foreground">
                        {p.full_name}
                      </td>
                      <td className="px-6 py-4 text-muted-foreground">
                        {p.phone || "Sin teléfono"}
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center rounded-full bg-muted/60 px-2 py-1 text-[10px] font-semibold text-muted-foreground capitalize">
                          {p.status.replace("_", " ")}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          disabled={!cleanPhone}
                          onClick={(e) => {
                            e.stopPropagation();
                            window.open(`https://wa.me/${cleanPhone}?text=Hola ${p.full_name}, le escribimos de FemeSalud`, "_blank");
                          }}
                          className="rounded-xl h-8 text-green-600 hover:text-green-700 hover:bg-green-50"
                        >
                          <Send className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-border/20 p-4 bg-muted/10">
            <span className="text-xs text-muted-foreground font-medium">
              Página {page} de {totalPages}
            </span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="rounded-xl border-border/50 text-xs font-semibold h-8"
              >
                Anterior
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="rounded-xl border-border/50 text-xs font-semibold h-8"
              >
                Siguiente
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
