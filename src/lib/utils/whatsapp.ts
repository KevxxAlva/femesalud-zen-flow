import { toast } from "sonner";

export interface WhatsAppRecipeData {
  patientName: string;
  patientPhone?: string | null;
  consultationDate: string;
  indications: string;
  doctorName?: string;
  clinicName?: string;
  recipeUrl?: string;
}

export function generateWhatsAppRecipeMessage({
  patientName,
  consultationDate,
  indications,
  doctorName,
  clinicName = "FemeSalud",
  recipeUrl
}: WhatsAppRecipeData): string {
  if (recipeUrl) {
    return `🏥 *${clinicName.toUpperCase()}*\n\nHola ${patientName}, hemos generado tu récipe médico digital. Puedes descargarlo en formato PDF ingresando al siguiente enlace:\n\n📄 ${recipeUrl}\n\n_Si tienes problemas para abrirlo, por favor avísanos._`;
  }

  // Fallback si no hay URL (aunque ahora siempre debería haber)
  return `🏥 *${clinicName.toUpperCase()}*\n\nHola ${patientName}, aquí están las indicaciones de tu consulta:\n\n${indications.trim()}`;
}

export function sendRecipeViaWhatsApp(data: WhatsAppRecipeData) {
  if (!data.indications?.trim()) {
    toast.warning("La consulta no tiene indicaciones o receta registrada.");
    return;
  }

  const message = generateWhatsAppRecipeMessage(data);
  const encodedText = encodeURIComponent(message);

  let cleanPhone = (data.patientPhone || "").replace(/\D/g, "");

  // Format Venezuelan numbers appropriately
  if (cleanPhone.startsWith("0")) {
    cleanPhone = "58" + cleanPhone.substring(1);
  } else if (cleanPhone.length === 10 && (cleanPhone.startsWith("4") || cleanPhone.startsWith("2"))) {
    cleanPhone = "58" + cleanPhone;
  }

  const url = cleanPhone 
    ? `https://wa.me/${cleanPhone}?text=${encodedText}` 
    : `https://api.whatsapp.com/send?text=${encodedText}`;

  window.open(url, "_blank");
  toast.success("Abriendo WhatsApp para enviar el récipe...");
}
