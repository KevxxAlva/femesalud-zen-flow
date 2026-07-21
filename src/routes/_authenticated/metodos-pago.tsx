import { createFileRoute } from "@tanstack/react-router";
import { PaymentMethodsPage } from "@/components/finance/PaymentMethodsPage";

export const Route = createFileRoute("/_authenticated/metodos-pago")({
  head: () => ({ meta: [{ title: "Payment Methods — FemeSalud" }] }),
  component: PaymentMethodsPage,
});
