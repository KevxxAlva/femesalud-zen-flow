import { createFileRoute, Link } from '@tanstack/react-router'
import { useState } from "react"
import { ArrowLeft, FileDown, FileText, Printer, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { PatientTimeline } from "@/components/PatientTimeline"
import { ClinicalNotesPanel } from "@/components/ClinicalNotesPanel"
import { PatientConsultationsPanel } from "@/components/PatientConsultationsPanel"
import { usePatient } from "@/lib/api/patients"
import { useDoctors } from "@/lib/api/profiles"
import { cn } from "@/lib/utils"

const getInitials = (name?: string) => {
  if (!name) return "NN";
  return name.split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase();
}
import { generateFichaPDF } from "@/lib/utils/pdf"
import { generateReposoPDF, generateAtencionPDF } from "@/lib/utils/reportsPdf"
import { AppSidebar } from "@/components/AppSidebar"

export const Route = createFileRoute('/_authenticated/pacientes/$patientId')({
  component: PatientDetailRoute,
})

const tagBg: Record<string, string> = {
  "activo": "bg-green-100 text-green-700",
  "nuevo": "bg-blue-100 text-blue-700",
  "alta": "bg-gray-100 text-gray-700",
  "reposo": "bg-purple-100 text-purple-700",
};

const statusLabel = (s?: string) => {
  if (!s) return "Desconocido";
  const m: Record<string, string> = {
    "activo": "Activo",
    "nuevo": "Nuevo",
    "alta": "De Alta",
    "reposo": "En Reposo",
  };
  return m[s] || s;
};

function PatientDetailRoute() {
  const { patientId } = Route.useParams()
  const { data: viewing, isLoading } = usePatient(patientId)
  const { data: doctors } = useDoctors()
  
  const doctorMap = new Map(doctors?.map(d => [d.id, d.full_name]) || []);

  const [openReposo, setOpenReposo] = useState(false);
  const [openAtencion, setOpenAtencion] = useState(false);

  const [reposoDays, setReposoDays] = useState("3");
  const [reposoStart, setReposoStart] = useState("");
  const [reposoReason, setReposoReason] = useState("");

  const [atencionDate, setAtencionDate] = useState("");
  const [atencionTime, setAtencionTime] = useState("");
  const [atencionReason, setAtencionReason] = useState("");

  const [doctorUni, setDoctorUni] = useState("");
  const [doctorMpps, setDoctorMpps] = useState("");
  const [doctorCmc, setDoctorCmc] = useState("");

  const handleExportFicha = (p: any) => generateFichaPDF(p, doctorMap);

  const handleOpenReposoDialog = (p: any) => {
    setReposoStart(new Date().toISOString().slice(0, 10));
    setDoctorUni("UC-CHET");
    setDoctorMpps("");
    setDoctorCmc("");
    setReposoReason(p.diagnosis || p.current_illness || "");
    setOpenReposo(true);
  };

  const handleOpenAtencionDialog = (p: any) => {
    setAtencionDate(new Date().toISOString().slice(0, 10));
    setAtencionTime(new Date().toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" }));
    setDoctorUni("UC-CHET");
    setDoctorMpps("");
    setDoctorCmc("");
    setAtencionReason(`Consulta ${p.consultation_reason ? `- ${p.consultation_reason}` : ""}`);
    setOpenAtencion(true);
  };

  const handleExportReposo = (p: any) => {
    generateReposoPDF({
      patientName: p.full_name,
      patientId: p.document_id || "",
      days: parseInt(reposoDays) || 3,
      startDate: reposoStart,
      reason: reposoReason,
      doctorName: "Dra. Carli Sole Aquino",
      doctorUniversity: doctorUni,
      doctorMpps,
      doctorCmc,
    });
    setOpenReposo(false);
  };

  const handleExportAtencion = (p: any) => {
    generateAtencionPDF({
      patientName: p.full_name,
      patientId: p.document_id || "",
      date: atencionDate,
      time: atencionTime,
      reason: atencionReason,
      doctorName: "Dra. Carli Sole Aquino",
      doctorUniversity: doctorUni,
      doctorMpps,
      doctorCmc,
    });
    setOpenAtencion(false);
  };

  if (isLoading) {
    return (
      <div className="flex h-screen bg-muted/20">
        <AppSidebar />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-mauve" />
        </div>
      </div>
    );
  }

  if (!viewing) {
    return (
      <div className="flex h-screen bg-muted/20">
        <AppSidebar />
        <div className="flex-1 flex flex-col items-center justify-center gap-4">
          <p className="text-muted-foreground font-medium">Paciente no encontrado.</p>
          <Link to="/pacientes">
            <Button variant="outline" className="rounded-xl">Volver a pacientes</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-muted/20 overflow-hidden">
      <AppSidebar />
      <div className="flex-1 flex flex-col min-h-0 bg-white m-2 rounded-[2rem] shadow-sm border border-border/40 overflow-y-auto">
        
        <div className="p-6 md:p-8 max-w-6xl mx-auto w-full">
          <div className="flex items-center gap-4 mb-6">
            <Link to="/pacientes">
              <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full bg-muted/50 hover:bg-muted">
                <ArrowLeft className="h-5 w-5 text-muted-foreground" />
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-[#2b3674]">Detalle de Historia Clínica</h1>
              <p className="text-sm text-muted-foreground mt-0.5">
                Visualización de datos generales, antecedentes y registro de consultas.
              </p>
            </div>
            
            <div className="ml-auto">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="rounded-xl flex items-center gap-1.5 h-9 cursor-pointer">
                    <FileDown className="h-4 w-4" /> Exportar...
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="rounded-2xl bg-card border border-muted/50 p-1.5 shadow-xl" align="end">
                  <DropdownMenuItem onClick={() => handleExportFicha(viewing)} className="rounded-xl cursor-pointer text-xs flex items-center gap-1.5 px-3 py-2 hover:bg-muted">
                    <FileText className="h-3.5 w-3.5 text-mauve" /> Exportar Ficha Médica
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleOpenReposoDialog(viewing)} className="rounded-xl cursor-pointer text-xs flex items-center gap-1.5 px-3 py-2 hover:bg-muted">
                    <Printer className="h-3.5 w-3.5 text-mauve" /> Constancia de Reposo
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleOpenAtencionDialog(viewing)} className="rounded-xl cursor-pointer text-xs flex items-center gap-1.5 px-3 py-2 hover:bg-muted">
                    <Printer className="h-3.5 w-3.5 text-mauve" /> Constancia de Atención
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          <div className="bg-muted/10 border border-border/40 p-5 rounded-3xl flex items-center gap-4 mb-6">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-mauve to-blush text-xl font-bold text-primary-foreground">
              {getInitials(viewing.full_name)}
            </div>
            <div>
              <p className="text-lg font-bold text-[#2b3674]">{viewing.full_name}</p>
              <div className="flex items-center gap-2 mt-1.5">
                <span className={cn("inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold", tagBg[viewing.status] || "bg-muted")}>{statusLabel(viewing.status)}</span>
                {viewing.historia_number && (
                  <span className="text-xs bg-muted/80 text-muted-foreground px-2.5 py-0.5 rounded-md font-semibold">
                    Historia: #{viewing.historia_number}
                  </span>
                )}
              </div>
            </div>
          </div>

          <Tabs defaultValue="general" className="flex-1 flex flex-col min-h-0">
            <TabsList className="grid w-full grid-cols-2 md:grid-cols-7 bg-muted/60 p-1.5 rounded-2xl mb-6 h-auto gap-1">
              <TabsTrigger value="general" className="rounded-xl font-medium text-xs py-2">Identificación</TabsTrigger>
              <TabsTrigger value="antecedentes" className="rounded-xl font-medium text-xs py-2">Antecedentes</TabsTrigger>
              <TabsTrigger value="ginecologia" className="rounded-xl font-medium text-xs py-2">Ginecológico</TabsTrigger>
              <TabsTrigger value="obstetricia" className="rounded-xl font-medium text-xs py-2">Obstétrico</TabsTrigger>
              <TabsTrigger value="consultas" className="rounded-xl font-medium text-xs py-2">Consultas</TabsTrigger>
              <TabsTrigger value="timeline" className="rounded-xl font-medium text-xs py-2">Timeline</TabsTrigger>
              <TabsTrigger value="notas" className="rounded-xl font-medium text-xs py-2">Notas Clínicas</TabsTrigger>
            </TabsList>

            <div className="flex-1 pb-10">
              {/* TAB 1: GENERAL */}
              <TabsContent value="general" className="space-y-4 outline-none">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 text-sm">
                  <div>
                    <span className="text-xs text-muted-foreground block mb-1">Nombre Completo</span>
                    <span className="font-semibold text-[#2b3674]">{viewing.full_name}</span>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground block mb-1">Cédula / Identificación</span>
                    <span className="font-semibold text-[#2b3674]">{viewing.document_id || "—"}</span>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground block mb-1">Fecha de Nacimiento</span>
                    <span className="font-semibold text-[#2b3674]">{viewing.birth_date || "—"}</span>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground block mb-1">Edad</span>
                    <span className="font-semibold text-[#2b3674]">
                      {viewing.birth_date ? `${new Date().getFullYear() - new Date(viewing.birth_date).getFullYear()} años` : "—"}
                    </span>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground block mb-1">Teléfono</span>
                    <span className="font-semibold text-[#2b3674]">{viewing.phone || "—"}</span>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground block mb-1">Correo Electrónico</span>
                    <span className="font-semibold text-[#2b3674]">{viewing.email || "—"}</span>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground block mb-1">Lugar de Nacimiento</span>
                    <span className="font-semibold text-[#2b3674]">{viewing.birthplace || "—"}</span>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground block mb-1">Estado Civil</span>
                    <span className="font-semibold text-[#2b3674]">{viewing.marital_status || "—"}</span>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground block mb-1">Grado de Instrucción</span>
                    <span className="font-semibold text-[#2b3674]">{viewing.education_level || "—"}</span>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground block mb-1">Ocupación</span>
                    <span className="font-semibold text-[#2b3674]">{viewing.occupation || "—"}</span>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground block mb-1">Etnia</span>
                    <span className="font-semibold text-[#2b3674]">{viewing.ethnicity || "—"}</span>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground block mb-1">Fecha Primera Cita</span>
                    <span className="font-semibold text-[#2b3674]">{viewing.first_visit_date || "—"}</span>
                  </div>
                  <div className="col-span-1 md:col-span-2 lg:col-span-3">
                    <span className="text-xs text-muted-foreground block mb-1">Dirección</span>
                    <span className="font-semibold text-[#2b3674]">{viewing.address || "—"}</span>
                  </div>
                  <div className="col-span-1 md:col-span-2 lg:col-span-3">
                    <span className="text-xs text-muted-foreground block mb-1">Médico Asignado</span>
                    <span className="font-semibold text-[#2b3674]">{doctorMap.get(viewing.assigned_doctor_id ?? "") || "Sin asignar"}</span>
                  </div>
                  {viewing.consultation_reason && (
                    <div className="col-span-1 md:col-span-2 lg:col-span-3 bg-muted/30 p-4 rounded-2xl">
                      <span className="text-xs text-muted-foreground block mb-2">Motivo de Consulta</span>
                      <span className="font-medium text-sm text-[#2b3674] whitespace-pre-wrap">{viewing.consultation_reason}</span>
                    </div>
                  )}
                  {viewing.current_illness && (
                    <div className="col-span-1 md:col-span-2 lg:col-span-3 bg-muted/30 p-4 rounded-2xl">
                      <span className="text-xs text-muted-foreground block mb-2">Enfermedad Actual</span>
                      <span className="font-medium text-sm text-[#2b3674] whitespace-pre-wrap">{viewing.current_illness}</span>
                    </div>
                  )}
                  {viewing.notes && (
                    <div className="col-span-1 md:col-span-2 lg:col-span-3">
                      <span className="text-xs text-muted-foreground block mb-2">Notas generales</span>
                      <span className="font-medium text-sm text-[#2b3674] whitespace-pre-wrap">{viewing.notes}</span>
                    </div>
                  )}
                </div>
              </TabsContent>

              {/* TAB 2: ANTECEDENTES */}
              <TabsContent value="antecedentes" className="space-y-6 outline-none">
                <div className="space-y-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-mauve">Antecedentes Familiares</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm bg-muted/20 border border-border/40 p-5 rounded-3xl">
                    <div>
                      <span className="text-xs text-muted-foreground block mb-1">Madre</span>
                      <span className="font-semibold text-[#2b3674]">{viewing.family_history?.mother || "Niega / Sano"}</span>
                    </div>
                    <div>
                      <span className="text-xs text-muted-foreground block mb-1">Padre</span>
                      <span className="font-semibold text-[#2b3674]">{viewing.family_history?.father || "Niega / Sano"}</span>
                    </div>
                    <div>
                      <span className="text-xs text-muted-foreground block mb-1">Hermanos</span>
                      <span className="font-semibold text-[#2b3674]">{viewing.family_history?.siblings || "Niega / Sano"}</span>
                    </div>
                    <div>
                      <span className="text-xs text-muted-foreground block mb-1">Hijos</span>
                      <span className="font-semibold text-[#2b3674]">{viewing.family_history?.children || "Niega / Sano"}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-mauve">Antecedentes Personales Patológicos y Hábitos</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm bg-muted/20 border border-border/40 p-5 rounded-3xl">
                    <div>
                      <span className="text-xs text-muted-foreground block mb-1">Tabaco</span>
                      <span className="font-semibold text-[#2b3674]">{viewing.personal_history?.tobacco || "NIEGA"}</span>
                    </div>
                    <div>
                      <span className="text-xs text-muted-foreground block mb-1">Alcohol</span>
                      <span className="font-semibold text-[#2b3674]">{viewing.personal_history?.alcohol || "NIEGA"}</span>
                    </div>
                    <div>
                      <span className="text-xs text-muted-foreground block mb-1">Drogas</span>
                      <span className="font-semibold text-[#2b3674]">{viewing.personal_history?.drugs || "NIEGA"}</span>
                    </div>
                    <div>
                      <span className="text-xs text-muted-foreground block mb-1">Patología de Base</span>
                      <span className="font-semibold text-[#2b3674]">{viewing.personal_history?.base_pathology || "Niega"}</span>
                    </div>
                    <div className="col-span-2">
                      <span className="text-xs text-muted-foreground block mb-1">Quirúrgicos / Operaciones</span>
                      <span className="font-semibold text-[#2b3674]">{viewing.personal_history?.surgical || "Niega"}</span>
                    </div>
                    <div className="col-span-2">
                      <span className="text-xs text-muted-foreground block mb-1">Alérgicos</span>
                      <span className="font-semibold text-destructive">{viewing.personal_history?.allergies || "Niega"}</span>
                    </div>
                  </div>
                </div>
              </TabsContent>

              {/* TAB 3: GINECOLOGICO */}
              <TabsContent value="ginecologia" className="space-y-4 outline-none">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-sm bg-muted/20 border border-border/40 p-6 rounded-3xl">
                  <div>
                    <span className="text-xs text-muted-foreground block mb-1">Menarquía (Edad primera menstruación)</span>
                    <span className="font-semibold text-[#2b3674]">{viewing.gynecological_data?.menarche || "—"}</span>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground block mb-1">Sexarquía (Edad inicio relaciones sexuales)</span>
                    <span className="font-semibold text-[#2b3674]">{viewing.gynecological_data?.sexarche || "—"}</span>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground block mb-1">Ciclo Menstrual</span>
                    <span className="font-semibold text-[#2b3674]">{viewing.gynecological_data?.menstrual_cycle || "—"}</span>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground block mb-1">Dismenorrea (Menstruación dolorosa)</span>
                    <span className="font-semibold text-[#2b3674]">{viewing.gynecological_data?.dysmenorrhea || "—"}</span>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground block mb-1">NPS (Número parejas sexuales)</span>
                    <span className="font-semibold text-[#2b3674]">{viewing.gynecological_data?.nps || "—"}</span>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground block mb-1">ITS (Infecciones de Transmisión Sexual)</span>
                    <span className="font-semibold text-[#2b3674]">{viewing.gynecological_data?.its || "—"}</span>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground block mb-1">Última Citología</span>
                    <span className="font-semibold text-[#2b3674]">{viewing.gynecological_data?.cytology || "—"}</span>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground block mb-1">Anticonceptivos</span>
                    <span className="font-semibold text-[#2b3674]">{viewing.gynecological_data?.contraceptives || "—"}</span>
                  </div>
                </div>
              </TabsContent>

              {/* TAB 4: OBSTETRICO */}
              <TabsContent value="obstetricia" className="space-y-6 outline-none">
                <div className="grid grid-cols-4 gap-4 text-sm bg-muted/20 border border-border/40 p-6 rounded-3xl">
                  <div className="text-center">
                    <span className="text-xs text-muted-foreground block mb-1 uppercase tracking-wider">Gestas</span>
                    <span className="font-bold text-2xl text-mauve">{viewing.obstetric_data?.g ?? 0}</span>
                  </div>
                  <div className="text-center">
                    <span className="text-xs text-muted-foreground block mb-1 uppercase tracking-wider">Partos</span>
                    <span className="font-bold text-2xl text-mauve">{viewing.obstetric_data?.p ?? 0}</span>
                  </div>
                  <div className="text-center">
                    <span className="text-xs text-muted-foreground block mb-1 uppercase tracking-wider">Cesáreas</span>
                    <span className="font-bold text-2xl text-mauve">{viewing.obstetric_data?.c ?? 0}</span>
                  </div>
                  <div className="text-center">
                    <span className="text-xs text-muted-foreground block mb-1 uppercase tracking-wider">Abortos</span>
                    <span className="font-bold text-2xl text-mauve">{viewing.obstetric_data?.a ?? 0}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-sm bg-muted/20 border border-border/40 p-6 rounded-3xl">
                  <div>
                    <span className="text-xs text-muted-foreground block mb-1">PIG (Período Intergenésico)</span>
                    <span className="font-semibold text-[#2b3674]">{viewing.obstetric_data?.pig || "—"}</span>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground block mb-1">Embarazos Múltiples</span>
                    <span className="font-semibold text-[#2b3674]">{viewing.obstetric_data?.em ?? "0"}</span>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground block mb-1">Embarazos Ectópicos</span>
                    <span className="font-semibold text-[#2b3674]">{viewing.obstetric_data?.ee ?? "0"}</span>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground block mb-1">Complicaciones Obstétricas</span>
                    <span className="font-semibold text-[#2b3674]">{viewing.obstetric_data?.complications || "Ninguna"}</span>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground block mb-1">FUM (Fecha Última Menstruación)</span>
                    <span className="font-semibold text-[#2b3674]">{viewing.obstetric_data?.fum || "—"}</span>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground block mb-1">EG (Edad Gestacional)</span>
                    <span className="font-semibold text-[#2b3674]">{viewing.obstetric_data?.eg || "—"}</span>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground block mb-1">FPP (Fecha Probable de Parto)</span>
                    <span className="font-semibold text-mauve">{viewing.obstetric_data?.fpp || "—"}</span>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground block mb-1">Número de Consultas Control</span>
                    <span className="font-semibold text-[#2b3674]">{viewing.obstetric_data?.num_consultations || "—"}</span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-xs text-muted-foreground block mb-1">Vacunas</span>
                    <span className="font-semibold text-[#2b3674]">{viewing.obstetric_data?.vaccines || "—"}</span>
                  </div>
                </div>
              </TabsContent>

              {/* TAB 5: CONSULTAS */}
              <TabsContent value="consultas" className="space-y-4 outline-none">
                <PatientConsultationsPanel patientId={viewing.id} />
              </TabsContent>

              {/* TAB 6: NOTAS CLINICAS */}
              <TabsContent value="notas" className="space-y-4 outline-none">
                <ClinicalNotesPanel patientId={viewing.id} />
              </TabsContent>

              {/* TAB 7: TIMELINE */}
              <TabsContent value="timeline" className="space-y-4 outline-none">
                <div className="max-w-2xl">
                  <PatientTimeline patientId={viewing.id} />
                </div>
              </TabsContent>
            </div>
          </Tabs>

        </div>
      </div>

      {/* Dialog Constancia de Reposo */}
      <Dialog open={openReposo} onOpenChange={setOpenReposo}>
        <DialogContent className="rounded-3xl sm:max-w-md bg-card p-6 border border-muted/50 shadow-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-1.5"><Printer className="h-5 w-5 text-mauve" /> Constancia de Reposo</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3 py-2 text-sm">
            <div className="grid gap-1">
              <Label htmlFor="rp-days">Días de reposo</Label>
              <Input
                id="rp-days"
                type="number"
                min="1"
                max="90"
                value={reposoDays}
                onChange={(e) => setReposoDays(e.target.value)}
                className="rounded-xl"
              />
            </div>
            <div className="grid gap-1">
              <Label htmlFor="rp-start">Fecha de inicio</Label>
              <Input
                id="rp-start"
                type="date"
                value={reposoStart}
                onChange={(e) => setReposoStart(e.target.value)}
                className="rounded-xl"
              />
            </div>
            <div className="grid gap-1">
              <Label htmlFor="rp-reason">Diagnóstico / Motivo de reposo</Label>
              <Textarea
                id="rp-reason"
                value={reposoReason}
                onChange={(e) => setReposoReason(e.target.value)}
                placeholder="Escribe el diagnóstico médico o motivo..."
                className="rounded-xl min-h-[70px]"
              />
            </div>

            <div className="border-t border-border/60 pt-3 mt-1 space-y-2.5">
              <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Datos de Firma del Médico</p>
              <div className="grid gap-1">
                <Label htmlFor="rp-doc-uni">Universidad / Título Adicional</Label>
                <Input
                  id="rp-doc-uni"
                  placeholder="Ej. UC-CHET"
                  value={doctorUni}
                  onChange={(e) => setDoctorUni(e.target.value)}
                  className="rounded-xl text-xs h-9"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="grid gap-1">
                  <Label htmlFor="rp-doc-mpps">Registro MPPS</Label>
                  <Input
                    id="rp-doc-mpps"
                    placeholder="Ej. 102.927"
                    value={doctorMpps}
                    onChange={(e) => setDoctorMpps(e.target.value)}
                    className="rounded-xl text-xs h-9"
                  />
                </div>
                <div className="grid gap-1">
                  <Label htmlFor="rp-doc-cmc">Registro CMC</Label>
                  <Input
                    id="rp-doc-cmc"
                    placeholder="Ej. 11.619"
                    value={doctorCmc}
                    onChange={(e) => setDoctorCmc(e.target.value)}
                    className="rounded-xl text-xs h-9"
                  />
                </div>
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-2 border-t border-border/60 pt-3 mt-2">
            <Button variant="ghost" onClick={() => setOpenReposo(false)} className="rounded-xl">Cancelar</Button>
            <Button onClick={() => viewing && handleExportReposo(viewing)} className="rounded-xl bg-gradient-to-r from-mauve to-mauve-soft text-primary-foreground shadow-sm shadow-mauve/30">
              Generar PDF
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog Constancia de Atención */}
      <Dialog open={openAtencion} onOpenChange={setOpenAtencion}>
        <DialogContent className="rounded-3xl sm:max-w-md bg-card p-6 border border-muted/50 shadow-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-1.5"><Printer className="h-5 w-5 text-mauve" /> Constancia de Atención</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3 py-2 text-sm">
            <div className="grid gap-1">
              <Label htmlFor="at-date">Fecha de consulta</Label>
              <Input
                id="at-date"
                type="date"
                value={atencionDate}
                onChange={(e) => setAtencionDate(e.target.value)}
                className="rounded-xl"
              />
            </div>
            <div className="grid gap-1">
              <Label htmlFor="at-time">Hora de consulta</Label>
              <Input
                id="at-time"
                type="time"
                value={atencionTime}
                onChange={(e) => setAtencionTime(e.target.value)}
                className="rounded-xl"
              />
            </div>
            <div className="grid gap-1">
              <Label htmlFor="at-reason">Concepto de la consulta</Label>
              <Textarea
                id="at-reason"
                value={atencionReason}
                onChange={(e) => setAtencionReason(e.target.value)}
                placeholder="Escribe el concepto..."
                className="rounded-xl min-h-[70px]"
              />
            </div>

            <div className="border-t border-border/60 pt-3 mt-1 space-y-2.5">
              <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Datos de Firma del Médico</p>
              <div className="grid gap-1">
                <Label htmlFor="at-doc-uni">Universidad / Título Adicional</Label>
                <Input
                  id="at-doc-uni"
                  placeholder="Ej. UC-CHET"
                  value={doctorUni}
                  onChange={(e) => setDoctorUni(e.target.value)}
                  className="rounded-xl text-xs h-9"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="grid gap-1">
                  <Label htmlFor="at-doc-mpps">Registro MPPS</Label>
                  <Input
                    id="at-doc-mpps"
                    placeholder="Ej. 102.927"
                    value={doctorMpps}
                    onChange={(e) => setDoctorMpps(e.target.value)}
                    className="rounded-xl text-xs h-9"
                  />
                </div>
                <div className="grid gap-1">
                  <Label htmlFor="at-doc-cmc">Registro CMC</Label>
                  <Input
                    id="at-doc-cmc"
                    placeholder="Ej. 11.619"
                    value={doctorCmc}
                    onChange={(e) => setDoctorCmc(e.target.value)}
                    className="rounded-xl text-xs h-9"
                  />
                </div>
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-2 border-t border-border/60 pt-3 mt-2">
            <Button variant="ghost" onClick={() => setOpenAtencion(false)} className="rounded-xl">Cancelar</Button>
            <Button onClick={() => viewing && handleExportAtencion(viewing)} className="rounded-xl bg-gradient-to-r from-mauve to-mauve-soft text-primary-foreground shadow-sm shadow-mauve/30">
              Generar PDF
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
