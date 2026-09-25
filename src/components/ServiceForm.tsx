import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Service, ServiceInsert, useCreateService, useUpdateService, useSpecialties } from "@/lib/api/services";
import { Stethoscope } from "lucide-react";

interface ServiceFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  service: Service | null;
}

export function ServiceForm({ open, onOpenChange, service }: ServiceFormProps) {
  const { register, handleSubmit, reset, formState: { errors } } = useForm<ServiceInsert>();
  const [selectedEspId, setSelectedEspId] = useState<string>("none");
  
  const { data: specialties = [] } = useSpecialties();
  const createService = useCreateService();
  const updateService = useUpdateService();

  useEffect(() => {
    if (service) {
      reset({
        nombre_servicio: service.nombre_servicio,
        costo_base: service.costo_base,
        codigo_medico: service.codigo_medico,
        descripcion: service.descripcion,
      });
      setSelectedEspId(service.id_especialidad ? String(service.id_especialidad) : "none");
    } else {
      reset({
        nombre_servicio: "",
        costo_base: 0,
        codigo_medico: "",
        descripcion: "",
      });
      setSelectedEspId("none");
    }
  }, [service, reset, open]);

  const onSubmit = (data: ServiceInsert) => {
    const payload = {
      ...data,
      id_especialidad: selectedEspId === "none" ? null : parseInt(selectedEspId),
    };

    if (service) {
      updateService.mutate(
        { id: service.id_servicio, data: payload },
        { onSuccess: () => onOpenChange(false) }
      );
    } else {
      createService.mutate(payload, { onSuccess: () => onOpenChange(false) });
    }
  };

  const isPending = createService.isPending || updateService.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[460px] rounded-3xl">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold flex items-center gap-2">
            <Stethoscope className="w-5 h-5 text-primary" />
            {service ? "Editar Servicio Médico" : "Nuevo Servicio Médico"}
          </DialogTitle>
          <DialogDescription>
            {service ? "Actualiza los detalles y la especialidad asignada a este servicio." : "Registra un nuevo servicio médico y asígnalo a una especialidad."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label htmlFor="id_especialidad" className="text-xs font-bold text-foreground">ESPECIALIDAD MÉDICA</Label>
            <Select value={selectedEspId} onValueChange={setSelectedEspId}>
              <SelectTrigger className="w-full rounded-xl bg-muted border-border/60 text-sm">
                <SelectValue placeholder="Seleccione especialidad..." />
              </SelectTrigger>
              <SelectContent className="rounded-xl max-h-[250px]">
                <SelectItem value="none" className="font-semibold text-muted-foreground">
                  Servicio General / Multidisciplinario
                </SelectItem>
                {specialties.map((esp) => (
                  <SelectItem key={esp.id_especialidad} value={String(esp.id_especialidad)}>
                    {esp.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="nombre_servicio" className="text-xs font-bold text-foreground">NOMBRE DEL SERVICIO *</Label>
            <Input 
              id="nombre_servicio" 
              placeholder="Ej. Limpieza Dental" 
              {...register("nombre_servicio", { required: "El nombre es obligatorio" })} 
              className="bg-muted border-gray-200 text-sm focus-visible:ring-blue-500"
            />
            {errors.nombre_servicio && <span className="text-xs text-destructive">{errors.nombre_servicio.message}</span>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="costo_base" className="text-xs font-bold text-foreground">COSTO BASE ($) *</Label>
              <Input 
                id="costo_base" 
                type="number" 
                step="0.01"
                placeholder="0.00" 
                {...register("costo_base", { required: "El costo base es obligatorio", valueAsNumber: true })} 
                className="bg-muted border-gray-200 text-sm focus-visible:ring-blue-500"
              />
              {errors.costo_base && <span className="text-xs text-destructive">{errors.costo_base.message}</span>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="codigo_medico" className="text-xs font-bold text-foreground">CÓDIGO MÉDICO</Label>
              <Input 
                id="codigo_medico" 
                placeholder="Ej. SER-001" 
                {...register("codigo_medico")} 
                className="bg-muted border-gray-200 text-sm focus-visible:ring-blue-500"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="descripcion" className="text-xs font-bold text-foreground">DESCRIPCIÓN</Label>
            <Textarea 
              id="descripcion" 
              placeholder="Descripción detallada del servicio..." 
              {...register("descripcion")} 
              className="bg-muted border-gray-200 text-sm focus-visible:ring-blue-500 resize-none h-24"
            />
          </div>

          <div className="pt-4 flex justify-end gap-3">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              className="rounded-xl border-gray-200 text-muted-foreground"
            >
              Cancelar
            </Button>
            <Button 
              type="submit" 
              disabled={isPending}
              className="rounded-xl bg-primary hover:bg-[#3b55d9] text-primary-foreground shadow-md shadow-primary/20"
            >
              {isPending ? "Guardando..." : service ? "Guardar Cambios" : "Añadir Servicio"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
