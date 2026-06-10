import { useMemo, useState } from "react";
import { Plus, FlaskConical, Loader2, Pencil, Trash2, CheckCircle2, Clock, Filter, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  useLabResults, useCreateLabResult, useUpdateLabResult, useDeleteLabResult,
  type LabResultWithMeta,
} from "@/lib/api/lab-results";
import { useAppointments } from "@/lib/api/appointments";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const statusBg: Record<string, string> = {
  pendiente: "bg-blush/60 text-blush-foreground",
  completado: "bg-sage/50 text-sage-foreground",
};

export function LaboratoryPage() {
  const { data: labs = [], isLoading } = useLabResults();
  const { data: appointments = [] } = useAppointments();
  const create = useCreateLabResult();
  const update = useUpdateLabResult();
  const del = useDeleteLabResult();

  const [filter, setFilter] = useState<"todos" | "pendiente" | "completado">("todos");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<LabResultWithMeta | null>(null);
  const [toDelete, setToDelete] = useState<LabResultWithMeta | null>(null);

  const [appointmentId, setAppointmentId] = useState("");
  const [testType, setTestType] = useState("");
  const [result, setResult] = useState("");
  const [status, setStatus] = useState("pendiente");
  const [fileUrl, setFileUrl] = useState("");

  const openNew = () => {
    setEditing(null);
    setAppointmentId(""); setTestType(""); setResult(""); setStatus("pendiente"); setFileUrl("");
    setFormOpen(true);
  };

  const openEdit = (l: LabResultWithMeta) => {
    setEditing(l);
    setAppointmentId(l.appointment_id);
    setTestType(l.test_type);
    setResult(l.result ?? "");
    setStatus(l.status);
    setFileUrl(l.file_url ?? "");
    setFormOpen(true);
  };

  const filtered = useMemo(() => labs.filter((l) => filter === "todos" || l.status === filter), [labs, filter]);

  const counts = useMemo(() => ({
    todos: labs.length,
    pendiente: labs.filter((l) => l.status === "pendiente").length,
    completado: labs.filter((l) => l.status === "completado").length,
  }), [labs]);

  const save = async () => {
    if (!appointmentId) return toast.error("Selecciona una cita");
    if (!testType.trim()) return toast.error("Indica el tipo de prueba");
    const appt = appointments.find((a) => a.id === appointmentId);
    if (!appt) return toast.error("Cita no encontrada");
    try {
      if (editing) {
        await update.mutateAsync({
          id: editing.id, appointment_id: appointmentId, test_type: testType.trim(),
          result: result || null, status, file_url: fileUrl || null,
          result_date: status === "completado" ? new Date().toISOString() : null,
        });
        toast.success("Resultado actualizado");
      } else {
        await create.mutateAsync({
          appointment_id: appointmentId, patient_id: appt.patient_id, test_type: testType.trim(),
          result: result || null, status, file_url: fileUrl || null,
          result_date: status === "completado" ? new Date().toISOString() : null,
        });
        toast.success("Resultado creado");
      }
      setFormOpen(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error");
    }
  };

  const toggleStatus = async (l: LabResultWithMeta) => {
    const next = l.status === "completado" ? "pendiente" : "completado";
    try {
      await update.mutateAsync({
        id: l.id, status: next,
        result_date: next === "completado" ? new Date().toISOString() : null,
      });
      toast.success(next === "completado" ? "Marcado como completado" : "Marcado como pendiente");
    } catch (err) { toast.error(err instanceof Error ? err.message : "Error"); }
  };

  const handleDelete = async () => {
    if (!toDelete) return;
    try { await del.mutateAsync(toDelete.id); toast.success("Eliminado"); }
    catch (err) { toast.error(err instanceof Error ? err.message : "Error"); }
    setToDelete(null);
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div className="ml-14 md:ml-0">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Módulo</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">Laboratorio</h1>
          <p className="text-sm text-muted-foreground">{filtered.length} resultados</p>
        </div>
        <Button onClick={openNew} className="rounded-2xl bg-gradient-to-r from-mauve to-mauve-soft text-primary-foreground shadow-sm shadow-mauve/30">
          <Plus className="mr-1 h-4 w-4" /> Cargar resultado
        </Button>
      </header>

      <div className="rounded-3xl glass-card p-4 shadow-sm">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
            <Filter className="h-3.5 w-3.5" /> Estado
          </div>
          <div className="flex gap-1.5">
            {(["todos", "pendiente", "completado"] as const).map((s) => (
              <button key={s} onClick={() => setFilter(s)} className={cn(
                "rounded-full px-3.5 py-1.5 text-xs font-medium capitalize transition-all duration-300",
                filter === s ? "bg-gradient-to-r from-mauve to-mauve-soft text-primary-foreground shadow-sm shadow-mauve/20" : "bg-muted/60 text-muted-foreground hover:bg-muted",
              )}>{s} · {counts[s]}</button>
            ))}
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="rounded-3xl glass-card p-12 text-center"><Loader2 className="mx-auto h-6 w-6 animate-spin text-muted-foreground" /></div>
      ) : filtered.length === 0 ? (
        <div className="rounded-3xl glass-card p-12 text-center shadow-sm">
          <FlaskConical className="mx-auto h-10 w-10 text-muted-foreground" />
          <p className="mt-3 text-sm text-muted-foreground">Aún no hay resultados de laboratorio.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-3xl glass-card shadow-sm">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-left">
              <tr className="text-xs uppercase tracking-wider text-muted-foreground">
                <th className="px-5 py-3">Paciente</th>
                <th className="px-5 py-3">Prueba</th>
                <th className="px-5 py-3">Cita</th>
                <th className="px-5 py-3">Estado</th>
                <th className="px-5 py-3">Resultado</th>
                <th className="px-5 py-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {filtered.map((l) => (
                <tr key={l.id} className="transition hover:bg-muted/30">
                  <td className="px-5 py-3 font-medium">{l.patient_name}</td>
                  <td className="px-5 py-3">{l.test_type}</td>
                  <td className="px-5 py-3 text-xs text-muted-foreground">
                    {l.scheduled_at ? new Date(l.scheduled_at).toLocaleString("es-ES", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }) : "—"}
                  </td>
                  <td className="px-5 py-3">
                    <span className={cn("inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-medium capitalize", statusBg[l.status] || "bg-muted")}>
                      {l.status === "completado" ? <CheckCircle2 className="h-3 w-3" /> : <Clock className="h-3 w-3" />}
                      {l.status}
                    </span>
                  </td>
                  <td className="px-5 py-3 max-w-[260px] truncate text-xs text-muted-foreground">
                    {l.result || "—"}
                    {l.file_url && (
                      <a href={l.file_url} target="_blank" rel="noreferrer" className="ml-2 inline-flex items-center gap-1 text-mauve hover:underline">
                        archivo <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => toggleStatus(l)} className="flex h-8 w-8 items-center justify-center rounded-xl text-muted-foreground transition hover:bg-sage/30 hover:text-sage-foreground" aria-label="Cambiar estado">
                        <CheckCircle2 className="h-4 w-4" />
                      </button>
                      <button onClick={() => openEdit(l)} className="flex h-8 w-8 items-center justify-center rounded-xl text-muted-foreground transition hover:bg-mauve/10 hover:text-mauve" aria-label="Editar">
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button onClick={() => setToDelete(l)} className="flex h-8 w-8 items-center justify-center rounded-xl text-muted-foreground transition hover:bg-destructive/10 hover:text-destructive" aria-label="Eliminar">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="sm:max-w-lg rounded-3xl">
          <DialogHeader><DialogTitle>{editing ? "Editar resultado" : "Cargar resultado"}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div>
              <label className="text-xs text-muted-foreground">Cita</label>
              <Select value={appointmentId} onValueChange={setAppointmentId}>
                <SelectTrigger className="rounded-xl"><SelectValue placeholder="Selecciona una cita" /></SelectTrigger>
                <SelectContent>
                  {appointments.map((a) => (
                    <SelectItem key={a.id} value={a.id}>
                      {a.patient_name} — {new Date(a.scheduled_at).toLocaleString("es-ES", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Tipo de prueba</label>
              <Input value={testType} onChange={(e) => setTestType(e.target.value)} placeholder="Hemograma, glucosa, etc." className="rounded-xl" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Resultado / Observaciones</label>
              <Textarea value={result} onChange={(e) => setResult(e.target.value)} placeholder="Valores, interpretación…" className="rounded-xl min-h-[80px]" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-muted-foreground">Estado</label>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pendiente">Pendiente</SelectItem>
                    <SelectItem value="completado">Completado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs text-muted-foreground">URL archivo (opcional)</label>
                <Input value={fileUrl} onChange={(e) => setFileUrl(e.target.value)} placeholder="https://…" className="rounded-xl" />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setFormOpen(false)} className="rounded-xl">Cancelar</Button>
            <Button onClick={save} disabled={create.isPending || update.isPending} className="rounded-xl bg-gradient-to-r from-mauve to-mauve-soft text-primary-foreground">
              {(create.isPending || update.isPending) ? <Loader2 className="h-4 w-4 animate-spin" /> : "Guardar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!toDelete} onOpenChange={(o) => !o && setToDelete(null)}>
        <AlertDialogContent className="rounded-3xl">
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar resultado?</AlertDialogTitle>
            <AlertDialogDescription>Esta acción no se puede deshacer.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Eliminar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
