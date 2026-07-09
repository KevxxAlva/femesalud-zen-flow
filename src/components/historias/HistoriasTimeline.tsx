import React from "react";
import { Loader2, Calendar, User, Activity, Scissors, HeartPulse, Stethoscope, FileText, Printer, Share2, ChevronUp, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Patient } from "@/lib/api/patients";

// We assume Consultation includes consumables from the joined query
interface Consultation {
  id: string;
  created_at: string;
  visit_type: string;
  diagnosis?: string;
  subjective_exam?: string;
  height_cm?: number;
  weight_kg?: number;
  blood_pressure?: string;
  heart_rate?: number;
  temperature?: number;
  respiratory_rate?: number;
  bmi?: number;
  skin?: string;
  head_neck?: string;
  breasts?: string;
  abdomen?: string;
  gynecological?: string;
  extremities?: string;
  neurological?: string;
  acetic_acid_test?: string;
  lugol_test?: string;
  acetic_clock_position?: string;
  acetic_relative_position?: string;
  lugol_clock_position?: string;
  lugol_relative_position?: string;
  gestational_age?: string;
  fetal_heart_rate?: number;
  fetal_weight?: number;
  uterine_height?: number;
  presentation?: string;
  indications?: string;
  complementary_exams?: string;
  plan?: string;
  next_appointment_date?: string;
  doctor_id?: string;
  consumables?: any[];
}

interface HistoriasTimelineProps {
  patientConsultations: Consultation[];
  loadingConsultations: boolean;
  expandedConsultations: Record<string, boolean>;
  toggleConsultation: (id: string) => void;
  doctorMap: Map<string, string>;
  selectedPatient: Patient;
  handleExportRecipe: (patient: Patient, consultation: Consultation, action: "save" | "whatsapp") => void;
}

export const HistoriasTimeline = React.memo(function HistoriasTimeline({
  patientConsultations,
  loadingConsultations,
  expandedConsultations,
  toggleConsultation,
  doctorMap,
  selectedPatient,
  handleExportRecipe,
}: HistoriasTimelineProps) {
  if (loadingConsultations) {
    return <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-mauve" /></div>;
  }

  if (patientConsultations.length === 0) {
    return (
      <div className="text-center py-16 text-muted-foreground border border-dashed border-border/40 rounded-3xl bg-muted/10">
        <Calendar className="h-8 w-8 mx-auto text-muted-foreground/30 mb-2" />
        <p className="font-semibold text-xs">Sin consultas registradas</p>
        <p className="text-[11px] text-muted-foreground mt-1">Registra consultas desde la pestaña 'Agenda' completando citas.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 pl-3 relative before:absolute before:left-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-border/30">
      {patientConsultations.map((c) => {
        const dateObj = new Date(c.created_at);
        const formattedDate = dateObj.toLocaleDateString("es-ES", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        });
        const isExpanded = !!expandedConsultations[c.id];

        return (
          <div key={c.id} className="relative pl-7 group">
            {/* Bullet */}
            <div className="absolute left-3 top-4 -translate-x-1/2 flex h-2.5 w-2.5 items-center justify-center rounded-full bg-mauve ring-4 ring-mauve/15" />

            <div className="bg-card/50 rounded-2xl border border-border/40 shadow-sm overflow-hidden transition hover:border-border hover:bg-card">
              {/* Header Toggle */}
              <button
                onClick={() => toggleConsultation(c.id)}
                className="w-full flex items-center justify-between p-3.5 text-left text-xs font-bold bg-muted/20 hover:bg-muted/40 transition cursor-pointer"
              >
                <div className="flex items-center gap-4">
                  <span className="text-mauve font-extrabold">{formattedDate}</span>
                  <span className={cn(
                    "px-2 py-0.5 rounded text-[10px] font-semibold shrink-0 uppercase",
                    c.visit_type === "EMERGENCIA" ? "bg-destructive/15 text-destructive" :
                    c.visit_type === "CONSULTA_NUEVA" ? "bg-blue-50 text-blue-700 border border-blue-100" :
                    "bg-sage/20 text-sage-foreground"
                  )}>
                    {c.visit_type}
                  </span>
                  <span className="text-muted-foreground font-normal truncate max-w-[180px] md:max-w-[280px]">
                    {c.diagnosis || "Sin diagnóstico registrado"}
                  </span>
                </div>
                {isExpanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
              </button>

              {/* Expanded Content */}
              {isExpanded && (
                <div className="p-4 border-t border-border/30 text-xs space-y-4 bg-background/30 animate-fade-in">
                  {c.subjective_exam && (
                    <div>
                      <h4 className="font-bold text-[10px] uppercase text-muted-foreground mb-1 tracking-wider flex items-center gap-1"><User className="h-3 w-3" /> Examen Subjetivo</h4>
                      <p className="bg-muted/40 p-2.5 rounded-xl text-foreground font-medium leading-relaxed">{c.subjective_exam}</p>
                    </div>
                  )}

                  {/* Vitals Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="bg-muted/20 p-2 rounded-xl text-center">
                      <span className="text-[10px] text-muted-foreground block">Talla / Peso</span>
                      <span className="font-bold">{c.height_cm ? c.height_cm + " cm" : "—"} / {c.weight_kg ? c.weight_kg + " kg" : "—"}</span>
                    </div>
                    <div className="bg-muted/20 p-2 rounded-xl text-center">
                      <span className="text-[10px] text-muted-foreground block">Presión Art. / FC</span>
                      <span className="font-bold">{c.blood_pressure || "—"} / {c.heart_rate ? c.heart_rate + " lpm" : "—"}</span>
                    </div>
                    <div className="bg-muted/20 p-2 rounded-xl text-center">
                      <span className="text-[10px] text-muted-foreground block">Temperatura / FR</span>
                      <span className="font-bold">{c.temperature ? c.temperature + " °C" : "—"} / {c.respiratory_rate ? c.respiratory_rate + " rpm" : "—"}</span>
                    </div>
                    <div className="bg-muted/20 p-2 rounded-xl text-center">
                      <span className="text-[10px] text-muted-foreground block">IMC</span>
                      <span className="font-bold text-mauve">{c.bmi || "—"}</span>
                    </div>
                  </div>

                  {/* Physical Exam Details */}
                  {(c.skin || c.head_neck || c.breasts || c.abdomen || c.gynecological || c.extremities || c.neurological) ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-muted/20 p-3 rounded-2xl">
                      <div className="col-span-1 sm:col-span-2 border-b border-border/30 pb-1.5 mb-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                        <Activity className="h-3.5 w-3.5" /> Revisión Física / Sistemas
                      </div>
                      {c.skin && <div><span className="text-muted-foreground text-[10px] block">Piel</span><span className="font-semibold">{c.skin}</span></div>}
                      {c.head_neck && <div><span className="text-muted-foreground text-[10px] block">Cabeza y Cuello</span><span className="font-semibold">{c.head_neck}</span></div>}
                      {c.breasts && <div><span className="text-muted-foreground text-[10px] block">Mamas</span><span className="font-semibold">{c.breasts}</span></div>}
                      {c.abdomen && <div><span className="text-muted-foreground text-[10px] block">Abdomen</span><span className="font-semibold">{c.abdomen}</span></div>}
                      {c.gynecological && <div className="col-span-1 sm:col-span-2"><span className="text-muted-foreground text-[10px] block">Examen Ginecológico</span><span className="font-semibold">{c.gynecological}</span></div>}
                      {c.extremities && <div><span className="text-muted-foreground text-[10px] block">Extremidades</span><span className="font-semibold">{c.extremities}</span></div>}
                      {c.neurological && <div><span className="text-muted-foreground text-[10px] block">Neurológico</span><span className="font-semibold">{c.neurological}</span></div>}
                    </div>
                  ) : null}

                  {/* Special Procedures (Colposcopía y Obstetricia) */}
                  {(c.acetic_acid_test || c.lugol_test || c.gestational_age || c.fetal_heart_rate) && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-muted/20 p-3 rounded-2xl">
                      {/* Colpo */}
                      {(c.acetic_acid_test || c.lugol_test) && (
                        <div className="space-y-2">
                          <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground border-b border-border/30 pb-1 flex items-center gap-1">
                            <Scissors className="h-3 w-3" /> Colposcopía
                          </div>
                          {c.acetic_acid_test && (
                            <div>
                              <span className="text-[10px] text-muted-foreground">Test Ácido Acético:</span>
                              <p className="font-semibold">{c.acetic_acid_test} {c.acetic_clock_position && `[Horario: ${c.acetic_clock_position}]`} {c.acetic_relative_position && `[Relativo: ${c.acetic_relative_position}]`}</p>
                            </div>
                          )}
                          {c.lugol_test && (
                            <div>
                              <span className="text-[10px] text-muted-foreground">Test de Lugol (Schiller):</span>
                              <p className="font-semibold">{c.lugol_test} {c.lugol_clock_position && `[Horario: ${c.lugol_clock_position}]`} {c.lugol_relative_position && `[Relativo: ${c.lugol_relative_position}]`}</p>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Obstétrico */}
                      {(c.gestational_age || c.fetal_heart_rate) && (
                        <div className="space-y-2">
                          <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground border-b border-border/30 pb-1 flex items-center gap-1">
                            <HeartPulse className="h-3 w-3" /> Control Obstétrico
                          </div>
                          <div className="grid grid-cols-2 gap-2 text-[11px]">
                            <div><span className="text-[9px] text-muted-foreground block">EG:</span><span className="font-semibold">{c.gestational_age || "—"}</span></div>
                            <div><span className="text-[9px] text-muted-foreground block">Peso Fetal:</span><span className="font-semibold">{c.fetal_weight ? c.fetal_weight + " g" : "—"}</span></div>
                            <div><span className="text-[9px] text-muted-foreground block">FC Fetal:</span><span className="font-semibold">{c.fetal_heart_rate ? c.fetal_heart_rate + " lpm" : "—"}</span></div>
                            <div><span className="text-[9px] text-muted-foreground block">AU / Pres:</span><span className="font-semibold">{c.uterine_height ? c.uterine_height + "cm" : "—"} / {c.presentation || "—"}</span></div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Diagnosis & Treatments */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-border/30 pt-3">
                    <div className="bg-muted/10 p-3 rounded-2xl">
                      <h4 className="font-bold text-[10px] uppercase text-muted-foreground mb-1 flex items-center gap-1"><Stethoscope className="h-3 w-3" /> Diagnóstico</h4>
                      <p className="font-bold text-foreground leading-relaxed text-xs">{c.diagnosis || "Sin diagnóstico"}</p>
                    </div>
                    <div className="bg-muted/10 p-3 rounded-2xl flex flex-col justify-between">
                      <div className="flex items-center justify-between mb-1.5">
                        <h4 className="font-bold text-[10px] uppercase text-muted-foreground flex items-center gap-1">
                          <FileText className="h-3 w-3" /> Indicaciones y Receta
                        </h4>
                        {c.indications && (
                          <div className="flex gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleExportRecipe(selectedPatient, c as any, "save")}
                              className="h-6 px-2 text-[10px] rounded-lg text-mauve hover:text-mauve-foreground hover:bg-mauve/10 flex items-center gap-1 cursor-pointer"
                            >
                              <Printer className="h-3 w-3" /> Imprimir
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleExportRecipe(selectedPatient, c as any, "whatsapp")}
                              className="h-6 px-2 text-[10px] rounded-lg text-green-600 hover:text-green-700 hover:bg-green-50 flex items-center gap-1 cursor-pointer"
                            >
                              <Share2 className="h-3 w-3" /> WhatsApp
                            </Button>
                          </div>
                        )}
                      </div>
                      <p className="font-medium text-foreground whitespace-pre-wrap leading-relaxed text-xs">{c.indications || "Sin indicaciones"}</p>
                    </div>
                  </div>

                  {(c.complementary_exams || c.plan || c.next_appointment_date) && (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 border-t border-border/30 pt-3 text-[11px]">
                      {c.complementary_exams && <div className="sm:col-span-1"><span className="text-[10px] text-muted-foreground block uppercase font-bold">Exámenes Solicitados</span><p className="font-medium text-xs">{c.complementary_exams}</p></div>}
                      {c.plan && <div className="sm:col-span-1"><span className="text-[10px] text-muted-foreground block uppercase font-bold">Plan Clínico</span><p className="font-medium text-xs">{c.plan}</p></div>}
                      {c.next_appointment_date && <div className="sm:col-span-1"><span className="text-[10px] text-muted-foreground block uppercase font-bold">Próxima Cita Recomendada</span><p className="font-bold text-xs text-mauve">{new Date(c.next_appointment_date).toLocaleDateString("es-ES", { day: "2-digit", month: "short", year: "numeric" })}</p></div>}
                    </div>
                  )}

                  {/* Consumables used */}
                  {c.consumables && c.consumables.length > 0 && (
                    <div className="border-t border-border/30 pt-3">
                      <span className="text-[9px] text-muted-foreground font-bold uppercase tracking-wider block mb-1.5">Materiales Clínicos Utilizados</span>
                      <div className="flex flex-wrap gap-1.5">
                        {c.consumables.map((item) => (
                          <span key={item.id} className="text-[10px] bg-muted/80 border border-border/40 text-foreground px-2 py-0.5 rounded-full font-medium">
                            {item.item_name}: <span className="font-bold text-mauve">{item.quantity}</span> {item.unit || ""}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex justify-end text-[10px] text-muted-foreground pt-1 border-t border-border/20 mt-2">
                    <span>Registrado por: {doctorMap.get(c.doctor_id ?? "") || "Médico tratante"}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
});
