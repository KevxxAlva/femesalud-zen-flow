import { AlertTriangle, RefreshCw, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "@tanstack/react-router";

interface GlobalErrorProps {
  error?: Error;
  resetErrorBoundary?: () => void;
}

export function GlobalError({ error, resetErrorBoundary }: GlobalErrorProps) {
  return (
    <div className="flex min-h-[80vh] w-full flex-col items-center justify-center p-6 text-center animate-in fade-in duration-500">
      <div className="flex h-24 w-24 items-center justify-center rounded-full bg-destructive/10 mb-6 shadow-sm">
        <AlertTriangle className="h-12 w-12 text-destructive" strokeWidth={1.5} />
      </div>
      <h2 className="text-2xl font-bold tracking-tight text-foreground mb-3">
        ¡Vaya! Algo salió mal
      </h2>
      <p className="text-muted-foreground max-w-md mb-8 text-sm leading-relaxed">
        Ocurrió un error inesperado en la aplicación. Puedes intentar recargar la página o volver al inicio. 
        Si el problema persiste, contacta a soporte.
      </p>
      
      {error && (
        <div className="mb-8 w-full max-w-lg rounded-2xl bg-muted/50 p-4 text-left border border-border/50 overflow-hidden">
          <p className="text-xs font-semibold text-destructive uppercase tracking-wider mb-2">Detalles del Error</p>
          <p className="text-xs font-mono text-muted-foreground break-words">
            {error.message || "Error desconocido"}
          </p>
        </div>
      )}

      <div className="flex flex-col sm:flex-row items-center gap-3">
        <Button 
          onClick={() => {
            if (resetErrorBoundary) {
              resetErrorBoundary();
            } else {
              window.location.reload();
            }
          }} 
          className="rounded-2xl px-6 flex items-center gap-2 bg-gradient-to-r from-mauve to-mauve-soft text-primary-foreground shadow-sm shadow-mauve/20 hover:scale-[1.02] transition-transform"
        >
          <RefreshCw className="h-4 w-4" />
          Intentar de nuevo
        </Button>
        <Link to="/" className="w-full sm:w-auto">
          <Button variant="outline" className="w-full rounded-2xl px-6 flex items-center gap-2">
            <Home className="h-4 w-4" />
            Volver al Inicio
          </Button>
        </Link>
      </div>
    </div>
  );
}
