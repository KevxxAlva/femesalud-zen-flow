import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { FileDown, FileText, Printer } from "lucide-react";
import { cn } from "@/lib/utils";
import { calculateAge } from "@/lib/utils/recipePdf";
import type { Patient } from "@/lib/api/patients";
import { ClinicalNotesPanel } from "@/components/ClinicalNotesPanel";
import { PatientTimeline } from "@/components/PatientTimeline";
import { PatientAttachmentsGallery } from "@/components/PatientAttachmentsGallery";

interface PatientDetailDialogProps {
  viewing: Patient | null;
  setViewing: (p: Patient | null) => void;
  doctorMap: Map<string, string>;
  tagBg: Record<string, string>;
  statusLabel: (s: string) => string;
  initials: (n: string) => string;
  handleExportFicha: (p: Patient) => void;
  handleOpenReposoDialog: (p: Patient) => void;
  handleOpenAtencionDialog: (p: Patient) => void;
  handleOpenJustificativoDialog: (p: Patient) => void;
}

export const PatientDetailDialog = React.memo(function PatientDetailDialog({
  viewing,
  setViewing,
  doctorMap,
  tagBg,
  statusLabel,
  initials,
  handleExportFicha,
  handleOpenReposoDialog,
  handleOpenAtencionDialog,
  handleOpenJustificativoDialog,
}: PatientDetailDialogProps) {
  if (!viewing) return null;

  return (
    <Dialog open={!!viewing} onOpenChange={(o) => !o && setViewing(null)}>
      <DialogContent className="sm:max-w-4xl rounded-3xl max-h-[90vh] flex flex-col p-6">
        <DialogHeader className="flex flex-row items-center justify-between pr-6">
          <div>
            <DialogTitle>Detalle de Historia Clínica</DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground mt-0.5">
              Visualización de datos generales, antecedentes y registro de consultas.
            </DialogDescription>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="rounded-xl flex items-center gap-1.5 h-8 cursor-pointer"
              >
                <FileDown className="h-4 w-4" /> Exportar...
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              className="rounded-2xl bg-card border border-muted/50 p-1.5 shadow-xl"
              align="end"
            >
              <DropdownMenuItem
                onClick={() => handleExportFicha(viewing)}
                className="rounded-xl cursor-pointer text-xs flex items-center gap-1.5 px-3 py-2 hover:bg-muted"
              >
                <FileText className="h-3.5 w-3.5 text-mauve" /> Exportar Ficha Médica
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => handleOpenReposoDialog(viewing)}
                className="rounded-xl cursor-pointer text-xs flex items-center gap-1.5 px-3 py-2 hover:bg-muted"
              >
                <Printer className="h-3.5 w-3.5 text-mauve" /> Constancia de Reposo
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => handleOpenAtencionDialog(viewing)}
                className="rounded-xl cursor-pointer text-xs flex items-center gap-1.5 px-3 py-2 hover:bg-muted"
              >
                <Printer className="h-3.5 w-3.5 text-mauve" /> Constancia de Atención
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => handleOpenJustificativoDialog(viewing)}
                className="rounded-xl cursor-pointer text-xs flex items-center gap-1.5 px-3 py-2 hover:bg-muted"
              >
                <Printer className="h-3.5 w-3.5 text-mauve" /> Justificativo Médico
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </DialogHeader>

        <div className="flex items-center gap-3 mt-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-mauve to-blush text-base font-semibold text-primary-foreground">
            {initials(viewing.full_name)}
          </div>
          <div>
            <p className="text-base font-semibold">{viewing.full_name}</p>
            <div className="flex items-center gap-2 mt-1">
              <span
                className={cn(
                  "inline-block rounded-full px-2.5 py-0.5 text-[11px] font-medium",
                  tagBg[viewing.status] || "bg-muted"
                )}
              >
                {statusLabel(viewing.status)}
              </span>
              {viewing.historia_number && (
                <span className="text-xs bg-muted/80 text-muted-foreground px-2 py-0.5 rounded-md font-semibold">
                  Historia: #{viewing.historia_number}
                </span>
              )}
            </div>
          </div>
        </div>

        <Tabs defaultValue="general" className="mt-4 flex-1 flex flex-col min-h-0">
          <TabsList className="grid w-full grid-cols-7 bg-muted/60 p-1 rounded-2xl mb-4">
            <TabsTrigger value="general" className="rounded-xl font-medium text-xs">Identificación</TabsTrigger>
            <TabsTrigger value="antecedentes" className="rounded-xl font-medium text-xs">Antecedentes</TabsTrigger>
            <TabsTrigger value="ginecologia" className="rounded-xl font-medium text-xs">Ginecológico</TabsTrigger>
            <TabsTrigger value="obstetricia" className="rounded-xl font-medium text-xs">Obstétrico</TabsTrigger>
            <TabsTrigger value="timeline" className="rounded-xl font-medium text-xs">Timeline</TabsTrigger>
            <TabsTrigger value="notas" className="rounded-xl font-medium text-xs">Notas Clínicas</TabsTrigger>
            <TabsTrigger value="adjuntos" className="rounded-xl font-medium text-xs">Galería/Adjuntos</TabsTrigger>
          </TabsList>

          <div className="flex-1 overflow-y-auto pr-1">
            {/* TAB 1: GENERAL */}
            <TabsContent value="general" className="space-y-4 outline-none">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-xs text-muted-foreground block">Nombre Completo</span>
                  <span className="font-medium">{viewing.full_name}</span>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground block">Cédula / Identificación</span>
                  <span className="font-medium">{viewing.document_id || "—"}</span>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground block">Fecha de Nacimiento</span>
                  <span className="font-medium">{viewing.birth_date || "—"}</span>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground block">Edad</span>
                  <span className="font-medium">
                    {calculateAge(viewing.birth_date)}
                  </span>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground block">Teléfono</span>
                  <span className="font-medium">{viewing.phone || "—"}</span>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground block">Correo Electrónico</span>
                  <span className="font-medium">{viewing.email || "—"}</span>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground block">Lugar de Nacimiento</span>
                  <span className="font-medium">{viewing.birthplace || "—"}</span>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground block">Estado Civil</span>
                  <span className="font-medium">{viewing.marital_status || "—"}</span>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground block">Grado de Instrucción</span>
                  <span className="font-medium">{viewing.education_level || "—"}</span>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground block">Ocupación</span>
                  <span className="font-medium">{viewing.occupation || "—"}</span>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground block">Etnia</span>
                  <span className="font-medium">{viewing.ethnicity || "—"}</span>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground block">Fecha Primera Cita</span>
                  <span className="font-medium">{viewing.first_visit_date || "—"}</span>
                </div>
                <div className="col-span-2">
                  <span className="text-xs text-muted-foreground block">Dirección</span>
                  <span className="font-medium">{viewing.address || "—"}</span>
                </div>
                <div className="col-span-2">
                  <span className="text-xs text-muted-foreground block">Médico Asignado</span>
                  <span className="font-medium">{doctorMap.get(viewing.assigned_doctor_id ?? "") || "Sin asignar"}</span>
                </div>
                {viewing.consultation_reason && (
                  <div className="col-span-2 bg-muted/30 p-3 rounded-2xl">
                    <span className="text-xs text-muted-foreground block">Motivo de Consulta</span>
                    <span className="font-medium text-xs whitespace-pre-wrap">{viewing.consultation_reason}</span>
                  </div>
                )}
                {viewing.current_illness && (
                  <div className="col-span-2 bg-muted/30 p-3 rounded-2xl">
                    <span className="text-xs text-muted-foreground block">Enfermedad Actual</span>
                    <span className="font-medium text-xs whitespace-pre-wrap">{viewing.current_illness}</span>
                  </div>
                )}
                {viewing.notes && (
                  <div className="col-span-2">
                    <span className="text-xs text-muted-foreground block">Notas generales</span>
                    <span className="font-medium text-xs whitespace-pre-wrap">{viewing.notes}</span>
                  </div>
                )}
              </div>
            </TabsContent>

            {/* TAB 2: ANTECEDENTES */}
            <TabsContent value="antecedentes" className="space-y-4 outline-none">
              <div className="space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-mauve">Antecedentes Familiares</h3>
                <div className="grid grid-cols-2 gap-3 text-sm bg-muted/30 p-3.5 rounded-2xl">
                  <div>
                    <span className="text-xs text-muted-foreground block">Madre</span>
                    <span className="font-medium">{viewing.family_history?.mother || "Niega / Sano"}</span>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground block">Padre</span>
                    <span className="font-medium">{viewing.family_history?.father || "Niega / Sano"}</span>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground block">Hermanos</span>
                    <span className="font-medium">{viewing.family_history?.siblings || "Niega / Sano"}</span>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground block">Hijos</span>
                    <span className="font-medium">{viewing.family_history?.children || "Niega / Sano"}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-3 mt-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-mauve">Antecedentes Personales Patológicos y Hábitos</h3>
                <div className="grid grid-cols-2 gap-3 text-sm bg-muted/30 p-3.5 rounded-2xl">
                  <div>
                    <span className="text-xs text-muted-foreground block">Tabaco</span>
                    <span className="font-medium">{viewing.personal_history?.tobacco || "NIEGA"}</span>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground block">Alcohol</span>
                    <span className="font-medium">{viewing.personal_history?.alcohol || "NIEGA"}</span>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground block">Drogas</span>
                    <span className="font-medium">{viewing.personal_history?.drugs || "NIEGA"}</span>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground block">Patología de Base</span>
                    <span className="font-medium">{viewing.personal_history?.base_pathology || "Niega"}</span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-xs text-muted-foreground block">Quirúrgicos / Operaciones</span>
                    <span className="font-medium">{viewing.personal_history?.surgical || "Niega"}</span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-xs text-muted-foreground block">Alérgicos</span>
                    <span className="font-medium text-destructive">{viewing.personal_history?.allergies || "Niega"}</span>
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* TAB 3: GINECOLOGICO */}
            <TabsContent value="ginecologia" className="space-y-4 outline-none">
              <div className="grid grid-cols-2 gap-3 text-sm bg-muted/30 p-3.5 rounded-2xl">
                <div>
                  <span className="text-xs text-muted-foreground block">Menarquía (Edad primera menstruación)</span>
                  <span className="font-medium">{viewing.gynecological_data?.menarche || "—"}</span>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground block">Sexarquía (Edad inicio relaciones sexuales)</span>
                  <span className="font-medium">{viewing.gynecological_data?.sexarche || "—"}</span>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground block">Ciclo Menstrual</span>
                  <span className="font-medium">{viewing.gynecological_data?.menstrual_cycle || "—"}</span>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground block">Dismenorrea (Menstruación dolorosa)</span>
                  <span className="font-medium">{viewing.gynecological_data?.dysmenorrhea || "—"}</span>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground block">NPS (Número parejas sexuales)</span>
                  <span className="font-medium">{viewing.gynecological_data?.nps || "—"}</span>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground block">ITS (Infecciones de Transmisión Sexual)</span>
                  <span className="font-medium">{viewing.gynecological_data?.its || "—"}</span>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground block">Última Citología</span>
                  <span className="font-medium">{viewing.gynecological_data?.cytology || "—"}</span>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground block">Anticonceptivos</span>
                  <span className="font-medium">{viewing.gynecological_data?.contraceptives || "—"}</span>
                </div>
              </div>
            </TabsContent>

            {/* TAB 4: OBSTETRICO */}
            <TabsContent value="obstetricia" className="space-y-4 outline-none">
              <div className="grid grid-cols-4 gap-3 text-sm bg-muted/30 p-3.5 rounded-2xl">
                <div>
                  <span className="text-xs text-muted-foreground block">G (Gestas)</span>
                  <span className="font-bold text-base">{viewing.obstetric_data?.g ?? 0}</span>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground block">P (Partos)</span>
                  <span className="font-bold text-base">{viewing.obstetric_data?.p ?? 0}</span>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground block">C (Cesáreas)</span>
                  <span className="font-bold text-base">{viewing.obstetric_data?.c ?? 0}</span>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground block">A (Abortos)</span>
                  <span className="font-bold text-base">{viewing.obstetric_data?.a ?? 0}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm bg-muted/30 p-3.5 rounded-2xl mt-4">
                <div>
                  <span className="text-xs text-muted-foreground block">PIG (Período Intergenésico)</span>
                  <span className="font-medium">{viewing.obstetric_data?.pig || "—"}</span>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground block">Embarazos Múltiples</span>
                  <span className="font-medium">{viewing.obstetric_data?.em ?? "0"}</span>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground block">Embarazos Ectópicos</span>
                  <span className="font-medium">{viewing.obstetric_data?.ee ?? "0"}</span>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground block">Complicaciones Obstétricas</span>
                  <span className="font-medium">{viewing.obstetric_data?.complications || "Ninguna"}</span>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground block">FUM (Fecha Última Menstruación)</span>
                  <span className="font-medium">{viewing.obstetric_data?.fum || "—"}</span>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground block">EG (Edad Gestacional)</span>
                  <span className="font-medium">{viewing.obstetric_data?.eg || "—"}</span>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground block">FPP (Fecha Probable de Parto)</span>
                  <span className="font-medium text-mauve font-semibold">{viewing.obstetric_data?.fpp || "—"}</span>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground block">Número de Consultas Control</span>
                  <span className="font-medium">{viewing.obstetric_data?.num_consultations || "—"}</span>
                </div>
                <div className="col-span-2">
                  <span className="text-xs text-muted-foreground block">Vacunas</span>
                  <span className="font-medium">{viewing.obstetric_data?.vaccines || "—"}</span>
                </div>
              </div>
            </TabsContent>

            {/* TAB 5: NOTAS CLINICAS */}
            <TabsContent value="notas" className="space-y-4 outline-none">
              <ClinicalNotesPanel patientId={viewing.id} />
            </TabsContent>

            {/* TAB 6: TIMELINE */}
            <TabsContent value="timeline" className="space-y-4 outline-none">
              <PatientTimeline patientId={viewing.id} />
            </TabsContent>

            {/* TAB 7: GALERIA / ADJUNTOS */}
            <TabsContent value="adjuntos" className="space-y-4 outline-none">
              <PatientAttachmentsGallery patientId={viewing.id} />
            </TabsContent>
          </div>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
});
