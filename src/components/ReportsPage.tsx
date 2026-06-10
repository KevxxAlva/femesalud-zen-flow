import { useMemo, useState } from "react";
import { FileBarChart, Download, Calendar as CalIcon, Users, CalendarClock, TrendingUp, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { usePatients } from "@/lib/api/patients";
import { useAppointments } from "@/lib/api/appointments";
import { useDoctors } from "@/lib/api/profiles";
import { toast } from "sonner";

function todayISO() { return new Date().toISOString().slice(0, 10); }
function daysAgoISO(n: number) { const d = new Date(); d.setDate(d.getDate() - n); return d.toISOString().slice(0, 10); }

export function ReportsPage() {
  const { data: patients = [] } = usePatients();
  const { data: appointments = [] } = useAppointments();
  const { data: doctors = [] } = useDoctors();

  const [from, setFrom] = useState(daysAgoISO(30));
  const [to, setTo] = useState(todayISO());

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
    const newPatients = patients.filter((p) => p.created_at.slice(0, 10) >= from && p.created_at.slice(0, 10) <= to).length;
    return { total: filtered.length, completed: completed.length, scheduled: scheduled.length, cancelled: cancelled.length, income, newPatients };
  }, [filtered, patients, from, to]);

  const upcoming = useMemo(() => {
    const today = todayISO();
    return appointments
      .filter((a) => a.status === "programada" && a.scheduled_at.slice(0, 10) >= today)
      .sort((a, b) => a.scheduled_at.localeCompare(b.scheduled_at));
  }, [appointments]);

  const exportPDF = () => {
    try {
      const doc = new jsPDF({ unit: "pt", format: "a4" });
      const pageWidth = doc.internal.pageSize.getWidth();

      // Header
      doc.setFillColor(139, 92, 175);
      doc.rect(0, 0, pageWidth, 60, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(20);
      doc.text("FemeSalud", 40, 38);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.text("Reporte ejecutivo", pageWidth - 40, 38, { align: "right" });

      doc.setTextColor(40, 40, 50);
      doc.setFontSize(11);
      doc.text(`Rango: ${from}  →  ${to}`, 40, 88);
      doc.setFontSize(9);
      doc.setTextColor(120, 120, 130);
      doc.text(`Generado: ${new Date().toLocaleString("es-ES")}`, 40, 104);

      // KPIs table
      doc.setTextColor(40, 40, 50);
      doc.setFontSize(13);
      doc.setFont("helvetica", "bold");
      doc.text("Indicadores clave", 40, 134);

      autoTable(doc, {
        startY: 144,
        head: [["Métrica", "Valor"]],
        body: [
          ["Citas en el período", String(stats.total)],
          ["Completadas", String(stats.completed)],
          ["Programadas", String(stats.scheduled)],
          ["Canceladas", String(stats.cancelled)],
          ["Ingresos estimados", `$${stats.income.toLocaleString("es-ES")}`],
          ["Pacientes nuevos", String(stats.newPatients)],
          ["Pacientes totales", String(patients.length)],
        ],
        theme: "grid",
        headStyles: { fillColor: [139, 92, 175], textColor: 255 },
        styles: { fontSize: 10, cellPadding: 6 },
        margin: { left: 40, right: 40 },
      });

      // Upcoming appointments
      const after = (doc as any).lastAutoTable.finalY + 24;
      doc.setFontSize(13);
      doc.setFont("helvetica", "bold");
      doc.text("Próximas citas", 40, after);

      autoTable(doc, {
        startY: after + 10,
        head: [["Fecha", "Hora", "Paciente", "Médico", "Motivo"]],
        body: upcoming.slice(0, 50).map((a) => {
          const dt = new Date(a.scheduled_at);
          const pad = (n: number) => String(n).padStart(2, "0");
          return [
            dt.toLocaleDateString("es-ES", { day: "2-digit", month: "short", year: "numeric" }),
            `${pad(dt.getHours())}:${pad(dt.getMinutes())}`,
            a.patient_name ?? "—",
            doctorMap.get(a.doctor_id) ?? "—",
            a.reason ?? "—",
          ];
        }),
        theme: "striped",
        headStyles: { fillColor: [139, 92, 175], textColor: 255 },
        styles: { fontSize: 9, cellPadding: 5 },
        margin: { left: 40, right: 40 },
      });

      // Footer on each page
      const pageCount = doc.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(150);
        doc.text(`FemeSalud — Página ${i} de ${pageCount}`, pageWidth / 2, doc.internal.pageSize.getHeight() - 20, { align: "center" });
      }

      doc.save(`femesalud-reporte-${from}-${to}.pdf`);
      toast.success("Reporte exportado");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al exportar");
    }
  };

  const kpis = [
    { label: "Citas en rango", value: stats.total, icon: CalendarClock, tone: "text-mauve" },
    { label: "Completadas", value: stats.completed, icon: CheckCircle2, tone: "text-sage-foreground" },
    { label: "Pacientes nuevos", value: stats.newPatients, icon: Users, tone: "text-blush-foreground" },
    { label: "Ingresos", value: `$${stats.income.toLocaleString("es-ES")}`, icon: TrendingUp, tone: "text-mauve" },
  ];

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div className="ml-14 md:ml-0">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Módulo</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">Reportes</h1>
          <p className="text-sm text-muted-foreground">Exporta KPIs y próximas citas a PDF</p>
        </div>
        <Button onClick={exportPDF} className="rounded-2xl bg-gradient-to-r from-mauve to-mauve-soft text-primary-foreground shadow-sm shadow-mauve/30">
          <Download className="mr-1 h-4 w-4" /> Exportar PDF
        </Button>
      </header>

      <div className="rounded-3xl glass-card p-5 shadow-sm">
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
                className="rounded-full bg-muted/60 px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted">
                {p.l}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {kpis.map((k) => {
          const Icon = k.icon;
          return (
            <div key={k.label} className="rounded-3xl glass-card p-5 shadow-sm">
              <div className={`flex h-10 w-10 items-center justify-center rounded-2xl bg-muted ${k.tone}`}>
                <Icon className="h-5 w-5" />
              </div>
              <p className="mt-4 text-xs text-muted-foreground">{k.label}</p>
              <p className="font-display text-2xl font-semibold tracking-tight">{k.value}</p>
            </div>
          );
        })}
      </div>

      <div className="rounded-3xl glass-card p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Vista previa</p>
            <h3 className="mt-1 text-lg font-semibold flex items-center gap-2">
              <FileBarChart className="h-5 w-5 text-mauve" /> Próximas citas ({upcoming.length})
            </h3>
          </div>
        </div>
        <div className="overflow-hidden rounded-2xl border border-border/60">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-left text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-4 py-2">Fecha</th>
                <th className="px-4 py-2">Paciente</th>
                <th className="px-4 py-2">Médico</th>
                <th className="px-4 py-2">Motivo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {upcoming.slice(0, 10).map((a) => {
                const dt = new Date(a.scheduled_at);
                const pad = (n: number) => String(n).padStart(2, "0");
                return (
                  <tr key={a.id} className="hover:bg-muted/30">
                    <td className="px-4 py-2 text-xs">
                      {dt.toLocaleDateString("es-ES", { day: "2-digit", month: "short" })} · {pad(dt.getHours())}:{pad(dt.getMinutes())}
                    </td>
                    <td className="px-4 py-2 font-medium">{a.patient_name}</td>
                    <td className="px-4 py-2 text-xs text-muted-foreground">{doctorMap.get(a.doctor_id) ?? "—"}</td>
                    <td className="px-4 py-2 text-xs text-muted-foreground">{a.reason ?? "—"}</td>
                  </tr>
                );
              })}
              {upcoming.length === 0 && (
                <tr><td colSpan={4} className="px-4 py-6 text-center text-xs text-muted-foreground">No hay citas próximas.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
