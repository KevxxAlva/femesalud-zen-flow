import { useMemo, useState } from "react";
import { Plus, Search, Trash2, FileText, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  useClinicalNotes, useCreateClinicalNote, useDeleteClinicalNote,
} from "@/lib/api/clinical-notes";
import { toast } from "sonner";

export function ClinicalNotesPanel({ patientId }: { patientId: string }) {
  const { data: notes = [], isLoading } = useClinicalNotes(patientId);
  const create = useCreateClinicalNote();
  const del = useDeleteClinicalNote();

  const [adding, setAdding] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [noteDate, setNoteDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [q, setQ] = useState("");
  const [dateFilter, setDateFilter] = useState("");

  const filtered = useMemo(() => {
    return notes.filter((n) => {
      if (q && !`${n.title} ${n.content}`.toLowerCase().includes(q.toLowerCase())) return false;
      if (dateFilter && n.note_date.slice(0, 10) !== dateFilter) return false;
      return true;
    });
  }, [notes, q, dateFilter]);

  const reset = () => { setTitle(""); setContent(""); setNoteDate(new Date().toISOString().slice(0, 10)); setAdding(false); };

  const save = async () => {
    if (!title.trim()) return toast.error("El título es obligatorio");
    try {
      await create.mutateAsync({
        patient_id: patientId,
        title: title.trim(),
        content: content.trim(),
        note_date: new Date(noteDate).toISOString(),
      });
      toast.success("Nota agregada");
      reset();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error");
    }
  };

  const handleDelete = async (id: string) => {
    try { await del.mutateAsync({ id, patient_id: patientId }); toast.success("Nota eliminada"); }
    catch (err) { toast.error(err instanceof Error ? err.message : "Error"); }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold flex items-center gap-2"><FileText className="h-4 w-4 text-mauve" /> Historial clínico</h4>
        {!adding && (
          <Button size="sm" onClick={() => setAdding(true)} className="rounded-xl bg-gradient-to-r from-mauve to-mauve-soft text-primary-foreground h-8">
            <Plus className="mr-1 h-3.5 w-3.5" /> Nueva nota
          </Button>
        )}
      </div>

      {adding && (
        <div className="rounded-2xl border border-border/60 bg-card/60 p-3 space-y-2">
          <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Título (Ej. Consulta inicial)" className="rounded-xl" />
          <Textarea value={content} onChange={(e) => setContent(e.target.value)} placeholder="Detalle de la consulta, diagnóstico, indicaciones…" className="rounded-xl min-h-[90px]" />
          <div className="flex items-center gap-2">
            <Input type="date" value={noteDate} onChange={(e) => setNoteDate(e.target.value)} className="rounded-xl w-[170px]" />
            <div className="ml-auto flex gap-2">
              <Button variant="ghost" size="sm" onClick={reset} className="rounded-xl">Cancelar</Button>
              <Button size="sm" onClick={save} disabled={create.isPending} className="rounded-xl bg-foreground text-background">
                {create.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Guardar"}
              </Button>
            </div>
          </div>
        </div>
      )}

      <div className="flex gap-2">
        <div className="flex flex-1 items-center gap-2 rounded-xl bg-muted/60 px-3 py-2">
          <Search className="h-3.5 w-3.5 text-muted-foreground" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar en notas…" className="w-full bg-transparent text-xs outline-none placeholder:text-muted-foreground" />
          {q && <button onClick={() => setQ("")}><X className="h-3.5 w-3.5 text-muted-foreground" /></button>}
        </div>
        <Input type="date" value={dateFilter} onChange={(e) => setDateFilter(e.target.value)} className="rounded-xl w-[150px] h-9 text-xs" />
        {dateFilter && <button onClick={() => setDateFilter("")} className="text-xs text-muted-foreground hover:text-foreground">Limpiar</button>}
      </div>

      <div className="max-h-[320px] space-y-2 overflow-y-auto pr-1">
        {isLoading ? (
          <div className="py-6 text-center"><Loader2 className="mx-auto h-4 w-4 animate-spin text-muted-foreground" /></div>
        ) : filtered.length === 0 ? (
          <p className="py-6 text-center text-xs text-muted-foreground">Sin notas para los filtros seleccionados.</p>
        ) : (
          filtered.map((n) => (
            <article key={n.id} className="rounded-2xl border border-border/60 bg-card/40 p-3 group">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-xs uppercase tracking-wider text-muted-foreground">
                    {new Date(n.note_date).toLocaleDateString("es-ES", { day: "2-digit", month: "short", year: "numeric" })}
                  </p>
                  <p className="text-sm font-semibold leading-tight">{n.title}</p>
                </div>
                <button onClick={() => handleDelete(n.id)} className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground opacity-0 group-hover:opacity-100 transition hover:bg-destructive/10 hover:text-destructive" aria-label="Eliminar">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
              {n.content && <p className="mt-1.5 whitespace-pre-wrap text-xs text-muted-foreground">{n.content}</p>}
            </article>
          ))
        )}
      </div>
    </div>
  );
}
