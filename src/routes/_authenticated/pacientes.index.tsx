import { createFileRoute } from "@tanstack/react-router";
import { PatientsPage } from "@/components/PatientsPage";
export const Route = createFileRoute("/_authenticated/pacientes/")({
  head: () => ({ meta: [{ title: "Pacientes — FemeSalud" }] }),
  component: PatientsPage,
});
