import { supabase } from "@/integrations/supabase/client";

export const getClinicPdfConfig = async () => {
  let clinicAddress1 = "Calle las Flores entre González Padrón y Shettino, Número 16.";
  let clinicAddress2 = "Valle de la Pascua, Estado Guárico.";
  let clinicPhone = "0412/8299890 0424/4609387";
  let clinicName = "Femesalud";
  let clinicType = "Consultorio Ginecológico Obstétrico";
  let clinicRif = "";
  
  let customHeaderText = "";
  let customFontFamily = "times"; 
  let customLogoUrl = "";
  let customFooterText = "";

  try {
    const { data } = await supabase.from("clinic_info").select("*").eq("id", 1).maybeSingle();
    if (data) {
      clinicAddress1 = data.address_line1 || "";
      clinicAddress2 = data.address_line2 || "";
      clinicPhone = data.phone || "";
      clinicName = data.name || "Centro Médico FemeSalud Zen Flow";
      clinicRif = data.rif || "J-00000000-0";
      
      clinicType = data.recipe_clinic_type || "Consultorio Ginecológico Obstétrico";
      
      customHeaderText = data.recipe_header_text || "";
      customFooterText = data.recipe_footer_text || "";
      customLogoUrl = data.recipe_logo_url || "";
      
      if (data.recipe_font_family === "font-sans") customFontFamily = "helvetica";
      else if (data.recipe_font_family === "font-mono") customFontFamily = "courier";
      else customFontFamily = "times";
    }
  } catch (e) {
    console.error("Error fetching clinic info for PDF:", e);
  }

  return {
    clinicAddress1, clinicAddress2, clinicPhone, clinicName, clinicType, clinicRif,
    customHeaderText, customFooterText, customLogoUrl, customFontFamily
  };
};

export const drawPdfHeader = (doc: any, config: any, pageWidth: number) => {
  // Draw top-left logo if exists
  if (config.customLogoUrl) {
    try {
      // 40pt from left, 35pt from top, 60x60pt size
      doc.addImage(config.customLogoUrl, "PNG", 40, 35, 60, 60);
    } catch (e) {
      console.error("Could not draw header logo", e);
    }
  }

  // Always draw the Address and Phone
  doc.setFont(config.customFontFamily, "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(60, 60, 60);
  doc.text(config.clinicAddress1, pageWidth / 2, 45, { align: "center" });
  doc.text(config.clinicAddress2, pageWidth / 2, 57, { align: "center" });
  const headerLine3 = config.clinicRif ? `Teléfono: ${config.clinicPhone} | RIF: ${config.clinicRif}` : `Teléfono: ${config.clinicPhone}`;
  doc.text(headerLine3, pageWidth / 2, 69, { align: "center" });

  // Clinic Name
  doc.setFont(config.customFontFamily, "normal");
  doc.setFontSize(12.5);
  doc.setTextColor(0);
  doc.text(config.clinicType, pageWidth / 2, 105, { align: "center" });
  doc.setFont(config.customFontFamily, "italic");
  doc.setFontSize(17.5);
  doc.text(config.clinicName, pageWidth / 2, 122, { align: "center" });

  // If there is any custom header text, draw it below the clinic name
  if (config.customHeaderText) {
    doc.setFont(config.customFontFamily, "bold");
    doc.setFontSize(11);
    doc.setTextColor(0, 0, 0);
    const lines = config.customHeaderText.split("\n");
    let yPos = 140;
    lines.forEach((line: string) => {
      doc.text(line, pageWidth / 2, yPos, { align: "center" });
      yPos += 15;
    });
  }
};

export const drawPdfWatermark = (doc: any, config: any, pageWidth: number, pageHeight: number) => {
  if (config.customLogoUrl) {
    try {
      doc.saveGraphicsState();
      const gState = new (doc as any).GState({ opacity: 0.1 });
      doc.setGState(gState);
      doc.addImage(config.customLogoUrl, "PNG", (pageWidth - 250) / 2, (pageHeight - 250) / 2, 250, 250);
      doc.restoreGraphicsState();
    } catch (e) {
      console.error("Could not draw watermark", e);
    }
  }
};

export const drawPdfFooter = (doc: any, config: any, pageWidth: number, pageHeight: number) => {
  if (config.customFooterText) {
    doc.setFont(config.customFontFamily, "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(100, 100, 100);
    const footerLines = config.customFooterText.split("\n");
    let fY = pageHeight - 30;
    footerLines.forEach((line: string) => {
      doc.text(line, pageWidth / 2, fY, { align: "center" });
      fY += 10;
    });
  }
};
