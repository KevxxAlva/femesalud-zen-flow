import { createFileRoute } from "@tanstack/react-router";
import { Receipt } from "lucide-react";
import { ModulePlaceholder } from "@/components/ModulePlaceholder";
export const Route = createFileRoute("/_authenticated/facturacion")({
  head: () => ({ meta: [{ title: "Facturación — FemeSalud" }] }),
  component: () => (
    <ModulePlaceholder title="Facturación" icon={Receipt} description="Facturas, pagos y control financiero de la clínica." />
  ),
});
