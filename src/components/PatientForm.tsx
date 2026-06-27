import { useMemo, useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useCreatePatient, useUpdatePatient, usePatient, type Patient } from "@/lib/api/patients";
import { useDoctors } from "@/lib/api/profiles";
import { useAuthSession, useIsAdmin } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

const STATUSES = ["nuevo", "activo", "en_tratamiento", "alta"];
const statusLabel = (s: string) => ({ nuevo: "Nuevo", activo: "Activo", en_tratamiento: "En tratamiento", alta: "Alta" } as Record<string, string>)[s] ?? s;

interface PatientFormValues {
  full_name: string;
  email: string;
  phone: string;
  birth_date: string;
  status: string;
  assigned_doctor_id: string;
  notes: string;
  address: string;
  idPrefix: string;
  idNumber: string;
  historia_number: string;
  first_visit_date: string;
  marital_status: string;
  birthplace: string;
  education_level: string;
  occupation: string;
  ethnicity: string;
  consultation_reason: string;
  current_illness: string;
  famMother: string;
  famFather: string;
  famSiblings: string;
  famChildren: string;
  persAlcohol: string;
  persDrugs: string;
  persTobacco: string;
  persBase: string;
  persSurgical: string;
  persAllergies: string;
  gynMenarche: string;
  gynSexarche: string;
  gynCycle: string;
  gynDismenorrea: string;
  gynNps: string;
  gynIts: string;
  gynCytology: string;
  gynContraceptives: string;
  obsG: string;
  obsP: string;
  obsC: string;
  obsA: string;
  obsPig: string;
  obsEm: string;
  obsEe: string;
  obsComplications: string;
  obsFum: string;
  obsEg: string;
  obsFpp: string;
  obsNumConsultations: string;
  obsVaccines: string;
}

export function PatientForm({
  open, onOpenChange, patient: initialPatient,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  patient?: Patient | null;
}) {
  const isEdit = !!initialPatient;
  const { data: fullPatient, isLoading: isPatientDetailLoading } = usePatient(initialPatient?.id);
  const patient = isEdit ? fullPatient : null;
  const { user } = useAuthSession();
  const isAdmin = useIsAdmin();
  const { data: doctors = [] } = useDoctors();

  const defaultDoctor = useMemo(
    () => patient?.assigned_doctor_id ?? (isAdmin ? doctors[0]?.id ?? "" : user?.id ?? ""),
    [patient, isAdmin, doctors, user],
  );

  const { register, handleSubmit, control, reset } = useForm<PatientFormValues>({
    defaultValues: {
      full_name: "",
      email: "",
      phone: "",
      birth_date: "",
      status: "nuevo",
      assigned_doctor_id: "",
      notes: "",
      address: "",
      idPrefix: "V-",
      idNumber: "",
      historia_number: "",
      first_visit_date: "",
      marital_status: "",
      birthplace: "",
      education_level: "",
      occupation: "",
      ethnicity: "",
      consultation_reason: "",
      current_illness: "",
      famMother: "",
      famFather: "",
      famSiblings: "",
      famChildren: "",
      persAlcohol: "NIEGA",
      persDrugs: "NIEGA",
      persTobacco: "NIEGA",
      persBase: "",
      persSurgical: "",
      persAllergies: "",
      gynMenarche: "",
      gynSexarche: "",
      gynCycle: "",
      gynDismenorrea: "NIEGA",
      gynNps: "",
      gynIts: "",
      gynCytology: "",
      gynContraceptives: "",
      obsG: "",
      obsP: "",
      obsC: "",
      obsA: "",
      obsPig: "",
      obsEm: "",
      obsEe: "",
      obsComplications: "",
      obsFum: "",
      obsEg: "",
      obsFpp: "",
      obsNumConsultations: "",
      obsVaccines: "",
    }
  });

  const getDocParts = (docId: string | null) => {
    const val = docId ?? "";
    if (val.startsWith("V-")) return ["V-", val.slice(2)];
    if (val.startsWith("E-")) return ["E-", val.slice(2)];
    if (val.startsWith("P-")) return ["P-", val.slice(2)];
    return ["none", val];
  };

  useEffect(() => {
    if (open && (!isEdit || patient)) {
      const [pfx, num] = getDocParts(patient?.document_id ?? null);
      reset({
        full_name: patient?.full_name ?? "",
        email: patient?.email ?? "",
        phone: patient?.phone ?? "",
        birth_date: patient?.birth_date ?? "",
        status: patient?.status ?? "nuevo",
        assigned_doctor_id: patient?.assigned_doctor_id ?? defaultDoctor,
        notes: patient?.notes ?? "",
        address: patient?.address ?? "",
        idPrefix: pfx,
        idNumber: num,
        historia_number: patient?.historia_number ?? "",
        first_visit_date: patient?.first_visit_date ?? new Date().toISOString().split("T")[0],
        marital_status: patient?.marital_status ?? "",
        birthplace: patient?.birthplace ?? "",
        education_level: patient?.education_level ?? "",
        occupation: patient?.occupation ?? "",
        ethnicity: patient?.ethnicity ?? "",
        consultation_reason: patient?.consultation_reason ?? "",
        current_illness: patient?.current_illness ?? "",
        famMother: patient?.family_history?.mother ?? "",
        famFather: patient?.family_history?.father ?? "",
        famSiblings: patient?.family_history?.siblings ?? "",
        famChildren: patient?.family_history?.children ?? "",
        persAlcohol: patient?.personal_history?.alcohol ?? "NIEGA",
        persDrugs: patient?.personal_history?.drugs ?? "NIEGA",
        persTobacco: patient?.personal_history?.tobacco ?? "NIEGA",
        persBase: patient?.personal_history?.base_pathology ?? "",
        persSurgical: patient?.personal_history?.surgical ?? "",
        persAllergies: patient?.personal_history?.allergies ?? "",
        gynMenarche: patient?.gynecological_data?.menarche !== undefined && patient?.gynecological_data?.menarche !== null ? String(patient.gynecological_data.menarche) : "",
        gynSexarche: patient?.gynecological_data?.sexarche !== undefined && patient?.gynecological_data?.sexarche !== null ? String(patient.gynecological_data.sexarche) : "",
        gynCycle: patient?.gynecological_data?.menstrual_cycle ?? "",
        gynDismenorrea: patient?.gynecological_data?.dysmenorrhea ?? "NIEGA",
        gynNps: patient?.gynecological_data?.nps !== undefined && patient?.gynecological_data?.nps !== null ? String(patient.gynecological_data.nps) : "",
        gynIts: patient?.gynecological_data?.its ?? "",
        gynCytology: patient?.gynecological_data?.cytology ?? "",
        gynContraceptives: patient?.gynecological_data?.contraceptives ?? "",
        obsG: patient?.obstetric_data?.g !== undefined && patient?.obstetric_data?.g !== null ? String(patient.obstetric_data.g) : "",
        obsP: patient?.obstetric_data?.p !== undefined && patient?.obstetric_data?.p !== null ? String(patient.obstetric_data.p) : "",
        obsC: patient?.obstetric_data?.c !== undefined && patient?.obstetric_data?.c !== null ? String(patient.obstetric_data.c) : "",
        obsA: patient?.obstetric_data?.a !== undefined && patient?.obstetric_data?.a !== null ? String(patient.obstetric_data.a) : "",
        obsPig: patient?.obstetric_data?.pig ?? "",
        obsEm: patient?.obstetric_data?.em !== undefined && patient?.obstetric_data?.em !== null ? String(patient.obstetric_data.em) : "",
        obsEe: patient?.obstetric_data?.ee !== undefined && patient?.obstetric_data?.ee !== null ? String(patient.obstetric_data.ee) : "",
        obsComplications: patient?.obstetric_data?.complications ?? "",
        obsFum: patient?.obstetric_data?.fum ?? "",
        obsEg: patient?.obstetric_data?.eg ?? "",
        obsFpp: patient?.obstetric_data?.fpp ?? "",
        obsNumConsultations: patient?.obstetric_data?.num_consultations !== undefined && patient?.obstetric_data?.num_consultations !== null ? String(patient.obstetric_data.num_consultations) : "",
        obsVaccines: patient?.obstetric_data?.vaccines ?? "",
      });
    }
  }, [open, patient, defaultDoctor, isEdit, reset]);

  const create = useCreatePatient();
  const update = useUpdatePatient();
  const busy = create.isPending || update.isPending || (isEdit && isPatientDetailLoading);

  const onSubmit = async (data: PatientFormValues) => {
    if (!data.full_name.trim()) return;
    const doctorId = data.assigned_doctor_id || defaultDoctor;
    if (!doctorId) {
      toast.error("Falta médico asignado");
      return;
    }
    try {
      const combinedDocId = data.idNumber.trim() ? `${data.idPrefix === "none" ? "" : data.idPrefix}${data.idNumber.trim()}` : null;
      
      const payload: any = {
        full_name: data.full_name.trim(),
        email: data.email || null,
        phone: data.phone || null,
        birth_date: data.birth_date || null,
        status: data.status,
        assigned_doctor_id: doctorId,
        address: data.address || null,
        notes: data.notes || null,
        document_id: combinedDocId,
        
        // Extended clinical columns
        first_visit_date: data.first_visit_date || null,
        marital_status: data.marital_status || null,
        birthplace: data.birthplace || null,
        education_level: data.education_level || null,
        occupation: data.occupation || null,
        ethnicity: data.ethnicity || null,
        consultation_reason: data.consultation_reason || null,
        current_illness: data.current_illness || null,

        family_history: {
          mother: data.famMother || null,
          father: data.famFather || null,
          siblings: data.famSiblings || null,
          children: data.famChildren || null,
        },
        personal_history: {
          alcohol: data.persAlcohol || null,
          drugs: data.persDrugs || null,
          tobacco: data.persTobacco || null,
          base_pathology: data.persBase || null,
          surgical: data.persSurgical || null,
          allergies: data.persAllergies || null,
        },
        gynecological_data: {
          menarche: data.gynMenarche !== "" ? data.gynMenarche : null,
          sexarche: data.gynSexarche !== "" ? data.gynSexarche : null,
          menstrual_cycle: data.gynCycle || null,
          dysmenorrhea: data.gynDismenorrea || null,
          nps: data.gynNps !== "" ? data.gynNps : null,
          its: data.gynIts || null,
          cytology: data.gynCytology || null,
          contraceptives: data.gynContraceptives || null,
        },
        obstetric_data: {
          g: data.obsG !== "" ? data.obsG : null,
          p: data.obsP !== "" ? data.obsP : null,
          c: data.obsC !== "" ? data.obsC : null,
          a: data.obsA !== "" ? data.obsA : null,
          pig: data.obsPig || null,
          em: data.obsEm !== "" ? data.obsEm : null,
          ee: data.obsEe !== "" ? data.obsEe : null,
          complications: data.obsComplications || null,
          fum: data.obsFum || null,
          eg: data.obsEg || null,
          fpp: data.obsFpp || null,
          num_consultations: data.obsNumConsultations !== "" ? data.obsNumConsultations : null,
          vaccines: data.obsVaccines || null,
        },
      };

      if (data.historia_number.trim()) {
        payload.historia_number = data.historia_number.trim();
      } else if (isEdit) {
        payload.historia_number = null;
      }

      if (isEdit && patient) {
        await update.mutateAsync({ id: patient.id, ...payload });
        toast.success("Paciente actualizado");
      } else {
        await create.mutateAsync(payload);
        toast.success("Paciente creado");
      }
      onOpenChange(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error guardando");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl h-[90vh] flex flex-col rounded-3xl p-6">
        <DialogHeader className="pb-2">
          <DialogTitle>{isEdit ? "Editar historia clínica" : "Nueva historia clínica"}</DialogTitle>
          <DialogDescription>
            {isEdit ? "Actualiza el registro médico de la paciente." : "Registra los datos clínicos de la paciente."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="flex-1 flex flex-col min-h-0">
          <Tabs defaultValue="id" className="flex-1 flex flex-col min-h-0">
            <TabsList className="grid w-full grid-cols-5 bg-muted/60 p-1 rounded-2xl mb-4">
              <TabsTrigger value="id" className="rounded-xl font-medium">Identificación</TabsTrigger>
              <TabsTrigger value="family" className="rounded-xl font-medium">Ant. Familiares</TabsTrigger>
              <TabsTrigger value="personal" className="rounded-xl font-medium">Ant. Personales</TabsTrigger>
              <TabsTrigger value="gyn" className="rounded-xl font-medium">Ginecológicos</TabsTrigger>
              <TabsTrigger value="obs" className="rounded-xl font-medium">Obstétricos</TabsTrigger>
            </TabsList>

            <ScrollArea className="flex-1 pr-2">
              <div className="py-1">
                {/* TAB 1: IDENTIFICATION */}
                <TabsContent value="id" className="grid gap-4 mt-0">
                  <div className="grid grid-cols-3 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="historia">Nº Historia</Label>
                      <Input
                        id="historia"
                        placeholder="Auto-generado si queda vacío"
                        className="rounded-xl"
                        {...register("historia_number")}
                      />
                    </div>
                    <div className="grid gap-2 col-span-2">
                      <Label htmlFor="name">Nombre completo</Label>
                      <Input id="name" required className="rounded-xl" {...register("full_name")} />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div className="grid gap-2">
                      <Label>Tipo ID</Label>
                      <Controller
                        name="idPrefix"
                        control={control}
                        render={({ field }) => (
                          <Select value={field.value} onValueChange={field.onChange}>
                            <SelectTrigger className="rounded-xl">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="rounded-2xl">
                              <SelectItem value="V-">Venezolano (V-)</SelectItem>
                              <SelectItem value="E-">Extranjero (E-)</SelectItem>
                              <SelectItem value="P-">Pasaporte (P-)</SelectItem>
                              <SelectItem value="none">Sin prefijo</SelectItem>
                            </SelectContent>
                          </Select>
                        )}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="doc-number">Cédula / Pasaporte</Label>
                      <Input
                        id="doc-number"
                        placeholder="Ej. 12345678"
                        className="rounded-xl"
                        {...register("idNumber")}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="birth">Fecha de Nacimiento</Label>
                      <Input id="birth" type="date" className="rounded-xl" {...register("birth_date")} />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="phone">Teléfono</Label>
                      <Input id="phone" placeholder="0414..." className="rounded-xl" {...register("phone")} />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="email">Correo Electrónico</Label>
                      <Input id="email" type="email" placeholder="paciente@mail.com" className="rounded-xl" {...register("email")} />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="marital">Estado Civil</Label>
                      <Input id="marital" placeholder="Ej. Soltera, Casada..." className="rounded-xl" {...register("marital_status")} />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="birthplace">Lugar de Nacimiento</Label>
                      <Input id="birthplace" className="rounded-xl" {...register("birthplace")} />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="education">Grado de Instrucción</Label>
                      <Input id="education" placeholder="Ej. Universitario..." className="rounded-xl" {...register("education_level")} />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="occupation">Ocupación</Label>
                      <Input id="occupation" className="rounded-xl" {...register("occupation")} />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="ethnicity">Etnia</Label>
                      <Input id="ethnicity" placeholder="Ej. Blanca, Negra, Mestiza..." className="rounded-xl" {...register("ethnicity")} />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="first_visit">Fecha Primera Cita</Label>
                      <Input id="first_visit" type="date" className="rounded-xl" {...register("first_visit_date")} />
                    </div>
                    <div className="grid gap-2">
                      <Label>Estado de Paciente</Label>
                      <Controller
                        name="status"
                        control={control}
                        render={({ field }) => (
                          <Select value={field.value} onValueChange={field.onChange}>
                            <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                            <SelectContent className="rounded-2xl">
                              {STATUSES.map((s) => <SelectItem key={s} value={s}>{statusLabel(s)}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        )}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="address">Dirección de Habitación</Label>
                      <Input id="address" placeholder="Dirección completa" className="rounded-xl" {...register("address")} />
                    </div>
                    {isAdmin ? (
                      <div className="grid gap-2">
                        <Label>Médico asignado</Label>
                        <Controller
                          name="assigned_doctor_id"
                          control={control}
                          render={({ field }) => (
                            <Select value={field.value} onValueChange={field.onChange}>
                              <SelectTrigger className="rounded-xl"><SelectValue placeholder="Selecciona doctor" /></SelectTrigger>
                              <SelectContent className="rounded-2xl">
                                {doctors.map((d) => <SelectItem key={d.id} value={d.id}>{d.full_name || d.email}</SelectItem>)}
                              </SelectContent>
                            </Select>
                          )}
                        />
                      </div>
                    ) : (
                      <div className="grid gap-2">
                        <Label htmlFor="notes_stub">Notas Internas</Label>
                        <Input id="notes_stub" placeholder="Observaciones generales" className="rounded-xl" {...register("notes")} />
                      </div>
                    )}
                  </div>

                  <div className="border-t pt-3 mt-2 grid gap-4">
                    <h3 className="font-semibold text-mauve text-sm">Datos de Consulta Inicial</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <Label htmlFor="reason">Motivo de Consulta</Label>
                        <Input id="reason" placeholder="Ej. Control ginecológico..." className="rounded-xl" {...register("consultation_reason")} />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="current_illness">Enfermedad Actual</Label>
                        <Textarea id="current_illness" placeholder="Evolución del cuadro..." className="rounded-xl min-h-[60px]" {...register("current_illness")} />
                      </div>
                    </div>
                  </div>
                </TabsContent>

                {/* TAB 2: FAMILY HISTORY */}
                <TabsContent value="family" className="grid gap-4 mt-0">
                  <div className="grid gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="mother">Madre</Label>
                      <Input id="mother" placeholder="Antecedentes médicos (Ej. Viva, HTA)" className="rounded-xl" {...register("famMother")} />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="father">Padre</Label>
                      <Input id="father" placeholder="Antecedentes médicos (Ej. Fallecido, IAM)" className="rounded-xl" {...register("famFather")} />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="siblings">Hermanos</Label>
                      <Input id="siblings" placeholder="Antecedentes médicos o cantidad" className="rounded-xl" {...register("famSiblings")} />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="children">Hijos</Label>
                      <Input id="children" placeholder="Antecedentes médicos o cantidad" className="rounded-xl" {...register("famChildren")} />
                    </div>
                  </div>
                </TabsContent>

                {/* TAB 3: PERSONAL HISTORY */}
                <TabsContent value="personal" className="grid gap-4 mt-0">
                  <div className="grid grid-cols-3 gap-4">
                    <div className="grid gap-2">
                      <Label>Alcohol</Label>
                      <Controller
                        name="persAlcohol"
                        control={control}
                        render={({ field }) => (
                          <Select value={field.value} onValueChange={field.onChange}>
                            <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                            <SelectContent className="rounded-2xl">
                              <SelectItem value="NIEGA">Niega</SelectItem>
                              <SelectItem value="OCASIONAL">Ocasional</SelectItem>
                              <SelectItem value="FRECUENTE">Frecuente</SelectItem>
                            </SelectContent>
                          </Select>
                        )}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label>Drogas</Label>
                      <Controller
                        name="persDrugs"
                        control={control}
                        render={({ field }) => (
                          <Select value={field.value} onValueChange={field.onChange}>
                            <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                            <SelectContent className="rounded-2xl">
                              <SelectItem value="NIEGA">Niega</SelectItem>
                              <SelectItem value="OCASIONAL">Ocasional</SelectItem>
                              <SelectItem value="FRECUENTE">Frecuente</SelectItem>
                            </SelectContent>
                          </Select>
                        )}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label>Tabaco</Label>
                      <Controller
                        name="persTobacco"
                        control={control}
                        render={({ field }) => (
                          <Select value={field.value} onValueChange={field.onChange}>
                            <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                            <SelectContent className="rounded-2xl">
                              <SelectItem value="NIEGA">Niega</SelectItem>
                              <SelectItem value="OCASIONAL">Ocasional</SelectItem>
                              <SelectItem value="FRECUENTE">Frecuente</SelectItem>
                            </SelectContent>
                          </Select>
                        )}
                      />
                    </div>
                  </div>

                  <div className="grid gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="base">Patología Base</Label>
                      <Textarea id="base" placeholder="Ej. Asma, Diabetes, Hipertensión..." className="rounded-xl min-h-[80px]" {...register("persBase")} />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="surgical">Quirúrgicos</Label>
                      <Textarea id="surgical" placeholder="Intervenciones previas..." className="rounded-xl min-h-[80px]" {...register("persSurgical")} />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="allergies">Alérgicos</Label>
                      <Textarea id="allergies" placeholder="Alergias conocidas..." className="rounded-xl min-h-[80px]" {...register("persAllergies")} />
                    </div>
                  </div>
                </TabsContent>

                {/* TAB 4: GYNECOLOGICAL DATA */}
                <TabsContent value="gyn" className="grid gap-4 mt-0">
                  <div className="grid grid-cols-4 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="menarche">Menarquía (Edad)</Label>
                      <Input id="menarche" placeholder="Años" type="text" className="rounded-xl" {...register("gynMenarche")} />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="sexarche">Sexarquía (Edad)</Label>
                      <Input id="sexarche" placeholder="Años" type="text" className="rounded-xl" {...register("gynSexarche")} />
                    </div>
                    <div className="grid gap-2 col-span-2">
                      <Label htmlFor="cycle">Ciclo Menstrual</Label>
                      <Input id="cycle" placeholder="Ej. 28/05 o Menopausia..." className="rounded-xl" {...register("gynCycle")} />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div className="grid gap-2">
                      <Label>Dismenorrea</Label>
                      <Controller
                        name="gynDismenorrea"
                        control={control}
                        render={({ field }) => (
                          <Select value={field.value} onValueChange={field.onChange}>
                            <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                            <SelectContent className="rounded-2xl">
                              <SelectItem value="NIEGA">Niega</SelectItem>
                              <SelectItem value="SI">Sí</SelectItem>
                              <SelectItem value="OCASIONAL">Ocasional</SelectItem>
                            </SelectContent>
                          </Select>
                        )}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="nps">NPS (Nº Parejas)</Label>
                      <Input id="nps" placeholder="Nº" type="text" className="rounded-xl" {...register("gynNps")} />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="gynits">ITS</Label>
                      <Input id="gynits" placeholder="Ej. VPH, Clamidia o Niega" className="rounded-xl" {...register("gynIts")} />
                    </div>
                  </div>

                  <div className="grid gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="cytology">Citología (Antecedentes)</Label>
                      <Textarea id="cytology" placeholder="Resultados previos, fecha de última toma..." className="rounded-xl min-h-[80px]" {...register("gynCytology")} />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="contraceptives">Método Anticonceptivo</Label>
                      <Input id="contraceptives" placeholder="Ej. ACO, T de cobre, implante..." className="rounded-xl" {...register("gynContraceptives")} />
                    </div>
                  </div>
                </TabsContent>

                {/* TAB 5: OBSTETRICAL DATA */}
                <TabsContent value="obs" className="grid gap-4 mt-0">
                  <div className="grid grid-cols-4 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="obs_g">Gestas (G)</Label>
                      <Input id="obs_g" placeholder="G" type="text" className="rounded-xl" {...register("obsG")} />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="obs_p">Partos (P)</Label>
                      <Input id="obs_p" placeholder="P" type="text" className="rounded-xl" {...register("obsP")} />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="obs_c">Cesáreas (C)</Label>
                      <Input id="obs_c" placeholder="C" type="text" className="rounded-xl" {...register("obsC")} />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="obs_a">Abortos (A)</Label>
                      <Input id="obs_a" placeholder="A" type="text" className="rounded-xl" {...register("obsA")} />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="obs_pig">PIG (Intervalo Gen.)</Label>
                      <Input id="obs_pig" placeholder="Años o meses" className="rounded-xl" {...register("obsPig")} />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="obs_em">EM (Embarazos Múltiples)</Label>
                      <Input id="obs_em" placeholder="Nº" type="text" className="rounded-xl" {...register("obsEm")} />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="obs_ee">EE (Ectópicos)</Label>
                      <Input id="obs_ee" placeholder="Nº" type="text" className="rounded-xl" {...register("obsEe")} />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="obs_fum">FUM</Label>
                      <Input id="obs_fum" placeholder="Ej. 12/03/2026" className="rounded-xl" {...register("obsFum")} />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="obs_eg">EG (Edad Gestacional)</Label>
                      <Input id="obs_eg" placeholder="Semanas + días" className="rounded-xl" {...register("obsEg")} />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="obs_fpp">FPP</Label>
                      <Input id="obs_fpp" placeholder="FPP" className="rounded-xl" {...register("obsFpp")} />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="obs_consults">Nº Consultas Previas</Label>
                      <Input id="obs_consults" placeholder="Nº" type="text" className="rounded-xl" {...register("obsNumConsultations")} />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="obs_vaccines">Vacunas Aplicadas</Label>
                      <Input id="obs_vaccines" placeholder="Ej. Antitetánica..." className="rounded-xl" {...register("obsVaccines")} />
                    </div>
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="complications">Complicaciones Obstétricas Previas</Label>
                    <Textarea id="complications" placeholder="Ej. Preeclampsia, diabetes gestacional..." className="rounded-xl min-h-[60px]" {...register("obsComplications")} />
                  </div>
                </TabsContent>
              </div>
            </ScrollArea>
          </Tabs>

          <DialogFooter className="border-t pt-4 mt-2">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} className="rounded-xl">Cancelar</Button>
            <Button type="submit" disabled={busy} className="bg-gradient-to-r from-mauve to-mauve-soft text-primary-foreground hover:opacity-95 rounded-xl px-6">
              {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEdit ? "Guardar cambios" : "Crear paciente"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
