import { useState, useEffect, useMemo } from "react";
import { useForm, FormProvider } from "react-hook-form";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useConsultationByAppointment, useCreateConsultation, useUpdateConsultation } from "@/lib/api/consultations";
import { usePatient } from "@/lib/api/patients";
import { useDoctors } from "@/lib/api/profiles";
import { supabase } from "@/integrations/supabase/client";
import { generateRecipePDF } from "@/lib/utils/recipePdf";
import { toast } from "sonner";
import { useRouter } from "@tanstack/react-router";
import { Loader2, Printer } from "lucide-react";

import { ConsultationFormValues, COMMON_CONSUMABLES } from "./consultations/form/types";
import { ConsultationAnamnesis } from "./consultations/form/ConsultationAnamnesis";
import { ConsultationVitals } from "./consultations/form/ConsultationVitals";
import { ConsultationSpecial } from "./consultations/form/ConsultationSpecial";
import { ConsultationPlan } from "./consultations/form/ConsultationPlan";
import { ConsultationConsumables } from "./consultations/form/ConsultationConsumables";

export function ConsultationForm({
  open,
  onOpenChange,
  appointment,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  appointment?: { id: string; patient_id: string; patient_name?: string; doctor_id?: string } | null;
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

  const methods = useForm<ConsultationFormValues>({
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

  const { handleSubmit, reset, watch, getValues } = methods;

  // Consumables States
  const [commonQuantities, setCommonQuantities] = useState<Record<string, string>>({});
  const [customConsumables, setCustomConsumables] = useState<{ item_name: string; quantity: string; unit: string }[]>([]);

  // IMC Calculation context for payload
  const weightKg = watch("weightKg") || "";
  const heightCm = watch("heightCm") || "";
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
        if (existingConsultation.consumables && Array.isArray(existingConsultation.consumables)) {
          const common: Record<string, string> = {};
          const custom: { item_name: string; quantity: string; unit: string }[] = [];

          existingConsultation.consumables.forEach((c: any) => {
            const isCommon = COMMON_CONSUMABLES.some((com) => com.name === c.item_name);
            if (isCommon) {
              common[c.item_name] = String(c.quantity);
            } else {
              custom.push({
                item_name: c.item_name,
                quantity: String(c.quantity),
                unit: c.unit || "U",
              });
            }
          });

          setCommonQuantities(common);
          setCustomConsumables(custom);
        } else {
          setCommonQuantities({});
          setCustomConsumables([]);
        }
      } else {
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
        doctor_id: appointment.doctor_id || currentUserId,
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
        localStorage.setItem("pending_payment_appointment_id", appointment.id);
        onOpenChange(false);
        router.navigate({ to: "/facturacion" });
      }

      if (shouldPrint && payload.indications) {
        const patientData = patient;
        const doctorObj = doctors.find((d) => d.id === (existingConsultation?.doctor_id || appointment.doctor_id || currentUserId));
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
          <FormProvider {...methods}>
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
                    <TabsContent value="anamnesis">
                      <ConsultationAnamnesis />
                    </TabsContent>
                    
                    <TabsContent value="vitals">
                      <ConsultationVitals />
                    </TabsContent>
                    
                    <TabsContent value="special">
                      <ConsultationSpecial />
                    </TabsContent>
                    
                    <TabsContent value="plan">
                      <ConsultationPlan />
                    </TabsContent>
                    
                    <TabsContent value="consumables">
                      <ConsultationConsumables
                        commonQuantities={commonQuantities}
                        updateCommonQty={updateCommonQty}
                        customConsumables={customConsumables}
                        addCustomConsumable={addCustomConsumable}
                        updateCustomConsumable={updateCustomConsumable}
                        removeCustomConsumable={removeCustomConsumable}
                      />
                    </TabsContent>
                  </div>
                </ScrollArea>

                <DialogFooter className="pt-4 mt-2 border-t border-border/50">
                  <div className="flex w-full items-center justify-between">
                    <Button
                      type="button"
                      variant="outline"
                      className="rounded-xl"
                      onClick={() => onOpenChange(false)}
                      disabled={busy}
                    >
                      Cancelar
                    </Button>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        className="rounded-xl flex gap-2 border-mauve text-mauve hover:bg-mauve/10"
                        onClick={handleSubmit(() => handleSave(true))}
                        disabled={busy}
                      >
                        {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Printer className="w-4 h-4" />}
                        Guardar e Imprimir
                      </Button>
                      <Button
                        type="submit"
                        className="rounded-xl flex gap-2 bg-mauve hover:bg-mauve/90 text-white"
                        disabled={busy}
                      >
                        {busy && <Loader2 className="w-4 h-4 animate-spin" />}
                        {isEdit ? "Guardar Cambios" : "Completar Consulta"}
                      </Button>
                    </div>
                  </div>
                </DialogFooter>
              </Tabs>
            </form>
          </FormProvider>
        )}
      </DialogContent>
    </Dialog>
  );
}
