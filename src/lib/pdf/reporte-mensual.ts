import { toast } from "sonner";
import { loadLogoBase64 } from "./logo";

export const exportMonthlyReport = async (
  monthOptions: any[],
  monthFilter: string,
  clinic: any,
  filtered: any[]
) => {
  try {
    const [{ default: jsPDF }, { default: autoTable }] = await Promise.all([
      import("jspdf"),
      import("jspdf-autotable"),
    ]);

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
