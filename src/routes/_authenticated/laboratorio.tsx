import { createFileRoute } from "@tanstack/react-router";
import { LaboratoryPage } from "@/components/LaboratoryPage";

export const Route = createFileRoute("/_authenticated/laboratorio")({
  head: () => ({ meta: [{ title: "Laboratorio — FemeSalud" }] }),
  component: LaboratoryPage,
});
