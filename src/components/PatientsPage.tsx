import { useMemo, useState, useEffect } from "react";
import { Search, Plus, Users, Pencil, Trash2, X, Mail, Phone, Stethoscope, Loader2, FileDown, Printer, FileText, ChevronLeft, ChevronRight, Activity, ChevronDown, LifeBuoy, Filter } from "lucide-react";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PatientForm } from "@/components/PatientForm";
import { usePaginatedPatients, usePatient, useDeletePatient, type Patient } from "@/lib/api/patients";
import { useDoctors, useMyProfile } from "@/lib/api/profiles";
import { useClinicInfo } from "@/lib/api/clinic";
import { Link } from "@tanstack/react-router";
import { useClinicalNotes } from "@/lib/api/clinical-notes";
import { useAuthSession } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

const loadLogoBase64 = (url: string): Promise<string> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(img, 0, 0);
        resolve(canvas.toDataURL("image/png"));
      } else {
        resolve("");
      }
    };
    img.onerror = () => resolve("");
    img.src = url;
  });
};

const STATUSES = ["Todos", "nuevo", "activo", "en_tratamiento", "alta"];
const statusLabel = (s: string) => ({ Todos: "Todos", nuevo: "Nuevo", activo: "Activo", en_tratamiento: "En tratamiento", alta: "Alta" } as Record<string, string>)[s] ?? s;
const tagBg: Record<string, string> = {
  activo: "bg-sage/50 text-sage-foreground",
  en_tratamiento: "bg-mauve/15 text-mauve",
  nuevo: "bg-blush/60 text-blush-foreground",
  alta: "bg-muted text-muted-foreground",
};
const initials = (n: string) => (n || "?").split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase();

export function PatientsPage() {
  const { data: doctors = [] } = useDoctors();
  const del = useDeletePatient();

  const [q, setQ] = useState("");
  const [debouncedQ, setDebouncedQ] = useState("");
  const [status, setStatus] = useState("Todos");
  const [doctorFilter, setDoctorFilter] = useState("Todos");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Patient | null>(null);
  const [toDelete, setToDelete] = useState<Patient | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;

  // Debounce search input by 350ms for server-side search
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQ(q.trim()), 350);
    return () => clearTimeout(timer);
  }, [q]);

  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedQ, status, doctorFilter]);

  const serverStatus = status === "Todos" ? undefined : status;
  const { data: paginatedResult, isLoading, error } = usePaginatedPatients(currentPage, itemsPerPage, debouncedQ || undefined, serverStatus);
  const patients = paginatedResult?.data ?? [];
  const totalCount = paginatedResult?.count ?? 0;

  const doctorMap = useMemo(() => new Map(doctors.map((d) => [d.id, d.full_name || d.email])), [doctors]);

  const { user: me } = useAuthSession();
  const { data: myProfile } = useMyProfile(me?.id);
  const { data: clinic } = useClinicInfo();



  // Server-side pagination - no need for client-side filtering
  const totalPages = Math.ceil(totalCount / itemsPerPage);
  const filteredByDoctor = doctorFilter === "Todos" ? patients : patients.filter((p) => p.assigned_doctor_id === doctorFilter);
  const paginatedPatients = filteredByDoctor;

  const handleDelete = async () => {
    if (!toDelete) return;
    try { await del.mutateAsync(toDelete.id); toast.success("Paciente eliminado"); }
    catch (err) { toast.error(err instanceof Error ? err.message : "Error"); }
    setToDelete(null);
  };

  return (
    <div className="bg-card rounded-[2rem] p-6 shadow-sm min-h-[calc(100vh-8rem)] font-sans flex flex-col">
      {/* TOP HEADER */}
      <header className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <button className="text-muted-foreground hover:text-foreground"><ChevronLeft className="h-5 w-5" /></button>
          <h1 className="text-xl font-bold text-foreground">Pacientes</h1>
        </div>
        <div className="flex-1 max-w-xl mx-auto">
          <div className="flex items-center gap-2 rounded-full bg-muted border border-gray-100 px-4 py-2.5 w-full">
            <Search className="h-4 w-4 text-muted-foreground" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Buscar paciente..."
              className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground text-foreground"
            />
            {q && <button onClick={() => setQ("")} className="text-muted-foreground hover:text-foreground"><X className="h-4 w-4" /></button>}
          </div>
        </div>
        <div className="flex items-center gap-4 hidden md:flex">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 ml-2">
              <img src={`https://api.dicebear.com/7.x/notionists/svg?seed=${myProfile?.full_name}`} className="h-8 w-8 rounded-full bg-primary/10" />
              <div className="hidden lg:block">
                <p className="text-xs font-bold text-foreground">{myProfile?.full_name}</p>
                <p className="text-[10px] text-muted-foreground">{myProfile?.roles?.[0] === "admin" ? "Super admin" : "Doctor"}</p>
              </div>
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            </div>
          </div>
        </div>
      </header>

      {/* SECONDARY TOOLBAR / TABS */}
      <div className="flex flex-wrap items-center justify-between border-b border-border/40 pb-0 mb-6">
        <div className="flex gap-6">
          <button onClick={() => setStatus("Todos")} className={cn("pb-3 text-sm font-bold border-b-2 transition-colors", status === "Todos" ? "border-black text-black" : "border-transparent text-muted-foreground hover:text-foreground")}>Todos</button>
          <button onClick={() => setStatus("activo")} className={cn("pb-3 text-sm font-bold border-b-2 transition-colors", status === "activo" ? "border-black text-black" : "border-transparent text-muted-foreground hover:text-foreground")}>Activos</button>
          <button onClick={() => setStatus("alta")} className={cn("pb-3 text-sm font-bold border-b-2 transition-colors", status === "alta" ? "border-black text-black" : "border-transparent text-muted-foreground hover:text-foreground")}>De Alta</button>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between mb-4">
        <div className="flex items-center gap-2 text-sm font-bold text-muted-foreground">
          <Users className="h-4 w-4" /> {totalCount} pacientes
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-foreground border border-border/40 rounded-xl hover:bg-muted">
            <Filter className="h-3.5 w-3.5" /> Filtros
          </button>
          <button onClick={() => { setEditing(null); setFormOpen(true); }} className="flex items-center gap-2 bg-black text-primary-foreground px-5 py-2.5 rounded-xl text-xs font-bold shadow-md hover:bg-gray-800 transition">
            <Plus className="h-3.5 w-3.5" /> Añadir Paciente
          </button>
        </div>
      </div>

      {/* TABLE */}
      <div className="flex-1 overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-muted text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
              <th className="p-4 w-12 rounded-tl-xl"><input type="checkbox" className="rounded border-gray-300" /></th>
              <th className="p-4">Nombre del Paciente <span className="ml-1">↕</span></th>
              <th className="p-4">ID / DNI <span className="ml-1">↕</span></th>
              <th className="p-4">Contacto <span className="ml-1">↕</span></th>
              <th className="p-4">Edad <span className="ml-1">↕</span></th>
              <th className="p-4">Estado <span className="ml-1">↕</span></th>
              <th className="p-4 rounded-tr-xl">Acción <span className="ml-1">↕</span></th>
            </tr>
          </thead>
          <tbody className="text-sm">
            {isLoading ? (
              <tr><td colSpan={7} className="p-12 text-center"><Loader2 className="mx-auto h-6 w-6 animate-spin text-muted-foreground" /></td></tr>
            ) : patients.length === 0 ? (
              <tr><td colSpan={7} className="p-12 text-center text-muted-foreground font-medium">No se encontraron pacientes.</td></tr>
            ) : (
              paginatedPatients.map((p) => (
                <tr key={p.id} className="border-b border-border/40 hover:bg-muted/50 transition group">
                  <td className="p-4"><input type="checkbox" className="rounded border-gray-300" /></td>
                  <td className="p-4 font-bold text-foreground flex items-center gap-2">
                    {p.full_name}
                    {p.status === "nuevo" && <span className="bg-muted text-muted-foreground text-[9px] px-1.5 py-0.5 rounded-md uppercase">Nuevo</span>}
                  </td>
                  <td className="p-4 text-muted-foreground font-medium">DNI {p.document_id || "—"}</td>
                  <td className="p-4">
                    <p className="text-foreground font-bold text-xs flex items-center gap-1"><Phone className="h-3 w-3 text-muted-foreground"/> {p.phone || "—"}</p>
                  </td>
                  <td className="p-4">
                    <span className="bg-primary/10 text-primary border border-blue-100 text-[9px] font-bold px-2 py-1 rounded-full uppercase tracking-wider">
                      {p.birth_date ? `${new Date().getFullYear() - new Date(p.birth_date).getFullYear()} AÑOS` : "DESCONOCIDO"}
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-1.5 text-foreground font-bold text-xs">
                      <span className={cn("h-2 w-2 rounded-full", p.status === "activo" ? "bg-green-500" : p.status === "nuevo" ? "bg-primary/100" : p.status === "alta" ? "bg-gray-400" : "bg-purple-500")}></span>
                      {statusLabel(p.status)}
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-3 text-muted-foreground">
                      <Link to={`/pacientes/${p.id}`} className="hover:text-primary font-bold text-xs tracking-wide uppercase">Ver</Link>
                      <div className="h-3 w-px bg-gray-200"></div>
                      <button onClick={() => { setEditing(p); setFormOpen(true); }} className="hover:text-foreground"><Pencil className="h-4 w-4" /></button>
                      <button onClick={() => setToDelete(p)} className="hover:text-destructive"><Trash2 className="h-4 w-4" /></button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between pt-4 border-t border-border/40">
          <p className="text-xs text-muted-foreground font-medium">
            Mostrando <span className="font-bold text-foreground">{(currentPage - 1) * itemsPerPage + 1} - {Math.min(totalCount, currentPage * itemsPerPage)}</span> de <span className="font-bold text-foreground">{totalCount}</span> pacientes
          </p>
          <div className="flex gap-1">
            <button disabled={currentPage === 1} onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))} className="h-8 w-8 flex items-center justify-center rounded-lg border border-border/40 text-muted-foreground hover:bg-muted disabled:opacity-50"><ChevronLeft className="h-4 w-4" /></button>
            <button disabled={currentPage === totalPages} onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))} className="h-8 w-8 flex items-center justify-center rounded-lg border border-border/40 text-muted-foreground hover:bg-muted disabled:opacity-50"><ChevronRight className="h-4 w-4" /></button>
          </div>
        </div>
      )}
      
      <PatientForm open={formOpen} onOpenChange={setFormOpen} patient={editing} />

      <AlertDialog open={!!toDelete} onOpenChange={(o) => !o && setToDelete(null)}>
        <AlertDialogContent className="rounded-3xl">
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar paciente?</AlertDialogTitle>
            <AlertDialogDescription>
              Se eliminarán {toDelete?.full_name} y todas sus citas. Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
