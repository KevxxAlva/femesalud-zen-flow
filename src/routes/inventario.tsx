import { createFileRoute } from "@tanstack/react-router";
import { Package } from "lucide-react";
import { ModulePlaceholder } from "@/components/ModulePlaceholder";
export const Route = createFileRoute("/inventario")({
  head: () => ({ meta: [{ title: "Inventario — FemeSalud" }] }),
  component: () => (
    <ModulePlaceholder title="Inventario" icon={Package} description="Insumos, medicamentos y control de stock en tiempo real." />
  ),
});
