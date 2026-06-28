import { useFormContext } from "react-hook-form";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { ConsultationFormValues } from "./types";

export function ConsultationSpecial() {
  const { register } = useFormContext<ConsultationFormValues>();

  return (
    <div className="space-y-6 mt-0">
      <div className="bg-muted/30 p-4 rounded-2xl space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-mauve">Hallazgos Colposcópicos</h3>
        <div className="grid grid-cols-3 gap-4">
          <div className="grid gap-1.5 col-span-3">
            <Label htmlFor="c-acetic">Test de Ácido Acético</Label>
            <Input
              id="c-acetic"
              placeholder="Ej. Acetoblanco positivo..."
              className="rounded-xl"
              {...register("aceticAcidTest")}
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="c-acetic-clock">Posición Horaria Ácido</Label>
            <Input
              id="c-acetic-clock"
              placeholder="Ej. 12:00, 3:00"
              className="rounded-xl text-xs"
              {...register("aceticClockPosition")}
            />
          </div>
          <div className="grid gap-1.5 col-span-2">
            <Label htmlFor="c-acetic-relative">Posición Relativa Ácido</Label>
            <Input
              id="c-acetic-relative"
              placeholder="Ej. Zona de transformación..."
              className="rounded-xl text-xs"
              {...register("aceticRelativePosition")}
            />
          </div>

          <div className="grid gap-1.5 col-span-3 border-t border-border/40 pt-3 mt-1">
            <Label htmlFor="c-lugol">Test de Lugol (Schiller)</Label>
            <Input
              id="c-lugol"
              placeholder="Ej. Yodonegativo (Schiller positivo)..."
              className="rounded-xl"
              {...register("lugolTest")}
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="c-lugol-clock">Posición Horaria Lugol</Label>
            <Input
              id="c-lugol-clock"
              placeholder="Ej. 6:00, 9:00"
              className="rounded-xl text-xs"
              {...register("lugolClockPosition")}
            />
          </div>
          <div className="grid gap-1.5 col-span-2">
            <Label htmlFor="c-lugol-relative">Posición Relativa Lugol</Label>
            <Input
              id="c-lugol-relative"
              placeholder="Ej. Labio anterior..."
              className="rounded-xl text-xs"
              {...register("lugolRelativePosition")}
            />
          </div>
        </div>
      </div>

      <div className="bg-muted/30 p-4 rounded-2xl space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-mauve">Control de Embarazo (Obstetricia)</h3>
          <span className="text-[10px] text-muted-foreground bg-blush/20 text-blush-foreground px-2 py-0.5 rounded-full font-bold">Rellenar solo si aplica</span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div className="grid gap-1.5">
            <Label htmlFor="c-eg">Edad Gestacional (EG)</Label>
            <Input
              id="c-eg"
              placeholder="Ej. 24.3 semanas"
              className="rounded-xl text-xs"
              {...register("gestationalAge")}
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="c-fweight">Peso Fetal Estimado (g)</Label>
            <Input
              id="c-fweight"
              type="number"
              placeholder="Gramos"
              className="rounded-xl text-xs"
              {...register("fetalWeight")}
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="c-obp">PA Obstétrica</Label>
            <Input
              id="c-obp"
              placeholder="Ej. 110/70"
              className="rounded-xl text-xs"
              {...register("obstetricBp")}
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="c-au">Altura Uterina (AU - cm)</Label>
            <Input
              id="c-au"
              type="number"
              placeholder="cm"
              className="rounded-xl text-xs"
              {...register("uterineHeight")}
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="c-presentation">Presentación Fetal</Label>
            <Input
              id="c-presentation"
              placeholder="Cefálica, Podálica, Transversa..."
              className="rounded-xl text-xs"
              {...register("presentation")}
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="c-fhr">FC Fetal (FCF)</Label>
            <Input
              id="c-fhr"
              type="number"
              placeholder="LPM"
              className="rounded-xl text-xs"
              {...register("fetalHeartRate")}
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="c-fmov">Movimientos Fetales</Label>
            <Input
              id="c-fmov"
              placeholder="Activos, presentes, atenuados..."
              className="rounded-xl text-xs"
              {...register("fetalMovements")}
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="c-edema">Edema</Label>
            <Input
              id="c-edema"
              placeholder="Ausente, grado I, grado II..."
              className="rounded-xl text-xs"
              {...register("edema")}
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="c-alarm">Signos de Alarma</Label>
            <Input
              id="c-alarm"
              placeholder="Niega cefalea, zumbidos, sangrado..."
              className="rounded-xl text-xs"
              {...register("alarmSigns")}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
