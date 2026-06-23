import { createFileRoute } from "@tanstack/react-router";
import { lazy } from "react";

const PatientsPage = lazy(() =>
  import("@/components/PatientsPage").then((m) => ({ default: m.PatientsPage }))
);

export const Route = createFileRoute("/_authenticated/pacientes")({
  head: () => ({ meta: [{ title: "Pacientes — FemeSalud" }] }),
  component: PatientsPage,
});
