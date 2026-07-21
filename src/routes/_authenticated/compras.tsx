import { createFileRoute } from "@tanstack/react-router";
import { PurchasesPage } from "@/components/finance/PurchasesPage";

export const Route = createFileRoute("/_authenticated/compras")({
  head: () => ({ meta: [{ title: "Purchases — FemeSalud" }] }),
  component: PurchasesPage,
});
