import { createFileRoute, lazyRouteComponent } from "@tanstack/react-router";

const FacturacionPage = lazyRouteComponent(
  () => import("@/components/FacturacionPage"),
  "FacturacionPage"
);

export const Route = createFileRoute("/_authenticated/facturacion")({
  head: () => ({ meta: [{ title: "Facturación — FemeSalud" }] }),
  component: FacturacionPage,
});
