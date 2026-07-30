import { useMemo, useState, useEffect } from "react";
import { Link } from "@tanstack/react-router";
import { 
  Search, Bell, Settings, MoreHorizontal, MapPin, Edit2, ChevronDown, ChevronLeft, ChevronRight, Users, CalendarClock, Plus, Check
} from "lucide-react";
import { useAuthSession, useRoles } from "@/hooks/useAuth";
import { useMyProfile, useDoctors } from "@/lib/api/profiles";
import { useAppointments } from "@/lib/api/appointments";
import { useRecentPatients, usePatientsCountByDateRange } from "@/lib/api/patients";
import { useDashboardStats, useMonthlyPayments, useDailyGoals, useAddDailyGoal, useIncrementDailyGoal } from "@/lib/api/dashboard";
import { useClinicInfo } from "@/lib/api/clinic";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { AreaChart, Area, ResponsiveContainer, Tooltip, XAxis, PieChart, Pie, Cell } from "recharts";

function MiniAreaChart({ data, colorVar, gradientId }: { data: number[]; colorVar: string; gradientId: string }) {
  const chartData = useMemo(() => data.map((val, i) => ({ index: i, value: val })), [data]);
  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={chartData}>
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={colorVar} stopOpacity={0.5}/>
            <stop offset="95%" stopColor={colorVar} stopOpacity={0}/>
          </linearGradient>
        </defs>
        <Tooltip 
          cursor={false}
          contentStyle={{ borderRadius: '0.5rem', border: '1px solid var(--color-border)', backgroundColor: 'var(--color-card)', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', padding: '4px 8px', fontSize: '12px', fontWeight: 'bold' }}
          formatter={(value: number) => [value, 'Total']}
          labelFormatter={() => ''}
        />
        <Area type="monotone" dataKey="value" stroke={colorVar} strokeWidth={2.5} fillOpacity={1} fill={`url(#${gradientId})`} />
      </AreaChart>
    </ResponsiveContainer>
  );
}

function DonutChart({ percentage }: { percentage: number }) {
  const data = useMemo(() => [
    { name: "Ocupado", value: percentage },
    { name: "Libre", value: 100 - percentage }
  ], [percentage]);

  return (
    <div className="relative flex items-center justify-center w-[120px] h-[120px]">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <defs>
            <linearGradient id="pieGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="var(--color-primary)" />
              <stop offset="100%" stopColor="var(--color-secondary)" />
            </linearGradient>
          </defs>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={46}
            outerRadius={60}
            startAngle={90}
            endAngle={-270}
            dataKey="value"
            stroke="none"
            cornerRadius={10}
          >
            <Cell fill="url(#pieGradient)" />
            <Cell fill="var(--color-muted)" opacity={0.3} />
          </Pie>
          <Tooltip 
            formatter={(value: number) => [`${value}%`, '']}
            contentStyle={{ borderRadius: '0.5rem', border: '1px solid var(--color-border)', backgroundColor: 'var(--color-card)', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', padding: '4px 8px', fontSize: '12px', fontWeight: 'bold' }}
            itemStyle={{ color: "var(--color-foreground)" }}
          />
        </PieChart>
      </ResponsiveContainer>
      <div className="absolute flex flex-col items-center justify-center pointer-events-none">
        <span className="text-2xl font-display font-bold text-foreground">{percentage}%</span>
        <span className="text-[9px] font-bold text-muted-foreground tracking-wider">OCUPACIÓN</span>
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
  const { data: monthlyData = { total: 0, paymentsByDay: [] } } = useMonthlyPayments();
  const { data: clinic } = useClinicInfo();
  
  // Real data
  const startOfLastMonthStr = useMemo(() => {
    const now = new Date();
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    return startOfLastMonth.toISOString().slice(0, 10);
  }, []);
  const todayStr = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const { data: dailyGoals = [] } = useDailyGoals(todayStr);
  const addDailyGoal = useAddDailyGoal();
  const incrementDailyGoal = useIncrementDailyGoal();
  
  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
  const [newGoalTitle, setNewGoalTitle] = useState("");
  const [newGoalTarget, setNewGoalTarget] = useState(1);

  const handleAddGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGoalTitle.trim() || newGoalTarget < 1) return;
    await addDailyGoal.mutateAsync({
      title: newGoalTitle.trim(),
      target_value: newGoalTarget,
      date: todayStr
    });
    setNewGoalTitle("");
    setNewGoalTarget(1);
    setIsGoalModalOpen(false);
  };

  const { data: appointments = [] } = useAppointments({ from: startOfLastMonthStr });

  const doctorMap = useMemo(() => new Map(doctors.map((d) => [d.id, d.full_name || d.email])), [doctors]);
  
  const today = useMemo(() => new Date(), []);
  
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  
  const selectedDateStr = useMemo(() => {
    return selectedDate.toISOString().slice(0, 10);
  }, [selectedDate]);
  
  const todaysAppointments = useMemo(() => {
    return appointments.filter(a => a.scheduled_at.slice(0, 10) === todayStr)
      .sort((a, b) => a.scheduled_at.localeCompare(b.scheduled_at));
  }, [appointments, todayStr]);

  const selectedDateAppointments = useMemo(() => {
    return appointments.filter(a => a.scheduled_at.slice(0, 10) === selectedDateStr)
      .sort((a, b) => a.scheduled_at.localeCompare(b.scheduled_at));
  }, [appointments, selectedDateStr]);

  const currentWeek = useMemo(() => {
    const days = [];
    const date = new Date(selectedDate);
    // Move to Sunday of selected date's week
    date.setDate(date.getDate() - date.getDay());
    for (let i = 0; i < 7; i++) {
      const fullDate = new Date(date);
      days.push({
        day: date.toLocaleString('es-ES', { weekday: 'short' }).slice(0, 3).replace(/^\w/, c => c.toUpperCase()),
        date: date.getDate(),
        fullDate,
        dateStr: fullDate.toISOString().slice(0, 10),
        active: fullDate.toDateString() === selectedDate.toDateString()
      });
      date.setDate(date.getDate() + 1);
    }
    return days;
  }, [selectedDate]);

  const notifications = useMemo(() => {
    const list = [];
    if (todaysAppointments.length > 0) {
      list.push({
        id: "app-1",
        title: "Citas para Hoy",
        desc: `Tienes ${todaysAppointments.length} cita(s) programadas para hoy.`,
        icon: CalendarClock,
        color: "text-primary",
        bg: "bg-primary/10",
      });
    }
    if (recentPatients.length > 0) {
      list.push({
        id: "pat-1",
        title: "Nuevos Pacientes",
        desc: `${recentPatients.length} paciente(s) registrados recientemente.`,
        icon: Users,
        color: "text-primarymerald-500",
        bg: "bg-emerald-50",
      });
    }
    return list;
  }, [todaysAppointments, recentPatients]);

  const displayName = profile?.full_name?.trim() || user?.email?.split("@")[0] || "Usuario";
  const roleDisplay = roles.includes("admin") ? "Administrador" : "Médico";

  return (
    <div className="min-h-full bg-muted/50 rounded-[2rem] p-4 md:p-8 font-sans text-foreground">
      {/* Header Bar */}
      <header className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <div className="relative w-full max-w-sm flex items-center bg-card rounded-full px-4 py-2.5 shadow-sm">
          <Search className="h-4 w-4 text-muted-foreground shrink-0" />
          <input 
            type="text" 
            placeholder="Search for events, patients etc." 
            className="w-full bg-transparent outline-none pl-3 text-sm placeholder:text-muted-foreground text-foreground"
          />
        </div>
        <div className="flex items-center gap-4">
          <Popover>
            <PopoverTrigger asChild>
              <button className="flex items-center justify-center h-10 w-10 bg-card rounded-full shadow-sm text-primary relative transition hover:bg-muted focus:outline-none">
                <Bell className="h-5 w-5 fill-current" />
                {notifications.length > 0 && (
                  <span className="absolute top-2 right-2 h-2 w-2 bg-destructive/100 rounded-full border border-white"></span>
                )}
              </button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-80 p-0 rounded-[1.5rem] shadow-xl overflow-hidden border-border/40 font-sans">
              <div className="px-4 py-3 bg-primary text-primary-foreground flex justify-between items-center">
                <span className="font-bold text-xs uppercase tracking-wider">Notificaciones</span>
                <span className="text-xs bg-card/20 px-2 py-0.5 rounded-full font-bold">{notifications.length} nuevas</span>
              </div>
              <div className="max-h-[300px] overflow-y-auto p-2 bg-card">
                {notifications.length > 0 ? (
                  notifications.map((n) => {
                    const Icon = n.icon;
                    return (
                      <div key={n.id} className="flex gap-3 p-3 hover:bg-muted/50 rounded-xl transition cursor-default">
                        <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-full", n.bg, n.color)}>
                          <Icon className="h-4 w-4" strokeWidth={2.5} />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-foreground">{n.title}</p>
                          <p className="text-xs text-muted-foreground font-medium">{n.desc}</p>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="p-6 text-center text-sm font-medium text-muted-foreground">
                    No hay notificaciones nuevas
                  </div>
                )}
              </div>
            </PopoverContent>
          </Popover>

          <Link to="/configuracion" className="flex items-center justify-center h-10 w-10 bg-card rounded-full shadow-sm text-muted-foreground transition hover:bg-muted/50 hover:text-primary focus:outline-none">
            <Settings className="h-5 w-5" />
          </Link>
        </div>
      </header>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        
        {/* LEFT COLUMN (Content) */}
        <div className="xl:col-span-8 flex flex-col gap-6">
          
          {/* HERO BANNER */}
          <div className="relative bg-gradient-to-br from-primary to-primary/80 rounded-3xl p-8 overflow-hidden text-primary-foreground shadow-xl shadow-primary/20 flex justify-between items-center h-48 border border-white/10">
            <div className="relative z-10">
              <div className="flex items-center gap-2 bg-black/10 w-max px-3 py-1.5 rounded-full backdrop-blur-md mb-4 border border-white/10 shadow-sm">
                <span className="text-xs font-medium">📅 {today.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })} {today.toLocaleTimeString("en-US", { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
              <h1 className="font-display text-4xl font-bold mb-1 tracking-tight">¡Buen día, {displayName}!</h1>
              <p className="text-primary-foreground/90 font-medium">¡Que tengas un excelente {today.toLocaleDateString("es-ES", { weekday: "long" })}!</p>
            </div>
            
            {/* Abstract Doctor Illustration using CSS/Icons */}
            <div className="absolute right-0 bottom-0 top-0 w-1/2 overflow-hidden hidden md:block">
              {/* Background waves */}
              <div className="absolute inset-0 opacity-20">
                <svg viewBox="0 0 400 200" xmlns="http://www.w3.org/2000/svg" className="h-full w-full">
                  <path fill="currentColor" className="text-card" d="M0,100 C150,200 250,0 400,100 L400,200 L0,200 Z" />
                  <path fill="currentColor" className="text-card" d="M0,50 C150,-50 250,250 400,50 L400,200 L0,200 Z" opacity="0.5"/>
                </svg>
              </div>
              
              {/* Stylized Avatar Placeholder */}
              <div className="absolute bottom-0 right-16 w-32 h-40 bg-card/10 rounded-t-[3rem] border border-white/20 flex flex-col items-center justify-end overflow-hidden">
                <div className="w-16 h-16 bg-[#ffd166] rounded-full mb-2"></div> {/* Head */}
                <div className="w-24 h-24 bg-card rounded-t-full"></div> {/* Coat */}
              </div>
              {/* Floating medical elements */}
              <div className="absolute top-8 right-8 text-primary-foreground/50 text-2xl rotate-12">💊</div>
              <div className="absolute bottom-12 right-4 text-primary-foreground/50 text-2xl -rotate-12">🩺</div>
              <div className="absolute top-16 right-48 text-primary-foreground/50 text-2xl rotate-45">📋</div>
            </div>
          </div>

          {/* 3 WORK CARDS */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Total Patients */}
            <div className="glass-card rounded-[2rem] p-5 shadow-lg shadow-black/5 flex flex-col hover:-translate-y-1 transition-transform duration-300">
              <div className="flex justify-between items-start mb-2">
                <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Pacientes Registrados</h3>
                <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="flex items-end gap-3 mb-1">
                <span className="font-display text-4xl font-bold text-foreground tracking-tight">{totalPatients}</span>
                <span className="text-xs font-medium text-muted-foreground mb-1">en el sistema</span>
              </div>
              <div className="mt-auto pt-4 h-16 w-full -mb-2">
                <MiniAreaChart data={stats?.offlineWork.sparkline || [0, 0, 0, 0, 0, 0, 0]} colorVar="var(--color-primary)" gradientId="colorOffline" />
              </div>
            </div>

            {/* Online Work */}
            <div className="glass-card rounded-[2rem] p-5 shadow-lg shadow-black/5 flex flex-col hover:-translate-y-1 transition-transform duration-300">
              <div className="flex justify-between items-start mb-2">
                <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Citas Online</h3>
                <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="flex items-end gap-3 mb-1">
                <span className="font-display text-4xl font-bold text-foreground tracking-tight">{stats?.onlineWork.total || 0}</span>
                <span className="text-xs font-medium text-muted-foreground mb-1">consultas online</span>
              </div>
              <div>
                <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded", (stats?.onlineWork.change || 0) >= 0 ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" : "bg-destructive/10 text-destructive")}>
                  {(stats?.onlineWork.change || 0) >= 0 ? "+" : ""}{stats?.onlineWork.change || 0}% respecto a ayer
                </span>
              </div>
              <div className="mt-auto pt-4 h-16 w-full -mb-2">
                <MiniAreaChart data={stats?.onlineWork.sparkline || [0, 0, 0, 0, 0, 0, 0]} colorVar="var(--color-secondary)" gradientId="colorOnline" />
              </div>
            </div>

            {/* Monthly Payments */}
            <div className="glass-card rounded-[2rem] p-5 shadow-lg shadow-black/5 flex flex-col hover:-translate-y-1 transition-transform duration-300">
              <div className="flex justify-between items-start mb-2">
                <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Ingresos Mensuales</h3>
                <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="flex items-end gap-3 mb-1">
                <span className="font-display text-4xl font-bold text-foreground tracking-tight">${monthlyData.total.toFixed(2)}</span>
                <span className="text-xs font-medium text-muted-foreground mb-1">este mes</span>
              </div>
              <div className="mt-auto pt-4 h-24 w-full">
                {monthlyData.paymentsByDay.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={monthlyData.paymentsByDay}>
                      <defs>
                        <linearGradient id="colorPayments" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="var(--color-primary)" stopOpacity={0.5}/>
                          <stop offset="95%" stopColor="var(--color-primary)" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <Tooltip 
                        contentStyle={{ borderRadius: '1rem', border: '1px solid var(--color-border)', backgroundColor: 'var(--color-card)', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)' }}
                        formatter={(value: number) => [`$${value.toFixed(2)}`, 'Ingresos']}
                        labelFormatter={(label) => `Día: ${new Date(label).toLocaleDateString()}`}
                      />
                      <Area type="monotone" dataKey="amount" stroke="var(--color-primary)" strokeWidth={2} fillOpacity={1} fill="url(#colorPayments)" />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full w-full bg-muted/20 rounded-xl flex items-center justify-center text-muted-foreground text-xs font-medium">Sin datos de ingresos</div>
                )}
              </div>
            </div>
          </div>

          {/* BOTTOM CARDS ROW */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Scheduled Events */}
            <div className="glass-card rounded-[2rem] p-6 shadow-lg shadow-black/5 flex flex-col">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Mis Eventos Programados</h3>
                <button className="flex items-center gap-1 text-primary font-bold text-xs bg-primary/10 px-3 py-1.5 rounded-lg hover:bg-primary/20 transition">
                  Hoy <ChevronDown className="h-3 w-3" />
                </button>
              </div>
              
              <div className="flex items-center gap-6 mt-2">
                <DonutChart percentage={stats?.scheduledEvents.donutPercentage || 0} />
                
                <div className="flex flex-col gap-4 flex-1">
                  <div>
                    <div className="text-xl font-bold text-foreground font-display">{stats?.scheduledEvents.consultations || 0}</div>
                    <div className="text-[10px] font-bold text-muted-foreground uppercase">Consultas</div>
                  </div>
                  <div>
                    <div className="text-xl font-bold text-foreground font-display">{stats?.scheduledEvents.labs || 0}</div>
                    <div className="text-[10px] font-bold text-muted-foreground uppercase">Análisis de Lab.</div>
                  </div>
                  <div>
                    <div className="text-xl font-bold text-foreground font-display">{stats?.scheduledEvents.invoices || 0}</div>
                    <div className="text-[10px] font-bold text-muted-foreground uppercase">Facturas</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Plans Done */}
            <div className="glass-card rounded-[2rem] p-6 shadow-lg shadow-black/5 flex flex-col">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Mis Metas de Hoy</h3>
                <button className="flex items-center gap-1 text-primary font-bold text-xs bg-primary/10 px-3 py-1.5 rounded-lg hover:bg-primary/20 transition">
                  Hoy <ChevronDown className="h-3 w-3" />
                </button>
              </div>

              <div className="space-y-5 flex-1">
                {/* Progress 1 */}
                <div>
                  <div className="flex justify-between text-xs font-bold mb-2">
                    <span className="text-foreground">Consultas</span>
                    <span className="text-foreground">{stats?.plansDone.consultations || 0}%</span>
                  </div>
                  <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-primary rounded-full transition-all duration-500" style={{ width: `${stats?.plansDone.consultations || 0}%` }}></div>
                  </div>
                </div>
                {/* Progress 2 */}
                <div>
                  <div className="flex justify-between text-xs font-bold mb-2">
                    <span className="text-foreground">Análisis</span>
                    <span className="text-foreground">{stats?.plansDone.labs || 0}%</span>
                  </div>
                  <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-secondary rounded-full transition-all duration-500" style={{ width: `${stats?.plansDone.labs || 0}%` }}></div>
                  </div>
                </div>
                {/* Progress 3 */}
                <div>
                  <div className="flex justify-between text-xs font-bold mb-2">
                    <span className="text-foreground">Facturas Pagadas</span>
                    <span className="text-foreground">{stats?.plansDone.invoices || 0}%</span>
                  </div>
                  <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-foreground/50 rounded-full transition-all duration-500" style={{ width: `${stats?.plansDone.invoices || 0}%` }}></div>
                  </div>
                </div>

                {/* Custom Daily Goals */}
                {dailyGoals.map(goal => {
                  const percentage = Math.min(Math.round((goal.current_value / goal.target_value) * 100), 100);
                  const isComplete = goal.current_value >= goal.target_value;
                  return (
                    <div key={goal.id}>
                      <div className="flex justify-between text-xs font-bold mb-2">
                        <span className="text-foreground flex items-center gap-2">
                          {goal.title}
                          {isComplete && <Check className="h-3 w-3 text-emerald-500" />}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="text-foreground">{percentage}%</span>
                          {!isComplete && (
                            <button 
                              onClick={() => incrementDailyGoal.mutate({ id: goal.id, currentValue: goal.current_value, date: goal.date })}
                              className="bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded hover:bg-emerald-500/30 w-5 h-5 flex items-center justify-center transition disabled:opacity-50"
                              disabled={incrementDailyGoal.isPending}
                            >
                              <Plus className="h-3 w-3" />
                            </button>
                          )}
                        </div>
                      </div>
                      <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-emerald-500 rounded-full transition-all duration-500" style={{ width: `${percentage}%` }}></div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <Dialog open={isGoalModalOpen} onOpenChange={setIsGoalModalOpen}>
                <DialogTrigger asChild>
                  <button className="mt-6 w-full py-2.5 border-2 border-dashed border-border text-muted-foreground font-bold text-xs rounded-xl hover:bg-muted transition flex items-center justify-center gap-2">
                    <Plus className="h-4 w-4" /> Añadir meta
                  </button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Nueva meta de hoy</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleAddGoal} className="space-y-4 pt-4">
                    <div className="space-y-2">
                      <Label>¿Qué quieres lograr hoy?</Label>
                      <Input 
                        placeholder="Ej: Entregar presupuestos" 
                        value={newGoalTitle}
                        onChange={(e) => setNewGoalTitle(e.target.value)}
                        autoFocus
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Cantidad objetivo</Label>
                      <Input 
                        type="number" 
                        min={1} 
                        value={newGoalTarget}
                        onChange={(e) => setNewGoalTarget(parseInt(e.target.value) || 1)}
                      />
                    </div>
                    <button type="submit" disabled={addDailyGoal.isPending || !newGoalTitle.trim()} className="w-full py-2.5 bg-primary text-primary-foreground font-bold rounded-xl mt-2 disabled:opacity-50">
                      Guardar Meta
                    </button>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN (Sidebar Profile & Calendar) */}
        <div className="xl:col-span-4 flex flex-col gap-6">
          
          {/* PROFILE CARD */}
          <div className="glass-card rounded-[2rem] overflow-hidden shadow-lg shadow-black/5 relative pt-16">
            <div className="absolute top-0 left-0 right-0 h-24 bg-gradient-to-r from-primary to-primary/90 px-6 py-4 flex justify-between items-start text-primary-foreground border-b border-primary/20">
              <span className="text-xs font-bold tracking-widest uppercase">Mi Perfil</span>
              <Link to="/configuracion" className="bg-black/10 p-1.5 rounded-lg hover:bg-black/20 transition">
                <Edit2 className="h-3 w-3" />
              </Link>
            </div>
            
            <div className="px-6 pb-6 relative">
              <div className="h-20 w-20 bg-card border-4 border-card rounded-2xl mx-auto -mt-10 mb-3 overflow-hidden flex items-center justify-center relative z-10 shadow-md">
                 <img src={`https://api.dicebear.com/7.x/notionists/svg?seed=${displayName}`} alt="Avatar" className="h-full w-full object-cover bg-primary/5" />
              </div>
              
              <div className="text-center mb-6">
                <h2 className="text-lg font-display font-bold text-foreground">{displayName}</h2>
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2">{profile?.specialty || roleDisplay}</p>
                <div className="flex items-center justify-center gap-1 text-xs text-primary font-bold">
                  <MapPin className="h-3 w-3" /> {clinic?.name || "Clínica"}
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-2 text-center pt-4 border-t border-border/40">
                <div>
                  <p className="text-[9px] text-muted-foreground font-bold mb-1 uppercase tracking-wider">Status</p>
                  <p className="text-xs font-bold text-emerald-500 dark:text-emerald-400">Activo</p>
                </div>
                <div>
                  <p className="text-[9px] text-muted-foreground font-bold mb-1 uppercase tracking-wider">MPPS</p>
                  <p className="text-xs font-bold text-foreground font-mono">{profile?.mpps || "N/A"}</p>
                </div>
                <div>
                  <p className="text-[9px] text-muted-foreground font-bold mb-1 uppercase tracking-wider">Rol</p>
                  <p className="text-xs font-bold text-foreground capitalize">{roleDisplay}</p>
                </div>
              </div>
            </div>
          </div>

          {/* CALENDAR & SCHEDULE WIDGET */}
          <div className="glass-card rounded-[2rem] overflow-hidden shadow-lg shadow-black/5 flex-1 flex flex-col">
            
            {/* Calendar Header */}
            <div className="flex justify-between items-center bg-gradient-to-r from-primary to-primary/90 text-primary-foreground px-6 py-4 border-b border-primary/20">
              <span className="text-xs font-bold uppercase tracking-widest">Mi Calendario</span>
              <div className="flex items-center gap-1.5">
                <button 
                  onClick={() => {
                    const prev = new Date(selectedDate);
                    prev.setDate(prev.getDate() - 7);
                    setSelectedDate(prev);
                  }}
                  className="p-1 hover:bg-black/20 rounded-lg transition cursor-pointer"
                  title="Semana anterior"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button 
                  onClick={() => setSelectedDate(new Date())}
                  className="bg-black/10 px-2.5 py-1 rounded-lg text-xs font-bold hover:bg-black/20 transition capitalize cursor-pointer"
                >
                  {selectedDate.toLocaleString("es-ES", { month: "long" })} {selectedDate.getFullYear()}
                </button>
                <button 
                  onClick={() => {
                    const next = new Date(selectedDate);
                    next.setDate(next.getDate() + 7);
                    setSelectedDate(next);
                  }}
                  className="p-1 hover:bg-black/20 rounded-lg transition cursor-pointer"
                  title="Semana siguiente"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
            
            {/* Calendar Grid (Interactive Row of Days) */}
            <div className="bg-muted px-4 py-4 border-b border-border/40">
              <div className="flex justify-between items-center gap-1">
                {currentWeek.map((d) => (
                  <button 
                    key={d.dateStr}
                    onClick={() => setSelectedDate(d.fullDate)}
                    className={cn(
                      "flex flex-col items-center justify-center w-12 py-2 rounded-[1rem] transition-all cursor-pointer hover:scale-105",
                      d.active 
                        ? "bg-primary text-primary-foreground shadow-md font-bold" 
                        : "text-muted-foreground bg-transparent hover:bg-background/60 hover:text-foreground"
                    )}
                  >
                    <span className="text-[10px] font-bold mb-1">{d.day}</span>
                    <span className={cn(
                      "text-sm font-bold",
                      d.active ? "text-primary-foreground" : "text-foreground"
                    )}>{d.date}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Timeline for Selected Date */}
            <div className="px-6 py-4 flex-1 flex flex-col">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                  <span>{selectedDate.toLocaleString("es-ES", { month: "long", day: "numeric", year: "numeric" }).toUpperCase()}</span>
                  {selectedDate.toDateString() === today.toDateString() && (
                    <span className="bg-primary/20 text-primary text-[10px] px-2 py-0.5 rounded-full font-extrabold">HOY</span>
                  )}
                </h3>
                <span className="text-xs text-muted-foreground font-semibold">
                  {selectedDateAppointments.length} cita(s)
                </span>
              </div>

              <div className="flex flex-col flex-1">
                {selectedDateAppointments.length > 0 ? (
                  selectedDateAppointments.map((app, i) => {
                    const d = new Date(app.scheduled_at);
                    const time = d.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" });
                    const isEven = i % 2 === 0;
                    const dotColor = isEven ? "var(--color-primary)" : "var(--color-secondary)";
                    return (
                      <div key={app.id} className="relative flex flex-col pt-2 pb-4 border-b border-dashed border-border/40 last:border-0 hover:bg-muted/30 transition-colors -mx-4 px-4 rounded-xl">
                        <div className="flex items-center gap-3 text-xs font-bold">
                          <span className="w-14 text-left text-muted-foreground font-medium">{time}</span>
                          <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: dotColor }} />
                          <span className="text-foreground truncate flex-1">Consulta con {app.patient_name}</span>
                          <span className={cn(
                            "px-2 py-0.5 rounded text-[10px] uppercase font-bold",
                            app.status === "completada" ? "bg-emerald-500/10 text-emerald-600" :
                            app.status === "cancelada" ? "bg-destructive/10 text-destructive" :
                            "bg-primary/10 text-primary"
                          )}>
                            {app.status}
                          </span>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="flex flex-col items-center justify-center py-10 text-center opacity-60">
                    <CalendarClock className="h-10 w-10 text-muted-foreground mb-2" />
                    <p className="text-sm font-bold text-foreground">Sin eventos para este día</p>
                    <p className="text-xs text-muted-foreground font-medium">No hay citas programadas para esta fecha</p>
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
