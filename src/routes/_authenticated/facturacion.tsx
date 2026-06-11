import { createFileRoute } from "@tanstack/react-router";
import { FacturacionPage } from "@/components/FacturacionPage";
export const Route = createFileRoute("/_authenticated/facturacion")({
  head: () => ({ meta: [{ title: "Facturación — FemeSalud" }] }),
  component: FacturacionPage,
});
