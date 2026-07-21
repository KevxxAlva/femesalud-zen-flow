import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export type AppRole = "admin" | "doctor";

export interface AuthState {
  session: Session | null;
  user: User | null;
  loading: boolean;
}

export function useAuthSession(): AuthState {
  const [state, setState] = useState<AuthState>({ session: null, user: null, loading: true });

  useEffect(() => {
    let mounted = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setState({ session: data.session, user: data.session?.user ?? null, loading: false });
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      setState({ session, user: session?.user ?? null, loading: false });
    });
    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  return state;
}

export function useRoles() {
  const { user } = useAuthSession();
  return useQuery({
    queryKey: ["user_roles", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("usuarios")
        .select("roles(nombre_rol)")
        .eq("auth_id", user!.id)
        .maybeSingle();
      if (error) throw error;
      if (!data || !data.roles) return [];
      // TypeScript could infer data.roles as an array if it's a one-to-many, but in this case it's a one-to-one or many-to-one (id_rol). 
      // Ensure we handle it whether it's an array or an object
      const roleName = Array.isArray(data.roles) ? data.roles[0]?.nombre_rol : (data.roles as any).nombre_rol;
      return roleName ? [roleName.toLowerCase() as AppRole] : [];
    },
  });
}

export function useIsAdmin() {
  const { data } = useRoles();
  return (data ?? []).includes("admin");
}
