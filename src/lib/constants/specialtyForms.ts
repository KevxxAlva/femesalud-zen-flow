export type FieldType = "text" | "number" | "select" | "textarea" | "checkbox";

export interface SpecialtyField {
  id: string;
  label: string;
  type: FieldType;
  options?: string[];
  placeholder?: string;
  unit?: string;
  gridSpan?: 1 | 2;
}

export interface SpecialtySection {
  title: string;
  description?: string;
  fields: SpecialtyField[];
}

export interface SpecialtyConfig {
  key: string;
  name: string;
  tabTitle: string;
  sections: SpecialtySection[];
}

// 1. Ginecología y Obstetricia (Mantiene total compatibilidad con lo actual)
export const GYNECOLOGY_CONFIG: SpecialtyConfig = {
  key: "gynecology",
  name: "Ginecología y Obstetricia",
  tabTitle: "Colpo & Obstetricia",
  sections: [
    {
      title: "Colposcopia",
      description: "Pruebas de ácido acético y Lugol / Schiller",
      fields: [
        {
          id: "acetic_acid_test",
          label: "Prueba Ácido Acético",
          type: "select",
          options: ["No evaluado", "Negativa (-)", "Acetoblanco tenue", "Acetoblanco denso", "Bordes sobreelevados"],
          gridSpan: 2,
        },
        {
          id: "acetic_clock_position",
          label: "Posición Reloj (Ácido)",
          type: "text",
          placeholder: "Ej: 12 a 3 hrs",
          gridSpan: 1,
        },
        {
          id: "acetic_relative_position",
          label: "Posición Relativa (Ácido)",
          type: "text",
          placeholder: "Ej: Labio anterior / periorificial",
          gridSpan: 1,
        },
        {
          id: "lugol_test",
          label: "Test de Lugol (Schiller)",
          type: "select",
          options: ["No evaluado", "Yodo positivo (Normal / Caoba)", "Yodo negativo (Patológico / Zona clara)", "Captación moteada"],
          gridSpan: 2,
        },
        {
          id: "lugol_clock_position",
          label: "Posición Reloj (Lugol)",
          type: "text",
          placeholder: "Ej: 6 a 9 hrs",
          gridSpan: 1,
        },
        {
          id: "lugol_relative_position",
          label: "Posición Relativa (Lugol)",
          type: "text",
          placeholder: "Ej: Zona de transformación",
          gridSpan: 1,
        },
      ],
    },
    {
      title: "Control Obstétrico",
      description: "Parámetros de evolución y bienestar materno-fetal",
      fields: [
        {
          id: "gestational_age",
          label: "Edad Gestacional (EG)",
          type: "text",
          placeholder: "Ej: 28.4 semanas",
          gridSpan: 1,
        },
        {
          id: "fetal_weight",
          label: "Peso Fetal Estimado (g)",
          type: "number",
          placeholder: "Ej: 1250",
          unit: "g",
          gridSpan: 1,
        },
        {
          id: "obstetric_bp",
          label: "Presión Arterial Obstétrica",
          type: "text",
          placeholder: "Ej: 110/70",
          unit: "mmHg",
          gridSpan: 1,
        },
        {
          id: "uterine_height",
          label: "Altura Uterina (AU)",
          type: "number",
          placeholder: "Ej: 26",
          unit: "cm",
          gridSpan: 1,
        },
        {
          id: "presentation",
          label: "Presentación Fetal",
          type: "select",
          options: ["No aplica / Indefinida", "Cefálica", "Podálica / Pelviana", "Transversa"],
          gridSpan: 1,
        },
        {
          id: "fetal_heart_rate",
          label: "Frecuencia Cardíaca Fetal (FCF)",
          type: "number",
          placeholder: "Ej: 142",
          unit: "lpm",
          gridSpan: 1,
        },
        {
          id: "fetal_movements",
          label: "Movimientos Fetales",
          type: "select",
          options: ["No aplica", "Presentes y activos", "Disminuidos", "Ausentes"],
          gridSpan: 1,
        },
        {
          id: "edema",
          label: "Edema Periférico",
          type: "select",
          options: ["Ausente", "Grado I (+)", "Grado II (++)", "Grado III (+++)", "Grado IV (++++)"],
          gridSpan: 1,
        },
        {
          id: "alarm_signs",
          label: "Signos de Alarma Obstétrica",
          type: "textarea",
          placeholder: "Cefalea intensa, visión borrosa, acúfenos, hidrorrea, sangrado transvaginal, dinámica dolorosa...",
          gridSpan: 2,
        },
      ],
    },
  ],
};

// 2. Pediatría
export const PEDIATRICS_CONFIG: SpecialtyConfig = {
  key: "pediatrics",
  name: "Pediatría",
  tabTitle: "Control Pediátrico",
  sections: [
    {
      title: "Somatometría y Percentiles",
      description: "Crecimiento ponderoestatural infantil",
      fields: [
        {
          id: "ped_head_circumference",
          label: "Perímetro Cefálico",
          type: "number",
          placeholder: "Ej: 42.5",
          unit: "cm",
          gridSpan: 1,
        },
        {
          id: "ped_weight_percentile",
          label: "Percentil Peso / Edad",
          type: "select",
          options: ["< P3 (Bajo peso)", "P3 - P10", "P10 - P50 (Normal)", "P50 - P90 (Normal alto)", "P90 - P97 (Sobrepeso)", "> P97 (Obesidad)"],
          gridSpan: 1,
        },
        {
          id: "ped_height_percentile",
          label: "Percentil Talla / Edad",
          type: "select",
          options: ["< P3 (Talla baja)", "P3 - P10", "P10 - P50 (Adecuada)", "P50 - P90", "> P97 (Talla alta)"],
          gridSpan: 1,
        },
        {
          id: "ped_nutritional_status",
          label: "Estado Nutricional Global",
          type: "select",
          options: ["Eutrófico", "Riesgo de desnutrición", "Desnutrición aguda", "Sobrepeso", "Obesidad infantil"],
          gridSpan: 1,
        },
      ],
    },
    {
      title: "Alimentación e Inmunizaciones",
      description: "Nutrición infantil y esquema vacunal",
      fields: [
        {
          id: "ped_feeding_type",
          label: "Régimen Alimentario",
          type: "select",
          options: ["Lactancia Materna Exclusiva", "Fórmula Infantil", "Lactancia Mixta", "Alimentación Complementaria", "Dieta Completa Familiar"],
          gridSpan: 1,
        },
        {
          id: "ped_vaccines_status",
          label: "Esquema de Vacunación",
          type: "select",
          options: ["Completo para la edad", "Incompleto / Pendiente", "Sin cartilla disponible"],
          gridSpan: 1,
        },
        {
          id: "ped_vaccines_notes",
          label: "Vacunas Pendientes / Observaciones de Inmunización",
          type: "text",
          placeholder: "Ej: Pendiente refuerzo de Pentavalente y Neumococo a los 4 meses",
          gridSpan: 2,
        },
      ],
    },
    {
      title: "Desarrollo Psicomotor y Exploración Pediátrica",
      description: "Hitos evolutivos y hallazgos específicos",
      fields: [
        {
          id: "ped_milestones",
          label: "Hitos del Neurodesarrollo",
          type: "textarea",
          placeholder: "Sostén cefálico, sonrisa social, fijación y seguimiento visual, sedestación, marcha, lenguaje y balbuceo...",
          gridSpan: 2,
        },
        {
          id: "ped_fontanelle",
          label: "Fontanela Anterior",
          type: "select",
          options: ["Normotensa / Blanda", "Abombada / Tensa", "Deprimida (deshidratación)", "Cerrada"],
          gridSpan: 1,
        },
        {
          id: "ped_oropharynx",
          label: "Orofaringe y Dentición",
          type: "text",
          placeholder: "Ej: Amígdalas grado I sin exudado, 4 piezas dentarias erupcionadas",
          gridSpan: 1,
        },
      ],
    },
  ],
};

// 3. Cardiología
export const CARDIOLOGY_CONFIG: SpecialtyConfig = {
  key: "cardiology",
  name: "Cardiología",
  tabTitle: "Evaluación Cardíaca",
  sections: [
    {
      title: "Estratificación de Riesgo Cardiovascular",
      description: "Factores predisponentes y antecedentes específicos",
      fields: [
        {
          id: "cardio_nyha_class",
          label: "Clase Funcional NYHA",
          type: "select",
          options: ["Clase I (Sin limitación física)", "Clase II (Limitación leve en actividad habitual)", "Clase III (Limitación marcada en actividad menor)", "Clase IV (Síntomas en reposo)"],
          gridSpan: 1,
        },
        {
          id: "cardio_cv_risk",
          label: "Perfil de Riesgo Cardiovascular Global",
          type: "select",
          options: ["Bajo (< 1%)", "Moderado (1-5%)", "Alto (5-10%)", "Muy Alto (> 10%)"],
          gridSpan: 1,
        },
        {
          id: "cardio_risk_factors",
          label: "Factores de Riesgo Presentes",
          type: "text",
          placeholder: "Ej: HTA, Tabaquismo (10 paquetes/año), Diabetes Mellitus tipo 2, Dislipidemia",
          gridSpan: 2,
        },
      ],
    },
    {
      title: "Examen Físico Cardiovascular Dirigido",
      description: "Auscultación y signos de sobrecarga hídrica",
      fields: [
        {
          id: "cardio_auscultation",
          label: "Auscultación Cardíaca (R1 / R2 / Soplos)",
          type: "textarea",
          placeholder: "R1 y R2 rítmicos y normofonéticos. Soplo sistólico eyectivo foco aórtico II/VI, sin chasquidos ni galope R3/R4.",
          gridSpan: 2,
        },
        {
          id: "cardio_jugular_pressure",
          label: "Ingurgitación Yugular",
          type: "select",
          options: ["Ausente (Grado 0)", "Grado I (hasta tercio inferior)", "Grado II (tercio medio)", "Grado III (sobrepasa mandíbula)"],
          gridSpan: 1,
        },
        {
          id: "cardio_peripheral_pulses",
          label: "Pulsos Periféricos",
          type: "select",
          options: ["Simétricos y de buena amplitud", "Disminuidos en MMII", "Asimétricos", "Saltones / Celer"],
          gridSpan: 1,
        },
      ],
    },
    {
      title: "Electrocardiograma (ECG) en Consulta",
      description: "Trazado basal evaluado",
      fields: [
        {
          id: "cardio_ecg_rhythm",
          label: "Ritmo y Frecuencia ECG",
          type: "text",
          placeholder: "Ej: Ritmo sinusal regular a 72 lpm, PR 160ms, QRS estrecho 80ms",
          gridSpan: 1,
        },
        {
          id: "cardio_ecg_findings",
          label: "Hallazgos Electrocardiográficos",
          type: "textarea",
          placeholder: "Eje eléctrico a +60°. Sin signos de isquemia aguda ni sobrecarga de cavidades. Repolarización ventricular normal.",
          gridSpan: 2,
        },
      ],
    },
  ],
};

// 4. Dermatología
export const DERMATOLOGY_CONFIG: SpecialtyConfig = {
  key: "dermatology",
  name: "Dermatología",
  tabTitle: "Evaluación Dermatológica",
  sections: [
    {
      title: "Caracterización de la Lesión Cutánea",
      description: "Morfología y tipología dermatológica",
      fields: [
        {
          id: "derma_fitzpatrick",
          label: "Fototipo Cutáneo (Fitzpatrick)",
          type: "select",
          options: ["Fototipo I (Siempre se quema, nunca se broncea)", "Fototipo II (Se quema con facilidad, mínimo bronceado)", "Fototipo III (Se quema moderadamente, se broncea gradual)", "Fototipo IV (Se quema mínimamente, se broncea bien)", "Fototipo V (Rara vez se quema, piel morena)", "Fototipo VI (Nunca se quema, piel intensamente pigmentada)"],
          gridSpan: 1,
        },
        {
          id: "derma_primary_lesion",
          label: "Tipo de Lesión Primaria",
          type: "select",
          options: ["Mácula / Mancha", "Pápula", "Placa", "Nódulo", "Vesícula / Ampolla", "Pústula", "Habón / Roncha", "Úlcera / Erosión", "Escama / Costra"],
          gridSpan: 1,
        },
        {
          id: "derma_location",
          label: "Distribución y Topografía Anatómica",
          type: "text",
          placeholder: "Ej: Región malar bilateral, respeta surco nasogeniano / Miembros inferiores",
          gridSpan: 2,
        },
        {
          id: "derma_evolution_time",
          label: "Tiempo de Evolución",
          type: "text",
          placeholder: "Ej: 3 semanas con progresión centrípeta",
          gridSpan: 1,
        },
        {
          id: "derma_pruritus",
          label: "Intensidad del Prurito / Dolor",
          type: "select",
          options: ["Asintomático", "Prurito leve ocasional", "Prurito moderado", "Prurito intenso incapacitante", "Doloroso a la palpación"],
          gridSpan: 1,
        },
      ],
    },
    {
      title: "Dermatoscopia y Diagnóstico Diferencial",
      description: "Hallazgos con dermatoscopio y anexos",
      fields: [
        {
          id: "derma_dermoscopy_findings",
          label: "Hallazgos Dermatoscópicos",
          type: "textarea",
          placeholder: "Patrón pigmentario reticular homogéneo, ausencia de estructuras vasculares atípicas, red de pigmento regular...",
          gridSpan: 2,
        },
        {
          id: "derma_hair_nails",
          label: "Evaluación de Anexos (Pelo y Uñas)",
          type: "text",
          placeholder: "Ej: Pelo sin tricotilomanía ni placas alopécicas. Uñas sin hoyuelos ni onicólisis.",
          gridSpan: 2,
        },
      ],
    },
  ],
};

// 5. Traumatología y Ortopedia
export const TRAUMATOLOGY_CONFIG: SpecialtyConfig = {
  key: "traumatology",
  name: "Traumatología y Ortopedia",
  tabTitle: "Evaluación Osteomuscular",
  sections: [
    {
      title: "Segmento Afectado y Mecanismo de Lesión",
      description: "Cinemática traumática o molestia biomecánica",
      fields: [
        {
          id: "trauma_joint",
          label: "Región / Articulación Afectada",
          type: "select",
          options: ["Columna Cervical", "Columna Lumbar", "Hombro", "Codo", "Muñeca / Mano", "Cadera / Pelvis", "Rodilla", "Tobillo / Pie"],
          gridSpan: 1,
        },
        {
          id: "trauma_laterality",
          label: "Lateralidad",
          type: "select",
          options: ["Derecha", "Izquierda", "Bilateral", "Axial / Central"],
          gridSpan: 1,
        },
        {
          id: "trauma_mechanism",
          label: "Mecanismo de Lesión / Inicio",
          type: "text",
          placeholder: "Ej: Torsión en varo forzado durante actividad deportiva / Caída de propia altura",
          gridSpan: 2,
        },
      ],
    },
    {
      title: "Movilidad Articular y Maniobras Específicas",
      description: "Arcos de movimiento, estabilidad y tono",
      fields: [
        {
          id: "trauma_range_of_motion",
          label: "Rango de Movilidad Articular (ROM)",
          type: "textarea",
          placeholder: "Flexión activa a 110° (dolorosa al final del recorrido), extensión completa 0°, rotación externa conservada.",
          gridSpan: 2,
        },
        {
          id: "trauma_special_tests",
          label: "Maniobras Especiales Realizadas",
          type: "textarea",
          placeholder: "Lachman negativo, Cajón anterior negativo, McMurray positivo para cuerno posterior menisco medial...",
          gridSpan: 2,
        },
        {
          id: "trauma_neurovascular",
          label: "Estado Neurovascular Distal",
          type: "select",
          options: ["Conservado (pulsos presentes, llenado capilar < 2s, sensibilidad intacta)", "Parestesias distales", "Déficit motor periférico", "Compromiso vascular"],
          gridSpan: 2,
        },
      ],
    },
  ],
};

// 6. Oftalmología
export const OPHTHALMOLOGY_CONFIG: SpecialtyConfig = {
  key: "ophthalmology",
  name: "Oftalmología",
  tabTitle: "Evaluación Oftalmológica",
  sections: [
    {
      title: "Agudeza Visual y Refracción",
      description: "Medición en escala de Snellen",
      fields: [
        {
          id: "oph_av_od",
          label: "Agudeza Visual Ojo Derecho (OD)",
          type: "text",
          placeholder: "Ej: 20/20 s/c (con corrección: 20/15)",
          gridSpan: 1,
        },
        {
          id: "oph_av_oi",
          label: "Agudeza Visual Ojo Izquierdo (OI)",
          type: "text",
          placeholder: "Ej: 20/40 s/c (con corrección: 20/20)",
          gridSpan: 1,
        },
        {
          id: "oph_iop_od",
          label: "Presión Intraocular OD",
          type: "number",
          placeholder: "Ej: 14",
          unit: "mmHg",
          gridSpan: 1,
        },
        {
          id: "oph_iop_oi",
          label: "Presión Intraocular OI",
          type: "number",
          placeholder: "Ej: 15",
          unit: "mmHg",
          gridSpan: 1,
        },
      ],
    },
    {
      title: "Biomicroscopía y Fondo de Ojo",
      description: "Segmento anterior y posterior ocular",
      fields: [
        {
          id: "oph_anterior_segment",
          label: "Biomicroscopía (Lámpara de Hendidura)",
          type: "textarea",
          placeholder: "Córnea transparente sin leucomas, cámara anterior formada y ópticamente vacía, iris trófico y reactivo, cristalino transparente.",
          gridSpan: 2,
        },
        {
          id: "oph_fundus",
          label: "Fondo de Ojo / Retinografía",
          type: "textarea",
          placeholder: "Papila de bordes netos, coloración normal, excavación 0.3. Relación arteriovenosa 2/3. Mácula brillante con reflejo foveolar presente.",
          gridSpan: 2,
        },
      ],
    },
  ],
};

// 7. Esquema Universal / Medicina General (Para cualquier especialidad que no tenga plantilla hiper-específica)
export const GENERAL_MEDICINE_CONFIG: SpecialtyConfig = {
  key: "general",
  name: "Medicina General / Especialidad Clínica",
  tabTitle: "Exploración Clínica",
  sections: [
    {
      title: "Revisión por Sistemas Dirigida",
      description: "Interrogatorio dirigido a aparatos y sistemas",
      fields: [
        {
          id: "gen_systems_review",
          label: "Revisión por Sistemas",
          type: "textarea",
          placeholder: "Cardiovascular, respiratorio, gastrointestinal, genitourinario, osteomuscular, sistema nervioso...",
          gridSpan: 2,
        },
      ],
    },
    {
      title: "Examen Físico Focalizado de la Especialidad",
      description: "Hallazgos específicos del especialista durante la exploración",
      fields: [
        {
          id: "gen_specialty_exam",
          label: "Exploración Física Focalizada",
          type: "textarea",
          placeholder: "Detalle de maniobras exploratorias, inspección directa, palpación y hallazgos propios de la especialidad...",
          gridSpan: 2,
        },
        {
          id: "gen_clinical_summary",
          label: "Juicio Clínico / Razonamiento Diagnóstico",
          type: "textarea",
          placeholder: "Síntesis del cuadro clínico, justificación de la sospecha diagnóstica y prioridades terapéuticas...",
          gridSpan: 2,
        },
      ],
    },
  ],
};

/**
 * Detecta inteligentemente la configuración correspondiente al nombre de la especialidad,
 * normalizando tildes, mayúsculas, minúsculas y términos médicos comunes.
 */
export function getSpecialtyConfig(specialtyName?: string | null): SpecialtyConfig {
  if (!specialtyName) return GENERAL_MEDICINE_CONFIG;

  const normalized = specialtyName
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();

  if (normalized.includes("ginec") || normalized.includes("obstetr")) {
    return GYNECOLOGY_CONFIG;
  }
  if (normalized.includes("pediatr") || normalized.includes("puericult")) {
    return PEDIATRICS_CONFIG;
  }
  if (normalized.includes("cardio")) {
    return CARDIOLOGY_CONFIG;
  }
  if (normalized.includes("dermat")) {
    return DERMATOLOGY_CONFIG;
  }
  if (normalized.includes("trauma") || normalized.includes("ortoped")) {
    return TRAUMATOLOGY_CONFIG;
  }
  if (normalized.includes("oftalmo") || normalized.includes("oculist")) {
    return OPHTHALMOLOGY_CONFIG;
  }

  // Si no coincide con ninguna hiper-específica, retorna el esquema clínico general adaptado
  return {
    ...GENERAL_MEDICINE_CONFIG,
    name: specialtyName,
    tabTitle: `Evaluación (${specialtyName})`,
  };
}

export interface SpecialtyItem {
  id: string;
  name: string;
  category?: string;
  badgeBg: string;
}

export const AVAILABLE_SPECIALTIES: SpecialtyItem[] = [
  { id: "traumatology", name: "Traumatología y Ortopedia", badgeBg: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800" },
  { id: "gynecology", name: "Ginecología y Obstetricia", badgeBg: "bg-pink-50 text-pink-700 border-pink-200 dark:bg-pink-950/40 dark:text-pink-300 dark:border-pink-800" },
  { id: "pediatrics", name: "Pediatría", badgeBg: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800" },
  { id: "cardiology", name: "Cardiología", badgeBg: "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800" },
  { id: "dermatology", name: "Dermatología", badgeBg: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800" },
  { id: "ophthalmology", name: "Oftalmología", badgeBg: "bg-cyan-50 text-cyan-700 border-cyan-200 dark:bg-cyan-950/40 dark:text-cyan-300 dark:border-cyan-800" },
  { id: "general", name: "Medicina General", badgeBg: "bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-900/40 dark:text-slate-300 dark:border-slate-800" },
  { id: "neurology", name: "Neurología", badgeBg: "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800" },
  { id: "gastroenterology", name: "Gastroenterología", badgeBg: "bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950/40 dark:text-orange-300 dark:border-orange-800" },
  { id: "urology", name: "Urología", badgeBg: "bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-800" },
  { id: "endocrinology", name: "Endocrinología", badgeBg: "bg-teal-50 text-teal-700 border-teal-200 dark:bg-teal-950/40 dark:text-teal-300 dark:border-teal-800" },
  { id: "otolaryngology", name: "Otorrinolaringología", badgeBg: "bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/40 dark:text-sky-300 dark:border-sky-800" },
  { id: "pulmonology", name: "Neumología", badgeBg: "bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-950/40 dark:text-violet-300 dark:border-violet-800" },
  { id: "psychiatry", name: "Psiquiatría", badgeBg: "bg-lime-50 text-lime-700 border-lime-200 dark:bg-lime-950/40 dark:text-lime-300 dark:border-lime-800" },
];

export function getSpecialtyBadgeStyle(specialtyName?: string | null): { className: string } {
  if (!specialtyName) {
    return { className: "bg-slate-50 text-slate-700 border border-slate-200 dark:bg-slate-900/40 dark:text-slate-300 dark:border-slate-800" };
  }
  const normalized = specialtyName
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();

  if (normalized.includes("trauma") || normalized.includes("ortoped")) {
    return { className: "bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950/50 dark:text-blue-300 dark:border-blue-800" };
  }
  if (normalized.includes("ginec") || normalized.includes("obstetr")) {
    return { className: "bg-pink-50 text-pink-700 border border-pink-200 dark:bg-pink-950/50 dark:text-pink-300 dark:border-pink-800" };
  }
  if (normalized.includes("pediatr") || normalized.includes("puericult")) {
    return { className: "bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800" };
  }
  if (normalized.includes("cardio")) {
    return { className: "bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/50 dark:text-rose-300 dark:border-rose-800" };
  }
  if (normalized.includes("dermat")) {
    return { className: "bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800" };
  }
  if (normalized.includes("oftalmo") || normalized.includes("oculist")) {
    return { className: "bg-cyan-50 text-cyan-700 border border-cyan-200 dark:bg-cyan-950/50 dark:text-cyan-300 dark:border-cyan-800" };
  }
  if (normalized.includes("neuro")) {
    return { className: "bg-purple-50 text-purple-700 border border-purple-200 dark:bg-purple-950/50 dark:text-purple-300 dark:border-purple-800" };
  }
  if (normalized.includes("gastro")) {
    return { className: "bg-orange-50 text-orange-700 border border-orange-200 dark:bg-orange-950/50 dark:text-orange-300 dark:border-orange-800" };
  }
  if (normalized.includes("uro")) {
    return { className: "bg-indigo-50 text-indigo-700 border border-indigo-200 dark:bg-indigo-950/50 dark:text-indigo-300 dark:border-indigo-800" };
  }
  return { className: "bg-slate-50 text-slate-700 border border-slate-200 dark:bg-slate-900/40 dark:text-slate-300 dark:border-slate-800" };
}

