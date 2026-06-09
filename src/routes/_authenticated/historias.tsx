import { createFileRoute } from "@tanstack/react-router";
import { FileText } from "lucide-react";
import { ModulePlaceholder } from "@/components/ModulePlaceholder";
export const Route = createFileRoute("/_authenticated/historias")({
  head: () => ({ meta: [{ title: "Historias Clínicas — FemeSalud" }] }),
  component: () => (
    <ModulePlaceholder title="Historias Clínicas" icon={FileText} description="Expedientes médicos digitales, seguros y siempre accesibles." />
  ),
});
