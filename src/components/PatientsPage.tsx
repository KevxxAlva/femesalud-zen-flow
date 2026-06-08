import { useMemo, useState } from "react";
import { Search, Plus, Users, Pencil, Trash2, X, Mail, Phone, Stethoscope } from "lucide-react";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { PatientForm } from "@/components/PatientForm";
import { store, useStore, DOCTORS, type Patient, type PatientStatus } from "@/lib/store";
import { cn } from "@/lib/utils";

const STATUSES = ["Todos", "Activo", "En tratamiento", "Alta", "Nuevo"] as const;
const tagBg: Record<PatientStatus, string> = {
  Activo: "bg-sage/50 text-sage-foreground",
  "En tratamiento": "bg-mauve/15 text-mauve",
  Nuevo: "bg-blush/60 text-blush-foreground",
  Alta: "bg-muted text-muted-foreground",
};
const initials = (n: string) => n.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase();

export function PatientsPage() {
  const patients = useStore((s) => s.patients);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<(typeof STATUSES)[number]>("Todos");
  const [doctor, setDoctor] = useState<string>("Todos");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Patient | null>(null);
  const [viewing, setViewing] = useState<Patient | null>(null);
  const [toDelete, setToDelete] = useState<Patient | null>(null);

  const filtered = useMemo(() => {
    const term = q.toLowerCase().trim();
    return patients.filter((p) => {
      if (term && !p.name.toLowerCase().includes(term) && !p.email.toLowerCase().includes(term)) return false;
      if (status !== "Todos" && p.status !== status) return false;
      if (doctor !== "Todos" && p.doctor !== doctor) return false;
      return true;
    });
  }, [patients, q, status, doctor]);

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div className="ml-14 md:ml-0">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Módulo</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">Pacientes</h1>
          <p className="text-sm text-muted-foreground">{filtered.length} de {patients.length} pacientes</p>
        </div>
        <Button onClick={() => { setEditing(null); setFormOpen(true); }} className="rounded-2xl bg-gradient-to-r from-mauve to-mauve-soft text-primary-foreground shadow-sm shadow-mauve/30 hover:opacity-95">
          <Plus className="mr-1 h-4 w-4" /> Nuevo paciente
        </Button>
      </header>

      {/* Filters */}
      <div className="rounded-3xl glass-card p-4 shadow-sm">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex flex-1 min-w-[220px] items-center gap-2 rounded-2xl bg-muted/60 px-3.5 py-2.5">
            <Search className="h-4 w-4 text-muted-foreground" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Buscar por nombre o email…"
              className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
            {q && (
              <button onClick={() => setQ("")} className="text-muted-foreground hover:text-foreground"><X className="h-4 w-4" /></button>
            )}
          </div>
          <Select value={status} onValueChange={(v) => setStatus(v as typeof status)}>
            <SelectTrigger className="w-[170px] rounded-2xl"><SelectValue placeholder="Estado" /></SelectTrigger>
            <SelectContent>{STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
          </Select>
          <Select value={doctor} onValueChange={setDoctor}>
            <SelectTrigger className="w-[210px] rounded-2xl"><SelectValue placeholder="Médico" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="Todos">Todos los médicos</SelectItem>
              {DOCTORS.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="rounded-3xl glass-card p-12 text-center shadow-sm">
          <Users className="mx-auto h-10 w-10 text-muted-foreground" />
          <p className="mt-3 text-sm text-muted-foreground">No se encontraron pacientes con esos filtros.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((p) => (
            <div key={p.id} className="group rounded-3xl glass-card p-5 shadow-sm transition-all duration-300 hover:shadow-md">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-mauve/80 to-blush text-sm font-semibold text-primary-foreground shadow-sm">
                    {initials(p.name)}
                  </div>
                  <div>
                    <p className="text-sm font-semibold leading-tight">{p.name}</p>
                    <p className="text-[11px] text-muted-foreground">{p.age} años</p>
                  </div>
                </div>
                <span className={cn("rounded-full px-2.5 py-0.5 text-[11px] font-medium", tagBg[p.status])}>{p.status}</span>
              </div>
              <div className="mt-4 space-y-1.5 text-xs text-muted-foreground">
                <p className="flex items-center gap-2"><Mail className="h-3.5 w-3.5" /> {p.email || "—"}</p>
                <p className="flex items-center gap-2"><Phone className="h-3.5 w-3.5" /> {p.phone || "—"}</p>
                <p className="flex items-center gap-2"><Stethoscope className="h-3.5 w-3.5" /> {p.doctor}</p>
              </div>
              <div className="mt-4 flex items-center justify-between gap-2 border-t border-border/60 pt-3">
                <button onClick={() => setViewing(p)} className="text-xs font-medium text-mauve hover:underline">Ver detalle →</button>
                <div className="flex gap-1">
                  <button
                    onClick={() => { setEditing(p); setFormOpen(true); }}
                    className="flex h-8 w-8 items-center justify-center rounded-xl text-muted-foreground transition hover:bg-mauve/10 hover:text-mauve"
                    aria-label="Editar"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => setToDelete(p)}
                    className="flex h-8 w-8 items-center justify-center rounded-xl text-muted-foreground transition hover:bg-destructive/10 hover:text-destructive"
                    aria-label="Eliminar"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <PatientForm open={formOpen} onOpenChange={setFormOpen} patient={editing} />

      {/* View detail */}
      <Dialog open={!!viewing} onOpenChange={(o) => !o && setViewing(null)}>
        <DialogContent className="sm:max-w-md rounded-3xl">
          {viewing && (
            <>
              <DialogHeader>
                <DialogTitle>Detalle del paciente</DialogTitle>
              </DialogHeader>
              <div className="flex items-center gap-3">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-mauve to-blush text-base font-semibold text-primary-foreground">
                  {initials(viewing.name)}
                </div>
                <div>
                  <p className="text-base font-semibold">{viewing.name}</p>
                  <span className={cn("inline-block rounded-full px-2.5 py-0.5 text-[11px] font-medium", tagBg[viewing.status])}>{viewing.status}</span>
                </div>
              </div>
              <dl className="mt-3 grid grid-cols-2 gap-3 text-sm">
                <div><dt className="text-xs text-muted-foreground">Edad</dt><dd>{viewing.age} años</dd></div>
                <div><dt className="text-xs text-muted-foreground">Última visita</dt><dd>{new Date(viewing.lastVisit).toLocaleDateString("es-ES")}</dd></div>
                <div className="col-span-2"><dt className="text-xs text-muted-foreground">Email</dt><dd>{viewing.email || "—"}</dd></div>
                <div className="col-span-2"><dt className="text-xs text-muted-foreground">Teléfono</dt><dd>{viewing.phone || "—"}</dd></div>
                <div className="col-span-2"><dt className="text-xs text-muted-foreground">Médico asignado</dt><dd>{viewing.doctor}</dd></div>
                {viewing.notes && <div className="col-span-2"><dt className="text-xs text-muted-foreground">Notas</dt><dd>{viewing.notes}</dd></div>}
              </dl>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete confirm */}
      <AlertDialog open={!!toDelete} onOpenChange={(o) => !o && setToDelete(null)}>
        <AlertDialogContent className="rounded-3xl">
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar paciente?</AlertDialogTitle>
            <AlertDialogDescription>
              Se eliminarán {toDelete?.name} y todas sus citas asociadas. Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => { if (toDelete) store.deletePatient(toDelete.id); setToDelete(null); }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
