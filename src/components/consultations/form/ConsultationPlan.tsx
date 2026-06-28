import { useState } from "react";
import { useFormContext } from "react-hook-form";
import { toast } from "sonner";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { usePrescriptionTemplates, useCreatePrescriptionTemplate, useDeletePrescriptionTemplate } from "@/lib/api/consultations";
import { ConsultationFormValues } from "./types";

export function ConsultationPlan() {
  const { register, watch, setValue } = useFormContext<ConsultationFormValues>();
  const indications = watch("indications") || "";

  const { data: templates = [] } = usePrescriptionTemplates();
  const createTemplate = useCreatePrescriptionTemplate();
  const deleteTemplate = useDeletePrescriptionTemplate();
  
  const [newTemplateTitle, setNewTemplateTitle] = useState("");
  const [isSavingTemplate, setIsSavingTemplate] = useState(false);

  const handleSaveAsTemplate = async () => {
    if (!newTemplateTitle.trim()) {
      toast.error("El nombre de la plantilla es obligatorio");
      return;
    }
    if (!indications.trim()) {
      toast.error("Las indicaciones de la receta están vacías");
      return;
    }
    try {
      setIsSavingTemplate(true);
      await createTemplate.mutateAsync({
        title: newTemplateTitle.trim(),
        indications: indications.trim(),
      });
      toast.success("Plantilla guardada con éxito");
      setNewTemplateTitle("");
    } catch (err) {
      toast.error("Error al guardar la plantilla");
    } finally {
      setIsSavingTemplate(false);
    }
  };

  const handleDeleteTemplate = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    e.preventDefault();
    try {
      await deleteTemplate.mutateAsync(id);
      toast.success("Plantilla eliminada");
    } catch (err) {
      toast.error("Error al eliminar la plantilla");
    }
  };

  return (
    <div className="grid gap-4 mt-0">
      <div className="grid gap-2">
        <Label htmlFor="c-diagnosis">Diagnóstico</Label>
        <Textarea
          id="c-diagnosis"
          placeholder="Diagnóstico clínico presuntivo o definitivo..."
          required
          className="rounded-xl min-h-[90px]"
          {...register("diagnosis", { required: true })}
        />
      </div>

      <div className="grid gap-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <Label htmlFor="c-indications">Indicaciones / Receta</Label>
          <div className="flex items-center gap-2">
            {templates.length > 0 && (
              <Select
                value=""
                onValueChange={(val) => {
                  const selected = templates.find((t) => t.id === val);
                  if (selected) {
                    const currentVal = watch("indications") || "";
                    setValue("indications", currentVal ? currentVal + "\n" + selected.indications : selected.indications);
                    toast.success("Plantilla aplicada");
                  }
                }}
              >
                <SelectTrigger className="h-7 rounded-xl text-xs w-[180px] bg-muted/50 border-none flex items-center justify-between">
                  <SelectValue placeholder="Usar plantilla rápida..." />
                </SelectTrigger>
                <SelectContent>
                  {templates.map((t) => (
                    <SelectItem key={t.id} value={t.id} className="text-xs flex items-center justify-between">
                      <span className="truncate max-w-[130px]">{t.title}</span>
                      <button
                        onClick={(e) => handleDeleteTemplate(e, t.id)}
                        className="text-blush/60 hover:text-blush ml-2"
                        title="Eliminar plantilla"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            <div className="flex items-center gap-1 bg-muted/30 p-1 rounded-xl">
              <Input
                placeholder="Nombre de nueva plantilla"
                className="h-7 text-xs w-[140px] border-none bg-background rounded-lg"
                value={newTemplateTitle}
                onChange={(e) => setNewTemplateTitle(e.target.value)}
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-xs rounded-lg text-mauve hover:text-mauve/80 hover:bg-mauve/10"
                onClick={handleSaveAsTemplate}
                disabled={isSavingTemplate}
              >
                {isSavingTemplate ? <Loader2 className="w-3 h-3 animate-spin" /> : <Plus className="w-3 h-3 mr-1" />}
                Guardar
              </Button>
            </div>
          </div>
        </div>
        <Textarea
          id="c-indications"
          placeholder="Rp. Medicamentos, posología, reposo, indicaciones generales..."
          className="rounded-xl min-h-[160px] font-mono text-sm leading-relaxed"
          {...register("indications")}
        />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="c-exams">Exámenes Complementarios</Label>
        <Textarea
          id="c-exams"
          placeholder="Laboratorio, eco, rx solicitados..."
          className="rounded-xl min-h-[80px]"
          {...register("complementaryExams")}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="grid gap-2">
          <Label htmlFor="c-plan">Plan / Conducta</Label>
          <Textarea
            id="c-plan"
            placeholder="Plan de trabajo, interconsultas, procedimientos..."
            className="rounded-xl min-h-[80px]"
            {...register("plan")}
          />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="c-next-appt">Fecha de Próxima Cita (Sugerida)</Label>
          <Input
            id="c-next-appt"
            type="date"
            className="rounded-xl"
            {...register("nextAppointmentDate")}
          />
        </div>
      </div>
    </div>
  );
}
