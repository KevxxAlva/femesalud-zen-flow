import { createFileRoute } from "@tanstack/react-router";
import { Stethoscope } from "lucide-react";
import { ModulePlaceholder } from "@/components/ModulePlaceholder";
export const Route = createFileRoute("/_authenticated/servicios")({
  head: () => ({ meta: [{ title: "Servicios Médicos — FemeSalud" }] }),
  component: () => (
    <ModulePlaceholder title="Servicios Médicos" icon={Stethoscope} description="Catálogo de servicios, procedimientos y especialidades." />
  ),
});
