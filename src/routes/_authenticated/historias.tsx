import { createFileRoute } from "@tanstack/react-router";
import { HistoriasPage } from "@/components/HistoriasPage";

export const Route = createFileRoute("/_authenticated/historias")({
  head: () => ({ meta: [{ title: "Historias Clínicas — FemeSalud" }] }),
  component: HistoriasPage,
});
