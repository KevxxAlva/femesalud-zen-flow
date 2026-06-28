export const FILTERS = ["todas", "programada", "completada", "cancelada"] as const;

export const statusBg: Record<string, string> = {
  programada: "bg-mauve/15 text-mauve",
  completada: "bg-sage/50 text-sage-foreground",
  cancelada: "bg-destructive/15 text-destructive",
};

export const MONTHS_ES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
];

export const WEEKDAYS_ES = [
  "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"
];

export function dateOnly(iso: string) { 
  return iso.slice(0, 10); 
}

export function timeOnly(iso: string) {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function getMonday(d: Date) {
  const date = new Date(d);
  const day = date.getDay();
  // adjust when day is sunday (0)
  const diff = date.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(date.setDate(diff));
}

export function getWeekDays(d: Date) {
  const start = getMonday(d);
  const days = [];
  for (let i = 0; i < 7; i++) {
    const next = new Date(start);
    next.setDate(start.getDate() + i);
    days.push(next);
  }
  return days;
}

export function getStartOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

export function getCalendarMonthDays(d: Date) {
  const start = getStartOfMonth(d);
  let dayOfWeek = start.getDay();
  // We want Lunes (1) to be index 0, Domingo (0) to be index 6
  let offset = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  
  const calendarStart = new Date(start);
  calendarStart.setDate(start.getDate() - offset);
  
  const days = [];
  // We always render 42 days (6 weeks) to maintain a stable size grid
  for (let i = 0; i < 42; i++) {
    const next = new Date(calendarStart);
    next.setDate(calendarStart.getDate() + i);
    days.push(next);
  }
  return days;
}

export function formatToYMD(d: Date) {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
