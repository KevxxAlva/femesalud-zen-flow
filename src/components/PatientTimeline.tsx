import { useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Activity, FileText, FlaskConical, Paperclip, ArrowUpRight, Loader2 } from "lucide-react";
import { useClinicalNotes } from "@/lib/api/clinical-notes";
import { useLabResults } from "@/lib/api/lab-results";
import { cn } from "@/lib/utils";

type Item =
  | { kind: "note"; id: string; date: string; title: string; subtitle?: string; attachments: number }
  | { kind: "lab"; id: string; date: string; title: string; status: string; appointmentId: string; hasFile: boolean };

export function PatientTimeline({ patientId }: { patientId: string }) {
  const { data: notes = [], isLoading: l1 } = useClinicalNotes(patientId);
  const { data: labs = [], isLoading: l2 } = useLabResults();
  const [tab, setTab] = useState<"all" | "notes" | "labs">("all");

  const items: Item[] = useMemo(() => {
    const noteItems: Item[] = notes.map((n) => ({
      kind: "note", id: n.id, date: n.note_date, title: n.title,
      subtitle: n.content || undefined, attachments: n.attachments.length,
    }));
    const labItems: Item[] = labs
      .filter((r) => r.patient_id === patientId)
      .map((r) => ({
        kind: "lab", id: r.id,
        date: r.result_date || r.scheduled_at || r.created_at,
        title: r.test_type, status: r.status,
        appointmentId: r.appointment_id, hasFile: !!r.file_url,
      }));
    const all = [...noteItems, ...labItems];
    const filtered = tab === "all" ? all : tab === "notes" ? noteItems : labItems;
    return filtered.sort((a, b) => +new Date(b.date) - +new Date(a.date));
  }, [notes, labs, patientId, tab]);

  const loading = l1 || l2;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold flex items-center gap-2">
          <Activity className="h-4 w-4 text-mauve" /> Línea de tiempo clínica
          <span className="text-[11px] font-normal text-muted-foreground">({items.length})</span>
        </h4>
        <div className="flex items-center gap-1 rounded-xl bg-muted/60 p-0.5">
          {(["all", "notes", "labs"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={cn(
                "rounded-lg px-2.5 py-1 text-[11px] transition",
                tab === t ? "bg-card shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground",
              )}
            >
              {t === "all" ? "Todo" : t === "notes" ? "Notas" : "Laboratorio"}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="py-6 text-center"><Loader2 className="mx-auto h-4 w-4 animate-spin text-muted-foreground" /></div>
      ) : items.length === 0 ? (
        <p className="py-6 text-center text-xs text-muted-foreground">Sin eventos clínicos aún.</p>
      ) : (
        <ol className="relative space-y-3 border-l border-border/60 pl-4">
          {items.map((it) => (
            <li key={`${it.kind}-${it.id}`} className="relative">
              <span className={cn(
                "absolute -left-[21px] top-1.5 flex h-3 w-3 items-center justify-center rounded-full ring-4 ring-background",
                it.kind === "note" ? "bg-mauve" : "bg-sage",
              )} />
              <div className="rounded-2xl border border-border/60 bg-card/40 p-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                      {it.kind === "note" ? (
                        <><FileText className="h-3 w-3" /> Nota clínica</>
                      ) : (
                        <><FlaskConical className="h-3 w-3" /> Laboratorio</>
                      )}
                      <span>·</span>
                      <span>{new Date(it.date).toLocaleDateString("es-ES", { day: "2-digit", month: "short", year: "numeric" })}</span>
                    </p>
                    <p className="text-sm font-semibold leading-tight mt-0.5">{it.title}</p>
                    {it.kind === "note" && it.subtitle && (
                      <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{it.subtitle}</p>
                    )}
                    {it.kind === "lab" && (
                      <div className="mt-1 flex items-center gap-2 text-[11px]">
                        <span className={cn(
                          "rounded-full px-2 py-0.5 font-medium",
                          it.status === "completado" ? "bg-sage/40 text-sage-foreground" : "bg-blush/60 text-blush-foreground",
                        )}>{it.status}</span>
                        {it.hasFile && <span className="text-muted-foreground inline-flex items-center gap-1"><Paperclip className="h-3 w-3" /> Adjunto</span>}
                      </div>
                    )}
                    {it.kind === "note" && it.attachments > 0 && (
                      <p className="mt-1 inline-flex items-center gap-1 text-[11px] text-muted-foreground">
                        <Paperclip className="h-3 w-3" /> {it.attachments} adjunto{it.attachments > 1 ? "s" : ""}
                      </p>
                    )}
                  </div>
                  {it.kind === "lab" && (
                    <Link
                      to="/laboratorio"
                      className="inline-flex h-7 shrink-0 items-center gap-1 rounded-lg border border-border/60 px-2 text-[11px] text-muted-foreground hover:bg-muted hover:text-foreground"
                    >
                      Abrir <ArrowUpRight className="h-3 w-3" />
                    </Link>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
