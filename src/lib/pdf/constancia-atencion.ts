import { toast } from "sonner";
import { loadLogoBase64 } from "./logo";
import type { Patient } from "@/lib/api/patients";

export const exportConstanciaAtencion = async (
  patient: Patient,
  clinic: any,
  doctorInfo: {
    name: string;
    specialty: string;
    uni?: string;
    mpps?: string;
    cmc?: string;
  },
  atencionReason: string,
  atencionDate: string
) => {
  try {
    const { default: jsPDF } = await import("jspdf");
    const doc = new jsPDF({ unit: "pt", format: "a4" });
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    // Draw Watermark Logo in center
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
    doc.text(`Valle de la Pascua,   ${topDay}   /   ${topMonth}   /   ${topYear}`, pageWidth - 70, 155, { align: "right" });

    // Title (CONSTANCIA DE ATENCION MEDICA, bold, centered, underlined)
    doc.setFont("times", "bold");
    doc.setFontSize(13);
    doc.text("CONSTANCIA DE ATENCION MEDICA", pageWidth / 2, 195, { align: "center" });
    const titleWidth = doc.getTextWidth("CONSTANCIA DE ATENCION MEDICA");
    doc.setDrawColor(0);
    doc.setLineWidth(0.5);
    doc.line(pageWidth / 2 - titleWidth / 2, 198, pageWidth / 2 + titleWidth / 2, 198);

    // Salutation
    doc.setFont("times", "bold");
    doc.setFontSize(11);
    doc.text("A quien pueda interesar", 70, 235);

    // Body text start
    doc.setFont("times", "normal");
    doc.setFontSize(11);
    doc.text("Quien suscribe, médico tratante, certifica que examinó a:", 70, 265);

    // Patient Name and C.I. line
    doc.line(70, 300, 310, 300);
    doc.setFont("times", "bold");
    doc.setFontSize(11.5);
    doc.text(patient.full_name, 190, 296, { align: "center" });

    let ciLabel = "C.I. ";
    let displayCI = patient.document_id || "";
    if (displayCI.startsWith("V-")) {
      ciLabel = "C.I. V-";
      displayCI = displayCI.slice(2);
    } else if (displayCI.startsWith("E-")) {
      ciLabel = "C.I. E-";
      displayCI = displayCI.slice(2);
    } else if (displayCI.startsWith("P-")) {
      ciLabel = "P-";
      displayCI = displayCI.slice(2);
    }

    doc.text(ciLabel, 315, 300);
    const labelWidth = doc.getTextWidth(ciLabel);
    const lineStartX = 315 + labelWidth + 5;
    const lineEndX = 460;

    doc.line(lineStartX, 300, lineEndX, 300);
    doc.setFont("times", "bold");
    doc.setFontSize(11.5);
    doc.text(displayCI, (lineStartX + lineEndX) / 2, 296, { align: "center" });

    doc.setFont("times", "normal");
    doc.setFontSize(11);
    doc.text(", quien", 465, 300);

    // Diagnosis lines
    const splitReason = doc.splitTextToSize(atencionReason || "", pageWidth - 140);

    doc.text("presenta:", 70, 335);
    doc.line(120, 335, pageWidth - 70, 335);
    if (splitReason[0]) {
      doc.setFont("times", "bold");
      doc.setFontSize(11.5);
      doc.text(splitReason[0], (pageWidth + 50) / 2, 331, { align: "center" });
    }

    doc.line(70, 370, pageWidth - 70, 370);
    if (splitReason[1]) {
      doc.setFont("times", "bold");
      doc.setFontSize(11.5);
      doc.text(splitReason[1], pageWidth / 2, 366, { align: "center" });
    }

    // Acudió line
    const [aYear, aMonth, aDay] = atencionDate.split("-");
    const atencionDateFormatted = `${aDay} / ${aMonth} / ${aYear}`;
    doc.setFont("times", "normal");
    doc.setFontSize(11);
    doc.text(`Acudió a consulta el día de hoy: (   ${atencionDateFormatted}   ).`, 70, 405);

    doc.text("Constancia que se expide a petición de la persona interesada.", 70, 445);

    // Signature line
    const sigY = 530;
    doc.setDrawColor(120);
    doc.setLineWidth(0.5);
    doc.setLineDashPattern([2, 2], 0);
    doc.line(pageWidth / 2 - 100, sigY, pageWidth / 2 + 100, sigY);
    doc.setLineDashPattern([], 0); // Restore solid line

    doc.setFont("times", "bold");
    doc.setFontSize(11.5);
    doc.text(doctorInfo.name, pageWidth / 2, sigY + 16, { align: "center" });

    doc.setFont("times", "normal");
    doc.setFontSize(10.5);
    doc.text(doctorInfo.specialty, pageWidth / 2, sigY + 29, { align: "center" });

    if (doctorInfo.uni) {
      doc.text(doctorInfo.uni, pageWidth / 2, sigY + 42, { align: "center" });
    }

    const regText = `MPPS ${doctorInfo.mpps || "______"}   CMC ${doctorInfo.cmc || "______"}`;
    doc.text(regText, pageWidth / 2, sigY + 55, { align: "center" });

    doc.save(`Atencion_${patient.full_name.replace(/\s+/g, "_")}.pdf`);
    toast.success("Constancia de atención generada");
  } catch (err) {
    toast.error(err instanceof Error ? err.message : "Error al exportar");
  }
};
