import { useState, useEffect } from "react";
import { createFileRoute, useRouter } from "@tanstack/react-router";
import { Heart, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export const Route = createFileRoute("/auth")({
  ssr: false,
  head: () => ({ meta: [{ title: "Iniciar sesión — FemeSalud" }] }),
  component: AuthPage,
});

function AuthPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) router.navigate({ to: "/", replace: true });
    });
  }, [router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Bienvenido a FemeSalud");
    router.navigate({ to: "/", replace: true });
  };

  const handleGoogle = async () => {
    setLoading(true);
    try {
      const result = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: window.location.origin,
      });
      if (result.error) {
        toast.error("Error con Google");
        setLoading(false);
        return;
      }
      if (result.redirected) return;
      router.navigate({ to: "/", replace: true });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error inesperado");
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blush/30 via-background to-mauve/10 px-4">
      <div className="w-full max-w-md rounded-3xl glass-card p-8 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-mauve to-mauve-soft shadow-sm">
            <Heart className="h-6 w-6 text-primary-foreground" fill="currentColor" />
          </div>
          <div>
            <h1 className="font-display text-xl font-semibold tracking-tight">FemeSalud</h1>
            <p className="text-[11px] text-muted-foreground">Premium Clinical Suite</p>
          </div>
        </div>

        <h2 className="mt-8 font-display text-2xl font-semibold tracking-tight">Iniciar sesión</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Accede a tu panel clínico. Las cuentas son creadas por un administrador.
        </p>

        <form onSubmit={handleLogin} className="mt-6 space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="password">Contraseña</Label>
            <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete="current-password" />
          </div>
          <Button type="submit" disabled={loading} className="w-full rounded-2xl bg-gradient-to-r from-mauve to-mauve-soft text-primary-foreground hover:opacity-95">
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Entrar
          </Button>
        </form>

        <div className="my-4 flex items-center gap-3 text-[11px] uppercase tracking-wider text-muted-foreground">
          <div className="h-px flex-1 bg-border" /> o continúa con <div className="h-px flex-1 bg-border" />
        </div>

        <Button type="button" variant="outline" onClick={handleGoogle} disabled={loading} className="w-full rounded-2xl">
          <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.83z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.83C6.71 7.31 9.14 5.38 12 5.38z"/></svg>
          Google
        </Button>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          ¿Necesitas una cuenta? Solicítala a tu administrador.
        </p>
        <p className="mt-2 text-center text-[10px] text-muted-foreground">
          <Link to="/auth" search={{}} className="underline">Ayuda</Link>
        </p>
      </div>
    </div>
  );
}
