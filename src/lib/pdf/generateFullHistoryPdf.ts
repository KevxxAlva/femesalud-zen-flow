import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { getClinicPdfConfig, drawPdfHeader, drawPdfWatermark, drawPdfFooter } from "@/lib/utils/pdfConfig";

export const generateFullHistoryPdf = async (patientId: string) => {
  try {
    toast.info("Generando expediente completo... esto puede tardar unos segundos.");
    
    // 1. Fetch patient data
    const { data: patient, error: patientError } = await supabase
      .from("pacientes")
      .select("*")
      .eq("id", patientId)
      .single();
      
    if (patientError || !patient) throw new Error("No se pudo cargar la información del paciente.");

    // 2. Fetch all consultations (citas completadas/en progreso con sus planes y exámenes)
    const { data: consultations } = await supabase
      .from("consultas")
      .select(`
        *,
        citas(fecha_hora, medico_id),
        recetas(*),
        examenes_laboratorio(*)
      `)
      .eq("paciente_id", patientId)
      .order("created_at", { ascending: false });

    // 3. Fetch doctors to map IDs
    const { data: users } = await supabase.from("usuarios").select("id, full_name, role");
    const doctorMap = new Map(users?.filter(u => u.role === "doctor" || u.role === "admin").map(u => [u.id, u.full_name]) || []);

    // 4. Setup PDF
    const doc = new jsPDF({ unit: "pt", format: "a4" });
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const config = await getClinicPdfConfig();

    drawPdfWatermark(doc, config, pageWidth, pageHeight);
    drawPdfHeader(doc, config, pageWidth);

    const today = new Date();
    doc.setFont(config.customFontFamily, "normal");
    doc.setFontSize(10.5);
    doc.text(
      `Generado: ${today.toLocaleDateString("es-ES")} ${today.toLocaleTimeString("es-ES")}`,
      pageWidth - 40,
      155,
      { align: "right" }
    );

    doc.setFont("times", "bold");
    doc.setFontSize(14);
    doc.text("EXPEDIENTE CLÍNICO COMPLETO", pageWidth / 2, 195, { align: "center" });
    const titleWidth = doc.getTextWidth("EXPEDIENTE CLÍNICO COMPLETO");
    doc.setDrawColor(0);
    doc.setLineWidth(1);
    doc.line(pageWidth / 2 - titleWidth / 2, 198, pageWidth / 2 + titleWidth / 2, 198);

    // Section: Datos Demográficos
    doc.setFont("times", "bold");
    doc.setFontSize(12);
    doc.text("1. Datos de Identificación", 40, 225);

    autoTable(doc, {
      startY: 235,
      body: [
        ["Nº Historia", patient.historia_number || "—", "Cédula", patient.document_id || "—"],
        ["Nombre Completo", patient.full_name || "—", "Teléfono", patient.phone || "—"],
        ["F. Nacimiento", patient.birth_date || "—", "Correo", patient.email || "—"],
        ["Dirección", { content: patient.address || "—", colSpan: 3 }],
        ["Médico Tratante", { content: doctorMap.get(patient.assigned_doctor_id ?? "") || "Sin asignar", colSpan: 3 }]
      ],
      theme: "grid",
      styles: { font: "times", fontSize: 9.5, cellPadding: 4 },
      columnStyles: {
        0: { fontStyle: "bold", fillColor: [245, 242, 247], cellWidth: 90 },
        1: { cellWidth: 167 },
        2: { fontStyle: "bold", fillColor: [245, 242, 247], cellWidth: 90 },
        3: { cellWidth: 168 }
      },
      margin: { left: 40, right: 40 },
    });

    // Section: Antecedentes
    let currentY = (doc as any).lastAutoTable.finalY + 20;
    doc.setFont("times", "bold");
    doc.setFontSize(12);
    doc.text("2. Antecedentes Médicos", 40, currentY);

    autoTable(doc, {
      startY: currentY + 10,
      body: [
        ["Familiares", patient.family_history ? JSON.stringify(patient.family_history).replace(/[{""}]/g, " ") : "Niega"],
        ["Personales", patient.personal_history ? JSON.stringify(patient.personal_history).replace(/[{""}]/g, " ") : "Niega"],
        ["Gineco-Obstétricos", `G: ${patient.obstetric_data?.g||0} P: ${patient.obstetric_data?.p||0} C: ${patient.obstetric_data?.c||0} A: ${patient.obstetric_data?.a||0}. FUM: ${patient.obstetric_data?.fum||"—"}`]
      ],
      theme: "grid",
      styles: { font: "times", fontSize: 9.5, cellPadding: 4 },
      columnStyles: {
        0: { fontStyle: "bold", fillColor: [245, 242, 247], cellWidth: 120 },
        1: { cellWidth: 395 }
      },
      margin: { left: 40, right: 40 },
    });

    // Section: Consultas
    currentY = (doc as any).lastAutoTable.finalY + 20;
    doc.setFont("times", "bold");
    doc.setFontSize(12);
    doc.text("3. Historial de Consultas", 40, currentY);

    if (!consultations || consultations.length === 0) {
      doc.setFont("times", "italic");
      doc.setFontSize(10);
      doc.text("No se registran consultas previas.", 40, currentY + 15);
    } else {
      consultations.forEach((consulta: any, index: number) => {
        const dateStr = consulta.citas?.fecha_hora ? new Date(consulta.citas.fecha_hora).toLocaleDateString("es-ES") : "Fecha desconocida";
        
        // Add new page if close to bottom
        if (currentY > pageHeight - 150) {
          doc.addPage();
          currentY = 50;
        } else {
          currentY += 15;
        }

        doc.setFont("times", "bold");
        doc.setFontSize(11);
        doc.setTextColor(139, 92, 175); // Brand color
        doc.text(`Consulta #${consultations.length - index} - ${dateStr}`, 40, currentY);
        doc.setTextColor(0, 0, 0);

        const consultaBody = [];
        if (consulta.motivo) consultaBody.push(["Motivo", consulta.motivo]);
        if (consulta.enfermedad_actual) consultaBody.push(["Enf. Actual", consulta.enfermedad_actual]);
        if (consulta.peso || consulta.presion_arterial) {
            consultaBody.push(["Signos Vitales", `Peso: ${consulta.peso||"-"}kg, Talla: ${consulta.talla||"-"}cm, PA: ${consulta.presion_arterial||"-"}, Temp: ${consulta.temperatura||"-"}°C, FC: ${consulta.frecuencia_cardiaca||"-"}bpm`]);
        }
        if (consulta.examen_fisico) consultaBody.push(["Examen Físico", consulta.examen_fisico]);
        if (consulta.diagnosticos && consulta.diagnosticos.length > 0) {
            const diags = consulta.diagnosticos.map((d: any) => `${d.codigo || ""} ${d.descripcion || ""}`).join(", ");
            consultaBody.push(["Diagnósticos", diags]);
        }
        if (consulta.plan_tratamiento) consultaBody.push(["Plan de Tratamiento", consulta.plan_tratamiento]);

        if (consulta.recetas && consulta.recetas.length > 0) {
            const receta = consulta.recetas[0];
            const meds = typeof receta.medicamentos === 'string' ? receta.medicamentos : JSON.stringify(receta.medicamentos);
            consultaBody.push(["Receta", meds]);
        }

        if (consultaBody.length > 0) {
            autoTable(doc, {
                startY: currentY + 8,
                body: consultaBody,
                theme: "plain",
                styles: { font: "times", fontSize: 9.5, cellPadding: 3, lineColor: [200, 200, 200], lineWidth: 0.1 },
                columnStyles: {
                    0: { fontStyle: "bold", cellWidth: 100 },
                    1: { cellWidth: 415 }
                },
                margin: { left: 40, right: 40 },
            });
            currentY = (doc as any).lastAutoTable.finalY + 10;
        }
      });
    }

    // Add watermark and footer to all pages
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      try {
        if (config.logoBase64) {
          doc.saveGraphicsState();
          const gState = new (doc as any).GState({ opacity: 0.04 });
          doc.setGState(gState);
          doc.addImage(config.logoBase64, "PNG", (pageWidth - 550) / 2, (pageHeight - 550) / 2 - 20, 550, 550);
          doc.restoreGraphicsState();
        }
      } catch (e) {}
      drawPdfFooter(doc, config, pageWidth, pageHeight);
    }

    doc.save(`Expediente_${patient.full_name || "Paciente"}.pdf`);
    toast.success("Expediente completo generado con éxito.");

  } catch (error) {
    console.error("Error generando expediente:", error);
    toast.error(error instanceof Error ? error.message : "Error al generar el expediente.");
  }
};
