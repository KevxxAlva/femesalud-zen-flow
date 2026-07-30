import { toast } from "sonner";

export interface WhatsAppRecipeData {
  patientName: string;
  patientPhone?: string | null;
  consultationDate: string;
  indications: string;
  doctorName?: string;
  clinicName?: string;
}

export function generateWhatsAppRecipeMessage({
  patientName,
  consultationDate,
  indications,
  doctorName,
  clinicName = "FemeSalud"
}: WhatsAppRecipeData): string {
  const formattedDate = new Date(consultationDate).toLocaleDateString("es-ES", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric"
  });

  let msg = `🏥 *${clinicName.toUpperCase()} — RÉCIPE MÉDICO*\n`;
  msg += `─────────────────────────\n`;
  msg += `👤 *Paciente:* ${patientName}\n`;
  msg += `📅 *Fecha:* ${formattedDate}\n`;
  if (doctorName) {
    msg += `🩺 *Médico:* ${doctorName}\n`;
  }
  msg += `─────────────────────────\n\n`;
  msg += `💊 *TRATAMIENTO E INDICACIONES:*\n\n`;
  msg += `${indications.trim()}\n\n`;
  msg += `─────────────────────────\n`;
  msg += `_Conserve este récipe para el seguimiento de su tratamiento. Si presenta alguna duda o síntoma adverso, comuníquese de inmediato con el consultorio._`;

  return msg;
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
