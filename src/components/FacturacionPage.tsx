import { useMemo, useState, useEffect } from "react";
import { Search, Receipt, Pencil, CreditCard, ChevronLeft, ChevronRight, FileDown, Loader2, X, Plus, Filter, FileSpreadsheet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { useAppointments, useUpdateAppointment, type AppointmentWithPatient } from "@/lib/api/appointments";
import { useDoctors, useMyProfile } from "@/lib/api/profiles";
import { useClinicInfo } from "@/lib/api/clinic";
import { useAuthSession } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { exportInvoice } from "@/lib/pdf/factura";
import { exportMonthlyReport } from "@/lib/pdf/reporte-mensual";

const MONTHS_ES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
];

const statusBg: Record<string, string> = {
  programada: "bg-mauve/15 text-mauve",
  completada: "bg-sage/50 text-sage-foreground",
  cancelada: "bg-destructive/15 text-destructive",
};

export function FacturacionPage() {
  const dateFilterFrom = useMemo(() => {
    const d = new Date();
    d.setMonth(d.getMonth() - 2); // Current month and previous 2 months
    d.setDate(1);
    d.setHours(0, 0, 0, 0);
    return d.toISOString();
  }, []);

  const { data: appointments = [], isLoading } = useAppointments({ from: dateFilterFrom });
  const { data: doctors = [] } = useDoctors();
  const { data: clinic } = useClinicInfo();
  const updateAppointment = useUpdateAppointment();

  const { user: me } = useAuthSession();
  const { data: myProfile } = useMyProfile(me?.id);

  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState("todas");
  const [doctorFilter, setDoctorFilter] = useState("todos");

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;

  const [editOpen, setEditOpen] = useState(false);
  const [selectedApp, setSelectedApp] = useState<AppointmentWithPatient | null>(null);
  const [newPrice, setNewPrice] = useState("");
  const [newStatus, setNewStatus] = useState("");
  const [newPaymentMethod, setNewPaymentMethod] = useState("");
  const [newPaymentReference, setNewPaymentReference] = useState("");
  const [isConfirmMode, setIsConfirmMode] = useState(false);
  const [monthFilter, setMonthFilter] = useState("todos");

  useEffect(() => {
    const pendingId = localStorage.getItem("pending_payment_appointment_id");
    if (pendingId && appointments.length > 0) {
      const app = appointments.find((a) => a.id === pendingId);
      if (app) {
        localStorage.removeItem("pending_payment_appointment_id");
        handleEditOpen(app, true);
      }
    }
  }, [appointments]);

  const monthOptions = useMemo(() => {
    const months = new Set<string>();
    appointments.forEach((a) => {
      const date = new Date(a.scheduled_at);
      if (!isNaN(date.getTime())) {
        const year = date.getFullYear();
        const monthNum = date.getMonth(); // 0-11
        const key = `${year}-${String(monthNum + 1).padStart(2, "0")}`;
        months.add(key);
      }
    });
    const sortedKeys = Array.from(months).sort((a, b) => b.localeCompare(a));
    return sortedKeys.map((key) => {
      const [year, monthStr] = key.split("-");
      const monthIndex = parseInt(monthStr, 10) - 1;
      const label = `${MONTHS_ES[monthIndex]} ${year}`;
      return { key, label };
    });
  }, [appointments]);

  const doctorMap = useMemo(() => new Map(doctors.map((d) => [d.id, d.full_name || d.email])), [doctors]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [q, statusFilter, doctorFilter, monthFilter]);

  // KPIs
  const metrics = useMemo(() => {
    const paid = appointments.filter((a) => a.status === "completada" && a.payment_method);
    const unpaid = appointments.filter((a) => a.status === "programada" || (a.status === "completada" && !a.payment_method));
    
    const totalEarnings = paid.reduce((sum, a) => sum + (Number(a.price) || 0), 0);
    const pendingEarnings = unpaid.reduce((sum, a) => sum + (Number(a.price) || 0), 0);

    return {
      totalEarnings,
      pendingEarnings,
      completedCount: paid.length,
      pendingCount: unpaid.length,
    };
  }, [appointments]);

  // Filtering
  const filtered = useMemo(() => {
    const term = q.toLowerCase().trim();
    return appointments.filter((a) => {
      const patientName = a.patient_name || "";
      const reason = a.reason || "";
      if (term && !patientName.toLowerCase().includes(term) && !reason.toLowerCase().includes(term)) return false;
      if (statusFilter !== "todas" && a.status !== statusFilter) return false;
      if (doctorFilter !== "todos" && a.doctor_id !== doctorFilter) return false;
      
      if (monthFilter !== "todos") {
        const date = new Date(a.scheduled_at);
        if (!isNaN(date.getTime())) {
          const year = date.getFullYear();
          const monthNum = date.getMonth() + 1;
          const key = `${year}-${String(monthNum).padStart(2, "0")}`;
          if (key !== monthFilter) return false;
        } else {
          return false;
        }
      }
      return true;
    });
  }, [appointments, q, statusFilter, doctorFilter, monthFilter]);

  // Pagination
  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const paginated = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filtered.slice(start, start + itemsPerPage);
  }, [filtered, currentPage]);

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
    try {
      await updateAppointment.mutateAsync({
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
    const docObj = doctors.find((d) => d.id === app.doctor_id);
    const doctorInfo = {
      name: docObj?.full_name || myProfile?.full_name || "Dra. Carli Solé Aquino",
      specialty: docObj?.specialty || myProfile?.specialty || "Ginecólogo Obstetra",
    };
    await exportInvoice(app, clinic, doctorInfo);
  };

  const handleExportExcel = async () => {
    try {
      if (filtered.length === 0) {
        toast.warning("No hay datos de facturación para exportar");
        return;
      }

      const excelData = filtered.map((a) => ({
        "Fecha / Hora": new Date(a.scheduled_at).toLocaleDateString("es-ES") + " " + new Date(a.scheduled_at).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" }),
        "Paciente": a.patient_name || "—",
        "Médico": doctorMap.get(a.doctor_id) || "Sin asignar",
        "Motivo": a.reason || "—",
        "Monto ($)": a.price || 0,
        "Estado de Cita": a.status === "completada" ? "Completada" : a.status === "programada" ? "Programada" : "Cancelada",
        "Método de Pago": a.payment_method || "No pagado",
        "Referencia de Pago": a.payment_reference || "—",
      }));

      const XLSX = await import("xlsx");
      const ws = XLSX.utils.json_to_sheet(excelData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Facturación");

      const maxLens = Object.keys(excelData[0] || {}).map((key) => {
        return Math.max(
          key.length,
          ...excelData.map((row) => String(row[key as keyof typeof row] || "").length)
        );
      });
      ws["!cols"] = maxLens.map((len) => ({ wch: len + 3 }));

      XLSX.writeFile(wb, `femesalud-facturacion-${new Date().toISOString().slice(0, 10)}.xlsx`);
      toast.success(`${filtered.length} registros de facturación exportados`);
    } catch (err) {
      toast.error("Error al exportar a Excel");
      console.error(err);
    }
  };

  const handleExportMonthlyReport = async () => {
    await exportMonthlyReport(monthOptions, monthFilter, clinic, filtered);
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div className="ml-14 md:ml-0">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Módulo Financiero</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">Facturación y Recibos</h1>
          <p className="text-sm text-muted-foreground">Control de caja, cobros de consultas y estados de pago.</p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={handleExportExcel}
            variant="outline"
            className="rounded-2xl border-border/80 text-foreground hover:bg-muted cursor-pointer flex items-center gap-1.5 h-10 px-4 text-xs font-semibold"
          >
            <FileSpreadsheet className="h-4 w-4 text-emerald-600" /> Exportar Excel
          </Button>
          <Button
            onClick={handleExportMonthlyReport}
            className="rounded-2xl bg-gradient-to-r from-mauve to-mauve-soft text-primary-foreground shadow-sm shadow-mauve/30 hover:opacity-95 transition-all duration-300 hover:scale-[1.02] flex items-center gap-1.5 h-10 px-4 text-xs font-semibold cursor-pointer"
          >
            <FileDown className="h-4 w-4" /> Exportar Reporte
          </Button>
        </div>
      </header>

      {/* Financial KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-3xl glass-card p-5 border border-border/40 shadow-sm flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-sage to-sage-foreground text-primary-foreground font-bold shadow-sm shadow-sage/20">
            <Receipt className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground uppercase font-medium tracking-wider">Total Recaudado</p>
            <p className="text-lg font-bold mt-0.5 text-foreground">${metrics.totalEarnings.toLocaleString("es-ES")} USD</p>
            <span className="text-[10px] text-muted-foreground">{metrics.completedCount} consultas cobradas</span>
          </div>
        </div>

        <div className="rounded-3xl glass-card p-5 border border-border/40 shadow-sm flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-mauve to-mauve-soft text-primary-foreground font-bold shadow-sm shadow-mauve/20">
            <CreditCard className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground uppercase font-medium tracking-wider">Por Recaudar</p>
            <p className="text-lg font-bold mt-0.5 text-foreground">${metrics.pendingEarnings.toLocaleString("es-ES")} USD</p>
            <span className="text-[10px] text-muted-foreground">{metrics.pendingCount} cobros pendientes</span>
          </div>
        </div>
      </div>

      {/* Filter and Search */}
      <div className="rounded-3xl glass-card p-4 shadow-sm">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex flex-1 min-w-[220px] items-center gap-2 rounded-2xl bg-muted/60 px-3.5 py-2.5">
            <Search className="h-4 w-4 text-muted-foreground" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Buscar por paciente o concepto…"
              className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
            {q && <button onClick={() => setQ("")} className="text-muted-foreground hover:text-foreground"><X className="h-4 w-4" /></button>}
          </div>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[170px] rounded-2xl"><SelectValue placeholder="Estado Pago" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="todas">Todos los estados</SelectItem>
              <SelectItem value="programada">Pendiente (Programada)</SelectItem>
              <SelectItem value="completada">Cobrada (Completada)</SelectItem>
              <SelectItem value="cancelada">Cancelada</SelectItem>
            </SelectContent>
          </Select>

          <Select value={doctorFilter} onValueChange={setDoctorFilter}>
            <SelectTrigger className="w-[210px] rounded-2xl"><SelectValue placeholder="Filtrar por médico" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos los médicos</SelectItem>
              {doctors.map((d) => <SelectItem key={d.id} value={d.id}>{d.full_name || d.email}</SelectItem>)}
            </SelectContent>
          </Select>

          <Select value={monthFilter} onValueChange={setMonthFilter}>
            <SelectTrigger className="w-[190px] rounded-2xl"><SelectValue placeholder="Filtrar por mes" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos los meses</SelectItem>
              {monthOptions.map((opt) => (
                <SelectItem key={opt.key} value={opt.key}>{opt.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="rounded-3xl glass-card p-12 text-center shadow-sm flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-3xl glass-card p-12 text-center shadow-sm">
          <Receipt className="mx-auto h-10 w-10 text-muted-foreground" />
          <p className="mt-3 text-sm text-muted-foreground">No se encontraron cobros registrados.</p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="overflow-hidden rounded-3xl glass-card shadow-sm border border-border/40">
            <table className="w-full text-sm">
              <thead className="bg-muted/40 text-left">
                <tr className="text-xs uppercase tracking-wider text-muted-foreground">
                  <th className="px-5 py-3.5">Paciente</th>
                  <th className="px-5 py-3.5">Fecha Cita</th>
                  <th className="px-5 py-3.5">Concepto</th>
                  <th className="px-5 py-3.5">Médico</th>
                  <th className="px-5 py-3.5">Monto</th>
                  <th className="px-5 py-3.5">Estado</th>
                  <th className="px-5 py-3.5 text-right">Acciones</th>
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

          {totalPages > 1 && (
            <div className="flex flex-wrap items-center justify-between gap-4 rounded-3xl glass-card p-4 shadow-sm border border-border/40 animate-fade-in">
              <p className="text-xs text-muted-foreground">
                Mostrando <span className="font-semibold text-foreground">{(currentPage - 1) * itemsPerPage + 1} - {Math.min(filtered.length, currentPage * itemsPerPage)}</span> de <span className="font-semibold text-foreground">{filtered.length}</span> registros
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
      )}

      {/* Edit payment / price Dialog */}
      <Dialog open={editOpen} onOpenChange={(open) => { setEditOpen(open); if (!open) setIsConfirmMode(false); }}>
        <DialogContent className="sm:max-w-md rounded-3xl">
          <DialogHeader>
            <DialogTitle>{isConfirmMode ? "Confirmar Método de Pago" : "Editar Pago / Facturación"}</DialogTitle>
            <DialogDescription>
              {isConfirmMode 
                ? "Registra y confirma el método de pago para completar la facturación de esta consulta." 
                : "Actualiza el precio acordado de la consulta o el estado de pago."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid gap-1.5">
              <Label htmlFor="paciente-name">Paciente</Label>
              <Input id="paciente-name" value={selectedApp?.patient_name || ""} disabled className="rounded-xl bg-muted/40" />
            </div>

            <div className="grid gap-1.5">
              <Label htmlFor="monto-val">Precio de la Consulta ($ USD)</Label>
              <Input
                id="monto-val"
                type="number"
                min="0"
                value={newPrice}
                onChange={(e) => setNewPrice(e.target.value)}
                className="rounded-xl"
              />
            </div>

            <div className="grid gap-1.5">
              <Label htmlFor="status-val">Estado de Cita (Pago)</Label>
              <Select value={newStatus} onValueChange={setNewStatus}>
                <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="programada">Pendiente (Programada)</SelectItem>
                  <SelectItem value="completada">Cobrada (Completada)</SelectItem>
                  <SelectItem value="cancelada">Cancelada</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {newStatus === "completada" && (
              <>
                <div className="grid gap-1.5 animate-fade-in">
                  <Label htmlFor="payment-method-val">Método de Pago</Label>
                  <Select value={newPaymentMethod} onValueChange={setNewPaymentMethod}>
                    <SelectTrigger id="payment-method-val" className="rounded-xl">
                      <SelectValue placeholder="Seleccione método de pago..." />
                    </SelectTrigger>
                    <SelectContent className="rounded-2xl">
                      <SelectItem value="Efectivo">Efectivo</SelectItem>
                      <SelectItem value="Pago Móvil">Pago Móvil</SelectItem>
                      <SelectItem value="Transferencia">Transferencia</SelectItem>
                      <SelectItem value="Divisas">Divisas (Dólares)</SelectItem>
                      <SelectItem value="Punto de Venta">Punto de Venta / Tarjeta</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {newPaymentMethod && newPaymentMethod !== "Efectivo" && newPaymentMethod !== "Divisas" && (
                  <div className="grid gap-1.5 animate-fade-in">
                    <Label htmlFor="payment-ref-val">Referencia de Pago</Label>
                    <Input
                      id="payment-ref-val"
                      placeholder="Ej. Código de transferencia o pago móvil..."
                      value={newPaymentReference}
                      onChange={(e) => setNewPaymentReference(e.target.value)}
                      className="rounded-xl"
                    />
                  </div>
                )}
              </>
            )}
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => { setEditOpen(false); setIsConfirmMode(false); }} className="rounded-xl">Cancelar</Button>
            <Button onClick={handleSavePrice} disabled={updateAppointment.isPending} className="rounded-xl bg-gradient-to-r from-mauve to-mauve-soft text-primary-foreground">
              {updateAppointment.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : (isConfirmMode ? "Confirmar Pago" : "Guardar")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
