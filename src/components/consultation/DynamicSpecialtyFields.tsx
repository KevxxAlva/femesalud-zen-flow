import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import type { SpecialtyConfig, SpecialtyField } from "@/lib/constants/specialtyForms";
import { Stethoscope, Sparkles } from "lucide-react";

interface DynamicSpecialtyFieldsProps {
  config: SpecialtyConfig;
  values: Record<string, any>;
  onChange?: (fieldId: string, value: any) => void;
  readOnly?: boolean;
}

export function DynamicSpecialtyFields({
  config,
  values,
  onChange,
  readOnly = false,
}: DynamicSpecialtyFieldsProps) {
  const handleFieldChange = (fieldId: string, value: any) => {
    if (readOnly || !onChange) return;
    onChange(fieldId, value);
  };

  const renderField = (field: SpecialtyField) => {
    const rawVal = values[field.id];
    const value = rawVal !== undefined && rawVal !== null ? rawVal : "";

    const spanClass = field.gridSpan === 2 ? "col-span-1 md:col-span-2" : "col-span-1";

    if (field.type === "checkbox") {
      return (
        <div key={field.id} className={cn("flex items-center space-x-2 py-2", spanClass)}>
          <Checkbox
            id={field.id}
            checked={!!value}
            disabled={readOnly}
            onCheckedChange={(checked) => handleFieldChange(field.id, checked)}
          />
          <Label htmlFor={field.id} className="text-xs font-semibold cursor-pointer">
            {field.label}
          </Label>
        </div>
      );
    }

    if (field.type === "select") {
      return (
        <div key={field.id} className={cn("space-y-1.5", spanClass)}>
          <Label className="text-xs font-semibold text-foreground/80">{field.label}</Label>
          <Select
            value={value ? String(value) : ""}
            onValueChange={(val) => handleFieldChange(field.id, val)}
            disabled={readOnly}
          >
            <SelectTrigger className="h-10 rounded-xl bg-background border-border/40 text-xs">
              <SelectValue placeholder="Seleccione una opción..." />
            </SelectTrigger>
            <SelectContent>
              {field.options?.map((opt) => (
                <SelectItem key={opt} value={opt} className="text-xs">
                  {opt}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      );
    }

    if (field.type === "textarea") {
      return (
        <div key={field.id} className={cn("space-y-1.5", spanClass)}>
          <Label className="text-xs font-semibold text-foreground/80">{field.label}</Label>
          <Textarea
            value={String(value)}
            onChange={(e) => handleFieldChange(field.id, e.target.value)}
            disabled={readOnly}
            placeholder={field.placeholder || "Escriba aquí los hallazgos clínicos..."}
            rows={3}
            className="rounded-xl bg-background border-border/40 text-xs resize-none"
          />
        </div>
      );
    }

    // Number or Text input
    return (
      <div key={field.id} className={cn("space-y-1.5", spanClass)}>
        <div className="flex items-center justify-between">
          <Label className="text-xs font-semibold text-foreground/80">{field.label}</Label>
          {field.unit && (
            <span className="text-[10px] uppercase font-bold text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
              {field.unit}
            </span>
          )}
        </div>
        <div className="relative">
          <Input
            type={field.type === "number" ? "number" : "text"}
            value={String(value)}
            onChange={(e) => handleFieldChange(field.id, e.target.value)}
            disabled={readOnly}
            placeholder={field.placeholder || ""}
            className="h-10 rounded-xl bg-background border-border/40 text-xs pr-8"
          />
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Specialty Banner */}
      <div className="flex items-center justify-between p-3.5 rounded-2xl bg-gradient-to-r from-mauve/10 via-mauve/5 to-transparent border border-mauve/20">
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-xl bg-mauve/20 text-mauve flex items-center justify-center font-bold">
            <Stethoscope className="h-4 w-4" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h4 className="text-xs font-bold text-foreground">{config.name}</h4>
              <span className="text-[9px] uppercase tracking-wider bg-mauve/15 text-mauve font-extrabold px-1.5 py-0.5 rounded-full">
                Formulario Adaptable
              </span>
            </div>
            <p className="text-[11px] text-muted-foreground">
              Campos y preguntas estructurados según la especialidad del médico tratante.
            </p>
          </div>
        </div>
      </div>

      {/* Sections */}
      {config.sections.map((section, idx) => (
        <div
          key={section.title || idx}
          className="rounded-2xl p-4 bg-muted/20 border border-border/40 space-y-4"
        >
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Sparkles className="h-3 w-3 text-mauve" />
              {section.title}
            </h4>
            {section.description && (
              <p className="text-[11px] text-muted-foreground mt-0.5">{section.description}</p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {section.fields.map(renderField)}
          </div>
        </div>
      ))}
    </div>
  );
}
