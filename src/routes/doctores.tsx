import { createFileRoute } from "@tanstack/react-router";
import { UserRound } from "lucide-react";
import { ModulePlaceholder } from "@/components/ModulePlaceholder";
export const Route = createFileRoute("/doctores")({
  head: () => ({ meta: [{ title: "Doctores — FemeSalud" }] }),
  component: () => (
    <ModulePlaceholder title="Doctores" icon={UserRound} description="Gestiona el equipo médico, agendas y especialidades de la clínica." />
  ),
});
