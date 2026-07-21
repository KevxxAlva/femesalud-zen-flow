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
import { supabase } from "@/integrations/supabase/client";
import { generateRecipePDF } from "@/lib/utils/recipePdf";
import { toast } from "sonner";
import { useRouter } from "@tanstack/react-router";
import { Loader2, Plus, Trash2, ShieldAlert, Printer } from "lucide-react";

const CONTACT_CHANNELS = ["WhatsApp", "Instagram", "Facebook", "Radio", "Recomendado", "Prensa", "Volante", "Otro"];

const COMMON_CONSUMABLES = [
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
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data?.user) {
        setCurrentUserId(data.user.id);
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

  // IMC Calculation
  const bmi = useMemo(() => {
    const w = parseFloat(weightKg);
    const h = parseFloat(heightCm) / 100;
    if (w > 0 && h > 0) {
      return (w / (h * h)).toFixed(1);
    }
    return "";
  }, [weightKg, heightCm]);

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

        setDiagnosis(existingConsultation.diagnosis ?? "");
        setIndications(existingConsultation.indications ?? "");
        setComplementaryExams(existingConsultation.complementary_exams ?? "");
        setPlan(existingConsultation.plan ?? "");
        setNextAppointmentDate(existingConsultation.next_appointment_date ?? "");

        // Map consumables
        const commonMap: Record<string, string> = {};
        const customs: { item_name: string; quantity: string; unit: string }[] = [];

        (existingConsultation.consumables ?? []).forEach((c) => {
          const isCommon = COMMON_CONSUMABLES.some((item) => item.name === c.item_name);
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
        setCommonQuantities({});
        setCustomConsumables([]);
      }
    }
  }, [open, existingConsultation]);

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

  const handleSave = async (shouldPrint: boolean) => {
    if (!appointment) return;

    try {
      // Collect consumables
      const consumables: { item_name: string; quantity: number; unit: string | null }[] = [];

      // Add common consumables with positive values
      Object.entries(commonQuantities).forEach(([name, qtyStr]) => {
        const qty = parseFloat(qtyStr);
        if (!isNaN(qty) && qty > 0) {
          const item = COMMON_CONSUMABLES.find((c) => c.name === name);
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
        doctor_id: appointment.doctor_id || null,
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

        consumables,
      };

      if (isEdit && existingConsultation) {
        await update.mutateAsync({ id: existingConsultation.id, ...payload });
        
        if (appointment?.id) {
          const service = services.find(s => s.nombre_servicio.toLowerCase() === 'consulta general');
          const servicePrice = service ? Number(service.costo_base) : 40;
          await updateApp.mutateAsync({ id: appointment.id, status: 'completada', price: servicePrice });
          localStorage.setItem("pending_payment_appointment_id", appointment.id);
          toast.success("Consulta actualizada y factura generada");
          onOpenChange(false);
          router.navigate({ to: "/facturacion" });
        } else {
          toast.success("Consulta clínica actualizada");
          onOpenChange(false);
        }
      } else {
        await create.mutateAsync(payload);
        
        if (appointment?.id) {
          const service = services.find(s => s.nombre_servicio.toLowerCase() === 'consulta general');
          const servicePrice = service ? Number(service.costo_base) : 40;
          await updateApp.mutateAsync({ id: appointment.id, status: 'completada', price: servicePrice });
          localStorage.setItem("pending_payment_appointment_id", appointment.id);
        }

        toast.success("Consulta clínica registrada y cita completada");
        onOpenChange(false);
        router.navigate({ to: "/facturacion" });
      }


      if (shouldPrint && payload.indications) {
        const patientData = patient;
        const doctorObj = doctors.find((d) => d.id === (existingConsultation?.doctor_id || currentUserId));
        const doctorName = doctorObj?.full_name || "Médico Tratante";
        const doctorSpecialty = doctorObj?.specialty || undefined;
        
        if (patientData) {
          await generateRecipePDF(
            {
              full_name: patientData.full_name,
              document_id: patientData.document_id,
              birth_date: patientData.birth_date,
            },
            {
              created_at: new Date().toISOString(),
              indications: payload.indications,
            },
            doctorName,
            doctorSpecialty,
            doctorObj?.university || undefined,
            doctorObj?.mpps || undefined,
            doctorObj?.cmc || undefined
          );
        } else {
          await generateRecipePDF(
            {
              full_name: appointment.patient_name || "Paciente",
              document_id: null,
              birth_date: null,
            },
            {
              created_at: new Date().toISOString(),
              indications: payload.indications,
            },
            doctorName,
            doctorSpecialty,
            doctorObj?.university || undefined,
            doctorObj?.mpps || undefined,
            doctorObj?.cmc || undefined
          );
        }
      }

      onOpenChange(false);
    } catch (err: any) {
      console.error("Consultation save error:", err);
      toast.error(err?.message || JSON.stringify(err) || "Error guardando la consulta");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl h-[90vh] flex flex-col rounded-[2rem] p-6 text-[#2b3674]">
        <DialogHeader className="pb-2">
          <DialogTitle className="text-xl font-bold text-[#2b3674]">
            {isEdit ? "Editar Consulta Clínica" : "Registrar Nueva Consulta Clínica"}
          </DialogTitle>
          <DialogDescription className="text-xs text-[#a3aed1] font-medium">
            Registrar examen físico, diagnóstico y consumibles utilizados para{" "}
            <span className="font-semibold text-[#4361ee]">{appointment?.patient_name}</span>.
          </DialogDescription>
        </DialogHeader>

        {loadingExisting ? (
          <div className="flex-1 flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-[#4361ee]" />
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex-1 flex flex-col min-h-0">
            <Tabs defaultValue="anamnesis" className="flex-1 flex flex-col min-h-0">
              <TabsList className="grid w-full grid-cols-5 bg-[#f4f7fe] p-1 rounded-2xl mb-4">
                <TabsTrigger value="anamnesis" className="rounded-2xl font-medium text-xs">Anamnesis</TabsTrigger>
                <TabsTrigger value="vitals" className="rounded-2xl font-medium text-xs">Físico y Vitales</TabsTrigger>
                <TabsTrigger value="special" className="rounded-2xl font-medium text-xs">Colpo & Obstetricia</TabsTrigger>
                <TabsTrigger value="plan" className="rounded-2xl font-medium text-xs">Diagnóstico & Plan</TabsTrigger>
                <TabsTrigger value="consumables" className="rounded-2xl font-medium text-xs">Consumibles</TabsTrigger>
              </TabsList>

              <ScrollArea className="flex-1 pr-2">
                <div className="py-1">
                  {/* TAB 1: ANAMNESIS */}
                  <TabsContent value="anamnesis" className="grid gap-4 mt-0">
                    <div className="grid grid-cols-3 gap-4">
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
                      <h3 className="text-xs font-bold uppercase tracking-wider text-[#4361ee]">Signos Vitales</h3>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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
                      <h3 className="text-xs font-bold uppercase tracking-wider text-[#4361ee]">Revisión por Sistemas / Examen Físico</h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-1.5">
                          <Label htmlFor="c-skin">Piel y faneras</Label>
                          <Input id="c-skin" value={skin} onChange={(e) => setSkin(e.target.value)} placeholder="Normal, hidratada..." className="rounded-2xl text-xs h-9" />
                        </div>
                        <div className="grid gap-1.5">
                          <Label htmlFor="c-headneck">Cabeza y cuello</Label>
                          <Input id="c-headneck" value={headNeck} onChange={(e) => setHeadNeck(e.target.value)} placeholder="Móvil, sin adenopatías..." className="rounded-2xl text-xs h-9" />
                        </div>
                        <div className="grid gap-1.5">
                          <Label htmlFor="c-breasts">Mamas</Label>
                          <Input id="c-breasts" value={breasts} onChange={(e) => setBreasts(e.target.value)} placeholder="Simétricas, sin nódulos palpables..." className="rounded-2xl text-xs h-9" />
                        </div>
                        <div className="grid gap-1.5">
                          <Label htmlFor="c-abdomen">Abdomen</Label>
                          <Input id="c-abdomen" value={abdomen} onChange={(e) => setAbdomen(e.target.value)} placeholder="Blando, depresible, no doloroso..." className="rounded-2xl text-xs h-9" />
                        </div>
                        <div className="grid gap-1.5 col-span-2">
                          <Label htmlFor="c-gyneco">Ginecológico</Label>
                          <Input id="c-gyneco" value={gynecological} onChange={(e) => setGynecological(e.target.value)} placeholder="Genitales externos normales, vagina elástica, cuello sano..." className="rounded-2xl text-xs h-9" />
                        </div>
                        <div className="grid gap-1.5">
                          <Label htmlFor="c-extremities">Extremidades</Label>
                          <Input id="c-extremities" value={extremities} onChange={(e) => setExtremities(e.target.value)} placeholder="Simétricas, sin edemas..." className="rounded-2xl text-xs h-9" />
                        </div>
                        <div className="grid gap-1.5">
                          <Label htmlFor="c-neuro">Neurológico</Label>
                          <Input id="c-neuro" value={neurological} onChange={(e) => setNeurological(e.target.value)} placeholder="Lúcida, orientada..." className="rounded-2xl text-xs h-9" />
                        </div>
                      </div>
                    </div>
                  </TabsContent>

                  {/* TAB 3: COLPOSCOPY & OBSTETRICS */}
                  <TabsContent value="special" className="space-y-6 mt-0">
                    <div className="bg-muted/30 p-4 rounded-2xl space-y-4">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-[#4361ee]">Hallazgos Colposcópicos</h3>
                      <div className="grid grid-cols-3 gap-4">
                        <div className="grid gap-1.5 col-span-3">
                          <Label htmlFor="c-acetic">Test de Ácido Acético</Label>
                          <Input
                            id="c-acetic"
                            placeholder="Ej. Acetoblanco positivo..."
                            value={aceticAcidTest}
                            onChange={(e) => setAceticAcidTest(e.target.value)}
                            className="rounded-2xl"
                          />
                        </div>
                        <div className="grid gap-1.5">
                          <Label htmlFor="c-acetic-clock">Posición Horaria Ácido</Label>
                          <Input
                            id="c-acetic-clock"
                            placeholder="Ej. 12:00, 3:00"
                            value={aceticClockPosition}
                            onChange={(e) => setAceticClockPosition(e.target.value)}
                            className="rounded-2xl text-xs"
                          />
                        </div>
                        <div className="grid gap-1.5 col-span-2">
                          <Label htmlFor="c-acetic-relative">Posición Relativa Ácido</Label>
                          <Input
                            id="c-acetic-relative"
                            placeholder="Ej. Zona de transformación..."
                            value={aceticRelativePosition}
                            onChange={(e) => setAceticRelativePosition(e.target.value)}
                            className="rounded-2xl text-xs"
                          />
                        </div>

                        <div className="grid gap-1.5 col-span-3 border-t border-border/40 pt-3 mt-1">
                          <Label htmlFor="c-lugol">Test de Lugol (Schiller)</Label>
                          <Input
                            id="c-lugol"
                            placeholder="Ej. Yodonegativo (Schiller positivo)..."
                            value={lugolTest}
                            onChange={(e) => setLugolTest(e.target.value)}
                            className="rounded-2xl"
                          />
                        </div>
                        <div className="grid gap-1.5">
                          <Label htmlFor="c-lugol-clock">Posición Horaria Lugol</Label>
                          <Input
                            id="c-lugol-clock"
                            placeholder="Ej. 6:00, 9:00"
                            value={lugolClockPosition}
                            onChange={(e) => setLugolClockPosition(e.target.value)}
                            className="rounded-2xl text-xs"
                          />
                        </div>
                        <div className="grid gap-1.5 col-span-2">
                          <Label htmlFor="c-lugol-relative">Posición Relativa Lugol</Label>
                          <Input
                            id="c-lugol-relative"
                            placeholder="Ej. Labio anterior..."
                            value={lugolRelativePosition}
                            onChange={(e) => setLugolRelativePosition(e.target.value)}
                            className="rounded-2xl text-xs"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="bg-muted/30 p-4 rounded-2xl space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-xs font-bold uppercase tracking-wider text-[#4361ee]">Control de Embarazo (Obstetricia)</h3>
                        <span className="text-[10px] text-[#a3aed1] bg-blush/20 text-blush-foreground px-2 py-0.5 rounded-full font-bold">Rellenar solo si aplica</span>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        <div className="grid gap-1.5">
                          <Label htmlFor="c-eg">Edad Gestacional (EG)</Label>
                          <Input
                            id="c-eg"
                            placeholder="Ej. 24.3 semanas"
                            value={gestationalAge}
                            onChange={(e) => setGestationalAge(e.target.value)}
                            className="rounded-2xl text-xs"
                          />
                        </div>
                        <div className="grid gap-1.5">
                          <Label htmlFor="c-fweight">Peso Fetal Estimado (g)</Label>
                          <Input
                            id="c-fweight"
                            type="number"
                            placeholder="Gramos"
                            value={fetalWeight}
                            onChange={(e) => setFetalWeight(e.target.value)}
                            className="rounded-2xl text-xs"
                          />
                        </div>
                        <div className="grid gap-1.5">
                          <Label htmlFor="c-obp">PA Obstétrica</Label>
                          <Input
                            id="c-obp"
                            placeholder="Ej. 110/70"
                            value={obstetricBp}
                            onChange={(e) => setObstetricBp(e.target.value)}
                            className="rounded-2xl text-xs"
                          />
                        </div>
                        <div className="grid gap-1.5">
                          <Label htmlFor="c-au">Altura Uterina (AU - cm)</Label>
                          <Input
                            id="c-au"
                            type="number"
                            placeholder="cm"
                            value={uterineHeight}
                            onChange={(e) => setUterineHeight(e.target.value)}
                            className="rounded-2xl text-xs"
                          />
                        </div>
                        <div className="grid gap-1.5">
                          <Label htmlFor="c-presentation">Presentación Fetal</Label>
                          <Input
                            id="c-presentation"
                            placeholder="Cefálica, Podálica, Transversa..."
                            value={presentation}
                            onChange={(e) => setPresentation(e.target.value)}
                            className="rounded-2xl text-xs"
                          />
                        </div>
                        <div className="grid gap-1.5">
                          <Label htmlFor="c-fhr">FC Fetal (FCF)</Label>
                          <Input
                            id="c-fhr"
                            type="number"
                            placeholder="LPM"
                            value={fetalHeartRate}
                            onChange={(e) => setFetalHeartRate(e.target.value)}
                            className="rounded-2xl text-xs"
                          />
                        </div>
                        <div className="grid gap-1.5">
                          <Label htmlFor="c-fmov">Movimientos Fetales</Label>
                          <Input
                            id="c-fmov"
                            placeholder="Activos, presentes, atenuados..."
                            value={fetalMovements}
                            onChange={(e) => setFetalMovements(e.target.value)}
                            className="rounded-2xl text-xs"
                          />
                        </div>
                        <div className="grid gap-1.5">
                          <Label htmlFor="c-edema">Edema</Label>
                          <Input
                            id="c-edema"
                            placeholder="Ausente, grado I, grado II..."
                            value={edema}
                            onChange={(e) => setEdema(e.target.value)}
                            className="rounded-2xl text-xs"
                          />
                        </div>
                        <div className="grid gap-1.5">
                          <Label htmlFor="c-alarm">Signos de Alarma</Label>
                          <Input
                            id="c-alarm"
                            placeholder="Niega cefalea, zumbidos, sangrado..."
                            value={alarmSigns}
                            onChange={(e) => setAlarmSigns(e.target.value)}
                            className="rounded-2xl text-xs"
                          />
                        </div>
                      </div>
                    </div>
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
                      <Label htmlFor="c-indications">Indicaciones / Receta</Label>
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
                        <h3 className="text-xs font-bold uppercase tracking-wider text-[#4361ee]">Consumibles Clínicos de Uso Común</h3>
                        <p className="text-[11px] text-[#a3aed1] mt-0.5">Ingresa las cantidades de los materiales clínicos utilizados en esta sesión.</p>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {COMMON_CONSUMABLES.map((item) => (
                          <div key={item.name} className="flex items-center justify-between bg-card p-3 rounded-2xl border border-border/40 shadow-sm">
                            <div className="min-w-0 pr-2">
                              <p className="text-xs font-bold truncate">{item.name}</p>
                              <p className="text-[10px] text-[#a3aed1]">Unidad: {item.defaultUnit}</p>
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
                          <h3 className="text-xs font-bold uppercase tracking-wider text-[#4361ee]">Materiales Clínicos Adicionales</h3>
                          <p className="text-[11px] text-[#a3aed1] mt-0.5">Agrega consumibles personalizados o medicamentos especiales utilizados.</p>
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
                        <p className="text-xs text-[#a3aed1] text-center py-6">No se han registrado consumibles adicionales.</p>
                      ) : (
                        <div className="space-y-3">
                          {customConsumables.map((c, idx) => (
                            <div key={idx} className="flex items-center gap-3 bg-card p-3 rounded-2xl border border-border/40 shadow-sm">
                              <div className="flex-1 grid grid-cols-3 gap-3">
                                <div className="grid gap-1">
                                  <Label className="text-[10px] text-[#a3aed1]">Nombre del material</Label>
                                  <Input
                                    value={c.item_name}
                                    onChange={(e) => updateCustomConsumable(idx, "item_name", e.target.value)}
                                    placeholder="Ej. Esparadrapo"
                                    className="rounded-2xl text-xs h-9"
                                  />
                                </div>
                                <div className="grid gap-1">
                                  <Label className="text-[10px] text-[#a3aed1]">Cantidad</Label>
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
                                  <Label className="text-[10px] text-[#a3aed1]">Unidad</Label>
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
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => handleSave(true)}
                      disabled={busy}
                      className="rounded-2xl border-mauve text-[#4361ee] hover:bg-[#4361ee]/10 flex items-center gap-1.5 cursor-pointer h-9 text-xs"
                    >
                      {busy ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Printer className="h-3.5 w-3.5" />
                      )}
                      {isEdit ? "Guardar e Imprimir Récipe" : "Registrar e Imprimir Récipe"}
                    </Button>
                  )}
                  <Button
                    type="submit"
                    disabled={busy}
                    className="rounded-2xl bg-[#4361ee] text-white hover:bg-[#3451d6] shadow-sm shadow-blue-500/20 hover:opacity-95 px-6 h-9 text-xs font-semibold"
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

