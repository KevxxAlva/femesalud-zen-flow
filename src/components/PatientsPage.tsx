import { useMemo, useState, useEffect } from "react";
import { Plus, Loader2, FileSpreadsheet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PatientForm } from "@/components/PatientForm";
import { usePaginatedPatients, usePatient, useDeletePatient, type Patient } from "@/lib/api/patients";
import { useDoctors, useMyProfile } from "@/lib/api/profiles";
import { useClinicInfo } from "@/lib/api/clinic";
import { useClinicalNotes } from "@/lib/api/clinical-notes";
import { useAuthSession } from "@/hooks/useAuth";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

// Export functionalities
import { exportFichaMedica } from "@/lib/pdf/ficha-medica";
import { exportReposo } from "@/lib/pdf/reposo";
import { exportConstanciaAtencion } from "@/lib/pdf/constancia-atencion";
import { exportJustificativo } from "@/lib/pdf/justificativo";

// New decoupled components
import { PatientFilters } from "./patients/PatientFilters";
import { PatientList } from "./patients/PatientList";
import { PatientDetailDialog } from "./patients/PatientDetailDialog";
import { PatientExportModals } from "./patients/PatientExportModals";

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
  const [viewingLightweight, setViewing] = useState<Patient | null>(null);
  
  const { data: fullViewingPatient, isLoading: isViewingPatientLoading } = usePatient(viewingLightweight?.id);
  const viewing = fullViewingPatient || viewingLightweight;
  
  const [toDelete, setToDelete] = useState<Patient | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;

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
  const { data: patientNotes = [] } = useClinicalNotes(viewingLightweight?.id);

  // Document export states
  const [openReposo, setOpenReposo] = useState(false);
  const [openAtencion, setOpenAtencion] = useState(false);
  const [openJustificativo, setOpenJustificativo] = useState(false);

  // Form states for certificates
  const [reposoDays, setReposoDays] = useState("3");
  const [reposoStart, setReposoStart] = useState(() => new Date().toISOString().slice(0, 10));
  const [reposoReason, setReposoReason] = useState("");

  const [atencionDate, setAtencionDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [atencionTime, setAtencionTime] = useState("10:00");
  const [atencionReason, setAtencionReason] = useState("");

  const [justificativoDate, setJustificativoDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [justificativoReason, setJustificativoReason] = useState("");
  const [justificativoDays, setJustificativoDays] = useState("1");

  // Doctor credentials
  const [doctorUni, setDoctorUni] = useState("UC-CHET");
  const [doctorMpps, setDoctorMpps] = useState("102.927");
  const [doctorCmc, setDoctorCmc] = useState("11.619");

  const fillDoctorCredentials = (patient: Patient) => {
    const docObj = doctors.find((d) => d.id === patient.assigned_doctor_id) || myProfile;
    const docName = docObj?.full_name || "";
    if (docObj && (docObj.university || docObj.mpps || docObj.cmc)) {
      setDoctorUni(docObj.university || "");
      setDoctorMpps(docObj.mpps || "");
      setDoctorCmc(docObj.cmc || "");
    } else if (docName.toLowerCase().includes("carli") || docName.toLowerCase().includes("sole") || docName.toLowerCase().includes("solé")) {
      setDoctorUni("UC-CHET");
      setDoctorMpps("102.927");
      setDoctorCmc("11.619");
    } else {
      setDoctorUni(docObj?.specialty ? "Ginecólogo Obstetra" : "UC-CHET");
      setDoctorMpps("");
      setDoctorCmc("");
    }
  };

  const handleOpenReposoDialog = (patient: Patient) => {
    fillDoctorCredentials(patient);
    setReposoReason("");
    setOpenReposo(true);
  };

  const handleOpenAtencionDialog = (patient: Patient) => {
    fillDoctorCredentials(patient);
    setAtencionReason("");
    setOpenAtencion(true);
  };

  const handleOpenJustificativoDialog = (patient: Patient) => {
    fillDoctorCredentials(patient);
    setJustificativoReason("");
    setJustificativoDays("1");
    setOpenJustificativo(true);
  };

  const getDoctorInfoForPdf = (patient: Patient) => {
    const docObj = doctors.find((d) => d.id === patient.assigned_doctor_id);
    return {
      name: docObj?.full_name || myProfile?.full_name || "Dra. Carli Solé Aquino",
      specialty: docObj?.specialty || myProfile?.specialty || "Ginecólogo Obstetra",
      uni: docObj?.full_name?.toLowerCase().includes("carli") || docObj?.full_name?.toLowerCase().includes("sole") ? "UC-CHET" : (docObj?.specialty ? "Ginecólogo Obstetra" : "UC-CHET"),
      mpps: docObj?.full_name?.toLowerCase().includes("carli") || docObj?.full_name?.toLowerCase().includes("sole") ? "102.927" : "",
      cmc: docObj?.full_name?.toLowerCase().includes("carli") || docObj?.full_name?.toLowerCase().includes("sole") ? "11.619" : "",
    };
  };

  const handleExportFicha = async (patient: Patient) => {
    await exportFichaMedica(patient, clinic, doctorMap, patientNotes);
  };

  const handleExportReposo = async () => {
    if (!viewing) return;
    await exportReposo(viewing, clinic, getDoctorInfoForPdf(viewing), reposoReason, reposoDays, reposoStart);
    setOpenReposo(false);
  };

  const handleExportAtencion = async () => {
    if (!viewing) return;
    await exportConstanciaAtencion(viewing, clinic, getDoctorInfoForPdf(viewing), atencionReason, atencionDate);
    setOpenAtencion(false);
  };

  const handleExportJustificativo = async () => {
    if (!viewing) return;
    await exportJustificativo(viewing, clinic, getDoctorInfoForPdf(viewing), justificativoReason, justificativoDays, justificativoDate);
    setOpenJustificativo(false);
  };

  const totalPages = Math.ceil(totalCount / itemsPerPage);
  const filteredByDoctor = doctorFilter === "Todos" ? patients : patients.filter((p) => p.assigned_doctor_id === doctorFilter);
  const paginatedPatients = filteredByDoctor;

  const [isExportingExcel, setIsExportingExcel] = useState(false);
  const handleExportExcel = async () => {
    try {
      setIsExportingExcel(true);
      let query = supabase
        .from("patients")
        .select("id, full_name, email, phone, status, assigned_doctor_id, created_at, document_id, historia_number")
        .order("created_at", { ascending: false });

      if (debouncedQ) {
        query = query.or(
          `full_name.ilike.%${debouncedQ}%,email.ilike.%${debouncedQ}%,document_id.ilike.%${debouncedQ}%`
        );
      }
      if (status !== "Todos") {
        query = query.eq("status", status);
      }

      const { data, error } = await query;
      if (error) throw error;

      if (!data || data.length === 0) {
        toast.warning("No hay pacientes para exportar con los filtros seleccionados");
        return;
      }

      const excelData = data.map((p) => ({
        "Nº Historia": p.historia_number || "—",
        "Nombre Completo": p.full_name,
        "Cédula / ID": p.document_id || "—",
        "Email": p.email || "—",
        "Teléfono": p.phone || "—",
        "Estado": statusLabel(p.status),
        "Médico Asignado": doctorMap.get(p.assigned_doctor_id || "") || "Sin asignar",
        "Fecha de Registro": new Date(p.created_at).toLocaleDateString("es-ES"),
      }));

      const XLSX = await import("xlsx");
      const ws = XLSX.utils.json_to_sheet(excelData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Pacientes");

      const maxLens = Object.keys(excelData[0] || {}).map((key) => {
        return Math.max(
          key.length,
          ...excelData.map((row) => String(row[key as keyof typeof row] || "").length)
        );
      });
      ws["!cols"] = maxLens.map((len) => ({ wch: len + 3 }));

      XLSX.writeFile(wb, `femesalud-pacientes-${new Date().toISOString().slice(0, 10)}.xlsx`);
      toast.success(`${data.length} pacientes exportados a Excel`);
    } catch (err) {
      toast.error("Error al exportar a Excel");
      console.error(err);
    } finally {
      setIsExportingExcel(false);
    }
  };

  const handleDelete = async () => {
    if (!toDelete) return;
    try { await del.mutateAsync(toDelete.id); toast.success("Paciente eliminado"); }
    catch (err) { toast.error(err instanceof Error ? err.message : "Error"); }
    setToDelete(null);
  };

  // Resolve deletion automatically via side effect since we just fire delete without a modal confirmation in the original?
  // Wait, original had handleDelete and used setToDelete(p), but where was the dialog? 
  // Ah! There was no AlertDialog in the return of original! Wait, it seems there wasn't an alert dialog in the massive file either! Wait, line 8 was imported but never used? Yes, lines 8-10 imported AlertDialog but it was missing in render. We will execute deletion instantly or keep it as it was.
  useEffect(() => {
    if (toDelete) {
      if (window.confirm(`¿Estás seguro de que deseas eliminar a ${toDelete.full_name}?`)) {
        handleDelete();
      } else {
        setToDelete(null);
      }
    }
  }, [toDelete]);

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div className="ml-14 md:ml-0">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Módulo</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">Pacientes</h1>
          <p className="text-sm text-muted-foreground">{totalCount} pacientes</p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={handleExportExcel}
            disabled={isExportingExcel}
            variant="outline"
            className="rounded-2xl border-border/80 text-foreground hover:bg-muted cursor-pointer"
          >
            {isExportingExcel ? (
              <Loader2 className="mr-1 h-4 w-4 animate-spin" />
            ) : (
              <FileSpreadsheet className="mr-1 h-4 w-4 text-emerald-600" />
            )}
            Exportar Excel
          </Button>
          <Button onClick={() => { setEditing(null); setFormOpen(true); }} className="rounded-2xl bg-gradient-to-r from-mauve to-mauve-soft text-primary-foreground shadow-sm shadow-mauve/30 hover:opacity-95 cursor-pointer">
            <Plus className="mr-1 h-4 w-4" /> Nuevo paciente
          </Button>
        </div>
      </header>

      <PatientFilters 
        q={q} setQ={setQ} 
        status={status} setStatus={setStatus}
        doctorFilter={doctorFilter} setDoctorFilter={setDoctorFilter}
        doctors={doctors} STATUSES={STATUSES} statusLabel={statusLabel}
      />

      <PatientList 
        paginatedPatients={paginatedPatients}
        isLoading={isLoading}
        error={error}
        totalCount={totalCount}
        currentPage={currentPage}
        totalPages={totalPages}
        itemsPerPage={itemsPerPage}
        setCurrentPage={setCurrentPage}
        setViewing={setViewing}
        setEditing={setEditing}
        setFormOpen={setFormOpen}
        setToDelete={setToDelete}
        doctorMap={doctorMap}
        tagBg={tagBg}
        statusLabel={statusLabel}
        initials={initials}
      />

      <PatientForm open={formOpen} onOpenChange={setFormOpen} patient={editing} />

      <PatientDetailDialog 
        viewing={viewing}
        setViewing={setViewing}
        doctorMap={doctorMap}
        tagBg={tagBg}
        statusLabel={statusLabel}
        initials={initials}
        handleExportFicha={handleExportFicha}
        handleOpenReposoDialog={handleOpenReposoDialog}
        handleOpenAtencionDialog={handleOpenAtencionDialog}
        handleOpenJustificativoDialog={handleOpenJustificativoDialog}
      />

      <PatientExportModals 
        openReposo={openReposo} setOpenReposo={setOpenReposo}
        reposoDays={reposoDays} setReposoDays={setReposoDays}
        reposoStart={reposoStart} setReposoStart={setReposoStart}
        reposoReason={reposoReason} setReposoReason={setReposoReason}
        handleExportReposo={handleExportReposo}

        openAtencion={openAtencion} setOpenAtencion={setOpenAtencion}
        atencionDate={atencionDate} setAtencionDate={setAtencionDate}
        atencionTime={atencionTime} setAtencionTime={setAtencionTime}
        atencionReason={atencionReason} setAtencionReason={setAtencionReason}
        handleExportAtencion={handleExportAtencion}

        openJustificativo={openJustificativo} setOpenJustificativo={setOpenJustificativo}
        justificativoDate={justificativoDate} setJustificativoDate={setJustificativoDate}
        justificativoDays={justificativoDays} setJustificativoDays={setJustificativoDays}
        justificativoReason={justificativoReason} setJustificativoReason={setJustificativoReason}
        handleExportJustificativo={handleExportJustificativo}

        doctorUni={doctorUni} setDoctorUni={setDoctorUni}
        doctorMpps={doctorMpps} setDoctorMpps={setDoctorMpps}
        doctorCmc={doctorCmc} setDoctorCmc={setDoctorCmc}
      />
    </div>
  );
}
