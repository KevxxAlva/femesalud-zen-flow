import { useEffect, useMemo, useState } from "react";
import { Plus, Search, Trash2, FileText, Loader2, X, Paperclip, Download, ChevronLeft, ChevronRight, Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  useClinicalNotes, useCreateClinicalNote, useDeleteClinicalNote,
  uploadClinicalAttachments, getAttachmentUrl, type ClinicalAttachment,
} from "@/lib/api/clinical-notes";
import { toast } from "sonner";

const PAGE_SIZE = 5;

function AttachmentChip({ a }: { a: ClinicalAttachment }) {
  const [loading, setLoading] = useState(false);
  const isImage = a.type?.startsWith("image/");
  const open = async () => {
    try {
      setLoading(true);
      const url = await getAttachmentUrl(a.path);
      window.open(url, "_blank", "noopener");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error al abrir adjunto");
    } finally { setLoading(false); }
  };
  return (
    <button
      onClick={open}
      className="inline-flex items-center gap-1.5 max-w-full rounded-full border border-border/60 bg-muted/40 px-2.5 py-1 text-[11px] hover:bg-muted transition"
      title={a.name}
    >
      {isImage ? <ImageIcon className="h-3 w-3 text-mauve" /> : <FileText className="h-3 w-3 text-mauve" />}
      <span className="truncate max-w-[140px]">{a.name}</span>
      {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Download className="h-3 w-3 opacity-60" />}
    </button>
  );
}

export function ClinicalNotesPanel({ patientId }: { patientId: string }) {
  const { data: notes = [], isLoading } = useClinicalNotes(patientId);
  const create = useCreateClinicalNote();
  const del = useDeleteClinicalNote();

  const [adding, setAdding] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [noteDate, setNoteDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);

  const [q, setQ] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    return notes.filter((n) => {
      if (q && !`${n.title} ${n.content}`.toLowerCase().includes(q.toLowerCase())) return false;
      const d = n.note_date.slice(0, 10);
      if (dateFrom && d < dateFrom) return false;
      if (dateTo && d > dateTo) return false;
      return true;
    });
  }, [notes, q, dateFrom, dateTo]);

  useEffect(() => { setPage(1); }, [q, dateFrom, dateTo]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageItems = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const reset = () => {
    setTitle(""); setContent(""); setNoteDate(new Date().toISOString().slice(0, 10));
    setFiles([]); setAdding(false);
  };

  const save = async () => {
    if (!title.trim()) return toast.error("El título es obligatorio");
    try {
      let attachments: ClinicalAttachment[] = [];
      if (files.length) {
        setUploading(true);
        attachments = await uploadClinicalAttachments(patientId, files);
      }
      await create.mutateAsync({
        patient_id: patientId,
        title: title.trim(),
        content: content.trim(),
        note_date: new Date(noteDate).toISOString(),
        attachments,
      });
      toast.success("Nota agregada");
      reset();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error");
    } finally { setUploading(false); }
  };

  const handleDelete = async (id: string, attachments: ClinicalAttachment[]) => {
    try { await del.mutateAsync({ id, patient_id: patientId, attachments }); toast.success("Nota eliminada"); }
    catch (err) { toast.error(err instanceof Error ? err.message : "Error"); }
  };

  const clearFilters = () => { setQ(""); setDateFrom(""); setDateTo(""); };
  const hasFilter = q || dateFrom || dateTo;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold flex items-center gap-2">
          <FileText className="h-4 w-4 text-mauve" /> Historial clínico
          <span className="text-[11px] font-normal text-muted-foreground">({filtered.length})</span>
        </h4>
        {!adding && (
          <Button size="sm" onClick={() => setAdding(true)} className="rounded-xl bg-gradient-to-r from-mauve to-mauve-soft text-primary-foreground h-8">
            <Plus className="mr-1 h-3.5 w-3.5" /> Nueva nota
          </Button>
        )}
      </div>

      {adding && (
        <div className="rounded-2xl border border-border/60 bg-card/60 p-3 space-y-2">
          <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Título (Ej. Consulta inicial)" className="rounded-xl" />
          <Textarea value={content} onChange={(e) => setContent(e.target.value)} placeholder="Detalle, diagnóstico, indicaciones…" className="rounded-xl min-h-[90px]" />
          <div className="flex flex-wrap items-center gap-2">
            <Input type="date" value={noteDate} onChange={(e) => setNoteDate(e.target.value)} className="rounded-xl w-[170px]" />
            <label className="inline-flex items-center gap-1.5 cursor-pointer rounded-xl border border-dashed border-border/70 px-2.5 py-1.5 text-xs text-muted-foreground hover:bg-muted">
              <Paperclip className="h-3.5 w-3.5" /> Adjuntar
              <input
                type="file"
                multiple
                accept="image/*,application/pdf"
                className="hidden"
                onChange={(e) => setFiles((prev) => [...prev, ...Array.from(e.target.files ?? [])])}
              />
            </label>
            <div className="ml-auto flex gap-2">
              <Button variant="ghost" size="sm" onClick={reset} className="rounded-xl">Cancelar</Button>
              <Button size="sm" onClick={save} disabled={create.isPending || uploading} className="rounded-xl bg-foreground text-background">
                {create.isPending || uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Guardar"}
              </Button>
            </div>
          </div>
          {files.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {files.map((f, i) => (
                <span key={i} className="inline-flex items-center gap-1.5 rounded-full bg-muted px-2.5 py-1 text-[11px]">
                  <Paperclip className="h-3 w-3" /> <span className="truncate max-w-[140px]">{f.name}</span>
                  <button onClick={() => setFiles((p) => p.filter((_, idx) => idx !== i))}><X className="h-3 w-3" /></button>
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <div className="flex flex-1 min-w-[180px] items-center gap-2 rounded-xl bg-muted/60 px-3 py-2">
          <Search className="h-3.5 w-3.5 text-muted-foreground" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar en notas…" className="w-full bg-transparent text-xs outline-none placeholder:text-muted-foreground" />
          {q && <button onClick={() => setQ("")}><X className="h-3.5 w-3.5 text-muted-foreground" /></button>}
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] text-muted-foreground">Desde</span>
          <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="rounded-xl w-[150px] h-9 text-xs" />
          <span className="text-[11px] text-muted-foreground">Hasta</span>
          <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="rounded-xl w-[150px] h-9 text-xs" />
        </div>
        {hasFilter && <button onClick={clearFilters} className="text-xs text-muted-foreground hover:text-foreground">Limpiar</button>}
      </div>

      <div className="space-y-2">
        {isLoading ? (
          <div className="py-6 text-center"><Loader2 className="mx-auto h-4 w-4 animate-spin text-muted-foreground" /></div>
        ) : pageItems.length === 0 ? (
          <p className="py-6 text-center text-xs text-muted-foreground">Sin notas para los filtros seleccionados.</p>
        ) : (
          pageItems.map((n) => (
            <article key={n.id} className="rounded-2xl border border-border/60 bg-card/40 p-3 group">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-xs uppercase tracking-wider text-muted-foreground">
                    {new Date(n.note_date).toLocaleDateString("es-ES", { day: "2-digit", month: "short", year: "numeric" })}
                  </p>
                  <p className="text-sm font-semibold leading-tight">{n.title}</p>
                </div>
                <button onClick={() => handleDelete(n.id, n.attachments)} className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground opacity-0 group-hover:opacity-100 transition hover:bg-destructive/10 hover:text-destructive" aria-label="Eliminar">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
              {n.content && <p className="mt-1.5 whitespace-pre-wrap text-xs text-muted-foreground">{n.content}</p>}
              {n.attachments.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {n.attachments.map((a) => <AttachmentChip key={a.path} a={a} />)}
                </div>
              )}
            </article>
          ))
        )}
      </div>

      {filtered.length > PAGE_SIZE && (
        <div className="flex items-center justify-between pt-1">
          <span className="text-[11px] text-muted-foreground">
            Página {page} de {totalPages} · {filtered.length} notas
          </span>
          <div className="flex items-center gap-1">
            <Button size="sm" variant="ghost" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))} className="h-7 rounded-lg">
              <ChevronLeft className="h-3.5 w-3.5" />
            </Button>
            <Button size="sm" variant="ghost" disabled={page >= totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))} className="h-7 rounded-lg">
              <ChevronRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
