import type { LucideIcon } from "lucide-react";
import { Sparkles } from "lucide-react";

export function ModulePlaceholder({
  title,
  description,
  icon: Icon,
}: {
  title: string;
  description: string;
  icon: LucideIcon;
}) {
  return (
    <div className="space-y-6">
      <header>
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Módulo
        </p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">{title}</h1>
      </header>

      <div className="relative overflow-hidden rounded-3xl glass-card p-10 shadow-sm">
        <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-mauve/15 blur-3xl" />
        <div className="absolute -bottom-16 left-10 h-48 w-48 rounded-full bg-blush/40 blur-3xl" />
        <div className="relative flex flex-col items-center text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-gradient-to-br from-mauve to-mauve-soft text-primary-foreground shadow-sm shadow-mauve/30">
            <Icon className="h-8 w-8" />
          </div>
          <h2 className="mt-5 font-display text-2xl font-semibold tracking-tight">{title}</h2>
          <p className="mt-2 max-w-md text-sm text-muted-foreground">{description}</p>
          <div className="mt-5 inline-flex items-center gap-1.5 rounded-full bg-mauve/10 px-3 py-1 text-xs font-medium text-mauve">
            <Sparkles className="h-3 w-3" />
            Próximamente
          </div>
        </div>
      </div>
    </div>
  );
}
