import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { getClinicPdfConfig, drawPdfHeader, drawPdfWatermark, drawPdfFooter } from "./pdfConfig";

type InvoiceForReport = {
  id_factura: number;
  paciente_nombre?: string;
  fecha_emision: string;
  total_general: number;
  estado_pago: string;
};

export const generateSalesReport = async (facturas: InvoiceForReport[], filterMonth: string = "") => {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  
  const config = await getClinicPdfConfig();
  drawPdfWatermark(doc, config, pageWidth, pageHeight);
  drawPdfHeader(doc, config, pageWidth);

  doc.setFont(config.customFontFamily, "bold");
  doc.setFontSize(14);
  doc.setTextColor(0);
  doc.text("REPORTE DE PAGOS", pageWidth / 2, 170, { align: "center" });

  if (filterMonth) {
    const [yyyy, mm] = filterMonth.split("-");
    const monthName = new Date(parseInt(yyyy), parseInt(mm) - 1, 1).toLocaleString('es-ES', { month: 'long', year: 'numeric' });
    doc.setFontSize(11);
    doc.text(`Mes: ${monthName.toUpperCase()}`, pageWidth / 2, 185, { align: "center" });
  } else {
    doc.setFontSize(10);
    doc.text(`Generado el: ${new Date().toLocaleDateString()}`, pageWidth / 2, 185, { align: "center" });
  }

  const tableData = facturas.map(f => {
    let estado = "Desconocido";
    if (f.estado_pago.toLowerCase() === "pagado" || f.estado_pago.toLowerCase() === "paid") estado = "Pagado";
    else if (f.estado_pago.toLowerCase() === "pendiente" || f.estado_pago.toLowerCase() === "pending") estado = "Pendiente";
    else if (f.estado_pago.toLowerCase() === "cancelado" || f.estado_pago.toLowerCase() === "cancelled") estado = "Cancelado";
    else estado = f.estado_pago;

    return [
      `INV-${f.id_factura.toString().padStart(4, '0')}`,
      f.paciente_nombre || '',
      f.fecha_emision ? new Date(f.fecha_emision).toLocaleDateString() : '',
      `$${f.total_general.toFixed(2)}`,
      estado
    ];
  });

  autoTable(doc, {
    startY: 205,
    head: [['ID Factura', 'Paciente', 'Fecha', 'Monto Total', 'Estado']],
    body: tableData,
    theme: 'striped',
    styles: { font: config.customFontFamily, fontSize: 10, cellPadding: 5 },
    headStyles: { fillColor: [139, 92, 175], textColor: 255, font: config.customFontFamily },
    margin: { left: 40, right: 40 },
    didParseCell: function (data) {
      if (data.section === 'body' && data.column.index === 4) {
        const estado = data.cell.raw as string;
        if (estado.toLowerCase() === 'pagado') {
          data.cell.styles.textColor = [22, 163, 74];
          data.cell.styles.fontStyle = 'bold';
        } else if (estado.toLowerCase() === 'pendiente') {
          data.cell.styles.textColor = [202, 138, 4];
          data.cell.styles.fontStyle = 'bold';
        } else if (estado.toLowerCase() === 'cancelado') {
          data.cell.styles.textColor = [220, 38, 38];
          data.cell.styles.fontStyle = 'bold';
        }
      }
    }
  });

  const totalCobrado = facturas
    .filter(f => f.estado_pago.toLowerCase() === 'pagado' || f.estado_pago.toLowerCase() === 'paid')
    .reduce((sum, f) => sum + f.total_general, 0);

  const totalPendiente = facturas
    .filter(f => f.estado_pago.toLowerCase() === 'pendiente' || f.estado_pago.toLowerCase() === 'pending')
    .reduce((sum, f) => sum + f.total_general, 0);

  const finalY = (doc as any).lastAutoTable.finalY || 205;
  doc.setFontSize(11);
  doc.setFont(config.customFontFamily, "bold");
  doc.text(`Total Cobrado: $${totalCobrado.toFixed(2)}`, pageWidth - 40, finalY + 20, { align: "right" });
  doc.text(`Total Pendiente: $${totalPendiente.toFixed(2)}`, pageWidth - 40, finalY + 35, { align: "right" });

  drawPdfFooter(doc, config, pageWidth, pageHeight);

  doc.save(`Reporte_Pagos_${filterMonth || "General"}.pdf`);
};
