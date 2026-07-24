import { useState } from "react";
import { Search, Plus, X, Pencil, Trash2, ChevronLeft, Loader2, Stethoscope, ChevronRight, Filter, FileText } from "lucide-react";
import { cn } from "@/lib/utils";
import { useServices, useDeleteService, Service } from "@/lib/api/services";
import { ServiceForm } from "@/components/ServiceForm";

export function ServiciosPage() {
  const { data: services = [], isLoading } = useServices();
  const deleteService = useDeleteService();
  
  const [q, setQ] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Service | null>(null);

  // Pagination & Filtering
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  const filtered = services.filter((s) => {
    if (!q) return true;
    const term = q.toLowerCase();
    return s.nombre_servicio.toLowerCase().includes(term) || 
           (s.descripcion && s.descripcion.toLowerCase().includes(term)) ||
           (s.codigo_medico && s.codigo_medico.toLowerCase().includes(term));
  });

  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const paginated = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handleDelete = (s: Service) => {
    if (confirm(`¿Estás seguro de que deseas eliminar el tratamiento ${s.nombre_servicio}?`)) {
      deleteService.mutate(s.id_servicio);
    }
  };

  return (
    <div className="bg-card rounded-[2rem] p-6 shadow-sm min-h-[calc(100vh-8rem)] font-sans flex flex-col">
      {/* TOP HEADER */}
      <header className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <button className="text-muted-foreground hover:text-foreground"><ChevronLeft className="h-5 w-5" /></button>
          <h1 className="text-xl font-bold text-foreground">Tratamientos</h1>
        </div>
        <div className="flex-1 max-w-xl mx-auto">
          <div className="flex items-center gap-2 rounded-full bg-muted border border-gray-100 px-4 py-2.5 w-full">
            <Search className="h-4 w-4 text-muted-foreground" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Buscar tratamiento..."
              className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground text-foreground"
            />
            {q && <button onClick={() => setQ("")} className="text-muted-foreground hover:text-foreground"><X className="h-4 w-4" /></button>}
          </div>
        </div>
        <div className="flex items-center gap-4 hidden md:flex">
          {/* Dummy icons to match the design */}
        </div>
      </header>

      {/* SECONDARY TOOLBAR */}
      <div className="flex flex-wrap items-center justify-between mb-4 border-b border-border/40 pb-4 mt-2">
        <div className="flex items-center gap-2 text-sm font-bold text-muted-foreground">
          <Stethoscope className="h-4 w-4" /> {filtered.length} tratamientos
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-foreground border border-border/40 rounded-xl hover:bg-muted">
            <Filter className="h-3.5 w-3.5" /> Filtros
          </button>
          <button onClick={() => { setEditing(null); setFormOpen(true); }} className="flex items-center gap-2 bg-black text-primary-foreground px-5 py-2.5 rounded-xl text-xs font-bold shadow-md hover:bg-gray-800 transition">
            <Plus className="h-3.5 w-3.5" /> Añadir Tratamiento
          </button>
        </div>
      </div>

      {/* TABLE */}
      <div className="flex-1 overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-muted text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
              <th className="p-4 w-12 rounded-tl-xl"><input type="checkbox" className="rounded border-gray-300" /></th>
              <th className="p-4">Nombre del Tratamiento <span className="ml-1">↕</span></th>
              <th className="p-4">Código Médico <span className="ml-1">↕</span></th>
              <th className="p-4">Descripción <span className="ml-1">↕</span></th>
              <th className="p-4">Costo Base <span className="ml-1">↕</span></th>
              <th className="p-4 rounded-tr-xl">Acción <span className="ml-1">↕</span></th>
            </tr>
          </thead>
          <tbody className="text-sm">
            {isLoading ? (
              <tr><td colSpan={6} className="p-12 text-center"><Loader2 className="mx-auto h-6 w-6 animate-spin text-muted-foreground" /></td></tr>
            ) : paginated.length === 0 ? (
              <tr><td colSpan={6} className="p-12 text-center text-muted-foreground font-medium">No se encontraron tratamientos.</td></tr>
            ) : (
              paginated.map((s) => (
                <tr key={s.id_servicio} className="border-b border-border/40 hover:bg-muted/50 transition group">
                  <td className="p-4"><input type="checkbox" className="rounded border-gray-300" /></td>
                  <td className="p-4 font-bold text-foreground">{s.nombre_servicio}</td>
                  <td className="p-4 text-muted-foreground font-medium">
                    {s.codigo_medico ? <span className="bg-muted px-2 py-1 rounded text-xs">{s.codigo_medico}</span> : "—"}
                  </td>
                  <td className="p-4 text-muted-foreground text-xs max-w-[200px] truncate" title={s.descripcion || ""}>
                    {s.descripcion || "Sin descripción"}
                  </td>
                  <td className="p-4">
                    <span className="bg-green-50 text-green-600 font-bold px-2 py-1 text-xs rounded-full">
                      ${s.costo_base.toFixed(2)}
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-3 text-muted-foreground">
                      <button onClick={() => { setEditing(s); setFormOpen(true); }} className="hover:text-foreground"><Pencil className="h-4 w-4" /></button>
                      <button onClick={() => handleDelete(s)} className="hover:text-destructive"><Trash2 className="h-4 w-4" /></button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between pt-4 border-t border-border/40">
          <p className="text-xs text-muted-foreground font-medium">
            Mostrando <span className="font-bold text-foreground">{(currentPage - 1) * itemsPerPage + 1} - {Math.min(filtered.length, currentPage * itemsPerPage)}</span> de <span className="font-bold text-foreground">{filtered.length}</span> tratamientos
          </p>
          <div className="flex gap-1">
            <button disabled={currentPage === 1} onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))} className="h-8 w-8 flex items-center justify-center rounded-lg border border-border/40 text-muted-foreground hover:bg-muted disabled:opacity-50"><ChevronLeft className="h-4 w-4" /></button>
            <button disabled={currentPage === totalPages} onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))} className="h-8 w-8 flex items-center justify-center rounded-lg border border-border/40 text-muted-foreground hover:bg-muted disabled:opacity-50"><ChevronRight className="h-4 w-4" /></button>
          </div>
        </div>
      )}

      <ServiceForm open={formOpen} onOpenChange={setFormOpen} service={editing} />
    </div>
  );
}
