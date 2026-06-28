import { useFormContext, Controller } from "react-hook-form";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { ConsultationFormValues, CONTACT_CHANNELS } from "./types";

export function ConsultationAnamnesis() {
  const { control, register } = useFormContext<ConsultationFormValues>();

  return (
    <div className="grid gap-4 mt-0">
      <div className="grid grid-cols-3 gap-4">
        <div className="grid gap-2">
          <Label htmlFor="c-visit-type">Tipo de asistencia</Label>
          <Controller
            name="visitType"
            control={control}
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger className="rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-2xl">
                  <SelectItem value="CONTROL">Control</SelectItem>
                  <SelectItem value="EMERGENCIA">Emergencia</SelectItem>
                  <SelectItem value="CONSULTA_NUEVA">Consulta Nueva</SelectItem>
                  <SelectItem value="POST_TRATAMIENTO">Post-Tratamiento</SelectItem>
                  <SelectItem value="OTRO">Otro</SelectItem>
                </SelectContent>
              </Select>
            )}
          />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="c-channel">Canal de contacto</Label>
          <Controller
            name="contactChannel"
            control={control}
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger className="rounded-xl">
                  <SelectValue placeholder="Seleccionar canal..." />
                </SelectTrigger>
                <SelectContent className="rounded-2xl">
                  {CONTACT_CHANNELS.map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </div>

        <div className="flex items-center gap-2 mt-8">
          <Controller
            name="isFirstVisit"
            control={control}
            render={({ field }) => (
              <Checkbox
                id="c-first-visit"
                checked={field.value}
                onCheckedChange={field.onChange}
                className="rounded-md"
              />
            )}
          />
          <Label htmlFor="c-first-visit" className="cursor-pointer">
            ¿Es primera visita de la paciente?
          </Label>
        </div>
      </div>

      <div className="grid gap-2">
        <Label htmlFor="c-subjective">Examen Subjetivo / Motivo del control</Label>
        <Textarea
          id="c-subjective"
          placeholder="Descripción subjetiva y antecedentes inmediatos expresados por la paciente..."
          className="rounded-xl min-h-[140px]"
          {...register("subjectiveExam")}
        />
      </div>
    </div>
  );
}
