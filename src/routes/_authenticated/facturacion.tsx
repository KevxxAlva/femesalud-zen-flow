import { createFileRoute } from "@tanstack/react-router";
import { lazy } from "react";

const FacturacionPage = lazy(() =>
  import("@/components/FacturacionPage").then((m) => ({ default: m.FacturacionPage }))
);

export const Route = createFileRoute("/_authenticated/facturacion")({
  head: () => ({ meta: [{ title: "Facturación — FemeSalud" }] }),
  component: FacturacionPage,
});
