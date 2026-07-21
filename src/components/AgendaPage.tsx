import { useMemo, useState, useEffect } from "react";
import { Link } from "@tanstack/react-router";
import { Plus, ChevronLeft, ChevronRight, Download, Filter, Search, Grid, MoreHorizontal, Clock, LifeBuoy, Stethoscope, Video, Network } from "lucide-react";
import { useAppointments, useUpdateAppointment, useDeleteAppointment, type AppointmentWithPatient } from "@/lib/api/appointments";
import { useDoctors } from "@/lib/api/profiles";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AppointmentForm } from "@/components/AppointmentForm";
import { ConsultationForm } from "@/components/ConsultationForm";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

// Helpers
function dateOnly(iso: string) { return iso.slice(0, 10); }
function timeOnly(iso: string) {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function getMonday(d: Date) {
  const date = new Date(d);
  const day = date.getDay();
  const diff = date.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(date.setDate(diff));
}

function getWeekDays(d: Date) {
  const start = getMonday(d);
  const days = [];
  for (let i = 0; i < 7; i++) {
    const next = new Date(start);
    next.setDate(start.getDate() + i);
    days.push(next);
  }
  return days;
}

function getCalendarMonthDays(d: Date) {
  const start = new Date(d.getFullYear(), d.getMonth(), 1);
  let dayOfWeek = start.getDay();
  let offset = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  const calendarStart = new Date(start);
  calendarStart.setDate(start.getDate() - offset);
  
  const days = [];
  for (let i = 0; i < 35; i++) {
    const next = new Date(calendarStart);
    next.setDate(calendarStart.getDate() + i);
    days.push(next);
  }
  return days;
}

function formatToYMD(d: Date) {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

const MONTHS_ES = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
const WEEKDAYS_SHORT = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const HOURS = [8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18];

export function AgendaPage() {
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [formOpen, setFormOpen] = useState(false);
  const [defaultFormDate, setDefaultFormDate] = useState<string | undefined>(undefined);
  const [editingApp, setEditingApp] = useState<AppointmentWithPatient | null>(null);

  const [consultationOpen, setConsultationOpen] = useState(false);
  const [consultationApp, setConsultationApp] = useState<AppointmentWithPatient | null>(null);
  const [compactMode, setCompactMode] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [calendarView, setCalendarView] = useState("Semanal");
  const [statusFilter, setStatusFilter] = useState("todas");

  // Queries
  const { data: appointments = [], isLoading } = useAppointments({
    from: new Date(currentDate.getFullYear(), currentDate.getMonth() - 2, 1).toISOString().slice(0, 10),
    to: new Date(currentDate.getFullYear(), currentDate.getMonth() + 3, 0).toISOString().slice(0, 10),
  });
  const { data: doctors = [] } = useDoctors();
  const update = useUpdateAppointment();
  const del = useDeleteAppointment();

  const doctorMap = useMemo(() => new Map(doctors.map((d) => [d.id, d.full_name || d.email])), [doctors]);
  
  const weekDays = useMemo(() => getWeekDays(currentDate), [currentDate]);
  const monthDays = useMemo(() => getCalendarMonthDays(currentDate), [currentDate]);

  const changeStatus = async (id: string, status: string) => {
    try { await update.mutateAsync({ id, status }); toast.success("Estado actualizado"); }
    catch (err) { toast.error(err instanceof Error ? err.message : "Error"); }
  };

  const deleteApp = async (id: string) => {
    try { await del.mutateAsync(id); toast.success("Cita eliminada"); }
    catch (err: any) { toast.error(err?.message || "Error al eliminar"); }
  };

  // Process events for the grid
  const gridEvents = useMemo(() => {
    const weekStart = formatToYMD(weekDays[0]);
    const weekEnd = formatToYMD(weekDays[6]);
    
    return appointments.filter((a) => {
      // Handle both "YYYY-MM-DD HH:MM:SS" and ISO strings safely
      const safeIso = a.scheduled_at.replace(" ", "T");
      const d = dateOnly(safeIso);
      const matchesSearch = !searchQuery || (a.patient_name && a.patient_name.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesStatus = statusFilter === "todas" ? a.status !== "cancelada" : a.status === statusFilter;
      return d >= weekStart && d <= weekEnd && matchesSearch && matchesStatus;
    }).map((app) => {
      const safeIso = app.scheduled_at.replace(" ", "T");
      const date = new Date(safeIso);
      const hour = date.getHours();
      const mins = date.getMinutes();
      
      // Calculate top position relative to 8 AM
      const startFloat = hour + (mins / 60);
      const startFrom8 = startFloat - 8;
      
      // Use actual duration or default to 1 hour
      const durationHours = (app.duration_minutes || 60) / 60;
      
      let theme;
      if (app.status?.toLowerCase() === 'completada') {
        theme = { bg: "bg-green-50", border: "border-green-400", text: "text-green-700" };
      } else {
        theme = { bg: "bg-blue-50", border: "border-blue-300", text: "text-[#4361ee]" };
      }
      
      return {
        ...app,
        dayIndex: date.getDay() === 0 ? 6 : date.getDay() - 1, // 0 = Mon, 6 = Sun
        topHours: startFrom8,
        durationHours,
        theme
      };
    });
  }, [appointments, weekDays]);

  const monthDaysGrid = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDayOfMonth = new Date(year, month, 1);
    const startDate = getMonday(firstDayOfMonth);
    
    return Array.from({ length: 42 }, (_, i) => {
      const d = new Date(startDate);
      d.setDate(startDate.getDate() + i);
      return d;
    });
  }, [currentDate]);

  const daysToRender = calendarView === "Diaria" ? [currentDate] : weekDays;

  return (
    <>
      <div className="bg-white rounded-[2rem] p-6 shadow-sm min-h-[calc(100vh-8rem)] font-sans text-[#2b3674] flex flex-col">
        
        {/* HEADER */}
        <header className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-[#4361ee] tracking-tight">Agenda</h1>
          <button 
            onClick={() => { setDefaultFormDate(formatToYMD(new Date())); setEditingApp(null); setFormOpen(true); }}
            className="flex items-center gap-2 bg-[#4361ee] text-white px-5 py-2.5 rounded-full font-bold shadow-md hover:bg-[#3451d6] transition-colors"
          >
            <Plus className="h-4 w-4" strokeWidth={3} /> Nueva Cita
          </button>
        </header>

        {/* TOOLBAR */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-4">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2 text-xs font-bold text-[#2b3674] border border-[#f0f2f5] rounded-xl px-4 py-2 hover:bg-gray-50 focus:outline-none">
                  <Filter className="h-4 w-4 text-[#a3aed1]" /> Filtro
                  {statusFilter !== "todas" && <span className="bg-[#4361ee] w-2 h-2 rounded-full absolute top-1 right-1"></span>}
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-48 rounded-xl">
                <DropdownMenuItem onClick={() => setStatusFilter("todas")} className="text-xs font-bold cursor-pointer">Todas (Activas)</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setStatusFilter("programada")} className="text-xs font-bold cursor-pointer">Solo Programadas</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setStatusFilter("completada")} className="text-xs font-bold cursor-pointer">Solo Completadas</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setStatusFilter("cancelada")} className="text-xs font-bold cursor-pointer text-red-500 hover:text-red-600 focus:text-red-600">Ver Canceladas</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2 text-xs font-bold text-[#2b3674] border border-[#f0f2f5] rounded-xl px-4 py-2 hover:bg-gray-50 focus:outline-none">
                  <Clock className="h-4 w-4 text-[#a3aed1]" /> {calendarView} <span className="ml-1 text-[10px] text-[#a3aed1]">▼</span>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-40 rounded-xl">
                <DropdownMenuItem onClick={() => setCalendarView("Mensual")} className="text-xs font-bold cursor-pointer">Mensual</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setCalendarView("Semanal")} className="text-xs font-bold cursor-pointer">Semanal</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setCalendarView("Diaria")} className="text-xs font-bold cursor-pointer">Diaria</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <button className="flex items-center gap-2 text-xs font-bold text-[#2b3674] border border-[#f0f2f5] rounded-xl px-4 py-2 hover:bg-gray-50">
              <Download className="h-4 w-4 text-[#a3aed1]" /> Descargar Datos
            </button>
          </div>
          <div className="flex items-center gap-3">
            <div className={cn("flex items-center transition-all duration-300 overflow-hidden", isSearchOpen ? "w-48 opacity-100" : "w-9 opacity-100")}>
              {isSearchOpen ? (
                <div className="relative w-full">
                  <input
                    autoFocus
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onBlur={() => { if (!searchQuery) setIsSearchOpen(false); }}
                    placeholder="Buscar paciente..."
                    className="w-full h-9 pl-9 pr-3 text-xs border border-[#4361ee] rounded-full focus:outline-none focus:ring-1 focus:ring-[#4361ee]"
                  />
                  <Search className="h-4 w-4 text-[#4361ee] absolute left-3 top-2.5" />
                </div>
              ) : (
                <button onClick={() => setIsSearchOpen(true)} className="h-9 w-9 shrink-0 flex items-center justify-center border border-[#f0f2f5] rounded-full text-[#a3aed1] hover:bg-gray-50 focus:outline-none">
                  <Search className="h-4 w-4" />
                </button>
              )}
            </div>
            <Link to="/support">
              <button className="flex items-center gap-2 text-xs font-bold text-[#2b3674] border border-[#f0f2f5] rounded-xl px-4 py-2 hover:bg-gray-50">
                <LifeBuoy className="h-4 w-4 text-[#a3aed1]" /> Soporte
              </button>
            </Link>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2 text-xs font-bold text-[#2b3674] border border-[#f0f2f5] rounded-xl px-4 py-2 hover:bg-gray-50 focus:outline-none focus:ring-0">
                  <Grid className="h-4 w-4 text-[#a3aed1]" /> Diseño
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48 rounded-xl">
                <DropdownMenuItem onClick={() => setCompactMode(false)} className="text-xs font-bold cursor-pointer">
                  Vista Cómoda (Normal)
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setCompactMode(true)} className="text-xs font-bold cursor-pointer">
                  Vista Compacta
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-8 flex-1">
          {/* LEFT SIDEBAR */}
          <aside className="w-full lg:w-[280px] flex flex-col gap-8 shrink-0">
            
            {/* Appointment Calendar */}
            <div>
              <div className="flex justify-between items-center mb-4">
                <h2 className="font-bold text-sm tracking-wide text-[#2b3674]">Calendario de Citas</h2>
                <div className="flex gap-1">
                  <button onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))} className="h-6 w-6 flex items-center justify-center bg-[#4361ee] text-white rounded-full hover:opacity-90">
                    <ChevronLeft className="h-3 w-3" />
                  </button>
                  <button onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))} className="h-6 w-6 flex items-center justify-center bg-gray-100 text-gray-400 rounded-full hover:bg-gray-200">
                    <ChevronRight className="h-3 w-3" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-7 text-center gap-y-3 gap-x-1">
                {WEEKDAYS_SHORT.map(d => (
                  <div key={d} className="text-[10px] font-bold text-[#a3aed1]">{d}</div>
                ))}
                {monthDays.map((d, i) => {
                  const isCurrentMonth = d.getMonth() === currentDate.getMonth();
                  const isSelected = formatToYMD(d) === formatToYMD(currentDate);
                  return (
                    <div 
                      key={i} 
                      onClick={() => setCurrentDate(d)}
                      className={cn(
                        "h-8 w-8 mx-auto flex items-center justify-center text-xs font-bold rounded-full cursor-pointer transition-colors",
                        !isCurrentMonth && "text-gray-300",
                        isCurrentMonth && !isSelected && "text-[#2b3674] hover:bg-gray-100",
                        isSelected && "bg-[#4361ee] text-white shadow-md"
                      )}
                    >
                      {d.getDate()}
                    </div>
                  );
                })}
              </div>
            </div>

            <hr className="border-[#f0f2f5]" />

            {/* Doctor Appointment List */}
            <div className="flex-1 flex flex-col">
              <div className="flex justify-between items-center mb-6">
                <h2 className="font-bold text-sm tracking-wide text-[#2b3674]">Lista de Citas Médicas</h2>
                <button className="text-[#a3aed1] border border-[#f0f2f5] p-1 rounded-lg"><MoreHorizontal className="h-4 w-4" /></button>
              </div>

              <div className="space-y-4 flex-1 overflow-y-auto max-h-[400px] pr-2">
                {gridEvents.length === 0 ? (
                  <div className="text-center text-xs text-[#a3aed1] mt-10">No hay citas en este rango de fechas.</div>
                ) : (
                  gridEvents.slice(0, 10).map((app) => {
                    const safeIso = app.scheduled_at.replace(" ", "T");
                    const d = new Date(safeIso);
                    const end = new Date(d.getTime() + (app.duration_minutes || 60) * 60000);
                    const pad = (n: number) => String(n).padStart(2, '0');
                    return (
                      <div key={app.id} onClick={() => { setEditingApp(app); setFormOpen(true); }} className="flex items-center justify-between group cursor-pointer p-2 hover:bg-[#f4f7fe] rounded-xl transition">
                        <div className="flex items-center gap-3">
                          <img src={`https://api.dicebear.com/7.x/notionists/svg?seed=${app.patient_name}`} alt={app.patient_name} className="h-10 w-10 rounded-full bg-blue-50 border-2 border-white shadow-sm" />
                          <div className="overflow-hidden max-w-[120px]">
                            <p className="text-xs font-bold text-[#2b3674] group-hover:text-[#4361ee] transition truncate">{app.patient_name}</p>
                            <p className="text-[10px] font-medium text-[#a3aed1] uppercase tracking-wider truncate">{app.reason || "Cita"}</p>
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <Clock className="h-3 w-3 text-[#a3aed1] ml-auto mb-0.5" />
                          <p className="text-[10px] font-bold text-[#2b3674]">{pad(d.getHours())}:{pad(d.getMinutes())} - {pad(end.getHours())}:{pad(end.getMinutes())}</p>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              <button className="mt-4 w-full bg-[#4361ee] text-white text-xs font-bold py-3 rounded-2xl hover:bg-[#3451d6] transition shadow-md shadow-blue-500/20">
                Ver Todo
              </button>
            </div>
          </aside>

          {/* MAIN WEEK GRID */}
          <section className="flex-1 border border-[#f0f2f5] rounded-3xl flex flex-col overflow-hidden shadow-sm relative">
            
            {/* Grid Toolbar */}
            <div className="flex flex-wrap items-center justify-between p-4 border-b border-[#f0f2f5] bg-white z-20 relative">
              <div className="flex items-center gap-4">
                <h2 className="text-base font-bold text-[#2b3674]">
                  {MONTHS_ES[currentDate.getMonth()]} {currentDate.getFullYear()}
                </h2>
                <button onClick={() => setCurrentDate(new Date())} className="text-xs font-bold text-[#4361ee] bg-[#f4f7fe] px-3 py-1 rounded-lg">Hoy</button>
                <div className="flex items-center gap-1 text-[#a3aed1]">
                  <button onClick={() => setCurrentDate(new Date(currentDate.getTime() - 7 * 86400000))} className="hover:bg-gray-100 p-1 rounded-md"><ChevronLeft className="h-4 w-4" /></button>
                  <button onClick={() => setCurrentDate(new Date(currentDate.getTime() + 7 * 86400000))} className="hover:bg-gray-100 p-1 rounded-md"><ChevronRight className="h-4 w-4" /></button>
                </div>
              </div>
              <div className="flex items-center gap-4 text-xs font-bold text-[#a3aed1]">
                <button className="hover:text-[#2b3674]">Ninguno</button>
                <button className="hover:text-[#2b3674]">Prioridad</button>
                <button className="hover:text-[#2b3674]">Límite</button>
                <div className="h-4 w-px bg-gray-200 mx-1"></div>
                <button className="hover:text-[#2b3674]"><Video className="h-4 w-4" /></button>
                <button className="hover:text-[#2b3674]"><Network className="h-4 w-4" /></button>
              </div>
            </div>

            {/* Timetable Body Container */}
            <div className="flex-1 overflow-y-auto relative bg-white">
              
              {calendarView === "Mensual" ? (
                <div className="flex flex-col min-h-full bg-white relative">
                  {/* Monthly Header */}
                  <div className="sticky top-0 z-20 grid grid-cols-7 border-b border-[#f0f2f5] bg-white">
                    {WEEKDAYS_SHORT.map((dayName, i) => (
                      <div key={i} className="text-center py-3 border-r border-[#f0f2f5] last:border-0">
                        <p className="text-[10px] font-bold text-[#a3aed1] uppercase tracking-wider">{dayName}</p>
                      </div>
                    ))}
                  </div>
                  {/* Monthly Grid */}
                  <div className="flex-1 grid grid-cols-7 grid-rows-6">
                    {monthDaysGrid.map((d, i) => {
                      const isToday = formatToYMD(d) === formatToYMD(new Date());
                      const isCurrentMonth = d.getMonth() === currentDate.getMonth();
                      
                      const dayEvents = appointments.filter(a => {
                        const safeIso = a.scheduled_at.replace(" ", "T");
                        const matchesSearch = !searchQuery || (a.patient_name && a.patient_name.toLowerCase().includes(searchQuery.toLowerCase()));
                        const matchesStatus = statusFilter === "todas" ? a.status !== "cancelada" : a.status === statusFilter;
                        return dateOnly(safeIso) === formatToYMD(d) && matchesSearch && matchesStatus;
                      });

                      return (
                        <div 
                          key={i} 
                          onClick={() => { setDefaultFormDate(formatToYMD(d)); setEditingApp(null); setFormOpen(true); }}
                          className={cn(
                            "border-r border-b border-[#f0f2f5] p-2 min-h-[120px] transition hover:bg-gray-50/50 cursor-pointer overflow-hidden flex flex-col", 
                            !isCurrentMonth && "bg-gray-50/30 opacity-50", 
                            isToday && "bg-[#f8f9fe]/50"
                          )}
                        >
                          <div className="flex justify-between items-center mb-1 shrink-0">
                            <span className={cn("text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full", isToday ? "bg-[#4361ee] text-white" : "text-[#2b3674]")}>
                              {d.getDate()}
                            </span>
                          </div>
                          <div className="space-y-1 flex-1 overflow-y-auto no-scrollbar">
                            {dayEvents.map(ev => {
                              let theme;
                              if (ev.status?.toLowerCase() === 'completada') {
                                theme = { bg: "bg-green-100 text-green-700 hover:bg-green-200" };
                              } else {
                                theme = { bg: "bg-blue-100 text-blue-700 hover:bg-blue-200" };
                              }
                              return (
                                <div 
                                  key={ev.id} 
                                  onClick={(e) => { e.stopPropagation(); setEditingApp(ev); setFormOpen(true); }} 
                                  className={cn("text-[10px] font-bold px-1.5 py-1 rounded truncate transition", theme.bg)}
                                >
                                  {timeOnly(ev.scheduled_at.replace(" ", "T"))} {ev.patient_name}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              ) : (
                <>
                  {/* Days Header */}
              <div className="sticky top-0 z-20 flex bg-white border-b border-[#f0f2f5]">
                <div className="w-16 shrink-0 border-r border-[#f0f2f5] bg-white flex items-center justify-center">
                  <span className="text-[10px] font-bold text-[#a3aed1]">GMT-4</span>
                </div>
                <div className={cn("flex-1 grid", calendarView === "Diaria" ? "grid-cols-1" : "grid-cols-7")}>
                  {daysToRender.map((d, i) => (
                    <div key={i} className="text-center py-3 border-r border-[#f0f2f5] last:border-0">
                      <p className="text-[10px] font-bold text-[#a3aed1] uppercase tracking-wider">{WEEKDAYS_SHORT[d.getDay() === 0 ? 6 : d.getDay() - 1]} {d.getDate()}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Grid Lines & Events Container */}
              <div className="flex relative">
                {/* Y-Axis Hours */}
                <div className="w-16 shrink-0 border-r border-[#f0f2f5] bg-white relative z-10">
                  {HOURS.map((h, i) => (
                    <div key={h} className={cn("border-b border-transparent relative flex items-start justify-center pt-2", compactMode ? "h-12" : "h-24")}>
                      {i > 0 && <span className={cn("text-[10px] font-bold text-[#a3aed1] bg-white px-1", compactMode ? "-mt-3" : "-mt-4")}>{h < 12 ? h : h === 12 ? 12 : h - 12} {h < 12 ? 'AM' : 'PM'}</span>}
                    </div>
                  ))}
                </div>

                {/* Main Grid */}
                <div className={cn("flex-1 grid relative", calendarView === "Diaria" ? "grid-cols-1" : "grid-cols-7")}>
                  {/* Background horizontal lines */}
                  <div className="absolute inset-0 pointer-events-none flex flex-col">
                     {HOURS.map((h, i) => (
                       <div key={h} className={cn("w-full", compactMode ? "h-12" : "h-24", i > 0 && "border-t border-[#f0f2f5]")}></div>
                     ))}
                  </div>

                  {/* Day Columns */}
                  {daysToRender.map((d, colIndex) => {
                    const isToday = formatToYMD(d) === formatToYMD(new Date());
                    const actualDayIndex = d.getDay() === 0 ? 6 : d.getDay() - 1; // 0=Mon
                    return (
                      <div 
                        key={colIndex} 
                        onClick={() => { setDefaultFormDate(formatToYMD(d)); setEditingApp(null); setFormOpen(true); }}
                        className={cn("border-r border-[#f0f2f5] last:border-0 relative h-full min-h-[800px] cursor-pointer hover:bg-gray-50/50 transition-colors", isToday && "bg-[#f8f9fe]/50")}
                      >
                        {/* Render Events for this day */}
                        {gridEvents.filter(ev => ev.dayIndex === actualDayIndex).map((ev) => {
                          const pxPerHour = compactMode ? 48 : 96;
                          const topPx = ev.topHours * pxPerHour; 
                          const heightPx = ev.durationHours * pxPerHour;

                          return (
                            <Popover key={ev.id}>
                              <PopoverTrigger asChild>
                                <div 
                                  onClick={(e) => e.stopPropagation()} // Prevent column click when clicking event
                                  className={cn(
                                    "absolute left-1 right-1 rounded-[1rem] p-3 text-xs font-bold cursor-pointer transition-all hover:scale-[1.02] hover:z-30 overflow-hidden shadow-sm border border-l-4",
                                    ev.theme.bg, ev.theme.border, ev.theme.text
                                  )}
                                  style={{ top: `${topPx}px`, height: `${heightPx}px` }}
                                >
                                  <p className="truncate font-extrabold">{ev.patient_name}</p>
                                  <p className="text-[10px] opacity-80 font-medium tracking-wide mt-0.5 flex gap-1">
                                    {timeOnly(ev.scheduled_at.replace(" ", "T"))} - {timeOnly(new Date(new Date(ev.scheduled_at.replace(" ", "T")).getTime() + ev.durationHours * 3600000).toISOString())}
                                  </p>
                                </div>
                              </PopoverTrigger>
                              
                              {/* Edit Schedule Popover */}
                              <PopoverContent align="start" side="right" className="w-64 p-0 rounded-2xl shadow-xl border-border/40 z-50">
                                <div className="px-4 py-3 flex justify-between items-center border-b border-border/40">
                                  <span className="text-xs font-bold text-[#2b3674] tracking-wide">Editar Horario</span>
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <button className="text-[#a3aed1] hover:text-[#2b3674]"><MoreHorizontal className="h-4 w-4" /></button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="w-40 rounded-xl">
                                      <DropdownMenuItem className="text-xs font-bold text-red-500 focus:text-red-600 cursor-pointer" onClick={(e) => { e.stopPropagation(); deleteApp(ev.id); }}>
                                        Eliminar Cita
                                      </DropdownMenuItem>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                </div>
                                <div className="p-4 space-y-4">
                                  <div className="flex gap-3 text-sm">
                                    <div className="mt-0.5 shrink-0"><div className="h-3 w-3 rounded-full border-2 border-[#4361ee]"></div></div>
                                    <div className="flex-1">
                                      <p className="font-bold text-[#2b3674] leading-tight">{ev.patient_name}</p>
                                      <p className="text-[10px] text-[#4361ee] font-medium mt-0.5 cursor-pointer hover:underline">Añadir Descripción</p>
                                    </div>
                                  </div>
                                  <div className="flex gap-3 text-sm">
                                    <Clock className="h-4 w-4 text-[#a3aed1] shrink-0 mt-0.5" />
                                    <div className="flex-1">
                                      <p className="font-bold text-[#2b3674] text-xs">Añadir Hora</p>
                                      <p className="text-[10px] text-[#4361ee] font-medium mt-0.5">
                                        {timeOnly(ev.scheduled_at.replace(" ", "T"))} → {timeOnly(new Date(new Date(ev.scheduled_at.replace(" ", "T")).getTime() + ev.durationHours * 3600000).toISOString())}
                                      </p>
                                    </div>
                                    <button className="text-[#a3aed1]"><Network className="h-4 w-4" /></button>
                                  </div>
                                  <div className="flex gap-3 text-sm">
                                    <Users className="h-4 w-4 text-[#a3aed1] shrink-0 mt-0.5" />
                                    <div className="flex-1">
                                      <p className="font-bold text-[#2b3674] text-xs">Añadir Invitados</p>
                                      <div className="flex items-center gap-1 mt-1">
                                        <img src={`https://api.dicebear.com/7.x/notionists/svg?seed=${ev.patient_name}`} className="h-4 w-4 rounded-full bg-blue-50" />
                                        <p className="text-[9px] text-[#a3aed1] font-bold">1 Asiste, 1 Esperando</p>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                                <div className="p-3 border-t border-border/40 flex justify-end gap-2 bg-gray-50/50 rounded-b-2xl">
                                  <button onClick={() => { setEditingApp(ev); setFormOpen(true); }} className="text-xs font-bold text-[#2b3674] hover:bg-gray-200 px-4 py-2 rounded-xl transition">Editar</button>
                                  <button onClick={() => { setConsultationApp(ev); setConsultationOpen(true); }} className={`text-xs font-bold text-white px-4 py-2 rounded-xl shadow-sm flex items-center gap-1.5 transition ${ev.status?.toLowerCase() === 'completada' ? 'bg-[#05c46b] hover:bg-[#04b060]' : 'bg-[#4361ee] hover:bg-[#3f37c9]'}`}>
                                    <Stethoscope className="h-3.5 w-3.5" /> 
                                    {ev.status?.toLowerCase() === 'completada' ? 'Ver / Editar Consulta' : 'Iniciar Consulta'}
                                  </button>
                                </div>
                              </PopoverContent>
                            </Popover>
                          );
                        })}
                      </div>
                    );
                  })}
                </div>
              </div>
              </>
              )}
            </div>
          </section>
        </div>
      </div>

      {/* Appointment Creation/Editing Form */}
      {formOpen && (
        <AppointmentForm 
          open={formOpen} 
          onOpenChange={setFormOpen}
          initialDate={defaultFormDate}
          appointment={editingApp}
        />
      )}

      {/* Consultation Process Form */}
      {consultationOpen && consultationApp && (
        <ConsultationForm 
          open={consultationOpen} 
          onOpenChange={setConsultationOpen}
          appointment={consultationApp}
        />
      )}
    </>
  );
}

// Inline missing icon
function Users(props: any) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}
