import { toast } from "sonner";
import { loadLogoBase64 } from "./logo";
import type { AppointmentWithPatient } from "@/lib/api/appointments";

export const exportInvoice = async (
  app: AppointmentWithPatient,
  clinic: any,
  doctorInfo: {
    name: string;
    specialty: string;
  }
) => {
  try {
    const { default: jsPDF } = await import("jspdf");
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
    doc.text(doctorInfo.name, pageWidth / 2, sigY + 16, { align: "center" });
    doc.setFont("times", "normal");
    doc.setFontSize(10);
    doc.text(doctorInfo.specialty, pageWidth / 2, sigY + 28, { align: "center" });

    doc.save(`Recibo_${(app.patient_name || "paciente").replace(/\s+/g, "_")}.pdf`);
    toast.success("Recibo PDF generado con éxito");
  } catch (err) {
    toast.error("Error al exportar recibo");
  }
};
