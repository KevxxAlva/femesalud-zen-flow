import { useMemo } from "react";
import { useFormContext } from "react-hook-form";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { ConsultationFormValues } from "./types";

export function ConsultationVitals() {
  const { register, watch } = useFormContext<ConsultationFormValues>();

  const weightKg = watch("weightKg") || "";
  const heightCm = watch("heightCm") || "";

  const bmi = useMemo(() => {
    const w = parseFloat(weightKg);
    const h = parseFloat(heightCm) / 100;
    if (w > 0 && h > 0) {
      return (w / (h * h)).toFixed(1);
    }
    return "";
  }, [weightKg, heightCm]);

  return (
    <div className="space-y-6 mt-0">
      <div className="bg-muted/30 p-4 rounded-2xl space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-mauve">Signos Vitales</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="grid gap-1.5">
            <Label htmlFor="c-height">Estatura (cm)</Label>
            <Input
              id="c-height"
              type="number"
              placeholder="Ej. 165"
              className="rounded-xl"
              {...register("heightCm")}
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="c-weight">Peso (kg)</Label>
            <Input
              id="c-weight"
              type="number"
              step="0.1"
              placeholder="Ej. 62.5"
              className="rounded-xl"
              {...register("weightKg")}
            />
          </div>
          <div className="grid gap-1.5">
            <Label>IMC (Calculado)</Label>
            <Input
              readOnly
              value={bmi}
              placeholder="Ingrese Peso y Talla"
              className="rounded-xl bg-muted/50 font-bold"
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="c-bp">Presión Arterial (TA)</Label>
            <Input
              id="c-bp"
              placeholder="Ej. 120/80"
              className="rounded-xl"
              {...register("bloodPressure")}
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="c-hr">Frecuencia Cardíaca (FC)</Label>
            <Input
              id="c-hr"
              type="number"
              placeholder="LPM"
              className="rounded-xl"
              {...register("heartRate")}
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="c-rr">Frecuencia Respiratoria (FR)</Label>
            <Input
              id="c-rr"
              type="number"
              placeholder="RPM"
              className="rounded-xl"
              {...register("respiratoryRate")}
            />
          </div>
          <div className="grid gap-1.5 col-span-2">
            <Label htmlFor="c-temp">Temperatura (°C)</Label>
            <Input
              id="c-temp"
              type="number"
              step="0.1"
              placeholder="Ej. 36.5"
              className="rounded-xl"
              {...register("temperature")}
            />
          </div>
        </div>
      </div>

      <div className="bg-muted/30 p-4 rounded-2xl space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-mauve">Revisión por Sistemas / Examen Físico</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="grid gap-1.5">
            <Label htmlFor="c-skin">Piel y faneras</Label>
            <Input id="c-skin" placeholder="Normal, hidratada..." className="rounded-xl text-xs h-9" {...register("skin")} />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="c-headneck">Cabeza y cuello</Label>
            <Input id="c-headneck" placeholder="Móvil, sin adenopatías..." className="rounded-xl text-xs h-9" {...register("headNeck")} />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="c-breasts">Mamas</Label>
            <Input id="c-breasts" placeholder="Simétricas, sin nódulos palpables..." className="rounded-xl text-xs h-9" {...register("breasts")} />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="c-abdomen">Abdomen</Label>
            <Input id="c-abdomen" placeholder="Blando, depresible, no doloroso..." className="rounded-xl text-xs h-9" {...register("abdomen")} />
          </div>
          <div className="grid gap-1.5 col-span-2">
            <Label htmlFor="c-gyneco">Ginecológico</Label>
            <Input id="c-gyneco" placeholder="Genitales externos normales, vagina elástica, cuello sano..." className="rounded-xl text-xs h-9" {...register("gynecological")} />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="c-extremities">Extremidades</Label>
            <Input id="c-extremities" placeholder="Simétricas, sin edemas..." className="rounded-xl text-xs h-9" {...register("extremities")} />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="c-neuro">Neurológico</Label>
            <Input id="c-neuro" placeholder="Lúcida, orientada..." className="rounded-xl text-xs h-9" {...register("neurological")} />
          </div>
        </div>
      </div>
    </div>
  );
}
