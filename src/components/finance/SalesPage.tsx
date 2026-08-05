import { useState } from "react";
import { Search, Plus, X, Pencil, Trash2, ChevronLeft, ChevronRight, Filter, ReceiptText, Loader2, CreditCard, Download } from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { cn } from "@/lib/utils";
import { generateSalesReport } from "@/lib/utils/generateSalesReport";
import { generateIndividualInvoice } from "@/lib/utils/generateIndividualInvoice";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { logAuditAction } from "@/lib/api/audit";
import { usePaymentMethods } from "@/lib/api/paymentMethods";

type Invoice = {
  id_factura: number;
  id_paciente: number | null;
  paciente_nombre?: string;
  fecha_emision: string;
  subtotal: number;
  monto_paciente: number;
  total_general: number;
  estado_pago: string;
};

export function SalesPage() {
  const [q, setQ] = useState("");
  const [filterMonth, setFilterMonth] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [paymentMethod, setPaymentMethod] = useState("");
  const [paymentReference, setPaymentReference] = useState("");

  const { data: methods = [] } = usePaymentMethods();

  const { data: facturas = [], isLoading } = useQuery({
    queryKey: ["facturas"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("facturas")
        .select(`
          id_factura, 
          id_paciente,
          fecha_emision,
          subtotal,
          monto_paciente,
          total_general,
          estado_pago,
          pacientes (nombre, apellido)
        `)
        .order("fecha_emision", { ascending: false });

      if (error) throw error;
      
      return data.map((f: any) => ({
        id_factura: f.id_factura,
        id_paciente: f.id_paciente,
        paciente_nombre: f.pacientes ? `${f.pacientes.nombre} ${f.pacientes.apellido}` : "Paciente Desconocido",
        fecha_emision: f.fecha_emision,
        subtotal: f.subtotal,
        monto_paciente: f.monto_paciente,
        total_general: f.total_general,
        estado_pago: f.estado_pago || "Pendiente",
      })) as Invoice[];
    }
  });

  const queryClient = useQueryClient();

  const updatePaymentStatus = useMutation({
    mutationFn: async ({ id, status, invoice }: { id: number; status: string; invoice: Invoice }) => {
      // 1. Update invoice status
      const { data: invData, error: invError } = await supabase
        .from("facturas")
        .update({ estado_pago: status })
        .eq("id_factura", id)
        .select()
        .single();
        
      if (invError) throw invError;

      // 2. Insert payment record
      const { error: payError } = await supabase
        .from("pagos")
        .insert({
          id_factura: id,
          monto_pagado: invoice.total_general,
          metodo_pago: paymentMethod || "Efectivo",
          referencia: paymentReference || null,
        });

      if (payError) throw payError;

      // 3. Update financial account
      const { data: pm } = await supabase.from("payment_methods").select("account_id").eq("name", paymentMethod).maybeSingle();
      if (pm?.account_id) {
        const { data: acc } = await supabase.from("financial_accounts").select("balance").eq("id", pm.account_id).maybeSingle();
        if (acc) {
           await supabase.from("financial_accounts").update({ balance: acc.balance + invoice.total_general }).eq("id", pm.account_id);
        }
      }

      return invData;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["facturas"] });
      queryClient.invalidateQueries({ queryKey: ["financial_accounts"] });
      toast.success("Pago confirmado exitosamente");
      setConfirmOpen(false);
    },
    onError: (error: any) => {
      toast.error(`Error al confirmar pago: ${error.message}`);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const { error } = await supabase.from("facturas").delete().eq("id_factura", id);
      if (error) throw error;
      
      await logAuditAction("DELETE", "INVOICE", id.toString(), { message: "Factura eliminada desde SalesPage" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["facturas"] });
      toast.success("Factura eliminada");
    },
    onError: (err: any) => {
      toast.error("Error al eliminar la factura: " + err.message);
    }
  });

  const handleConfirmClick = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setPaymentMethod("");
    setPaymentReference("");
    setConfirmOpen(true);
  };

  const handleSavePayment = () => {
    if (!selectedInvoice) return;
    updatePaymentStatus.mutate({ id: selectedInvoice.id_factura, status: "pagado", invoice: selectedInvoice });
  };

  const generatePDFReport = async () => {
    try {
      await generateSalesReport(filtered, filterMonth);
      toast.success("Reporte generado exitosamente");
    } catch (err: any) {
      toast.error(`Error al generar reporte: ${err.message}`);
    }
  };

  const filtered = facturas.filter((f) => {
    if (q) {
      const term = q.toLowerCase();
      if (!(f.id_factura.toString().includes(term) || (f.paciente_nombre?.toLowerCase().includes(term)))) return false;
    }
    if (filterMonth && f.fecha_emision) {
      const date = new Date(f.fecha_emision);
      const yearMonth = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      if (yearMonth !== filterMonth) return false;
    }
    if (filterStatus !== "all") {
      const estado = f.estado_pago.toLowerCase();
      if (filterStatus === "pagado" && !(estado === "pagado" || estado === "paid")) return false;
      if (filterStatus === "pendiente" && !(estado === "pendiente" || estado === "pending")) return false;
      if (filterStatus === "cancelado" && !(estado === "cancelado" || estado === "cancelled")) return false;
    }
    return true;
  });

  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const paginated = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <div className="bg-card rounded-[2rem] p-6 shadow-sm min-h-[calc(100vh-8rem)] font-sans flex flex-col">
      <header className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <button className="text-muted-foreground hover:text-foreground"><ChevronLeft className="h-5 w-5" /></button>
          <h1 className="text-xl font-bold text-foreground">Facturación</h1>
        </div>
        <div className="flex-1 max-w-xl mx-auto">
          <div className="flex items-center gap-2 rounded-full bg-muted border border-gray-100 px-4 py-2.5 w-full">
            <Search className="h-4 w-4 text-muted-foreground" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Buscar facturas por ID o paciente..."
              className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground text-foreground"
            />
            {q && <button onClick={() => setQ("")} className="text-muted-foreground hover:text-foreground"><X className="h-4 w-4" /></button>}
          </div>
        </div>
        <div className="flex items-center gap-4 hidden md:flex">
          {/* Nueva Factura button was removed here */}
        </div>
      </header>

      <div className="flex flex-wrap items-center justify-between mb-4 border-b border-border/40 pb-4 mt-2">
        <div className="flex items-center gap-2 text-sm font-bold text-muted-foreground">
          <ReceiptText className="h-4 w-4" /> {filtered.length} facturas
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={generatePDFReport}
            className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-foreground border border-border/40 rounded-xl hover:bg-muted"
            title="Descargar reporte de pagos filtrados"
          >
            <Download className="h-3.5 w-3.5" /> Descargar PDF
          </button>
          <Popover>
            <PopoverTrigger asChild>
              <button className={cn("flex items-center gap-2 px-4 py-2 text-xs font-bold text-foreground border border-border/40 rounded-xl hover:bg-muted transition-colors", (filterMonth || filterStatus !== "all") && "bg-muted border-mauve text-mauve")}>
                <Filter className="h-3.5 w-3.5" /> {(filterMonth || filterStatus !== "all") ? "Filtrado" : "Filtros"}
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-60 rounded-2xl glass-card border-0 shadow-2xl p-4" align="end">
              <div className="space-y-4">
                <div className="space-y-2">
                  <h4 className="font-medium text-sm">Filtrar por Mes</h4>
                  <div className="flex gap-2 items-center">
                    <input
                      type="month"
                      value={filterMonth}
                      onChange={(e) => setFilterMonth(e.target.value)}
                      className="flex h-9 w-full rounded-xl border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                    />
                    {filterMonth && (
                      <button 
                        onClick={() => setFilterMonth("")}
                        className="p-2 hover:bg-muted rounded-lg text-muted-foreground transition-colors"
                        title="Limpiar filtro"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
                <div className="space-y-2">
                  <h4 className="font-medium text-sm">Estado de Pago</h4>
                  <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger className="w-full rounded-xl h-9 bg-transparent border-input">
                      <SelectValue placeholder="Todos" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl">
                      <SelectItem value="all">Todos</SelectItem>
                      <SelectItem value="pagado">Pagados</SelectItem>
                      <SelectItem value="pendiente">Pendientes</SelectItem>
                      <SelectItem value="cancelado">Cancelados</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>

      <div className="flex-1 overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-muted text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
              <th className="p-4 w-12 rounded-tl-xl"><input type="checkbox" className="rounded border-gray-300" /></th>
              <th className="p-4">ID Factura <span className="ml-1">↕</span></th>
              <th className="p-4">Paciente <span className="ml-1">↕</span></th>
              <th className="p-4">Fecha <span className="ml-1">↕</span></th>
              <th className="p-4">Monto Total <span className="ml-1">↕</span></th>
              <th className="p-4">Estado <span className="ml-1">↕</span></th>
              <th className="p-4 rounded-tr-xl">Acción <span className="ml-1">↕</span></th>
            </tr>
          </thead>
          <tbody className="text-sm">
            {isLoading ? (
              <tr><td colSpan={7} className="p-12 text-center"><Loader2 className="mx-auto h-6 w-6 animate-spin text-muted-foreground" /></td></tr>
            ) : paginated.length === 0 ? (
              <tr><td colSpan={7} className="p-12 text-center text-muted-foreground font-medium">No se encontraron facturas.</td></tr>
            ) : (
              paginated.map((f) => (
                <tr key={f.id_factura} className="border-b border-border/40 hover:bg-muted/50 transition group">
                  <td className="p-4"><input type="checkbox" className="rounded border-gray-300" /></td>
                  <td className="p-4 font-bold text-foreground">INV-{f.id_factura.toString().padStart(4, '0')}</td>
                  <td className="p-4 text-muted-foreground font-medium">{f.paciente_nombre}</td>
                  <td className="p-4 text-muted-foreground font-medium">{f.fecha_emision ? new Date(f.fecha_emision).toLocaleDateString() : '—'}</td>
                  <td className="p-4">
                    <span className="font-bold text-foreground">
                      ${f.total_general.toFixed(2)}
                    </span>
                  </td>
                  <td className="p-4">
                    <span className={cn(
                      "text-[10px] font-bold px-2.5 py-1 rounded-full tracking-wide capitalize",
                      f.estado_pago === "pagado" || f.estado_pago === "Paid" ? "bg-green-50 text-green-600 border border-green-100" : 
                      f.estado_pago === "pendiente" || f.estado_pago === "Pending" ? "bg-yellow-50 text-yellow-600 border border-yellow-100" :
                      "bg-destructive/10 text-destructive border border-red-100"
                    )}>
                      {f.estado_pago === "Paid" ? "pagado" : f.estado_pago === "Pending" ? "pendiente" : f.estado_pago}
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-3 text-muted-foreground">
                      {(f.estado_pago === "pagado" || f.estado_pago === "Paid") && (
                        <button 
                          onClick={() => {
                            toast.loading("Generando recibo...", { id: "receipt" });
                            generateIndividualInvoice(f)
                              .then(() => toast.success("Recibo generado", { id: "receipt" }))
                              .catch(() => toast.error("Error al generar", { id: "receipt" }));
                          }}
                          className="hover:text-primary cursor-pointer transition-colors"
                          title="Descargar Recibo"
                        >
                          <Download className="h-4 w-4" />
                        </button>
                      )}
                      {(f.estado_pago === "pendiente" || f.estado_pago === "Pending" || f.estado_pago === "Pendiente") && (
                        <button 
                          onClick={() => handleConfirmClick(f)}
                          className="flex items-center gap-1 text-xs font-bold text-mauve border border-mauve px-2 py-1 rounded-xl hover:bg-mauve/10 transition-colors cursor-pointer"
                          title="Confirmar Pago"
                        >
                          <CreditCard className="h-3.5 w-3.5" />
                          Confirmar
                        </button>
                      )}
                      <button className="hover:text-foreground cursor-pointer"><Pencil className="h-4 w-4" /></button>
                      <button 
                        className="hover:text-destructive cursor-pointer"
                        onClick={() => {
                          if (window.confirm(`¿Estás segura de que deseas eliminar la factura INV-${f.id_factura.toString().padStart(4, '0')}?`)) {
                            deleteMutation.mutate(f.id_factura);
                          }
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="sm:max-w-[425px] rounded-[2rem] p-6 border-0 shadow-2xl glass-card">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Confirmar Pago</DialogTitle>
            <DialogDescription>
              Selecciona el método de pago utilizado para la factura INV-{selectedInvoice?.id_factura?.toString().padStart(4, "0")}.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="metodo-pago">Método de Pago</Label>
              <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                <SelectTrigger id="metodo-pago" className="rounded-xl bg-background/50">
                  <SelectValue placeholder="Seleccione un método..." />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  {methods.filter(m => m.status === "Active").map(m => (
                    <SelectItem key={m.id} value={m.name}>{m.name}</SelectItem>
                  ))}
                  {methods.length === 0 && (
                     <SelectItem value="Efectivo">Efectivo</SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>

            {paymentMethod && methods.find(m => m.name === paymentMethod)?.category !== "Cash" && (
              <div className="grid gap-2">
                <Label htmlFor="referencia">Referencia</Label>
                <Input
                  id="referencia"
                  placeholder="Ej. 12345678"
                  value={paymentReference}
                  onChange={(e) => setPaymentReference(e.target.value)}
                  className="rounded-xl bg-background/50"
                />
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmOpen(false)} className="rounded-xl hover:bg-muted" disabled={updatePaymentStatus.isPending}>
              Cancelar
            </Button>
            <Button onClick={handleSavePayment} className="rounded-xl bg-mauve text-white hover:bg-mauve-dark" disabled={updatePaymentStatus.isPending}>
              {updatePaymentStatus.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Confirmar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between pt-4 border-t border-border/40">
          <p className="text-xs text-muted-foreground font-medium">
            Mostrando <span className="font-bold text-foreground">{(currentPage - 1) * itemsPerPage + 1} - {Math.min(filtered.length, currentPage * itemsPerPage)}</span> de <span className="font-bold text-foreground">{filtered.length}</span> facturas
          </p>
          <div className="flex gap-1">
            <button disabled={currentPage === 1} onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))} className="h-8 w-8 flex items-center justify-center rounded-lg border border-border/40 text-muted-foreground hover:bg-muted disabled:opacity-50"><ChevronLeft className="h-4 w-4" /></button>
            <button disabled={currentPage === totalPages} onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))} className="h-8 w-8 flex items-center justify-center rounded-lg border border-border/40 text-muted-foreground hover:bg-muted disabled:opacity-50"><ChevronRight className="h-4 w-4" /></button>
          </div>
        </div>
      )}
    </div>
  );
}
