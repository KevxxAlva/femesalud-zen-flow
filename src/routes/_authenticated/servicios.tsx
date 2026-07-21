import { createFileRoute } from "@tanstack/react-router";
import { ServiciosPage } from "@/components/ServiciosPage";

export const Route = createFileRoute("/_authenticated/servicios")({
  head: () => ({ meta: [{ title: "Treatments — FemeSalud" }] }),
  component: ServiciosPage,
});
