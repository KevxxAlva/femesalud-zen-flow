import { CalendarClock, Users, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { ResponsiveContainer, AreaChart, Area } from "recharts";
import { DashboardStatsSkeleton } from "@/components/ui/dashboard-skeleton";

function Sparkline({ data, tone }: { data: number[]; tone?: string }) {
  const chartData = data.map((val, idx) => ({ id: idx, value: val }));
  let strokeColor = "#8b5caf";
  let fillColor = "#8b5caf";
  if (tone?.includes("sage")) {
    strokeColor = "#87988a";
    fillColor = "#87988a";
  } else if (tone?.includes("blush")) {
    strokeColor = "#e8c5c8";
    fillColor = "#e8c5c8";
  }

  return (
    <div className="h-9 w-24">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData} margin={{ top: 2, right: 2, left: 2, bottom: 2 }}>
          <defs>
            <linearGradient id={`grad-${tone}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={fillColor} stopOpacity={0.4}/>
              <stop offset="95%" stopColor={fillColor} stopOpacity={0.0}/>
            </linearGradient>
          </defs>
          <Area type="monotone" dataKey="value" stroke={strokeColor} fill={`url(#grad-${tone})`} strokeWidth={1.5} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

interface DashboardKPIsProps {
  isStatsLoading: boolean;
  stats: any;
  patientsCount: number;
}

export function DashboardKPIs({ isStatsLoading, stats, patientsCount }: DashboardKPIsProps) {
  if (isStatsLoading) {
    return <DashboardStatsSkeleton />;
  }

  const kpis = [
    { label: "Consultas hoy", value: stats.todays.length.toString(), delta: stats.consultDelta, icon: CalendarClock, tone: "text-mauve", spark: stats.consultSpark },
    { label: "Pacientes totales", value: patientsCount.toString(), delta: stats.patientDelta, icon: Users, tone: "text-blush-foreground", spark: stats.patientSpark },
  ];

  return (
    <>
      {kpis.map((k) => {
        const Icon = k.icon;
        const isPositive = k.delta >= 0;
        const deltaText = isPositive ? `+${k.delta}%` : `${k.delta}%`;
        return (
          <div key={k.label} className="rounded-3xl glass-card p-5 shadow-sm flex-1 flex flex-col justify-between">
            <div className="flex items-start justify-between">
              <div className={cn("flex h-10 w-10 items-center justify-center rounded-2xl bg-muted", k.tone)}>
                <Icon className="h-5 w-5" />
              </div>
              <span className={cn(
                "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium",
                isPositive 
                  ? "bg-sage/40 text-sage-foreground" 
                  : "bg-red-500/10 text-red-500"
              )}>
                {isPositive ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                {deltaText}
              </span>
            </div>
            <div className="mt-4 flex items-end justify-between gap-3">
              <div>
                <p className="text-xs text-muted-foreground">{k.label}</p>
                <p className="font-display text-2xl font-semibold tracking-tight">{k.value}</p>
              </div>
              <Sparkline data={k.spark} tone={k.tone} />
            </div>
          </div>
        );
      })}
    </>
  );
}
