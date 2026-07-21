import { useMemo, useState, useEffect } from "react";
import { Link } from "@tanstack/react-router";
import { 
  Search, Bell, Settings, MoreHorizontal, MapPin, Edit2, ChevronDown, Users, CalendarClock
} from "lucide-react";
import { useAuthSession, useRoles } from "@/hooks/useAuth";
import { useMyProfile, useDoctors } from "@/lib/api/profiles";
import { useAppointments } from "@/lib/api/appointments";
import { useRecentPatients, usePatientsCountByDateRange } from "@/lib/api/patients";
import { useDashboardStats, useMonthlyPayments } from "@/lib/api/dashboard";
import { useClinicInfo } from "@/lib/api/clinic";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

function Sparkline({ data, colorClass }: { data: number[]; colorClass: string }) {
  const w = 100, h = 30;
  const max = Math.max(...data, 1);
  const min = Math.min(...data);
  const range = max - min || 1;
  const pts = data.map((v, i) => `${(i / Math.max(data.length - 1, 1)) * w},${h - ((v - min) / range) * h}`).join(" ");
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className={cn("h-10 w-full mt-2", colorClass)} preserveAspectRatio="none">
      <polyline points={pts} fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function DonutChart({ percentage }: { percentage: number }) {
  const radius = 36;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className="relative flex items-center justify-center">
      <svg width="120" height="120" className="transform -rotate-90">
        {/* Background track */}
        <circle cx="60" cy="60" r={radius} stroke="#f0f2f5" strokeWidth="12" fill="none" />
        
        {/* Colored Segments to mimic the image (Pink, Purple, Cyan) */}
        {/* For simplicity, we use a single gradient or solid color, but the image has multi-colored segments */}
        <circle 
          cx="60" cy="60" r={radius} 
          stroke="url(#gradient)" 
          strokeWidth="12" 
          fill="none" 
          strokeDasharray={circumference} 
          strokeDashoffset={strokeDashoffset} 
          strokeLinecap="round" 
        />
        <defs>
          <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ff4b82" />
            <stop offset="50%" stopColor="#9a55ff" />
            <stop offset="100%" stopColor="#00e1f2" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute flex flex-col items-center justify-center">
        <span className="text-2xl font-bold text-[#2b3674]">{percentage}%</span>
        <span className="text-[9px] font-bold text-[#a3aed1] tracking-wider">OCUPACIÓN</span>
      </div>
    </div>
  );
}

export function Dashboard() {
  const { user } = useAuthSession();
  const { data: roles = [] } = useRoles();
  const { data: profile } = useMyProfile(user?.id);
  const { data: doctors = [] } = useDoctors();
  const { data: recentPatients = [] } = useRecentPatients(5);
  const { data: totalPatients = 0 } = usePatientsCountByDateRange();
  const { data: stats } = useDashboardStats();
  const { data: monthlyPayments = 0 } = useMonthlyPayments();
  const { data: clinic } = useClinicInfo();
  
  // Real data
  const startOfLastMonthStr = useMemo(() => {
    const now = new Date();
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    return startOfLastMonth.toISOString().slice(0, 10);
  }, []);
  const { data: appointments = [] } = useAppointments({ from: startOfLastMonthStr });

  const doctorMap = useMemo(() => new Map(doctors.map((d) => [d.id, d.full_name || d.email])), [doctors]);
  
  const today = new Date();
  const todayStr = today.toISOString().slice(0, 10);
  
  const todaysAppointments = useMemo(() => {
    return appointments.filter(a => a.scheduled_at.slice(0, 10) === todayStr)
      .sort((a, b) => a.scheduled_at.localeCompare(b.scheduled_at));
  }, [appointments, todayStr]);

  const currentWeek = useMemo(() => {
    const days = [];
    const date = new Date(today);
    // Move to Sunday of current week
    date.setDate(date.getDate() - date.getDay());
    for (let i = 0; i < 7; i++) {
      days.push({
        day: date.toLocaleString('es-ES', { weekday: 'short' }).slice(0, 3).replace(/^\w/, c => c.toUpperCase()),
        date: date.getDate(),
        active: date.toDateString() === today.toDateString()
      });
      date.setDate(date.getDate() + 1);
    }
    return days;
  }, [todayStr]);

  const notifications = useMemo(() => {
    const list = [];
    if (todaysAppointments.length > 0) {
      list.push({
        id: "app-1",
        title: "Citas para Hoy",
        desc: `Tienes ${todaysAppointments.length} cita(s) programadas para hoy.`,
        icon: CalendarClock,
        color: "text-blue-500",
        bg: "bg-blue-50",
      });
    }
    if (recentPatients.length > 0) {
      list.push({
        id: "pat-1",
        title: "Nuevos Pacientes",
        desc: `${recentPatients.length} paciente(s) registrados recientemente.`,
        icon: Users,
        color: "text-emerald-500",
        bg: "bg-emerald-50",
      });
    }
    return list;
  }, [todaysAppointments, recentPatients]);

  const displayName = profile?.full_name?.trim() || user?.email?.split("@")[0] || "Usuario";
  const roleDisplay = roles.includes("admin") ? "Administrador" : "Médico";

  return (
    <div className="min-h-full bg-[#f4f7fe] rounded-[2rem] p-4 md:p-8 font-sans text-[#2b3674]">
      {/* Header Bar */}
      <header className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <div className="relative w-full max-w-sm flex items-center bg-white rounded-full px-4 py-2.5 shadow-sm">
          <Search className="h-4 w-4 text-[#a3aed1] shrink-0" />
          <input 
            type="text" 
            placeholder="Search for events, patients etc." 
            className="w-full bg-transparent outline-none pl-3 text-sm placeholder:text-[#a3aed1] text-[#2b3674]"
          />
        </div>
        <div className="flex items-center gap-4">
          <Popover>
            <PopoverTrigger asChild>
              <button className="flex items-center justify-center h-10 w-10 bg-white rounded-full shadow-sm text-[#4361ee] relative transition hover:bg-gray-50 focus:outline-none">
                <Bell className="h-5 w-5 fill-current" />
                {notifications.length > 0 && (
                  <span className="absolute top-2 right-2 h-2 w-2 bg-red-500 rounded-full border border-white"></span>
                )}
              </button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-80 p-0 rounded-[1.5rem] shadow-xl overflow-hidden border-[#f0f2f5] font-sans">
              <div className="px-4 py-3 bg-[#4361ee] text-white flex justify-between items-center">
                <span className="font-bold text-xs uppercase tracking-wider">Notificaciones</span>
                <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full font-bold">{notifications.length} nuevas</span>
              </div>
              <div className="max-h-[300px] overflow-y-auto p-2 bg-white">
                {notifications.length > 0 ? (
                  notifications.map((n) => {
                    const Icon = n.icon;
                    return (
                      <div key={n.id} className="flex gap-3 p-3 hover:bg-[#f4f7fe] rounded-xl transition cursor-default">
                        <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-full", n.bg, n.color)}>
                          <Icon className="h-4 w-4" strokeWidth={2.5} />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-[#2b3674]">{n.title}</p>
                          <p className="text-xs text-[#a3aed1] font-medium">{n.desc}</p>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="p-6 text-center text-sm font-medium text-[#a3aed1]">
                    No hay notificaciones nuevas
                  </div>
                )}
              </div>
            </PopoverContent>
          </Popover>

          <Link to="/configuracion" className="flex items-center justify-center h-10 w-10 bg-white rounded-full shadow-sm text-[#a3aed1] transition hover:bg-[#f4f7fe] hover:text-[#4361ee] focus:outline-none">
            <Settings className="h-5 w-5" />
          </Link>
        </div>
      </header>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        
        {/* LEFT COLUMN (Content) */}
        <div className="xl:col-span-8 flex flex-col gap-6">
          
          {/* HERO BANNER */}
          <div className="relative bg-[#4361ee] rounded-3xl p-8 overflow-hidden text-white shadow-lg flex justify-between items-center h-48">
            <div className="relative z-10">
              <div className="flex items-center gap-2 bg-white/20 w-max px-3 py-1.5 rounded-full backdrop-blur-sm mb-4">
                <span className="text-xs font-medium">📅 {today.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })} {today.toLocaleTimeString("en-US", { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
              <h1 className="text-3xl font-bold mb-1">¡Buen día, {displayName}!</h1>
              <p className="text-white/80 font-medium">¡Que tengas un excelente {today.toLocaleDateString("es-ES", { weekday: "long" })}!</p>
            </div>
            
            {/* Abstract Doctor Illustration using CSS/Icons */}
            <div className="absolute right-0 bottom-0 top-0 w-1/2 overflow-hidden hidden md:block">
              {/* Background waves */}
              <div className="absolute inset-0 opacity-20">
                <svg viewBox="0 0 400 200" xmlns="http://www.w3.org/2000/svg" className="h-full w-full">
                  <path fill="#ffffff" d="M0,100 C150,200 250,0 400,100 L400,200 L0,200 Z" />
                  <path fill="#ffffff" d="M0,50 C150,-50 250,250 400,50 L400,200 L0,200 Z" opacity="0.5"/>
                </svg>
              </div>
              
              {/* Stylized Avatar Placeholder */}
              <div className="absolute bottom-0 right-16 w-32 h-40 bg-white/10 rounded-t-[3rem] border border-white/20 flex flex-col items-center justify-end overflow-hidden">
                <div className="w-16 h-16 bg-[#ffd166] rounded-full mb-2"></div> {/* Head */}
                <div className="w-24 h-24 bg-white rounded-t-full"></div> {/* Coat */}
              </div>
              {/* Floating medical elements */}
              <div className="absolute top-8 right-8 text-white/50 text-2xl rotate-12">💊</div>
              <div className="absolute bottom-12 right-4 text-white/50 text-2xl -rotate-12">🩺</div>
              <div className="absolute top-16 right-48 text-white/50 text-2xl rotate-45">📋</div>
            </div>
          </div>

          {/* 3 WORK CARDS */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Total Patients */}
            <div className="bg-white rounded-[2rem] p-5 shadow-sm flex flex-col">
              <div className="flex justify-between items-start mb-2">
                <h3 className="text-[10px] font-bold text-[#a3aed1] uppercase tracking-wider">Pacientes Registrados</h3>
                <MoreHorizontal className="h-4 w-4 text-[#a3aed1]" />
              </div>
              <div className="flex items-end gap-3 mb-1">
                <span className="text-3xl font-bold text-[#2b3674]">{totalPatients}</span>
                <span className="text-xs font-medium text-[#a3aed1] mb-1">en el sistema</span>
              </div>
              <div className="mt-auto pt-4">
                <Sparkline data={stats?.offlineWork.sparkline || [0, 0, 0, 0, 0, 0, 0]} colorClass="text-[#4361ee]" />
              </div>
            </div>

            {/* Online Work */}
            <div className="bg-white rounded-[2rem] p-5 shadow-sm flex flex-col">
              <div className="flex justify-between items-start mb-2">
                <h3 className="text-[10px] font-bold text-[#a3aed1] uppercase tracking-wider">Citas Online</h3>
                <MoreHorizontal className="h-4 w-4 text-[#a3aed1]" />
              </div>
              <div className="flex items-end gap-3 mb-1">
                <span className="text-3xl font-bold text-[#2b3674]">{stats?.onlineWork.total || 0}</span>
                <span className="text-xs font-medium text-[#a3aed1] mb-1">consultas online</span>
              </div>
              <div>
                <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded", (stats?.onlineWork.change || 0) >= 0 ? "bg-[#e6fff2] text-[#05c46b]" : "bg-[#ffe6e6] text-[#ff4b82]")}>
                  {(stats?.onlineWork.change || 0) >= 0 ? "+" : ""}{stats?.onlineWork.change || 0}% respecto a ayer
                </span>
              </div>
              <div className="mt-auto pt-4">
                <Sparkline data={stats?.onlineWork.sparkline || [0, 0, 0, 0, 0, 0, 0]} colorClass="text-[#05c46b]" />
              </div>
            </div>

            {/* Monthly Payments */}
            <div className="bg-white rounded-[2rem] p-5 shadow-sm flex flex-col">
              <div className="flex justify-between items-start mb-2">
                <h3 className="text-[10px] font-bold text-[#a3aed1] uppercase tracking-wider">Ingresos Mensuales</h3>
                <MoreHorizontal className="h-4 w-4 text-[#a3aed1]" />
              </div>
              <div className="flex items-end gap-3 mb-1">
                <span className="text-3xl font-bold text-[#2b3674]">${monthlyPayments.toFixed(2)}</span>
                <span className="text-xs font-medium text-[#a3aed1] mb-1">este mes</span>
              </div>
              <div className="mt-auto pt-4">
                <div className="h-0.5 w-full bg-[#4361ee] rounded-full opacity-50"></div>
              </div>
            </div>
          </div>

          {/* BOTTOM CARDS ROW */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Scheduled Events */}
            <div className="bg-white rounded-[2rem] p-6 shadow-sm flex flex-col">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xs font-bold text-[#a3aed1] uppercase tracking-wider">Mis Eventos Programados</h3>
                <button className="flex items-center gap-1 text-[#4361ee] font-bold text-xs bg-[#f4f7fe] px-3 py-1.5 rounded-lg">
                  Hoy <ChevronDown className="h-3 w-3" />
                </button>
              </div>
              
              <div className="flex items-center gap-6 mt-2">
                <DonutChart percentage={stats?.scheduledEvents.donutPercentage || 0} />
                
                <div className="flex flex-col gap-4 flex-1">
                  <div>
                    <div className="text-xl font-bold text-[#2b3674]">{stats?.scheduledEvents.consultations || 0}</div>
                    <div className="text-[10px] font-bold text-[#a3aed1]">Consultas</div>
                  </div>
                  <div>
                    <div className="text-xl font-bold text-[#2b3674]">{stats?.scheduledEvents.labs || 0}</div>
                    <div className="text-[10px] font-bold text-[#a3aed1]">Análisis de Lab.</div>
                  </div>
                  <div>
                    <div className="text-xl font-bold text-[#2b3674]">{stats?.scheduledEvents.invoices || 0}</div>
                    <div className="text-[10px] font-bold text-[#a3aed1]">Facturas</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Plans Done */}
            <div className="bg-white rounded-[2rem] p-6 shadow-sm flex flex-col">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xs font-bold text-[#a3aed1] uppercase tracking-wider">Mis Metas de Hoy</h3>
                <button className="flex items-center gap-1 text-[#4361ee] font-bold text-xs bg-[#f4f7fe] px-3 py-1.5 rounded-lg">
                  Hoy <ChevronDown className="h-3 w-3" />
                </button>
              </div>

              <div className="space-y-5 flex-1">
                {/* Progress 1 */}
                <div>
                  <div className="flex justify-between text-xs font-bold mb-2">
                    <span className="text-[#2b3674]">Consultas</span>
                    <span className="text-[#2b3674]">{stats?.plansDone.consultations || 0}%</span>
                  </div>
                  <div className="h-2 w-full bg-[#f0f2f5] rounded-full overflow-hidden">
                    <div className="h-full bg-[#9a55ff] rounded-full transition-all duration-500" style={{ width: `${stats?.plansDone.consultations || 0}%` }}></div>
                  </div>
                </div>
                {/* Progress 2 */}
                <div>
                  <div className="flex justify-between text-xs font-bold mb-2">
                    <span className="text-[#2b3674]">Análisis</span>
                    <span className="text-[#2b3674]">{stats?.plansDone.labs || 0}%</span>
                  </div>
                  <div className="h-2 w-full bg-[#f0f2f5] rounded-full overflow-hidden">
                    <div className="h-full bg-[#ff7f50] rounded-full transition-all duration-500" style={{ width: `${stats?.plansDone.labs || 0}%` }}></div>
                  </div>
                </div>
                {/* Progress 3 */}
                <div>
                  <div className="flex justify-between text-xs font-bold mb-2">
                    <span className="text-[#2b3674]">Facturas Pagadas</span>
                    <span className="text-[#2b3674]">{stats?.plansDone.invoices || 0}%</span>
                  </div>
                  <div className="h-2 w-full bg-[#f0f2f5] rounded-full overflow-hidden">
                    <div className="h-full bg-[#ff4b82] rounded-full transition-all duration-500" style={{ width: `${stats?.plansDone.invoices || 0}%` }}></div>
                  </div>
                </div>
              </div>

              <button className="mt-6 w-full py-2.5 border-2 border-dashed border-[#d1d5db] text-[#a3aed1] font-bold text-xs rounded-xl hover:bg-gray-50 transition">
                Añadir meta +
              </button>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN (Sidebar Profile & Calendar) */}
        <div className="xl:col-span-4 flex flex-col gap-6">
          
          {/* PROFILE CARD */}
          <div className="bg-white rounded-[2rem] overflow-hidden shadow-sm relative pt-16">
            <div className="absolute top-0 left-0 right-0 h-24 bg-[#4361ee] px-6 py-4 flex justify-between items-start text-white">
              <span className="text-xs font-bold tracking-widest uppercase">Mi Perfil</span>
              <Link to="/configuracion" className="bg-white/20 p-1.5 rounded-lg hover:bg-white/40 transition">
                <Edit2 className="h-3 w-3" />
              </Link>
            </div>
            
            <div className="px-6 pb-6 relative">
              <div className="h-20 w-20 bg-gray-200 border-4 border-white rounded-2xl mx-auto -mt-10 mb-3 overflow-hidden flex items-center justify-center relative z-10 shadow-sm">
                 <img src={`https://api.dicebear.com/7.x/notionists/svg?seed=${displayName}`} alt="Avatar" className="h-full w-full object-cover bg-blue-50" />
              </div>
              
              <div className="text-center mb-6">
                <h2 className="text-lg font-bold text-[#2b3674]">{displayName}</h2>
                <p className="text-[10px] font-bold text-[#a3aed1] uppercase tracking-wider mb-2">{profile?.specialty || roleDisplay}</p>
                <div className="flex items-center justify-center gap-1 text-xs text-[#8e98bc] font-medium">
                  <MapPin className="h-3 w-3" /> {clinic?.name || "Clínica"}
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-2 text-center pt-4 border-t border-[#f0f2f5]">
                <div>
                  <p className="text-[9px] text-[#a3aed1] font-bold mb-1">Status</p>
                  <p className="text-xs font-bold text-[#05c46b]">Activo</p>
                </div>
                <div>
                  <p className="text-[9px] text-[#a3aed1] font-bold mb-1">MPPS</p>
                  <p className="text-xs font-bold text-[#2b3674]">{profile?.mpps || "N/A"}</p>
                </div>
                <div>
                  <p className="text-[9px] text-[#a3aed1] font-bold mb-1">Rol</p>
                  <p className="text-xs font-bold text-[#2b3674] capitalize">{roleDisplay}</p>
                </div>
              </div>
            </div>
          </div>

          {/* CALENDAR & SCHEDULE WIDGET */}
          <div className="bg-white rounded-[2rem] overflow-hidden shadow-sm flex-1 flex flex-col">
            
            {/* Calendar Header */}
            <div className="flex justify-between items-center bg-[#4361ee] text-white px-6 py-4">
              <span className="text-xs font-bold uppercase tracking-widest">Mi Calendario</span>
              <button className="flex items-center gap-1 bg-white/20 px-3 py-1.5 rounded-lg text-xs font-bold">
                {today.toLocaleString("es-ES", { month: "long" })} <ChevronDown className="h-3 w-3" />
              </button>
            </div>
            
            {/* Simple CSS Calendar Grid (One Row style with pill) */}
            <div className="bg-[#f8f9fe] px-6 py-4 border-b border-[#f0f2f5]">
              <div className="flex justify-between items-center">
                {currentWeek.map((d) => (
                  <div 
                    key={d.day + d.date} 
                    className={cn(
                      "flex flex-col items-center justify-center w-12 py-2 rounded-[1rem]",
                      d.active ? "bg-[#4361ee] text-white shadow-md" : "text-[#a3aed1] bg-transparent"
                    )}
                  >
                    <span className="text-[10px] font-bold mb-1">{d.day}</span>
                    <span className={cn(
                      "text-sm font-bold",
                      d.active ? "text-white" : "text-[#2b3674]"
                    )}>{d.date}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Timeline */}
            <div className="px-6 py-4 flex-1 flex flex-col">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-[10px] font-bold text-[#a3aed1] uppercase tracking-wider">
                  {today.toLocaleString("es-ES", { month: "long" }).toUpperCase()}, {today.getDate()}
                </h3>
                <MoreHorizontal className="h-4 w-4 text-[#a3aed1]" />
              </div>

              <div className="flex flex-col flex-1">
                {todaysAppointments.length > 0 ? (
                  todaysAppointments.map((app, i) => {
                    const d = new Date(app.scheduled_at);
                    const time = d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }).toLowerCase();
                    const colors = ["#ff4b82", "#9a55ff", "#05c46b", "#4361ee"];
                    const dotColor = colors[i % colors.length];
                    return (
                      <div key={app.id} className="relative flex flex-col pt-1 pb-4 border-b border-dashed border-[#e2e8f0] last:border-0">
                        <div className="flex items-center gap-3 text-xs font-bold">
                          <span className="w-12 text-left text-[#a3aed1] font-medium">{time}</span>
                          <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: dotColor }} />
                          <span className="text-[#2b3674] truncate flex-1">Consulta con {app.patient_name}</span>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="flex flex-col items-center justify-center py-10 text-center opacity-60">
                    <CalendarClock className="h-10 w-10 text-[#a3aed1] mb-2" />
                    <p className="text-sm font-bold text-[#2b3674]">Sin eventos para hoy</p>
                    <p className="text-xs text-[#a3aed1] font-medium">No tienes citas programadas</p>
                  </div>
                )}
              </div>
            </div>

          </div>

        </div>
      </div>
    </div>
  );
}
