import { VisitType } from "@/lib/api/consultations";

export interface ConsultationFormValues {
  visitType: VisitType;
  isFirstVisit: boolean;
  subjectiveExam: string;
  contactChannel: string;
  heightCm: string;
  weightKg: string;
  bloodPressure: string;
  heartRate: string;
  respiratoryRate: string;
  temperature: string;
  skin: string;
  headNeck: string;
  breasts: string;
  abdomen: string;
  gynecological: string;
  extremities: string;
  neurological: string;
  aceticAcidTest: string;
  aceticClockPosition: string;
  aceticRelativePosition: string;
  lugolTest: string;
  lugolClockPosition: string;
  lugolRelativePosition: string;
  gestationalAge: string;
  fetalWeight: string;
  obstetricBp: string;
  uterineHeight: string;
  presentation: string;
  fetalHeartRate: string;
  fetalMovements: string;
  edema: string;
  alarmSigns: string;
  diagnosis: string;
  indications: string;
  complementaryExams: string;
  plan: string;
  nextAppointmentDate: string;
}

export const CONTACT_CHANNELS = ["WhatsApp", "Instagram", "Facebook", "Radio", "Recomendado", "Prensa", "Volante", "Otro"];

export const COMMON_CONSUMABLES = [
  { name: "Kit de citología", defaultUnit: "U" },
  { name: "Gel de ultrasonido", defaultUnit: "cc" },
  { name: "Impresión de eco", defaultUnit: "U" },
  { name: "Papel camilla", defaultUnit: "m" },
  { name: "Guantes de examen", defaultUnit: "par" },
  { name: "Guantes estériles", defaultUnit: "par" },
  { name: "Gasas", defaultUnit: "U" },
  { name: "Espéculo desechable", defaultUnit: "U" },
  { name: "Jeringas", defaultUnit: "U" },
  { name: "Baja lengua", defaultUnit: "U" },
];
