import { createFileRoute } from "@tanstack/react-router";
import { lazy } from "react";

const AgendaPage = lazy(() =>
  import("@/components/AgendaPage").then((m) => ({ default: m.AgendaPage }))
);

export const Route = createFileRoute("/_authenticated/agenda")({
  head: () => ({ meta: [{ title: "Agenda — FemeSalud" }] }),
  component: AgendaPage,
});
