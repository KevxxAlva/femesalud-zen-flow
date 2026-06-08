import { createFileRoute } from "@tanstack/react-router";
import { Users } from "lucide-react";
import { ModulePlaceholder } from "@/components/ModulePlaceholder";
export const Route = createFileRoute("/pacientes")({
  head: () => ({ meta: [{ title: "Pacientes — FemeSalud" }] }),
  component: () => (
    <ModulePlaceholder title="Pacientes" icon={Users} description="Tu directorio completo de pacientes con búsqueda inteligente y filtros clínicos." />
  ),
});
