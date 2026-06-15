import { useMemo } from "react";
import { Activity, FileText, Paperclip, Loader2 } from "lucide-react";
import { useClinicalNotes } from "@/lib/api/clinical-notes";

export function PatientTimeline({ patientId }: { patientId: string }) {
  const { data: notes = [], isLoading } = useClinicalNotes(patientId);

  const sortedNotes = useMemo(() => {
    return [...notes].sort((a, b) => +new Date(b.note_date) - +new Date(a.note_date));
  }, [notes]);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold flex items-center gap-2">
          <Activity className="h-4 w-4 text-mauve" /> Línea de tiempo clínica
          <span className="text-[11px] font-normal text-muted-foreground">({sortedNotes.length})</span>
        </h4>
      </div>

      {isLoading ? (
        <div className="py-6 text-center">
          <Loader2 className="mx-auto h-4 w-4 animate-spin text-muted-foreground" />
        </div>
      ) : sortedNotes.length === 0 ? (
        <p className="py-6 text-center text-xs text-muted-foreground">Sin eventos clínicos aún.</p>
      ) : (
        <ol className="relative space-y-3 border-l border-border/60 pl-4">
          {sortedNotes.map((it) => (
            <li key={it.id} className="relative">
              <span className="absolute -left-[21px] top-1.5 flex h-3 w-3 items-center justify-center rounded-full ring-4 ring-background bg-mauve" />
              <div className="rounded-2xl border border-border/60 bg-card/40 p-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                      <FileText className="h-3 w-3" /> Nota clínica
                      <span>·</span>
                      <span>
                        {new Date(it.note_date).toLocaleDateString("es-ES", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}
                      </span>
                    </p>
                    <p className="text-sm font-semibold leading-tight mt-0.5">{it.title}</p>
                    {it.content && (
                      <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{it.content}</p>
                    )}
                    {it.attachments && it.attachments.length > 0 && (
                      <p className="mt-1 inline-flex items-center gap-1 text-[11px] text-muted-foreground">
                        <Paperclip className="h-3 w-3" /> {it.attachments.length} adjunto
                        {it.attachments.length > 1 ? "s" : ""}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
