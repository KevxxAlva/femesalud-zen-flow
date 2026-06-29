import { Megaphone } from "lucide-react";
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from "recharts";
import { cn } from "@/lib/utils";

interface ReportsMarketingImpactProps {
  marketingData: { channel: string; count: number; percentage: string }[];
}

export function ReportsMarketingImpact({ marketingData }: ReportsMarketingImpactProps) {
  return (
    <>
      <div className="lg:col-span-2 rounded-3xl glass-card p-6 shadow-sm border border-border/40">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Impacto por Canal de Contacto</p>
          <h3 className="mt-1 text-base font-semibold flex items-center gap-2">
            <Megaphone className="h-5 w-5 text-mauve" /> Desempeño y Canales de Adquisición
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
          <div className="space-y-4">
            {marketingData.map((d, idx) => {
              const colors = [
                "bg-mauve",
                "bg-blush-foreground",
                "bg-sage-foreground",
                "bg-sky-600",
                "bg-amber-600",
              ];
              const colorClass = colors[idx % colors.length];
              return (
                <div key={d.channel} className="space-y-1">
                  <div className="flex justify-between text-xs font-semibold">
                    <span>{d.channel}</span>
                    <span className="text-muted-foreground">{d.count} consultas ({d.percentage}%)</span>
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
            {marketingData.length === 0 && (
              <p className="text-xs text-muted-foreground text-center py-12">No hay datos de canales de marketing disponibles.</p>
            )}
          </div>

          {marketingData.length > 0 && (
            <div className="h-48 flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={marketingData.map((d) => ({ name: d.channel, value: d.count }))}
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={70}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {marketingData.map((entry, index) => {
                      const colors = ["#8b5caf", "#e8c5c8", "#87988a", "#0284c7", "#d97706"];
                      return <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />;
                    })}
                  </Pie>
                  <Tooltip formatter={(value) => [`${value} consultas`]} contentStyle={{ borderRadius: "12px", border: "1px solid #e2e8f0" }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      <div className="lg:col-span-1 rounded-3xl glass-card p-6 shadow-sm border border-border/40">
        <h3 className="text-xs font-bold uppercase tracking-wider text-mauve mb-4 flex items-center gap-1">
          <Megaphone className="h-4 w-4" /> Tabla de Impacto
        </h3>
        <div className="overflow-hidden rounded-2xl border border-border/40">
          <table className="w-full text-xs">
            <thead className="bg-muted/40 text-left uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-3 py-2">Canal</th>
                <th className="px-3 py-2 text-center">Consultas</th>
                <th className="px-3 py-2 text-right">Porcentaje</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {marketingData.map((d) => (
                <tr key={d.channel} className="hover:bg-muted/20">
                  <td className="px-3 py-2.5 font-medium">{d.channel}</td>
                  <td className="px-3 py-2.5 text-center font-bold">{d.count}</td>
                  <td className="px-3 py-2.5 text-right font-bold text-mauve">{d.percentage}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
