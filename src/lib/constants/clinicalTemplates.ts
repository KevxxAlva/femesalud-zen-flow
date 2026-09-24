export type ClinicalTemplate = {
  id: string;
  name: string;
  specialtyKey?: string; // "gynecology" | "traumatology" | "pediatrics" | "cardiology" | "dermatology" | "ophthalmology" | "general"
  subjective: string;
  breasts?: string;
  abdomen?: string;
  gynecological?: string;
  diagnosis: string;
  plan: string;
};

export type PrescriptionTemplate = {
  id: string;
  name: string;
  specialtyKey?: string;
  indications: string;
};

export const CLINICAL_TEMPLATES: ClinicalTemplate[] = [
  // 1. Ginecología y Obstetricia
  {
    id: "prenatal",
    name: "Control Prenatal Regular",
    specialtyKey: "gynecology",
    subjective: "Paciente acude a control prenatal de rutina. Refiere percibir movimientos fetales activos. Niega sangrado genital, pérdida de líquido, contracciones uterinas dolorosas o síntomas vasoespásticos (cefalea, tinitus, fosfenos).",
    breasts: "Simétricas, sin nódulos palpables.",
    abdomen: "Abdomen globoso a expensas de útero grávido, feto único. Tono uterino normal.",
    gynecological: "No se evalúa tacto vaginal por control de bajo riesgo.",
    diagnosis: "Embarazo controlado en evolución fisiológica.",
    plan: "- Continuar control prenatal regular.\n- Vitaminas prenatales 1 OD.\n- Mantener hidratación adecuada.\n- Acudir a urgencias en caso de signos de alarma (sangrado, dolor intenso, pérdida de líquido)."
  },
  {
    id: "citologia",
    name: "Chequeo Ginecológico Anual / Citología",
    specialtyKey: "gynecology",
    subjective: "Paciente acude para chequeo ginecológico anual. Sin antecedentes patológicos recientes. Refiere ciclos menstruales regulares. Niega flujo vaginal anormal, prurito o dolor pélvico.",
    breasts: "Mamas: simétricas, sin nódulos palpables ni secreciones.",
    abdomen: "Blando, depresible, no doloroso a la palpación.",
    gynecological: "Especuloscopia: cuello uterino de aspecto sano. Se toma muestra para citología cervicovaginal.\nTacto vaginal: útero en AVF, de tamaño y consistencia normal, anexos no palpables, no dolorosos.",
    diagnosis: "Paciente ginecológicamente sana. Control anual.",
    plan: "- Se toma muestra para citología.\n- Esperar resultados en 10-15 días.\n- Continuar método anticonceptivo actual (si aplica).\n- Autoexamen de mamas mensual."
  },
  {
    id: "infeccion-vaginal",
    name: "Consulta por Infección Vaginal",
    specialtyKey: "gynecology",
    subjective: "Paciente acude por presentar flujo vaginal anormal, asociado a prurito vulvar y ardor. Refiere inicio hace 4 días. Niega fiebre, dolor pélvico severo o sangrado anormal.",
    breasts: "Sin alteraciones.",
    abdomen: "Blando, depresible, leve molestia en hipogastrio.",
    gynecological: "Especuloscopia: se evidencia flujo vaginal anormal con eritema en paredes vaginales y vulva. Cuello uterino sin lesiones macroscópicas.",
    diagnosis: "Vulvovaginitis infecciosa.",
    plan: "- Indicar tratamiento antimicótico / antibiótico según sospecha clínica.\n- Evitar duchas vaginales.\n- Uso de ropa interior de algodón.\n- Abstinencia sexual durante el tratamiento."
  },

  // 2. Traumatología y Ortopedia
  {
    id: "trauma-esguince-tobillo",
    name: "Esguince de Tobillo Agudo (Grado I-II)",
    specialtyKey: "traumatology",
    subjective: "Paciente consulta por dolor agudo e inflamación en tobillo tras mecanismo de inversión forzada durante actividad física / pisada en falso hace 24-48 horas. Refiere dolor EVA 7/10 y dificultad moderada para el apoyo.",
    diagnosis: "Esguince de tobillo (ligamento peroneoastragalino anterior / peroneocalcáneo).",
    plan: "- Protocolo R.I.C.E. (Reposo, Hielo local 20 min c/8h, Vendaje compresivo elástico, Elevación).\n- Evitar apoyo de carga completa por 72 horas.\n- Analgesia y antiinflamatorios vía oral por 5-7 días.\n- Reevaluación clínica y control radiológico si no cede el dolor."
  },
  {
    id: "trauma-lumbalgia",
    name: "Lumbalgia Mecánica Aguda",
    specialtyKey: "traumatology",
    subjective: "Paciente refiere dolor lumbar punzante de inicio súbito tras esfuerzo físico / levantamiento de peso. Dolor de características mecánicas, exacerbado con la flexión del tronco. Niega irradiación ciática, parestesias o alteraciones esfinterianas.",
    diagnosis: "Lumbalgia mecánica aguda / contractura paravertebral lumbar.",
    plan: "- Reposo relativo en cama en posición de fowler (máx 48 horas).\n- Terapia combinada: AINE + Relajante muscular vía oral por 5 a 7 días.\n- Calor local húmedo en zona lumbar 15 minutos 2 veces al día.\n- Higiene postural y derivación a fisioterapia si persiste más de 2 semanas."
  },
  {
    id: "trauma-manguito-rotador",
    name: "Tendinopatía de Manguito Rotador / Hombro Doloroso",
    specialtyKey: "traumatology",
    subjective: "Paciente refiere dolor en hombro de varios meses de evolución, con predominio nocturno y exacerbación al elevar el brazo por encima de 90° o movimientos de rotación externa. Dificultad para peinarse o vestirse.",
    diagnosis: "Síndrome de pinzamiento subacromial / Tendinopatía de manguito rotador.",
    plan: "- Reposo deportivo y evitar movimientos por encima de la cabeza.\n- AINE oral por 7 a 10 días.\n- Indicar Ecografía articular de hombro / Resonancia Magnética.\n- Ejercicios de fortalecimiento periescapular y fisioterapia."
  },

  // 3. Pediatría
  {
    id: "ped-nino-sano",
    name: "Control de Crecimiento y Desarrollo (Niño Sano)",
    specialtyKey: "pediatrics",
    subjective: "Madre acude con lactante/preescolar a control pediátrico regular de rutina. Refiere niño activo, reactivo, con adecuado patrón de sueño y tolerancia a la alimentación. Sin quejas activas ni fiebre reciente.",
    diagnosis: "Control de salud infantil. Crecimiento y desarrollo acordes para la edad cronológica.",
    plan: "- Continuar alimentación adecuada para la edad y estímulo del neurodesarrollo.\n- Mantener esquema de vacunación al día según PAI / Sociedad de Pediatría.\n- Pautas de prevención de accidentes en el hogar.\n- Próximo control pediátrico según calendario."
  },
  {
    id: "ped-ira",
    name: "Infección Respiratoria Alta (IRA / Rinofaringitis)",
    specialtyKey: "pediatrics",
    subjective: "Paciente pediátrico traído por sus padres por presentar rinorrea hialina, congestión nasal, tos seca y picos febriles de 38°C de 48 horas de evolución. Buena tolerancia a líquidos orales.",
    diagnosis: "Rinofaringitis aguda viral no complicada.",
    plan: "- Lavados nasales frecuentes con solución salina fisiológica al 0.9%.\n- Antipirético (Paracetamol) solo en caso de fiebre > 38°C o malestar evidente.\n- Abundante hidratación oral fraccionada.\n- Signos de alarma: dificultad respiratoria (tiraje, aleteo), rechazo total del alimento, letargo."
  },

  // 4. Cardiología
  {
    id: "cardio-hta",
    name: "Control de Hipertensión Arterial Primaria",
    specialtyKey: "cardiology",
    subjective: "Paciente hipertenso conocido acude a evaluación de control. Refiere adherencia al tratamiento farmacológico. Niega cefalea occipital, dolor torácico, palpitaciones, disnea paroxística nocturna o edemas en miembros inferiores.",
    diagnosis: "Hipertensión arterial esencial estadio I-II (según cifras tensionales).",
    plan: "- Continuar tratamiento antihipertensivo habitual.\n- Dieta DASH baja en sodio (< 2 g sal/día), actividad física aeróbica 150 min/semana.\n- Registro domiciliario de presión arterial (AMDA) por 7 días.\n- Solicitar perfil lipídico, glucemia, creatinina, electrolitos y microalbuminuria."
  },
  {
    id: "cardio-preoperatorio",
    name: "Evaluación de Riesgo Quirúrgico Cardiovascular",
    specialtyKey: "cardiology",
    subjective: "Paciente acude remitido para valoración cardiovascular prequirúrgica. Niega antecedentes de cardiopatía isquémica, insuficiencia cardíaca, arritmias o síncope. Capacidad funcional estimada > 4 METS.",
    diagnosis: "Riesgo cardiovascular quirúrgico bajo / intermedio (según escala Lee / Goldman).",
    plan: "- Electrocardiograma de 12 derivaciones evaluado: ritmo sinusal sin alteraciones isquémicas agudas.\n- Paciente en condiciones cardiovasculares aceptables para procedimiento quirúrgico propuesto.\n- Mantener medicación cardiovascular de base el día de la intervención según protocolo anestésico."
  },

  // 5. Dermatología
  {
    id: "derma-dermatitis",
    name: "Dermatitis Atópica / Eczema Agudo",
    specialtyKey: "dermatology",
    subjective: "Paciente consulta por prurito intenso y lesiones eritemato-descamativas en pliegues flexurales (fosas antecubitales y poplíteas) de varias semanas de evolución, agravadas por el calor y sudoración.",
    diagnosis: "Dermatitis atópica / Eczema flexural en brote activo.",
    plan: "- Emoliente reparador de barrera cutánea 2 a 3 veces al día sobre piel húmeda.\n- Corticoide tópico de potencia media en lesiones inflamadas por 7 noches.\n- Antihistamínico oral nocturno si el prurito altera el sueño.\n- Baños cortos con agua tibia y sustituto de jabón (syndet)."
  },

  // 6. Oftalmología
  {
    id: "oftalmo-refraccion",
    name: "Astenopía Acomodativa / Vicio de Refracción",
    specialtyKey: "ophthalmology",
    subjective: "Paciente refiere fatiga ocular, visión borrosa intermitente y cefalea frontal vespertina asociada al uso prolongado de pantallas y dispositivos móviles. Niega dolor ocular agudo o destellos de luz.",
    diagnosis: "Astenopía acomodativa / Presbicia o Ametropía a corregir.",
    plan: "- Prescripción de corrección óptica personalizada (lentes monofocales / progresivos con filtro azul).\n- Regla 20-20-20: cada 20 minutos mirar a 20 pies (6 metros) por 20 segundos.\n- Lágrimas artificiales sin preservantes 1 gota en cada ojo c/4-6h según necesidad."
  },

  // 7. Medicina General
  {
    id: "med-general-chequeo",
    name: "Chequeo Médico Preventivo / Consulta General",
    specialtyKey: "general",
    subjective: "Paciente acude a chequeo médico general preventivo. Refiere encontrarse asintomático, con buen estado general y capacidad física habitual. Niega síntomas digestivos, respiratorios o dolores osteomusculares.",
    diagnosis: "Examen de salud de rutina / Evaluación médica preventiva.",
    plan: "- Se indican exámenes paraclínicos de rutina (hematología completa, química sanguínea, orina y heces).\n- Consejería en estilos de vida saludables, alimentación balanceada y actividad física regular.\n- Reevaluación con resultados de laboratorio."
  }
];

export const PRESCRIPTION_TEMPLATES: PrescriptionTemplate[] = [
  // Ginecología
  {
    id: "candidiasis",
    name: "Tratamiento - Candidiasis Vaginal",
    specialtyKey: "gynecology",
    indications: "1. Fluconazol 150 mg: Tomar 1 cápsula vía oral dosis única.\n2. Clotrimazol crema vaginal: Aplicar 1 carga vaginal profunda por las noches durante 6 días consecutivos.\n3. Evitar el consumo de azúcares refinados y uso de ropa interior sintética durante el tratamiento."
  },
  {
    id: "infeccion-urinaria",
    name: "Tratamiento - Infección Urinaria Simple",
    specialtyKey: "gynecology",
    indications: "1. Fosfomicina trometamol 3g: Tomar 1 sobre disuelto en medio vaso de agua, dosis única nocturna tras evacuar la vejiga.\n2. Ibuprofeno 400 mg: Tomar 1 tableta cada 8 horas en caso de molestia o disuria intensa por 3 días.\n3. Abundante ingesta de agua (> 2.5 litros diarios)."
  },
  {
    id: "vitaminas-prenatales",
    name: "Suplementos - Control Prenatal",
    specialtyKey: "gynecology",
    indications: "1. Vitaminas Prenatales con Hierro y Ácido Fólico: Tomar 1 cápsula diaria con el almuerzo.\n2. Calcio 600 mg + Vitamina D: Tomar 1 tableta diaria con la cena (separada del suplemento de hierro).\n3. Hidratación adecuada y consumo regular de frutas y vegetales."
  },

  // Traumatología
  {
    id: "receta-trauma-analgesia",
    name: "Analgesia y Antiinflamatorio para Traumatismos",
    specialtyKey: "traumatology",
    indications: "1. Dexketoprofeno 25 mg: Tomar 1 comprimido cada 8 horas con las comidas por 5 días.\n2. Tiocolchicósido 4 mg (Relajante Muscular): Tomar 1 cápsula cada 12 horas por 5 días (en caso de contractura).\n3. Paracetamol 1g: Tomar 1 tableta cada 8 horas de rescate si persiste dolor leve a moderado.\n4. Crioterapia local (hielo envuelto en toalla) 15-20 minutos 3 veces al día en la zona afectada."
  },
  {
    id: "receta-trauma-lumbalgia",
    name: "Manejo Integral de Lumbalgia Aguda",
    specialtyKey: "traumatology",
    indications: "1. Meloxicam 15 mg: Tomar 1 tableta diaria después del almuerzo por 7 días.\n2. Complejo B + Pregabalina 75 mg: Tomar 1 cápsula por la noche antes de dormir por 10 días.\n3. Reposo relativo, evitar cargar objetos pesados y aplicar calor seco en zona lumbar 2 veces al día."
  },

  // Pediatría
  {
    id: "receta-ped-fiebre",
    name: "Manejo de Fiebre y Dolor Infantil",
    specialtyKey: "pediatrics",
    indications: "1. Paracetamol suspensión oral (120 mg / 5 ml o 100 mg/ml gotas):\n   - Administrar [X] ml o gotas según el peso actual (10 a 15 mg/kg por dosis) cada 6 a 8 horas SOLO si la temperatura axilar es mayor a 38°C o dolor evidente.\n2. Medidas físicas: Paños tibios en frente y cuello, ambiente fresco, ropa ligera.\n3. No administrar aspirina en menores de 18 años. Mantener buena hidratación con leche materna o suero oral."
  },
  {
    id: "receta-ped-sro",
    name: "Rehidratación Oral Infantil (Gastroenteritis)",
    specialtyKey: "pediatrics",
    indications: "1. Suero de Rehidratación Oral (SRO) de baja osmolaridad:\n   - Ofrecer 50 a 100 ml a sorbos pequeños o con cucharita después de cada deposición líquida o vómito.\n2. Probióticos infantiles (Lactobacillus reuteri / Saccharomyces boulardii): 1 sobre o 5 gotas al día por 5 días.\n3. Continuar alimentación habitual sin forzar. Signos de alarma: ojos hundidos, llanto sin lágrimas, letargia."
  },

  // Cardiología
  {
    id: "receta-cardio-hta",
    name: "Esquema Inicial Antihipertensivo",
    specialtyKey: "cardiology",
    indications: "1. Losartán Potásico 50 mg: Tomar 1 tableta por la mañana al despertar de forma continua.\n2. Dieta estricta hiposódica (sin salero en la mesa, evitar enlatados y embutidos).\n3. Llevar cuaderno de registro tensional 2 veces al día (mañana y noche) para control médico en 15 días."
  },

  // Dermatología
  {
    id: "receta-derma-eczema",
    name: "Manejo de Eczema y Piel Seca",
    specialtyKey: "dermatology",
    indications: "1. Betametasona / Mometasona crema al 0.1%: Aplicar una capa fina exclusivamente sobre las lesiones rojas 1 vez al día por las noches durante 7 días (no usar en cara).\n2. Crema emoliente reparadora con ceramidas: Aplicar abundantemente en todo el cuerpo 2 a 3 veces al día.\n3. Desloratadina 5 mg: Tomar 1 tableta por la noche si hay picor intenso por 7 días."
  },

  // Oftalmología
  {
    id: "receta-oftalmo-lubricante",
    name: "Lágrimas Artificiales e Higiene Visual",
    specialtyKey: "ophthalmology",
    indications: "1. Hialuronato de Sodio 0.15% o 0.4% colirio oftálmico sin preservantes:\n   - Instilar 1 gota en cada ojo cada 4 a 6 horas según necesidad.\n2. Paños tibios cerrados sobre los párpados 5 minutos al día.\n3. Descanso visual en jornada de computación cada 20 minutos."
  },

  // Medicina General
  {
    id: "receta-med-general-viral",
    name: "Manejo Sintomático Cuadro Viral",
    specialtyKey: "general",
    indications: "1. Paracetamol 500 mg: Tomar 1 tableta cada 8 horas si hay fiebre o dolor corporal por 3 días.\n2. Cetirizina 10 mg: Tomar 1 tableta por la noche en caso de congestión nasal o estornudos por 5 días.\n3. Abundante ingesta de líquidos, reposo relativo en casa y buena ventilación."
  }
];

/**
 * Obtiene las plantillas clínicas filtradas inteligentemente para la especialidad activa.
 */
export function getTemplatesForSpecialty(specialtyKey?: string | null): ClinicalTemplate[] {
  if (!specialtyKey) return CLINICAL_TEMPLATES;
  
  const key = specialtyKey.toLowerCase();
  
  // Buscar plantillas de la especialidad
  const filtered = CLINICAL_TEMPLATES.filter((t) => t.specialtyKey === key);
  
  // Si encontramos plantillas específicas, retornamos esas + las generales
  if (filtered.length > 0) {
    const generals = CLINICAL_TEMPLATES.filter((t) => t.specialtyKey === "general" && t.specialtyKey !== key);
    return [...filtered, ...generals];
  }
  
  // Si es una especialidad que aún no tiene específicas, retornamos todas
  return CLINICAL_TEMPLATES;
}

/**
 * Obtiene las recetas sugeridas filtradas para la especialidad activa.
 */
export function getPrescriptionsForSpecialty(specialtyKey?: string | null): PrescriptionTemplate[] {
  if (!specialtyKey) return PRESCRIPTION_TEMPLATES;
  
  const key = specialtyKey.toLowerCase();
  
  const filtered = PRESCRIPTION_TEMPLATES.filter((p) => p.specialtyKey === key);
  if (filtered.length > 0) {
    const generals = PRESCRIPTION_TEMPLATES.filter((p) => p.specialtyKey === "general" && p.specialtyKey !== key);
    return [...filtered, ...generals];
  }
  
  return PRESCRIPTION_TEMPLATES;
}
