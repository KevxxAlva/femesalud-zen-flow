import { createFileRoute, lazyRouteComponent } from "@tanstack/react-router";

const AgendaPage = lazyRouteComponent(
  () => import("@/components/AgendaPage"),
  "AgendaPage"
);

export const Route = createFileRoute("/_authenticated/agenda")({
  head: () => ({ meta: [{ title: "Agenda — FemeSalud" }] }),
  component: AgendaPage,
});
