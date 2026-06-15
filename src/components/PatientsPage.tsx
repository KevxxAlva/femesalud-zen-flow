import { useMemo, useState, useEffect } from "react";
import { Search, Plus, Users, Pencil, Trash2, X, Mail, Phone, Stethoscope, Loader2, FileDown, Printer, FileText, ChevronLeft, ChevronRight } from "lucide-react";
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
import { ClinicalNotesPanel } from "@/components/ClinicalNotesPanel";
import { PatientTimeline } from "@/components/PatientTimeline";
import { usePaginatedPatients, usePatient, useDeletePatient, type Patient } from "@/lib/api/patients";
import { useDoctors, useMyProfile } from "@/lib/api/profiles";
import { useClinicInfo } from "@/lib/api/clinic";
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
  const [viewingLightweight, setViewing] = useState<Patient | null>(null);
  const { data: fullViewingPatient, isLoading: isViewingPatientLoading } = usePatient(viewingLightweight?.id);
  const viewing = fullViewingPatient || viewingLightweight;
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

  const handleOpenReposoDialog = (patient: Patient) => {
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
    setReposoReason("");
    setOpenReposo(true);
  };

  const handleOpenAtencionDialog = (patient: Patient) => {
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
    setAtencionReason("");
    setOpenAtencion(true);
  };

  const handleOpenJustificativoDialog = (patient: Patient) => {
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
    setJustificativoReason("");
    setJustificativoDays("1");
    setOpenJustificativo(true);
  };

  const handleExportFicha = async (patient: Patient) => {
    try {
      const doc = new jsPDF({ unit: "pt", format: "a4" });
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();

      const logoBase64 = await loadLogoBase64("/logo.png");

      // Font Setup
      doc.setFont("times", "normal");
      doc.setFontSize(8.5);
      doc.setTextColor(60, 60, 60);

      const clinicAddress1 = clinic?.address_line1 || "Calle las Flores entre González Padrón y Shettino, Número 16.";
      const clinicAddress2 = clinic?.address_line2 || "Valle de la Pascua, Estado Guárico.";
      const clinicPhone = clinic?.phone || "0412/8299890 0424/4609387";
      const clinicName = clinic?.name || "Femesalud";
      const clinicRif = clinic?.rif || "";

      // Top Header
      doc.text(clinicAddress1, pageWidth / 2, 45, { align: "center" });
      doc.text(clinicAddress2, pageWidth / 2, 57, { align: "center" });
      const headerLine3 = clinicRif ? `Teléfono: ${clinicPhone} | RIF: ${clinicRif}` : `Teléfono: ${clinicPhone}`;
      doc.text(headerLine3, pageWidth / 2, 69, { align: "center" });

      // Consultorio Header
      doc.setFont("times", "normal");
      doc.setFontSize(12.5);
      doc.setTextColor(0);
      doc.text("Consultorio Ginecológico Obstétrico", pageWidth / 2, 105, { align: "center" });
      doc.setFont("times", "italic");
      doc.setFontSize(17.5);
      doc.text(clinicName, pageWidth / 2, 122, { align: "center" });

      // Date Format: Valle de la Pascua, DD / MM / AAAA
      const today = new Date();
      const topDay = String(today.getDate()).padStart(2, "0");
      const topMonth = String(today.getMonth() + 1).padStart(2, "0");
      const topYear = String(today.getFullYear());
      doc.setFont("times", "normal");
      doc.setFontSize(10.5);
      doc.text(`Valle de la Pascua,   ${topDay}   /   ${topMonth}   /   ${topYear}`, pageWidth - 40, 155, { align: "right" });

      doc.setFont("times", "bold");
      doc.setFontSize(13);
      doc.text("FICHA DE HISTORIAL CLÍNICO", pageWidth / 2, 195, { align: "center" });
      const titleWidth = doc.getTextWidth("FICHA DE HISTORIAL CLÍNICO");
      doc.setDrawColor(0);
      doc.setLineWidth(0.5);
      doc.line(pageWidth / 2 - titleWidth / 2, 198, pageWidth / 2 + titleWidth / 2, 198);

      doc.setFont("times", "bold");
      doc.setFontSize(11);
      doc.text("Datos de Identificación y Consulta", 40, 225);

      autoTable(doc, {
        startY: 235,
        body: [
          ["Nº Historia", patient.historia_number || "—", "Fecha 1ª Cita", patient.first_visit_date || "—"],
          ["Nombre Completo", patient.full_name || "—", "Cédula / ID", patient.document_id || "—"],
          ["F. Nacimiento", patient.birth_date || "—", "Estado Civil", patient.marital_status || "—"],
          ["Lugar Nacimiento", patient.birthplace || "—", "Teléfono", patient.phone || "—"],
          ["Grado Instrucción", patient.education_level || "—", "Ocupación", patient.occupation || "—"],
          ["Etnia / Raza", patient.ethnicity || "—", "Correo Electrónico", patient.email || "—"],
          ["Dirección", patient.address || "—", "Médico Asignado", doctorMap.get(patient.assigned_doctor_id ?? "") || "Sin asignar"],
          ["Motivo de Consulta", { content: patient.consultation_reason || "—", colSpan: 3 }],
          ["Enfermedad Actual", { content: patient.current_illness || "—", colSpan: 3 }],
          ["Notas Generales", { content: patient.notes || "—", colSpan: 3 }]
        ],
        theme: "grid",
        styles: { font: "times", fontSize: 9, cellPadding: 4 },
        columnStyles: {
          0: { fontStyle: "bold", fillColor: [245, 242, 247], cellWidth: 95 },
          1: { cellWidth: 162 },
          2: { fontStyle: "bold", fillColor: [245, 242, 247], cellWidth: 95 },
          3: { cellWidth: 163 }
        },
        margin: { left: 40, right: 40 },
      });

      const y2 = (doc as any).lastAutoTable.finalY + 15;
      doc.setFont("times", "bold");
      doc.setFontSize(11);
      doc.text("Antecedentes Médicos", 40, y2);

      autoTable(doc, {
        startY: y2 + 5,
        body: [
          ["A.F. Madre", patient.family_history?.mother || "Niega / Sano", "A.F. Padre", patient.family_history?.father || "Niega / Sano"],
          ["A.F. Hermanos", patient.family_history?.siblings || "Niega / Sano", "A.F. Hijos", patient.family_history?.children || "Niega / Sano"],
          ["A.P. Tabaco", patient.personal_history?.tobacco || "NIEGA", "A.P. Alcohol", patient.personal_history?.alcohol || "NIEGA"],
          ["A.P. Drogas", patient.personal_history?.drugs || "NIEGA", "A.P. Patología Base", patient.personal_history?.base_pathology || "Niega"],
          ["A.P. Quirúrgicos", { content: patient.personal_history?.surgical || "Niega", colSpan: 3 }],
          ["A.P. Alérgicos", { content: patient.personal_history?.allergies || "Niega", colSpan: 3 }]
        ],
        theme: "grid",
        styles: { font: "times", fontSize: 9, cellPadding: 4 },
        columnStyles: {
          0: { fontStyle: "bold", fillColor: [245, 242, 247], cellWidth: 95 },
          1: { cellWidth: 162 },
          2: { fontStyle: "bold", fillColor: [245, 242, 247], cellWidth: 95 },
          3: { cellWidth: 163 }
        },
        margin: { left: 40, right: 40 },
      });

      const y3 = (doc as any).lastAutoTable.finalY + 15;
      doc.setFont("times", "bold");
      doc.setFontSize(11);
      doc.text("Datos Gineco-Obstétricos", 40, y3);

      autoTable(doc, {
        startY: y3 + 5,
        body: [
          ["Menarquía", patient.gynecological_data?.menarche || "—", "Sexarquía", patient.gynecological_data?.sexarche || "—"],
          ["Ciclo Menstrual", patient.gynecological_data?.menstrual_cycle || "—", "Dismenorrea", patient.gynecological_data?.dysmenorrhea || "—"],
          ["NPS", patient.gynecological_data?.nps || "—", "ITS", patient.gynecological_data?.its || "—"],
          ["Última Citología", patient.gynecological_data?.cytology || "—", "Anticonceptivos", patient.gynecological_data?.contraceptives || "—"],
          ["Gestas (G)", patient.obstetric_data?.g ?? 0, "Partos (P)", patient.obstetric_data?.p ?? 0],
          ["Cesáreas (C)", patient.obstetric_data?.c ?? 0, "Abortos (A)", patient.obstetric_data?.a ?? 0],
          ["Período Intergenésico (PIG)", patient.obstetric_data?.pig || "—", "Emb. Múltiples", patient.obstetric_data?.em ?? 0],
          ["Emb. Ectópicos", patient.obstetric_data?.ee ?? 0, "Nº Consultas Control", patient.obstetric_data?.num_consultations || "—"],
          ["FUM", patient.obstetric_data?.fum || "—", "EG", patient.obstetric_data?.eg || "—"],
          ["FPP", patient.obstetric_data?.fpp || "—", "Vacunas", patient.obstetric_data?.vaccines || "—"],
          ["Complicaciones", { content: patient.obstetric_data?.complications || "Ninguna", colSpan: 3 }]
        ],
        theme: "grid",
        styles: { font: "times", fontSize: 9, cellPadding: 4 },
        columnStyles: {
          0: { fontStyle: "bold", fillColor: [245, 242, 247], cellWidth: 95 },
          1: { cellWidth: 162 },
          2: { fontStyle: "bold", fillColor: [245, 242, 247], cellWidth: 95 },
          3: { cellWidth: 163 }
        },
        margin: { left: 40, right: 40 },
      });

      const after = (doc as any).lastAutoTable.finalY + 20;
      doc.setFont("times", "bold");
      doc.setFontSize(11);
      doc.text("Historial de Consultas", 40, after);

      if (patientNotes.length === 0) {
        doc.setFont("times", "italic");
        doc.setFontSize(9.5);
        doc.setTextColor(120, 120, 130);
        doc.text("No se registran notas clínicas en el historial de este paciente.", 40, after + 15);
      } else {
        autoTable(doc, {
          startY: after + 8,
          head: [["Fecha", "Título", "Detalle / Indicaciones"]],
          body: patientNotes.map((n) => [
            new Date(n.note_date).toLocaleDateString("es-ES", { day: "2-digit", month: "short", year: "numeric" }),
            n.title || "—",
            n.content || "—",
          ]),
          theme: "striped",
          headStyles: { fillColor: [139, 92, 175], textColor: 255, font: "times" },
          styles: { font: "times", fontSize: 9, cellPadding: 5 },
          columnStyles: {
            0: { cellWidth: 70 },
            1: { cellWidth: 120 },
            2: { cellWidth: 325 },
          },
          margin: { left: 40, right: 40 },
        });
      }

      // Draw Watermark and Page Footer on all pages
      const pageCount = doc.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);

        // Draw Watermark Logo in center
        try {
          if (logoBase64) {
            doc.saveGraphicsState();
            const gState = new (doc as any).GState({ opacity: 0.04 });
            doc.setGState(gState);
            const imgWidth = 550;
            const imgHeight = 550;
            const imgX = (pageWidth - imgWidth) / 2;
            const imgY = (pageHeight - imgHeight) / 2 - 20;
            doc.addImage(logoBase64, "PNG", imgX, imgY, imgWidth, imgHeight);
            doc.restoreGraphicsState();
          }
        } catch (watermarkErr) {
          console.error("Error drawing watermark:", watermarkErr);
        }

        // Footer Text
        doc.setFont("times", "normal");
        doc.setFontSize(8);
        doc.setTextColor(150, 150, 150);
        doc.text(`FemeSalud — Generado el ${new Date().toLocaleString("es-ES")}`, 40, pageHeight - 20);
        doc.text(`Página ${i} de ${pageCount}`, pageWidth - 40, pageHeight - 20, { align: "right" });
      }

      doc.save(`Ficha_${patient.full_name.replace(/\s+/g, "_")}.pdf`);
      toast.success("Ficha médica exportada");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al exportar");
    }
  };

  const handleExportReposo = async (patient: Patient) => {
    try {
      const docObj = doctors.find((d) => d.id === patient.assigned_doctor_id);
      const doctorName = docObj?.full_name || myProfile?.full_name || "Dra. Carli Solé Aquino";
      const doctorSpecialty = docObj?.specialty || myProfile?.specialty || "Ginecólogo Obstetra";

      const doc = new jsPDF({ unit: "pt", format: "a4" });
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();

      // Draw Watermark Logo in center
      try {
        const logoBase64 = await loadLogoBase64("/logo.png");
        if (logoBase64) {
          doc.saveGraphicsState();
          const gState = new (doc as any).GState({ opacity: 0.04 });
          doc.setGState(gState);
          const imgWidth = 550;
          const imgHeight = 550;
          const imgX = (pageWidth - imgWidth) / 2;
          const imgY = (pageHeight - imgHeight) / 2 - 20;
          doc.addImage(logoBase64, "PNG", imgX, imgY, imgWidth, imgHeight);
          doc.restoreGraphicsState();
        }
      } catch (watermarkErr) {
        console.error("Error drawing watermark:", watermarkErr);
      }

      // Font Setup
      doc.setFont("times", "normal");
      doc.setFontSize(8.5);
      doc.setTextColor(60, 60, 60);

      const clinicAddress1 = clinic?.address_line1 || "Calle las Flores entre González Padrón y Shettino, Número 16.";
      const clinicAddress2 = clinic?.address_line2 || "Valle de la Pascua, Estado Guárico.";
      const clinicPhone = clinic?.phone || "0412/8299890 0424/4609387";
      const clinicName = clinic?.name || "Femesalud";
      const clinicRif = clinic?.rif || "";

      // Top Header
      doc.text(clinicAddress1, pageWidth / 2, 45, { align: "center" });
      doc.text(clinicAddress2, pageWidth / 2, 57, { align: "center" });
      const headerLine3 = clinicRif ? `Teléfono: ${clinicPhone} | RIF: ${clinicRif}` : `Teléfono: ${clinicPhone}`;
      doc.text(headerLine3, pageWidth / 2, 69, { align: "center" });

      // Consultorio Header
      doc.setFont("times", "normal");
      doc.setFontSize(12.5);
      doc.setTextColor(0);
      doc.text("Consultorio Ginecológico Obstétrico", pageWidth / 2, 105, { align: "center" });
      doc.setFont("times", "italic");
      doc.setFontSize(17.5);
      doc.text(clinicName, pageWidth / 2, 122, { align: "center" });

      // Date Format: Valle de la Pascua, DD / MM / AAAA
      const today = new Date();
      const topDay = String(today.getDate()).padStart(2, "0");
      const topMonth = String(today.getMonth() + 1).padStart(2, "0");
      const topYear = String(today.getFullYear());
      doc.setFont("times", "normal");
      doc.setFontSize(10.5);
      doc.text(`Valle de la Pascua,   ${topDay}   /   ${topMonth}   /   ${topYear}`, pageWidth - 70, 155, { align: "right" });

      // Title (CONSTANCIA DE REPOSO, bold, centered, underlined)
      doc.setFont("times", "bold");
      doc.setFontSize(13);
      doc.text("CONSTANCIA DE REPOSO", pageWidth / 2, 195, { align: "center" });
      const titleWidth = doc.getTextWidth("CONSTANCIA DE REPOSO");
      doc.setDrawColor(0);
      doc.setLineWidth(0.5);
      doc.line(pageWidth / 2 - titleWidth / 2, 198, pageWidth / 2 + titleWidth / 2, 198);

      // Salutation
      doc.setFont("times", "bold");
      doc.setFontSize(11);
      doc.text("A quien pueda interesar", 70, 235);

      // Body text start
      doc.setFont("times", "normal");
      doc.setFontSize(11);
      doc.text("Quien suscribe, médico tratante, certifica que examinó a:", 70, 265);

      // Patient name line (drawn line, with name written on top)
      doc.line(70, 300, pageWidth - 70, 300);
      doc.setFont("times", "bold");
      doc.setFontSize(12);
      doc.text(patient.full_name, pageWidth / 2, 296, { align: "center" });

      let ciLabel = "C.I. V-";
      let displayCI = patient.document_id || "";
      if (displayCI.startsWith("V-")) {
        ciLabel = "C.I. V-";
        displayCI = displayCI.slice(2);
      } else if (displayCI.startsWith("E-")) {
        ciLabel = "C.I. E-";
        displayCI = displayCI.slice(2);
      } else if (displayCI.startsWith("P-")) {
        ciLabel = "Pasaporte ";
        displayCI = displayCI.slice(2);
      } else {
        ciLabel = "C.I. ";
      }

      doc.setFont("times", "normal");
      doc.setFontSize(11);
      doc.text(ciLabel, 70, 335);
      const labelWidth = doc.getTextWidth(ciLabel);
      const lineStartX = 70 + labelWidth + 5;
      const lineEndX = 280;
      doc.line(lineStartX, 335, lineEndX, 335);

      doc.setFont("times", "bold");
      doc.setFontSize(11.5);
      doc.text(displayCI, (lineStartX + lineEndX) / 2, 331, { align: "center" });

      doc.setFont("times", "normal");
      doc.setFontSize(11);
      doc.text(", quien presenta: Diagnóstico:", 285, 335);

      // Diagnosis lines
      const splitReason = doc.splitTextToSize(reposoReason || "", pageWidth - 140);

      doc.line(70, 370, pageWidth - 70, 370);
      if (splitReason[0]) {
        doc.setFont("times", "bold");
        doc.setFontSize(11.5);
        doc.text(splitReason[0], pageWidth / 2, 366, { align: "center" });
      }

      doc.line(70, 405, pageWidth - 70, 405);
      if (splitReason[1]) {
        doc.setFont("times", "bold");
        doc.setFontSize(11.5);
        doc.text(splitReason[1], pageWidth / 2, 401, { align: "center" });
      }

      // Reposo days line
      doc.setFont("times", "normal");
      doc.setFontSize(11);
      doc.text(`Se le indicó tratamiento y reposo por (   ${reposoDays}   ) días a partir de la presente fecha`, 70, 440);

      // Start Date
      const [sYear, sMonth, sDay] = reposoStart.split("-");
      const reposoStartFormatted = `${sDay} / ${sMonth} / ${sYear}`;
      doc.text(`(   ${reposoStartFormatted}   ).`, 70, 470);

      doc.text("Constancia que se expide a petición de la persona interesada.", 70, 510);

      // Signature line
      const sigY = 590;
      doc.setDrawColor(120);
      doc.setLineWidth(0.5);
      doc.setLineDashPattern([2, 2], 0);
      doc.line(pageWidth / 2 - 100, sigY, pageWidth / 2 + 100, sigY);
      doc.setLineDashPattern([], 0); // Restore solid line

      doc.setFont("times", "bold");
      doc.setFontSize(11.5);
      doc.text(doctorName, pageWidth / 2, sigY + 16, { align: "center" });

      doc.setFont("times", "normal");
      doc.setFontSize(10.5);
      doc.text(doctorSpecialty, pageWidth / 2, sigY + 29, { align: "center" });

      if (doctorUni) {
        doc.text(doctorUni, pageWidth / 2, sigY + 42, { align: "center" });
      }

      const regText = `MPPS ${doctorMpps || "______"}   CMC ${doctorCmc || "______"}`;
      doc.text(regText, pageWidth / 2, sigY + 55, { align: "center" });

      doc.save(`Reposo_${patient.full_name.replace(/\s+/g, "_")}.pdf`);
      setOpenReposo(false);
      toast.success("Constancia de reposo generada");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al exportar");
    }
  };

  const handleExportAtencion = async (patient: Patient) => {
    try {
      const docObj = doctors.find((d) => d.id === patient.assigned_doctor_id);
      const doctorName = docObj?.full_name || myProfile?.full_name || "Dra. Carli Solé Aquino";
      const doctorSpecialty = docObj?.specialty || myProfile?.specialty || "Ginecólogo Obstetra";

      const doc = new jsPDF({ unit: "pt", format: "a4" });
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();

      // Draw Watermark Logo in center
      try {
        const logoBase64 = await loadLogoBase64("/logo.png");
        if (logoBase64) {
          doc.saveGraphicsState();
          const gState = new (doc as any).GState({ opacity: 0.04 });
          doc.setGState(gState);
          const imgWidth = 550;
          const imgHeight = 550;
          const imgX = (pageWidth - imgWidth) / 2;
          const imgY = (pageHeight - imgHeight) / 2 - 20;
          doc.addImage(logoBase64, "PNG", imgX, imgY, imgWidth, imgHeight);
          doc.restoreGraphicsState();
        }
      } catch (watermarkErr) {
        console.error("Error drawing watermark:", watermarkErr);
      }

      // Font Setup
      doc.setFont("times", "normal");
      doc.setFontSize(8.5);
      doc.setTextColor(60, 60, 60);

      const clinicAddress1 = clinic?.address_line1 || "Calle las Flores entre González Padrón y Shettino, Número 16.";
      const clinicAddress2 = clinic?.address_line2 || "Valle de la Pascua, Estado Guárico.";
      const clinicPhone = clinic?.phone || "0412/8299890 0424/4609387";
      const clinicName = clinic?.name || "Femesalud";
      const clinicRif = clinic?.rif || "";

      // Top Header
      doc.text(clinicAddress1, pageWidth / 2, 45, { align: "center" });
      doc.text(clinicAddress2, pageWidth / 2, 57, { align: "center" });
      const headerLine3 = clinicRif ? `Teléfono: ${clinicPhone} | RIF: ${clinicRif}` : `Teléfono: ${clinicPhone}`;
      doc.text(headerLine3, pageWidth / 2, 69, { align: "center" });

      // Consultorio Header
      doc.setFont("times", "normal");
      doc.setFontSize(12.5);
      doc.setTextColor(0);
      doc.text("Consultorio Ginecológico Obstétrico", pageWidth / 2, 105, { align: "center" });
      doc.setFont("times", "italic");
      doc.setFontSize(17.5);
      doc.text(clinicName, pageWidth / 2, 122, { align: "center" });

      // Date Format: Valle de la Pascua, DD / MM / AAAA
      const today = new Date();
      const topDay = String(today.getDate()).padStart(2, "0");
      const topMonth = String(today.getMonth() + 1).padStart(2, "0");
      const topYear = String(today.getFullYear());
      doc.setFont("times", "normal");
      doc.setFontSize(10.5);
      doc.text(`Valle de la Pascua,   ${topDay}   /   ${topMonth}   /   ${topYear}`, pageWidth - 70, 155, { align: "right" });

      // Title (CONSTANCIA DE ATENCION MEDICA, bold, centered, underlined)
      doc.setFont("times", "bold");
      doc.setFontSize(13);
      doc.text("CONSTANCIA DE ATENCION MEDICA", pageWidth / 2, 195, { align: "center" });
      const titleWidth = doc.getTextWidth("CONSTANCIA DE ATENCION MEDICA");
      doc.setDrawColor(0);
      doc.setLineWidth(0.5);
      doc.line(pageWidth / 2 - titleWidth / 2, 198, pageWidth / 2 + titleWidth / 2, 198);

      // Salutation
      doc.setFont("times", "bold");
      doc.setFontSize(11);
      doc.text("A quien pueda interesar", 70, 235);

      // Body text start
      doc.setFont("times", "normal");
      doc.setFontSize(11);
      doc.text("Quien suscribe, médico tratante, certifica que examinó a:", 70, 265);

      // Patient Name and C.I. line
      // line 1: _________________________________ C.I. ____________________, quien
      doc.line(70, 300, 310, 300);
      doc.setFont("times", "bold");
      doc.setFontSize(11.5);
      doc.text(patient.full_name, 190, 296, { align: "center" });

      let ciLabel = "C.I. ";
      let displayCI = patient.document_id || "";
      if (displayCI.startsWith("V-")) {
        ciLabel = "C.I. V-";
        displayCI = displayCI.slice(2);
      } else if (displayCI.startsWith("E-")) {
        ciLabel = "C.I. E-";
        displayCI = displayCI.slice(2);
      } else if (displayCI.startsWith("P-")) {
        ciLabel = "P-";
        displayCI = displayCI.slice(2);
      }

      doc.text(ciLabel, 315, 300);
      const labelWidth = doc.getTextWidth(ciLabel);
      const lineStartX = 315 + labelWidth + 5;
      const lineEndX = 460;

      doc.line(lineStartX, 300, lineEndX, 300);
      doc.setFont("times", "bold");
      doc.setFontSize(11.5);
      doc.text(displayCI, (lineStartX + lineEndX) / 2, 296, { align: "center" });

      doc.setFont("times", "normal");
      doc.setFontSize(11);
      doc.text(", quien", 465, 300);

      // Diagnosis lines
      const splitReason = doc.splitTextToSize(atencionReason || "", pageWidth - 140);

      doc.text("presenta:", 70, 335);
      doc.line(120, 335, pageWidth - 70, 335);
      if (splitReason[0]) {
        doc.setFont("times", "bold");
        doc.setFontSize(11.5);
        doc.text(splitReason[0], (pageWidth + 50) / 2, 331, { align: "center" });
      }

      doc.line(70, 370, pageWidth - 70, 370);
      if (splitReason[1]) {
        doc.setFont("times", "bold");
        doc.setFontSize(11.5);
        doc.text(splitReason[1], pageWidth / 2, 366, { align: "center" });
      }

      // Acudió line
      const [aYear, aMonth, aDay] = atencionDate.split("-");
      const atencionDateFormatted = `${aDay} / ${aMonth} / ${aYear}`;
      doc.setFont("times", "normal");
      doc.setFontSize(11);
      doc.text(`Acudió a consulta el día de hoy: (   ${atencionDateFormatted}   ).`, 70, 405);

      doc.text("Constancia que se expide a petición de la persona interesada.", 70, 445);

      // Signature line
      const sigY = 530;
      doc.setDrawColor(120);
      doc.setLineWidth(0.5);
      doc.setLineDashPattern([2, 2], 0);
      doc.line(pageWidth / 2 - 100, sigY, pageWidth / 2 + 100, sigY);
      doc.setLineDashPattern([], 0); // Restore solid line

      doc.setFont("times", "bold");
      doc.setFontSize(11.5);
      doc.text(doctorName, pageWidth / 2, sigY + 16, { align: "center" });

      doc.setFont("times", "normal");
      doc.setFontSize(10.5);
      doc.text(doctorSpecialty, pageWidth / 2, sigY + 29, { align: "center" });

      if (doctorUni) {
        doc.text(doctorUni, pageWidth / 2, sigY + 42, { align: "center" });
      }

      const regText = `MPPS ${doctorMpps || "______"}   CMC ${doctorCmc || "______"}`;
      doc.text(regText, pageWidth / 2, sigY + 55, { align: "center" });

      doc.save(`Atencion_${patient.full_name.replace(/\s+/g, "_")}.pdf`);
      setOpenAtencion(false);
      toast.success("Constancia de atención generada");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al exportar");
    }
  };

  const handleExportJustificativo = async (patient: Patient) => {
    try {
      const docObj = doctors.find((d) => d.id === patient.assigned_doctor_id);
      const doctorName = docObj?.full_name || myProfile?.full_name || "Dra. Carli Solé Aquino";
      const doctorSpecialty = docObj?.specialty || myProfile?.specialty || "Ginecólogo Obstetra";

      const doc = new jsPDF({ unit: "pt", format: "a4" });
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();

      // Draw Watermark Logo in center
      try {
        const logoBase64 = await loadLogoBase64("/logo.png");
        if (logoBase64) {
          doc.saveGraphicsState();
          const gState = new (doc as any).GState({ opacity: 0.04 });
          doc.setGState(gState);
          const imgWidth = 550;
          const imgHeight = 550;
          const imgX = (pageWidth - imgWidth) / 2;
          const imgY = (pageHeight - imgHeight) / 2 - 20;
          doc.addImage(logoBase64, "PNG", imgX, imgY, imgWidth, imgHeight);
          doc.restoreGraphicsState();
        }
      } catch (watermarkErr) {
        console.error("Error drawing watermark:", watermarkErr);
      }

      // Font Setup
      doc.setFont("times", "normal");
      doc.setFontSize(8.5);
      doc.setTextColor(60, 60, 60);

      const clinicAddress1 = clinic?.address_line1 || "Calle las Flores entre González Padrón y Shettino, Número 16.";
      const clinicAddress2 = clinic?.address_line2 || "Valle de la Pascua, Estado Guárico.";
      const clinicPhone = clinic?.phone || "0412/8299890 0424/4609387";
      const clinicName = clinic?.name || "Femesalud";
      const clinicRif = clinic?.rif || "";

      // Top Header
      doc.text(clinicAddress1, pageWidth / 2, 45, { align: "center" });
      doc.text(clinicAddress2, pageWidth / 2, 57, { align: "center" });
      const headerLine3 = clinicRif ? `Teléfono: ${clinicPhone} | RIF: ${clinicRif}` : `Teléfono: ${clinicPhone}`;
      doc.text(headerLine3, pageWidth / 2, 69, { align: "center" });

      // Consultorio Header
      doc.setFont("times", "normal");
      doc.setFontSize(12.5);
      doc.setTextColor(0);
      doc.text("Consultorio Ginecológico Obstétrico", pageWidth / 2, 105, { align: "center" });
      doc.setFont("times", "italic");
      doc.setFontSize(17.5);
      doc.text(clinicName, pageWidth / 2, 122, { align: "center" });

      // Date Format: Valle de la Pascua, DD / MM / AAAA
      const today = new Date();
      const topDay = String(today.getDate()).padStart(2, "0");
      const topMonth = String(today.getMonth() + 1).padStart(2, "0");
      const topYear = String(today.getFullYear());
      doc.setFont("times", "normal");
      doc.setFontSize(10.5);
      doc.text(`Valle de la Pascua,   ${topDay}   /   ${topMonth}   /   ${topYear}`, pageWidth - 70, 155, { align: "right" });

      // Title (JUSTIFICATIVO MEDICO, bold, centered, underlined)
      doc.setFont("times", "bold");
      doc.setFontSize(13);
      doc.text("JUSTIFICATIVO MEDICO", pageWidth / 2, 195, { align: "center" });
      const titleWidth = doc.getTextWidth("JUSTIFICATIVO MEDICO");
      doc.setDrawColor(0);
      doc.setLineWidth(0.5);
      doc.line(pageWidth / 2 - titleWidth / 2, 198, pageWidth / 2 + titleWidth / 2, 198);

      // Salutation
      doc.setFont("times", "bold");
      doc.setFontSize(11);
      doc.text("A quien pueda interesar", 70, 235);

      // Body text start
      doc.setFont("times", "normal");
      doc.setFontSize(11);
      doc.text("Quien suscribe, médico tratante, certifica que examinó a:", 70, 265);

      // Patient Name and C.I. line
      doc.line(70, 300, 310, 300);
      doc.setFont("times", "bold");
      doc.setFontSize(11.5);
      doc.text(patient.full_name, 190, 296, { align: "center" });

      let ciLabel = "C.I. ";
      let displayCI = patient.document_id || "";
      if (displayCI.startsWith("V-")) {
         ciLabel = "C.I. V-";
         displayCI = displayCI.slice(2);
      } else if (displayCI.startsWith("E-")) {
         ciLabel = "C.I. E-";
         displayCI = displayCI.slice(2);
      } else if (displayCI.startsWith("P-")) {
         ciLabel = "P-";
         displayCI = displayCI.slice(2);
      }

      doc.text(ciLabel, 315, 300);
      const labelWidth = doc.getTextWidth(ciLabel);
      const lineStartX = 315 + labelWidth + 5;
      const lineEndX = 460;

      doc.line(lineStartX, 300, lineEndX, 300);
      doc.setFont("times", "bold");
      doc.setFontSize(11.5);
      doc.text(displayCI, (lineStartX + lineEndX) / 2, 296, { align: "center" });

      doc.setFont("times", "normal");
      doc.setFontSize(11);
      doc.text(", quien", 465, 300);

      // Diagnosis lines
      const splitReason = doc.splitTextToSize(justificativoReason || "", pageWidth - 140);

      doc.text("presenta:", 70, 335);
      doc.line(120, 335, pageWidth - 70, 335);
      if (splitReason[0]) {
        doc.setFont("times", "bold");
        doc.setFontSize(11.5);
        doc.text(splitReason[0], (pageWidth + 50) / 2, 331, { align: "center" });
      }

      doc.line(70, 370, pageWidth - 70, 370);
      if (splitReason[1]) {
        doc.setFont("times", "bold");
        doc.setFontSize(11.5);
        doc.text(splitReason[1], pageWidth / 2, 366, { align: "center" });
      }

      // Justificativo details
      const [aYear, aMonth, aDay] = justificativoDate.split("-");
      const dateFormatted = `${aDay} / ${aMonth} / ${aYear}`;
      doc.setFont("times", "normal");
      doc.setFontSize(11);
      
      doc.text(`Acudió a consulta médica el día de hoy: (   ${dateFormatted}   ), indicándole tratamiento`, 70, 405);
      doc.text(`y reposo de (   ${justificativoDays}   ) días, por lo cual se justifica su inasistencia a sus labores`, 70, 430);
      doc.text(`y/o actividades cotidianas habituales.`, 70, 455);

      doc.text("Constancia que se expide a petición de la persona interesada.", 70, 495);

      // Signature line
      const sigY = 570;
      doc.setDrawColor(120);
      doc.setLineWidth(0.5);
      doc.setLineDashPattern([2, 2], 0);
      doc.line(pageWidth / 2 - 100, sigY, pageWidth / 2 + 100, sigY);
      doc.setLineDashPattern([], 0); // Restore solid line

      doc.setFont("times", "bold");
      doc.setFontSize(11.5);
      doc.text(doctorName, pageWidth / 2, sigY + 16, { align: "center" });

      doc.setFont("times", "normal");
      doc.setFontSize(10.5);
      doc.text(doctorSpecialty, pageWidth / 2, sigY + 29, { align: "center" });

      if (doctorUni) {
        doc.text(doctorUni, pageWidth / 2, sigY + 42, { align: "center" });
      }

      const regText = `MPPS ${doctorMpps || "______"}   CMC ${doctorCmc || "______"}`;
      doc.text(regText, pageWidth / 2, sigY + 55, { align: "center" });

      doc.save(`Justificativo_${patient.full_name.replace(/\s+/g, "_")}.pdf`);
      setOpenJustificativo(false);
      toast.success("Justificativo médico generado");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al exportar");
    }
  };

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
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div className="ml-14 md:ml-0">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Módulo</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">Pacientes</h1>
          <p className="text-sm text-muted-foreground">{totalCount} pacientes</p>
        </div>
        <Button onClick={() => { setEditing(null); setFormOpen(true); }} className="rounded-2xl bg-gradient-to-r from-mauve to-mauve-soft text-primary-foreground shadow-sm shadow-mauve/30 hover:opacity-95">
          <Plus className="mr-1 h-4 w-4" /> Nuevo paciente
        </Button>
      </header>

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
            {q && <button onClick={() => setQ("")} className="text-muted-foreground hover:text-foreground"><X className="h-4 w-4" /></button>}
          </div>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="w-[170px] rounded-2xl"><SelectValue /></SelectTrigger>
            <SelectContent>{STATUSES.map((s) => <SelectItem key={s} value={s}>{statusLabel(s)}</SelectItem>)}</SelectContent>
          </Select>
          <Select value={doctorFilter} onValueChange={setDoctorFilter}>
            <SelectTrigger className="w-[210px] rounded-2xl"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="Todos">Todos los médicos</SelectItem>
              {doctors.map((d) => <SelectItem key={d.id} value={d.id}>{d.full_name || d.email}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      {isLoading ? (
        <div className="rounded-3xl glass-card p-12 text-center"><Loader2 className="mx-auto h-6 w-6 animate-spin text-muted-foreground" /></div>
      ) : error ? (
        <div className="rounded-3xl glass-card p-12 text-center text-sm text-destructive">Error al cargar pacientes</div>
      ) : patients.length === 0 ? (
        <div className="rounded-3xl glass-card p-12 text-center shadow-sm">
          <Users className="mx-auto h-10 w-10 text-muted-foreground" />
          <p className="mt-3 text-sm text-muted-foreground">No se encontraron pacientes.</p>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {paginatedPatients.map((p) => (
              <div key={p.id} className="group rounded-3xl glass-card p-5 shadow-sm transition-all duration-300 hover:shadow-md">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-mauve/80 to-blush text-sm font-semibold text-primary-foreground shadow-sm">
                      {initials(p.full_name)}
                    </div>
                    <div>
                      <p className="text-sm font-semibold leading-tight">{p.full_name}</p>
                    </div>
                  </div>
                  <span className={cn("rounded-full px-2.5 py-0.5 text-[11px] font-medium", tagBg[p.status] || "bg-muted text-muted-foreground")}>{statusLabel(p.status)}</span>
                </div>
                <div className="mt-4 space-y-1.5 text-xs text-muted-foreground">
                  <p className="flex items-center gap-2"><Mail className="h-3.5 w-3.5" /> {p.email || "—"}</p>
                  <p className="flex items-center gap-2"><Phone className="h-3.5 w-3.5" /> {p.phone || "—"}</p>
                  <p className="flex items-center gap-2"><Stethoscope className="h-3.5 w-3.5" /> {doctorMap.get(p.assigned_doctor_id ?? "") || "Sin asignar"}</p>
                </div>
                <div className="mt-4 flex items-center justify-between gap-2 border-t border-border/60 pt-3">
                  <button onClick={() => setViewing(p)} className="text-xs font-medium text-mauve hover:underline">Ver detalle →</button>
                  <div className="flex gap-1">
                    <button onClick={() => { setEditing(p); setFormOpen(true); }} className="flex h-8 w-8 items-center justify-center rounded-xl text-muted-foreground transition hover:bg-mauve/10 hover:text-mauve" aria-label="Editar">
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button onClick={() => setToDelete(p)} className="flex h-8 w-8 items-center justify-center rounded-xl text-muted-foreground transition hover:bg-destructive/10 hover:text-destructive" aria-label="Eliminar">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex flex-wrap items-center justify-between gap-4 rounded-3xl glass-card p-4 shadow-sm border border-border/40 animate-fade-in">
              <p className="text-xs text-muted-foreground">
                Mostrando <span className="font-semibold text-foreground">{(currentPage - 1) * itemsPerPage + 1} - {Math.min(totalCount, currentPage * itemsPerPage)}</span> de <span className="font-semibold text-foreground">{totalCount}</span> pacientes
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                  className="rounded-xl flex items-center gap-1 h-9 cursor-pointer"
                >
                  <ChevronLeft className="h-4 w-4" /> Anterior
                </Button>
                <span className="text-xs font-semibold px-3 py-1 bg-muted/60 rounded-lg">
                  {currentPage} / {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                  className="rounded-xl flex items-center gap-1 h-9 cursor-pointer"
                >
                  Siguiente <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      <PatientForm open={formOpen} onOpenChange={setFormOpen} patient={editing} />

      <Dialog open={!!viewing} onOpenChange={(o) => !o && setViewing(null)}>
        <DialogContent className="sm:max-w-4xl rounded-3xl max-h-[90vh] flex flex-col p-6">
          {viewing && (
            <>
              <DialogHeader className="flex flex-row items-center justify-between pr-6">
                <div>
                  <DialogTitle>Detalle de Historia Clínica</DialogTitle>
                  <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                    Visualización de datos generales, antecedentes y registro de consultas.
                  </DialogDescription>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="rounded-xl flex items-center gap-1.5 h-8 cursor-pointer">
                      <FileDown className="h-4 w-4" /> Exportar...
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="rounded-2xl bg-card border border-muted/50 p-1.5 shadow-xl" align="end">
                    <DropdownMenuItem onClick={() => handleExportFicha(viewing)} className="rounded-xl cursor-pointer text-xs flex items-center gap-1.5 px-3 py-2 hover:bg-muted">
                      <FileText className="h-3.5 w-3.5 text-mauve" /> Exportar Ficha Médica
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleOpenReposoDialog(viewing)} className="rounded-xl cursor-pointer text-xs flex items-center gap-1.5 px-3 py-2 hover:bg-muted">
                      <Printer className="h-3.5 w-3.5 text-mauve" /> Constancia de Reposo
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleOpenAtencionDialog(viewing)} className="rounded-xl cursor-pointer text-xs flex items-center gap-1.5 px-3 py-2 hover:bg-muted">
                      <Printer className="h-3.5 w-3.5 text-mauve" /> Constancia de Atención
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleOpenJustificativoDialog(viewing)} className="rounded-xl cursor-pointer text-xs flex items-center gap-1.5 px-3 py-2 hover:bg-muted">
                      <Printer className="h-3.5 w-3.5 text-mauve" /> Justificativo Médico
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </DialogHeader>

              <div className="flex items-center gap-3 mt-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-mauve to-blush text-base font-semibold text-primary-foreground">
                  {initials(viewing.full_name)}
                </div>
                <div>
                  <p className="text-base font-semibold">{viewing.full_name}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={cn("inline-block rounded-full px-2.5 py-0.5 text-[11px] font-medium", tagBg[viewing.status] || "bg-muted")}>{statusLabel(viewing.status)}</span>
                    {viewing.historia_number && (
                      <span className="text-xs bg-muted/80 text-muted-foreground px-2 py-0.5 rounded-md font-semibold">
                        Historia: #{viewing.historia_number}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <Tabs defaultValue="general" className="mt-4 flex-1 flex flex-col min-h-0">
                <TabsList className="grid w-full grid-cols-6 bg-muted/60 p-1 rounded-2xl mb-4">
                  <TabsTrigger value="general" className="rounded-xl font-medium text-xs">Identificación</TabsTrigger>
                  <TabsTrigger value="antecedentes" className="rounded-xl font-medium text-xs">Antecedentes</TabsTrigger>
                  <TabsTrigger value="ginecologia" className="rounded-xl font-medium text-xs">Ginecológico</TabsTrigger>
                  <TabsTrigger value="obstetricia" className="rounded-xl font-medium text-xs">Obstétrico</TabsTrigger>
                  <TabsTrigger value="timeline" className="rounded-xl font-medium text-xs">Timeline</TabsTrigger>
                  <TabsTrigger value="notas" className="rounded-xl font-medium text-xs">Notas Clínicas</TabsTrigger>
                </TabsList>

                <div className="flex-1 overflow-y-auto pr-1">
                  {/* TAB 1: GENERAL */}
                  <TabsContent value="general" className="space-y-4 outline-none">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-xs text-muted-foreground block">Nombre Completo</span>
                        <span className="font-medium">{viewing.full_name}</span>
                      </div>
                      <div>
                        <span className="text-xs text-muted-foreground block">Cédula / Identificación</span>
                        <span className="font-medium">{viewing.document_id || "—"}</span>
                      </div>
                      <div>
                        <span className="text-xs text-muted-foreground block">Fecha de Nacimiento</span>
                        <span className="font-medium">{viewing.birth_date || "—"}</span>
                      </div>
                      <div>
                        <span className="text-xs text-muted-foreground block">Edad</span>
                        <span className="font-medium">
                          {viewing.birth_date ? `${new Date().getFullYear() - new Date(viewing.birth_date).getFullYear()} años` : "—"}
                        </span>
                      </div>
                      <div>
                        <span className="text-xs text-muted-foreground block">Teléfono</span>
                        <span className="font-medium">{viewing.phone || "—"}</span>
                      </div>
                      <div>
                        <span className="text-xs text-muted-foreground block">Correo Electrónico</span>
                        <span className="font-medium">{viewing.email || "—"}</span>
                      </div>
                      <div>
                        <span className="text-xs text-muted-foreground block">Lugar de Nacimiento</span>
                        <span className="font-medium">{viewing.birthplace || "—"}</span>
                      </div>
                      <div>
                        <span className="text-xs text-muted-foreground block">Estado Civil</span>
                        <span className="font-medium">{viewing.marital_status || "—"}</span>
                      </div>
                      <div>
                        <span className="text-xs text-muted-foreground block">Grado de Instrucción</span>
                        <span className="font-medium">{viewing.education_level || "—"}</span>
                      </div>
                      <div>
                        <span className="text-xs text-muted-foreground block">Ocupación</span>
                        <span className="font-medium">{viewing.occupation || "—"}</span>
                      </div>
                      <div>
                        <span className="text-xs text-muted-foreground block">Etnia</span>
                        <span className="font-medium">{viewing.ethnicity || "—"}</span>
                      </div>
                      <div>
                        <span className="text-xs text-muted-foreground block">Fecha Primera Cita</span>
                        <span className="font-medium">{viewing.first_visit_date || "—"}</span>
                      </div>
                      <div className="col-span-2">
                        <span className="text-xs text-muted-foreground block">Dirección</span>
                        <span className="font-medium">{viewing.address || "—"}</span>
                      </div>
                      <div className="col-span-2">
                        <span className="text-xs text-muted-foreground block">Médico Asignado</span>
                        <span className="font-medium">{doctorMap.get(viewing.assigned_doctor_id ?? "") || "Sin asignar"}</span>
                      </div>
                      {viewing.consultation_reason && (
                        <div className="col-span-2 bg-muted/30 p-3 rounded-2xl">
                          <span className="text-xs text-muted-foreground block">Motivo de Consulta</span>
                          <span className="font-medium text-xs whitespace-pre-wrap">{viewing.consultation_reason}</span>
                        </div>
                      )}
                      {viewing.current_illness && (
                        <div className="col-span-2 bg-muted/30 p-3 rounded-2xl">
                          <span className="text-xs text-muted-foreground block">Enfermedad Actual</span>
                          <span className="font-medium text-xs whitespace-pre-wrap">{viewing.current_illness}</span>
                        </div>
                      )}
                      {viewing.notes && (
                        <div className="col-span-2">
                          <span className="text-xs text-muted-foreground block">Notas generales</span>
                          <span className="font-medium text-xs whitespace-pre-wrap">{viewing.notes}</span>
                        </div>
                      )}
                    </div>
                  </TabsContent>

                  {/* TAB 2: ANTECEDENTES */}
                  <TabsContent value="antecedentes" className="space-y-4 outline-none">
                    <div className="space-y-3">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-mauve">Antecedentes Familiares</h3>
                      <div className="grid grid-cols-2 gap-3 text-sm bg-muted/30 p-3.5 rounded-2xl">
                        <div>
                          <span className="text-xs text-muted-foreground block">Madre</span>
                          <span className="font-medium">{viewing.family_history?.mother || "Niega / Sano"}</span>
                        </div>
                        <div>
                          <span className="text-xs text-muted-foreground block">Padre</span>
                          <span className="font-medium">{viewing.family_history?.father || "Niega / Sano"}</span>
                        </div>
                        <div>
                          <span className="text-xs text-muted-foreground block">Hermanos</span>
                          <span className="font-medium">{viewing.family_history?.siblings || "Niega / Sano"}</span>
                        </div>
                        <div>
                          <span className="text-xs text-muted-foreground block">Hijos</span>
                          <span className="font-medium">{viewing.family_history?.children || "Niega / Sano"}</span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3 mt-4">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-mauve">Antecedentes Personales Patológicos y Hábitos</h3>
                      <div className="grid grid-cols-2 gap-3 text-sm bg-muted/30 p-3.5 rounded-2xl">
                        <div>
                          <span className="text-xs text-muted-foreground block">Tabaco</span>
                          <span className="font-medium">{viewing.personal_history?.tobacco || "NIEGA"}</span>
                        </div>
                        <div>
                          <span className="text-xs text-muted-foreground block">Alcohol</span>
                          <span className="font-medium">{viewing.personal_history?.alcohol || "NIEGA"}</span>
                        </div>
                        <div>
                          <span className="text-xs text-muted-foreground block">Drogas</span>
                          <span className="font-medium">{viewing.personal_history?.drugs || "NIEGA"}</span>
                        </div>
                        <div>
                          <span className="text-xs text-muted-foreground block">Patología de Base</span>
                          <span className="font-medium">{viewing.personal_history?.base_pathology || "Niega"}</span>
                        </div>
                        <div className="col-span-2">
                          <span className="text-xs text-muted-foreground block">Quirúrgicos / Operaciones</span>
                          <span className="font-medium">{viewing.personal_history?.surgical || "Niega"}</span>
                        </div>
                        <div className="col-span-2">
                          <span className="text-xs text-muted-foreground block">Alérgicos</span>
                          <span className="font-medium text-destructive">{viewing.personal_history?.allergies || "Niega"}</span>
                        </div>
                      </div>
                    </div>
                  </TabsContent>

                  {/* TAB 3: GINECOLOGICO */}
                  <TabsContent value="ginecologia" className="space-y-4 outline-none">
                    <div className="grid grid-cols-2 gap-3 text-sm bg-muted/30 p-3.5 rounded-2xl">
                      <div>
                        <span className="text-xs text-muted-foreground block">Menarquía (Edad primera menstruación)</span>
                        <span className="font-medium">{viewing.gynecological_data?.menarche || "—"}</span>
                      </div>
                      <div>
                        <span className="text-xs text-muted-foreground block">Sexarquía (Edad inicio relaciones sexuales)</span>
                        <span className="font-medium">{viewing.gynecological_data?.sexarche || "—"}</span>
                      </div>
                      <div>
                        <span className="text-xs text-muted-foreground block">Ciclo Menstrual</span>
                        <span className="font-medium">{viewing.gynecological_data?.menstrual_cycle || "—"}</span>
                      </div>
                      <div>
                        <span className="text-xs text-muted-foreground block">Dismenorrea (Menstruación dolorosa)</span>
                        <span className="font-medium">{viewing.gynecological_data?.dysmenorrhea || "—"}</span>
                      </div>
                      <div>
                        <span className="text-xs text-muted-foreground block">NPS (Número parejas sexuales)</span>
                        <span className="font-medium">{viewing.gynecological_data?.nps || "—"}</span>
                      </div>
                      <div>
                        <span className="text-xs text-muted-foreground block">ITS (Infecciones de Transmisión Sexual)</span>
                        <span className="font-medium">{viewing.gynecological_data?.its || "—"}</span>
                      </div>
                      <div>
                        <span className="text-xs text-muted-foreground block">Última Citología</span>
                        <span className="font-medium">{viewing.gynecological_data?.cytology || "—"}</span>
                      </div>
                      <div>
                        <span className="text-xs text-muted-foreground block">Anticonceptivos</span>
                        <span className="font-medium">{viewing.gynecological_data?.contraceptives || "—"}</span>
                      </div>
                    </div>
                  </TabsContent>

                  {/* TAB 4: OBSTETRICO */}
                  <TabsContent value="obstetricia" className="space-y-4 outline-none">
                    <div className="grid grid-cols-4 gap-3 text-sm bg-muted/30 p-3.5 rounded-2xl">
                      <div>
                        <span className="text-xs text-muted-foreground block">G (Gestas)</span>
                        <span className="font-bold text-base">{viewing.obstetric_data?.g ?? 0}</span>
                      </div>
                      <div>
                        <span className="text-xs text-muted-foreground block">P (Partos)</span>
                        <span className="font-bold text-base">{viewing.obstetric_data?.p ?? 0}</span>
                      </div>
                      <div>
                        <span className="text-xs text-muted-foreground block">C (Cesáreas)</span>
                        <span className="font-bold text-base">{viewing.obstetric_data?.c ?? 0}</span>
                      </div>
                      <div>
                        <span className="text-xs text-muted-foreground block">A (Abortos)</span>
                        <span className="font-bold text-base">{viewing.obstetric_data?.a ?? 0}</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-sm bg-muted/30 p-3.5 rounded-2xl mt-4">
                      <div>
                        <span className="text-xs text-muted-foreground block">PIG (Período Intergenésico)</span>
                        <span className="font-medium">{viewing.obstetric_data?.pig || "—"}</span>
                      </div>
                      <div>
                        <span className="text-xs text-muted-foreground block">Embarazos Múltiples</span>
                        <span className="font-medium">{viewing.obstetric_data?.em ?? "0"}</span>
                      </div>
                      <div>
                        <span className="text-xs text-muted-foreground block">Embarazos Ectópicos</span>
                        <span className="font-medium">{viewing.obstetric_data?.ee ?? "0"}</span>
                      </div>
                      <div>
                        <span className="text-xs text-muted-foreground block">Complicaciones Obstétricas</span>
                        <span className="font-medium">{viewing.obstetric_data?.complications || "Ninguna"}</span>
                      </div>
                      <div>
                        <span className="text-xs text-muted-foreground block">FUM (Fecha Última Menstruación)</span>
                        <span className="font-medium">{viewing.obstetric_data?.fum || "—"}</span>
                      </div>
                      <div>
                        <span className="text-xs text-muted-foreground block">EG (Edad Gestacional)</span>
                        <span className="font-medium">{viewing.obstetric_data?.eg || "—"}</span>
                      </div>
                      <div>
                        <span className="text-xs text-muted-foreground block">FPP (Fecha Probable de Parto)</span>
                        <span className="font-medium text-mauve font-semibold">{viewing.obstetric_data?.fpp || "—"}</span>
                      </div>
                      <div>
                        <span className="text-xs text-muted-foreground block">Número de Consultas Control</span>
                        <span className="font-medium">{viewing.obstetric_data?.num_consultations || "—"}</span>
                      </div>
                      <div className="col-span-2">
                        <span className="text-xs text-muted-foreground block">Vacunas</span>
                        <span className="font-medium">{viewing.obstetric_data?.vaccines || "—"}</span>
                      </div>
                    </div>
                  </TabsContent>

                  {/* TAB 5: NOTAS CLINICAS */}
                  <TabsContent value="notas" className="space-y-4 outline-none">
                    <ClinicalNotesPanel patientId={viewing.id} />
                  </TabsContent>

                  {/* TAB 6: TIMELINE */}
                  <TabsContent value="timeline" className="space-y-4 outline-none">
                    <PatientTimeline patientId={viewing.id} />
                  </TabsContent>
                </div>
              </Tabs>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog Constancia de Reposo */}
      <Dialog open={openReposo} onOpenChange={setOpenReposo}>
        <DialogContent className="rounded-3xl sm:max-w-md bg-card p-6 border border-muted/50 shadow-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-1.5"><Printer className="h-5 w-5 text-mauve" /> Constancia de Reposo</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3 py-2 text-sm">
            <div className="grid gap-1">
              <Label htmlFor="rp-days">Días de reposo</Label>
              <Input
                id="rp-days"
                type="number"
                min="1"
                max="90"
                value={reposoDays}
                onChange={(e) => setReposoDays(e.target.value)}
                className="rounded-xl"
              />
            </div>
            <div className="grid gap-1">
              <Label htmlFor="rp-start">Fecha de inicio</Label>
              <Input
                id="rp-start"
                type="date"
                value={reposoStart}
                onChange={(e) => setReposoStart(e.target.value)}
                className="rounded-xl"
              />
            </div>
            <div className="grid gap-1">
              <Label htmlFor="rp-reason">Diagnóstico / Motivo de reposo</Label>
              <Textarea
                id="rp-reason"
                value={reposoReason}
                onChange={(e) => setReposoReason(e.target.value)}
                placeholder="Escribe el diagnóstico médico o motivo..."
                className="rounded-xl min-h-[70px]"
              />
            </div>

            <div className="border-t border-border/60 pt-3 mt-1 space-y-2.5">
              <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Datos de Firma del Médico</p>
              <div className="grid gap-1">
                <Label htmlFor="rp-doc-uni">Universidad / Título Adicional</Label>
                <Input
                  id="rp-doc-uni"
                  placeholder="Ej. UC-CHET"
                  value={doctorUni}
                  onChange={(e) => setDoctorUni(e.target.value)}
                  className="rounded-xl text-xs h-9"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="grid gap-1">
                  <Label htmlFor="rp-doc-mpps">Registro MPPS</Label>
                  <Input
                    id="rp-doc-mpps"
                    placeholder="Ej. 102.927"
                    value={doctorMpps}
                    onChange={(e) => setDoctorMpps(e.target.value)}
                    className="rounded-xl text-xs h-9"
                  />
                </div>
                <div className="grid gap-1">
                  <Label htmlFor="rp-doc-cmc">Registro CMC</Label>
                  <Input
                    id="rp-doc-cmc"
                    placeholder="Ej. 11.619"
                    value={doctorCmc}
                    onChange={(e) => setDoctorCmc(e.target.value)}
                    className="rounded-xl text-xs h-9"
                  />
                </div>
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-2 border-t border-border/60 pt-3 mt-2">
            <Button variant="ghost" onClick={() => setOpenReposo(false)} className="rounded-xl">Cancelar</Button>
            <Button onClick={() => viewing && handleExportReposo(viewing)} className="rounded-xl bg-gradient-to-r from-mauve to-mauve-soft text-primary-foreground shadow-sm shadow-mauve/30">
              Generar PDF
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog Constancia de Atención */}
      <Dialog open={openAtencion} onOpenChange={setOpenAtencion}>
        <DialogContent className="rounded-3xl sm:max-w-md bg-card p-6 border border-muted/50 shadow-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-1.5"><Printer className="h-5 w-5 text-mauve" /> Constancia de Atención</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3 py-2 text-sm">
            <div className="grid gap-1">
              <Label htmlFor="at-date">Fecha de consulta</Label>
              <Input
                id="at-date"
                type="date"
                value={atencionDate}
                onChange={(e) => setAtencionDate(e.target.value)}
                className="rounded-xl"
              />
            </div>
            <div className="grid gap-1">
              <Label htmlFor="at-time">Hora de consulta</Label>
              <Input
                id="at-time"
                type="time"
                value={atencionTime}
                onChange={(e) => setAtencionTime(e.target.value)}
                className="rounded-xl"
              />
            </div>
            <div className="grid gap-1">
              <Label htmlFor="at-reason">Concepto de la consulta</Label>
              <Textarea
                id="at-reason"
                value={atencionReason}
                onChange={(e) => setAtencionReason(e.target.value)}
                placeholder="Escribe el concepto..."
                className="rounded-xl min-h-[70px]"
              />
            </div>

            <div className="border-t border-border/60 pt-3 mt-1 space-y-2.5">
              <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Datos de Firma del Médico</p>
              <div className="grid gap-1">
                <Label htmlFor="at-doc-uni">Universidad / Título Adicional</Label>
                <Input
                  id="at-doc-uni"
                  placeholder="Ej. UC-CHET"
                  value={doctorUni}
                  onChange={(e) => setDoctorUni(e.target.value)}
                  className="rounded-xl text-xs h-9"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="grid gap-1">
                  <Label htmlFor="at-doc-mpps">Registro MPPS</Label>
                  <Input
                    id="at-doc-mpps"
                    placeholder="Ej. 102.927"
                    value={doctorMpps}
                    onChange={(e) => setDoctorMpps(e.target.value)}
                    className="rounded-xl text-xs h-9"
                  />
                </div>
                <div className="grid gap-1">
                  <Label htmlFor="at-doc-cmc">Registro CMC</Label>
                  <Input
                    id="at-doc-cmc"
                    placeholder="Ej. 11.619"
                    value={doctorCmc}
                    onChange={(e) => setDoctorCmc(e.target.value)}
                    className="rounded-xl text-xs h-9"
                  />
                </div>
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-2 border-t border-border/60 pt-3 mt-2">
            <Button variant="ghost" onClick={() => setOpenAtencion(false)} className="rounded-xl">Cancelar</Button>
            <Button onClick={() => viewing && handleExportAtencion(viewing)} className="rounded-xl bg-gradient-to-r from-mauve to-mauve-soft text-primary-foreground shadow-sm shadow-mauve/30">
              Generar PDF
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog Constancia de Justificativo Médico */}
      <Dialog open={openJustificativo} onOpenChange={setOpenJustificativo}>
        <DialogContent className="rounded-3xl sm:max-w-md bg-card p-6 border border-muted/50 shadow-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-1.5"><Printer className="h-5 w-5 text-mauve" /> Justificativo Médico</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3 py-2 text-sm">
            <div className="grid gap-1">
              <Label htmlFor="jm-date">Fecha de consulta</Label>
              <Input
                id="jm-date"
                type="date"
                value={justificativoDate}
                onChange={(e) => setJustificativoDate(e.target.value)}
                className="rounded-xl"
              />
            </div>
            <div className="grid gap-1">
              <Label htmlFor="jm-days">Días de reposo/justificación</Label>
              <Input
                id="jm-days"
                type="number"
                min="1"
                max="90"
                value={justificativoDays}
                onChange={(e) => setJustificativoDays(e.target.value)}
                className="rounded-xl"
              />
            </div>
            <div className="grid gap-1">
              <Label htmlFor="jm-reason">Diagnóstico / Síntomas (Justificación)</Label>
              <Textarea
                id="jm-reason"
                value={justificativoReason}
                onChange={(e) => setJustificativoReason(e.target.value)}
                placeholder="Escribe el diagnóstico o los síntomas..."
                className="rounded-xl min-h-[70px]"
              />
            </div>

            <div className="border-t border-border/60 pt-3 mt-1 space-y-2.5">
              <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Datos de Firma del Médico</p>
              <div className="grid gap-1">
                <Label htmlFor="jm-doc-uni">Universidad / Título Adicional</Label>
                <Input
                  id="jm-doc-uni"
                  placeholder="Ej. UC-CHET"
                  value={doctorUni}
                  onChange={(e) => setDoctorUni(e.target.value)}
                  className="rounded-xl text-xs h-9"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="grid gap-1">
                  <Label htmlFor="jm-doc-mpps">Registro MPPS</Label>
                  <Input
                    id="jm-doc-mpps"
                    placeholder="Ej. 102.927"
                    value={doctorMpps}
                    onChange={(e) => setDoctorMpps(e.target.value)}
                    className="rounded-xl text-xs h-9"
                  />
                </div>
                <div className="grid gap-1">
                  <Label htmlFor="jm-doc-cmc">Registro CMC</Label>
                  <Input
                    id="jm-doc-cmc"
                    placeholder="Ej. 11.619"
                    value={doctorCmc}
                    onChange={(e) => setDoctorCmc(e.target.value)}
                    className="rounded-xl text-xs h-9"
                  />
                </div>
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-2 border-t border-border/60 pt-3 mt-2">
            <Button variant="ghost" onClick={() => setOpenJustificativo(false)} className="rounded-xl">Cancelar</Button>
            <Button onClick={() => viewing && handleExportJustificativo(viewing)} className="rounded-xl bg-gradient-to-r from-mauve to-mauve-soft text-primary-foreground shadow-sm shadow-mauve/30">
              Generar PDF
            </Button>
          </div>
        </DialogContent>
      </Dialog>

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
