import { useState, useEffect, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useUpdateAppointment } from "@/lib/api/appointments";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useConsultationByAppointment, useCreateConsultation, useUpdateConsultation, type VisitType } from "@/lib/api/consultations";
import { usePatient } from "@/lib/api/patients";
import { useDoctors } from "@/lib/api/profiles";
import { useServices } from "@/lib/api/services";
import { useStocks } from "@/lib/api/inventory";
import { supabase } from "@/integrations/supabase/client";
import { generateRecipePDF } from "@/lib/utils/recipePdf";
import { sendRecipeViaWhatsApp } from "@/lib/utils/whatsapp";
import { useClinicInfo } from "@/lib/api/clinic";
import { toast } from "sonner";
import { Loader2, Plus, Trash2, ShieldAlert, Printer, Wand2, MessageSquare, Sparkles } from "lucide-react";
import { CLINICAL_TEMPLATES, PRESCRIPTION_TEMPLATES, getTemplatesForSpecialty, getPrescriptionsForSpecialty } from "@/lib/constants/clinicalTemplates";
import { getSpecialtyConfig, AVAILABLE_SPECIALTIES, getSpecialtyBadgeStyle } from "@/lib/constants/specialtyForms";
import { DynamicSpecialtyFields } from "@/components/consultation/DynamicSpecialtyFields";

const CONTACT_CHANNELS = ["WhatsApp", "Instagram", "Facebook", "Radio", "Recomendado", "Prensa", "Volante", "Otro"];


export function ConsultationForm({
  open,
  onOpenChange,
  appointment,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  appointment?: { id: string; patient_id: string; doctor_id?: string; patient_name?: string } | null;
}) {
  const { data: existingConsultation, isLoading: loadingExisting } = useConsultationByAppointment(appointment?.id);

  const create = useCreateConsultation();
  const update = useUpdateConsultation();
  const updateApp = useUpdateAppointment();
  const busy = create.isPending || update.isPending || updateApp.isPending;

  const isEdit = !!existingConsultation;

  const { data: patient } = usePatient(appointment?.patient_id);
  const { data: doctors = [] } = useDoctors();
  const { data: services = [] } = useServices();
  const { data: stocks = [] } = useStocks();
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [currentUserEmail, setCurrentUserEmail] = useState<string | null>(null);
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>("");

  const dynamicConsumables = useMemo(() => {
    return stocks
      .filter(s => ["Consumables", "Medical Supplies", "Consumibles", "Suministros Médicos"].includes(s.category))
      .map(s => ({ name: s.name, defaultUnit: "U" }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [stocks]);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data?.user) {
        setCurrentUserId(data.user.id);
        setCurrentUserEmail(data.user.email || null);
      }
    });
  }, []);

  // General States
  const [visitType, setVisitType] = useState<VisitType>("CONTROL");
  const [isFirstVisit, setIsFirstVisit] = useState(false);
  const [subjectiveExam, setSubjectiveExam] = useState("");
  const [contactChannel, setContactChannel] = useState("");

  // Vitals States
  const [heightCm, setHeightCm] = useState("");
  const [weightKg, setWeightKg] = useState("");
  const [bloodPressure, setBloodPressure] = useState("");
  const [heartRate, setHeartRate] = useState("");
  const [respiratoryRate, setRespiratoryRate] = useState("");
  const [temperature, setTemperature] = useState("");

  // Physical Exam States
  const [skin, setSkin] = useState("");
  const [headNeck, setHeadNeck] = useState("");
  const [breasts, setBreasts] = useState("");
  const [abdomen, setAbdomen] = useState("");
  const [gynecological, setGynecological] = useState("");
  const [extremities, setExtremities] = useState("");
  const [neurological, setNeurological] = useState("");

  // Colposcopy States
  const [aceticAcidTest, setAceticAcidTest] = useState("");
  const [aceticClockPosition, setAceticClockPosition] = useState("");
  const [aceticRelativePosition, setAceticRelativePosition] = useState("");
  const [lugolTest, setLugolTest] = useState("");
  const [lugolClockPosition, setLugolClockPosition] = useState("");
  const [lugolRelativePosition, setLugolRelativePosition] = useState("");

  // Obstetrics States
  const [gestationalAge, setGestationalAge] = useState("");
  const [fetalWeight, setFetalWeight] = useState("");
  const [obstetricBp, setObstetricBp] = useState("");
  const [uterineHeight, setUterineHeight] = useState("");
  const [presentation, setPresentation] = useState("");
  const [fetalHeartRate, setFetalHeartRate] = useState("");
  const [fetalMovements, setFetalMovements] = useState("");
  const [edema, setEdema] = useState("");
  const [alarmSigns, setAlarmSigns] = useState("");

  // Treatment States
  const [diagnosis, setDiagnosis] = useState("");
  const [indications, setIndications] = useState("");
  const [complementaryExams, setComplementaryExams] = useState("");
  const [plan, setPlan] = useState("");
  const [nextAppointmentDate, setNextAppointmentDate] = useState("");

  // Consumables States
  const [commonQuantities, setCommonQuantities] = useState<Record<string, string>>({});
  const [customConsumables, setCustomConsumables] = useState<{ item_name: string; quantity: string; unit: string }[]>([]);

  // Specialty Dynamic States & Config
  const [specialtyAnswers, setSpecialtyAnswers] = useState<Record<string, any>>({});
  const [selectedSpecialty, setSelectedSpecialty] = useState<string>("Ginecología y Obstetricia");

  const currentDoctor = useMemo(() => {
    if (selectedDoctorId) {
      const match = doctors.find((d) => d.id === selectedDoctorId);
      if (match) return match;
    }
    const targetId = existingConsultation?.doctor_id || appointment?.doctor_id;
    if (targetId) {
      const match = doctors.find((d) => d.id === targetId || d.auth_id === targetId);
      if (match) return match;
    }
    if (currentUserId) {
      const match = doctors.find((d) => d.auth_id === currentUserId || (currentUserEmail && d.email?.toLowerCase() === currentUserEmail.toLowerCase()));
      if (match) return match;
    }
    return doctors[0] || null;
  }, [doctors, selectedDoctorId, existingConsultation?.doctor_id, appointment?.doctor_id, currentUserId, currentUserEmail]);

  const specialtyConfig = useMemo(() => {
    const spec = selectedSpecialty || existingConsultation?.specialty_name || currentDoctor?.specialty || "Ginecología y Obstetricia";
    return getSpecialtyConfig(spec);
  }, [selectedSpecialty, existingConsultation?.specialty_name, currentDoctor?.specialty]);

  const currentSpecialtyTemplates = useMemo(() => {
    return getTemplatesForSpecialty(specialtyConfig.key);
  }, [specialtyConfig.key]);

  const currentSpecialtyPrescriptions = useMemo(() => {
    return getPrescriptionsForSpecialty(specialtyConfig.key);
  }, [specialtyConfig.key]);

  const handleDoctorChange = (doctorId: string) => {
    setSelectedDoctorId(doctorId);
    const doc = doctors.find((d) => d.id === doctorId);
    if (doc?.specialty) {
      setSelectedSpecialty(doc.specialty);
      toast.info(`Especialidad adaptada a: ${doc.specialty}`);
    }
  };

  const handleSpecialtyAnswerChange = (fieldId: string, value: any) => {
    setSpecialtyAnswers((prev) => ({ ...prev, [fieldId]: value }));

    // Keep legacy gynecology/obstetrics states in sync if applicable
    if (fieldId === "acetic_acid_test") setAceticAcidTest(value);
    if (fieldId === "acetic_clock_position") setAceticClockPosition(value);
    if (fieldId === "acetic_relative_position") setAceticRelativePosition(value);
    if (fieldId === "lugol_test") setLugolTest(value);
    if (fieldId === "lugol_clock_position") setLugolClockPosition(value);
    if (fieldId === "lugol_relative_position") setLugolRelativePosition(value);
    if (fieldId === "gestational_age") setGestationalAge(value);
    if (fieldId === "fetal_weight") setFetalWeight(String(value));
    if (fieldId === "obstetric_bp") setObstetricBp(value);
    if (fieldId === "uterine_height") setUterineHeight(String(value));
    if (fieldId === "presentation") setPresentation(value);
    if (fieldId === "fetal_heart_rate") setFetalHeartRate(String(value));
    if (fieldId === "fetal_movements") setFetalMovements(value);
    if (fieldId === "edema") setEdema(value);
    if (fieldId === "alarm_signs") setAlarmSigns(value);
  };

  // IMC Calculation
  const bmi = useMemo(() => {
    const w = parseFloat(weightKg);
    const h = parseFloat(heightCm) / 100;
    if (w > 0 && h > 0) {
      return (w / (h * h)).toFixed(1);
    }
    return "";
  }, [weightKg, heightCm]);

  const applyClinicalTemplate = (templateId: string) => {
    if (!templateId) return;
    const t = CLINICAL_TEMPLATES.find(x => x.id === templateId);
    if (t) {
      if (t.subjective) setSubjectiveExam(t.subjective);
      if (t.breasts) setBreasts(t.breasts);
      if (t.abdomen) setAbdomen(t.abdomen);
      if (t.gynecological) setGynecological(t.gynecological);
      if (t.diagnosis) setDiagnosis(t.diagnosis);
      if (t.plan) setPlan(t.plan);
      toast.success(`Plantilla "${t.name}" aplicada con éxito`);
    }
  };

  const applyPrescriptionTemplate = (templateId: string) => {
    if (!templateId) return;
    const t = PRESCRIPTION_TEMPLATES.find(x => x.id === templateId);
    if (t) {
      setIndications(t.indications);
      toast.success(`Receta "${t.name}" aplicada con éxito`);
    }
  };

  // Load existing consultation data
  useEffect(() => {
    if (open) {
      if (existingConsultation) {
        setVisitType(existingConsultation.visit_type || "CONTROL");
        setIsFirstVisit(existingConsultation.is_first_visit || false);
        setSubjectiveExam(existingConsultation.subjective_exam ?? "");
        setContactChannel(existingConsultation.contact_channel ?? "");

        setHeightCm(existingConsultation.height_cm ? String(existingConsultation.height_cm) : "");
        setWeightKg(existingConsultation.weight_kg ? String(existingConsultation.weight_kg) : "");
        setBloodPressure(existingConsultation.blood_pressure ?? "");
        setHeartRate(existingConsultation.heart_rate ? String(existingConsultation.heart_rate) : "");
        setRespiratoryRate(existingConsultation.respiratory_rate ? String(existingConsultation.respiratory_rate) : "");
        setTemperature(existingConsultation.temperature ? String(existingConsultation.temperature) : "");

        setSkin(existingConsultation.skin ?? "");
        setHeadNeck(existingConsultation.head_neck ?? "");
        setBreasts(existingConsultation.breasts ?? "");
        setAbdomen(existingConsultation.abdomen ?? "");
        setGynecological(existingConsultation.gynecological ?? "");
        setExtremities(existingConsultation.extremities ?? "");
        setNeurological(existingConsultation.neurological ?? "");

        setAceticAcidTest(existingConsultation.acetic_acid_test ?? "");
        setAceticClockPosition(existingConsultation.acetic_clock_position ?? "");
        setAceticRelativePosition(existingConsultation.acetic_relative_position ?? "");
        setLugolTest(existingConsultation.lugol_test ?? "");
        setLugolClockPosition(existingConsultation.lugol_clock_position ?? "");
        setLugolRelativePosition(existingConsultation.lugol_relative_position ?? "");

        setGestationalAge(existingConsultation.gestational_age ?? "");
        setFetalWeight(existingConsultation.fetal_weight ? String(existingConsultation.fetal_weight) : "");
        setObstetricBp(existingConsultation.obstetric_bp ?? "");
        setUterineHeight(existingConsultation.uterine_height ? String(existingConsultation.uterine_height) : "");
        setPresentation(existingConsultation.presentation ?? "");
        setFetalHeartRate(existingConsultation.fetal_heart_rate ? String(existingConsultation.fetal_heart_rate) : "");
        setFetalMovements(existingConsultation.fetal_movements ?? "");
        setEdema(existingConsultation.edema ?? "");
        setAlarmSigns(existingConsultation.alarm_signs ?? "");

        const initialAnswers: Record<string, any> = {
          ...(existingConsultation.specialty_data || {}),
        };
        if (existingConsultation.acetic_acid_test) initialAnswers.acetic_acid_test = existingConsultation.acetic_acid_test;
        if (existingConsultation.acetic_clock_position) initialAnswers.acetic_clock_position = existingConsultation.acetic_clock_position;
        if (existingConsultation.acetic_relative_position) initialAnswers.acetic_relative_position = existingConsultation.acetic_relative_position;
        if (existingConsultation.lugol_test) initialAnswers.lugol_test = existingConsultation.lugol_test;
        if (existingConsultation.lugol_clock_position) initialAnswers.lugol_clock_position = existingConsultation.lugol_clock_position;
        if (existingConsultation.lugol_relative_position) initialAnswers.lugol_relative_position = existingConsultation.lugol_relative_position;
        if (existingConsultation.gestational_age) initialAnswers.gestational_age = existingConsultation.gestational_age;
        if (existingConsultation.fetal_weight) initialAnswers.fetal_weight = existingConsultation.fetal_weight;
        if (existingConsultation.obstetric_bp) initialAnswers.obstetric_bp = existingConsultation.obstetric_bp;
        if (existingConsultation.uterine_height) initialAnswers.uterine_height = existingConsultation.uterine_height;
        if (existingConsultation.presentation) initialAnswers.presentation = existingConsultation.presentation;
        if (existingConsultation.fetal_heart_rate) initialAnswers.fetal_heart_rate = existingConsultation.fetal_heart_rate;
        if (existingConsultation.fetal_movements) initialAnswers.fetal_movements = existingConsultation.fetal_movements;
        if (existingConsultation.edema) initialAnswers.edema = existingConsultation.edema;
        if (existingConsultation.alarm_signs) initialAnswers.alarm_signs = existingConsultation.alarm_signs;
        setSpecialtyAnswers(initialAnswers);
        setSelectedSpecialty(existingConsultation.specialty_name || currentDoctor?.specialty || "Ginecología y Obstetricia");

        setDiagnosis(existingConsultation.diagnosis ?? "");
        setIndications(existingConsultation.indications ?? "");
        setComplementaryExams(existingConsultation.complementary_exams ?? "");
        setPlan(existingConsultation.plan ?? "");
        setNextAppointmentDate(existingConsultation.next_appointment_date ?? "");
        setSelectedDoctorId(existingConsultation.doctor_id || "");
        setSelectedSpecialty(existingConsultation.specialty_name || currentDoctor?.specialty || "Ginecología y Obstetricia");

        // Map consumables
        const commonMap: Record<string, string> = {};
        const customs: { item_name: string; quantity: string; unit: string }[] = [];

        (existingConsultation.consumables ?? []).forEach((c) => {
          const isCommon = dynamicConsumables.some((item) => item.name === c.item_name);
          if (isCommon) {
            commonMap[c.item_name] = String(c.quantity);
          } else {
            customs.push({
              item_name: c.item_name,
              quantity: String(c.quantity),
              unit: c.unit ?? "U",
            });
          }
        });

        setCommonQuantities(commonMap);
        setCustomConsumables(customs);
      } else {
        // Clear all states for a new record
        setVisitType("CONTROL");
        setIsFirstVisit(false);
        setSubjectiveExam("");
        setContactChannel("");
        setHeightCm("");
        setWeightKg("");
        setBloodPressure("");
        setHeartRate("");
        setRespiratoryRate("");
        setTemperature("");
        setSkin("");
        setHeadNeck("");
        setBreasts("");
        setAbdomen("");
        setGynecological("");
        setExtremities("");
        setNeurological("");
        setAceticAcidTest("");
        setAceticClockPosition("");
        setAceticRelativePosition("");
        setLugolTest("");
        setLugolClockPosition("");
        setLugolRelativePosition("");
        setGestationalAge("");
        setFetalWeight("");
        setObstetricBp("");
        setUterineHeight("");
        setPresentation("");
        setFetalHeartRate("");
        setFetalMovements("");
        setEdema("");
        setAlarmSigns("");
        setDiagnosis("");
        setIndications("");
        setComplementaryExams("");
        setPlan("");
        setNextAppointmentDate("");
        setSpecialtyAnswers({});

        // Auto-assign doctor & their specialty
        const targetDocId = appointment?.doctor_id;
        const initialDoc = doctors.find((d) => (targetDocId && (d.id === targetDocId || d.auth_id === targetDocId)) || (currentUserId && (d.auth_id === currentUserId || (currentUserEmail && d.email?.toLowerCase() === currentUserEmail.toLowerCase())))) || doctors[0] || null;
        if (initialDoc) {
          setSelectedDoctorId(initialDoc.id);
          setSelectedSpecialty(initialDoc.specialty || "Medicina General");
        } else {
          setSelectedSpecialty("Medicina General");
        }

        setCommonQuantities({});
        setCustomConsumables([]);
      }
    }
  }, [open, existingConsultation, appointment, doctors, currentUserId, currentUserEmail]);

  const addCustomConsumable = () => {
    setCustomConsumables([...customConsumables, { item_name: "", quantity: "1", unit: "U" }]);
  };

  const removeCustomConsumable = (idx: number) => {
    setCustomConsumables(customConsumables.filter((_, i) => i !== idx));
  };

  const updateCustomConsumable = (idx: number, key: "item_name" | "quantity" | "unit", val: string) => {
    const next = [...customConsumables];
    next[idx] = { ...next[idx], [key]: val };
    setCustomConsumables(next);
  };

  const updateCommonQty = (name: string, val: string) => {
    setCommonQuantities({ ...commonQuantities, [name]: val });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSave(false);
  };
  const { data: clinic } = useClinicInfo();

  const handleSave = async (actionType: "save" | "print" | "whatsapp" = "save") => {
    if (!appointment) return;

    try {
      // Collect consumables
      const consumables: { item_name: string; quantity: number; unit: string | null }[] = [];

      // Add common consumables with positive values
      Object.entries(commonQuantities).forEach(([name, qtyStr]) => {
        const qty = parseFloat(qtyStr);
        if (!isNaN(qty) && qty > 0) {
          const item = dynamicConsumables.find((c) => c.name === name);
          consumables.push({
            item_name: name,
            quantity: qty,
            unit: item?.defaultUnit ?? "U",
          });
        }
      });

      // Add custom consumables
      customConsumables.forEach((c) => {
        const qty = parseFloat(c.quantity);
        if (c.item_name.trim() && !isNaN(qty) && qty > 0) {
          consumables.push({
            item_name: c.item_name.trim(),
            quantity: qty,
            unit: c.unit || "U",
          });
        }
      });

      const payload = {
        appointment_id: appointment.id,
        patient_id: appointment.patient_id,
        doctor_id: selectedDoctorId || currentDoctor?.id || appointment.doctor_id || null,
        visit_type: visitType,
        is_first_visit: isFirstVisit,
        subjective_exam: subjectiveExam || null,
        contact_channel: contactChannel || null,

        height_cm: heightCm ? parseFloat(heightCm) : null,
        weight_kg: weightKg ? parseFloat(weightKg) : null,
        bmi: bmi ? parseFloat(bmi) : null,
        blood_pressure: bloodPressure || null,
        heart_rate: heartRate ? parseInt(heartRate) : null,
        respiratory_rate: respiratoryRate ? parseInt(respiratoryRate) : null,
        temperature: temperature ? parseFloat(temperature) : null,

        skin: skin || null,
        head_neck: headNeck || null,
        breasts: breasts || null,
        abdomen: abdomen || null,
        gynecological: gynecological || null,
        extremities: extremities || null,
        neurological: neurological || null,

        acetic_acid_test: aceticAcidTest || null,
        acetic_clock_position: aceticClockPosition || null,
        acetic_relative_position: aceticRelativePosition || null,
        lugol_test: lugolTest || null,
        lugol_clock_position: lugolClockPosition || null,
        lugol_relative_position: lugolRelativePosition || null,

        gestational_age: gestationalAge || null,
        fetal_weight: fetalWeight ? parseFloat(fetalWeight) : null,
        obstetric_bp: obstetricBp || null,
        uterine_height: uterineHeight ? parseFloat(uterineHeight) : null,
        presentation: presentation || null,
        fetal_heart_rate: fetalHeartRate ? parseInt(fetalHeartRate) : null,
        fetal_movements: fetalMovements || null,
        edema: edema || null,
        alarm_signs: alarmSigns || null,

        diagnosis: diagnosis || null,
        indications: indications || null,
        complementary_exams: complementaryExams || null,
        plan: plan || null,
        next_appointment_date: nextAppointmentDate || null,

        specialty_name: selectedSpecialty || currentDoctor?.specialty || specialtyConfig.name,
        specialty_data: specialtyAnswers,

        consumables,
      };

      if (isEdit && existingConsultation?.id) {
        await updateConsultation.mutateAsync({
          id: existingConsultation.id,
          ...payload,
        });
        toast.success("Consulta actualizada con éxito");
      } else {
        await createConsultation.mutateAsync(payload);
        await updateAppointment.mutateAsync({ id: appointment.id, status: "completada" });
        toast.success("Consulta registrada con éxito");
      }

      const activeDoctor = currentDoctor || doctors.find((d) => d.id === (selectedDoctorId || existingConsultation?.doctor_id || currentUserId));

      if (actionType === "print" && payload.indications) {
        const patientData = patient;
        const doctorName = activeDoctor?.full_name || "Médico Tratante";
        const doctorSpecialty = activeDoctor?.specialty || selectedSpecialty || undefined;
        
        await generateRecipePDF(
          {
            full_name: patientData?.full_name || appointment.patient_name || "Paciente",
            document_id: patientData?.document_id || null,
            birth_date: patientData?.birth_date || null,
          },
          {
            created_at: new Date().toISOString(),
            indications: payload.indications,
          },
          doctorName,
          doctorSpecialty,
          activeDoctor?.university,
          activeDoctor?.mpps,
          activeDoctor?.cmc
        );
      } else if (actionType === "whatsapp" && payload.indications) {
        const doctorName = activeDoctor?.full_name || "Médico Tratante";

        sendRecipeViaWhatsApp({
          patientName: patient?.full_name || appointment.patient_name || "Paciente",
          patientPhone: patient?.phone || appointment.patient_phone,
          consultationDate: new Date().toISOString(),
          indications: payload.indications,
          doctorName,
          clinicName: clinic?.name || "FemeSalud"
        });
      }

      onOpenChange(false);
    } catch (err: any) {
      console.error("Consultation save error:", err);
      toast.error(err?.message || JSON.stringify(err) || "Error guardando la consulta");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl h-[90vh] flex flex-col rounded-[2rem] p-6 text-foreground">
        <DialogHeader className="pb-2">
          <DialogTitle className="text-xl font-bold text-foreground">
            {isEdit ? "Editar Consulta Clínica" : "Registrar Nueva Consulta Clínica"}
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground font-medium">
            Registrar examen físico, diagnóstico y consumibles utilizados para{" "}
            <span className="font-semibold text-primary">{appointment?.patient_name}</span>.
          </DialogDescription>
        </DialogHeader>

        {loadingExisting ? (
          <div className="flex-1 flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex-1 overflow-hidden p-6 flex flex-col min-h-0 bg-background/50 relative">
            {/* Top Bar: Doctor & Specialty Selector */}
            <div className="flex flex-wrap items-center justify-between gap-3 p-3 mb-3 rounded-2xl bg-muted/40 border border-border/50">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-muted-foreground">Médico:</span>
                <Select value={selectedDoctorId || currentDoctor?.id || ""} onValueChange={handleDoctorChange}>
                  <SelectTrigger className="h-8 text-xs rounded-xl bg-background border-border/50 font-bold min-w-[200px]">
                    <SelectValue placeholder="Seleccione médico..." />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl max-h-[300px]">
                    {doctors.map((d) => (
                      <SelectItem key={d.id} value={d.id} className="text-xs font-semibold">
                        {d.full_name} {d.specialty ? `— ${d.specialty}` : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-muted-foreground">Especialidad:</span>
                <Select value={selectedSpecialty} onValueChange={(val) => setSelectedSpecialty(val)}>
                  <SelectTrigger className="h-8 text-xs rounded-xl bg-background border-primary/40 font-bold text-primary min-w-[220px]">
                    <SelectValue placeholder="Seleccione especialidad..." />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl max-h-[300px]">
                    {AVAILABLE_SPECIALTIES.map((spec) => (
                      <SelectItem key={spec.id} value={spec.name} className="text-xs font-semibold">
                        {spec.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <span className={cn("text-[10px] font-extrabold px-2.5 py-1 rounded-lg border uppercase tracking-wider hidden sm:inline-block", getSpecialtyBadgeStyle(selectedSpecialty).className)}>
                  {selectedSpecialty}
                </span>
              </div>
            </div>

            <Tabs defaultValue="anamnesis" className="flex-1 flex flex-col min-h-0">
              <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-4">
                <TabsList className="grid w-full max-w-2xl grid-cols-5 bg-muted/50 p-1 rounded-2xl">
                  <TabsTrigger value="anamnesis" className="rounded-2xl font-medium text-xs">Anamnesis</TabsTrigger>
                  <TabsTrigger value="vitals" className="rounded-2xl font-medium text-xs">Físico y Vitales</TabsTrigger>
                  <TabsTrigger value="special" className="rounded-2xl font-medium text-xs truncate px-2" title={specialtyConfig.tabTitle}>
                    {specialtyConfig.tabTitle}
                  </TabsTrigger>
                  <TabsTrigger value="plan" className="rounded-2xl font-medium text-xs">Diagnóstico & Plan</TabsTrigger>
                  <TabsTrigger value="consumables" className="rounded-2xl font-medium text-xs">Consumibles</TabsTrigger>
                </TabsList>
                <div className="flex items-center gap-2">
                  <Wand2 className="h-4 w-4 text-primary" />
                  <Select onValueChange={applyClinicalTemplate}>
                    <SelectTrigger className="w-[220px] h-8 text-xs rounded-xl bg-white/70 dark:bg-muted font-medium">
                      <SelectValue placeholder="Plantillas rápidas..." />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl max-h-[300px]">
                      {currentSpecialtyTemplates.map(t => (
                        <SelectItem key={t.id} value={t.id} className="text-xs">{t.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <ScrollArea className="flex-1 -mx-6 px-6">
                <div className="py-1">
                  {/* TAB 1: ANAMNESIS */}
                  <TabsContent value="anamnesis" className="grid gap-4 mt-0">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="grid gap-2">
                        <Label htmlFor="c-visit-type">Tipo de asistencia</Label>
                        <Select value={visitType} onValueChange={(v: VisitType) => setVisitType(v)}>
                          <SelectTrigger className="rounded-2xl">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="rounded-2xl">
                            <SelectItem value="CONTROL">Control</SelectItem>
                            <SelectItem value="EMERGENCIA">Emergencia</SelectItem>
                            <SelectItem value="CONSULTA_NUEVA">Consulta Nueva</SelectItem>
                            <SelectItem value="POST_TRATAMIENTO">Post-Tratamiento</SelectItem>
                            <SelectItem value="OTRO">Otro</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="grid gap-2">
                        <Label htmlFor="c-channel">Canal de contacto</Label>
                        <Select value={contactChannel} onValueChange={setContactChannel}>
                          <SelectTrigger className="rounded-2xl">
                            <SelectValue placeholder="Seleccionar canal..." />
                          </SelectTrigger>
                          <SelectContent className="rounded-2xl">
                            {CONTACT_CHANNELS.map((c) => (
                              <SelectItem key={c} value={c}>{c}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="flex items-center gap-2 mt-8">
                        <Checkbox
                          id="c-first-visit"
                          checked={isFirstVisit}
                          onCheckedChange={(c) => setIsFirstVisit(!!c)}
                          className="rounded-md"
                        />
                        <Label htmlFor="c-first-visit" className="cursor-pointer">
                          ¿Es primera visita de la paciente?
                        </Label>
                      </div>
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor="c-subjective">Examen Subjetivo / Motivo del control</Label>
                      <Textarea
                        id="c-subjective"
                        value={subjectiveExam}
                        onChange={(e) => setSubjectiveExam(e.target.value)}
                        placeholder="Descripción subjetiva y antecedentes inmediatos expresados por la paciente..."
                        className="rounded-2xl min-h-[140px]"
                      />
                    </div>
                  </TabsContent>

                  {/* TAB 2: VITALS & PHYSICAL EXAM */}
                  <TabsContent value="vitals" className="space-y-6 mt-0">
                    <div className="bg-muted/30 p-4 rounded-2xl space-y-4">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-primary">Signos Vitales</h3>
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="grid gap-1.5">
                          <Label htmlFor="c-height">Estatura (cm)</Label>
                          <Input
                            id="c-height"
                            type="number"
                            placeholder="Ej. 165"
                            value={heightCm}
                            onChange={(e) => setHeightCm(e.target.value)}
                            className="rounded-2xl"
                          />
                        </div>
                        <div className="grid gap-1.5">
                          <Label htmlFor="c-weight">Peso (kg)</Label>
                          <Input
                            id="c-weight"
                            type="number"
                            step="0.1"
                            placeholder="Ej. 62.5"
                            value={weightKg}
                            onChange={(e) => setWeightKg(e.target.value)}
                            className="rounded-2xl"
                          />
                        </div>
                        <div className="grid gap-1.5">
                          <Label>IMC (Calculado)</Label>
                          <Input
                            readOnly
                            value={bmi}
                            placeholder="Ingrese Peso y Talla"
                            className="rounded-2xl bg-muted/50 font-bold"
                          />
                        </div>
                        <div className="grid gap-1.5">
                          <Label htmlFor="c-bp">Presión Arterial (TA)</Label>
                          <Input
                            id="c-bp"
                            placeholder="Ej. 120/80"
                            value={bloodPressure}
                            onChange={(e) => setBloodPressure(e.target.value)}
                            className="rounded-2xl"
                          />
                        </div>
                        <div className="grid gap-1.5">
                          <Label htmlFor="c-hr">Frecuencia Cardíaca (FC)</Label>
                          <Input
                            id="c-hr"
                            type="number"
                            placeholder="LPM"
                            value={heartRate}
                            onChange={(e) => setHeartRate(e.target.value)}
                            className="rounded-2xl"
                          />
                        </div>
                        <div className="grid gap-1.5">
                          <Label htmlFor="c-rr">Frecuencia Respiratoria (FR)</Label>
                          <Input
                            id="c-rr"
                            type="number"
                            placeholder="RPM"
                            value={respiratoryRate}
                            onChange={(e) => setRespiratoryRate(e.target.value)}
                            className="rounded-2xl"
                          />
                        </div>
                        <div className="grid gap-1.5 col-span-2">
                          <Label htmlFor="c-temp">Temperatura (°C)</Label>
                          <Input
                            id="c-temp"
                            type="number"
                            step="0.1"
                            placeholder="Ej. 36.5"
                            value={temperature}
                            onChange={(e) => setTemperature(e.target.value)}
                            className="rounded-2xl"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="bg-muted/30 p-4 rounded-2xl space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-xs font-bold uppercase tracking-wider text-primary">
                          Revisión por Sistemas / Examen Físico
                        </h3>
                        <span className="text-[11px] text-muted-foreground font-semibold">
                          {specialtyConfig.key === "gynecology" ? "Enfoque Gineco-Obstétrico" : `Adaptado a ${specialtyConfig.name}`}
                        </span>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="grid gap-1.5">
                          <Label htmlFor="c-skin">Piel y faneras</Label>
                          <Input id="c-skin" value={skin} onChange={(e) => setSkin(e.target.value)} placeholder="Normal, hidratada, turgor conservado..." className="rounded-2xl text-xs h-9" />
                        </div>
                        <div className="grid gap-1.5">
                          <Label htmlFor="c-headneck">Cabeza y cuello</Label>
                          <Input id="c-headneck" value={headNeck} onChange={(e) => setHeadNeck(e.target.value)} placeholder="Normocéfalo, sin adenopatías..." className="rounded-2xl text-xs h-9" />
                        </div>
                        {specialtyConfig.key === "gynecology" && (
                          <div className="grid gap-1.5">
                            <Label htmlFor="c-breasts">Mamas</Label>
                            <Input id="c-breasts" value={breasts} onChange={(e) => setBreasts(e.target.value)} placeholder="Simétricas, sin nódulos palpables..." className="rounded-2xl text-xs h-9" />
                          </div>
                        )}
                        <div className="grid gap-1.5">
                          <Label htmlFor="c-abdomen">Abdomen</Label>
                          <Input id="c-abdomen" value={abdomen} onChange={(e) => setAbdomen(e.target.value)} placeholder="Blando, depresible, no doloroso..." className="rounded-2xl text-xs h-9" />
                        </div>
                        {specialtyConfig.key === "gynecology" && (
                          <div className="grid gap-1.5 col-span-2">
                            <Label htmlFor="c-gyneco">Ginecológico</Label>
                            <Input id="c-gyneco" value={gynecological} onChange={(e) => setGynecological(e.target.value)} placeholder="Genitales externos normales, vagina elástica, cuello sano..." className="rounded-2xl text-xs h-9" />
                          </div>
                        )}
                        <div className="grid gap-1.5">
                          <Label htmlFor="c-extremities">Extremidades y Aparato Locomotor</Label>
                          <Input id="c-extremities" value={extremities} onChange={(e) => setExtremities(e.target.value)} placeholder="Simétricas, arcos conservados, sin edemas..." className="rounded-2xl text-xs h-9" />
                        </div>
                        <div className="grid gap-1.5">
                          <Label htmlFor="c-neuro">Neurológico</Label>
                          <Input id="c-neuro" value={neurological} onChange={(e) => setNeurological(e.target.value)} placeholder="Lúcida, orientada en 3 esferas..." className="rounded-2xl text-xs h-9" />
                        </div>
                      </div>
                    </div>
                  </TabsContent>

                  {/* TAB 3: DYNAMIC SPECIALTY QUESTIONS */}
                  <TabsContent value="special" className="space-y-6 mt-0">
                    <DynamicSpecialtyFields
                      config={specialtyConfig}
                      values={specialtyAnswers}
                      onChange={handleSpecialtyAnswerChange}
                    />
                  </TabsContent>

                  {/* TAB 4: DIAGNOSIS & PLAN */}
                  <TabsContent value="plan" className="grid gap-4 mt-0">
                    <div className="grid gap-2">
                      <Label htmlFor="c-diagnosis">Diagnóstico</Label>
                      <Textarea
                        id="c-diagnosis"
                        value={diagnosis}
                        onChange={(e) => setDiagnosis(e.target.value)}
                        placeholder="Diagnóstico clínico presuntivo o definitivo..."
                        required
                        className="rounded-2xl min-h-[90px]"
                      />
                    </div>

                    <div className="grid gap-2">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="c-indications">Indicaciones / Receta</Label>
                        <Select onValueChange={applyPrescriptionTemplate}>
                          <SelectTrigger className="w-[200px] h-7 text-xs rounded-xl bg-muted/50 border-0 font-medium">
                            <SelectValue placeholder="Recetas rápidas..." />
                          </SelectTrigger>
                          <SelectContent className="rounded-xl max-h-[300px]">
                            {currentSpecialtyPrescriptions.map(t => (
                              <SelectItem key={t.id} value={t.id} className="text-xs">{t.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <Textarea
                        id="c-indications"
                        value={indications}
                        onChange={(e) => setIndications(e.target.value)}
                        placeholder="Tratamientos médicos recetados, dosis, administración..."
                        className="rounded-2xl min-h-[90px]"
                      />
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor="c-exams">Exámenes Complementarios Solicitados</Label>
                      <Textarea
                        id="c-exams"
                        value={complementaryExams}
                        onChange={(e) => setComplementaryExams(e.target.value)}
                        placeholder="Ecografías, perfil de laboratorios, citología..."
                        className="rounded-2xl min-h-[90px]"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <Label htmlFor="c-plan">Plan y Seguimiento</Label>
                        <Textarea
                          id="c-plan"
                          value={plan}
                          onChange={(e) => setPlan(e.target.value)}
                          placeholder="Recomendaciones generales, pautas de alarma..."
                          className="rounded-2xl min-h-[90px]"
                        />
                      </div>
                      <div className="grid gap-2 justify-between">
                        <div className="grid gap-2 w-full">
                          <Label htmlFor="c-next-date">Fecha sugerida próxima cita</Label>
                          <Input
                            id="c-next-date"
                            type="date"
                            value={nextAppointmentDate}
                            onChange={(e) => setNextAppointmentDate(e.target.value)}
                            className="rounded-2xl"
                          />
                        </div>
                        <div className="flex items-center gap-1.5 p-3 rounded-2xl bg-amber-50 text-amber-800 border border-amber-200/50 text-[11px]">
                          <ShieldAlert className="h-4 w-4 shrink-0" />
                          <span>Al guardar, la cita se marcará automáticamente como completada.</span>
                        </div>
                      </div>
                    </div>
                  </TabsContent>

                  {/* TAB 5: CONSUMABLES */}
                  <TabsContent value="consumables" className="space-y-6 mt-0">
                    <div className="bg-muted/30 p-4 rounded-2xl">
                      <div className="mb-4">
                        <h3 className="text-xs font-bold uppercase tracking-wider text-primary">Consumibles Clínicos de Uso Común</h3>
                        <p className="text-[11px] text-muted-foreground mt-0.5">Ingresa las cantidades de los materiales clínicos utilizados en esta sesión.</p>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {dynamicConsumables.map((item) => (
                          <div key={item.name} className="flex items-center justify-between bg-card p-3 rounded-2xl border border-border/40 shadow-sm">
                            <div className="min-w-0 pr-2">
                              <p className="text-xs font-bold truncate">{item.name}</p>
                              <p className="text-[10px] text-muted-foreground">Unidad: {item.defaultUnit}</p>
                            </div>
                            <Input
                              type="number"
                              min="0"
                              step="0.1"
                              value={commonQuantities[item.name] ?? ""}
                              onChange={(e) => updateCommonQty(item.name, e.target.value)}
                              placeholder="0"
                              className="w-20 text-center rounded-2xl font-semibold text-xs"
                            />
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="bg-muted/30 p-4 rounded-2xl space-y-4">
                      <div className="flex items-center justify-between border-b border-border/40 pb-2">
                        <div>
                          <h3 className="text-xs font-bold uppercase tracking-wider text-primary">Materiales Clínicos Adicionales</h3>
                          <p className="text-[11px] text-muted-foreground mt-0.5">Agrega consumibles personalizados o medicamentos especiales utilizados.</p>
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={addCustomConsumable}
                          className="rounded-2xl flex items-center gap-1 cursor-pointer"
                        >
                          <Plus className="h-3.5 w-3.5" /> Agregar
                        </Button>
                      </div>

                      {customConsumables.length === 0 ? (
                        <p className="text-xs text-muted-foreground text-center py-6">No se han registrado consumibles adicionales.</p>
                      ) : (
                        <div className="space-y-3">
                          {customConsumables.map((c, idx) => (
                            <div key={idx} className="flex items-center gap-3 bg-card p-3 rounded-2xl border border-border/40 shadow-sm">
                              <div className="flex-1 grid grid-cols-3 gap-3">
                                <div className="grid gap-1">
                                  <Label className="text-[10px] text-muted-foreground">Nombre del material</Label>
                                  <Input
                                    value={c.item_name}
                                    onChange={(e) => updateCustomConsumable(idx, "item_name", e.target.value)}
                                    placeholder="Ej. Esparadrapo"
                                    className="rounded-2xl text-xs h-9"
                                  />
                                </div>
                                <div className="grid gap-1">
                                  <Label className="text-[10px] text-muted-foreground">Cantidad</Label>
                                  <Input
                                    type="number"
                                    min="0.01"
                                    step="0.01"
                                    value={c.quantity}
                                    onChange={(e) => updateCustomConsumable(idx, "quantity", e.target.value)}
                                    placeholder="1"
                                    className="rounded-2xl text-xs h-9 text-center"
                                  />
                                </div>
                                <div className="grid gap-1">
                                  <Label className="text-[10px] text-muted-foreground">Unidad</Label>
                                  <Input
                                    value={c.unit}
                                    onChange={(e) => updateCustomConsumable(idx, "unit", e.target.value)}
                                    placeholder="Ej. U, cc, par, metros"
                                    className="rounded-2xl text-xs h-9"
                                  />
                                </div>
                              </div>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => removeCustomConsumable(idx)}
                                className="text-destructive hover:bg-destructive/10 rounded-2xl mt-5 h-9 w-9 shrink-0 cursor-pointer"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </TabsContent>
                </div>
              </ScrollArea>

              <DialogFooter className="mt-4 border-t border-border/60 pt-4 flex items-center justify-between">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => onOpenChange(false)}
                  disabled={busy}
                  className="rounded-2xl"
                >
                  Cancelar
                </Button>
                <div className="flex items-center gap-2">
                  {indications.trim() && (
                    <>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => handleSave("print")}
                        disabled={busy}
                        className="rounded-2xl border-mauve text-primary hover:bg-primary/10 flex items-center gap-1.5 cursor-pointer h-9 text-xs"
                      >
                        {busy ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Printer className="h-3.5 w-3.5" />
                        )}
                        Imprimir PDF
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => handleSave("whatsapp")}
                        disabled={busy}
                        className="rounded-2xl border-emerald-500/40 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10 flex items-center gap-1.5 cursor-pointer h-9 text-xs font-bold"
                      >
                        {busy ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <MessageSquare className="h-3.5 w-3.5 text-emerald-500" />
                        )}
                        Enviar por WhatsApp
                      </Button>
                    </>
                  )}
                  <Button
                    type="submit"
                    disabled={busy}
                    className="rounded-2xl bg-primary text-primary-foreground hover:bg-[#3451d6] shadow-sm shadow-primary/20 hover:opacity-95 px-6 h-9 text-xs font-semibold"
                  >
                    {busy ? (
                      <span className="flex items-center gap-1.5">
                        <Loader2 className="h-3.5 w-3.5 animate-spin" /> Guardando...
                      </span>
                    ) : isEdit ? (
                      "Guardar Cambios"
                    ) : (
                      "Registrar Consulta"
                    )}
                  </Button>
                </div>
              </DialogFooter>
            </Tabs>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}

