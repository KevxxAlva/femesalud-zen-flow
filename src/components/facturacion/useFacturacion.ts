import { useState, useMemo, useEffect } from "react";
import { useAppointments, useUpdateAppointment, type AppointmentWithPatient } from "@/lib/api/appointments";
import { useDoctors, useMyProfile } from "@/lib/api/profiles";
import { useClinicInfo } from "@/lib/api/clinic";
import { useAuthSession } from "@/hooks/useAuth";

const MONTHS_ES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
];

export function useFacturacion() {
  const dateFilterFrom = useMemo(() => {
    const d = new Date();
    d.setMonth(d.getMonth() - 2); // Current month and previous 2 months
    d.setDate(1);
    d.setHours(0, 0, 0, 0);
    return d.toISOString();
  }, []);

  const { data: appointments = [], isLoading } = useAppointments({ from: dateFilterFrom });
  const { data: doctors = [] } = useDoctors();
  const { data: clinic } = useClinicInfo();
  const updateAppointment = useUpdateAppointment();

  const { user: me } = useAuthSession();
  const { data: myProfile } = useMyProfile(me?.id);

  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState("todas");
  const [doctorFilter, setDoctorFilter] = useState("todos");
  const [monthFilter, setMonthFilter] = useState("todos");

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;

  const monthOptions = useMemo(() => {
    const months = new Set<string>();
    appointments.forEach((a) => {
      const date = new Date(a.scheduled_at);
      if (!isNaN(date.getTime())) {
        const year = date.getFullYear();
        const monthNum = date.getMonth(); // 0-11
        const key = `${year}-${String(monthNum + 1).padStart(2, "0")}`;
        months.add(key);
      }
    });
    const sortedKeys = Array.from(months).sort((a, b) => b.localeCompare(a));
    return sortedKeys.map((key) => {
      const [year, monthStr] = key.split("-");
      const monthIndex = parseInt(monthStr, 10) - 1;
      const label = `${MONTHS_ES[monthIndex]} ${year}`;
      return { key, label };
    });
  }, [appointments]);

  const doctorMap = useMemo(() => new Map(doctors.map((d) => [d.id, d.full_name || d.email])), [doctors]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [q, statusFilter, doctorFilter, monthFilter]);

  // KPIs
  const metrics = useMemo(() => {
    const paid = appointments.filter((a) => a.status === "completada" && a.payment_method);
    const unpaid = appointments.filter((a) => a.status === "programada" || (a.status === "completada" && !a.payment_method));
    
    const totalEarnings = paid.reduce((sum, a) => sum + (Number(a.price) || 0), 0);
    const pendingEarnings = unpaid.reduce((sum, a) => sum + (Number(a.price) || 0), 0);

    return {
      totalEarnings,
      pendingEarnings,
      completedCount: paid.length,
      pendingCount: unpaid.length,
    };
  }, [appointments]);

  // Filtering
  const filtered = useMemo(() => {
    const term = q.toLowerCase().trim();
    return appointments.filter((a) => {
      const patientName = a.patient_name || "";
      const reason = a.reason || "";
      if (term && !patientName.toLowerCase().includes(term) && !reason.toLowerCase().includes(term)) return false;
      if (statusFilter !== "todas" && a.status !== statusFilter) return false;
      if (doctorFilter !== "todos" && a.doctor_id !== doctorFilter) return false;
      
      if (monthFilter !== "todos") {
        const date = new Date(a.scheduled_at);
        if (!isNaN(date.getTime())) {
          const year = date.getFullYear();
          const monthNum = date.getMonth() + 1;
          const key = `${year}-${String(monthNum).padStart(2, "0")}`;
          if (key !== monthFilter) return false;
        } else {
          return false;
        }
      }
      return true;
    });
  }, [appointments, q, statusFilter, doctorFilter, monthFilter]);

  // Pagination
  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const paginated = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filtered.slice(start, start + itemsPerPage);
  }, [filtered, currentPage]);

  return {
    appointments,
    isLoading,
    doctors,
    clinic,
    myProfile,
    updateAppointment,
    q,
    setQ,
    statusFilter,
    setStatusFilter,
    doctorFilter,
    setDoctorFilter,
    monthFilter,
    setMonthFilter,
    currentPage,
    setCurrentPage,
    itemsPerPage,
    monthOptions,
    doctorMap,
    metrics,
    filtered,
    paginated,
    totalPages,
  };
}
