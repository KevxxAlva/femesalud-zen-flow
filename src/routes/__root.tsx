import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import "@fontsource/inter/400.css";
import "@fontsource/inter/500.css";
import "@fontsource/inter/600.css";
import "@fontsource/inter/700.css";
import "@fontsource/plus-jakarta-sans/500.css";
import "@fontsource/plus-jakarta-sans/600.css";
import "@fontsource/plus-jakarta-sans/700.css";
import "@fontsource/plus-jakarta-sans/800.css";
import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { Toaster } from "@/components/ui/sonner";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="font-display text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold">Página no encontrada</h2>
        <p className="mt-2 text-sm text-muted-foreground">Esta ruta no existe en FemeSalud.</p>
        <a
          href="/"
          className="mt-6 inline-flex items-center justify-center rounded-2xl bg-gradient-to-r from-mauve to-mauve-soft px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm"
        >
          Volver al inicio
        </a>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-2xl text-center bg-card p-8 rounded-3xl border border-destructive/20 shadow-xl">
        <h1 className="text-xl font-bold text-destructive">Algo salió mal</h1>
        <p className="mt-2 text-sm text-muted-foreground">Error detectado en la aplicación:</p>
        
        <div className="mt-4 p-4 bg-muted rounded-2xl text-left font-mono text-xs overflow-auto max-h-[300px] border border-border/60">
          <p className="font-bold text-foreground mb-1">{error.message}</p>
          <pre className="text-muted-foreground whitespace-pre-wrap">{error.stack}</pre>
        </div>

        <div className="mt-6 flex justify-center gap-3">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="rounded-2xl bg-gradient-to-r from-mauve to-mauve-soft px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm hover:opacity-95"
          >
            Reintentar
          </button>
          <button
            onClick={() => window.location.reload()}
            className="rounded-2xl border border-border px-4 py-2 text-sm font-medium text-foreground shadow-sm hover:bg-muted"
          >
            Forzar Recarga (F5)
          </button>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "FemeSalud — Premium Clinical Suite" },
      { name: "description", content: "Plataforma premium de gestión médica para profesionales de la salud." },
    ],
    links: [
      { rel: "icon", href: "/logo.png", type: "image/png" },
      { rel: "stylesheet", href: appCss },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="es">
      <head>
        <HeadContent />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                if (localStorage.getItem('theme') === 'dark' || (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
                  document.documentElement.classList.add('dark');
                } else {
                  document.documentElement.classList.remove('dark');
                }
              } catch (_) {}
            `,
          }}
        />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  return (
    <QueryClientProvider client={queryClient}>
      <Outlet />
      <Toaster richColors position="top-right" />
    </QueryClientProvider>
  );
}
