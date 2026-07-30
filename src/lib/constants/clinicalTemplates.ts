export type ClinicalTemplate = {
  id: string;
  name: string;
  subjective: string;
  breasts: string;
  abdomen: string;
  gynecological: string;
  diagnosis: string;
  plan: string;
};

export const CLINICAL_TEMPLATES: ClinicalTemplate[] = [
  {
    id: "prenatal",
    name: "Control Prenatal Regular",
    subjective: "Paciente acude a control prenatal de rutina. Refiere percibir movimientos fetales activos. Niega sangrado genital, pérdida de líquido, contracciones uterinas dolorosas o síntomas vasoespásticos (cefalea, tinitus, fosfenos).",
    breasts: "Simétricas, sin nódulos palpables.",
    abdomen: "Abdomen globoso a expensas de útero grávido, feto único. Tono uterino normal.",
    gynecological: "No se evalúa tacto vaginal por control de bajo riesgo.",
    diagnosis: "Embarazo de [XX] semanas por FUR/Eco en evolución.",
    plan: "- Continuar control prenatal regular.\n- Vitaminas prenatales 1 OD.\n- Mantener hidratación adecuada.\n- Acudir a urgencias en caso de signos de alarma (sangrado, dolor intenso, pérdida de líquido)."
  },
  {
    id: "citologia",
    name: "Chequeo Ginecológico Anual / Citología",
    subjective: "Paciente acude para chequeo ginecológico anual. Sin antecedentes patológicos recientes. Refiere ciclos menstruales regulares. Niega flujo vaginal anormal, prurito o dolor pélvico.",
    breasts: "Mamas: simétricas, sin nódulos palpables ni secreciones.",
    abdomen: "Blando, depresible, no doloroso a la palpación.",
    gynecological: "Especuloscopia: cuello uterino de aspecto sano. Se toma muestra para citología cervicovaginal.\nTacto vaginal: útero en AVF, de tamaño y consistencia normal, anexos no palpables, no dolorosos.",
    diagnosis: "Paciente ginecológicamente sana. Control anual.",
    plan: "- Se toma muestra para citología.\n- Esperar resultados en [X] días.\n- Continuar método anticonceptivo actual (si aplica).\n- Autoexamen de mamas mensual."
  },
  {
    id: "infeccion-vaginal",
    name: "Consulta por Infección Vaginal",
    subjective: "Paciente acude por presentar flujo vaginal abundante, asociado a prurito vulvar y ardor. Refiere inicio hace [X] días. Niega fiebre, dolor pélvico severo o sangrado anormal.",
    breasts: "Sin alteraciones.",
    abdomen: "Blando, depresible, leve molestia en hipogastrio.",
    gynecological: "Especuloscopia: se evidencia flujo vaginal [blanquecino grumoso / amarillento], con eritema en paredes vaginales y vulva. Cuello uterino sin alteraciones aparentes.",
    diagnosis: "Vulvovaginitis (probable candidiasis / vaginosis bacteriana).",
    plan: "- Indicar tratamiento antimicótico / antibiótico según sospecha clínica.\n- Evitar duchas vaginales.\n- Uso de ropa interior de algodón.\n- Abstinencia sexual durante el tratamiento."
  }
];

export type PrescriptionTemplate = {
  id: string;
  name: string;
  indications: string;
};

export const PRESCRIPTION_TEMPLATES: PrescriptionTemplate[] = [
  {
    id: "candidiasis",
    name: "Tratamiento - Candidiasis Vaginal",
    indications: "1. Fluconazol 150 mg: Tomar 1 cápsula vía oral hoy.\n2. Clotrimazol crema vaginal (o similar): Aplicar 1 carga vaginal diaria por las noches durante 6 días.\n3. Evitar el consumo excesivo de azúcares y uso de ropa muy ajustada durante el tratamiento."
  },
  {
    id: "infeccion-urinaria",
    name: "Tratamiento - Infección Urinaria Simple",
    indications: "1. Fosfomicina trometamol 3g: Tomar 1 sobre disuelto en agua, dosis única (preferiblemente por la noche después de vaciar la vejiga).\n2. Ibuprofeno 400 mg: Tomar 1 tableta cada 8 horas en caso de dolor o ardor intenso (máximo 3 días).\n3. Abundante hidratación oral (más de 2 litros de agua al día)."
  },
  {
    id: "anticonceptivos",
    name: "Inicio de Anticonceptivos Orales",
    indications: "1. Pastillas anticonceptivas [Nombre Comercial]: Iniciar la primera píldora el primer día de la menstruación.\n2. Tomar 1 píldora diaria, siempre a la misma hora, sin interrupción.\n3. Si hay olvido de 1 píldora, tomarla apenas la recuerde. Si hay olvido de 2 o más, usar preservativo por los siguientes 7 días."
  },
  {
    id: "vitaminas-prenatales",
    name: "Suplementos - Control Prenatal",
    indications: "1. Vitaminas Prenatales (Ej. Natalvit / Pregnacare): Tomar 1 cápsula diaria con el almuerzo.\n2. Ácido Fólico 5mg: Tomar 1 tableta diaria (si no está incluido en el complejo multivitamínico).\n3. Calcio + Vitamina D: Tomar 1 tableta diaria (separada de las vitaminas por al menos 2 horas)."
  }
];
