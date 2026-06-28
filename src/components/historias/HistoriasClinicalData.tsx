import React from "react";
import { TabsContent } from "@/components/ui/tabs";
import type { Patient } from "@/lib/api/patients";

interface HistoriasClinicalDataProps {
  selectedPatient: Patient;
  doctorMap: Map<string, string>;
}

export const HistoriasClinicalData = React.memo(function HistoriasClinicalData({
  selectedPatient,
  doctorMap,
}: HistoriasClinicalDataProps) {
  return (
    <>
      {/* TAB 2: CLINICAL BASE DATA */}
      <TabsContent value="base" className="space-y-6 mt-0 outline-none animate-fade-in">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Antecedentes Familiares */}
          <div className="bg-muted/30 p-4 rounded-2xl space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-mauve">Antecedentes Familiares</h3>
            <dl className="grid grid-cols-2 gap-3 text-xs">
              <div><dt className="text-muted-foreground">Madre</dt><dd className="font-semibold text-foreground">{selectedPatient.family_history?.mother || "Niega / Sano"}</dd></div>
              <div><dt className="text-muted-foreground">Padre</dt><dd className="font-semibold text-foreground">{selectedPatient.family_history?.father || "Niega / Sano"}</dd></div>
              <div><dt className="text-muted-foreground">Hermanos</dt><dd className="font-semibold text-foreground">{selectedPatient.family_history?.siblings || "Niega / Sano"}</dd></div>
              <div><dt className="text-muted-foreground">Hijos</dt><dd className="font-semibold text-foreground">{selectedPatient.family_history?.children || "Niega / Sano"}</dd></div>
            </dl>
          </div>

          {/* Antecedentes Personales */}
          <div className="bg-muted/30 p-4 rounded-2xl space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-mauve">Hábitos y Patologías Personales</h3>
            <dl className="grid grid-cols-3 gap-3 text-xs">
              <div><dt className="text-muted-foreground">Tabaco</dt><dd className="font-semibold text-foreground">{selectedPatient.personal_history?.tobacco || "NIEGA"}</dd></div>
              <div><dt className="text-muted-foreground">Alcohol</dt><dd className="font-semibold text-foreground">{selectedPatient.personal_history?.alcohol || "NIEGA"}</dd></div>
              <div><dt className="text-muted-foreground">Drogas</dt><dd className="font-semibold text-foreground">{selectedPatient.personal_history?.drugs || "NIEGA"}</dd></div>
              <div className="col-span-3 border-t border-border/30 pt-2"><dt className="text-muted-foreground">Patología de Base</dt><dd className="font-semibold text-foreground">{selectedPatient.personal_history?.base_pathology || "Niega"}</dd></div>
              <div className="col-span-3"><dt className="text-muted-foreground">Quirúrgicos</dt><dd className="font-semibold text-foreground">{selectedPatient.personal_history?.surgical || "Niega"}</dd></div>
              <div className="col-span-3"><dt className="text-muted-foreground text-destructive">Alérgicos</dt><dd className="font-bold text-destructive">{selectedPatient.personal_history?.allergies || "Niega"}</dd></div>
            </dl>
          </div>
        </div>
      </TabsContent>

      {/* TAB: GYN & OBS */}
      <TabsContent value="gyn-obs" className="space-y-6 mt-0 outline-none animate-fade-in">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Datos Ginecológicos */}
          <div className="bg-muted/30 p-4 rounded-2xl space-y-3 border border-border/30">
            <h3 className="text-xs font-bold uppercase tracking-wider text-mauve">Datos Ginecológicos</h3>
            <dl className="grid grid-cols-2 gap-3 text-xs">
              <div><dt className="text-muted-foreground">Menarquía / Sexarquía</dt><dd className="font-semibold text-foreground">{selectedPatient.gynecological_data?.menarche || "—"} / {selectedPatient.gynecological_data?.sexarche || "—"} años</dd></div>
              <div><dt className="text-muted-foreground">Ciclo Menstrual</dt><dd className="font-semibold text-foreground">{selectedPatient.gynecological_data?.menstrual_cycle || "—"}</dd></div>
              <div><dt className="text-muted-foreground">Dismenorrea / NPS</dt><dd className="font-semibold text-foreground">{selectedPatient.gynecological_data?.dysmenorrhea || "—"} / {selectedPatient.gynecological_data?.nps || "—"}</dd></div>
              <div><dt className="text-muted-foreground">ITS</dt><dd className="font-semibold text-foreground">{selectedPatient.gynecological_data?.its || "Ninguna"}</dd></div>
              <div className="col-span-2 border-t border-border/30 pt-2"><dt className="text-muted-foreground">Última Citología</dt><dd className="font-semibold text-foreground">{selectedPatient.gynecological_data?.cytology || "—"}</dd></div>
              <div className="col-span-2"><dt className="text-muted-foreground">Anticonceptivos</dt><dd className="font-semibold text-foreground">{selectedPatient.gynecological_data?.contraceptives || "—"}</dd></div>
            </dl>
          </div>

          {/* Datos Obstétricos */}
          <div className="bg-muted/30 p-4 rounded-2xl space-y-3 border border-border/30">
            <h3 className="text-xs font-bold uppercase tracking-wider text-mauve">Antecedentes Obstétricos</h3>
            <div className="grid grid-cols-4 gap-2 text-center bg-card p-2 rounded-xl border border-border/40 mb-2">
              <div><span className="text-[10px] text-muted-foreground block">G</span><span className="font-bold">{selectedPatient.obstetric_data?.g ?? 0}</span></div>
              <div><span className="text-[10px] text-muted-foreground block">P</span><span className="font-bold">{selectedPatient.obstetric_data?.p ?? 0}</span></div>
              <div><span className="text-[10px] text-muted-foreground block">C</span><span className="font-bold">{selectedPatient.obstetric_data?.c ?? 0}</span></div>
              <div><span className="text-[10px] text-muted-foreground block">A</span><span className="font-bold">{selectedPatient.obstetric_data?.a ?? 0}</span></div>
            </div>
            <dl className="grid grid-cols-2 gap-2 text-xs">
              <div><dt className="text-muted-foreground">Período Intergenésico (PIG)</dt><dd className="font-semibold text-foreground">{selectedPatient.obstetric_data?.pig || "—"}</dd></div>
              <div><dt className="text-muted-foreground">EM / EE (Ectópicos)</dt><dd className="font-semibold text-foreground">EM: {selectedPatient.obstetric_data?.em ?? 0} / EE: {selectedPatient.obstetric_data?.ee ?? 0}</dd></div>
              <div className="col-span-2"><dt className="text-muted-foreground">Complicaciones</dt><dd className="font-semibold text-foreground">{selectedPatient.obstetric_data?.complications || "Ninguna"}</dd></div>
              <div><dt className="text-muted-foreground">FUM</dt><dd className="font-semibold text-foreground">{selectedPatient.obstetric_data?.fum || "—"}</dd></div>
              <div><dt className="text-muted-foreground">Edad Gestacional / FPP</dt><dd className="font-semibold text-foreground">{selectedPatient.obstetric_data?.eg || "—"} / <span className="text-mauve font-bold">{selectedPatient.obstetric_data?.fpp || "—"}</span></dd></div>
              <div className="col-span-2"><dt className="text-muted-foreground">Vacunas / Controles</dt><dd className="font-semibold text-foreground">Vacunas: {selectedPatient.obstetric_data?.vaccines || "—"} (Controles: {selectedPatient.obstetric_data?.num_consultations || 0})</dd></div>
            </dl>
          </div>
        </div>
      </TabsContent>

      {/* TAB 3: IDENTIFICATION DATA */}
      <TabsContent value="info" className="space-y-6 mt-0 outline-none animate-fade-in">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="bg-muted/30 p-4 rounded-2xl space-y-3 col-span-1 md:col-span-2 border border-border/30">
            <h3 className="text-xs font-bold uppercase tracking-wider text-mauve mb-1">Datos Básicos</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              <div><span className="text-muted-foreground block text-[10px] uppercase font-semibold">Nombre Completo</span><span className="font-bold text-foreground text-sm">{selectedPatient.full_name}</span></div>
              <div><span className="text-muted-foreground block text-[10px] uppercase font-semibold">Documento Cédula</span><span className="font-bold text-foreground text-sm">{selectedPatient.document_id || "—"}</span></div>
              <div><span className="text-muted-foreground block text-[10px] uppercase font-semibold">Número de Historia</span><span className="font-bold text-foreground text-sm">#{selectedPatient.historia_number || "—"}</span></div>
            </div>
          </div>

          <div className="bg-muted/30 p-4 rounded-2xl space-y-3 border border-border/30">
            <h3 className="text-xs font-bold uppercase tracking-wider text-mauve mb-2">Información de Contacto y Personal</h3>
            <dl className="space-y-2">
              <div className="flex justify-between py-1 border-b border-border/30"><dt className="text-muted-foreground">Teléfono</dt><dd className="font-semibold text-foreground">{selectedPatient.phone || "—"}</dd></div>
              <div className="flex justify-between py-1 border-b border-border/30"><dt className="text-muted-foreground">Correo Electrónico</dt><dd className="font-semibold text-foreground">{selectedPatient.email || "—"}</dd></div>
              <div className="flex justify-between py-1 border-b border-border/30"><dt className="text-muted-foreground">Estado Civil</dt><dd className="font-semibold text-foreground">{selectedPatient.marital_status || "—"}</dd></div>
              <div className="flex justify-between py-1 border-b border-border/30"><dt className="text-muted-foreground">Nivel de Instrucción</dt><dd className="font-semibold text-foreground">{selectedPatient.education_level || "—"}</dd></div>
              <div className="flex justify-between py-1"><dt className="text-muted-foreground">Ocupación</dt><dd className="font-semibold text-foreground">{selectedPatient.occupation || "—"}</dd></div>
            </dl>
          </div>

          <div className="bg-muted/30 p-4 rounded-2xl space-y-3 border border-border/30">
            <h3 className="text-xs font-bold uppercase tracking-wider text-mauve mb-2">Información Clínica Inicial</h3>
            <dl className="space-y-2">
              <div className="flex justify-between py-1 border-b border-border/30"><dt className="text-muted-foreground">Fecha de Nacimiento</dt><dd className="font-semibold text-foreground">{selectedPatient.birth_date || "—"}</dd></div>
              <div className="flex justify-between py-1 border-b border-border/30"><dt className="text-muted-foreground">Lugar de Nacimiento</dt><dd className="font-semibold text-foreground">{selectedPatient.birthplace || "—"}</dd></div>
              <div className="flex justify-between py-1 border-b border-border/30"><dt className="text-muted-foreground">Etnia / Raza</dt><dd className="font-semibold text-foreground">{selectedPatient.ethnicity || "—"}</dd></div>
              <div className="flex justify-between py-1 border-b border-border/30"><dt className="text-muted-foreground">Primera Cita</dt><dd className="font-semibold text-foreground">{selectedPatient.first_visit_date || "—"}</dd></div>
              <div className="flex justify-between py-1"><dt className="text-muted-foreground">Médico Asignado</dt><dd className="font-semibold text-foreground">{doctorMap.get(selectedPatient.assigned_doctor_id ?? "") || "Sin médico"}</dd></div>
            </dl>
          </div>

          <div className="bg-muted/30 p-4 rounded-2xl space-y-2 col-span-1 md:col-span-2 border border-border/30">
            <h3 className="text-xs font-bold uppercase tracking-wider text-mauve">Consulta de Ingreso</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
              <div className="bg-card/50 p-3 rounded-xl border border-border/40">
                <span className="text-muted-foreground font-bold mb-1 block">Motivo de Consulta</span>
                <span className="font-medium whitespace-pre-wrap block text-xs">{selectedPatient.consultation_reason || "No registrado"}</span>
              </div>
              <div className="bg-card/50 p-3 rounded-xl border border-border/40">
                <span className="text-muted-foreground font-bold mb-1 block">Enfermedad Actual</span>
                <span className="font-medium whitespace-pre-wrap block text-xs">{selectedPatient.current_illness || "No registrado"}</span>
              </div>
            </div>
          </div>

          <div className="bg-muted/30 p-4 rounded-2xl space-y-2 col-span-1 md:col-span-2 border border-border/30">
            <span className="text-xs font-bold uppercase tracking-wider text-mauve block">Dirección de Domicilio</span>
            <span className="font-semibold text-foreground bg-card/50 p-3 rounded-xl border border-border/40 mt-1 block">{selectedPatient.address || "No registrada"}</span>
          </div>
          
          {selectedPatient.notes && (
            <div className="bg-muted/30 p-4 rounded-2xl space-y-2 col-span-1 md:col-span-2 border border-border/30">
              <span className="text-xs font-bold uppercase tracking-wider text-mauve block">Notas Administrativas</span>
              <span className="font-semibold text-foreground bg-card/50 p-3 rounded-xl border border-border/40 mt-1 block whitespace-pre-wrap text-xs">{selectedPatient.notes}</span>
            </div>
          )}
        </div>
      </TabsContent>
    </>
  );
});
