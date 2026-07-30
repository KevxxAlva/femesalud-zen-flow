import { createFileRoute, Outlet, redirect, useRouter } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AppSidebar } from "@/components/AppSidebar";
import { CommandMenu } from "@/components/CommandMenu";
import { useRealtimeSync } from "@/hooks/useRealtimeSync";

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
  const [isCollapsed, setIsCollapsed] = useState(false);

  useRealtimeSync();

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_OUT") {
        router.navigate({ to: "/auth", replace: true });
      }
    });
    return () => sub.subscription.unsubscribe();
  }, [router]);

  return (
    <div className="min-h-screen bg-muted">
      <AppSidebar isCollapsed={isCollapsed} onToggle={() => setIsCollapsed(!isCollapsed)} />
      <main className={`px-4 pt-20 pb-6 md:pr-6 md:py-6 md:pt-6 h-full min-h-screen transition-all duration-300 ${isCollapsed ? "md:ml-[80px]" : "md:ml-[260px]"}`}>
        <Outlet />
      </main>
      <CommandMenu />
    </div>
  );
}
