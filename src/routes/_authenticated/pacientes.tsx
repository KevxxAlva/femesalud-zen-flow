import { createFileRoute, lazyRouteComponent } from "@tanstack/react-router";

const PatientsPage = lazyRouteComponent(
  () => import("@/components/PatientsPage"),
  "PatientsPage"
);

export const Route = createFileRoute("/_authenticated/pacientes")({
  head: () => ({ meta: [{ title: "Pacientes — FemeSalud" }] }),
  component: PatientsPage,
});
