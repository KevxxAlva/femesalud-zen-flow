import { createFileRoute } from "@tanstack/react-router";
import { ReportsPage } from "@/components/ReportsPage";

export const Route = createFileRoute("/_authenticated/reportes")({
  head: () => ({ meta: [{ title: "Reportes — FemeSalud" }] }),
  component: ReportsPage,
});
