import { TrendingUp, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from "recharts";
import { DashboardChartSkeleton } from "@/components/ui/dashboard-skeleton";

interface DashboardIncomeChartProps {
  stats: {
    incomeDelta: number;
    thisMonthIncome: number;
    incomeBreakdown: { method: string; amount: number; percentage: number }[];
  };
  isChartLoading: boolean;
}

const PIE_COLORS = ["#6c5c7c", "#b56576", "#2e7d32", "#0284c7", "#d97706"];

export function DashboardIncomeChart({ stats, isChartLoading }: DashboardIncomeChartProps) {
  return (
    <div className="col-span-12 lg:col-span-8 rounded-3xl glass-card p-6 shadow-sm border border-border/40 flex flex-col justify-between">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Distribución Financiera</p>
          <h3 className="mt-1 text-base font-semibold flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-sage-foreground" /> Ingresos del Mes (Métodos de Pago)
          </h3>
        </div>
        <div className="flex items-center gap-2">
          <span className={cn(
            "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold",
            stats.incomeDelta >= 0 
              ? "bg-sage/40 text-sage-foreground" 
              : "bg-red-500/10 text-red-500"
          )}>
            {stats.incomeDelta >= 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
            {stats.incomeDelta >= 0 ? `+${stats.incomeDelta}%` : `${stats.incomeDelta}%`}
          </span>
          <div className="rounded-2xl bg-sage/15 text-sage-foreground border border-sage/20 px-4 py-2 text-sm font-semibold">
            Total: ${stats.thisMonthIncome.toLocaleString("es-ES")} USD
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
        <div className="space-y-4 flex flex-col justify-center">
          {stats.incomeBreakdown.map((d, idx) => {
            const colors = [
              "bg-mauve",
              "bg-blush-foreground",
              "bg-sage-foreground",
              "bg-sky-600",
              "bg-amber-600",
            ];
            const colorClass = colors[idx % colors.length];
            return (
              <div key={d.method} className="space-y-1">
                <div className="flex justify-between text-xs font-semibold">
                  <span>{d.method}</span>
                  <span className="text-muted-foreground">${d.amount.toLocaleString("es-ES")} ({d.percentage}%)</span>
                </div>
                <div className="w-full bg-muted h-2.5 rounded-full overflow-hidden">
                  <div
                    style={{ width: `${d.percentage}%` }}
                    className={cn("h-full rounded-full transition-all duration-500", colorClass)}
                  />
                </div>
              </div>
            );
          })}
          {stats.incomeBreakdown.length === 0 && (
            <p className="text-xs text-muted-foreground text-center py-12">No hay ingresos registrados este mes.</p>
          )}
        </div>

        {isChartLoading ? (
          <DashboardChartSkeleton />
        ) : (
          <div className="mt-6 flex-1 w-full min-h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={stats.incomeBreakdown.map((d) => ({ name: d.method, value: d.amount }))}
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={70}
                  paddingAngle={5}
                  dataKey="value"
                  stroke="none"
                >
                  {stats.incomeBreakdown.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [`$${value.toLocaleString("es-ES")} USD`]} contentStyle={{ borderRadius: "12px", border: "1px solid #e2e8f0" }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
}
