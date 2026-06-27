import { toast } from "sonner";
import { loadLogoBase64 } from "./logo";
import type { Patient } from "@/lib/api/patients";

export const exportFichaMedica = async (
  patient: Patient,
  clinic: any,
  doctorMap: Map<string, string>,
  patientNotes: any[]
) => {
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

    doc.setFont("times", "bold");
    doc.setFontSize(13);
    doc.text("FICHA DE HISTORIAL CLÍNICO", pageWidth / 2, 195, { align: "center" });
    const titleWidth = doc.getTextWidth("FICHA DE HISTORIAL CLÍNICO");
    doc.setDrawColor(0);
    doc.setLineWidth(0.5);
    doc.line(pageWidth / 2 - titleWidth / 2, 198, pageWidth / 2 + titleWidth / 2, 198);

    doc.setFont("times", "bold");
    doc.setFontSize(11);
    doc.text("Datos de Identificación y Consulta", 40, 225);

    autoTable(doc, {
      startY: 235,
      body: [
        ["Nº Historia", patient.historia_number || "—", "Fecha 1ª Cita", patient.first_visit_date || "—"],
        ["Nombre Completo", patient.full_name || "—", "Cédula / ID", patient.document_id || "—"],
        ["F. Nacimiento", patient.birth_date || "—", "Estado Civil", patient.marital_status || "—"],
        ["Lugar Nacimiento", patient.birthplace || "—", "Teléfono", patient.phone || "—"],
        ["Grado Instrucción", patient.education_level || "—", "Ocupación", patient.occupation || "—"],
        ["Etnia / Raza", patient.ethnicity || "—", "Correo Electrónico", patient.email || "—"],
        ["Dirección", patient.address || "—", "Médico Asignado", doctorMap.get(patient.assigned_doctor_id ?? "") || "Sin asignar"],
        ["Motivo de Consulta", { content: patient.consultation_reason || "—", colSpan: 3 }],
        ["Enfermedad Actual", { content: patient.current_illness || "—", colSpan: 3 }],
        ["Notas Generales", { content: patient.notes || "—", colSpan: 3 }]
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

    const y2 = (doc as any).lastAutoTable.finalY + 15;
    doc.setFont("times", "bold");
    doc.setFontSize(11);
    doc.text("Antecedentes Médicos", 40, y2);

    autoTable(doc, {
      startY: y2 + 5,
      body: [
        ["A.F. Madre", patient.family_history?.mother || "Niega / Sano", "A.F. Padre", patient.family_history?.father || "Niega / Sano"],
        ["A.F. Hermanos", patient.family_history?.siblings || "Niega / Sano", "A.F. Hijos", patient.family_history?.children || "Niega / Sano"],
        ["A.P. Tabaco", patient.personal_history?.tobacco || "NIEGA", "A.P. Alcohol", patient.personal_history?.alcohol || "NIEGA"],
        ["A.P. Drogas", patient.personal_history?.drugs || "NIEGA", "A.P. Patología Base", patient.personal_history?.base_pathology || "Niega"],
        ["A.P. Quirúrgicos", { content: patient.personal_history?.surgical || "Niega", colSpan: 3 }],
        ["A.P. Alérgicos", { content: patient.personal_history?.allergies || "Niega", colSpan: 3 }]
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

    const y3 = (doc as any).lastAutoTable.finalY + 15;
    doc.setFont("times", "bold");
    doc.setFontSize(11);
    doc.text("Datos Gineco-Obstétricos", 40, y3);

    autoTable(doc, {
      startY: y3 + 5,
      body: [
        ["Menarquía", patient.gynecological_data?.menarche || "—", "Sexarquía", patient.gynecological_data?.sexarche || "—"],
        ["Ciclo Menstrual", patient.gynecological_data?.menstrual_cycle || "—", "Dismenorrea", patient.gynecological_data?.dysmenorrhea || "—"],
        ["NPS", patient.gynecological_data?.nps || "—", "ITS", patient.gynecological_data?.its || "—"],
        ["Última Citología", patient.gynecological_data?.cytology || "—", "Anticonceptivos", patient.gynecological_data?.contraceptives || "—"],
        ["Gestas (G)", patient.obstetric_data?.g ?? 0, "Partos (P)", patient.obstetric_data?.p ?? 0],
        ["Cesáreas (C)", patient.obstetric_data?.c ?? 0, "Abortos (A)", patient.obstetric_data?.a ?? 0],
        ["Período Intergenésico (PIG)", patient.obstetric_data?.pig || "—", "Emb. Múltiples", patient.obstetric_data?.em ?? 0],
        ["Emb. Ectópicos", patient.obstetric_data?.ee ?? 0, "Nº Consultas Control", patient.obstetric_data?.num_consultations || "—"],
        ["FUM", patient.obstetric_data?.fum || "—", "EG", patient.obstetric_data?.eg || "—"],
        ["FPP", patient.obstetric_data?.fpp || "—", "Vacunas", patient.obstetric_data?.vaccines || "—"],
        ["Complicaciones", { content: patient.obstetric_data?.complications || "Ninguna", colSpan: 3 }]
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

    const after = (doc as any).lastAutoTable.finalY + 20;
    doc.setFont("times", "bold");
    doc.setFontSize(11);
    doc.text("Historial de Consultas", 40, after);

    if (patientNotes.length === 0) {
      doc.setFont("times", "italic");
      doc.setFontSize(9.5);
      doc.setTextColor(120, 120, 130);
      doc.text("No se registran notas clínicas en el historial de este paciente.", 40, after + 15);
    } else {
      autoTable(doc, {
        startY: after + 8,
        head: [["Fecha", "Título", "Detalle / Indicaciones"]],
        body: patientNotes.map((n) => [
          new Date(n.note_date).toLocaleDateString("es-ES", { day: "2-digit", month: "short", year: "numeric" }),
          n.title || "—",
          n.content || "—",
        ]),
        theme: "striped",
        headStyles: { fillColor: [139, 92, 175], textColor: 255, font: "times" },
        styles: { font: "times", fontSize: 9, cellPadding: 5 },
        columnStyles: {
          0: { cellWidth: 70 },
          1: { cellWidth: 120 },
          2: { cellWidth: 325 },
        },
        margin: { left: 40, right: 40 },
      });
    }

    // Draw Watermark and Page Footer on all pages
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);

      // Draw Watermark Logo in center
      try {
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

      // Footer Text
      doc.setFont("times", "normal");
      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      doc.text(`FemeSalud — Generado el ${new Date().toLocaleString("es-ES")}`, 40, pageHeight - 20);
      doc.text(`Página ${i} de ${pageCount}`, pageWidth - 40, pageHeight - 20, { align: "right" });
    }

    doc.save(`Ficha_${patient.full_name.replace(/\s+/g, "_")}.pdf`);
    toast.success("Ficha médica exportada");
  } catch (err) {
    toast.error(err instanceof Error ? err.message : "Error al exportar");
  }
};
