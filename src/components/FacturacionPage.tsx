import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { AppointmentWithPatient } from "@/lib/api/appointments";
import { toast } from "sonner";
import { exportInvoice } from "@/lib/pdf/factura";
import { useFacturacion } from "./facturacion/useFacturacion";
import { FacturacionKPIs } from "./facturacion/FacturacionKPIs";
import { FacturacionFilters } from "./facturacion/FacturacionFilters";
import { FacturacionTable } from "./facturacion/FacturacionTable";

export function FacturacionPage() {
  const facturacion = useFacturacion();

  const [editOpen, setEditOpen] = useState(false);
  const [selectedApp, setSelectedApp] = useState<AppointmentWithPatient | null>(null);
  const [newPrice, setNewPrice] = useState("");
  const [newStatus, setNewStatus] = useState("");
  const [newPaymentMethod, setNewPaymentMethod] = useState("");
  const [newPaymentReference, setNewPaymentReference] = useState("");
  const [isConfirmMode, setIsConfirmMode] = useState(false);

  useEffect(() => {
    const pendingId = localStorage.getItem("pending_payment_appointment_id");
    if (pendingId && facturacion.appointments.length > 0) {
      const app = facturacion.appointments.find((a) => a.id === pendingId);
      if (app) {
        localStorage.removeItem("pending_payment_appointment_id");
        handleEditOpen(app, true);
      }
    }
  }, [facturacion.appointments]);

  const handleEditOpen = (app: AppointmentWithPatient, forceConfirm = false) => {
    setSelectedApp(app);
    setNewPrice(String(app.price || 0));
    setNewStatus(app.status);
    setNewPaymentMethod(app.payment_method || "");
    setNewPaymentReference(app.payment_reference || "");
    setIsConfirmMode(forceConfirm || (app.status === "completada" && !app.payment_method));
    setEditOpen(true);
  };

  const handleSavePrice = async () => {
    if (!selectedApp) return;

    if (Number(newPrice) < 0) {
      toast.error("El monto de la consulta no puede ser negativo");
      return;
    }

    if (newStatus === "completada" && !newPaymentMethod) {
      toast.error("Debe seleccionar un método de pago para marcar como completada");
      return;
    }

    try {
      await facturacion.updateAppointment.mutateAsync({
        id: selectedApp.id,
        price: Number(newPrice),
        status: newStatus,
        payment_method: newStatus === "completada" ? (newPaymentMethod || null) : null,
        payment_reference: newStatus === "completada" ? (newPaymentReference || null) : null,
      });
      toast.success("Facturación actualizada");
      setEditOpen(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al guardar");
    }
  };

  const handleExportInvoice = async (app: AppointmentWithPatient) => {
    if (!facturacion.myProfile) {
      toast.error("Faltan datos del doctor para el recibo.");
      return;
    }
    toast.info("Generando recibo...");
    exportInvoice(app, facturacion.clinic, {
      name: facturacion.myProfile.full_name || "Médico Tratante",
      specialty: facturacion.myProfile.specialty || "Ginecólogo Obstetra"
    });
    toast.success("Recibo generado con éxito.");
  };

  if (facturacion.isLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-mauve" />
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12 animate-fade-in max-w-6xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Facturación y Cobranza</h1>
        <p className="text-muted-foreground mt-1">
          Gestiona los ingresos, pagos pendientes y emite recibos.
        </p>
      </div>

      <FacturacionKPIs metrics={facturacion.metrics} />

      <div className="flex flex-col gap-6">
        <FacturacionFilters
          q={facturacion.q}
          setQ={facturacion.setQ}
          statusFilter={facturacion.statusFilter}
          setStatusFilter={facturacion.setStatusFilter}
          doctorFilter={facturacion.doctorFilter}
          setDoctorFilter={facturacion.setDoctorFilter}
          monthFilter={facturacion.monthFilter}
          setMonthFilter={facturacion.setMonthFilter}
          doctors={facturacion.doctors}
          monthOptions={facturacion.monthOptions}
          clinic={facturacion.clinic}
          appointments={facturacion.appointments}
          metrics={facturacion.metrics}
        />

        <FacturacionTable
          paginated={facturacion.paginated}
          doctorMap={facturacion.doctorMap}
          handleEditOpen={handleEditOpen}
          handleExportInvoice={handleExportInvoice}
          currentPage={facturacion.currentPage}
          setCurrentPage={facturacion.setCurrentPage}
          totalPages={facturacion.totalPages}
          totalCount={facturacion.filtered.length}
          itemsPerPage={facturacion.itemsPerPage}
        />
      </div>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-md bg-background/95 backdrop-blur-xl border-border/40 shadow-2xl rounded-3xl">
          <DialogHeader>
            <DialogTitle className="text-xl">
              {isConfirmMode ? "Confirmar Pago" : "Editar Facturación"}
            </DialogTitle>
            <DialogDescription>
              {selectedApp?.patient_name} - {new Date(selectedApp?.scheduled_at || "").toLocaleDateString("es-ES")}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-5 py-4">
            <div className="grid gap-2">
              <Label>Monto de la consulta (USD)</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={newPrice}
                  onChange={(e) => setNewPrice(e.target.value)}
                  className="pl-8 rounded-xl bg-background/50"
                  placeholder="0.00"
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label>Estado de la cita</Label>
              <Select value={newStatus} onValueChange={setNewStatus}>
                <SelectTrigger className="rounded-xl bg-background/50">
                  <SelectValue placeholder="Estado..." />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="programada">Pendiente / Por Cobrar</SelectItem>
                  <SelectItem value="completada">Completada</SelectItem>
                  <SelectItem value="cancelada">Cancelada</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {newStatus === "completada" && (
              <div className="grid gap-4 p-4 rounded-2xl bg-muted/30 border border-border/40">
                <h4 className="font-semibold text-sm">Detalles del Pago</h4>
                <div className="grid gap-2">
                  <Label>Método de Pago</Label>
                  <Select value={newPaymentMethod} onValueChange={setNewPaymentMethod}>
                    <SelectTrigger className="rounded-xl bg-background/50">
                      <SelectValue placeholder="Selecciona un método..." />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl">
                      <SelectItem value="efectivo">Efectivo</SelectItem>
                      <SelectItem value="zelle">Zelle</SelectItem>
                      <SelectItem value="pago_movil">Pago Móvil</SelectItem>
                      <SelectItem value="transferencia">Transferencia Bancaria</SelectItem>
                      <SelectItem value="tarjeta_debito">Tarjeta de Débito (Punto)</SelectItem>
                      <SelectItem value="tarjeta_credito">Tarjeta de Crédito</SelectItem>
                      <SelectItem value="seguro">Seguro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-2">
                  <Label>Referencia (Opcional)</Label>
                  <Input
                    placeholder="Ej. 12345678"
                    value={newPaymentReference}
                    onChange={(e) => setNewPaymentReference(e.target.value)}
                    className="rounded-xl bg-background/50"
                  />
                </div>
              </div>
            )}
          </div>

          <DialogFooter className="gap-2 sm:gap-0 mt-2">
            <Button variant="outline" onClick={() => setEditOpen(false)} className="rounded-xl w-full sm:w-auto">
              Cancelar
            </Button>
            <Button
              onClick={handleSavePrice}
              className="rounded-xl bg-mauve text-primary-foreground hover:bg-mauve/90 w-full sm:w-auto"
            >
              {isConfirmMode ? "Registrar Pago" : "Guardar Cambios"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
