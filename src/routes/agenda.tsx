import { createFileRoute } from "@tanstack/react-router";
import { Calendar } from "lucide-react";
import { ModulePlaceholder } from "@/components/ModulePlaceholder";
export const Route = createFileRoute("/agenda")({
  head: () => ({ meta: [{ title: "Agenda — FemeSalud" }] }),
  component: () => (
    <ModulePlaceholder title="Agenda" icon={Calendar} description="Gestiona turnos, calendarios clínicos y disponibilidad del equipo médico." />
  ),
});
