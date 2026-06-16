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
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";

const MONTHS_ES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
];

const loadLogoBase64 = (url: string): Promise<string> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(img, 0, 0);
        resolve(canvas.toDataURL("image/png"));
      } else {
        resolve("");
      }
    };
    img.onerror = () => resolve("");
    img.src = url;
  });
};

const statusBg: Record<string, string> = {
  programada: "bg-mauve/15 text-mauve",
  completada: "bg-sage/50 text-sage-foreground",
  cancelada: "bg-destructive/15 text-destructive",
};

export function FacturacionPage() {
  const { data: appointments = [], isLoading } = useAppointments();
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
    try {
      const docObj = doctors.find((d) => d.id === app.doctor_id);
      const doctorName = docObj?.full_name || myProfile?.full_name || "Dra. Carli Solé Aquino";
      const doctorSpecialty = docObj?.specialty || myProfile?.specialty || "Ginecólogo Obstetra";

      const doc = new jsPDF({ unit: "pt", format: "a4" });
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();

      // Watermark
      try {
        const logoBase64 = await loadLogoBase64("/logo.png");
        if (logoBase64) {
          doc.saveGraphicsState();
          const gState = new (doc as any).GState({ opacity: 0.04 });
          doc.setGState(gState);
          const imgWidth = 550;
          const imgHeight = 550;
          const imgX = (pageWidth - imgWidth) / 2;
          const imgY = (pageHeight - imgHeight) / 2 - 20;
          doc.addImage(logoBase64, "PNG", imgX, imgY, imgWidth, imgHeight);
          doc.restoreGraphicsState();
        }
      } catch (watermarkErr) {
        console.error("Error drawing watermark:", watermarkErr);
      }

      // Font Setup
      doc.setFont("times", "normal");
      doc.setFontSize(8.5);
      doc.setTextColor(60, 60, 60);

      const clinicAddress1 = clinic?.address_line1 || "Calle las Flores entre González Padrón y Shettino, Número 16.";
      const clinicAddress2 = clinic?.address_line2 || "Valle de la Pascua, Estado Guárico.";
      const clinicPhone = clinic?.phone || "0412/8299890 0424/4609387";
      const clinicName = clinic?.name || "Femesalud";
      const clinicRif = clinic?.rif || "";

      // Header
      doc.text(clinicAddress1, pageWidth / 2, 45, { align: "center" });
      doc.text(clinicAddress2, pageWidth / 2, 57, { align: "center" });
      const headerLine3 = clinicRif ? `Teléfono: ${clinicPhone} | RIF: ${clinicRif}` : `Teléfono: ${clinicPhone}`;
      doc.text(headerLine3, pageWidth / 2, 69, { align: "center" });

      doc.setFont("times", "normal");
      doc.setFontSize(12.5);
      doc.setTextColor(0);
      doc.text("Consultorio Ginecológico Obstétrico", pageWidth / 2, 105, { align: "center" });
      doc.setFont("times", "italic");
      doc.setFontSize(17.5);
      doc.text(clinicName, pageWidth / 2, 122, { align: "center" });

      // Invoice metadata
      const today = new Date(app.scheduled_at);
      const topDay = String(today.getDate()).padStart(2, "0");
      const topMonth = String(today.getMonth() + 1).padStart(2, "0");
      const topYear = String(today.getFullYear());
      doc.setFont("times", "normal");
      doc.setFontSize(10.5);
      doc.text(`Fecha Emisión: ${topDay} / ${topMonth} / ${topYear}`, pageWidth - 70, 155, { align: "right" });
      doc.text(`Recibo Nº: FS-${app.id.slice(0, 8).toUpperCase()}`, 70, 155);

      // Title
      doc.setFont("times", "bold");
      doc.setFontSize(13);
      doc.text("RECIBO DE PAGO", pageWidth / 2, 195, { align: "center" });
      const titleWidth = doc.getTextWidth("RECIBO DE PAGO");
      doc.setDrawColor(0);
      doc.setLineWidth(0.5);
      doc.line(pageWidth / 2 - titleWidth / 2, 198, pageWidth / 2 + titleWidth / 2, 198);

      // Client Data
      doc.setFont("times", "bold");
      doc.setFontSize(11);
      doc.text("Datos del Paciente:", 70, 235);
      doc.setFont("times", "normal");
      doc.text(`Nombre: ${app.patient_name || "—"}`, 70, 255);
      doc.text(`Concepto: Cita médica - ${app.reason || "Consulta médica general"}`, 70, 275);

      let tableY = 310;
      if (app.payment_method) {
        doc.text(`Método de Pago: ${app.payment_method}`, 70, 295);
        tableY = 325;
        if (app.payment_reference) {
          doc.text(`Referencia: ${app.payment_reference}`, 70, 310);
          tableY = 340;
        }
      }

      // Details Table
      doc.setDrawColor(200);
      doc.line(70, tableY, pageWidth - 70, tableY); // Top Border
      doc.setFont("times", "bold");
      doc.text("Descripción del Servicio", 75, tableY + 18);
      doc.text("Monto ($)", pageWidth - 120, tableY + 18, { align: "right" });
      doc.line(70, tableY + 28, pageWidth - 70, tableY + 28); // Header divider

      doc.setFont("times", "normal");
      doc.text(app.reason || "Consulta Ginecológica / Obstétrica", 75, tableY + 48);
      doc.text(`$${Number(app.price || 0).toFixed(2)}`, pageWidth - 120, tableY + 48, { align: "right" });

      doc.line(70, tableY + 65, pageWidth - 70, tableY + 65); // Total divider
      doc.setFont("times", "bold");
      doc.text("Total Cancelado:", 75, tableY + 85);
      doc.setFontSize(12);
      doc.text(`$${Number(app.price || 0).toFixed(2)} USD`, pageWidth - 120, tableY + 85, { align: "right" });

      // Footer signature
      const sigY = 520;
      doc.setDrawColor(120);
      doc.setLineWidth(0.5);
      doc.setLineDashPattern([2, 2], 0);
      doc.line(pageWidth / 2 - 100, sigY, pageWidth / 2 + 100, sigY);
      doc.setLineDashPattern([], 0);

      doc.setFont("times", "bold");
      doc.setFontSize(11);
      doc.text(doctorName, pageWidth / 2, sigY + 16, { align: "center" });
      doc.setFont("times", "normal");
      doc.setFontSize(10);
      doc.text(doctorSpecialty, pageWidth / 2, sigY + 28, { align: "center" });

      doc.save(`Recibo_${(app.patient_name || "paciente").replace(/\s+/g, "_")}.pdf`);
      toast.success("Recibo PDF generado con éxito");
    } catch (err) {
      toast.error("Error al exportar recibo");
    }
  };

  const handleExportExcel = () => {
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
    try {
      const selectedMonthObj = monthOptions.find((m) => m.key === monthFilter);
      const reportTitle = selectedMonthObj
        ? `Reporte de Facturación - ${selectedMonthObj.label}`
        : "Reporte General de Facturación";

      const doc = new jsPDF({ unit: "pt", format: "a4" });
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();

      // Watermark
      try {
        const logoBase64 = await loadLogoBase64("/logo.png");
        if (logoBase64) {
          doc.saveGraphicsState();
          const gState = new (doc as any).GState({ opacity: 0.03 });
          doc.setGState(gState);
          const imgWidth = 500;
          const imgHeight = 500;
          const imgX = (pageWidth - imgWidth) / 2;
          const imgY = (pageHeight - imgHeight) / 2;
          doc.addImage(logoBase64, "PNG", imgX, imgY, imgWidth, imgHeight);
          doc.restoreGraphicsState();
        }
      } catch (watermarkErr) {
        console.error("Error drawing watermark:", watermarkErr);
      }

      // Font Setup
      doc.setFont("times", "normal");
      doc.setFontSize(8.5);
      doc.setTextColor(60, 60, 60);

      const clinicAddress1 = clinic?.address_line1 || "Calle las Flores entre González Padrón y Shettino, Número 16.";
      const clinicAddress2 = clinic?.address_line2 || "Valle de la Pascua, Estado Guárico.";
      const clinicPhone = clinic?.phone || "0412/8299890 0424/4609387";
      const clinicName = clinic?.name || "Femesalud";
      const clinicRif = clinic?.rif || "";

      // Header
      doc.text(clinicAddress1, pageWidth / 2, 40, { align: "center" });
      doc.text(clinicAddress2, pageWidth / 2, 52, { align: "center" });
      const headerLine3 = clinicRif ? `Teléfono: ${clinicPhone} | RIF: ${clinicRif}` : `Teléfono: ${clinicPhone}`;
      doc.text(headerLine3, pageWidth / 2, 64, { align: "center" });

      doc.setFont("times", "normal");
      doc.setFontSize(12);
      doc.setTextColor(0);
      doc.text("Consultorio Ginecológico Obstétrico", pageWidth / 2, 95, { align: "center" });
      doc.setFont("times", "italic");
      doc.setFontSize(16);
      doc.text(clinicName, pageWidth / 2, 110, { align: "center" });

      // Title
      doc.setFont("times", "bold");
      doc.setFontSize(14);
      doc.text(reportTitle.toUpperCase(), pageWidth / 2, 145, { align: "center" });
      const titleWidth = doc.getTextWidth(reportTitle.toUpperCase());
      doc.setDrawColor(0);
      doc.setLineWidth(0.75);
      doc.line(pageWidth / 2 - titleWidth / 2, 148, pageWidth / 2 + titleWidth / 2, 148);

      // Summary KPIs for the report
      const paidList = filtered.filter((a) => a.status === "completada" && a.payment_method);
      const unpaidList = filtered.filter((a) => a.status === "programada" || (a.status === "completada" && !a.payment_method));
      
      const totalPaid = paidList.reduce((sum, a) => sum + (Number(a.price) || 0), 0);
      const totalUnpaid = unpaidList.reduce((sum, a) => sum + (Number(a.price) || 0), 0);

      doc.setFont("times", "bold");
      doc.setFontSize(10.5);
      doc.text("Resumen Financiero:", 50, 180);
      doc.setFont("times", "normal");
      doc.text(`Total Recaudado: $${totalPaid.toLocaleString("es-ES")} USD (${paidList.length} cobrados)`, 50, 195);
      doc.text(`Total por Recaudar: $${totalUnpaid.toLocaleString("es-ES")} USD (${unpaidList.length} pendientes)`, 50, 210);
      doc.text(`Total Registros: ${filtered.length}`, 50, 225);

      // Table Data
      const tableHeaders = [["Fecha", "Paciente", "Concepto", "Monto", "Estado", "Método", "Referencia"]];
      const tableRows = filtered.map((a) => {
        const dateStr = new Date(a.scheduled_at).toLocaleDateString("es-ES", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric"
        });
        
        let displayStatus = "Pendiente";
        if (a.status === "completada") {
          displayStatus = a.payment_method ? "Cobrada" : "Por Cobrar";
        } else if (a.status === "cancelada") {
          displayStatus = "Cancelada";
        }

        return [
          dateStr,
          a.patient_name || "—",
          a.reason || "Consulta general",
          `$${Number(a.price || 0).toFixed(2)}`,
          displayStatus,
          a.payment_method || "—",
          a.payment_reference || "—"
        ];
      });

      autoTable(doc, {
        head: tableHeaders,
        body: tableRows,
        startY: 245,
        styles: {
          font: "times",
          fontSize: 9,
          cellPadding: 6,
        },
        headStyles: {
          fillColor: [108, 92, 124], // Mauve color matching design
          textColor: [255, 255, 255],
          fontStyle: "bold",
        },
        columnStyles: {
          0: { cellWidth: 70 }, // Fecha
          1: { cellWidth: 120 }, // Paciente
          2: { cellWidth: 100 }, // Concepto
          3: { cellWidth: 55, halign: "right" }, // Monto
          4: { cellWidth: 65 }, // Estado
          5: { cellWidth: 65 }, // Método
          6: { cellWidth: 65 } // Referencia
        },
        margin: { left: 50, right: 50 }
      });

      const filename = selectedMonthObj
        ? `Reporte_Facturacion_${selectedMonthObj.key}.pdf`
        : `Reporte_Facturacion_General.pdf`;

      doc.save(filename);
      toast.success("Reporte PDF generado con éxito");
    } catch (err) {
      toast.error("Error al exportar reporte mensual");
    }
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
                            ? "bg-mauve/15 text-mauve" // Purple for Pendiente
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
