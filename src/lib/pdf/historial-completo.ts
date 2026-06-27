import { toast } from "sonner";
import { loadLogoBase64 } from "./logo";
import type { Patient } from "@/lib/api/patients";
import type { Consultation } from "@/lib/api/consultations";
import type { ClinicInfo } from "@/lib/api/clinic";

export const exportFullHistory = async (
  patient: Patient,
  visits: Consultation[],
  clinic: ClinicInfo | null | undefined,
  doctorMap: Map<string, string>
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
