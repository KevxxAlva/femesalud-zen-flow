import { createFileRoute, Outlet, redirect, useRouter } from "@tanstack/react-router";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AppSidebar } from "@/components/AppSidebar";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) throw redirect({ to: "/auth" });
    return { user: data.user };
  },
  component: AuthenticatedLayout,
});

function AuthenticatedLayout() {
  const router = useRouter();
  useEffect(() => {
    // Force light mode for the new Med Care design since it's a light UI
    document.documentElement.classList.remove('dark');
    localStorage.setItem('theme', 'light');

    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_OUT") {
        router.navigate({ to: "/auth", replace: true });
      }
    });
    return () => sub.subscription.unsubscribe();
  }, [router]);

  return (
    <div className="min-h-screen bg-[#f8f9fb]">
      <AppSidebar />
      <main className="px-4 pt-20 pb-6 md:ml-[260px] md:pr-6 md:py-6 md:pt-6 h-full min-h-screen">
        <Outlet />
      </main>
    </div>
  );
}
