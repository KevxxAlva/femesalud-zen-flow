import { Receipt, Pencil, CreditCard, ChevronLeft, ChevronRight, FileDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { cn } from "@/lib/utils";
import type { AppointmentWithPatient } from "@/lib/api/appointments";

interface FacturacionTableProps {
  paginated: AppointmentWithPatient[];
  doctorMap: Map<string, string>;
  handleEditOpen: (app: AppointmentWithPatient, forceConfirm?: boolean) => void;
  handleExportInvoice: (app: AppointmentWithPatient) => void;
  currentPage: number;
  setCurrentPage: (val: number | ((prev: number) => number)) => void;
  totalPages: number;
  totalCount: number;
  itemsPerPage: number;
}

export function FacturacionTable({
  paginated,
  doctorMap,
  handleEditOpen,
  handleExportInvoice,
  currentPage,
  setCurrentPage,
  totalPages,
  totalCount,
  itemsPerPage,
}: FacturacionTableProps) {
  if (paginated.length === 0) {
    return (
      <EmptyState icon={Receipt} title="Sin cobros registrados" description="No se encontraron facturas o cobros para los filtros seleccionados." />
    );
  }

  return (
    <div className="space-y-4">
      <div className="overflow-hidden rounded-3xl glass-card shadow-sm border border-border/40">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-left">
              <tr className="text-xs uppercase tracking-wider text-muted-foreground">
                <th className="px-5 py-3.5 whitespace-nowrap">Paciente</th>
                <th className="px-5 py-3.5 whitespace-nowrap">Fecha Cita</th>
                <th className="px-5 py-3.5 whitespace-nowrap">Concepto</th>
                <th className="px-5 py-3.5 whitespace-nowrap">Médico</th>
                <th className="px-5 py-3.5 whitespace-nowrap">Monto</th>
                <th className="px-5 py-3.5 whitespace-nowrap">Estado</th>
                <th className="px-5 py-3.5 text-right whitespace-nowrap">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {paginated.map((a) => (
                <tr key={a.id} className="transition hover:bg-muted/30">
                  <td className="px-5 py-3.5 font-bold">{a.patient_name}</td>
                  <td className="px-5 py-3.5 text-xs text-muted-foreground">
                    {new Date(a.scheduled_at).toLocaleString("es-ES", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                  </td>
                  <td className="px-5 py-3.5 text-xs truncate max-w-[200px]">{a.reason || "Consulta médica general"}</td>
                  <td className="px-5 py-3.5 text-xs">{doctorMap.get(a.doctor_id) || "Doctor"}</td>
                  <td className="px-5 py-3.5 font-bold">${a.price || 0}</td>
                  <td className="px-5 py-3.5">
                    <div className="flex flex-col gap-1">
                      <span className={cn(
                        "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-medium capitalize w-fit",
                        a.status === "completada"
                          ? a.payment_method
                            ? "bg-sage/50 text-sage-foreground" // Green for Cobrada
                            : "bg-amber-100 text-amber-800 border border-amber-200/50" // Yellow for Por Cobrar
                          : a.status === "programada"
                          ? "bg-amber-100 text-amber-800 border border-amber-200/50" // Yellow for Pendiente
                          : "bg-destructive/15 text-destructive" // Red for Cancelada
                      )}>
                        {a.status === "completada"
                          ? a.payment_method
                            ? "Cobrada"
                            : "Por Cobrar"
                          : a.status === "programada"
                          ? "Pendiente"
                          : "Cancelada"}
                      </span>
                      {a.status === "completada" && a.payment_method && (
                        <span className="text-[10px] text-muted-foreground font-semibold flex flex-wrap items-center gap-1">
                          <CreditCard className="h-3 w-3 shrink-0" /> {a.payment_method}
                          {a.payment_reference && <span className="text-muted-foreground/60 font-normal">(Ref: {a.payment_reference})</span>}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      {a.status === "completada" && !a.payment_method ? (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditOpen(a, true)}
                          className="rounded-xl border-mauve text-mauve hover:bg-mauve/15 flex items-center gap-1 cursor-pointer h-8 text-xs font-semibold px-2.5 shadow-sm shadow-mauve/5"
                        >
                          <CreditCard className="h-3.5 w-3.5" />
                          Confirmar Pago
                        </Button>
                      ) : (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditOpen(a)}
                          className="h-8 w-8 p-0 rounded-xl hover:bg-mauve/10 cursor-pointer flex items-center justify-center text-muted-foreground"
                          aria-label="Registrar pago"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                      )}
                      {a.status === "completada" && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleExportInvoice(a)}
                          className="h-8 w-8 p-0 rounded-xl hover:bg-mauve/10 cursor-pointer flex items-center justify-center text-muted-foreground"
                          aria-label="Descargar recibo"
                        >
                          <FileDown className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
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
            cobros
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
}
