import { createFileRoute, lazyRouteComponent } from "@tanstack/react-router";

const ReportsPage = lazyRouteComponent(
  () => import("@/components/ReportsPage"),
  "ReportsPage"
);

export const Route = createFileRoute("/_authenticated/reportes")({
  head: () => ({ meta: [{ title: "Reportes — FemeSalud" }] }),
  component: ReportsPage,
});
