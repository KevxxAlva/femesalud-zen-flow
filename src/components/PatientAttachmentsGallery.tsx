import { useMemo, useState, useEffect } from "react";
import { useClinicalNotes, getAttachmentUrl, type ClinicalAttachment } from "@/lib/api/clinical-notes";
import { Loader2, Download, FileText, Image as ImageIcon, ExternalLink, Search } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

function FileCard({ attachment }: { attachment: ClinicalAttachment }) {
  const [loading, setLoading] = useState(false);
  const [imgUrl, setImgUrl] = useState<string | null>(null);
  const isImage = attachment.type?.startsWith("image/");

  useEffect(() => {
    if (isImage) {
      getAttachmentUrl(attachment.path)
        .then((url) => setImgUrl(url))
        .catch((err) => console.error("Error loading image thumbnail:", err));
    }
  }, [attachment, isImage]);

  const handleOpen = async () => {
    try {
      setLoading(true);
      const url = await getAttachmentUrl(attachment.path);
      window.open(url, "_blank", "noopener");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error al abrir el archivo");
    } finally {
      setLoading(false);
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
  };

  return (
    <div className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-border/40 bg-card/40 p-3.5 shadow-sm transition-all duration-300 hover:bg-card hover:shadow-md hover:border-mauve/20">
      <div className="flex flex-col gap-2.5">
        {/* Preview Area */}
        <div className="relative flex aspect-video w-full items-center justify-center overflow-hidden rounded-xl bg-muted/50 border border-border/30">
          {isImage ? (
            imgUrl ? (
              <img
                src={imgUrl}
                alt={attachment.name}
                className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                loading="lazy"
              />
            ) : (
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground/60" />
            )
          ) : (
            <div className="flex flex-col items-center gap-1.5 text-muted-foreground/80">
              <FileText className="h-10 w-10 text-mauve/80" />
              <span className="text-[10px] font-bold uppercase tracking-wider bg-mauve/10 text-mauve px-2 py-0.5 rounded-md">PDF</span>
            </div>
          )}
        </div>

        {/* Info */}
        <div className="min-w-0">
          <p className="truncate text-xs font-semibold text-foreground group-hover:text-mauve transition-colors" title={attachment.name}>
            {attachment.name}
          </p>
          <p className="text-[10px] text-muted-foreground font-medium mt-0.5">
            {formatSize(attachment.size)}
          </p>
        </div>
      </div>

      {/* Button */}
      <button
        onClick={handleOpen}
        disabled={loading}
        className="mt-3.5 flex w-full items-center justify-center gap-1.5 rounded-xl bg-muted/60 hover:bg-mauve/10 hover:text-mauve px-3 py-2 text-xs font-semibold transition cursor-pointer disabled:opacity-50"
      >
        {loading ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : isImage ? (
          <>
            <ImageIcon className="h-3.5 w-3.5" /> Ver imagen
          </>
        ) : (
          <>
            <Download className="h-3.5 w-3.5" /> Descargar PDF
          </>
        )}
      </button>
    </div>
  );
}

export function PatientAttachmentsGallery({ patientId }: { patientId: string }) {
  const { data: notes = [], isLoading } = useClinicalNotes(patientId);
  const [searchQuery, setSearchQuery] = useState("");

  const attachments = useMemo(() => {
    const list: (ClinicalAttachment & { noteTitle: string; noteDate: string })[] = [];
    notes.forEach((note) => {
      if (Array.isArray(note.attachments)) {
        note.attachments.forEach((a) => {
          list.push({
            ...a,
            noteTitle: note.title,
            noteDate: note.note_date,
          });
        });
      }
    });
    return list;
  }, [notes]);

  const filtered = useMemo(() => {
    return attachments.filter((a) =>
      a.name.toLowerCase().includes(searchQuery.toLowerCase().trim())
    );
  }, [attachments, searchQuery]);

  if (isLoading) {
    return (
      <div className="py-12 text-center">
        <Loader2 className="mx-auto h-6 w-6 animate-spin text-muted-foreground" />
        <p className="text-xs text-muted-foreground mt-2">Cargando galería de archivos...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h4 className="text-sm font-semibold flex items-center gap-2">
            <ImageIcon className="h-4 w-4 text-mauve" /> Galería de Adjuntos
            <span className="text-[11px] font-normal text-muted-foreground">({filtered.length} archivos)</span>
          </h4>
          <p className="text-[11px] text-muted-foreground mt-0.5">Todos los archivos cargados en las notas clínicas de esta paciente.</p>
        </div>

        {attachments.length > 0 && (
          <div className="flex items-center gap-2 rounded-xl bg-muted/60 px-3 py-1.5 w-full sm:w-[220px]">
            <Search className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar archivos..."
              className="w-full bg-transparent text-xs outline-none placeholder:text-muted-foreground"
            />
          </div>
        )}
      </div>

      {attachments.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border/70 p-12 text-center bg-card/20">
          <ImageIcon className="mx-auto h-8 w-8 text-muted-foreground/50 mb-2.5" />
          <p className="text-xs font-semibold text-muted-foreground">No hay archivos adjuntos en el historial</p>
          <p className="text-[10px] text-muted-foreground mt-1 max-w-[260px] mx-auto">Sube ecografías o laboratorios en PDF desde la pestaña de "Notas Clínicas".</p>
        </div>
      ) : filtered.length === 0 ? (
        <p className="py-6 text-center text-xs text-muted-foreground">Sin archivos que coincidan con la búsqueda.</p>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5">
          {filtered.map((att) => (
            <FileCard key={att.path} attachment={att} />
          ))}
        </div>
      )}
    </div>
  );
}
