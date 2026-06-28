import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Printer } from "lucide-react";

interface PatientExportModalsProps {
  // Reposo
  openReposo: boolean;
  setOpenReposo: (o: boolean) => void;
  reposoDays: string;
  setReposoDays: (v: string) => void;
  reposoStart: string;
  setReposoStart: (v: string) => void;
  reposoReason: string;
  setReposoReason: (v: string) => void;
  handleExportReposo: () => void;

  // Atencion
  openAtencion: boolean;
  setOpenAtencion: (o: boolean) => void;
  atencionDate: string;
  setAtencionDate: (v: string) => void;
  atencionTime: string;
  setAtencionTime: (v: string) => void;
  atencionReason: string;
  setAtencionReason: (v: string) => void;
  handleExportAtencion: () => void;

  // Justificativo
  openJustificativo: boolean;
  setOpenJustificativo: (o: boolean) => void;
  justificativoDate: string;
  setJustificativoDate: (v: string) => void;
  justificativoDays: string;
  setJustificativoDays: (v: string) => void;
  justificativoReason: string;
  setJustificativoReason: (v: string) => void;
  handleExportJustificativo: () => void;

  // Shared Doctor Info
  doctorUni: string;
  setDoctorUni: (v: string) => void;
  doctorMpps: string;
  setDoctorMpps: (v: string) => void;
  doctorCmc: string;
  setDoctorCmc: (v: string) => void;
}

export const PatientExportModals = React.memo(function PatientExportModals(props: PatientExportModalsProps) {
  return (
    <>
      {/* Dialog Constancia de Reposo */}
      <Dialog open={props.openReposo} onOpenChange={props.setOpenReposo}>
        <DialogContent className="rounded-3xl sm:max-w-md bg-card p-6 border border-muted/50 shadow-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-1.5">
              <Printer className="h-5 w-5 text-mauve" /> Constancia de Reposo
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-3 py-2 text-sm">
            <div className="grid gap-1">
              <Label htmlFor="rp-days">Días de reposo</Label>
              <Input
                id="rp-days"
                type="number"
                min="1"
                max="90"
                value={props.reposoDays}
                onChange={(e) => props.setReposoDays(e.target.value)}
                className="rounded-xl"
              />
            </div>
            <div className="grid gap-1">
              <Label htmlFor="rp-start">Fecha de inicio</Label>
              <Input
                id="rp-start"
                type="date"
                value={props.reposoStart}
                onChange={(e) => props.setReposoStart(e.target.value)}
                className="rounded-xl"
              />
            </div>
            <div className="grid gap-1">
              <Label htmlFor="rp-reason">Diagnóstico / Motivo de reposo</Label>
              <Textarea
                id="rp-reason"
                value={props.reposoReason}
                onChange={(e) => props.setReposoReason(e.target.value)}
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
                  value={props.doctorUni}
                  onChange={(e) => props.setDoctorUni(e.target.value)}
                  className="rounded-xl h-9 text-xs"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="grid gap-1">
                  <Label htmlFor="rp-doc-mpps">MPPS</Label>
                  <Input
                    id="rp-doc-mpps"
                    placeholder="Ej. 102.927"
                    value={props.doctorMpps}
                    onChange={(e) => props.setDoctorMpps(e.target.value)}
                    className="rounded-xl h-9 text-xs"
                  />
                </div>
                <div className="grid gap-1">
                  <Label htmlFor="rp-doc-cmc">C.M.C</Label>
                  <Input
                    id="rp-doc-cmc"
                    placeholder="Ej. 11.619"
                    value={props.doctorCmc}
                    onChange={(e) => props.setDoctorCmc(e.target.value)}
                    className="rounded-xl h-9 text-xs"
                  />
                </div>
              </div>
            </div>
            <Button
              onClick={props.handleExportReposo}
              disabled={!props.reposoReason.trim()}
              className="mt-2 w-full rounded-xl bg-gradient-to-r from-mauve to-blush text-primary-foreground shadow-sm hover:opacity-90 transition-opacity cursor-pointer"
            >
              Generar e Imprimir
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog Constancia de Atención */}
      <Dialog open={props.openAtencion} onOpenChange={props.setOpenAtencion}>
        <DialogContent className="rounded-3xl sm:max-w-md bg-card p-6 border border-muted/50 shadow-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-1.5">
              <Printer className="h-5 w-5 text-mauve" /> Constancia de Atención
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-3 py-2 text-sm">
            <div className="grid gap-1">
              <Label htmlFor="at-date">Fecha de atención</Label>
              <Input
                id="at-date"
                type="date"
                value={props.atencionDate}
                onChange={(e) => props.setAtencionDate(e.target.value)}
                className="rounded-xl"
              />
            </div>
            <div className="grid gap-1">
              <Label htmlFor="at-time">Hora de atención (Opcional)</Label>
              <Input
                id="at-time"
                type="time"
                value={props.atencionTime}
                onChange={(e) => props.setAtencionTime(e.target.value)}
                className="rounded-xl"
              />
            </div>
            <div className="grid gap-1">
              <Label htmlFor="at-reason">Motivo de atención (Opcional)</Label>
              <Textarea
                id="at-reason"
                value={props.atencionReason}
                onChange={(e) => props.setAtencionReason(e.target.value)}
                placeholder="Evaluación ginecológica, control prenatal..."
                className="rounded-xl min-h-[70px]"
              />
            </div>

            <div className="border-t border-border/60 pt-3 mt-1 space-y-2.5">
              <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Datos de Firma del Médico</p>
              <div className="grid gap-1">
                <Label htmlFor="at-doc-uni">Universidad / Título</Label>
                <Input
                  id="at-doc-uni"
                  value={props.doctorUni}
                  onChange={(e) => props.setDoctorUni(e.target.value)}
                  className="rounded-xl h-9 text-xs"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="grid gap-1">
                  <Label htmlFor="at-doc-mpps">MPPS</Label>
                  <Input
                    id="at-doc-mpps"
                    value={props.doctorMpps}
                    onChange={(e) => props.setDoctorMpps(e.target.value)}
                    className="rounded-xl h-9 text-xs"
                  />
                </div>
                <div className="grid gap-1">
                  <Label htmlFor="at-doc-cmc">C.M.C</Label>
                  <Input
                    id="at-doc-cmc"
                    value={props.doctorCmc}
                    onChange={(e) => props.setDoctorCmc(e.target.value)}
                    className="rounded-xl h-9 text-xs"
                  />
                </div>
              </div>
            </div>
            <Button
              onClick={props.handleExportAtencion}
              className="mt-2 w-full rounded-xl bg-gradient-to-r from-mauve to-blush text-primary-foreground shadow-sm hover:opacity-90 transition-opacity cursor-pointer"
            >
              Generar e Imprimir
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog Justificativo Médico */}
      <Dialog open={props.openJustificativo} onOpenChange={props.setOpenJustificativo}>
        <DialogContent className="rounded-3xl sm:max-w-md bg-card p-6 border border-muted/50 shadow-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-1.5">
              <Printer className="h-5 w-5 text-mauve" /> Justificativo Médico
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-3 py-2 text-sm">
            <div className="grid gap-1">
              <Label htmlFor="ju-date">Fecha de inasistencia</Label>
              <Input
                id="ju-date"
                type="date"
                value={props.justificativoDate}
                onChange={(e) => props.setJustificativoDate(e.target.value)}
                className="rounded-xl"
              />
            </div>
            <div className="grid gap-1">
              <Label htmlFor="ju-days">Número de días</Label>
              <Input
                id="ju-days"
                type="number"
                min="1"
                max="30"
                value={props.justificativoDays}
                onChange={(e) => props.setJustificativoDays(e.target.value)}
                className="rounded-xl"
              />
            </div>
            <div className="grid gap-1">
              <Label htmlFor="ju-reason">Motivo</Label>
              <Textarea
                id="ju-reason"
                value={props.justificativoReason}
                onChange={(e) => props.setJustificativoReason(e.target.value)}
                placeholder="Por presentar un cuadro viral, motivo de consulta, etc."
                className="rounded-xl min-h-[70px]"
              />
            </div>

            <div className="border-t border-border/60 pt-3 mt-1 space-y-2.5">
              <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Datos de Firma del Médico</p>
              <div className="grid gap-1">
                <Label htmlFor="ju-doc-uni">Universidad / Título</Label>
                <Input
                  id="ju-doc-uni"
                  value={props.doctorUni}
                  onChange={(e) => props.setDoctorUni(e.target.value)}
                  className="rounded-xl h-9 text-xs"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="grid gap-1">
                  <Label htmlFor="ju-doc-mpps">MPPS</Label>
                  <Input
                    id="ju-doc-mpps"
                    value={props.doctorMpps}
                    onChange={(e) => props.setDoctorMpps(e.target.value)}
                    className="rounded-xl h-9 text-xs"
                  />
                </div>
                <div className="grid gap-1">
                  <Label htmlFor="ju-doc-cmc">C.M.C</Label>
                  <Input
                    id="ju-doc-cmc"
                    value={props.doctorCmc}
                    onChange={(e) => props.setDoctorCmc(e.target.value)}
                    className="rounded-xl h-9 text-xs"
                  />
                </div>
              </div>
            </div>
            <Button
              onClick={props.handleExportJustificativo}
              disabled={!props.justificativoReason.trim()}
              className="mt-2 w-full rounded-xl bg-gradient-to-r from-mauve to-blush text-primary-foreground shadow-sm hover:opacity-90 transition-opacity cursor-pointer"
            >
              Generar e Imprimir
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
});
