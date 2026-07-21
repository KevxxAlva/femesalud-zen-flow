import { createFileRoute } from "@tanstack/react-router";
import { StocksPage } from "@/components/physical-asset/StocksPage";

export const Route = createFileRoute("/_authenticated/stocks")({
  head: () => ({ meta: [{ title: "Stocks — FemeSalud" }] }),
  component: StocksPage,
});
