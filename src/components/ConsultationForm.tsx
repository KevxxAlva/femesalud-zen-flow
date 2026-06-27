import { useState, useEffect, useMemo } from "react";
import { useForm, Controller } from "react-hook-form";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useConsultationByAppointment, useCreateConsultation, useUpdateConsultation, type VisitType, usePrescriptionTemplates, useCreatePrescriptionTemplate, useDeletePrescriptionTemplate } from "@/lib/api/consultations";
import { usePatient } from "@/lib/api/patients";
import { useDoctors } from "@/lib/api/profiles";
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

interface ConsultationFormValues {
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

export function ConsultationForm({
  open,
  onOpenChange,
  appointment,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  appointment?: { id: string; patient_id: string; patient_name?: string } | null;
}) {
  const { data: existingConsultation, isLoading: loadingExisting } = useConsultationByAppointment(appointment?.id);

  const create = useCreateConsultation();
  const update = useUpdateConsultation();
  const busy = create.isPending || update.isPending;

  const isEdit = !!existingConsultation;

  const { data: patient } = usePatient(appointment?.patient_id);
  const { data: doctors = [] } = useDoctors();
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data?.user) {
        setCurrentUserId(data.user.id);
      }
    });
  }, []);

  const { register, handleSubmit, control, reset, setValue, watch, getValues } = useForm<ConsultationFormValues>({
    defaultValues: {
      visitType: "CONTROL",
      isFirstVisit: false,
      subjectiveExam: "",
      contactChannel: "",
      heightCm: "",
      weightKg: "",
      bloodPressure: "",
      heartRate: "",
      respiratoryRate: "",
      temperature: "",
      skin: "",
      headNeck: "",
      breasts: "",
      abdomen: "",
      gynecological: "",
      extremities: "",
      neurological: "",
      aceticAcidTest: "",
      aceticClockPosition: "",
      aceticRelativePosition: "",
      lugolTest: "",
      lugolClockPosition: "",
      lugolRelativePosition: "",
      gestationalAge: "",
      fetalWeight: "",
      obstetricBp: "",
      uterineHeight: "",
      presentation: "",
      fetalHeartRate: "",
      fetalMovements: "",
      edema: "",
      alarmSigns: "",
      diagnosis: "",
      indications: "",
      complementaryExams: "",
      plan: "",
      nextAppointmentDate: "",
    }
  });

  const indications = watch("indications") || "";
  const weightKg = watch("weightKg") || "";
  const heightCm = watch("heightCm") || "";

  // Consumables States
  const [commonQuantities, setCommonQuantities] = useState<Record<string, string>>({});
  const [customConsumables, setCustomConsumables] = useState<{ item_name: string; quantity: string; unit: string }[]>([]);

  // Prescription Templates hooks and states
  const { data: templates = [] } = usePrescriptionTemplates();
  const createTemplate = useCreatePrescriptionTemplate();
  const deleteTemplate = useDeletePrescriptionTemplate();
  const [newTemplateTitle, setNewTemplateTitle] = useState("");
  const [isSavingTemplate, setIsSavingTemplate] = useState(false);

  const handleSaveAsTemplate = async () => {
    if (!newTemplateTitle.trim()) {
      toast.error("El nombre de la plantilla es obligatorio");
      return;
    }
    if (!indications.trim()) {
      toast.error("Las indicaciones de la receta están vacías");
      return;
    }
    try {
      await createTemplate.mutateAsync({
        title: newTemplateTitle.trim(),
        indications: indications.trim(),
      });
      toast.success("Plantilla guardada con éxito");
      setNewTemplateTitle("");
      setIsSavingTemplate(false);
    } catch (err) {
      toast.error("Error al guardar la plantilla");
    }
  };

  const handleDeleteTemplate = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    e.preventDefault();
    try {
      await deleteTemplate.mutateAsync(id);
      toast.success("Plantilla eliminada");
    } catch (err) {
      toast.error("Error al eliminar la plantilla");
    }
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

  // Load existing consultation data
  useEffect(() => {
    if (open) {
      if (existingConsultation) {
        reset({
          visitType: existingConsultation.visit_type || "CONTROL",
          isFirstVisit: existingConsultation.is_first_visit || false,
          subjectiveExam: existingConsultation.subjective_exam ?? "",
          contactChannel: existingConsultation.contact_channel ?? "",
          heightCm: existingConsultation.height_cm ? String(existingConsultation.height_cm) : "",
          weightKg: existingConsultation.weight_kg ? String(existingConsultation.weight_kg) : "",
          bloodPressure: existingConsultation.blood_pressure ?? "",
          heartRate: existingConsultation.heart_rate ? String(existingConsultation.heart_rate) : "",
          respiratoryRate: existingConsultation.respiratory_rate ? String(existingConsultation.respiratory_rate) : "",
          temperature: existingConsultation.temperature ? String(existingConsultation.temperature) : "",
          skin: existingConsultation.skin ?? "",
          headNeck: existingConsultation.head_neck ?? "",
          breasts: existingConsultation.breasts ?? "",
          abdomen: existingConsultation.abdomen ?? "",
          gynecological: existingConsultation.gynecological ?? "",
          extremities: existingConsultation.extremities ?? "",
          neurological: existingConsultation.neurological ?? "",
          aceticAcidTest: existingConsultation.acetic_acid_test ?? "",
          aceticClockPosition: existingConsultation.acetic_clock_position ?? "",
          aceticRelativePosition: existingConsultation.acetic_relative_position ?? "",
          lugolTest: existingConsultation.lugol_test ?? "",
          lugolClockPosition: existingConsultation.lugol_clock_position ?? "",
          lugolRelativePosition: existingConsultation.lugol_relative_position ?? "",
          gestationalAge: existingConsultation.gestational_age ?? "",
          fetalWeight: existingConsultation.fetal_weight ? String(existingConsultation.fetal_weight) : "",
          obstetricBp: existingConsultation.obstetric_bp ?? "",
          uterineHeight: existingConsultation.uterine_height ? String(existingConsultation.uterine_height) : "",
          presentation: existingConsultation.presentation ?? "",
          fetalHeartRate: existingConsultation.fetal_heart_rate ? String(existingConsultation.fetal_heart_rate) : "",
          fetalMovements: existingConsultation.fetal_movements ?? "",
          edema: existingConsultation.edema ?? "",
          alarmSigns: existingConsultation.alarm_signs ?? "",
          diagnosis: existingConsultation.diagnosis ?? "",
          indications: existingConsultation.indications ?? "",
          complementaryExams: existingConsultation.complementary_exams ?? "",
          plan: existingConsultation.plan ?? "",
          nextAppointmentDate: existingConsultation.next_appointment_date ?? "",
        });

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
        reset({
          visitType: "CONTROL",
          isFirstVisit: false,
          subjectiveExam: "",
          contactChannel: "",
          heightCm: "",
          weightKg: "",
          bloodPressure: "",
          heartRate: "",
          respiratoryRate: "",
          temperature: "",
          skin: "",
          headNeck: "",
          breasts: "",
          abdomen: "",
          gynecological: "",
          extremities: "",
          neurological: "",
          aceticAcidTest: "",
          aceticClockPosition: "",
          aceticRelativePosition: "",
          lugolTest: "",
          lugolClockPosition: "",
          lugolRelativePosition: "",
          gestationalAge: "",
          fetalWeight: "",
          obstetricBp: "",
          uterineHeight: "",
          presentation: "",
          fetalHeartRate: "",
          fetalMovements: "",
          edema: "",
          alarmSigns: "",
          diagnosis: "",
          indications: "",
          complementaryExams: "",
          plan: "",
          nextAppointmentDate: "",
        });
        setCommonQuantities({});
        setCustomConsumables([]);
      }
    }
  }, [open, existingConsultation, reset]);

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

  const onFormSubmit = () => {
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

      const values = getValues();

      const payload = {
        appointment_id: appointment.id,
        patient_id: appointment.patient_id,
        doctor_id: null, // assigned by backend / auth user
        visit_type: values.visitType,
        is_first_visit: values.isFirstVisit,
        subjective_exam: values.subjectiveExam || null,
        contact_channel: values.contactChannel || null,

        height_cm: values.heightCm ? parseFloat(values.heightCm) : null,
        weight_kg: values.weightKg ? parseFloat(values.weightKg) : null,
        bmi: bmi ? parseFloat(bmi) : null,
        blood_pressure: values.bloodPressure || null,
        heart_rate: values.heartRate ? parseInt(values.heartRate) : null,
        respiratory_rate: values.respiratoryRate ? parseInt(values.respiratoryRate) : null,
        temperature: values.temperature ? parseFloat(values.temperature) : null,

        skin: values.skin || null,
        head_neck: values.headNeck || null,
        breasts: values.breasts || null,
        abdomen: values.abdomen || null,
        gynecological: values.gynecological || null,
        extremities: values.extremities || null,
        neurological: values.neurological || null,

        acetic_acid_test: values.aceticAcidTest || null,
        acetic_clock_position: values.aceticClockPosition || null,
        acetic_relative_position: values.aceticRelativePosition || null,
        lugol_test: values.lugolTest || null,
        lugol_clock_position: values.lugolClockPosition || null,
        lugol_relative_position: values.lugolRelativePosition || null,

        gestational_age: values.gestationalAge || null,
        fetal_weight: values.fetalWeight ? parseFloat(values.fetalWeight) : null,
        obstetric_bp: values.obstetricBp || null,
        uterine_height: values.uterineHeight ? parseFloat(values.uterineHeight) : null,
        presentation: values.presentation || null,
        fetal_heart_rate: values.fetalHeartRate ? parseInt(values.fetalHeartRate) : null,
        fetal_movements: values.fetalMovements || null,
        edema: values.edema || null,
        alarm_signs: values.alarmSigns || null,

        diagnosis: values.diagnosis || null,
        indications: values.indications || null,
        complementary_exams: values.complementaryExams || null,
        plan: values.plan || null,
        next_appointment_date: values.nextAppointmentDate || null,

        consumables,
      };

      if (isEdit && existingConsultation) {
        await update.mutateAsync({ id: existingConsultation.id, ...payload });
        toast.success("Consulta clínica actualizada");
        onOpenChange(false);
      } else {
        await create.mutateAsync(payload);
        toast.success("Consulta clínica registrada con éxito");

        // Set pending payment in localStorage
        localStorage.setItem("pending_payment_appointment_id", appointment.id);

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
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error guardando la consulta");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl h-[90vh] flex flex-col rounded-3xl p-6">
        <DialogHeader className="pb-2">
          <DialogTitle>
            {isEdit ? "Editar Consulta Clínica" : "Registrar Nueva Consulta Clínica"}
          </DialogTitle>
          <DialogDescription className="text-xs">
            Registrar examen físico, diagnóstico y consumibles utilizados para{" "}
            <span className="font-semibold text-mauve">{appointment?.patient_name}</span>.
          </DialogDescription>
        </DialogHeader>

        {loadingExisting ? (
          <div className="flex-1 flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-mauve" />
          </div>
        ) : (
          <form onSubmit={handleSubmit(onFormSubmit)} className="flex-1 flex flex-col min-h-0">
            <Tabs defaultValue="anamnesis" className="flex-1 flex flex-col min-h-0">
              <TabsList className="grid w-full grid-cols-5 bg-muted/60 p-1 rounded-2xl mb-4">
                <TabsTrigger value="anamnesis" className="rounded-xl font-medium text-xs">Anamnesis</TabsTrigger>
                <TabsTrigger value="vitals" className="rounded-xl font-medium text-xs">Físico y Vitales</TabsTrigger>
                <TabsTrigger value="special" className="rounded-xl font-medium text-xs">Colpo & Obstetricia</TabsTrigger>
                <TabsTrigger value="plan" className="rounded-xl font-medium text-xs">Diagnóstico & Plan</TabsTrigger>
                <TabsTrigger value="consumables" className="rounded-xl font-medium text-xs">Consumibles</TabsTrigger>
              </TabsList>

              <ScrollArea className="flex-1 pr-2">
                <div className="py-1">
                  {/* TAB 1: ANAMNESIS */}
                  <TabsContent value="anamnesis" className="grid gap-4 mt-0">
                    <div className="grid grid-cols-3 gap-4">
                      <div className="grid gap-2">
                        <Label htmlFor="c-visit-type">Tipo de asistencia</Label>
                        <Controller
                          name="visitType"
                          control={control}
                          render={({ field }) => (
                            <Select value={field.value} onValueChange={field.onChange}>
                              <SelectTrigger className="rounded-xl">
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
                          )}
                        />
                      </div>

                      <div className="grid gap-2">
                        <Label htmlFor="c-channel">Canal de contacto</Label>
                        <Controller
                          name="contactChannel"
                          control={control}
                          render={({ field }) => (
                            <Select value={field.value} onValueChange={field.onChange}>
                              <SelectTrigger className="rounded-xl">
                                <SelectValue placeholder="Seleccionar canal..." />
                              </SelectTrigger>
                              <SelectContent className="rounded-2xl">
                                {CONTACT_CHANNELS.map((c) => (
                                  <SelectItem key={c} value={c}>{c}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          )}
                        />
                      </div>

                      <div className="flex items-center gap-2 mt-8">
                        <Controller
                          name="isFirstVisit"
                          control={control}
                          render={({ field }) => (
                            <Checkbox
                              id="c-first-visit"
                              checked={field.value}
                              onCheckedChange={field.onChange}
                              className="rounded-md"
                            />
                          )}
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
                        placeholder="Descripción subjetiva y antecedentes inmediatos expresados por la paciente..."
                        className="rounded-xl min-h-[140px]"
                        {...register("subjectiveExam")}
                      />
                    </div>
                  </TabsContent>

                  {/* TAB 2: VITALS & PHYSICAL EXAM */}
                  <TabsContent value="vitals" className="space-y-6 mt-0">
                    <div className="bg-muted/30 p-4 rounded-2xl space-y-4">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-mauve">Signos Vitales</h3>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="grid gap-1.5">
                          <Label htmlFor="c-height">Estatura (cm)</Label>
                          <Input
                            id="c-height"
                            type="number"
                            placeholder="Ej. 165"
                            className="rounded-xl"
                            {...register("heightCm")}
                          />
                        </div>
                        <div className="grid gap-1.5">
                          <Label htmlFor="c-weight">Peso (kg)</Label>
                          <Input
                            id="c-weight"
                            type="number"
                            step="0.1"
                            placeholder="Ej. 62.5"
                            className="rounded-xl"
                            {...register("weightKg")}
                          />
                        </div>
                        <div className="grid gap-1.5">
                          <Label>IMC (Calculado)</Label>
                          <Input
                            readOnly
                            value={bmi}
                            placeholder="Ingrese Peso y Talla"
                            className="rounded-xl bg-muted/50 font-bold"
                          />
                        </div>
                        <div className="grid gap-1.5">
                          <Label htmlFor="c-bp">Presión Arterial (TA)</Label>
                          <Input
                            id="c-bp"
                            placeholder="Ej. 120/80"
                            className="rounded-xl"
                            {...register("bloodPressure")}
                          />
                        </div>
                        <div className="grid gap-1.5">
                          <Label htmlFor="c-hr">Frecuencia Cardíaca (FC)</Label>
                          <Input
                            id="c-hr"
                            type="number"
                            placeholder="LPM"
                            className="rounded-xl"
                            {...register("heartRate")}
                          />
                        </div>
                        <div className="grid gap-1.5">
                          <Label htmlFor="c-rr">Frecuencia Respiratoria (FR)</Label>
                          <Input
                            id="c-rr"
                            type="number"
                            placeholder="RPM"
                            className="rounded-xl"
                            {...register("respiratoryRate")}
                          />
                        </div>
                        <div className="grid gap-1.5 col-span-2">
                          <Label htmlFor="c-temp">Temperatura (°C)</Label>
                          <Input
                            id="c-temp"
                            type="number"
                            step="0.1"
                            placeholder="Ej. 36.5"
                            className="rounded-xl"
                            {...register("temperature")}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="bg-muted/30 p-4 rounded-2xl space-y-4">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-mauve">Revisión por Sistemas / Examen Físico</h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-1.5">
                          <Label htmlFor="c-skin">Piel y faneras</Label>
                          <Input id="c-skin" placeholder="Normal, hidratada..." className="rounded-xl text-xs h-9" {...register("skin")} />
                        </div>
                        <div className="grid gap-1.5">
                          <Label htmlFor="c-headneck">Cabeza y cuello</Label>
                          <Input id="c-headneck" placeholder="Móvil, sin adenopatías..." className="rounded-xl text-xs h-9" {...register("headNeck")} />
                        </div>
                        <div className="grid gap-1.5">
                          <Label htmlFor="c-breasts">Mamas</Label>
                          <Input id="c-breasts" placeholder="Simétricas, sin nódulos palpables..." className="rounded-xl text-xs h-9" {...register("breasts")} />
                        </div>
                        <div className="grid gap-1.5">
                          <Label htmlFor="c-abdomen">Abdomen</Label>
                          <Input id="c-abdomen" placeholder="Blando, depresible, no doloroso..." className="rounded-xl text-xs h-9" {...register("abdomen")} />
                        </div>
                        <div className="grid gap-1.5 col-span-2">
                          <Label htmlFor="c-gyneco">Ginecológico</Label>
                          <Input id="c-gyneco" placeholder="Genitales externos normales, vagina elástica, cuello sano..." className="rounded-xl text-xs h-9" {...register("gynecological")} />
                        </div>
                        <div className="grid gap-1.5">
                          <Label htmlFor="c-extremities">Extremidades</Label>
                          <Input id="c-extremities" placeholder="Simétricas, sin edemas..." className="rounded-xl text-xs h-9" {...register("extremities")} />
                        </div>
                        <div className="grid gap-1.5">
                          <Label htmlFor="c-neuro">Neurológico</Label>
                          <Input id="c-neuro" placeholder="Lúcida, orientada..." className="rounded-xl text-xs h-9" {...register("neurological")} />
                        </div>
                      </div>
                    </div>
                  </TabsContent>

                  {/* TAB 3: COLPOSCOPY & OBSTETRICS */}
                  <TabsContent value="special" className="space-y-6 mt-0">
                    <div className="bg-muted/30 p-4 rounded-2xl space-y-4">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-mauve">Hallazgos Colposcópicos</h3>
                      <div className="grid grid-cols-3 gap-4">
                        <div className="grid gap-1.5 col-span-3">
                          <Label htmlFor="c-acetic">Test de Ácido Acético</Label>
                          <Input
                            id="c-acetic"
                            placeholder="Ej. Acetoblanco positivo..."
                            className="rounded-xl"
                            {...register("aceticAcidTest")}
                          />
                        </div>
                        <div className="grid gap-1.5">
                          <Label htmlFor="c-acetic-clock">Posición Horaria Ácido</Label>
                          <Input
                            id="c-acetic-clock"
                            placeholder="Ej. 12:00, 3:00"
                            className="rounded-xl text-xs"
                            {...register("aceticClockPosition")}
                          />
                        </div>
                        <div className="grid gap-1.5 col-span-2">
                          <Label htmlFor="c-acetic-relative">Posición Relativa Ácido</Label>
                          <Input
                            id="c-acetic-relative"
                            placeholder="Ej. Zona de transformación..."
                            className="rounded-xl text-xs"
                            {...register("aceticRelativePosition")}
                          />
                        </div>

                        <div className="grid gap-1.5 col-span-3 border-t border-border/40 pt-3 mt-1">
                          <Label htmlFor="c-lugol">Test de Lugol (Schiller)</Label>
                          <Input
                            id="c-lugol"
                            placeholder="Ej. Yodonegativo (Schiller positivo)..."
                            className="rounded-xl"
                            {...register("lugolTest")}
                          />
                        </div>
                        <div className="grid gap-1.5">
                          <Label htmlFor="c-lugol-clock">Posición Horaria Lugol</Label>
                          <Input
                            id="c-lugol-clock"
                            placeholder="Ej. 6:00, 9:00"
                            className="rounded-xl text-xs"
                            {...register("lugolClockPosition")}
                          />
                        </div>
                        <div className="grid gap-1.5 col-span-2">
                          <Label htmlFor="c-lugol-relative">Posición Relativa Lugol</Label>
                          <Input
                            id="c-lugol-relative"
                            placeholder="Ej. Labio anterior..."
                            className="rounded-xl text-xs"
                            {...register("lugolRelativePosition")}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="bg-muted/30 p-4 rounded-2xl space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-xs font-bold uppercase tracking-wider text-mauve">Control de Embarazo (Obstetricia)</h3>
                        <span className="text-[10px] text-muted-foreground bg-blush/20 text-blush-foreground px-2 py-0.5 rounded-full font-bold">Rellenar solo si aplica</span>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        <div className="grid gap-1.5">
                          <Label htmlFor="c-eg">Edad Gestacional (EG)</Label>
                          <Input
                            id="c-eg"
                            placeholder="Ej. 24.3 semanas"
                            className="rounded-xl text-xs"
                            {...register("gestationalAge")}
                          />
                        </div>
                        <div className="grid gap-1.5">
                          <Label htmlFor="c-fweight">Peso Fetal Estimado (g)</Label>
                          <Input
                            id="c-fweight"
                            type="number"
                            placeholder="Gramos"
                            className="rounded-xl text-xs"
                            {...register("fetalWeight")}
                          />
                        </div>
                        <div className="grid gap-1.5">
                          <Label htmlFor="c-obp">PA Obstétrica</Label>
                          <Input
                            id="c-obp"
                            placeholder="Ej. 110/70"
                            className="rounded-xl text-xs"
                            {...register("obstetricBp")}
                          />
                        </div>
                        <div className="grid gap-1.5">
                          <Label htmlFor="c-au">Altura Uterina (AU - cm)</Label>
                          <Input
                            id="c-au"
                            type="number"
                            placeholder="cm"
                            className="rounded-xl text-xs"
                            {...register("uterineHeight")}
                          />
                        </div>
                        <div className="grid gap-1.5">
                          <Label htmlFor="c-presentation">Presentación Fetal</Label>
                          <Input
                            id="c-presentation"
                            placeholder="Cefálica, Podálica, Transversa..."
                            className="rounded-xl text-xs"
                            {...register("presentation")}
                          />
                        </div>
                        <div className="grid gap-1.5">
                          <Label htmlFor="c-fhr">FC Fetal (FCF)</Label>
                          <Input
                            id="c-fhr"
                            type="number"
                            placeholder="LPM"
                            className="rounded-xl text-xs"
                            {...register("fetalHeartRate")}
                          />
                        </div>
                        <div className="grid gap-1.5">
                          <Label htmlFor="c-fmov">Movimientos Fetales</Label>
                          <Input
                            id="c-fmov"
                            placeholder="Activos, presentes, atenuados..."
                            className="rounded-xl text-xs"
                            {...register("fetalMovements")}
                          />
                        </div>
                        <div className="grid gap-1.5">
                          <Label htmlFor="c-edema">Edema</Label>
                          <Input
                            id="c-edema"
                            placeholder="Ausente, grado I, grado II..."
                            className="rounded-xl text-xs"
                            {...register("edema")}
                          />
                        </div>
                        <div className="grid gap-1.5">
                          <Label htmlFor="c-alarm">Signos de Alarma</Label>
                          <Input
                            id="c-alarm"
                            placeholder="Niega cefalea, zumbidos, sangrado..."
                            className="rounded-xl text-xs"
                            {...register("alarmSigns")}
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
                        placeholder="Diagnóstico clínico presuntivo o definitivo..."
                        required
                        className="rounded-xl min-h-[90px]"
                        {...register("diagnosis", { required: true })}
                      />
                    </div>

                    <div className="grid gap-2">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <Label htmlFor="c-indications">Indicaciones / Receta</Label>
                        <div className="flex items-center gap-2">
                          {/* Template Selector */}
                          {templates.length > 0 && (
                            <Select
                              value=""
                              onValueChange={(val) => {
                                const selected = templates.find((t) => t.id === val);
                                if (selected) {
                                  const currentVal = watch("indications") || "";
                                  setValue("indications", currentVal ? currentVal + "\n" + selected.indications : selected.indications);
                                  toast.success("Plantilla aplicada");
                                }
                              }}
                            >
                              <SelectTrigger className="h-7 rounded-xl text-xs w-[180px] bg-muted/50 border-none flex items-center justify-between">
                                <SelectValue placeholder="Usar plantilla rápida..." />
                              </SelectTrigger>
                              <SelectContent>
                                {templates.map((t) => (
                                  <SelectItem key={t.id} value={t.id} className="text-xs flex items-center justify-between">
                                    <span className="truncate max-w-[130px]">{t.title}</span>
                                    <button
                                      onClick={(e) => handleDeleteTemplate(e, t.id)}
                                      className="ml-2 h-4 w-4 rounded text-muted-foreground hover:bg-destructive/10 hover:text-destructive inline-flex items-center justify-center cursor-pointer"
                                    >
                                      <Trash2 className="h-2.5 w-2.5" />
                                    </button>
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          )}

                          {/* Save Template Button */}
                          {indications.trim() && !isSavingTemplate && (
                            <Button
                              type="button"
                              variant="ghost"
                              onClick={() => setIsSavingTemplate(true)}
                              className="h-7 text-[10px] font-bold rounded-xl text-mauve hover:bg-mauve/10 cursor-pointer"
                            >
                              + Guardar como plantilla
                            </Button>
                          )}
                        </div>
                      </div>

                      {/* Inline Input to Save Template */}
                      {isSavingTemplate && (
                        <div className="flex items-center gap-2 bg-muted/40 p-2 rounded-xl animate-fade-in">
                          <Input
                            placeholder="Nombre de la plantilla (ej. Suplementación prenatal)..."
                            value={newTemplateTitle}
                            onChange={(e) => setNewTemplateTitle(e.target.value)}
                            className="h-8 text-xs rounded-lg flex-1"
                          />
                          <Button
                            type="button"
                            size="sm"
                            onClick={handleSaveAsTemplate}
                            disabled={createTemplate.isPending}
                            className="h-8 text-xs bg-mauve text-primary-foreground rounded-lg cursor-pointer"
                          >
                            {createTemplate.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : "Guardar"}
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setIsSavingTemplate(false);
                              setNewTemplateTitle("");
                            }}
                            className="h-8 text-xs rounded-lg cursor-pointer"
                          >
                            Cancelar
                          </Button>
                        </div>
                      )}

                      <Textarea
                        id="c-indications"
                        placeholder="Tratamientos médicos recetados, dosis, administración..."
                        className="rounded-xl min-h-[90px]"
                        {...register("indications")}
                      />
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor="c-exams">Exámenes Complementarios Solicitados</Label>
                      <Textarea
                        id="c-exams"
                        placeholder="Ecografías, perfil de laboratorios, citología..."
                        className="rounded-xl min-h-[90px]"
                        {...register("complementaryExams")}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <Label htmlFor="c-plan">Plan y Seguimiento</Label>
                        <Textarea
                          id="c-plan"
                          placeholder="Recomendaciones generales, pautas de alarma..."
                          className="rounded-xl min-h-[90px]"
                          {...register("plan")}
                        />
                      </div>
                      <div className="grid gap-2 justify-between">
                        <div className="grid gap-2 w-full">
                          <Label htmlFor="c-next-date">Fecha sugerida próxima cita</Label>
                          <Input
                            id="c-next-date"
                            type="date"
                            className="rounded-xl"
                            {...register("nextAppointmentDate")}
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
                        <h3 className="text-xs font-bold uppercase tracking-wider text-mauve">Consumibles Clínicos de Uso Común</h3>
                        <p className="text-[11px] text-muted-foreground mt-0.5">Ingresa las cantidades de los materiales clínicos utilizados en esta sesión.</p>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {COMMON_CONSUMABLES.map((item) => (
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
                              className="w-20 text-center rounded-xl font-semibold text-xs"
                            />
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="bg-muted/30 p-4 rounded-2xl space-y-4">
                      <div className="flex items-center justify-between border-b border-border/40 pb-2">
                        <div>
                          <h3 className="text-xs font-bold uppercase tracking-wider text-mauve">Materiales Clínicos Adicionales</h3>
                          <p className="text-[11px] text-muted-foreground mt-0.5">Agrega consumibles personalizados o medicamentos especiales utilizados.</p>
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={addCustomConsumable}
                          className="rounded-xl flex items-center gap-1 cursor-pointer"
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
                                    className="rounded-xl text-xs h-9"
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
                                    className="rounded-xl text-xs h-9 text-center"
                                  />
                                </div>
                                <div className="grid gap-1">
                                  <Label className="text-[10px] text-muted-foreground">Unidad</Label>
                                  <Input
                                    value={c.unit}
                                    onChange={(e) => updateCustomConsumable(idx, "unit", e.target.value)}
                                    placeholder="Ej. U, cc, par, metros"
                                    className="rounded-xl text-xs h-9"
                                  />
                                </div>
                              </div>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => removeCustomConsumable(idx)}
                                className="text-destructive hover:bg-destructive/10 rounded-xl mt-5 h-9 w-9 shrink-0 cursor-pointer"
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
                  className="rounded-xl"
                >
                  Cancelar
                </Button>
                <div className="flex items-center gap-2">
                  {indications.trim() && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleSubmit(() => handleSave(true))}
                      disabled={busy}
                      className="rounded-xl border-mauve text-mauve hover:bg-mauve/10 flex items-center gap-1.5 cursor-pointer h-9 text-xs"
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
                    className="rounded-xl bg-gradient-to-r from-mauve to-mauve-soft text-primary-foreground shadow-sm shadow-mauve/25 hover:opacity-95 px-6 h-9 text-xs font-semibold"
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
