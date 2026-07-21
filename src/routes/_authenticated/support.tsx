import { createFileRoute } from "@tanstack/react-router";
import { CustomerSupportPage } from "@/components/support/CustomerSupportPage";

export const Route = createFileRoute("/_authenticated/support")({
  component: CustomerSupportPage,
});
