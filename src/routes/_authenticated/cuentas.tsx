import { createFileRoute } from "@tanstack/react-router";
import { AccountsPage } from "@/components/finance/AccountsPage";

export const Route = createFileRoute("/_authenticated/cuentas")({
  head: () => ({ meta: [{ title: "Accounts — FemeSalud" }] }),
  component: AccountsPage,
});
