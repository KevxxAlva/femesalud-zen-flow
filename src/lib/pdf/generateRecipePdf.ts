import jsPDF from "jspdf";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Patient } from "@/lib/api/patients";
import { Consultation } from "@/lib/api/consultations";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

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

const calculateAge = (dob: string | Date | null | undefined): string => {
  if (!dob) return "—";
  const birthDate = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age.toString();
};

export const generateRecipePdf = async (
  patient: Patient,
  consultation: Consultation,
  doctor?: { full_name?: string; specialty?: string; mpps?: string; cmc?: string; university?: string }
): Promise<Blob | void> => {
  try {
    const indications = consultation.indications?.trim();
    if (!indications) {
      toast.error("La consulta no tiene indicaciones para generar el récipe.");
      return;
    }

    const doc = new jsPDF({ unit: "pt", format: "a4", orientation: "p" });
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 50;
    
    // Fetch clinic info if available
    let clinicName = "Centro Médico FemeSalud Zen Flow";
    let clinicAddress = "Valle de la Pascua, Estado Guárico.";
    let clinicPhone = "0412-1234567";
    let logoUrl = "";
    
    try {
      const { data } = await supabase.from("clinic_info").select("*").eq("id", 1).maybeSingle();
      if (data) {
        if (data.name) clinicName = data.name;
        if (data.address_line1) clinicAddress = data.address_line1;
        if (data.phone) clinicPhone = data.phone;
        if (data.recipe_logo_url) logoUrl = data.recipe_logo_url;
      }
    } catch (e) {
      console.error("Error fetching clinic info:", e);
    }

    const logoBase64 = logoUrl ? logoUrl : await loadLogoBase64("/logo.png");

    doc.setFont("helvetica", "normal");
    
    // Header
    if (logoBase64) {
      try {
        doc.addImage(logoBase64, "PNG", margin, margin - 10, 60, 60);
      } catch (e) {
        console.error("Logo error:", e);
      }
    }
    
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text(clinicName, pageWidth / 2, margin + 10, { align: "center" });
    
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(clinicAddress, pageWidth / 2, margin + 25, { align: "center" });
    doc.text(`Teléfono: ${clinicPhone}`, pageWidth / 2, margin + 40, { align: "center" });

    // Doctor info if provided
    const docName = doctor?.full_name || "Médico Tratante";
    const docSpecialty = doctor?.specialty || "Especialista";
    
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text(`Dr(a). ${docName}`, pageWidth / 2, margin + 65, { align: "center" });
    doc.setFontSize(10);
    doc.setFont("helvetica", "italic");
    doc.text(docSpecialty, pageWidth / 2, margin + 78, { align: "center" });

    // Line separator
    doc.setDrawColor(200);
    doc.setLineWidth(1);
    doc.line(margin, margin + 90, pageWidth - margin, margin + 90);

    // Patient info
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    
    const formattedDate = format(new Date(consultation.created_at), "dd 'de' MMMM 'de' yyyy", { locale: es });
    
    doc.text(`Fecha: ${formattedDate}`, pageWidth - margin, margin + 110, { align: "right" });
    
    doc.setFont("helvetica", "bold");
    doc.text(`Paciente:`, margin, margin + 110);
    doc.setFont("helvetica", "normal");
    doc.text(patient.full_name, margin + 55, margin + 110);
    
    doc.setFont("helvetica", "bold");
    doc.text(`C.I.:`, margin, margin + 125);
    doc.setFont("helvetica", "normal");
    doc.text(patient.document_id || "N/A", margin + 30, margin + 125);
    
    doc.setFont("helvetica", "bold");
    doc.text(`Edad:`, margin + 120, margin + 125);
    doc.setFont("helvetica", "normal");
    doc.text(`${calculateAge(patient.birth_date)} años`, margin + 155, margin + 125);
    
    doc.line(margin, margin + 140, pageWidth - margin, margin + 140);

    // Title
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("RÉCIPE E INDICACIONES", pageWidth / 2, margin + 170, { align: "center" });
    
    // Indications content
    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    const splitText = doc.splitTextToSize(indications, pageWidth - margin * 2);
    
    let y = margin + 200;
    const lineHeight = 15;
    
    for (let i = 0; i < splitText.length; i++) {
      if (y > pageHeight - margin - 100) {
        doc.addPage();
        y = margin;
      }
      doc.text(splitText[i], margin, y);
      y += lineHeight;
    }
    
    // Signature
    const signatureY = Math.max(y + 80, pageHeight - margin - 120);
    doc.setDrawColor(100);
    doc.line(pageWidth / 2 - 80, signatureY, pageWidth / 2 + 80, signatureY);
    
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text(`Firma y Sello`, pageWidth / 2, signatureY + 15, { align: "center" });
    doc.text(`Dr(a). ${docName}`, pageWidth / 2, signatureY + 30, { align: "center" });
    if (doctor?.mpps || doctor?.cmc) {
      doc.setFont("helvetica", "normal");
      const ms = doctor.mpps ? `MPPS: ${doctor.mpps}` : "";
      const cs = doctor.cmc ? `CMC: ${doctor.cmc}` : "";
      doc.text(`${ms} ${cs}`.trim(), pageWidth / 2, signatureY + 45, { align: "center" });
    }

    doc.save(`Recipe_${patient.full_name.replace(/\s+/g, "_")}_${format(new Date(), "yyyyMMdd")}.pdf`);
    toast.success("Récipe generado exitosamente");
    
  } catch (error) {
    console.error("Error generating PDF:", error);
    toast.error("Ocurrió un error al generar el récipe");
  }
};
