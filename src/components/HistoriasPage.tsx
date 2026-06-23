import { useState, useMemo, useEffect } from "react";
import { usePaginatedPatients, usePatient, type Patient } from "@/lib/api/patients";
import { usePatientConsultations, type Consultation } from "@/lib/api/consultations";
import { useDoctors } from "@/lib/api/profiles";
import { useClinicInfo } from "@/lib/api/clinic";
import { Search, FileText, HeartPulse, User, Calendar, Plus, Printer, Activity, Scissors, Stethoscope, ChevronDown, ChevronUp, Loader2, ChevronLeft, ChevronRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { generateRecipePDF } from "@/lib/utils/recipePdf";

export function HistoriasPage() {
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const { data: fullPatient } = usePatient(selectedPatientId);
  const { data: consultations = [], isLoading: loadingConsultations } = usePatientConsultations(selectedPatientId || undefined);
  const { data: doctors = [] } = useDoctors();
  const { data: clinic } = useClinicInfo();

  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [expandedConsultations, setExpandedConsultations] = useState<Record<string, boolean>>({});
  const [sidebarPage, setSidebarPage] = useState(1);
  const itemsPerPage = 15;

  // Debounce search input by 350ms for server-side search
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchQuery.trim()), 350);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    setSidebarPage(1);
  }, [debouncedSearch]);

  const { data: paginatedResult, isLoading: loadingPatients } = usePaginatedPatients(sidebarPage, itemsPerPage, debouncedSearch || undefined);
  const patients = paginatedResult?.data ?? [];
  const totalPatientCount = paginatedResult?.count ?? 0;

  const doctorMap = useMemo(() => new Map(doctors.map((d) => [d.id, d.full_name || d.email])), [doctors]);

  // Server-side pagination - no client filtering needed
  const totalPages = Math.ceil(totalPatientCount / itemsPerPage);
  const paginatedPatients = patients;

  const selectedPatient = fullPatient || null;

  // Get consultations for the selected patient
  const patientConsultations = consultations;

  const toggleConsultation = (id: string) => {
    setExpandedConsultations((prev) => ({ ...prev, [id]: !prev[id] }));
  };

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

  // Export full clinical record as PDF
  const handleExportFullHistory = async (patient: Patient, visits: Consultation[]) => {
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

      // Draw top header
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

      const today = new Date();
      doc.setFont("times", "normal");
      doc.setFontSize(10);
      doc.text(`Fecha de Impresión: ${today.toLocaleDateString("es-ES")}`, pageWidth - 40, 150, { align: "right" });

      // Title
      doc.setFont("times", "bold");
      doc.setFontSize(14);
      doc.text("HISTORIA CLÍNICA COMPLETA", pageWidth / 2, 185, { align: "center" });
      const titleWidth = doc.getTextWidth("HISTORIA CLÍNICA COMPLETA");
      doc.setDrawColor(0);
      doc.setLineWidth(0.75);
      doc.line(pageWidth / 2 - titleWidth / 2, 188, pageWidth / 2 + titleWidth / 2, 188);

      // Section 1: Identificación
      doc.setFont("times", "bold");
      doc.setFontSize(11);
      doc.text("1. Datos de Identificación", 40, 215);

      autoTable(doc, {
        startY: 222,
        body: [
          ["Nº Historia", patient.historia_number || "—", "Fecha 1ª Cita", patient.first_visit_date || "—"],
          ["Nombre Completo", patient.full_name || "—", "Cédula / ID", patient.document_id || "—"],
          ["F. Nacimiento", patient.birth_date || "—", "Estado Civil", patient.marital_status || "—"],
          ["Lugar Nacimiento", patient.birthplace || "—", "Teléfono", patient.phone || "—"],
          ["Grado Instrucción", patient.education_level || "—", "Ocupación", patient.occupation || "—"],
          ["Etnia / Raza", patient.ethnicity || "—", "Correo Electrónico", patient.email || "—"],
          ["Dirección", patient.address || "—", "Médico Asignado", doctorMap.get(patient.assigned_doctor_id ?? "") || "Sin asignar"],
          ["Motivo de Consulta", { content: patient.consultation_reason || "—", colSpan: 3 }],
          ["Enfermedad Actual", { content: patient.current_illness || "—", colSpan: 3 }]
        ],
        theme: "grid",
        styles: { font: "times", fontSize: 9, cellPadding: 4 },
        columnStyles: {
          0: { fontStyle: "bold", fillColor: [245, 242, 247], cellWidth: 95 },
          1: { cellWidth: 162 },
          2: { fontStyle: "bold", fillColor: [245, 242, 247], cellWidth: 95 },
          3: { cellWidth: 163 }
        },
        margin: { left: 40, right: 40 },
      });

      // Section 2: Antecedentes
      const y2 = (doc as any).lastAutoTable.finalY + 15;
      doc.setFont("times", "bold");
      doc.setFontSize(11);
      doc.text("2. Antecedentes Médicos y Gineco-Obstétricos", 40, y2);

      autoTable(doc, {
        startY: y2 + 5,
        body: [
          ["A.F. Madre", patient.family_history?.mother || "Niega / Sano", "A.F. Padre", patient.family_history?.father || "Niega / Sano"],
          ["A.F. Hermanos", patient.family_history?.siblings || "Niega / Sano", "A.F. Hijos", patient.family_history?.children || "Niega / Sano"],
          ["A.P. Tabaco", patient.personal_history?.tobacco || "NIEGA", "A.P. Alcohol", patient.personal_history?.alcohol || "NIEGA"],
          ["A.P. Drogas", patient.personal_history?.drugs || "NIEGA", "A.P. Patología Base", patient.personal_history?.base_pathology || "Niega"],
          ["A.P. Quirúrgicos", patient.personal_history?.surgical || "Niega", "A.P. Alérgicos", patient.personal_history?.allergies || "Niega"],
          ["Menarquía", patient.gynecological_data?.menarche || "—", "Sexarquía", patient.gynecological_data?.sexarche || "—"],
          ["Ciclo Menstrual", patient.gynecological_data?.menstrual_cycle || "—", "Dismenorrea", patient.gynecological_data?.dysmenorrhea || "—"],
          ["NPS / ITS", `${patient.gynecological_data?.nps || "—"} / ${patient.gynecological_data?.its || "Ninguna"}`, "Última Citología", patient.gynecological_data?.cytology || "—"],
          ["Anticonceptivos", patient.gynecological_data?.contraceptives || "—", "Gestas / Partos", `G:${patient.obstetric_data?.g ?? 0} P:${patient.obstetric_data?.p ?? 0} C:${patient.obstetric_data?.c ?? 0} A:${patient.obstetric_data?.a ?? 0}`],
          ["Período Intergenésico", patient.obstetric_data?.pig || "—", "Emb. Múltiples/Ect.", `Mult: ${patient.obstetric_data?.em ?? 0} Ect: ${patient.obstetric_data?.ee ?? 0}`],
          ["FUM / FPP", `FUM: ${patient.obstetric_data?.fum || "—"} / FPP: ${patient.obstetric_data?.fpp || "—"}`, "Complicaciones", patient.obstetric_data?.complications || "Ninguna"]
        ],
        theme: "grid",
        styles: { font: "times", fontSize: 9, cellPadding: 4 },
        columnStyles: {
          0: { fontStyle: "bold", fillColor: [245, 242, 247], cellWidth: 95 },
          1: { cellWidth: 162 },
          2: { fontStyle: "bold", fillColor: [245, 242, 247], cellWidth: 95 },
          3: { cellWidth: 163 }
        },
        margin: { left: 40, right: 40 },
      });

      // Section 3: Timeline of Consultations
      let lastY = (doc as any).lastAutoTable.finalY + 20;

      doc.setFont("times", "bold");
      doc.setFontSize(11);
      doc.text("3. Registro de Consultas y Evolución", 40, lastY);
      lastY += 8;

      if (visits.length === 0) {
        doc.setFont("times", "italic");
        doc.setFontSize(10);
        doc.setTextColor(120);
        doc.text("No se registran consultas clínicas estructuradas para esta paciente.", 40, lastY + 10);
      } else {
        visits.forEach((v, index) => {
          // Check if we need to add a new page
          if (lastY > pageHeight - 120) {
            doc.addPage();
            lastY = 60;
          }

          const visitDate = new Date(v.created_at).toLocaleDateString("es-ES", {
            day: "2-digit",
            month: "long",
            year: "numeric",
          });

          doc.setFont("times", "bold");
          doc.setFontSize(10);
          doc.setTextColor(139, 92, 175); // Purple brand color
          doc.text(`Consulta #${visits.length - index} — ${visitDate} (${v.visit_type})`, 40, lastY);
          doc.setTextColor(0);
          
          doc.setDrawColor(200);
          doc.setLineWidth(0.5);
          doc.line(40, lastY + 3, pageWidth - 40, lastY + 3);

          const tableRows: any[][] = [
            ["Subjetivo / Motivo", v.subjective_exam || "—", "Signos Vitales", `Talla: ${v.height_cm ? v.height_cm + "cm" : "—"} | Peso: ${v.weight_kg ? v.weight_kg + "kg" : "—"}\nIMC: ${v.bmi || "—"} | TA: ${v.blood_pressure || "—"}\nFC: ${v.heart_rate ? v.heart_rate + "lpm" : "—"} | T°: ${v.temperature ? v.temperature + "°C" : "—"}`],
            ["Examen Físico", `Mamas: ${v.breasts || "—"}\nAbdomen: ${v.abdomen || "—"}\nGineco: ${v.gynecological || "—"}`, "Colposcopia", `Ácido Acético: ${v.acetic_acid_test || "—"} (${v.acetic_clock_position || "—"} - ${v.acetic_relative_position || "—"})\nLugol: ${v.lugol_test || "—"} (${v.lugol_clock_position || "—"} - ${v.lugol_relative_position || "—"})`],
          ];

          if (v.gestational_age || v.fetal_heart_rate) {
            tableRows.push([
              "Control Obstétrico",
              `EG: ${v.gestational_age || "—"} | AU: ${v.uterine_height ? v.uterine_height + "cm" : "—"}\nPresentación: ${v.presentation || "—"}\nFCF: ${v.fetal_heart_rate ? v.fetal_heart_rate + "lpm" : "—"}`,
              "Detalles Obstet.",
              `Peso Fetal: ${v.fetal_weight ? v.fetal_weight + "g" : "—"}\nMovimientos: ${v.fetal_movements || "—"}\nEdema: ${v.edema || "—"}\nAlarma: ${v.alarm_signs || "—"}`
            ]);
          }

          tableRows.push([
            "Diagnóstico",
            v.diagnosis || "—",
            "Indicaciones / Plan",
            v.indications || "—"
          ]);

          if (v.complementary_exams || v.plan) {
            tableRows.push([
              "Exámenes Solicitados",
              v.complementary_exams || "—",
              "Plan General / Seguimiento",
              v.plan || "—"
            ]);
          }

          if (v.consumables && v.consumables.length > 0) {
            const consStr = v.consumables.map(c => `${c.item_name}: ${c.quantity} ${c.unit || ""}`).join(", ");
            tableRows.push([
              "Materiales Usados",
              { content: consStr, colSpan: 3 }
            ]);
          }

          autoTable(doc, {
            startY: lastY + 8,
            body: tableRows,
            theme: "grid",
            styles: { font: "times", fontSize: 8.5, cellPadding: 3.5 },
            columnStyles: {
              0: { fontStyle: "bold", fillColor: [248, 248, 250], cellWidth: 95 },
              1: { cellWidth: 162 },
              2: { fontStyle: "bold", fillColor: [248, 248, 250], cellWidth: 95 },
              3: { cellWidth: 163 }
            },
            margin: { left: 40, right: 40 }
          });

          lastY = (doc as any).lastAutoTable.finalY + 20;
        });
      }

      // Add watermark & footers to all pages
      const pageCount = doc.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        // Watermark
        try {
          if (logoBase64) {
            doc.saveGraphicsState();
            const gState = new (doc as any).GState({ opacity: 0.03 });
            doc.setGState(gState);
            doc.addImage(logoBase64, "PNG", (pageWidth - 500) / 2, (pageHeight - 500) / 2, 500, 500);
            doc.restoreGraphicsState();
          }
        } catch {}

        // Footer Text
        doc.setFont("times", "normal");
        doc.setFontSize(8);
        doc.setTextColor(150, 150, 150);
        doc.text(`FemeSalud — Historia Clínica de ${patient.full_name}`, 40, pageHeight - 20);
        doc.text(`Página ${i} de ${pageCount}`, pageWidth - 40, pageHeight - 20, { align: "right" });
      }

      doc.save(`Historia_Clinica_${patient.full_name.replace(/\s+/g, "_")}.pdf`);
      toast.success("Expediente clínico exportado correctamente");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al exportar la historia clínica");
    }
  };

  const handleExportRecipe = async (patient: Patient, consultation: Consultation) => {
    const doctorObj = doctors.find((d) => d.id === consultation.doctor_id);
    const doctorName = doctorObj?.full_name || doctorMap.get(consultation.doctor_id ?? "") || "Médico Tratante";
    const doctorSpecialty = doctorObj?.specialty || undefined;

    await generateRecipePDF(
      {
        full_name: patient.full_name,
        document_id: patient.document_id,
        birth_date: patient.birth_date,
      },
      {
        created_at: consultation.created_at,
        indications: consultation.indications,
      },
      doctorName,
      doctorSpecialty,
      doctorObj?.university || undefined,
      doctorObj?.mpps || undefined,
      doctorObj?.cmc || undefined
    );
  };

  return (
    <div className="space-y-6 h-[calc(100vh-140px)] flex flex-col min-h-0">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div className="ml-14 md:ml-0">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Módulo Clínico</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">Historias Clínicas</h1>
          <p className="text-sm text-muted-foreground">Expedientes clínicos y registro cronológico de consultas.</p>
        </div>
      </header>

      <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-6 min-h-0">
        {/* LEFT PANEL: Patient Search & List */}
        <div className="md:col-span-1 rounded-3xl glass-card border border-border/40 p-4 flex flex-col min-h-0 shadow-sm">
          <div className="relative mb-3">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por nombre, historia o cédula..."
              className="pl-9 rounded-2xl bg-muted/40 h-10 border-border/30 text-xs"
            />
          </div>

          <ScrollArea className="flex-1 pr-1.5">
            {loadingPatients ? (
              <div className="flex items-center justify-center py-12"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
            ) : paginatedPatients.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-8">No se encontraron pacientes.</p>
            ) : (
              <div className="space-y-1.5">
                {paginatedPatients.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => {
                      setSelectedPatientId(p.id);
                      setExpandedConsultations({});
                    }}
                    className={cn(
                      "w-full text-left p-3 rounded-2xl border transition duration-200 flex flex-col gap-1 cursor-pointer",
                      selectedPatientId === p.id
                        ? "bg-mauve/10 border-mauve text-mauve-foreground"
                        : "bg-card/50 border-border/40 hover:bg-card hover:border-border"
                    )}
                  >
                    <div className="flex items-start justify-between">
                      <span className="font-bold text-xs truncate pr-1">{p.full_name}</span>
                      {p.historia_number && (
                        <span className="text-[10px] bg-muted px-1.5 py-0.5 rounded font-extrabold text-muted-foreground shrink-0">
                          #{p.historia_number}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-muted-foreground mt-0.5">
                      <span>C.I. {p.document_id || "—"}</span>
                      <span>{p.phone || "—"}</span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </ScrollArea>

          {totalPages > 1 && (
            <div className="mt-3 flex items-center justify-between gap-2 border-t border-border/40 pt-2.5 animate-fade-in">
              <Button
                variant="ghost"
                size="sm"
                disabled={sidebarPage === 1}
                onClick={() => setSidebarPage((prev) => Math.max(1, prev - 1))}
                className="h-8 w-8 p-0 rounded-xl hover:bg-mauve/10 cursor-pointer flex items-center justify-center"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-[10px] font-semibold text-muted-foreground">
                Pág. {sidebarPage} de {totalPages}
              </span>
              <Button
                variant="ghost"
                size="sm"
                disabled={sidebarPage === totalPages}
                onClick={() => setSidebarPage((prev) => Math.min(totalPages, prev + 1))}
                className="h-8 w-8 p-0 rounded-xl hover:bg-mauve/10 cursor-pointer flex items-center justify-center"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>

        {/* RIGHT PANEL: Patient Detail & Clinical Timeline */}
        <div className="md:col-span-2 rounded-3xl glass-card border border-border/40 p-5 flex flex-col min-h-0 shadow-sm relative">
          {!selectedPatient ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-12 text-muted-foreground">
              <HeartPulse className="h-12 w-12 text-muted-foreground/30 animate-pulse mb-3" />
              <p className="font-semibold text-sm">Selecciona una paciente</p>
              <p className="text-xs text-muted-foreground/80 mt-1">Busca y haz clic en una paciente en el panel izquierdo para visualizar su expediente clínico completo.</p>
            </div>
          ) : (
            <>
              {/* Header Info */}
              <div className="flex items-start justify-between border-b border-border/20 pb-4 mb-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-mauve to-blush text-primary-foreground font-bold shadow-sm">
                    <User className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold flex items-center gap-2">
                      {selectedPatient.full_name}
                      {selectedPatient.historia_number && (
                        <span className="text-xs bg-mauve/10 text-mauve-foreground px-2 py-0.5 rounded-md font-bold">
                          Nº Historia: {selectedPatient.historia_number}
                        </span>
                      )}
                    </h2>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      C.I. {selectedPatient.document_id || "—"} · Tel: {selectedPatient.phone || "—"}
                    </p>
                  </div>
                </div>

                <Button
                  onClick={() => handleExportFullHistory(selectedPatient, patientConsultations)}
                  size="sm"
                  className="rounded-xl flex items-center gap-1 bg-gradient-to-r from-mauve to-mauve-soft text-primary-foreground shadow-sm shadow-mauve/20 cursor-pointer h-9 px-4"
                >
                  <Printer className="h-4 w-4" /> Exportar Expediente
                </Button>
              </div>

              <Tabs defaultValue="timeline" className="flex-1 flex flex-col min-h-0">
                <TabsList className="grid w-full grid-cols-4 bg-muted/60 p-1 rounded-2xl mb-4">
                  <TabsTrigger value="timeline" className="rounded-xl font-medium text-xs">Cronología de Consultas</TabsTrigger>
                  <TabsTrigger value="gyn-obs" className="rounded-xl font-medium text-xs">Ginecología y Obstetricia</TabsTrigger>
                  <TabsTrigger value="base" className="rounded-xl font-medium text-xs">Antecedentes Clínicos</TabsTrigger>
                  <TabsTrigger value="info" className="rounded-xl font-medium text-xs">Ficha de Identificación</TabsTrigger>
                </TabsList>

                <ScrollArea className="flex-1 pr-1">
                  {/* TAB 1: TIMELINE */}
                  <TabsContent value="timeline" className="space-y-4 mt-0 outline-none">
                    {loadingConsultations ? (
                      <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-mauve" /></div>
                    ) : patientConsultations.length === 0 ? (
                      <div className="text-center py-16 text-muted-foreground border border-dashed border-border/40 rounded-3xl bg-muted/10">
                        <Calendar className="h-8 w-8 mx-auto text-muted-foreground/30 mb-2" />
                        <p className="font-semibold text-xs">Sin consultas registradas</p>
                        <p className="text-[11px] text-muted-foreground mt-1">Registra consultas desde la pestaña 'Agenda' completando citas.</p>
                      </div>
                    ) : (
                      <div className="space-y-4 pl-3 relative before:absolute before:left-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-border/30">
                        {patientConsultations.map((c, index) => {
                          const dateObj = new Date(c.created_at);
                          const formattedDate = dateObj.toLocaleDateString("es-ES", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          });
                          const isExpanded = !!expandedConsultations[c.id];

                          return (
                            <div key={c.id} className="relative pl-7 group">
                              {/* Bullet */}
                              <div className="absolute left-3 top-4 -translate-x-1/2 flex h-2.5 w-2.5 items-center justify-center rounded-full bg-mauve ring-4 ring-mauve/15" />

                              <div className="bg-card/50 rounded-2xl border border-border/40 shadow-sm overflow-hidden transition hover:border-border hover:bg-card">
                                {/* Header Toggle */}
                                <button
                                  onClick={() => toggleConsultation(c.id)}
                                  className="w-full flex items-center justify-between p-3.5 text-left text-xs font-bold bg-muted/20 hover:bg-muted/40 transition cursor-pointer"
                                >
                                  <div className="flex items-center gap-4">
                                    <span className="text-mauve font-extrabold">{formattedDate}</span>
                                    <span className={cn(
                                      "px-2 py-0.5 rounded text-[10px] font-semibold shrink-0 uppercase",
                                      c.visit_type === "EMERGENCIA" ? "bg-destructive/15 text-destructive" :
                                      c.visit_type === "CONSULTA_NUEVA" ? "bg-blue-50 text-blue-700 border border-blue-100" :
                                      "bg-sage/20 text-sage-foreground"
                                    )}>
                                      {c.visit_type}
                                    </span>
                                    <span className="text-muted-foreground font-normal truncate max-w-[180px] md:max-w-[280px]">
                                      {c.diagnosis || "Sin diagnóstico registrado"}
                                    </span>
                                  </div>
                                  {isExpanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                                </button>

                                {/* Expanded Content */}
                                {isExpanded && (
                                  <div className="p-4 border-t border-border/30 text-xs space-y-4 bg-background/30 animate-fade-in">
                                    {c.subjective_exam && (
                                      <div>
                                        <h4 className="font-bold text-[10px] uppercase text-muted-foreground mb-1 tracking-wider flex items-center gap-1"><User className="h-3 w-3" /> Examen Subjetivo</h4>
                                        <p className="bg-muted/40 p-2.5 rounded-xl text-foreground font-medium leading-relaxed">{c.subjective_exam}</p>
                                      </div>
                                    )}

                                    {/* Vitals Grid */}
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                      <div className="bg-muted/20 p-2 rounded-xl text-center">
                                        <span className="text-[10px] text-muted-foreground block">Talla / Peso</span>
                                        <span className="font-bold">{c.height_cm ? c.height_cm + " cm" : "—"} / {c.weight_kg ? c.weight_kg + " kg" : "—"}</span>
                                      </div>
                                      <div className="bg-muted/20 p-2 rounded-xl text-center">
                                        <span className="text-[10px] text-muted-foreground block">Presión Art. / FC</span>
                                        <span className="font-bold">{c.blood_pressure || "—"} / {c.heart_rate ? c.heart_rate + " lpm" : "—"}</span>
                                      </div>
                                      <div className="bg-muted/20 p-2 rounded-xl text-center">
                                        <span className="text-[10px] text-muted-foreground block">Temperatura / FR</span>
                                        <span className="font-bold">{c.temperature ? c.temperature + " °C" : "—"} / {c.respiratory_rate ? c.respiratory_rate + " rpm" : "—"}</span>
                                      </div>
                                      <div className="bg-muted/20 p-2 rounded-xl text-center">
                                        <span className="text-[10px] text-muted-foreground block">IMC</span>
                                        <span className="font-bold text-mauve">{c.bmi || "—"}</span>
                                      </div>
                                    </div>

                                    {/* Physical Exam Details */}
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-muted/20 p-3 rounded-2xl">
                                      <div className="col-span-1 sm:col-span-2 border-b border-border/30 pb-1.5 mb-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                                        <Activity className="h-3.5 w-3.5" /> Revisión Física / Sistemas
                                      </div>
                                      {c.skin && <div><span className="text-muted-foreground text-[10px] block">Piel</span><span className="font-semibold">{c.skin}</span></div>}
                                      {c.head_neck && <div><span className="text-muted-foreground text-[10px] block">Cabeza y Cuello</span><span className="font-semibold">{c.head_neck}</span></div>}
                                      {c.breasts && <div><span className="text-muted-foreground text-[10px] block">Mamas</span><span className="font-semibold">{c.breasts}</span></div>}
                                      {c.abdomen && <div><span className="text-muted-foreground text-[10px] block">Abdomen</span><span className="font-semibold">{c.abdomen}</span></div>}
                                      {c.gynecological && <div className="col-span-1 sm:col-span-2"><span className="text-muted-foreground text-[10px] block">Examen Ginecológico</span><span className="font-semibold">{c.gynecological}</span></div>}
                                      {c.extremities && <div><span className="text-muted-foreground text-[10px] block">Extremidades</span><span className="font-semibold">{c.extremities}</span></div>}
                                      {c.neurological && <div><span className="text-muted-foreground text-[10px] block">Neurológico</span><span className="font-semibold">{c.neurological}</span></div>}
                                    </div>

                                    {/* Special Procedures (Colposcopía y Obstetricia) */}
                                    {(c.acetic_acid_test || c.lugol_test || c.gestational_age || c.fetal_heart_rate) && (
                                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-muted/20 p-3 rounded-2xl">
                                        {/* Colpo */}
                                        {(c.acetic_acid_test || c.lugol_test) && (
                                          <div className="space-y-2">
                                            <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground border-b border-border/30 pb-1 flex items-center gap-1">
                                              <Scissors className="h-3 w-3" /> Colposcopía
                                            </div>
                                            {c.acetic_acid_test && (
                                              <div>
                                                <span className="text-[10px] text-muted-foreground">Test Ácido Acético:</span>
                                                <p className="font-semibold">{c.acetic_acid_test} {c.acetic_clock_position && `[Horario: ${c.acetic_clock_position}]`} {c.acetic_relative_position && `[Relativo: ${c.acetic_relative_position}]`}</p>
                                              </div>
                                            )}
                                            {c.lugol_test && (
                                              <div>
                                                <span className="text-[10px] text-muted-foreground">Test de Lugol (Schiller):</span>
                                                <p className="font-semibold">{c.lugol_test} {c.lugol_clock_position && `[Horario: ${c.lugol_clock_position}]`} {c.lugol_relative_position && `[Relativo: ${c.lugol_relative_position}]`}</p>
                                              </div>
                                            )}
                                          </div>
                                        )}

                                        {/* Obstétrico */}
                                        {(c.gestational_age || c.fetal_heart_rate) && (
                                          <div className="space-y-2">
                                            <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground border-b border-border/30 pb-1 flex items-center gap-1">
                                              <HeartPulse className="h-3 w-3" /> Control Obstétrico
                                            </div>
                                            <div className="grid grid-cols-2 gap-2 text-[11px]">
                                              <div><span className="text-[9px] text-muted-foreground block">EG:</span><span className="font-semibold">{c.gestational_age || "—"}</span></div>
                                              <div><span className="text-[9px] text-muted-foreground block">Peso Fetal:</span><span className="font-semibold">{c.fetal_weight ? c.fetal_weight + " g" : "—"}</span></div>
                                              <div><span className="text-[9px] text-muted-foreground block">FC Fetal:</span><span className="font-semibold">{c.fetal_heart_rate ? c.fetal_heart_rate + " lpm" : "—"}</span></div>
                                              <div><span className="text-[9px] text-muted-foreground block">AU / Pres:</span><span className="font-semibold">{c.uterine_height ? c.uterine_height + "cm" : "—"} / {c.presentation || "—"}</span></div>
                                            </div>
                                          </div>
                                        )}
                                      </div>
                                    )}

                                    {/* Diagnosis & Treatments */}
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-border/30 pt-3">
                                      <div className="bg-muted/10 p-3 rounded-2xl">
                                        <h4 className="font-bold text-[10px] uppercase text-muted-foreground mb-1 flex items-center gap-1"><Stethoscope className="h-3 w-3" /> Diagnóstico</h4>
                                        <p className="font-bold text-foreground leading-relaxed text-xs">{c.diagnosis || "Sin diagnóstico"}</p>
                                      </div>
                                      <div className="bg-muted/10 p-3 rounded-2xl flex flex-col justify-between">
                                        <div className="flex items-center justify-between mb-1.5">
                                          <h4 className="font-bold text-[10px] uppercase text-muted-foreground flex items-center gap-1">
                                            <FileText className="h-3 w-3" /> Indicaciones y Receta
                                          </h4>
                                          {c.indications && (
                                            <Button
                                              variant="ghost"
                                              size="sm"
                                              onClick={() => handleExportRecipe(selectedPatient, c)}
                                              className="h-6 px-2 text-[10px] rounded-lg text-mauve hover:text-mauve-foreground hover:bg-mauve/10 flex items-center gap-1 cursor-pointer"
                                            >
                                              <Printer className="h-3 w-3" /> Imprimir Récipe
                                            </Button>
                                          )}
                                        </div>
                                        <p className="font-medium text-foreground whitespace-pre-wrap leading-relaxed text-xs">{c.indications || "Sin indicaciones"}</p>
                                      </div>
                                    </div>

                                    {(c.complementary_exams || c.plan || c.next_appointment_date) && (
                                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 border-t border-border/30 pt-3 text-[11px]">
                                        {c.complementary_exams && <div className="sm:col-span-1"><span className="text-[10px] text-muted-foreground block uppercase font-bold">Exámenes Solicitados</span><p className="font-medium text-xs">{c.complementary_exams}</p></div>}
                                        {c.plan && <div className="sm:col-span-1"><span className="text-[10px] text-muted-foreground block uppercase font-bold">Plan Clínico</span><p className="font-medium text-xs">{c.plan}</p></div>}
                                        {c.next_appointment_date && <div className="sm:col-span-1"><span className="text-[10px] text-muted-foreground block uppercase font-bold">Próxima Cita Recomendada</span><p className="font-bold text-xs text-mauve">{new Date(c.next_appointment_date).toLocaleDateString("es-ES", { day: "2-digit", month: "short", year: "numeric" })}</p></div>}
                                      </div>
                                    )}

                                    {/* Consumables used */}
                                    {c.consumables && c.consumables.length > 0 && (
                                      <div className="border-t border-border/30 pt-3">
                                        <span className="text-[9px] text-muted-foreground font-bold uppercase tracking-wider block mb-1.5">Materiales Clínicos Utilizados</span>
                                        <div className="flex flex-wrap gap-1.5">
                                          {c.consumables.map((item) => (
                                            <span key={item.id} className="text-[10px] bg-muted/80 border border-border/40 text-foreground px-2 py-0.5 rounded-full font-medium">
                                              {item.item_name}: <span className="font-bold text-mauve">{item.quantity}</span> {item.unit || ""}
                                            </span>
                                          ))}
                                        </div>
                                      </div>
                                    )}

                                    <div className="flex justify-end text-[10px] text-muted-foreground pt-1 border-t border-border/20 mt-2">
                                      <span>Registrado por: {doctorMap.get(c.doctor_id ?? "") || "Médico tratante"}</span>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </TabsContent>

                  {/* TAB 2: CLINICAL BASE DATA */}
                  <TabsContent value="base" className="space-y-6 mt-0 outline-none">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Antecedentes Familiares */}
                      <div className="bg-muted/30 p-4 rounded-2xl space-y-3">
                        <h3 className="text-xs font-bold uppercase tracking-wider text-mauve">Antecedentes Familiares</h3>
                        <dl className="grid grid-cols-2 gap-3 text-xs">
                          <div><dt className="text-muted-foreground">Madre</dt><dd className="font-semibold text-foreground">{selectedPatient.family_history?.mother || "Niega / Sano"}</dd></div>
                          <div><dt className="text-muted-foreground">Padre</dt><dd className="font-semibold text-foreground">{selectedPatient.family_history?.father || "Niega / Sano"}</dd></div>
                          <div><dt className="text-muted-foreground">Hermanos</dt><dd className="font-semibold text-foreground">{selectedPatient.family_history?.siblings || "Niega / Sano"}</dd></div>
                          <div><dt className="text-muted-foreground">Hijos</dt><dd className="font-semibold text-foreground">{selectedPatient.family_history?.children || "Niega / Sano"}</dd></div>
                        </dl>
                      </div>

                      {/* Antecedentes Personales */}
                      <div className="bg-muted/30 p-4 rounded-2xl space-y-3">
                        <h3 className="text-xs font-bold uppercase tracking-wider text-mauve">Hábitos y Patologías Personales</h3>
                        <dl className="grid grid-cols-3 gap-3 text-xs">
                          <div><dt className="text-muted-foreground">Tabaco</dt><dd className="font-semibold text-foreground">{selectedPatient.personal_history?.tobacco || "NIEGA"}</dd></div>
                          <div><dt className="text-muted-foreground">Alcohol</dt><dd className="font-semibold text-foreground">{selectedPatient.personal_history?.alcohol || "NIEGA"}</dd></div>
                          <div><dt className="text-muted-foreground">Drogas</dt><dd className="font-semibold text-foreground">{selectedPatient.personal_history?.drugs || "NIEGA"}</dd></div>
                          <div className="col-span-3 border-t border-border/30 pt-2"><dt className="text-muted-foreground">Patología de Base</dt><dd className="font-semibold text-foreground">{selectedPatient.personal_history?.base_pathology || "Niega"}</dd></div>
                          <div className="col-span-3"><dt className="text-muted-foreground">Quirúrgicos</dt><dd className="font-semibold text-foreground">{selectedPatient.personal_history?.surgical || "Niega"}</dd></div>
                          <div className="col-span-3"><dt className="text-muted-foreground text-destructive">Alérgicos</dt><dd className="font-bold text-destructive">{selectedPatient.personal_history?.allergies || "Niega"}</dd></div>
                        </dl>
                      </div>
                    </div>
                  </TabsContent>

                  {/* TAB: GYN & OBS */}
                  <TabsContent value="gyn-obs" className="space-y-6 mt-0 outline-none animate-fade-in">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Datos Ginecológicos */}
                      <div className="bg-muted/30 p-4 rounded-2xl space-y-3 border border-border/30">
                        <h3 className="text-xs font-bold uppercase tracking-wider text-mauve">Datos Ginecológicos</h3>
                        <dl className="grid grid-cols-2 gap-3 text-xs">
                          <div><dt className="text-muted-foreground">Menarquía / Sexarquía</dt><dd className="font-semibold text-foreground">{selectedPatient.gynecological_data?.menarche || "—"} / {selectedPatient.gynecological_data?.sexarche || "—"} años</dd></div>
                          <div><dt className="text-muted-foreground">Ciclo Menstrual</dt><dd className="font-semibold text-foreground">{selectedPatient.gynecological_data?.menstrual_cycle || "—"}</dd></div>
                          <div><dt className="text-muted-foreground">Dismenorrea / NPS</dt><dd className="font-semibold text-foreground">{selectedPatient.gynecological_data?.dysmenorrhea || "—"} / {selectedPatient.gynecological_data?.nps || "—"}</dd></div>
                          <div><dt className="text-muted-foreground">ITS</dt><dd className="font-semibold text-foreground">{selectedPatient.gynecological_data?.its || "Ninguna"}</dd></div>
                          <div className="col-span-2 border-t border-border/30 pt-2"><dt className="text-muted-foreground">Última Citología</dt><dd className="font-semibold text-foreground">{selectedPatient.gynecological_data?.cytology || "—"}</dd></div>
                          <div className="col-span-2"><dt className="text-muted-foreground">Anticonceptivos</dt><dd className="font-semibold text-foreground">{selectedPatient.gynecological_data?.contraceptives || "—"}</dd></div>
                        </dl>
                      </div>

                      {/* Datos Obstétricos */}
                      <div className="bg-muted/30 p-4 rounded-2xl space-y-3 border border-border/30">
                        <h3 className="text-xs font-bold uppercase tracking-wider text-mauve">Antecedentes Obstétricos</h3>
                        <div className="grid grid-cols-4 gap-2 text-center bg-card p-2 rounded-xl border border-border/40 mb-2">
                          <div><span className="text-[10px] text-muted-foreground block">G</span><span className="font-bold">{selectedPatient.obstetric_data?.g ?? 0}</span></div>
                          <div><span className="text-[10px] text-muted-foreground block">P</span><span className="font-bold">{selectedPatient.obstetric_data?.p ?? 0}</span></div>
                          <div><span className="text-[10px] text-muted-foreground block">C</span><span className="font-bold">{selectedPatient.obstetric_data?.c ?? 0}</span></div>
                          <div><span className="text-[10px] text-muted-foreground block">A</span><span className="font-bold">{selectedPatient.obstetric_data?.a ?? 0}</span></div>
                        </div>
                        <dl className="grid grid-cols-2 gap-2 text-xs">
                          <div><dt className="text-muted-foreground">Período Intergenésico (PIG)</dt><dd className="font-semibold text-foreground">{selectedPatient.obstetric_data?.pig || "—"}</dd></div>
                          <div><dt className="text-muted-foreground">EM / EE (Ectópicos)</dt><dd className="font-semibold text-foreground">EM: {selectedPatient.obstetric_data?.em ?? 0} / EE: {selectedPatient.obstetric_data?.ee ?? 0}</dd></div>
                          <div className="col-span-2"><dt className="text-muted-foreground">Complicaciones</dt><dd className="font-semibold text-foreground">{selectedPatient.obstetric_data?.complications || "Ninguna"}</dd></div>
                          <div><dt className="text-muted-foreground">FUM</dt><dd className="font-semibold text-foreground">{selectedPatient.obstetric_data?.fum || "—"}</dd></div>
                          <div><dt className="text-muted-foreground">Edad Gestacional / FPP</dt><dd className="font-semibold text-foreground">{selectedPatient.obstetric_data?.eg || "—"} / <span className="text-mauve font-bold">{selectedPatient.obstetric_data?.fpp || "—"}</span></dd></div>
                          <div className="col-span-2"><dt className="text-muted-foreground">Vacunas / Controles</dt><dd className="font-semibold text-foreground">Vacunas: {selectedPatient.obstetric_data?.vaccines || "—"} (Controles: {selectedPatient.obstetric_data?.num_consultations || 0})</dd></div>
                        </dl>
                      </div>
                    </div>
                  </TabsContent>

                  {/* TAB 3: IDENTIFICATION DATA */}
                  <TabsContent value="info" className="space-y-6 mt-0 outline-none animate-fade-in">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                      <div className="bg-muted/30 p-4 rounded-2xl space-y-3 col-span-1 md:col-span-2 border border-border/30">
                        <h3 className="text-xs font-bold uppercase tracking-wider text-mauve mb-1">Datos Básicos</h3>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                          <div><span className="text-muted-foreground block text-[10px] uppercase font-semibold">Nombre Completo</span><span className="font-bold text-foreground text-sm">{selectedPatient.full_name}</span></div>
                          <div><span className="text-muted-foreground block text-[10px] uppercase font-semibold">Documento Cédula</span><span className="font-bold text-foreground text-sm">{selectedPatient.document_id || "—"}</span></div>
                          <div><span className="text-muted-foreground block text-[10px] uppercase font-semibold">Número de Historia</span><span className="font-bold text-foreground text-sm">#{selectedPatient.historia_number || "—"}</span></div>
                        </div>
                      </div>

                      <div className="bg-muted/30 p-4 rounded-2xl space-y-3 border border-border/30">
                        <h3 className="text-xs font-bold uppercase tracking-wider text-mauve mb-2">Información de Contacto y Personal</h3>
                        <dl className="space-y-2">
                          <div className="flex justify-between py-1 border-b border-border/30"><dt className="text-muted-foreground">Teléfono</dt><dd className="font-semibold text-foreground">{selectedPatient.phone || "—"}</dd></div>
                          <div className="flex justify-between py-1 border-b border-border/30"><dt className="text-muted-foreground">Correo Electrónico</dt><dd className="font-semibold text-foreground">{selectedPatient.email || "—"}</dd></div>
                          <div className="flex justify-between py-1 border-b border-border/30"><dt className="text-muted-foreground">Estado Civil</dt><dd className="font-semibold text-foreground">{selectedPatient.marital_status || "—"}</dd></div>
                          <div className="flex justify-between py-1 border-b border-border/30"><dt className="text-muted-foreground">Nivel de Instrucción</dt><dd className="font-semibold text-foreground">{selectedPatient.education_level || "—"}</dd></div>
                          <div className="flex justify-between py-1"><dt className="text-muted-foreground">Ocupación</dt><dd className="font-semibold text-foreground">{selectedPatient.occupation || "—"}</dd></div>
                        </dl>
                      </div>

                      <div className="bg-muted/30 p-4 rounded-2xl space-y-3 border border-border/30">
                        <h3 className="text-xs font-bold uppercase tracking-wider text-mauve mb-2">Información Clínica Inicial</h3>
                        <dl className="space-y-2">
                          <div className="flex justify-between py-1 border-b border-border/30"><dt className="text-muted-foreground">Fecha de Nacimiento</dt><dd className="font-semibold text-foreground">{selectedPatient.birth_date || "—"}</dd></div>
                          <div className="flex justify-between py-1 border-b border-border/30"><dt className="text-muted-foreground">Lugar de Nacimiento</dt><dd className="font-semibold text-foreground">{selectedPatient.birthplace || "—"}</dd></div>
                          <div className="flex justify-between py-1 border-b border-border/30"><dt className="text-muted-foreground">Etnia / Raza</dt><dd className="font-semibold text-foreground">{selectedPatient.ethnicity || "—"}</dd></div>
                          <div className="flex justify-between py-1 border-b border-border/30"><dt className="text-muted-foreground">Primera Cita</dt><dd className="font-semibold text-foreground">{selectedPatient.first_visit_date || "—"}</dd></div>
                          <div className="flex justify-between py-1"><dt className="text-muted-foreground">Médico Asignado</dt><dd className="font-semibold text-foreground">{doctorMap.get(selectedPatient.assigned_doctor_id ?? "") || "Sin médico"}</dd></div>
                        </dl>
                      </div>

                      <div className="bg-muted/30 p-4 rounded-2xl space-y-2 col-span-1 md:col-span-2 border border-border/30">
                        <h3 className="text-xs font-bold uppercase tracking-wider text-mauve">Consulta de Ingreso</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                          <div className="bg-card/50 p-3 rounded-xl border border-border/40">
                            <span className="text-muted-foreground font-bold mb-1 block">Motivo de Consulta</span>
                            <span className="font-medium whitespace-pre-wrap block text-xs">{selectedPatient.consultation_reason || "No registrado"}</span>
                          </div>
                          <div className="bg-card/50 p-3 rounded-xl border border-border/40">
                            <span className="text-muted-foreground font-bold mb-1 block">Enfermedad Actual</span>
                            <span className="font-medium whitespace-pre-wrap block text-xs">{selectedPatient.current_illness || "No registrado"}</span>
                          </div>
                        </div>
                      </div>

                      <div className="bg-muted/30 p-4 rounded-2xl space-y-2 col-span-1 md:col-span-2 border border-border/30">
                        <span className="text-xs font-bold uppercase tracking-wider text-mauve block">Dirección de Domicilio</span>
                        <span className="font-semibold text-foreground bg-card/50 p-3 rounded-xl border border-border/40 mt-1 block">{selectedPatient.address || "No registrada"}</span>
                      </div>
                      
                      {selectedPatient.notes && (
                        <div className="bg-muted/30 p-4 rounded-2xl space-y-2 col-span-1 md:col-span-2 border border-border/30">
                          <span className="text-xs font-bold uppercase tracking-wider text-mauve block">Notas Administrativas</span>
                          <span className="font-semibold text-foreground bg-card/50 p-3 rounded-xl border border-border/40 mt-1 block whitespace-pre-wrap text-xs">{selectedPatient.notes}</span>
                        </div>
                      )}
                    </div>
                  </TabsContent>
                </ScrollArea>
              </Tabs>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
