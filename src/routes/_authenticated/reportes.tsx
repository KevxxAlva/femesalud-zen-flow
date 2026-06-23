import { createFileRoute } from "@tanstack/react-router";
import { lazy } from "react";

const ReportsPage = lazy(() =>
  import("@/components/ReportsPage").then((m) => ({ default: m.ReportsPage }))
);

export const Route = createFileRoute("/_authenticated/reportes")({
  head: () => ({ meta: [{ title: "Reportes — FemeSalud" }] }),
  component: ReportsPage,
});
