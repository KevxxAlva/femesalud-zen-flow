import { Search, Filter, FileSpreadsheet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { AppointmentWithPatient } from "@/lib/api/appointments";
import { exportMonthlyReport } from "@/lib/pdf/reporte-mensual";

interface FacturacionFiltersProps {
  q: string;
  setQ: (val: string) => void;
  statusFilter: string;
  setStatusFilter: (val: string) => void;
  doctorFilter: string;
  setDoctorFilter: (val: string) => void;
  monthFilter: string;
  setMonthFilter: (val: string) => void;
  doctors: any[];
  monthOptions: { key: string; label: string }[];
  clinic: any;
  appointments: AppointmentWithPatient[];
  metrics: {
    totalEarnings: number;
    pendingEarnings: number;
  };
}

export function FacturacionFilters({
  q, setQ,
  statusFilter, setStatusFilter,
  doctorFilter, setDoctorFilter,
  monthFilter, setMonthFilter,
  doctors,
  monthOptions,
  clinic,
  appointments,
  metrics
}: FacturacionFiltersProps) {
  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div className="flex flex-1 flex-col md:flex-row gap-3">
        <div className="relative flex-1 md:max-w-[300px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por paciente o concepto..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="pl-9 bg-background/50 backdrop-blur-sm border-border/60 rounded-2xl h-10"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground hidden md:block" />
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[140px] bg-background/50 backdrop-blur-sm rounded-2xl h-10 border-border/60">
              <SelectValue placeholder="Estado" />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="todas">Todas</SelectItem>
              <SelectItem value="programada">Pendientes</SelectItem>
              <SelectItem value="completada">Cobros Confirmados</SelectItem>
            </SelectContent>
          </Select>
          <Select value={monthFilter} onValueChange={setMonthFilter}>
            <SelectTrigger className="w-[160px] bg-background/50 backdrop-blur-sm rounded-2xl h-10 border-border/60">
              <SelectValue placeholder="Mes" />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="todos">Todos los meses</SelectItem>
              {monthOptions.map((m) => (
                <SelectItem key={m.key} value={m.key}>{m.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {doctors.length > 0 && (
            <Select value={doctorFilter} onValueChange={setDoctorFilter}>
              <SelectTrigger className="w-[160px] bg-background/50 backdrop-blur-sm rounded-2xl h-10 border-border/60">
                <SelectValue placeholder="Médico" />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                <SelectItem value="todos">Todos los médicos</SelectItem>
                {doctors.map((d) => (
                  <SelectItem key={d.id} value={d.id}>Dr/a. {d.full_name?.split(" ")[0] || d.email?.split("@")[0]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      </div>
      <Button
        variant="outline"
        className="rounded-2xl h-10 gap-2 border-sage text-sage hover:bg-sage/10 cursor-pointer"
        onClick={() => {
          let appsToExport = appointments.filter(a => a.status === "completada" || a.status === "programada");
          let repMonth = new Date().toISOString().substring(0, 7);
          
          if (monthFilter !== "todos") {
            appsToExport = appsToExport.filter(a => a.scheduled_at.startsWith(monthFilter));
            repMonth = monthFilter;
          }
          if (doctorFilter !== "todos") appsToExport = appsToExport.filter(a => a.doctor_id === doctorFilter);
          
          exportMonthlyReport(
            repMonth,
            appsToExport,
            metrics.totalEarnings,
            metrics.pendingEarnings,
            clinic
          );
        }}
      >
        <FileSpreadsheet className="h-4 w-4" />
        Exportar Reporte
      </Button>
    </div>
  );
}
