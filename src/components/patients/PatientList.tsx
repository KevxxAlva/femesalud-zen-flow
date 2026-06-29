import React from "react";
import { Users, Mail, Phone, Stethoscope, Pencil, Trash2, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { TableSkeleton } from "@/components/ui/table-skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import type { Patient } from "@/lib/api/patients";

interface PatientListProps {
  paginatedPatients: Patient[];
  isLoading: boolean;
  error: any;
  totalCount: number;
  currentPage: number;
  totalPages: number;
  itemsPerPage: number;
  setCurrentPage: React.Dispatch<React.SetStateAction<number>>;
  setViewing: (p: Patient) => void;
  setEditing: (p: Patient) => void;
  setFormOpen: (open: boolean) => void;
  setToDelete: (p: Patient) => void;
  doctorMap: Map<string, string>;
  tagBg: Record<string, string>;
  statusLabel: (s: string) => string;
  initials: (n: string) => string;
}

export const PatientList = React.memo(function PatientList({
  paginatedPatients,
  isLoading,
  error,
  totalCount,
  currentPage,
  totalPages,
  itemsPerPage,
  setCurrentPage,
  setViewing,
  setEditing,
  setFormOpen,
  setToDelete,
  doctorMap,
  tagBg,
  statusLabel,
  initials,
}: PatientListProps) {
  if (isLoading) {
    return <TableSkeleton columns={6} rows={10} />;
  }

  if (error) {
    return (
      <div className="rounded-3xl glass-card p-12 text-center text-sm text-destructive">
        Error al cargar pacientes
      </div>
    );
  }

  if (paginatedPatients.length === 0) {
    return <EmptyState icon={Users} title="Sin pacientes" description="No se encontraron pacientes con los filtros de búsqueda actuales." />;
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {paginatedPatients.map((p) => (
          <div
            key={p.id}
            className="group rounded-3xl glass-card p-5 shadow-sm transition-all duration-300 hover:shadow-md"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-mauve/80 to-blush text-sm font-semibold text-primary-foreground shadow-sm">
                  {initials(p.full_name)}
                </div>
                <div>
                  <p className="text-sm font-semibold leading-tight">{p.full_name}</p>
                </div>
              </div>
              <span
                className={cn(
                  "rounded-full px-2.5 py-0.5 text-[11px] font-medium",
                  tagBg[p.status] || "bg-muted text-muted-foreground"
                )}
              >
                {statusLabel(p.status)}
              </span>
            </div>
            <div className="mt-4 space-y-1.5 text-xs text-muted-foreground">
              <p className="flex items-center gap-2">
                <Mail className="h-3.5 w-3.5" /> {p.email || "—"}
              </p>
              <p className="flex items-center gap-2">
                <Phone className="h-3.5 w-3.5" /> {p.phone || "—"}
              </p>
              <p className="flex items-center gap-2">
                <Stethoscope className="h-3.5 w-3.5" />{" "}
                {doctorMap.get(p.assigned_doctor_id ?? "") || "Sin asignar"}
              </p>
            </div>
            <div className="mt-4 flex items-center justify-between gap-2 border-t border-border/60 pt-3">
              <button
                onClick={() => setViewing(p)}
                className="text-xs font-medium text-mauve hover:underline cursor-pointer"
              >
                Ver detalle →
              </button>
              <div className="flex gap-1">
                <button
                  onClick={() => {
                    setEditing(p);
                    setFormOpen(true);
                  }}
                  className="flex h-8 w-8 items-center justify-center rounded-xl text-muted-foreground transition hover:bg-mauve/10 hover:text-mauve cursor-pointer"
                  aria-label="Editar"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => setToDelete(p)}
                  className="flex h-8 w-8 items-center justify-center rounded-xl text-muted-foreground transition hover:bg-destructive/10 hover:text-destructive cursor-pointer"
                  aria-label="Eliminar"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {totalPages > 1 && (
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-3xl glass-card p-4 shadow-sm border border-border/40 animate-fade-in">
          <p className="text-xs text-muted-foreground">
            Mostrando{" "}
            <span className="font-semibold text-foreground">
              {(currentPage - 1) * itemsPerPage + 1} -{" "}
              {Math.min(totalCount, currentPage * itemsPerPage)}
            </span>{" "}
            de <span className="font-semibold text-foreground">{totalCount}</span>{" "}
            pacientes
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
              className="rounded-xl flex items-center gap-1 h-9 cursor-pointer"
            >
              <ChevronLeft className="h-4 w-4" /> Anterior
            </Button>
            <span className="text-xs font-semibold px-3 py-1 bg-muted/60 rounded-lg">
              {currentPage} / {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
              className="rounded-xl flex items-center gap-1 h-9 cursor-pointer"
            >
              Siguiente <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
});
