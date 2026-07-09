import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export interface RecipePatient {
  id?: string;
  full_name: string;
  document_id: string | null;
  birth_date: string | null;
  phone?: string | null;
}

export interface RecipeConsultation {
  created_at: string;
  indications: string | null;
}

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

export const calculateAge = (birthDateStr: string | null | undefined): string => {
  if (!birthDateStr) return "—";
  
  const parts = birthDateStr.split("T")[0].split("-");
  if (parts.length !== 3) return "—";
  
  const birthYear = parseInt(parts[0], 10);
  const birthMonth = parseInt(parts[1], 10) - 1;
  const birthDay = parseInt(parts[2], 10);
  
  const birth = new Date(birthYear, birthMonth, birthDay);
  const today = new Date();
  
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return `${age} años`;
};

export const generateRecipePDF = async (
  patient: RecipePatient,
  consultation: RecipeConsultation,
  doctorName: string,
  doctorSpecialty?: string,
  doctorUniversity?: string,
  doctorMpps?: string,
  doctorCmc?: string,
  action: "save" | "whatsapp" = "save"
) => {
  try {
    const indicationsText = consultation.indications?.trim();
    if (!indicationsText) {
      toast.warning("La consulta no tiene indicaciones o receta registrada.");
      return;
    }

    // A4 Format (unit: pt, format: a4)
    // Page dimensions in pt: 595.28 x 841.89
    const { default: jsPDF } = await import("jspdf");
    const doc = new jsPDF({ unit: "pt", format: "a4", orientation: "p" });
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    const logoBase64 = await loadLogoBase64("/logo.png");

    // Query clinic info
    let clinicAddress1 = "Calle las Flores entre González Padrón y Shettino, Número 16.";
    let clinicAddress2 = "Valle de la Pascua, Estado Guárico.";
    let clinicPhone = "0412/8299890 0424/4609387";
    let clinicName = "Femesalud";
    let clinicRif = "";

    try {
      const { data } = await supabase.from("clinic_info").select("*").eq("id", 1).maybeSingle();
      if (data) {
        clinicAddress1 = data.address_line1;
        clinicAddress2 = data.address_line2;
        clinicPhone = data.phone;
        clinicName = data.name;
        clinicRif = data.rif;
      }
    } catch (e) {
      console.error("Error fetching clinic info for PDF:", e);
    }

    const dateObj = new Date(consultation.created_at);
    const topDay = String(dateObj.getDate()).padStart(2, "0");
    const topMonth = String(dateObj.getMonth() + 1).padStart(2, "0");
    const topYear = String(dateObj.getFullYear());

    // Setup doctor credentials using parameters or database fetch as fallback
    let docUni = doctorUniversity || "";
    let docMpps = doctorMpps || "";
    let docCmc = doctorCmc || "";
    let finalSpecialty = doctorSpecialty || "";

    // If any of the credentials are not provided, try to fetch them from database profiles
    if (!docUni || !docMpps || !docCmc || !finalSpecialty) {
      try {
        const { data: profileData } = await supabase
          .from("profiles")
          .select("university, mpps, cmc, specialty")
          .ilike("full_name", `%${doctorName}%`)
          .maybeSingle();

        if (profileData) {
          if (!docUni) docUni = profileData.university || "";
          if (!docMpps) docMpps = profileData.mpps || "";
          if (!docCmc) docCmc = profileData.cmc || "";
          if (!finalSpecialty) finalSpecialty = profileData.specialty || "";
        }
      } catch (e) {
        console.error("Error fetching doctor profile for PDF:", e);
      }
    }

    // Default fallbacks if they are still missing
    if (!docUni) {
      if (doctorName.toLowerCase().includes("carli") || doctorName.toLowerCase().includes("sole") || doctorName.toLowerCase().includes("solé")) {
        docUni = "UC-CHET";
      } else {
        docUni = finalSpecialty ? "Ginecólogo Obstetra" : "UC-CHET";
      }
    }
    if (!docMpps) {
      if (doctorName.toLowerCase().includes("carli") || doctorName.toLowerCase().includes("sole") || doctorName.toLowerCase().includes("solé")) {
        docMpps = "102.927";
      } else {
        docMpps = "______";
      }
    }
    if (!docCmc) {
      if (doctorName.toLowerCase().includes("carli") || doctorName.toLowerCase().includes("sole") || doctorName.toLowerCase().includes("solé")) {
        docCmc = "11.619";
      } else {
        docCmc = "______";
      }
    }
    if (!finalSpecialty) {
      finalSpecialty = doctorName.toLowerCase().includes("carli") || doctorName.toLowerCase().includes("sole") || doctorName.toLowerCase().includes("solé") 
        ? "Ginecóloga y Obstetra" 
        : "Médico Especialista";
    }

    // Draw header on Page 1
    const drawHeader = () => {
      // Add logo to the top left if available
      if (logoBase64) {
        doc.addImage(logoBase64, "PNG", 65, 25, 65, 65);
      }

      // Font Setup
      doc.setFont("times", "normal");
      doc.setFontSize(8.5);
      doc.setTextColor(60, 60, 60);

      // Top Header Info
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
      doc.setFont("times", "normal");
      doc.setFontSize(10.5);
      doc.text(`Valle de la Pascua,   ${topDay}   /   ${topMonth}   /   ${topYear}`, pageWidth - 70, 155, { align: "right" });

      // Title (centered & underlined)
      doc.setFont("times", "bold");
      doc.setFontSize(13);
      doc.text("RÉCIPE / INDICACIONES", pageWidth / 2, 195, { align: "center" });
      const titleWidth = doc.getTextWidth("RÉCIPE / INDICACIONES");
      doc.setDrawColor(0);
      doc.setLineWidth(0.5);
      doc.line(pageWidth / 2 - titleWidth / 2, 198, pageWidth / 2 + titleWidth / 2, 198);

      // Patient Name and Age lines (same as constancias)
      doc.setFont("times", "normal");
      doc.setFontSize(11);
      doc.setTextColor(0);
      doc.text("Paciente:", 70, 240);
      doc.line(120, 240, 390, 240);
      doc.setFont("times", "bold");
      doc.setFontSize(11.5);
      doc.text(patient.full_name, (120 + 390) / 2, 236, { align: "center" });

      doc.setFont("times", "normal");
      doc.setFontSize(11);
      doc.text("Edad:", 405, 240);
      doc.line(435, 240, 525, 240);
      doc.setFont("times", "bold");
      doc.setFontSize(11.5);
      doc.text(calculateAge(patient.birth_date), (435 + 525) / 2, 236, { align: "center" });

      // C.I. line
      let ciLabel = "C.I. V-";
      let displayCI = patient.document_id || "";
      if (displayCI.startsWith("V-")) {
        ciLabel = "C.I. V-";
        displayCI = displayCI.slice(2);
      } else if (displayCI.startsWith("E-")) {
        ciLabel = "C.I. E-";
        displayCI = displayCI.slice(2);
      } else if (displayCI.startsWith("P-")) {
        ciLabel = "Pasaporte ";
        displayCI = displayCI.slice(2);
      } else {
        ciLabel = "C.I. ";
      }

      doc.setFont("times", "normal");
      doc.setFontSize(11);
      doc.text(ciLabel, 70, 275);
      const labelWidth = doc.getTextWidth(ciLabel);
      const lineStartX = 70 + labelWidth + 5;
      const lineEndX = 280;
      doc.line(lineStartX, 275, lineEndX, 275);
      doc.setFont("times", "bold");
      doc.setFontSize(11.5);
      doc.text(displayCI, (lineStartX + lineEndX) / 2, 271, { align: "center" });

      // Rx body title
      doc.setFont("times", "bold");
      doc.setFontSize(11.5);
      doc.text("Indicaciones:", 70, 310);
    };

    drawHeader();

    // Body Text wrap at 455 pt (70 pt margin left/right)
    doc.setFont("times", "normal");
    doc.setFontSize(11);
    doc.setTextColor(30, 30, 30);
    const lines = doc.splitTextToSize(indicationsText, 455);

    let currentY = 330;
    const lineHeight = 15;

    lines.forEach((line: string) => {
      // If we go beyond 660, start a new page to leave room for the signature block at Y = 700
      if (currentY > 660) {
        doc.addPage();
        
        // Draw running header on next pages
        doc.setFont("times", "bold");
        doc.setFontSize(8.5);
        doc.setTextColor(140, 140, 140);
        doc.text(`Paciente: ${patient.full_name} | Fecha: ${topDay}/${topMonth}/${topYear}`, 70, 35);
        
        doc.setDrawColor(210, 210, 210);
        doc.setLineWidth(0.5);
        doc.line(70, 40, pageWidth - 70, 40);

        currentY = 60;
        doc.setFont("times", "normal");
        doc.setFontSize(11);
        doc.setTextColor(30, 30, 30);
      }
      doc.text(line, 70, currentY);
      currentY += lineHeight;
    });

    // Signature Block at Y = 700 on last page
    const totalPages = doc.getNumberOfPages();
    doc.setPage(totalPages);

    const sigY = 700;
    doc.setDrawColor(120);
    doc.setLineWidth(0.5);
    doc.setLineDashPattern([2, 2], 0);
    doc.line(pageWidth / 2 - 100, sigY, pageWidth / 2 + 100, sigY);
    doc.setLineDashPattern([], 0); // Restore solid line

    doc.setFont("times", "bold");
    doc.setFontSize(11.5);
    doc.text(doctorName, pageWidth / 2, sigY + 16, { align: "center" });

    doc.setFont("times", "normal");
    doc.setFontSize(10.5);
    doc.text(finalSpecialty, pageWidth / 2, sigY + 29, { align: "center" });

    if (docUni) {
      doc.text(docUni, pageWidth / 2, sigY + 42, { align: "center" });
    }

    const regText = `MPPS ${docMpps}   CMC ${docCmc}`;
    doc.text(regText, pageWidth / 2, sigY + 55, { align: "center" });

    // Apply large watermark and page numbers on all pages
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);

      // Watermark
      try {
        if (logoBase64) {
          doc.saveGraphicsState();
          const gState = new (doc as any).GState({ opacity: 0.04 });
          doc.setGState(gState);
          // Logo centered: width 550, height 550
          const imgWidth = 550;
          const imgHeight = 550;
          const imgX = (pageWidth - imgWidth) / 2;
          const imgY = (pageHeight - imgHeight) / 2 - 20;
          doc.addImage(logoBase64, "PNG", imgX, imgY, imgWidth, imgHeight);
          doc.restoreGraphicsState();
        }
      } catch (e) {
        console.error("Error drawing watermark:", e);
      }

      // Page numbers if multi-page
      if (totalPages > 1) {
        doc.setFont("times", "normal");
        doc.setFontSize(8);
        doc.setTextColor(150, 150, 150);
        doc.text(`Página ${i} de ${totalPages}`, pageWidth - 70, pageHeight - 20, { align: "right" });
      }
    }

    const cleanName = patient.full_name
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "") // Remove accents
      .replace(/[^a-zA-Z0-9]/g, "_")   // Replace any non-alphanumeric character with underscore
      .replace(/_+/g, "_");            // Collapse multiple underscores

    const fileName = `Recipe_${cleanName}_${topYear}${topMonth}${topDay}.pdf`;

    if (action === "save") {
      doc.save(fileName);
      toast.success("Récipe médico exportado correctamente");
    } else if (action === "whatsapp") {
      toast.loading("Generando y subiendo el récipe...", { id: "recipe-whatsapp" });
      const pdfBlob = doc.output("blob");
      const path = `recipes/${patient.id || "tmp"}/${Date.now()}_${fileName}`;
      
      const { error: uploadError } = await supabase.storage.from("clinical-attachments").upload(path, pdfBlob, {
        contentType: "application/pdf"
      });
      
      if (uploadError) throw uploadError;
      
      const { data } = await supabase.storage.from("clinical-attachments").createSignedUrl(path, 60 * 60 * 24 * 7); // 7 días
      if (!data?.signedUrl) throw new Error("No se pudo generar el enlace");
      
      const phone = patient.phone?.replace(/\D/g, "");
      
      toast.dismiss("recipe-whatsapp");
      
      if (!phone) {
        await navigator.clipboard.writeText(data.signedUrl);
        toast.success("Enlace copiado. El paciente no tiene teléfono registrado.");
      } else {
        const text = `Hola *${patient.full_name}*, aquí tienes tu récipe médico: \n\n${data.signedUrl}`;
        window.open(`https://wa.me/${phone}?text=${encodeURIComponent(text)}`, "_blank");
        toast.success("Redirigiendo a WhatsApp...");
      }
    }
  } catch (err) {
    console.error(err);
    toast.dismiss("recipe-whatsapp");
    toast.error(err instanceof Error ? err.message : "Error al procesar el récipe");
  }
};
