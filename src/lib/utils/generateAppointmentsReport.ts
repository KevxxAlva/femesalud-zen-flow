import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { getClinicPdfConfig, drawPdfHeader, drawPdfWatermark, drawPdfFooter } from "./pdfConfig";

type AppointmentForReport = {
  id_cita: number;
  paciente_nombre?: string;
  fecha_hora: string;
  estado: string;
  motivo?: string;
};

export const generateAppointmentsReport = async (appointments: AppointmentForReport[]) => {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  
  const config = await getClinicPdfConfig();
  drawPdfWatermark(doc, config, pageWidth, pageHeight);
  drawPdfHeader(doc, config, pageWidth);

  doc.setFont(config.customFontFamily, "bold");
  doc.setFontSize(14);
  doc.setTextColor(0);
  doc.text("REPORTE DE CITAS MÉDICAS", pageWidth / 2, 170, { align: "center" });

  const currentMonthName = new Date().toLocaleString('es-ES', { month: 'long', year: 'numeric' });
  doc.setFontSize(11);
  doc.text(`Mes: ${currentMonthName.toUpperCase()}`, pageWidth / 2, 185, { align: "center" });

  const tableData = appointments.map(a => {
    let estadoDisplay = "Desconocido";
    if (a.estado?.toLowerCase() === "completada") estadoDisplay = "Completada";
    else if (a.estado?.toLowerCase() === "pendiente") estadoDisplay = "Pendiente";
    else if (a.estado?.toLowerCase() === "cancelada") estadoDisplay = "Cancelada";
    else estadoDisplay = a.estado || 'N/A';

    return [
      `CITA-${a.id_cita.toString().padStart(4, '0')}`,
      a.paciente_nombre || 'Desconocido',
      a.fecha_hora ? new Date(a.fecha_hora).toLocaleString() : '',
      a.motivo || 'N/A',
      estadoDisplay
    ];
  });

  autoTable(doc, {
    startY: 205,
    head: [['ID', 'Paciente', 'Fecha y Hora', 'Motivo', 'Estado']],
    body: tableData,
    theme: 'striped',
    styles: { font: config.customFontFamily, fontSize: 10, cellPadding: 5 },
    headStyles: { fillColor: [139, 92, 175], textColor: 255, font: config.customFontFamily },
    margin: { left: 40, right: 40 },
    didParseCell: function (data) {
      if (data.section === 'body' && data.column.index === 4) {
        const estado = data.cell.raw as string;
        if (estado === 'Completada') {
          data.cell.styles.textColor = [22, 163, 74];
          data.cell.styles.fontStyle = 'bold';
        } else if (estado === 'Pendiente') {
          data.cell.styles.textColor = [202, 138, 4];
          data.cell.styles.fontStyle = 'bold';
        } else if (estado === 'Cancelada') {
          data.cell.styles.textColor = [220, 38, 38];
          data.cell.styles.fontStyle = 'bold';
        }
      }
    }
  });

  const totalCompletadas = appointments.filter(a => a.estado?.toLowerCase() === 'completada').length;
  const totalPendientes = appointments.filter(a => a.estado?.toLowerCase() === 'pendiente').length;

  const finalY = (doc as any).lastAutoTable.finalY || 205;
  doc.setFontSize(11);
  doc.setFont(config.customFontFamily, "bold");
  doc.setTextColor(0);
  doc.text(`Citas Completadas: ${totalCompletadas}`, pageWidth - 40, finalY + 20, { align: "right" });
  doc.text(`Citas Pendientes: ${totalPendientes}`, pageWidth - 40, finalY + 35, { align: "right" });
  doc.text(`Total del Mes: ${appointments.length}`, pageWidth - 40, finalY + 50, { align: "right" });

  drawPdfFooter(doc, config, pageWidth, pageHeight);

  doc.save(`Reporte_Citas_${currentMonthName.replace(" ", "_")}.pdf`);
};
