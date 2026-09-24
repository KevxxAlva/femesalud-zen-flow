import { useMemo } from "react";
import { getSpecialtyConfig, getSpecialtyBadgeStyle } from "@/lib/constants/specialtyForms";
import { Stethoscope, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface SpecialtyDataViewerProps {
  specialtyName?: string | null;
  data?: Record<string, any> | null;
}

export function SpecialtyDataViewer({ specialtyName, data }: SpecialtyDataViewerProps) {
  const config = useMemo(() => {
    return getSpecialtyConfig(specialtyName);
  }, [specialtyName]);

  if (!data || Object.keys(data).length === 0) return null;

  // Filter sections that have at least one answered field
  const answeredSections = config.sections
    .map((sec) => {
      const answeredFields = sec.fields.filter((f) => {
        const val = data[f.id];
        return val !== undefined && val !== null && val !== "" && val !== false;
      });
      return {
        ...sec,
        answeredFields,
      };
    })
    .filter((sec) => sec.answeredFields.length > 0);

  if (answeredSections.length === 0) return null;

  return (
    <div className="space-y-3 bg-muted/25 p-3.5 rounded-2xl border border-border/30">
      <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-primary border-b border-border/20 pb-2">
        <Stethoscope className="h-3.5 w-3.5" />
        <span>{config.tabTitle}</span>
        {specialtyName && (
          <span className={cn("ml-auto text-[10px] px-2 py-0.5 rounded-lg font-bold normal-case", getSpecialtyBadgeStyle(specialtyName).className)}>
            {specialtyName}
          </span>
        )}
      </div>

      <div className="space-y-3">
        {answeredSections.map((sec) => (
          <div key={sec.title} className="space-y-1.5">
            <h6 className="text-[10px] font-bold text-muted-foreground flex items-center gap-1">
              <Sparkles className="h-2.5 w-2.5 text-mauve" />
              {sec.title}
            </h6>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              {sec.answeredFields.map((f) => {
                const val = data[f.id];
                const displayVal = typeof val === "boolean" ? (val ? "Sí" : "No") : String(val);
                const isLong = f.type === "textarea" || displayVal.length > 40;

                return (
                  <div
                    key={f.id}
                    className={`bg-background/60 p-2 rounded-xl border border-border/20 ${
                      isLong ? "sm:col-span-2" : "col-span-1"
                    }`}
                  >
                    <span className="text-[10px] text-muted-foreground block font-medium">
                      {f.label}
                    </span>
                    <span className="font-semibold text-foreground text-xs leading-relaxed">
                      {displayVal}
                      {f.unit ? ` ${f.unit}` : ""}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
