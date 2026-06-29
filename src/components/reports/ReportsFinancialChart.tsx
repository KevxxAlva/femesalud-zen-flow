import { TrendingUp, DollarSign } from "lucide-react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from "recharts";

const MONTHS_ES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
];

interface ReportsFinancialChartProps {
  monthlyData: { month: string; amount: number }[];
  formattedMonthlyData: { name: string; monto: number }[];
}

export function ReportsFinancialChart({ monthlyData, formattedMonthlyData }: ReportsFinancialChartProps) {
  return (
    <>
      <div className="lg:col-span-2 rounded-3xl glass-card p-6 shadow-sm border border-border/40 flex flex-col justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Histórico de Ingresos</p>
          <h3 className="mt-1 text-base font-semibold flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-mauve" /> Evolución de Facturación (Últimos 12 meses)
          </h3>
        </div>

        {monthlyData.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-20">No hay transacciones registradas.</p>
        ) : (
          <div className="h-60 w-full mt-6">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={formattedMonthlyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#888888' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: '#888888' }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${v}`} />
                <Tooltip formatter={(value) => [`$${value.toLocaleString("es-ES")}`, "Ingresos"]} contentStyle={{ borderRadius: "12px", border: "1px solid #e2e8f0" }} />
                <Bar dataKey="monto" fill="url(#colorIncome)" radius={[4, 4, 0, 0]} />
                <defs>
                  <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5caf" stopOpacity="0.85"/>
                    <stop offset="95%" stopColor="#8b5caf" stopOpacity="0.35"/>
                  </linearGradient>
                </defs>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      <div className="lg:col-span-1 rounded-3xl glass-card p-6 shadow-sm border border-border/40">
        <h3 className="text-xs font-bold uppercase tracking-wider text-mauve mb-4 flex items-center gap-1">
          <DollarSign className="h-4 w-4" /> Desglose Mensual
        </h3>
        <div className="overflow-hidden rounded-2xl border border-border/40">
          <table className="w-full text-xs">
            <thead className="bg-muted/40 text-left uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-3 py-2">Mes / Año</th>
                <th className="px-3 py-2 text-right">Monto ($)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {monthlyData.slice().reverse().map((d) => {
                const [yr, mn] = d.month.split("-");
                return (
                  <tr key={d.month} className="hover:bg-muted/20">
                    <td className="px-3 py-2.5 font-medium">{MONTHS_ES[parseInt(mn) - 1]} {yr}</td>
                    <td className="px-3 py-2.5 text-right font-bold text-mauve">${d.amount.toLocaleString("es-ES")}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
