import { ShieldAlert, Plus, Trash2 } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { COMMON_CONSUMABLES } from "./types";

interface ConsultationConsumablesProps {
  commonQuantities: Record<string, string>;
  updateCommonQty: (name: string, val: string) => void;
  customConsumables: { item_name: string; quantity: string; unit: string }[];
  addCustomConsumable: () => void;
  updateCustomConsumable: (idx: number, key: "item_name" | "quantity" | "unit", val: string) => void;
  removeCustomConsumable: (idx: number) => void;
}

export function ConsultationConsumables({
  commonQuantities,
  updateCommonQty,
  customConsumables,
  addCustomConsumable,
  updateCustomConsumable,
  removeCustomConsumable,
}: ConsultationConsumablesProps) {
  return (
    <div className="space-y-6 mt-0">
      <div className="bg-blush/10 text-blush-foreground p-4 rounded-2xl flex items-start gap-3 border border-blush/20">
        <ShieldAlert className="w-5 h-5 shrink-0 mt-0.5" />
        <div className="text-sm">
          <p className="font-semibold">Registro de Materiales</p>
          <p className="opacity-90">Los consumibles marcados aquí afectarán directamente el inventario (si está vinculado) y se añadirán a la cuenta final de la paciente en caja.</p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        <div>
          <h3 className="text-sm font-bold text-mauve mb-4 flex items-center gap-2">
            Materiales Comunes
          </h3>
          <div className="space-y-3">
            {COMMON_CONSUMABLES.map((item) => (
              <div key={item.name} className="flex items-center gap-3">
                <Label className="flex-1 text-sm">{item.name}</Label>
                <div className="flex items-center gap-2 w-[120px]">
                  <Input
                    type="number"
                    min="0"
                    placeholder="0"
                    className="h-8 rounded-xl"
                    value={commonQuantities[item.name] || ""}
                    onChange={(e) => updateCommonQty(item.name, e.target.value)}
                  />
                  <span className="text-xs text-muted-foreground w-6">{item.defaultUnit}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-mauve">Otros Materiales</h3>
            <Button type="button" variant="outline" size="sm" onClick={addCustomConsumable} className="h-7 text-xs rounded-xl">
              <Plus className="w-3 h-3 mr-1" /> Añadir
            </Button>
          </div>
          
          <div className="space-y-3">
            {customConsumables.map((c, idx) => (
              <div key={idx} className="flex items-start gap-2 bg-muted/20 p-2 rounded-xl">
                <div className="grid gap-2 flex-1">
                  <Input
                    placeholder="Nombre del ítem..."
                    className="h-8 text-sm rounded-lg"
                    value={c.item_name}
                    onChange={(e) => updateCustomConsumable(idx, "item_name", e.target.value)}
                  />
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      min="0"
                      placeholder="Cant."
                      className="h-8 w-20 text-sm rounded-lg"
                      value={c.quantity}
                      onChange={(e) => updateCustomConsumable(idx, "quantity", e.target.value)}
                    />
                    <Input
                      placeholder="Unidad (Ej. U, par, cc)"
                      className="h-8 flex-1 text-sm rounded-lg"
                      value={c.unit}
                      onChange={(e) => updateCustomConsumable(idx, "unit", e.target.value)}
                    />
                  </div>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-blush hover:text-blush/80 hover:bg-blush/10 rounded-lg shrink-0"
                  onClick={() => removeCustomConsumable(idx)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}

            {customConsumables.length === 0 && (
              <div className="text-center p-6 border-2 border-dashed border-border/50 rounded-2xl">
                <p className="text-sm text-muted-foreground">No hay materiales extra.</p>
                <p className="text-xs text-muted-foreground mt-1">Usa el botón "Añadir" para registrar uno.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
