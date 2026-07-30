import { useState, useMemo, useEffect } from "react";
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

  // General States
  const [full_name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phonePrefix, setPhonePrefix] = useState("+58");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [birth_date, setBirth] = useState("");
  const [status, setStatus] = useState("nuevo");
  const [assigned_doctor_id, setDoctor] = useState("");
  const [notes, setNotes] = useState("");
  const [address, setAddress] = useState("");
  
  // Custom prefix states
  const [idPrefix, setIdPrefix] = useState("V-");
  const [idNumber, setIdNumber] = useState("");

  // New Clinical States
  const [historia_number, setHistoriaNumber] = useState("");
  const [first_visit_date, setFirstVisitDate] = useState("");
  const [marital_status, setMaritalStatus] = useState("");
  const [birthplace, setBirthplace] = useState("");
  const [education_level, setEducationLevel] = useState("");
  const [occupation, setOccupation] = useState("");
  const [ethnicity, setEthnicity] = useState("");
  const [consultation_reason, setConsultationReason] = useState("");
  const [current_illness, setCurrentIllness] = useState("");

  // Family History States
  const [famMother, setFamMother] = useState("");
  const [famFather, setFamFather] = useState("");
  const [famSiblings, setFamSiblings] = useState("");
  const [famChildren, setFamChildren] = useState("");

  // Personal History States
  const [persAlcohol, setPersAlcohol] = useState("NIEGA");
  const [persDrugs, setPersDrugs] = useState("NIEGA");
  const [persTobacco, setPersTobacco] = useState("NIEGA");
  const [persBase, setPersBase] = useState("");
  const [persSurgical, setPersSurgical] = useState("");
  const [persAllergies, setPersAllergies] = useState("");

  // Gynecological Data States
  const [gynMenarche, setGynMenarche] = useState("");
  const [gynSexarche, setGynSexarche] = useState("");
  const [gynCycle, setGynCycle] = useState("");
  const [gynDismenorrea, setGynDismenorrea] = useState("NIEGA");
  const [gynNps, setGynNps] = useState("");
  const [gynIts, setGynIts] = useState("");
  const [gynCytology, setGynCytology] = useState("");
  const [gynContraceptives, setGynContraceptives] = useState("");

  // Obstetric Data States
  const [obsG, setObsG] = useState("");
  const [obsP, setObsP] = useState("");
  const [obsC, setObsC] = useState("");
  const [obsA, setObsA] = useState("");
  const [obsPig, setObsPig] = useState("");
  const [obsEm, setObsEm] = useState("");
  const [obsEe, setObsEe] = useState("");
  const [obsComplications, setObsComplications] = useState("");
  const [obsFum, setObsFum] = useState("");
  const [obsEg, setObsEg] = useState("");
  const [obsFpp, setObsFpp] = useState("");
  const [obsNumConsultations, setObsNumConsultations] = useState("");
  const [obsVaccines, setObsVaccines] = useState("");

  const getDocParts = (docId: string | null) => {
    const val = docId ?? "";
    if (val.startsWith("V-")) return ["V-", val.slice(2)];
    if (val.startsWith("E-")) return ["E-", val.slice(2)];
    if (val.startsWith("P-")) return ["P-", val.slice(2)];
    return ["none", val];
  };

  useEffect(() => {
    if (open && (!isEdit || patient)) {
      setName(patient?.full_name ?? "");
      setEmail(patient?.email ?? "");
      if (patient?.phone) {
        const parts = patient.phone.split(" ");
        if (parts.length > 1 && parts[0].startsWith("+")) {
          setPhonePrefix(parts[0]);
          setPhoneNumber(parts.slice(1).join(" "));
        } else {
          setPhoneNumber(patient.phone);
        }
      } else {
        setPhonePrefix("+58");
        setPhoneNumber("");
      }
      setBirth(patient?.birth_date ?? "");
      setStatus(patient?.status ?? "nuevo");
      setDoctor(defaultDoctor);
      setNotes(patient?.notes ?? "");
      setAddress(patient?.address ?? "");

      const [pfx, num] = getDocParts(patient?.document_id ?? null);
      setIdPrefix(pfx);
      setIdNumber(num);

      // Clinical fields
      setHistoriaNumber(patient?.historia_number ?? "");
      setFirstVisitDate(patient?.first_visit_date ?? new Date().toISOString().split("T")[0]);
      setMaritalStatus(patient?.marital_status ?? "");
      setBirthplace(patient?.birthplace ?? "");
      setEducationLevel(patient?.education_level ?? "");
      setOccupation(patient?.occupation ?? "");
      setEthnicity(patient?.ethnicity ?? "");
      setConsultationReason(patient?.consultation_reason ?? "");
      setCurrentIllness(patient?.current_illness ?? "");

      // Family History
      setFamMother(patient?.family_history?.mother ?? "");
      setFamFather(patient?.family_history?.father ?? "");
      setFamSiblings(patient?.family_history?.siblings ?? "");
      setFamChildren(patient?.family_history?.children ?? "");

      // Personal History
      setPersAlcohol(patient?.personal_history?.alcohol ?? "NIEGA");
      setPersDrugs(patient?.personal_history?.drugs ?? "NIEGA");
      setPersTobacco(patient?.personal_history?.tobacco ?? "NIEGA");
      setPersBase(patient?.personal_history?.base_pathology ?? "");
      setPersSurgical(patient?.personal_history?.surgical ?? "");
      setPersAllergies(patient?.personal_history?.allergies ?? "");

      // Gynecological
      setGynMenarche(patient?.gynecological_data?.menarche !== undefined && patient?.gynecological_data?.menarche !== null ? String(patient.gynecological_data.menarche) : "");
      setGynSexarche(patient?.gynecological_data?.sexarche !== undefined && patient?.gynecological_data?.sexarche !== null ? String(patient.gynecological_data.sexarche) : "");
      setGynCycle(patient?.gynecological_data?.menstrual_cycle ?? "");
      setGynDismenorrea(patient?.gynecological_data?.dysmenorrhea ?? "NIEGA");
      setGynNps(patient?.gynecological_data?.nps !== undefined && patient?.gynecological_data?.nps !== null ? String(patient.gynecological_data.nps) : "");
      setGynIts(patient?.gynecological_data?.its ?? "");
      setGynCytology(patient?.gynecological_data?.cytology ?? "");
      setGynContraceptives(patient?.gynecological_data?.contraceptives ?? "");

      // Obstetric
      setObsG(patient?.obstetric_data?.g !== undefined && patient?.obstetric_data?.g !== null ? String(patient.obstetric_data.g) : "");
      setObsP(patient?.obstetric_data?.p !== undefined && patient?.obstetric_data?.p !== null ? String(patient.obstetric_data.p) : "");
      setObsC(patient?.obstetric_data?.c !== undefined && patient?.obstetric_data?.c !== null ? String(patient.obstetric_data.c) : "");
      setObsA(patient?.obstetric_data?.a !== undefined && patient?.obstetric_data?.a !== null ? String(patient.obstetric_data.a) : "");
      setObsPig(patient?.obstetric_data?.pig ?? "");
      setObsEm(patient?.obstetric_data?.em !== undefined && patient?.obstetric_data?.em !== null ? String(patient.obstetric_data.em) : "");
      setObsEe(patient?.obstetric_data?.ee !== undefined && patient?.obstetric_data?.ee !== null ? String(patient.obstetric_data.ee) : "");
      setObsComplications(patient?.obstetric_data?.complications ?? "");
      setObsFum(patient?.obstetric_data?.fum ?? "");
      setObsEg(patient?.obstetric_data?.eg ?? "");
      setObsFpp(patient?.obstetric_data?.fpp ?? "");
      setObsNumConsultations(patient?.obstetric_data?.num_consultations !== undefined && patient?.obstetric_data?.num_consultations !== null ? String(patient.obstetric_data.num_consultations) : "");
      setObsVaccines(patient?.obstetric_data?.vaccines ?? "");
    }
  }, [open, patient, defaultDoctor, isEdit]);

  const create = useCreatePatient();
  const update = useUpdatePatient();
  const busy = create.isPending || update.isPending || (isEdit && isPatientDetailLoading);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!full_name.trim()) return;
    const doctorId = assigned_doctor_id || defaultDoctor;
    if (!doctorId) {
      toast.error("Falta médico asignado");
      return;
    }
    try {
      const combinedDocId = idNumber.trim() ? `${idPrefix === "none" ? "" : idPrefix}${idNumber.trim()}` : null;
      
      const payload = {
        full_name: full_name.trim(),
        email: email || null,
        phone: phoneNumber.trim() ? `${phonePrefix} ${phoneNumber.trim()}` : null,
        birth_date: birth_date || null,
        status,
        assigned_doctor_id: doctorId,
        address: address || null,
        notes: notes || null,
        document_id: combinedDocId,
        
        // Extended clinical columns
        historia_number: historia_number || null,
        first_visit_date: first_visit_date || null,
        marital_status: marital_status || null,
        birthplace: birthplace || null,
        education_level: education_level || null,
        occupation: occupation || null,
        ethnicity: ethnicity || null,
        consultation_reason: consultation_reason || null,
        current_illness: current_illness || null,

        family_history: {
          mother: famMother || null,
          father: famFather || null,
          siblings: famSiblings || null,
          children: famChildren || null,
        },
        personal_history: {
          alcohol: persAlcohol || null,
          drugs: persDrugs || null,
          tobacco: persTobacco || null,
          base_pathology: persBase || null,
          surgical: persSurgical || null,
          allergies: persAllergies || null,
        },
        gynecological_data: {
          menarche: gynMenarche !== "" ? gynMenarche : null,
          sexarche: gynSexarche !== "" ? gynSexarche : null,
          menstrual_cycle: gynCycle || null,
          dysmenorrhea: gynDismenorrea || null,
          nps: gynNps !== "" ? gynNps : null,
          its: gynIts || null,
          cytology: gynCytology || null,
          contraceptives: gynContraceptives || null,
        },
        obstetric_data: {
          g: obsG !== "" ? obsG : null,
          p: obsP !== "" ? obsP : null,
          c: obsC !== "" ? obsC : null,
          a: obsA !== "" ? obsA : null,
          pig: obsPig || null,
          em: obsEm !== "" ? obsEm : null,
          ee: obsEe !== "" ? obsEe : null,
          complications: obsComplications || null,
          fum: obsFum || null,
          eg: obsEg || null,
          fpp: obsFpp || null,
          num_consultations: obsNumConsultations !== "" ? obsNumConsultations : null,
          vaccines: obsVaccines || null,
        },
      };

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

        <form onSubmit={submit} className="flex-1 flex flex-col min-h-0">
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
                        value={historia_number}
                        onChange={(e) => setHistoriaNumber(e.target.value)}
                        placeholder="Auto-generado si queda vacío"
                        className="rounded-xl"
                      />
                    </div>
                    <div className="grid gap-2 col-span-2">
                      <Label htmlFor="name">Nombre completo</Label>
                      <Input id="name" value={full_name} onChange={(e) => setName(e.target.value)} required className="rounded-xl" />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div className="grid gap-2">
                      <Label>Tipo ID</Label>
                      <Select value={idPrefix} onValueChange={setIdPrefix}>
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
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="doc-number">Cédula / Pasaporte</Label>
                      <Input
                        id="doc-number"
                        placeholder="Ej. 12345678"
                        value={idNumber}
                        onChange={(e) => setIdNumber(e.target.value)}
                        className="rounded-xl"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="birth">Fecha de Nacimiento</Label>
                      <Input id="birth" type="date" value={birth_date} onChange={(e) => setBirth(e.target.value)} className="rounded-xl" />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="phone">Teléfono</Label>
                      <div className="flex h-10 w-full items-center rounded-xl border border-input bg-background shadow-sm focus-within:ring-1 focus-within:ring-ring focus-within:border-ring transition-colors">
                        <Select value={phonePrefix} onValueChange={setPhonePrefix}>
                          <SelectTrigger className="w-auto min-w-[70px] border-0 focus:ring-0 focus:ring-offset-0 bg-transparent h-full rounded-l-xl text-xs font-medium px-2 py-0">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="+58">VE +58</SelectItem>
                            <SelectItem value="+1">US +1</SelectItem>
                            <SelectItem value="+57">CO +57</SelectItem>
                            <SelectItem value="+56">CL +56</SelectItem>
                            <SelectItem value="+34">ES +34</SelectItem>
                            <SelectItem value="+51">PE +51</SelectItem>
                          </SelectContent>
                        </Select>
                        <div className="w-px h-5 bg-border/60 mx-1"></div>
                        <input
                          id="phone"
                          value={phoneNumber}
                          onChange={(e) => setPhoneNumber(e.target.value.replace(/[^0-9]/g, ""))}
                          placeholder="414 1234567"
                          className="flex-1 bg-transparent border-0 focus:ring-0 text-sm h-full px-2 outline-none text-foreground placeholder:text-muted-foreground min-w-0"
                        />
                      </div>
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="email">Correo Electrónico</Label>
                      <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="paciente@mail.com" className="rounded-xl" />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="marital">Estado Civil</Label>
                      <Input id="marital" value={marital_status} onChange={(e) => setMaritalStatus(e.target.value)} placeholder="Ej. Soltera, Casada..." className="rounded-xl" />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="birthplace">Lugar de Nacimiento</Label>
                      <Input id="birthplace" value={birthplace} onChange={(e) => setBirthplace(e.target.value)} className="rounded-xl" />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="education">Grado de Instrucción</Label>
                      <Input id="education" value={education_level} onChange={(e) => setEducationLevel(e.target.value)} placeholder="Ej. Universitario..." className="rounded-xl" />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="occupation">Ocupación</Label>
                      <Input id="occupation" value={occupation} onChange={(e) => setOccupation(e.target.value)} className="rounded-xl" />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="ethnicity">Etnia</Label>
                      <Input id="ethnicity" value={ethnicity} onChange={(e) => setEthnicity(e.target.value)} placeholder="Ej. Blanca, Negra, Mestiza..." className="rounded-xl" />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="first_visit">Fecha Primera Cita</Label>
                      <Input id="first_visit" type="date" value={first_visit_date} onChange={(e) => setFirstVisitDate(e.target.value)} className="rounded-xl" />
                    </div>
                    <div className="grid gap-2">
                      <Label>Estado de Paciente</Label>
                      <Select value={status} onValueChange={setStatus}>
                        <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                        <SelectContent className="rounded-2xl">
                          {STATUSES.map((s) => <SelectItem key={s} value={s}>{statusLabel(s)}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="address">Dirección de Habitación</Label>
                      <Input id="address" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Dirección completa" className="rounded-xl" />
                    </div>
                    {isAdmin ? (
                      <div className="grid gap-2">
                        <Label>Médico asignado</Label>
                        <Select value={assigned_doctor_id} onValueChange={setDoctor}>
                          <SelectTrigger className="rounded-xl"><SelectValue placeholder="Selecciona doctor" /></SelectTrigger>
                          <SelectContent className="rounded-2xl">
                            {doctors.map((d) => <SelectItem key={d.id} value={d.id}>{d.full_name || d.email}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                    ) : (
                      <div className="grid gap-2">
                        <Label htmlFor="notes_stub">Notas Internas</Label>
                        <Input id="notes_stub" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Observaciones generales" className="rounded-xl" />
                      </div>
                    )}
                  </div>

                  <div className="border-t pt-3 mt-2 grid gap-4">
                    <h3 className="font-semibold text-mauve text-sm">Datos de Consulta Inicial</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <Label htmlFor="reason">Motivo de Consulta</Label>
                        <Input id="reason" value={consultation_reason} onChange={(e) => setConsultationReason(e.target.value)} placeholder="Ej. Control ginecológico..." className="rounded-xl" />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="current_illness">Enfermedad Actual</Label>
                        <Textarea id="current_illness" value={current_illness} onChange={(e) => setCurrentIllness(e.target.value)} placeholder="Evolución del cuadro..." className="rounded-xl min-h-[60px]" />
                      </div>
                    </div>
                  </div>
                </TabsContent>

                {/* TAB 2: FAMILY HISTORY */}
                <TabsContent value="family" className="grid gap-4 mt-0">
                  <div className="grid gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="mother">Madre</Label>
                      <Input id="mother" value={famMother} onChange={(e) => setFamMother(e.target.value)} placeholder="Antecedentes médicos (Ej. Viva, HTA)" className="rounded-xl" />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="father">Padre</Label>
                      <Input id="father" value={famFather} onChange={(e) => setFamFather(e.target.value)} placeholder="Antecedentes médicos (Ej. Fallecido, IAM)" className="rounded-xl" />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="siblings">Hermanos</Label>
                      <Input id="siblings" value={famSiblings} onChange={(e) => setFamSiblings(e.target.value)} placeholder="Antecedentes médicos o cantidad" className="rounded-xl" />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="children">Hijos</Label>
                      <Input id="children" value={famChildren} onChange={(e) => setFamChildren(e.target.value)} placeholder="Antecedentes médicos o cantidad" className="rounded-xl" />
                    </div>
                  </div>
                </TabsContent>

                {/* TAB 3: PERSONAL HISTORY */}
                <TabsContent value="personal" className="grid gap-4 mt-0">
                  <div className="grid grid-cols-3 gap-4">
                    <div className="grid gap-2">
                      <Label>Alcohol</Label>
                      <Select value={persAlcohol} onValueChange={setPersAlcohol}>
                        <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                        <SelectContent className="rounded-2xl">
                          <SelectItem value="NIEGA">Niega</SelectItem>
                          <SelectItem value="OCASIONAL">Ocasional</SelectItem>
                          <SelectItem value="FRECUENTE">Frecuente</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid gap-2">
                      <Label>Drogas</Label>
                      <Select value={persDrugs} onValueChange={setPersDrugs}>
                        <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                        <SelectContent className="rounded-2xl">
                          <SelectItem value="NIEGA">Niega</SelectItem>
                          <SelectItem value="OCASIONAL">Ocasional</SelectItem>
                          <SelectItem value="FRECUENTE">Frecuente</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid gap-2">
                      <Label>Tabaco</Label>
                      <Select value={persTobacco} onValueChange={setPersTobacco}>
                        <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                        <SelectContent className="rounded-2xl">
                          <SelectItem value="NIEGA">Niega</SelectItem>
                          <SelectItem value="OCASIONAL">Ocasional</SelectItem>
                          <SelectItem value="FRECUENTE">Frecuente</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="base">Patología Base</Label>
                      <Textarea id="base" value={persBase} onChange={(e) => setPersBase(e.target.value)} placeholder="Ej. Asma, Diabetes, Hipertensión..." className="rounded-xl min-h-[80px]" />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="surgical">Quirúrgicos</Label>
                      <Textarea id="surgical" value={persSurgical} onChange={(e) => setPersSurgical(e.target.value)} placeholder="Intervenciones previas..." className="rounded-xl min-h-[80px]" />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="allergies">Alérgicos</Label>
                      <Textarea id="allergies" value={persAllergies} onChange={(e) => setPersAllergies(e.target.value)} placeholder="Alergias conocidas..." className="rounded-xl min-h-[80px]" />
                    </div>
                  </div>
                </TabsContent>

                {/* TAB 4: GYNECOLOGICAL DATA */}
                <TabsContent value="gyn" className="grid gap-4 mt-0">
                  <div className="grid grid-cols-4 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="menarche">Menarquía (Edad)</Label>
                      <Input id="menarche" value={gynMenarche} onChange={(e) => setGynMenarche(e.target.value)} placeholder="Años" type="text" className="rounded-xl" />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="sexarche">Sexarquía (Edad)</Label>
                      <Input id="sexarche" value={gynSexarche} onChange={(e) => setGynSexarche(e.target.value)} placeholder="Años" type="text" className="rounded-xl" />
                    </div>
                    <div className="grid gap-2 col-span-2">
                      <Label htmlFor="cycle">Ciclo Menstrual</Label>
                      <Input id="cycle" value={gynCycle} onChange={(e) => setGynCycle(e.target.value)} placeholder="Ej. 28/05 o Menopausia..." className="rounded-xl" />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div className="grid gap-2">
                      <Label>Dismenorrea</Label>
                      <Select value={gynDismenorrea} onValueChange={setGynDismenorrea}>
                        <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                        <SelectContent className="rounded-2xl">
                          <SelectItem value="NIEGA">Niega</SelectItem>
                          <SelectItem value="SI">Sí</SelectItem>
                          <SelectItem value="OCASIONAL">Ocasional</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="nps">NPS (Nº Parejas)</Label>
                      <Input id="nps" value={gynNps} onChange={(e) => setGynNps(e.target.value)} placeholder="Nº" type="text" className="rounded-xl" />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="gynits">ITS</Label>
                      <Input id="gynits" value={gynIts} onChange={(e) => setGynIts(e.target.value)} placeholder="Ej. VPH, Clamidia o Niega" className="rounded-xl" />
                    </div>
                  </div>

                  <div className="grid gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="cytology">Citología (Antecedentes)</Label>
                      <Textarea id="cytology" value={gynCytology} onChange={(e) => setGynCytology(e.target.value)} placeholder="Resultados previos, fecha de última toma..." className="rounded-xl min-h-[80px]" />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="contraceptives">Método Anticonceptivo</Label>
                      <Input id="contraceptives" value={gynContraceptives} onChange={(e) => setGynContraceptives(e.target.value)} placeholder="Ej. ACO, T de cobre, implante..." className="rounded-xl" />
                    </div>
                  </div>
                </TabsContent>

                {/* TAB 5: OBSTETRICAL DATA */}
                <TabsContent value="obs" className="grid gap-4 mt-0">
                  <div className="grid grid-cols-4 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="obs_g">Gestas (G)</Label>
                      <Input id="obs_g" value={obsG} onChange={(e) => setObsG(e.target.value)} placeholder="G" type="text" className="rounded-xl" />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="obs_p">Partos (P)</Label>
                      <Input id="obs_p" value={obsP} onChange={(e) => setObsP(e.target.value)} placeholder="P" type="text" className="rounded-xl" />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="obs_c">Cesáreas (C)</Label>
                      <Input id="obs_c" value={obsC} onChange={(e) => setObsC(e.target.value)} placeholder="C" type="text" className="rounded-xl" />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="obs_a">Abortos (A)</Label>
                      <Input id="obs_a" value={obsA} onChange={(e) => setObsA(e.target.value)} placeholder="A" type="text" className="rounded-xl" />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="obs_pig">PIG (Intervalo Gen.)</Label>
                      <Input id="obs_pig" value={obsPig} onChange={(e) => setObsPig(e.target.value)} placeholder="Años o meses" className="rounded-xl" />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="obs_em">EM (Embarazos Múltiples)</Label>
                      <Input id="obs_em" value={obsEm} onChange={(e) => setObsEm(e.target.value)} placeholder="Nº" type="text" className="rounded-xl" />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="obs_ee">EE (Ectópicos)</Label>
                      <Input id="obs_ee" value={obsEe} onChange={(e) => setObsEe(e.target.value)} placeholder="Nº" type="text" className="rounded-xl" />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="obs_fum">FUM</Label>
                      <Input id="obs_fum" value={obsFum} onChange={(e) => setObsFum(e.target.value)} placeholder="Ej. 12/03/2026" className="rounded-xl" />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="obs_eg">EG (Edad Gestacional)</Label>
                      <Input id="obs_eg" value={obsEg} onChange={(e) => setObsEg(e.target.value)} placeholder="Semanas + días" className="rounded-xl" />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="obs_fpp">FPP</Label>
                      <Input id="obs_fpp" value={obsFpp} onChange={(e) => setObsFpp(e.target.value)} placeholder="FPP" className="rounded-xl" />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="obs_consults">Nº Consultas Previas</Label>
                      <Input id="obs_consults" value={obsNumConsultations} onChange={(e) => setObsNumConsultations(e.target.value)} placeholder="Nº" type="text" className="rounded-xl" />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="obs_vaccines">Vacunas Aplicadas</Label>
                      <Input id="obs_vaccines" value={obsVaccines} onChange={(e) => setObsVaccines(e.target.value)} placeholder="Ej. Antitetánica..." className="rounded-xl" />
                    </div>
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="complications">Complicaciones Obstétricas Previas</Label>
                    <Textarea id="complications" value={obsComplications} onChange={(e) => setObsComplications(e.target.value)} placeholder="Ej. Preeclampsia, diabetes gestacional..." className="rounded-xl min-h-[60px]" />
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
