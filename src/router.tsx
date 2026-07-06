import { QueryClient, QueryCache, MutationCache } from "@tanstack/react-query";
import { createRouter } from "@tanstack/react-router";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { routeTree } from "./routeTree.gen";
import { GlobalError } from "./components/ui/global-error";

export const getRouter = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 1000 * 60 * 2, // 2 minutos de staleTime
        gcTime: 1000 * 60 * 10,    // 10 minutos de cacheTime
        refetchOnWindowFocus: false, // Evita re-consultar al cambiar de pestaña/aplicación
        refetchOnReconnect: true,
      },
    },
    queryCache: new QueryCache({
      onError: (error) => {
        toast.error(`Error de consulta: ${error.message}`);
      },
    }),
    mutationCache: new MutationCache({
      onError: (error) => {
        toast.error(`Error en operación: ${error.message}`);
      },
    }),
  });

  const router = createRouter({
    routeTree,
    context: { queryClient },
    defaultErrorComponent: ({ error, reset }) => <GlobalError error={error} resetErrorBoundary={reset} />,
    defaultPendingComponent: () => (
      <div className="flex h-full min-h-[50vh] w-full flex-col items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-mauve" />
        <p className="mt-4 text-sm text-muted-foreground animate-pulse">Cargando módulo...</p>
      </div>
    ),
    scrollRestoration: true,
    defaultPreload: "intent",
    defaultPreloadStaleTime: 0,
  });

  return router;
};
