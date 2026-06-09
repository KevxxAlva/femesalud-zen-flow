import { createFileRoute } from "@tanstack/react-router";
import { FlaskConical } from "lucide-react";
import { ModulePlaceholder } from "@/components/ModulePlaceholder";
export const Route = createFileRoute("/_authenticated/laboratorio")({
  head: () => ({ meta: [{ title: "Laboratorio — FemeSalud" }] }),
  component: () => (
    <ModulePlaceholder title="Laboratorio" icon={FlaskConical} description="Resultados, órdenes y seguimiento de estudios de laboratorio." />
  ),
});
