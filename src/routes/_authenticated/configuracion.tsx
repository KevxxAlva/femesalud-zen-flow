import { createFileRoute } from "@tanstack/react-router";
import { Settings } from "lucide-react";
import { ModulePlaceholder } from "@/components/ModulePlaceholder";
export const Route = createFileRoute("/_authenticated/configuracion")({
  head: () => ({ meta: [{ title: "Configuración — FemeSalud" }] }),
  component: () => (
    <ModulePlaceholder title="Configuración" icon={Settings} description="Preferencias, integraciones y ajustes de la cuenta." />
  ),
});
