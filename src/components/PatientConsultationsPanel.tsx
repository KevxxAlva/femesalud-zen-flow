import { useState } from "react";
import { usePatientConsultations } from "@/lib/api/consultations";
import { Loader2, Stethoscope, ChevronDown, ChevronUp, FileText, Pill, Thermometer, Droplet, Activity, Scaling, TestTube, Crosshair, Package } from "lucide-react";

export function PatientConsultationsPanel({ patientId }: { patientId: string }) {
  const { data: consultations = [], isLoading } = usePatientConsultations(patientId);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (isLoading) {
    return <div className="py-12 flex justify-center"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;
  }

  if (consultations.length === 0) {
    return (
      <div className="py-12 text-center text-sm font-medium text-muted-foreground border-2 border-dashed border-border/50 rounded-2xl bg-muted/20">
        No hay consultas registradas para este paciente.
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-10">
      {consultations.map((c) => {
        const isExpanded = expandedId === c.id;
        const toggle = () => setExpandedId(isExpanded ? null : c.id);

        return (
          <div key={c.id} className="border border-border/60 bg-card rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition duration-200">
            <div 
              onClick={toggle}
              className="p-4 flex items-center justify-between cursor-pointer hover:bg-muted/30 transition select-none"
            >
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 bg-primary/10 text-primary rounded-xl flex items-center justify-center">
                  <Stethoscope className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-foreground capitalize">
                    {c.visit_type === "PRIMERA_VEZ" ? "Consulta Primera Vez" : 
                     c.visit_type === "CONTROL" ? "Consulta de Control" : 
                     c.visit_type === "EMERGENCIA" ? "Consulta de Emergencia" : c.visit_type || "Consulta Clínica"}
                  </h4>
                  <p className="text-xs text-muted-foreground font-medium flex items-center gap-1.5 mt-0.5">
                    {new Date(c.created_at).toLocaleDateString("es-ES", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
                    <span>•</span>
                    {new Date(c.created_at).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
              </div>
              <div className="text-muted-foreground">
                {isExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
              </div>
            </div>

            {isExpanded && (
              <div className="p-4 pt-0 border-t border-border/40 text-sm bg-muted/10">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                  {/* Columna Izquierda */}
                  <div className="space-y-6">
                    {/* Motivo de Consulta */}
                    <div>
                      <h5 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
                        <FileText className="h-3.5 w-3.5" /> Motivo de Consulta / Síntomas
                      </h5>
                      <p className="text-foreground whitespace-pre-wrap">{c.subjective_exam || "No especificado."}</p>
                    </div>
                    
                    {/* Examen Físico y Signos Vitales */}
                    <div className="bg-card p-4 rounded-xl border border-border/40 shadow-sm">
                      <h5 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">Signos Vitales</h5>
                      <div className="grid grid-cols-2 gap-3 text-xs">
                        {c.weight_kg && <div className="flex gap-2 items-center"><Scaling className="h-4 w-4 text-muted-foreground"/> <span className="font-semibold">{c.weight_kg} kg</span></div>}
                        {c.height_cm && <div className="flex gap-2 items-center"><Activity className="h-4 w-4 text-muted-foreground"/> <span className="font-semibold">{c.height_cm} cm</span></div>}
                        {c.blood_pressure && <div className="flex gap-2 items-center"><Crosshair className="h-4 w-4 text-muted-foreground"/> <span className="font-semibold">{c.blood_pressure} mmHg</span></div>}
                        {c.temperature && <div className="flex gap-2 items-center"><Thermometer className="h-4 w-4 text-muted-foreground"/> <span className="font-semibold">{c.temperature} °C</span></div>}
                        {c.heart_rate && <div className="flex gap-2 items-center"><Activity className="h-4 w-4 text-muted-foreground"/> <span className="font-semibold">{c.heart_rate} bpm</span></div>}
                      </div>
                      
                      {c.gynecological && (
                        <div className="mt-4 pt-4 border-t border-border/50">
                          <h6 className="font-semibold text-xs text-muted-foreground mb-1">Examen Físico / Ginecológico</h6>
                          <p className="text-foreground whitespace-pre-wrap">{c.gynecological}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Columna Derecha */}
                  <div className="space-y-6">
                    {/* Diagnóstico y Plan */}
                    <div className="bg-primary/5 p-4 rounded-xl border border-[#4361ee]/10 shadow-sm">
                      <h5 className="text-xs font-bold text-primary uppercase tracking-wider mb-2 flex items-center gap-1.5">
                        <Activity className="h-3.5 w-3.5" /> Diagnóstico
                      </h5>
                      <p className="text-foreground font-medium whitespace-pre-wrap mb-4">{c.diagnosis || "No especificado."}</p>
                      
                      <h5 className="text-xs font-bold text-primary uppercase tracking-wider mb-2">
                         Plan y Tratamiento
                      </h5>
                      <p className="text-foreground whitespace-pre-wrap">{c.plan || c.indications || "No especificado."}</p>
                    </div>

                    {/* Exámenes y Consumibles */}
                    <div className="space-y-4">
                      {c.complementary_exams && (
                        <div>
                          <h5 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1 flex items-center gap-1.5">
                            <TestTube className="h-3.5 w-3.5" /> Exámenes Complementarios
                          </h5>
                          <p className="text-foreground">{c.complementary_exams}</p>
                        </div>
                      )}

                      {c.consumables && c.consumables.length > 0 && (
                        <div>
                          <h5 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
                            <Package className="h-3.5 w-3.5" /> Insumos Utilizados
                          </h5>
                          <ul className="space-y-1">
                            {c.consumables.map((item, idx) => (
                              <li key={idx} className="flex justify-between items-center text-xs bg-card px-3 py-1.5 rounded-lg border border-border/40 shadow-sm">
                                <span className="font-medium text-foreground">{item.item_name}</span>
                                <span className="bg-muted text-muted-foreground px-2 py-0.5 rounded-md font-semibold">{item.quantity} und</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
