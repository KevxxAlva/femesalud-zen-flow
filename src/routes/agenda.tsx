import { createFileRoute } from "@tanstack/react-router";
import { AgendaPage } from "@/components/AgendaPage";
export const Route = createFileRoute("/agenda")({
  head: () => ({ meta: [{ title: "Agenda — FemeSalud" }] }),
  component: AgendaPage,
});
