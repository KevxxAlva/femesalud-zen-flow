import { createFileRoute } from "@tanstack/react-router";
import { SalesPage } from "@/components/finance/SalesPage";

export const Route = createFileRoute("/_authenticated/facturacion")({
  head: () => ({ meta: [{ title: "Sales — FemeSalud" }] }),
  component: SalesPage,
});
