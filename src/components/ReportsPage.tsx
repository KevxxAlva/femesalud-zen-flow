import { useMemo, useState } from "react";
import { FileBarChart, Download, Calendar as CalIcon, Users, CalendarClock, TrendingUp, CheckCircle2, Megaphone, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { usePatientsCountByDateRange } from "@/lib/api/patients";
import { useAppointments } from "@/lib/api/appointments";
import { useDoctors } from "@/lib/api/profiles";
import { useClinicInfo } from "@/lib/api/clinic";
import { useConsultations } from "@/lib/api/consultations";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { ReportsPlanificacionTable } from "./reports/ReportsPlanificacionTable";
import { ReportsFinancialChart } from "./reports/ReportsFinancialChart";
import { ReportsMarketingImpact } from "./reports/ReportsMarketingImpact";

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

function todayISO() { return new Date().toISOString().slice(0, 10); }
function daysAgoISO(n: number) { const d = new Date(); d.setDate(d.getDate() - n); return d.toISOString().slice(0, 10); }

const MONTHS_ES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
];

export function ReportsPage() {
  const [from, setFrom] = useState(daysAgoISO(90));
  const [to, setTo] = useState(todayISO());

  const { data: newPatientsCount = 0 } = usePatientsCountByDateRange(from, to);
  const { data: appointments = [] } = useAppointments({ from, to });
  const { data: doctors = [] } = useDoctors();
  const { data: clinic } = useClinicInfo();
  const { data: consultations = [] } = useConsultations({ from, to });

  // Query upcoming appointments separately to keep them lightweight
  const today = todayISO();
  const { data: upcomingAppointments = [] } = useAppointments({ from: today, status: "programada", limit: 15 });

  const doctorMap = useMemo(() => new Map(doctors.map((d) => [d.id, d.full_name || d.email])), [doctors]);

  const filtered = useMemo(() => {
    return appointments.filter((a) => {
      const d = a.scheduled_at.slice(0, 10);
      return d >= from && d <= to;
    });
  }, [appointments, from, to]);

  const stats = useMemo(() => {
    const completed = filtered.filter((a) => a.status === "completada");
    const scheduled = filtered.filter((a) => a.status === "programada");
    const cancelled = filtered.filter((a) => a.status === "cancelada");
    const income = completed.reduce((acc, a) => acc + (Number(a.price) || 0), 0);
    const newPatients = newPatientsCount;
    return { total: filtered.length, completed: completed.length, scheduled: scheduled.length, cancelled: cancelled.length, income, newPatients };
  }, [filtered, newPatientsCount]);

  const upcoming = useMemo(() => {
    return upcomingAppointments
      .sort((a, b) => a.scheduled_at.localeCompare(b.scheduled_at));
  }, [upcomingAppointments]);

  // Financial statistics by Month/Year
  const monthlyData = useMemo(() => {
    const completed = appointments.filter((a) => a.status === "completada" && a.price);
    const groups: Record<string, number> = {};
    completed.forEach((a) => {
      const date = new Date(a.scheduled_at);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      groups[key] = (groups[key] || 0) + (Number(a.price) || 0);
    });
    return Object.entries(groups)
      .map(([month, amount]) => ({ month, amount }))
      .sort((a, b) => a.month.localeCompare(b.month))
      .slice(-12); // Last 12 months
  }, [appointments]);

  const maxAmount = useMemo(() => {
    return Math.max(...monthlyData.map(d => d.amount), 1);
  }, [monthlyData]);

  const formattedMonthlyData = useMemo(() => {
    return monthlyData.map((d) => {
      const [yr, mn] = d.month.split("-");
      const label = `${MONTHS_ES[parseInt(mn) - 1].slice(0, 3)} '${yr.slice(2)}`;
      return {
        ...d,
        name: label,
        monto: d.amount,
      };
    });
  }, [monthlyData]);

  // Marketing acquisition statistics
  const marketingData = useMemo(() => {
    const counts: Record<string, number> = {};
    let totalConsultations = 0;
    consultations.forEach((c) => {
      if (c.contact_channel) {
        counts[c.contact_channel] = (counts[c.contact_channel] || 0) + 1;
        totalConsultations++;
      }
    });
    return Object.entries(counts)
      .map(([channel, count]) => ({
        channel,
        count,
        percentage: totalConsultations > 0 ? ((count / totalConsultations) * 100).toFixed(1) : "0",
      }))
      .sort((a, b) => b.count - a.count);
  }, [consultations]);

  const exportPDF = async () => {
    try {
      const [{ default: jsPDF }, { default: autoTable }] = await Promise.all([
        import("jspdf"),
        import("jspdf-autotable"),
      ]);
      const doc = new jsPDF({ unit: "pt", format: "a4" });
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();

      const logoBase64 = await loadLogoBase64("/logo.png");

      // Font Setup
      doc.setFont("times", "normal");
      doc.setFontSize(8.5);
      doc.setTextColor(60, 60, 60);

      const clinicAddress1 = clinic?.address_line1 || "Calle las Flores entre González Padrón y Shettino, Número 16.";
      const clinicAddress2 = clinic?.address_line2 || "Valle de la Pascua, Estado Guárico.";
      const clinicPhone = clinic?.phone || "0412/8299890 0424/4609387";
      const clinicName = clinic?.name || "Femesalud";
      const clinicRif = clinic?.rif || "";

      // Top Header
      doc.text(clinicAddress1, pageWidth / 2, 45, { align: "center" });
      doc.text(clinicAddress2, pageWidth / 2, 57, { align: "center" });
      const headerLine3 = clinicRif ? `Teléfono: ${clinicPhone} | RIF: ${clinicRif}` : `Teléfono: ${clinicPhone}`;
      doc.text(headerLine3, pageWidth / 2, 69, { align: "center" });

      // Consultorio Header
      doc.setFont("times", "normal");
      doc.setFontSize(12.5);
      doc.setTextColor(0);
      doc.text("Consultorio Ginecológico Obstétrico", pageWidth / 2, 105, { align: "center" });
      doc.setFont("times", "italic");
      doc.setFontSize(17.5);
      doc.text(clinicName, pageWidth / 2, 122, { align: "center" });

      // Date Format: Valle de la Pascua, DD / MM / AAAA
      const today = new Date();
      const topDay = String(today.getDate()).padStart(2, "0");
      const topMonth = String(today.getMonth() + 1).padStart(2, "0");
      const topYear = String(today.getFullYear());
      doc.setFont("times", "normal");
      doc.setFontSize(10.5);
      doc.text(`Valle de la Pascua,   ${topDay}   /   ${topMonth}   /   ${topYear}`, pageWidth - 40, 155, { align: "right" });

      // Title
      doc.setFont("times", "bold");
      doc.setFontSize(13);
      doc.text("REPORTE ANALÍTICO Y EJECUTIVO", pageWidth / 2, 195, { align: "center" });
      const titleWidth = doc.getTextWidth("REPORTE ANALÍTICO Y EJECUTIVO");
      doc.setDrawColor(0);
      doc.setLineWidth(0.5);
      doc.line(pageWidth / 2 - titleWidth / 2, 198, pageWidth / 2 + titleWidth / 2, 198);

      // Date range & generation info
      doc.setFont("times", "normal");
      doc.setFontSize(10);
      doc.setTextColor(40, 40, 50);
      doc.text(`Rango del Reporte: ${from}  a  ${to}`, 40, 225);
      doc.setFontSize(8.5);
      doc.setTextColor(120, 120, 130);
      doc.text(`Generado: ${new Date().toLocaleString("es-ES")}`, 40, 238);

      // Section 1: KPIs
      doc.setTextColor(40, 40, 50);
      doc.setFontSize(11);
      doc.setFont("times", "bold");
      doc.text("1. Resumen de Indicadores Clave (Período Seleccionado)", 40, 265);

      autoTable(doc, {
        startY: 272,
        head: [["Indicador", "Valor Registrado", "Contexto / Tipo"]],
        body: [
          ["Ingresos Totales (Citas Completadas)", `$${stats.income.toLocaleString("es-ES")}`, "Financiero"],
          ["Pacientes Nuevos Registrados", String(stats.newPatients), "Marketing"],
          ["Citas Totales Agendadas", String(stats.total), "Operativo"],
          ["Citas Completadas", String(stats.completed), "Operativo"],
          ["Citas Programadas (Pendientes)", String(stats.scheduled), "Operativo"],
          ["Citas Canceladas", String(stats.cancelled), "Operativo"],
        ],
        theme: "grid",
        headStyles: { fillColor: [139, 92, 175], textColor: 255, font: "times" },
        styles: { font: "times", fontSize: 9, cellPadding: 5 },
        margin: { left: 40, right: 40 },
      });

      // Section 2: Marketing Channels
      const yAcq = (doc as any).lastAutoTable.finalY + 20;
      doc.setFontSize(11);
      doc.setFont("times", "bold");
      doc.text("2. Canales de Adquisición de Pacientes (Marketing)", 40, yAcq);

      autoTable(doc, {
        startY: yAcq + 6,
        head: [["Canal de Contacto", "Consultas Registradas", "Porcentaje de Impacto"]],
        body: marketingData.map(d => [d.channel, String(d.count), `${d.percentage}%`]),
        theme: "grid",
        headStyles: { fillColor: [139, 92, 175], textColor: 255, font: "times" },
        styles: { font: "times", fontSize: 9, cellPadding: 5 },
        margin: { left: 40, right: 40 },
      });

      // Section 3: Monthly Breakdown
      const yMonthly = (doc as any).lastAutoTable.finalY + 20;
      doc.setFontSize(11);
      doc.setFont("times", "bold");
      doc.text("3. Desglose Histórico de Ingresos (Últimos 12 Meses)", 40, yMonthly);

      autoTable(doc, {
        startY: yMonthly + 6,
        head: [["Mes / Año", "Monto Total Facturado"]],
        body: monthlyData.map(d => {
          const [yr, mn] = d.month.split("-");
          return [`${MONTHS_ES[parseInt(mn) - 1]} ${yr}`, `$${d.amount.toLocaleString("es-ES")}`];
        }),
        theme: "grid",
        headStyles: { fillColor: [139, 92, 175], textColor: 255, font: "times" },
        styles: { font: "times", fontSize: 9, cellPadding: 5 },
        margin: { left: 40, right: 40 },
      });

      // Draw Watermark and Page Footer on all pages
      const pageCount = doc.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);

        // Draw Watermark Logo in center
        try {
          if (logoBase64) {
            doc.saveGraphicsState();
            const gState = new (doc as any).GState({ opacity: 0.03 });
            doc.setGState(gState);
            const imgWidth = 450;
            const imgHeight = 450;
            const imgX = (pageWidth - imgWidth) / 2;
            const imgY = (pageHeight - imgHeight) / 2 - 20;
            doc.addImage(logoBase64, "PNG", imgX, imgY, imgWidth, imgHeight);
            doc.restoreGraphicsState();
          }
        } catch (watermarkErr) {
          console.error("Error drawing watermark:", watermarkErr);
        }

        // Footer Text
        doc.setFont("times", "normal");
        doc.setFontSize(8);
        doc.setTextColor(150, 150, 150);
        doc.text(`FemeSalud — Reporte Ejecutivo de Gestión`, 40, pageHeight - 20);
        doc.text(`Página ${i} de ${pageCount}`, pageWidth - 40, pageHeight - 20, { align: "right" });
      }

      doc.save(`femesalud-reporte-ejecutivo-${from}-${to}.pdf`);
      toast.success("Reporte analítico exportado");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al exportar");
    }
  };

  const kpis = [
    { label: "Citas en rango", value: stats.total, icon: CalendarClock, tone: "text-mauve" },
    { label: "Completadas", value: stats.completed, icon: CheckCircle2, tone: "text-sage-foreground" },
    { label: "Pacientes nuevos", value: stats.newPatients, icon: Users, tone: "text-blush-foreground" },
    { label: "Ingresos", value: `$${stats.income.toLocaleString("es-ES")}`, icon: DollarSign, tone: "text-mauve" },
  ];

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div className="ml-14 md:ml-0">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Módulo</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">Reportes y Control</h1>
          <p className="text-sm text-muted-foreground">Estadísticas, ingresos financieros y canales de adquisición.</p>
        </div>
        <Button onClick={exportPDF} className="rounded-2xl bg-gradient-to-r from-mauve to-mauve-soft text-primary-foreground shadow-sm shadow-mauve/30 cursor-pointer">
          <Download className="mr-1 h-4 w-4" /> Exportar Reporte Ejecutivo
        </Button>
      </header>

      <div className="rounded-3xl glass-card p-5 shadow-sm border border-border/40">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
            <CalIcon className="h-3.5 w-3.5" /> Rango de fechas
          </div>
          <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="rounded-xl w-[170px]" />
          <span className="text-muted-foreground text-xs">a</span>
          <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="rounded-xl w-[170px]" />
          <div className="flex gap-1.5 ml-auto">
            {[
              { l: "7 días", n: 7 }, { l: "30 días", n: 30 }, { l: "90 días", n: 90 },
            ].map((p) => (
              <button key={p.l} onClick={() => { setFrom(daysAgoISO(p.n)); setTo(todayISO()); }}
                className="rounded-full bg-muted/60 px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted cursor-pointer transition">
                {p.l}
              </button>
            ))}
          </div>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 bg-muted/60 p-1 rounded-2xl">
          <TabsTrigger value="overview" className="rounded-xl font-medium text-xs">Vista General</TabsTrigger>
          <TabsTrigger value="financial" className="rounded-xl font-medium text-xs">Resumen Financiero</TabsTrigger>
          <TabsTrigger value="marketing" className="rounded-xl font-medium text-xs">Canales de Marketing</TabsTrigger>
        </TabsList>

        {/* TAB 1: OVERVIEW */}
        <TabsContent value="overview" className="space-y-6 mt-0 outline-none">
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {kpis.map((k) => {
              const Icon = k.icon;
              return (
                <div key={k.label} className="rounded-3xl glass-card p-5 shadow-sm border border-border/40">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-2xl bg-muted ${k.tone}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <p className="mt-4 text-xs text-muted-foreground">{k.label}</p>
                  <p className="font-display text-2xl font-semibold tracking-tight mt-1">{k.value}</p>
                </div>
              );
            })}
          </div>

          <ReportsPlanificacionTable upcoming={upcoming} doctorMap={doctorMap} />
        </TabsContent>

        {/* TAB 2: FINANCIAL */}
        <TabsContent value="financial" className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-0 outline-none">
          <ReportsFinancialChart monthlyData={monthlyData} formattedMonthlyData={formattedMonthlyData} />
        </TabsContent>

        {/* TAB 3: MARKETING */}
        <TabsContent value="marketing" className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-0 outline-none">
          <ReportsMarketingImpact marketingData={marketingData} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
