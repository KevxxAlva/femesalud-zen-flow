import { createFileRoute } from "@tanstack/react-router";
import { PeripheralsPage } from "@/components/physical-asset/PeripheralsPage";

export const Route = createFileRoute("/_authenticated/peripherals")({
  head: () => ({ meta: [{ title: "Peripherals — FemeSalud" }] }),
  component: PeripheralsPage,
});
