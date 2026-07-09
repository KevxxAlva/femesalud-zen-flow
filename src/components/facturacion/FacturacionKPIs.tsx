import { TrendingUp, Sparkles, Receipt } from "lucide-react";

interface FacturacionKPIsProps {
  metrics: {
    totalEarnings: number;
    pendingEarnings: number;
    completedCount: number;
    pendingCount: number;
  };
}

export function FacturacionKPIs({ metrics }: FacturacionKPIsProps) {
  let performanceTitle = "Sin datos";
  let performanceText = "Comienza a registrar consultas para evaluar tu desempeño financiero.";
  
  const totalPotential = metrics.totalEarnings + metrics.pendingEarnings;
  
  if (totalPotential > 0) {
    const pendingRatio = metrics.pendingEarnings / totalPotential;
    
    if (pendingRatio === 0) {
      performanceTitle = "Perfecto";
      performanceText = "¡Felicidades! Tienes una efectividad de cobranza del 100%.";
    } else if (pendingRatio <= 0.2) {
      performanceTitle = "Excelente";
      performanceText = "Sigue registrando los cobros a tiempo para mantener un flujo de caja saludable.";
    } else if (pendingRatio <= 0.5) {
      performanceTitle = "Bueno";
      performanceText = "Tienes algunas cuentas por cobrar. Intenta hacer seguimiento a los pagos pendientes.";
    } else {
      performanceTitle = "Atención Requerida";
      performanceText = "Gran parte de tus consultas están sin cobrar. Es vital hacer seguimiento para sanear tus finanzas.";
    }
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-fade-in">
      <div className="rounded-3xl glass-card p-6 shadow-sm border border-border/40 relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
          <TrendingUp className="h-24 w-24 text-sage" />
        </div>
        <div className="relative z-10">
          <p className="text-sm font-medium text-muted-foreground flex items-center gap-1">
            <TrendingUp className="h-4 w-4 text-sage" /> Ingresos Totales
          </p>
          <div className="mt-3 flex items-baseline gap-2">
            <h3 className="text-3xl font-bold tracking-tight text-sage-foreground">
              ${metrics.totalEarnings.toLocaleString("es-ES")}
            </h3>
            <span className="text-sm font-medium text-muted-foreground">USD</span>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            De <span className="font-semibold text-foreground">{metrics.completedCount}</span> citas cobradas
          </p>
        </div>
      </div>

      <div className="rounded-3xl glass-card p-6 shadow-sm border border-border/40 relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
          <Receipt className="h-24 w-24 text-amber-500" />
        </div>
        <div className="relative z-10">
          <p className="text-sm font-medium text-muted-foreground flex items-center gap-1">
            <Receipt className="h-4 w-4 text-amber-500" /> Cuentas por Cobrar
          </p>
          <div className="mt-3 flex items-baseline gap-2">
            <h3 className="text-3xl font-bold tracking-tight text-amber-600">
              ${metrics.pendingEarnings.toLocaleString("es-ES")}
            </h3>
            <span className="text-sm font-medium text-muted-foreground">USD</span>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            De <span className="font-semibold text-foreground">{metrics.pendingCount}</span> citas pendientes
          </p>
        </div>
      </div>

      <div className="rounded-3xl bg-gradient-to-br from-mauve/90 to-mauve p-6 shadow-sm text-primary-foreground relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 mix-blend-overlay"></div>
        <div className="relative z-10 flex flex-col h-full justify-between">
          <div>
            <p className="text-sm font-medium text-primary-foreground/80 flex items-center gap-1">
              <Sparkles className="h-4 w-4" /> Desempeño
            </p>
            <h3 className="mt-2 text-2xl font-bold">{performanceTitle}</h3>
          </div>
          <p className="text-xs text-primary-foreground/80 mt-4 leading-relaxed">
            {performanceText}
          </p>
        </div>
      </div>
    </div>
  );
}
