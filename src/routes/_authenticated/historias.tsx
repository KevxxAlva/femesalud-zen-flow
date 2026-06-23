import { createFileRoute } from "@tanstack/react-router";
import { lazy } from "react";

const HistoriasPage = lazy(() =>
  import("@/components/HistoriasPage").then((m) => ({ default: m.HistoriasPage }))
);

export const Route = createFileRoute("/_authenticated/historias")({
  head: () => ({ meta: [{ title: "Historias Clínicas — FemeSalud" }] }),
  component: HistoriasPage,
});
