import { createFileRoute, Link } from '@tanstack/react-router'
import { useState } from "react"
import { 
  ArrowLeft, FileDown, FileText, Printer, Loader2, User, Calendar, Phone, Mail, 
  MapPin, Briefcase, GraduationCap, HeartPulse, Baby, Stethoscope, Clock, 
  StickyNote, Activity, AlertCircle, Sparkles, FileSpreadsheet, ShieldCheck, Heart
} from "lucide-react"
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

const calculateAge = (dob: string | Date | undefined | null) => {
  if (!dob) return "—";
  const birthDate = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
};
import { generateFichaPDF } from "@/lib/utils/pdf"
import { generateReposoPDF, generateAtencionPDF, generateJustificativoPDF } from "@/lib/utils/reportsPdf"
import { AppSidebar } from "@/components/AppSidebar"

export const Route = createFileRoute('/_authenticated/pacientes/$patientId')({
  component: PatientDetailRoute,
})

const tagBg: Record<string, string> = {
  "activo": "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
  "nuevo": "bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20",
  "alta": "bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20",
  "reposo": "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
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
  const [openJustificativo, setOpenJustificativo] = useState(false);

  const [reposoDays, setReposoDays] = useState("3");
  const [reposoStart, setReposoStart] = useState("");
  const [reposoReason, setReposoReason] = useState("");

  const [atencionDate, setAtencionDate] = useState("");
  const [atencionTime, setAtencionTime] = useState("");
  const [atencionReason, setAtencionReason] = useState("");

  const [justificativoDate, setJustificativoDate] = useState("");
  const [justificativoReason, setJustificativoReason] = useState("");

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

  const handleOpenJustificativoDialog = (p: any) => {
    setJustificativoDate(new Date().toISOString().slice(0, 10));
    setDoctorUni("UC-CHET");
    setDoctorMpps("");
    setDoctorCmc("");
    setJustificativoReason(p.diagnosis || p.current_illness || p.consultation_reason || "Evaluación médica de rutina");
    setOpenJustificativo(true);
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

  const handleExportJustificativo = (p: any) => {
    generateJustificativoPDF({
      patientName: p.full_name,
      patientId: p.document_id || "",
      date: justificativoDate,
      justificationText: justificativoReason,
      doctorName: "Dra. Carli Sole Aquino",
      doctorUniversity: doctorUni,
      doctorMpps,
      doctorCmc,
    });
    setOpenJustificativo(false);
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
      <div className="flex-1 flex flex-col items-center justify-center gap-4 py-20">
        <p className="text-muted-foreground font-medium">Paciente no encontrado.</p>
        <Link to="/pacientes">
          <Button variant="outline" className="rounded-xl">Volver a pacientes</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="p-4 sm:p-6 md:p-8 max-w-6xl mx-auto w-full bg-card/60 backdrop-blur-md rounded-[2.5rem] border border-border/40 shadow-sm">
          {/* Header Banner & Navigation */}
          <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-3">
              <Link to="/pacientes">
                <Button variant="ghost" size="icon" className="h-10 w-10 rounded-2xl bg-background/80 border border-border/40 shadow-sm hover:bg-muted/80 transition-all duration-200">
                  <ArrowLeft className="h-5 w-5 text-muted-foreground" />
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-black tracking-tight text-foreground flex items-center gap-2">
                  Expediente Clínico
                  <Sparkles className="h-4 w-4 text-primary/70 animate-pulse" />
                </h1>
                <p className="text-xs text-muted-foreground font-medium">
                  Historial médico centralizado, antecedentes y registro evolutivo.
                </p>
              </div>
            </div>
            
            <div className="ml-auto flex items-center gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button className="rounded-2xl flex items-center gap-2 h-10 px-4 font-bold text-xs bg-primary text-primary-foreground shadow-md shadow-primary/20 hover:bg-primary/90 transition-all duration-200 cursor-pointer">
                    <FileDown className="h-4 w-4" /> Exportar Documentos
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="rounded-2xl bg-popover/95 backdrop-blur-md border border-border/50 p-2 shadow-2xl min-w-[200px]" align="end">
                  <DropdownMenuItem onClick={() => handleExportFicha(viewing)} className="rounded-xl cursor-pointer text-xs font-semibold flex items-center gap-2 px-3 py-2.5 hover:bg-muted/80 transition-colors">
                    <FileText className="h-4 w-4 text-primary" /> Ficha Médica Completa
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleOpenReposoDialog(viewing)} className="rounded-xl cursor-pointer text-xs font-semibold flex items-center gap-2 px-3 py-2.5 hover:bg-muted/80 transition-colors">
                    <Printer className="h-4 w-4 text-emerald-500" /> Constancia de Reposo
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleOpenAtencionDialog(viewing)} className="rounded-xl cursor-pointer text-xs font-semibold flex items-center gap-2 px-3 py-2.5 hover:bg-muted/80 transition-colors">
                    <Printer className="h-4 w-4 text-sky-500" /> Constancia de Atención
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleOpenJustificativoDialog(viewing)} className="rounded-xl cursor-pointer text-xs font-semibold flex items-center gap-2 px-3 py-2.5 hover:bg-muted/80 transition-colors">
                    <Printer className="h-4 w-4 text-amber-500" /> Justificativo Médico
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Premium Patient Banner Card */}
          <div className="relative overflow-hidden bg-card/60 backdrop-blur-xl border border-border/50 p-6 rounded-[2rem] shadow-sm mb-6 transition-all duration-300">
            <div className="absolute top-0 right-0 -mt-12 -mr-12 w-48 h-48 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
            
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 relative z-10">
              <div className="flex items-center gap-5">
                <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-3xl bg-gradient-to-br from-primary via-primary/80 to-primary/60 text-primary-foreground font-black text-2xl shadow-lg shadow-primary/20 border-2 border-white/20">
                  {getInitials(viewing.full_name)}
                </div>
                
                <div className="space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <h2 className="text-2xl font-bold text-foreground tracking-tight">{viewing.full_name}</h2>
                    <span className={cn("inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold border shadow-xs", tagBg[viewing.status] || "bg-muted text-muted-foreground border-border/40")}>
                      <span className="h-1.5 w-1.5 rounded-full bg-current animate-pulse" />
                      {statusLabel(viewing.status)}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground font-medium">
                    <span className="flex items-center gap-1">
                      <ShieldCheck className="h-3.5 w-3.5 text-primary" />
                      C.I. <strong className="text-foreground font-semibold">{viewing.document_id || "Sin Cédula"}</strong>
                    </span>
                    {viewing.historia_number && (
                      <span className="flex items-center gap-1 bg-muted/60 px-2.5 py-0.5 rounded-lg text-foreground font-bold border border-border/30">
                        Nº Historia: #{viewing.historia_number}
                      </span>
                    )}
                    {viewing.phone && (
                      <span className="flex items-center gap-1 text-muted-foreground">
                        <Phone className="h-3.5 w-3.5 text-primary/70" /> {viewing.phone}
                      </span>
                    )}
                    {viewing.email && (
                      <span className="flex items-center gap-1 text-muted-foreground">
                        <Mail className="h-3.5 w-3.5 text-primary/70" /> {viewing.email}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Quick Metrics Badge */}
              <div className="flex items-center gap-3 self-stretch sm:self-auto justify-around sm:justify-end bg-background/50 border border-border/40 p-3 rounded-2xl">
                <div className="text-center px-3 border-r border-border/40">
                  <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider block">Edad</span>
                  <span className="text-sm font-black text-foreground">
                    {viewing.birth_date ? `${calculateAge(viewing.birth_date)} yrs` : "—"}
                  </span>
                </div>
                <div className="text-center px-3">
                  <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider block">Médico</span>
                  <span className="text-xs font-bold text-primary truncate max-w-[120px] block">
                    {doctorMap.get(viewing.assigned_doctor_id ?? "") || "Sin asignar"}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Styled Navigation Tabs */}
          <Tabs defaultValue="general" className="flex-1 flex flex-col min-h-0">
            <TabsList className="flex flex-wrap w-full bg-muted/40 p-1.5 rounded-2xl mb-6 border border-border/40 gap-1.5 h-auto">
              <TabsTrigger value="general" className="rounded-xl font-bold text-xs py-2.5 px-3.5 flex items-center gap-2 data-[state=active]:bg-card data-[state=active]:text-primary data-[state=active]:shadow-sm transition-all">
                <User className="h-3.5 w-3.5" /> Identificación
              </TabsTrigger>
              <TabsTrigger value="antecedentes" className="rounded-xl font-bold text-xs py-2.5 px-3.5 flex items-center gap-2 data-[state=active]:bg-card data-[state=active]:text-primary data-[state=active]:shadow-sm transition-all">
                <FileSpreadsheet className="h-3.5 w-3.5" /> Antecedentes
              </TabsTrigger>
              <TabsTrigger value="ginecologia" className="rounded-xl font-bold text-xs py-2.5 px-3.5 flex items-center gap-2 data-[state=active]:bg-card data-[state=active]:text-primary data-[state=active]:shadow-sm transition-all">
                <Heart className="h-3.5 w-3.5" /> Ginecológico
              </TabsTrigger>
              <TabsTrigger value="obstetricia" className="rounded-xl font-bold text-xs py-2.5 px-3.5 flex items-center gap-2 data-[state=active]:bg-card data-[state=active]:text-primary data-[state=active]:shadow-sm transition-all">
                <Baby className="h-3.5 w-3.5" /> Obstétrico
              </TabsTrigger>
              <TabsTrigger value="consultas" className="rounded-xl font-bold text-xs py-2.5 px-3.5 flex items-center gap-2 data-[state=active]:bg-card data-[state=active]:text-primary data-[state=active]:shadow-sm transition-all">
                <Stethoscope className="h-3.5 w-3.5" /> Consultas
              </TabsTrigger>
              <TabsTrigger value="timeline" className="rounded-xl font-bold text-xs py-2.5 px-3.5 flex items-center gap-2 data-[state=active]:bg-card data-[state=active]:text-primary data-[state=active]:shadow-sm transition-all">
                <Clock className="h-3.5 w-3.5" /> Timeline
              </TabsTrigger>
              <TabsTrigger value="notas" className="rounded-xl font-bold text-xs py-2.5 px-3.5 flex items-center gap-2 data-[state=active]:bg-card data-[state=active]:text-primary data-[state=active]:shadow-sm transition-all">
                <StickyNote className="h-3.5 w-3.5" /> Notas Clínicas
              </TabsTrigger>
            </TabsList>

            <div className="flex-1 pb-10">
              {/* TAB 1: GENERAL / IDENTIFICATION */}
              <TabsContent value="general" className="space-y-6 outline-none animate-fade-in">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  {/* Card 1: Datos Personales */}
                  <div className="bg-card/90 dark:bg-muted/15 border border-border/60 p-5 rounded-3xl space-y-4 shadow-sm hover:border-primary/30 transition-all">
                    <div className="flex items-center gap-2 pb-3 border-b border-border/40">
                      <User className="h-4 w-4 text-primary" />
                      <h3 className="text-xs font-bold uppercase tracking-wider text-primary">Datos Personales</h3>
                    </div>
                    <div className="space-y-3.5 text-xs">
                      <div>
                        <span className="text-[11px] text-muted-foreground font-medium block mb-0.5">Nombre Completo</span>
                        <span className="font-bold text-foreground text-sm">{viewing.full_name}</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <span className="text-[11px] text-muted-foreground font-medium block mb-0.5">Cédula</span>
                          <span className="font-bold text-foreground">{viewing.document_id || "—"}</span>
                        </div>
                        <div>
                          <span className="text-[11px] text-muted-foreground font-medium block mb-0.5">Edad</span>
                          <span className="font-bold text-foreground">
                            {viewing.birth_date ? `${calculateAge(viewing.birth_date)} años` : "—"}
                          </span>
                        </div>
                      </div>
                      <div>
                        <span className="text-[11px] text-muted-foreground font-medium block mb-0.5">Fecha de Nacimiento</span>
                        <span className="font-bold text-foreground">{viewing.birth_date || "—"}</span>
                      </div>
                      <div>
                        <span className="text-[11px] text-muted-foreground font-medium block mb-0.5">Lugar de Nacimiento</span>
                        <span className="font-bold text-foreground">{viewing.birthplace || "—"}</span>
                      </div>
                    </div>
                  </div>

                  {/* Card 2: Contacto y Demografía */}
                  <div className="bg-card/90 dark:bg-muted/15 border border-border/60 p-5 rounded-3xl space-y-4 shadow-sm hover:border-primary/30 transition-all">
                    <div className="flex items-center gap-2 pb-3 border-b border-border/40">
                      <MapPin className="h-4 w-4 text-primary" />
                      <h3 className="text-xs font-bold uppercase tracking-wider text-primary">Contacto y Demografía</h3>
                    </div>
                    <div className="space-y-3.5 text-xs">
                      <div>
                        <span className="text-[11px] text-muted-foreground font-medium block mb-0.5">Teléfono Principal</span>
                        <span className="font-bold text-foreground">{viewing.phone || "—"}</span>
                      </div>
                      <div>
                        <span className="text-[11px] text-muted-foreground font-medium block mb-0.5">Correo Electrónico</span>
                        <span className="font-bold text-foreground truncate block">{viewing.email || "—"}</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <span className="text-[11px] text-muted-foreground font-medium block mb-0.5">Estado Civil</span>
                          <span className="font-bold text-foreground">{viewing.marital_status || "—"}</span>
                        </div>
                        <div>
                          <span className="text-[11px] text-muted-foreground font-medium block mb-0.5">Instrucción</span>
                          <span className="font-bold text-foreground">{viewing.education_level || "—"}</span>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <span className="text-[11px] text-muted-foreground font-medium block mb-0.5">Ocupación</span>
                          <span className="font-bold text-foreground">{viewing.occupation || "—"}</span>
                        </div>
                        <div>
                          <span className="text-[11px] text-muted-foreground font-medium block mb-0.5">Etnia</span>
                          <span className="font-bold text-foreground">{viewing.ethnicity || "—"}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Card 3: Expediente e Ingreso */}
                  <div className="bg-card/90 dark:bg-muted/15 border border-border/60 p-5 rounded-3xl space-y-4 shadow-sm hover:border-primary/30 transition-all">
                    <div className="flex items-center gap-2 pb-3 border-b border-border/40">
                      <Activity className="h-4 w-4 text-primary" />
                      <h3 className="text-xs font-bold uppercase tracking-wider text-primary">Registro Clínico</h3>
                    </div>
                    <div className="space-y-3.5 text-xs">
                      <div>
                        <span className="text-[11px] text-muted-foreground font-medium block mb-0.5">Fecha Primera Cita</span>
                        <span className="font-bold text-foreground">{viewing.first_visit_date || "—"}</span>
                      </div>
                      <div>
                        <span className="text-[11px] text-muted-foreground font-medium block mb-0.5">Médico Asignado</span>
                        <span className="font-bold text-primary">{doctorMap.get(viewing.assigned_doctor_id ?? "") || "Sin asignar"}</span>
                      </div>
                      <div>
                        <span className="text-[11px] text-muted-foreground font-medium block mb-0.5">Dirección de Domicilio</span>
                        <span className="font-bold text-foreground">{viewing.address || "No registrada"}</span>
                      </div>
                    </div>
                  </div>

                  {/* Full-width Motivo / Enfermedad Actual */}
                  {(viewing.consultation_reason || viewing.current_illness || viewing.notes) && (
                    <div className="col-span-1 md:col-span-3 grid grid-cols-1 md:grid-cols-2 gap-4">
                      {viewing.consultation_reason && (
                        <div className="bg-primary/5 border border-primary/10 p-4 rounded-2xl">
                          <span className="text-xs font-bold uppercase tracking-wider text-primary block mb-1.5">Motivo de Consulta Inicial</span>
                          <p className="text-xs font-medium text-foreground whitespace-pre-wrap leading-relaxed">{viewing.consultation_reason}</p>
                        </div>
                      )}
                      {viewing.current_illness && (
                        <div className="bg-primary/5 border border-primary/10 p-4 rounded-2xl">
                          <span className="text-xs font-bold uppercase tracking-wider text-primary block mb-1.5">Enfermedad Actual</span>
                          <p className="text-xs font-medium text-foreground whitespace-pre-wrap leading-relaxed">{viewing.current_illness}</p>
                        </div>
                      )}
                      {viewing.notes && (
                        <div className="col-span-1 md:col-span-2 bg-muted/40 border border-border/40 p-4 rounded-2xl">
                          <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground block mb-1.5">Notas Administrativas</span>
                          <p className="text-xs font-medium text-foreground whitespace-pre-wrap leading-relaxed">{viewing.notes}</p>
                        </div>
                      )}
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
                      <span className="font-semibold text-foreground">{viewing.family_history?.mother || "Niega / Sano"}</span>
                    </div>
                    <div>
                      <span className="text-xs text-muted-foreground block mb-1">Padre</span>
                      <span className="font-semibold text-foreground">{viewing.family_history?.father || "Niega / Sano"}</span>
                    </div>
                    <div>
                      <span className="text-xs text-muted-foreground block mb-1">Hermanos</span>
                      <span className="font-semibold text-foreground">{viewing.family_history?.siblings || "Niega / Sano"}</span>
                    </div>
                    <div>
                      <span className="text-xs text-muted-foreground block mb-1">Hijos</span>
                      <span className="font-semibold text-foreground">{viewing.family_history?.children || "Niega / Sano"}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-mauve">Antecedentes Personales Patológicos y Hábitos</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm bg-muted/20 border border-border/40 p-5 rounded-3xl">
                    <div>
                      <span className="text-xs text-muted-foreground block mb-1">Tabaco</span>
                      <span className="font-semibold text-foreground">{viewing.personal_history?.tobacco || "NIEGA"}</span>
                    </div>
                    <div>
                      <span className="text-xs text-muted-foreground block mb-1">Alcohol</span>
                      <span className="font-semibold text-foreground">{viewing.personal_history?.alcohol || "NIEGA"}</span>
                    </div>
                    <div>
                      <span className="text-xs text-muted-foreground block mb-1">Drogas</span>
                      <span className="font-semibold text-foreground">{viewing.personal_history?.drugs || "NIEGA"}</span>
                    </div>
                    <div>
                      <span className="text-xs text-muted-foreground block mb-1">Patología de Base</span>
                      <span className="font-semibold text-foreground">{viewing.personal_history?.base_pathology || "Niega"}</span>
                    </div>
                    <div className="col-span-2">
                      <span className="text-xs text-muted-foreground block mb-1">Quirúrgicos / Operaciones</span>
                      <span className="font-semibold text-foreground">{viewing.personal_history?.surgical || "Niega"}</span>
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
                    <span className="font-semibold text-foreground">{viewing.gynecological_data?.menarche || "—"}</span>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground block mb-1">Sexarquía (Edad inicio relaciones sexuales)</span>
                    <span className="font-semibold text-foreground">{viewing.gynecological_data?.sexarche || "—"}</span>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground block mb-1">Ciclo Menstrual</span>
                    <span className="font-semibold text-foreground">{viewing.gynecological_data?.menstrual_cycle || "—"}</span>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground block mb-1">Dismenorrea (Menstruación dolorosa)</span>
                    <span className="font-semibold text-foreground">{viewing.gynecological_data?.dysmenorrhea || "—"}</span>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground block mb-1">NPS (Número parejas sexuales)</span>
                    <span className="font-semibold text-foreground">{viewing.gynecological_data?.nps || "—"}</span>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground block mb-1">ITS (Infecciones de Transmisión Sexual)</span>
                    <span className="font-semibold text-foreground">{viewing.gynecological_data?.its || "—"}</span>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground block mb-1">Última Citología</span>
                    <span className="font-semibold text-foreground">{viewing.gynecological_data?.cytology || "—"}</span>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground block mb-1">Anticonceptivos</span>
                    <span className="font-semibold text-foreground">{viewing.gynecological_data?.contraceptives || "—"}</span>
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
                    <span className="font-semibold text-foreground">{viewing.obstetric_data?.pig || "—"}</span>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground block mb-1">Embarazos Múltiples</span>
                    <span className="font-semibold text-foreground">{viewing.obstetric_data?.em ?? "0"}</span>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground block mb-1">Embarazos Ectópicos</span>
                    <span className="font-semibold text-foreground">{viewing.obstetric_data?.ee ?? "0"}</span>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground block mb-1">Complicaciones Obstétricas</span>
                    <span className="font-semibold text-foreground">{viewing.obstetric_data?.complications || "Ninguna"}</span>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground block mb-1">FUM (Fecha Última Menstruación)</span>
                    <span className="font-semibold text-foreground">{viewing.obstetric_data?.fum || "—"}</span>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground block mb-1">EG (Edad Gestacional)</span>
                    <span className="font-semibold text-foreground">{viewing.obstetric_data?.eg || "—"}</span>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground block mb-1">FPP (Fecha Probable de Parto)</span>
                    <span className="font-semibold text-mauve">{viewing.obstetric_data?.fpp || "—"}</span>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground block mb-1">Número de Consultas Control</span>
                    <span className="font-semibold text-foreground">{viewing.obstetric_data?.num_consultations || "—"}</span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-xs text-muted-foreground block mb-1">Vacunas</span>
                    <span className="font-semibold text-foreground">{viewing.obstetric_data?.vaccines || "—"}</span>
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

      {/* Dialog Justificativo Médico */}
      <Dialog open={openJustificativo} onOpenChange={setOpenJustificativo}>
        <DialogContent className="rounded-3xl sm:max-w-md bg-card p-6 border border-muted/50 shadow-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-1.5"><Printer className="h-5 w-5 text-mauve" /> Justificativo Médico</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3 py-2 text-sm">
            <div className="grid gap-1">
              <Label htmlFor="jus-date">Fecha</Label>
              <Input
                id="jus-date"
                type="date"
                value={justificativoDate}
                onChange={(e) => setJustificativoDate(e.target.value)}
                className="rounded-xl"
              />
            </div>
            <div className="grid gap-1">
              <Label htmlFor="jus-reason">Motivo / Justificación Médica</Label>
              <Textarea
                id="jus-reason"
                value={justificativoReason}
                onChange={(e) => setJustificativoReason(e.target.value)}
                placeholder="Escribe el motivo o diagnóstico..."
                className="rounded-xl min-h-[90px]"
              />
            </div>

            <div className="border-t border-border/60 pt-3 mt-1 space-y-2.5">
              <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Datos de Firma del Médico</p>
              <div className="grid gap-1">
                <Label htmlFor="jus-doc-uni">Universidad / Título Adicional</Label>
                <Input
                  id="jus-doc-uni"
                  placeholder="Ej. UC-CHET"
                  value={doctorUni}
                  onChange={(e) => setDoctorUni(e.target.value)}
                  className="rounded-xl text-xs h-9"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="grid gap-1">
                  <Label htmlFor="jus-doc-mpps">Registro MPPS</Label>
                  <Input
                    id="jus-doc-mpps"
                    placeholder="Ej. 102.927"
                    value={doctorMpps}
                    onChange={(e) => setDoctorMpps(e.target.value)}
                    className="rounded-xl text-xs h-9"
                  />
                </div>
                <div className="grid gap-1">
                  <Label htmlFor="jus-doc-cmc">Registro CMC</Label>
                  <Input
                    id="jus-doc-cmc"
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
            <Button variant="ghost" onClick={() => setOpenJustificativo(false)} className="rounded-xl">Cancelar</Button>
            <Button onClick={() => viewing && handleExportJustificativo(viewing)} className="rounded-xl bg-gradient-to-r from-mauve to-mauve-soft text-primary-foreground shadow-sm shadow-mauve/30">
              Generar PDF
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      </div>
    </div>
  )
}
