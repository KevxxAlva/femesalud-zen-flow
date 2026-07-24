import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Service, ServiceInsert, useCreateService, useUpdateService } from "@/lib/api/services";

interface ServiceFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  service: Service | null;
}

export function ServiceForm({ open, onOpenChange, service }: ServiceFormProps) {
  const { register, handleSubmit, reset, formState: { errors } } = useForm<ServiceInsert>();
  
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
    } else {
      reset({
        nombre_servicio: "",
        costo_base: 0,
        codigo_medico: "",
        descripcion: "",
      });
    }
  }, [service, reset, open]);

  const onSubmit = (data: ServiceInsert) => {
    if (service) {
      updateService.mutate(
        { id: service.id_servicio, data },
        { onSuccess: () => onOpenChange(false) }
      );
    } else {
      createService.mutate(data, { onSuccess: () => onOpenChange(false) });
    }
  };

  const isPending = createService.isPending || updateService.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{service ? "Editar Servicio" : "Añadir Nuevo Servicio"}</DialogTitle>
          <DialogDescription>
            {service ? "Actualizar los detalles del servicio a continuación." : "Introducir los detalles para el nuevo servicio."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-4">
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
