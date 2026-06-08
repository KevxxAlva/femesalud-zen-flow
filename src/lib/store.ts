import { useSyncExternalStore } from "react";

export type PatientStatus = "Activo" | "En tratamiento" | "Alta" | "Nuevo";
export type AppointmentStatus = "programada" | "completada" | "cancelada";

export interface Patient {
  id: string;
  name: string;
  email: string;
  phone: string;
  age: number;
  status: PatientStatus;
  doctor: string;
  lastVisit: string; // ISO date
  notes?: string;
}

export interface Appointment {
  id: string;
  patientId: string;
  patientName: string;
  doctor: string;
  date: string; // ISO date
  time: string; // HH:mm
  reason: string;
  status: AppointmentStatus;
}

export const DOCTORS = [
  "Dra. Lucía Vega",
  "Dr. Andrés Molina",
  "Dra. Carolina Reyes",
  "Dr. Pablo Herrera",
];

const STORAGE_KEY = "femesalud-store-v1";

interface State {
  patients: Patient[];
  appointments: Appointment[];
}

const todayISO = (offsetDays = 0) => {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString().slice(0, 10);
};

const seed: State = {
  patients: [
    { id: "p1", name: "María Fernández", email: "maria@mail.com", phone: "+34 612 110 220", age: 34, status: "En tratamiento", doctor: "Dra. Lucía Vega", lastVisit: todayISO(-1) },
    { id: "p2", name: "Sofía Castillo", email: "sofia@mail.com", phone: "+34 612 110 221", age: 29, status: "Activo", doctor: "Dra. Lucía Vega", lastVisit: todayISO(-3) },
    { id: "p3", name: "Camila Torres", email: "camila@mail.com", phone: "+34 612 110 222", age: 41, status: "Nuevo", doctor: "Dr. Andrés Molina", lastVisit: todayISO(-7) },
    { id: "p4", name: "Valentina Ríos", email: "valentina@mail.com", phone: "+34 612 110 223", age: 27, status: "Activo", doctor: "Dra. Carolina Reyes", lastVisit: todayISO(-2) },
    { id: "p5", name: "Isabella Núñez", email: "isabella@mail.com", phone: "+34 612 110 224", age: 38, status: "Alta", doctor: "Dr. Pablo Herrera", lastVisit: todayISO(-14) },
    { id: "p6", name: "Ana Morales", email: "ana@mail.com", phone: "+34 612 110 225", age: 31, status: "Activo", doctor: "Dra. Lucía Vega", lastVisit: todayISO(0) },
    { id: "p7", name: "Luciana Paz", email: "luciana@mail.com", phone: "+34 612 110 226", age: 45, status: "En tratamiento", doctor: "Dr. Andrés Molina", lastVisit: todayISO(0) },
    { id: "p8", name: "Renata Silva", email: "renata@mail.com", phone: "+34 612 110 227", age: 36, status: "Activo", doctor: "Dra. Carolina Reyes", lastVisit: todayISO(-1) },
  ],
  appointments: [
    { id: "a1", patientId: "p1", patientName: "María Fernández", doctor: "Dra. Lucía Vega", date: todayISO(0), time: "09:00", reason: "Control prenatal", status: "programada" },
    { id: "a2", patientId: "p2", patientName: "Sofía Castillo", doctor: "Dra. Lucía Vega", date: todayISO(0), time: "10:30", reason: "Revisión anual", status: "programada" },
    { id: "a3", patientId: "p3", patientName: "Camila Torres", doctor: "Dr. Andrés Molina", date: todayISO(0), time: "11:45", reason: "Ecografía", status: "programada" },
    { id: "a4", patientId: "p4", patientName: "Valentina Ríos", doctor: "Dra. Carolina Reyes", date: todayISO(0), time: "13:15", reason: "Consulta general", status: "programada" },
    { id: "a5", patientId: "p5", patientName: "Isabella Núñez", doctor: "Dr. Pablo Herrera", date: todayISO(0), time: "15:00", reason: "Seguimiento", status: "programada" },
    { id: "a6", patientId: "p6", patientName: "Ana Morales", doctor: "Dra. Lucía Vega", date: todayISO(-1), time: "10:00", reason: "Consulta", status: "completada" },
    { id: "a7", patientId: "p7", patientName: "Luciana Paz", doctor: "Dr. Andrés Molina", date: todayISO(-1), time: "12:30", reason: "Resultados lab", status: "completada" },
    { id: "a8", patientId: "p8", patientName: "Renata Silva", doctor: "Dra. Carolina Reyes", date: todayISO(-2), time: "16:00", reason: "Receta", status: "cancelada" },
    { id: "a9", patientId: "p3", patientName: "Camila Torres", doctor: "Dr. Andrés Molina", date: todayISO(1), time: "09:30", reason: "Seguimiento ecografía", status: "programada" },
    { id: "a10", patientId: "p2", patientName: "Sofía Castillo", doctor: "Dra. Lucía Vega", date: todayISO(2), time: "11:00", reason: "Análisis", status: "programada" },
  ],
};

function load(): State {
  if (typeof window === "undefined") return seed;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return seed;
    return JSON.parse(raw) as State;
  } catch {
    return seed;
  }
}

let state: State = load();
const listeners = new Set<() => void>();

function persist() {
  if (typeof window !== "undefined") {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch { /* ignore */ }
  }
}
function emit() {
  persist();
  listeners.forEach((l) => l());
}

export const store = {
  getState: () => state,
  subscribe: (fn: () => void) => {
    listeners.add(fn);
    return () => listeners.delete(fn);
  },
  reset: () => {
    state = seed;
    emit();
  },
  // Patients
  addPatient: (p: Omit<Patient, "id">) => {
    state = { ...state, patients: [{ ...p, id: `p${Date.now()}` }, ...state.patients] };
    emit();
  },
  updatePatient: (id: string, patch: Partial<Patient>) => {
    state = {
      ...state,
      patients: state.patients.map((p) => (p.id === id ? { ...p, ...patch } : p)),
      appointments: state.appointments.map((a) =>
        a.patientId === id && patch.name ? { ...a, patientName: patch.name } : a,
      ),
    };
    emit();
  },
  deletePatient: (id: string) => {
    state = {
      ...state,
      patients: state.patients.filter((p) => p.id !== id),
      appointments: state.appointments.filter((a) => a.patientId !== id),
    };
    emit();
  },
  // Appointments
  addAppointment: (a: Omit<Appointment, "id">) => {
    state = { ...state, appointments: [{ ...a, id: `a${Date.now()}` }, ...state.appointments] };
    emit();
  },
  updateAppointment: (id: string, patch: Partial<Appointment>) => {
    state = {
      ...state,
      appointments: state.appointments.map((a) => (a.id === id ? { ...a, ...patch } : a)),
    };
    emit();
  },
  deleteAppointment: (id: string) => {
    state = { ...state, appointments: state.appointments.filter((a) => a.id !== id) };
    emit();
  },
};

export function useStore<T>(selector: (s: State) => T): T {
  return useSyncExternalStore(
    store.subscribe,
    () => selector(store.getState()),
    () => selector(seed),
  );
}
