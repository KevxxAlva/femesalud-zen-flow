import { useMemo, useState } from "react";
import { Search, Plus, Users, Pencil, Trash2, X, Mail, Phone, Stethoscope, Loader2, FileDown, Printer, FileText } from "lucide-react";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { PatientForm } from "@/components/PatientForm";
import { ClinicalNotesPanel } from "@/components/ClinicalNotesPanel";
import { usePatients, useDeletePatient, type Patient } from "@/lib/api/patients";
import { useDoctors, useMyProfile } from "@/lib/api/profiles";
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
  const { data: patients = [], isLoading, error } = usePatients();
  const { data: doctors = [] } = useDoctors();
  const del = useDeletePatient();

  const [q, setQ] = useState("");
  const [status, setStatus] = useState("Todos");
  const [doctorFilter, setDoctorFilter] = useState("Todos");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Patient | null>(null);
  const [viewing, setViewing] = useState<Patient | null>(null);
  const [toDelete, setToDelete] = useState<Patient | null>(null);

  const doctorMap = useMemo(() => new Map(doctors.map((d) => [d.id, d.full_name || d.email])), [doctors]);

  const { user: me } = useAuthSession();
  const { data: myProfile } = useMyProfile(me?.id);
  const { data: patientNotes = [] } = useClinicalNotes(viewing?.id);

  // Document export states
  const [openReposo, setOpenReposo] = useState(false);
  const [openAtencion, setOpenAtencion] = useState(false);

  // Form states for certificates
  const [reposoDays, setReposoDays] = useState("3");
  const [reposoStart, setReposoStart] = useState(() => new Date().toISOString().slice(0, 10));
  const [reposoReason, setReposoReason] = useState("");

  const [atencionDate, setAtencionDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [atencionTime, setAtencionTime] = useState("10:00");
  const [atencionReason, setAtencionReason] = useState("");

  // Doctor credentials
  const [doctorUni, setDoctorUni] = useState("UC-CHET");
  const [doctorMpps, setDoctorMpps] = useState("102.927");
  const [doctorCmc, setDoctorCmc] = useState("11.619");

  const handleOpenReposoDialog = (patient: Patient) => {
    const docObj = doctors.find((d) => d.id === patient.assigned_doctor_id);
    const docName = docObj?.full_name || myProfile?.full_name || "";

    if (docName.toLowerCase().includes("carli")) {
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
    const docObj = doctors.find((d) => d.id === patient.assigned_doctor_id);
    const docName = docObj?.full_name || myProfile?.full_name || "";

    if (docName.toLowerCase().includes("carli")) {
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

      // Top Header
      doc.text("Calle las Flores entre González Padrón y Shettino, Número 16.", pageWidth / 2, 45, { align: "center" });
      doc.text("Valle de la Pascua, Estado Guárico.", pageWidth / 2, 57, { align: "center" });
      doc.text("0412/8299890 0424/4609387", pageWidth / 2, 69, { align: "center" });

      // Consultorio Header
      doc.setFont("times", "normal");
      doc.setFontSize(12.5);
      doc.setTextColor(0);
      doc.text("Consultorio Ginecológico Obstétrico", pageWidth / 2, 105, { align: "center" });
      doc.setFont("times", "italic");
      doc.setFontSize(17.5);
      doc.text("Femesalud", pageWidth / 2, 122, { align: "center" });

      // Date Format: Valle de la Pascua, DD / MM / AAAA
      const today = new Date();
      const topDay = String(today.getDate()).padStart(2, "0");
      const topMonth = String(today.getMonth() + 1).padStart(2, "0");
      const topYear = String(today.getFullYear());
      doc.setFont("times", "normal");
      doc.setFontSize(10.5);
      doc.text(`Valle de la Pascua,   ${topDay}   /   ${topMonth}   /   ${topYear}`, pageWidth - 40, 155, { align: "right" });

      // Title (FICHA DE HISTORIAL CLÍNICO, bold, centered, underlined)
      doc.setFont("times", "bold");
      doc.setFontSize(13);
      doc.text("FICHA DE HISTORIAL CLÍNICO", pageWidth / 2, 195, { align: "center" });
      const titleWidth = doc.getTextWidth("FICHA DE HISTORIAL CLÍNICO");
      doc.setDrawColor(0);
      doc.setLineWidth(0.5);
      doc.line(pageWidth / 2 - titleWidth / 2, 198, pageWidth / 2 + titleWidth / 2, 198);

      doc.setFont("times", "bold");
      doc.setFontSize(11);
      doc.text("Datos del Paciente", 40, 225);

      autoTable(doc, {
        startY: 235,
        head: [["Campo", "Información"]],
        body: [
          ["Nombre Completo", patient.full_name || "—"],
          ["Cédula / Identificación", patient.document_id || "—"],
          ["Fecha de Nacimiento", patient.birth_date || "—"],
          ["Correo Electrónico", patient.email || "—"],
          ["Teléfono", patient.phone || "—"],
          ["Médico Asignado", doctorMap.get(patient.assigned_doctor_id ?? "") || "Sin asignar"],
          ["Notas Generales", patient.notes || "—"],
        ],
        theme: "grid",
        headStyles: { fillColor: [139, 92, 175], textColor: 255, font: "times" },
        styles: { font: "times", fontSize: 10, cellPadding: 5 },
        margin: { left: 40, right: 40 },
      });

      const after = (doc as any).lastAutoTable.finalY + 25;
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
          startY: after + 10,
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
            2: { cellWidth: 320 },
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

      // Top Header
      doc.text("Calle las Flores entre González Padrón y Shettino, Número 16.", pageWidth / 2, 45, { align: "center" });
      doc.text("Valle de la Pascua, Estado Guárico.", pageWidth / 2, 57, { align: "center" });
      doc.text("0412/8299890 0424/4609387", pageWidth / 2, 69, { align: "center" });

      // Consultorio Header
      doc.setFont("times", "normal");
      doc.setFontSize(12.5);
      doc.setTextColor(0);
      doc.text("Consultorio Ginecológico Obstétrico", pageWidth / 2, 105, { align: "center" });
      doc.setFont("times", "italic");
      doc.setFontSize(17.5);
      doc.text("Femesalud", pageWidth / 2, 122, { align: "center" });

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

      // Top Header
      doc.text("Calle las Flores entre González Padrón y Shettino, Número 16.", pageWidth / 2, 45, { align: "center" });
      doc.text("Valle de la Pascua, Estado Guárico.", pageWidth / 2, 57, { align: "center" });
      doc.text("0412/8299890 0424/4609387", pageWidth / 2, 69, { align: "center" });

      // Consultorio Header
      doc.setFont("times", "normal");
      doc.setFontSize(12.5);
      doc.setTextColor(0);
      doc.text("Consultorio Ginecológico Obstétrico", pageWidth / 2, 105, { align: "center" });
      doc.setFont("times", "italic");
      doc.setFontSize(17.5);
      doc.text("Femesalud", pageWidth / 2, 122, { align: "center" });

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

  const filtered = useMemo(() => {
    const term = q.toLowerCase().trim();
    return patients.filter((p) => {
      if (term && !p.full_name.toLowerCase().includes(term) && !(p.email ?? "").toLowerCase().includes(term)) return false;
      if (status !== "Todos" && p.status !== status) return false;
      if (doctorFilter !== "Todos" && p.assigned_doctor_id !== doctorFilter) return false;
      return true;
    });
  }, [patients, q, status, doctorFilter]);

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
          <p className="text-sm text-muted-foreground">{filtered.length} de {patients.length} pacientes</p>
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
      ) : filtered.length === 0 ? (
        <div className="rounded-3xl glass-card p-12 text-center shadow-sm">
          <Users className="mx-auto h-10 w-10 text-muted-foreground" />
          <p className="mt-3 text-sm text-muted-foreground">No se encontraron pacientes.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((p) => (
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
      )}

      <PatientForm open={formOpen} onOpenChange={setFormOpen} patient={editing} />

      <Dialog open={!!viewing} onOpenChange={(o) => !o && setViewing(null)}>
        <DialogContent className="sm:max-w-2xl rounded-3xl max-h-[90vh] overflow-y-auto">
          {viewing && (
            <>
              <DialogHeader className="flex flex-row items-center justify-between pr-6">
                <DialogTitle>Detalle del paciente</DialogTitle>
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
                  </DropdownMenuContent>
                </DropdownMenu>
              </DialogHeader>
              <div className="flex items-center gap-3">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-mauve to-blush text-base font-semibold text-primary-foreground">
                  {initials(viewing.full_name)}
                </div>
                <div>
                  <p className="text-base font-semibold">{viewing.full_name}</p>
                  <span className={cn("inline-block rounded-full px-2.5 py-0.5 text-[11px] font-medium", tagBg[viewing.status] || "bg-muted")}>{statusLabel(viewing.status)}</span>
                </div>
              </div>
              <dl className="mt-3 grid grid-cols-2 gap-3 text-sm">
                <div className="col-span-2"><dt className="text-xs text-muted-foreground">Cédula / Identificación</dt><dd>{viewing.document_id || "—"}</dd></div>
                <div className="col-span-2"><dt className="text-xs text-muted-foreground">Nacimiento</dt><dd>{viewing.birth_date || "—"}</dd></div>
                <div className="col-span-2"><dt className="text-xs text-muted-foreground">Email</dt><dd>{viewing.email || "—"}</dd></div>
                <div className="col-span-2"><dt className="text-xs text-muted-foreground">Teléfono</dt><dd>{viewing.phone || "—"}</dd></div>
                <div className="col-span-2"><dt className="text-xs text-muted-foreground">Médico</dt><dd>{doctorMap.get(viewing.assigned_doctor_id ?? "") || "Sin asignar"}</dd></div>
                {viewing.notes && <div className="col-span-2"><dt className="text-xs text-muted-foreground">Notas generales</dt><dd>{viewing.notes}</dd></div>}
              </dl>
              <div className="mt-4 border-t border-border/60 pt-4">
                <ClinicalNotesPanel patientId={viewing.id} />
              </div>
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
