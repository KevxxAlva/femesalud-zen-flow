import { useState, useMemo } from "react";
import { Search, Plus, X, Pencil, Trash2, ChevronLeft, Loader2, Stethoscope, ChevronRight, Filter, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { useServices, useDeleteService, useSpecialties, Service } from "@/lib/api/services";
import { ServiceForm } from "@/components/ServiceForm";
import { getSpecialtyBadgeStyle } from "@/lib/constants/specialtyForms";

export function ServiciosPage() {
  const { data: services = [], isLoading } = useServices();
  const { data: specialties = [] } = useSpecialties();
  const deleteService = useDeleteService();
  
  const [q, setQ] = useState("");
  const [specialtyFilter, setSpecialtyFilter] = useState<string>("all");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Service | null>(null);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Filter by search query AND specialty filter
  const filtered = useMemo(() => {
    return services.filter((s) => {
      // 1. Specialty filter
      if (specialtyFilter === "none") {
        if (s.id_especialidad !== null && s.id_especialidad !== undefined) return false;
      } else if (specialtyFilter !== "all") {
        if (String(s.id_especialidad) !== specialtyFilter) return false;
      }

      // 2. Search query filter
      if (!q.trim()) return true;
      const term = q.toLowerCase();
      const espName = s.especialidades?.nombre?.toLowerCase() || "";
      return s.nombre_servicio.toLowerCase().includes(term) || 
             (s.descripcion && s.descripcion.toLowerCase().includes(term)) ||
             (s.codigo_medico && s.codigo_medico.toLowerCase().includes(term)) ||
             espName.includes(term);
    });
  }, [services, q, specialtyFilter]);

  // Counts per specialty for pills
  const countsBySpecialty = useMemo(() => {
    const map: Record<string, number> = { all: services.length, none: 0 };
    services.forEach((s) => {
      if (s.id_especialidad) {
        const key = String(s.id_especialidad);
        map[key] = (map[key] || 0) + 1;
      } else {
        map.none = (map.none || 0) + 1;
      }
    });
    return map;
  }, [services]);

  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const paginated = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handleDelete = (s: Service) => {
    if (confirm(`¿Estás seguro de que deseas eliminar el servicio médico "${s.nombre_servicio}"?`)) {
      deleteService.mutate(s.id_servicio);
    }
  };

  return (
    <div className="bg-card rounded-[1.5rem] sm:rounded-[2rem] p-4 sm:p-6 shadow-sm min-h-[calc(100vh-8rem)] font-sans flex flex-col">
      {/* TOP HEADER */}
      <header className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <button className="text-muted-foreground hover:text-foreground"><ChevronLeft className="h-5 w-5" /></button>
          <div>
            <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
              <Stethoscope className="w-5 h-5 text-primary" /> Servicios Médicos
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Catálogo de servicios, procedimientos clínicos y tarifas organizados por especialidad.
            </p>
          </div>
        </div>
        <div className="flex-1 max-w-xl mx-auto w-full sm:w-auto">
          <div className="flex items-center gap-2 rounded-full bg-muted border border-border/50 px-4 py-2.5 w-full">
            <Search className="h-4 w-4 text-muted-foreground" />
            <input
              value={q}
              onChange={(e) => { setQ(e.target.value); setCurrentPage(1); }}
              placeholder="Buscar por servicio, código o especialidad..."
              className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground text-foreground"
            />
            {q && <button onClick={() => setQ("")} className="text-muted-foreground hover:text-foreground"><X className="h-4 w-4" /></button>}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => { setEditing(null); setFormOpen(true); }} 
            className="flex items-center gap-2 bg-primary text-primary-foreground px-5 py-2.5 rounded-xl text-xs font-bold shadow-md hover:opacity-95 transition"
          >
            <Plus className="h-4 w-4" /> Añadir Servicio
          </button>
        </div>
      </header>

      {/* SPECIALTY FILTER CHIPS / PILLS */}
      <div className="flex items-center gap-2 pb-3 mb-2 overflow-x-auto no-scrollbar border-b border-border/40">
        <button
          onClick={() => { setSpecialtyFilter("all"); setCurrentPage(1); }}
          className={cn(
            "text-xs font-semibold px-3 py-1.5 rounded-xl shrink-0 transition-colors border",
            specialtyFilter === "all"
              ? "bg-foreground text-background border-foreground font-bold shadow-sm"
              : "bg-muted/60 text-muted-foreground border-transparent hover:bg-muted"
          )}
        >
          Todas ({services.length})
        </button>

        {specialties.map((esp) => {
          const count = countsBySpecialty[String(esp.id_especialidad)] || 0;
          if (count === 0 && specialtyFilter !== String(esp.id_especialidad)) return null;
          const badge = getSpecialtyBadgeStyle(esp.nombre);
          const active = specialtyFilter === String(esp.id_especialidad);

          return (
            <button
              key={esp.id_especialidad}
              onClick={() => { setSpecialtyFilter(String(esp.id_especialidad)); setCurrentPage(1); }}
              className={cn(
                "text-xs font-semibold px-3 py-1.5 rounded-xl shrink-0 transition-colors border flex items-center gap-1.5",
                active
                  ? "bg-primary text-primary-foreground border-primary font-bold shadow-sm"
                  : "bg-muted/60 text-muted-foreground border-transparent hover:bg-muted"
              )}
            >
              <span>{esp.nombre}</span>
              <span className={cn("text-[10px] px-1.5 py-0.2 rounded-full", active ? "bg-white/20 text-white" : "bg-background text-muted-foreground")}>
                {count}
              </span>
            </button>
          );
        })}

        {countsBySpecialty.none > 0 && (
          <button
            onClick={() => { setSpecialtyFilter("none"); setCurrentPage(1); }}
            className={cn(
              "text-xs font-semibold px-3 py-1.5 rounded-xl shrink-0 transition-colors border",
              specialtyFilter === "none"
                ? "bg-foreground text-background border-foreground font-bold shadow-sm"
                : "bg-muted/60 text-muted-foreground border-transparent hover:bg-muted"
            )}
          >
            Multidisciplinarios ({countsBySpecialty.none})
          </button>
        )}
      </div>

      {/* SECONDARY TOOLBAR */}
      <div className="flex flex-wrap items-center justify-between mb-4 pb-2">
        <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground">
          <span>Mostrando {filtered.length} servicios</span>
          {specialtyFilter !== "all" && (
            <button 
              onClick={() => setSpecialtyFilter("all")} 
              className="text-primary hover:underline text-xs ml-1 flex items-center gap-0.5"
            >
              <X className="w-3 h-3" /> Limpiar filtro
            </button>
          )}
        </div>
      </div>

      {/* TABLE */}
      <div className="flex-1 overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-muted text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
              <th className="p-4 rounded-tl-xl">Nombre del Servicio</th>
              <th className="p-4">Especialidad</th>
              <th className="p-4">Código Médico</th>
              <th className="p-4">Descripción</th>
              <th className="p-4">Costo Base</th>
              <th className="p-4 rounded-tr-xl text-right">Acción</th>
            </tr>
          </thead>
          <tbody className="text-sm">
            {isLoading ? (
              <tr><td colSpan={6} className="p-12 text-center"><Loader2 className="mx-auto h-6 w-6 animate-spin text-muted-foreground" /></td></tr>
            ) : paginated.length === 0 ? (
              <tr><td colSpan={6} className="p-12 text-center text-muted-foreground font-medium">No se encontraron servicios médicos para el filtro seleccionado.</td></tr>
            ) : (
              paginated.map((s) => {
                const espName = s.especialidades?.nombre || "Multidisciplinario";
                const badge = getSpecialtyBadgeStyle(espName);

                return (
                  <tr key={s.id_servicio} className="border-b border-border/40 hover:bg-muted/50 transition group">
                    <td className="p-4 font-bold text-foreground">
                      {s.nombre_servicio}
                    </td>
                    <td className="p-4">
                      <span className={cn("text-[10px] font-extrabold px-2.5 py-1 rounded-lg border uppercase tracking-wider inline-flex items-center gap-1", badge.className)}>
                        <Sparkles className="w-2.5 h-2.5 opacity-70" />
                        {espName}
                      </span>
                    </td>
                    <td className="p-4 text-muted-foreground font-medium">
                      {s.codigo_medico ? <span className="bg-muted px-2 py-1 rounded-md text-xs font-mono font-semibold">{s.codigo_medico}</span> : "—"}
                    </td>
                    <td className="p-4 text-muted-foreground text-xs max-w-[240px] truncate" title={s.descripcion || ""}>
                      {s.descripcion || "Sin descripción"}
                    </td>
                    <td className="p-4">
                      <span className="bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 font-extrabold px-2.5 py-1 text-xs rounded-full border border-emerald-200 dark:border-emerald-800">
                        ${Number(s.costo_base || 0).toFixed(2)}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-3 text-muted-foreground">
                        <button 
                          onClick={() => { setEditing(s); setFormOpen(true); }} 
                          className="hover:text-primary transition-colors p-1"
                          title="Editar servicio"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button 
                          onClick={() => handleDelete(s)} 
                          className="hover:text-destructive transition-colors p-1"
                          title="Eliminar servicio"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between pt-4 border-t border-border/40">
          <p className="text-xs text-muted-foreground font-medium">
            Mostrando <span className="font-bold text-foreground">{(currentPage - 1) * itemsPerPage + 1} - {Math.min(filtered.length, currentPage * itemsPerPage)}</span> de <span className="font-bold text-foreground">{filtered.length}</span> servicios
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
