import { createFileRoute, lazyRouteComponent } from "@tanstack/react-router";

const HistoriasPage = lazyRouteComponent(
  () => import("@/components/HistoriasPage"),
  "HistoriasPage"
);

export const Route = createFileRoute("/_authenticated/historias")({
  head: () => ({ meta: [{ title: "Historias Clínicas — FemeSalud" }] }),
  component: HistoriasPage,
});
