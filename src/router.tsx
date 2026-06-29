import { QueryClient, QueryCache, MutationCache } from "@tanstack/react-query";
import { createRouter } from "@tanstack/react-router";
import { toast } from "sonner";
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
    scrollRestoration: true,
    defaultPreload: "intent",
    defaultPreloadStaleTime: 0,
  });

  return router;
};
