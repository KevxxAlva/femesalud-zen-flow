import { useState, useEffect } from "react";
import { createFileRoute, useRouter } from "@tanstack/react-router";
import { Heart, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";

export const Route = createFileRoute("/auth")({
  ssr: false,
  head: () => ({ meta: [{ title: "Iniciar sesión — FemeSalud" }] }),
  component: AuthPage,
});

function AuthPage() {
  const router = useRouter();
  const [tab, setTab] = useState<"login" | "bootstrap">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
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
    if (error) return toast.error(error.message);
    toast.success("Bienvenido a FemeSalud");
    router.navigate({ to: "/", replace: true });
  };

  const handleBootstrap = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email, password,
      options: {
        data: { full_name: fullName },
        emailRedirectTo: `${window.location.origin}/`,
      },
    });
    setLoading(false);
    if (error) return toast.error(error.message);
    if (data.session) {
      toast.success("Cuenta de administrador creada");
      router.navigate({ to: "/", replace: true });
    } else {
      toast.success("Cuenta creada. Revisa tu email para confirmar e inicia sesión.");
      setTab("login");
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

        <Tabs value={tab} onValueChange={(v) => setTab(v as "login" | "bootstrap")} className="mt-6">
          <TabsList className="grid w-full grid-cols-2 rounded-2xl">
            <TabsTrigger value="login" className="rounded-xl">Iniciar sesión</TabsTrigger>
            <TabsTrigger value="bootstrap" className="rounded-xl">Primer admin</TabsTrigger>
          </TabsList>

          <TabsContent value="login" className="mt-5">
            <p className="text-sm text-muted-foreground">
              Las cuentas son creadas por un administrador.
            </p>
            <form onSubmit={handleLogin} className="mt-4 space-y-4">
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
          </TabsContent>

          <TabsContent value="bootstrap" className="mt-5">
            <p className="text-sm text-muted-foreground">
              Crea la <strong>primera</strong> cuenta del sistema. Quedará automáticamente como administrador.
              Una vez existan usuarios, no podrás crear más desde aquí — usa el módulo Doctores.
            </p>
            <form onSubmit={handleBootstrap} className="mt-4 space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="bfn">Nombre completo</Label>
                <Input id="bfn" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="bem">Email</Label>
                <Input id="bem" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="bpw">Contraseña (mín. 8)</Label>
                <Input id="bpw" type="password" minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} required />
              </div>
              <Button type="submit" disabled={loading} className="w-full rounded-2xl bg-gradient-to-r from-mauve to-mauve-soft text-primary-foreground hover:opacity-95">
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Crear administrador
              </Button>
            </form>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
