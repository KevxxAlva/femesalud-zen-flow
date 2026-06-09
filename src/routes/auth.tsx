import { useState, useEffect } from "react";
import { createFileRoute, useRouter } from "@tanstack/react-router";
import { Heart, Loader2, Eye, EyeOff, Headphones, ChevronLeft, ChevronRight } from "lucide-react";
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
  const [mode, setMode] = useState<"login" | "bootstrap">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) router.navigate({ to: "/", replace: true });
    });
  }, [router]);

  // Auto-rotate slides on the right side
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 6000);
    return () => clearInterval(timer);
  }, []);

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
      email,
      password,
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
      setMode("login");
    }
  };

  const handleSocialLogin = (provider: "google" | "facebook") => {
    toast.info(`Iniciando conexión con ${provider === "google" ? "Google" : "Facebook"}...`);
    supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/`,
      },
    }).catch((err) => {
      toast.error(err.message || "Error al conectar proveedor social");
    });
  };

  const slides = [
    {
      title: "Gestiona tu agenda sin esfuerzo",
      description: "Asigna turnos, envía recordatorios automáticos y evita inasistencias en tu consulta.",
      buttonText: "Ver agenda",
      badge: "Agenda Inteligente",
      featureTitle: "Agenda y Citas en Tiempo Real",
      featureDesc: "La sincronización instantánea permite a tu equipo administrativo y médico estar coordinados en todo momento.",
    },
    {
      title: "Historias Clínicas Premium",
      description: "Accede al historial de tus pacientes, recetas previas y archivos adjuntos desde cualquier dispositivo.",
      buttonText: "Ver pacientes",
      badge: "Ficha Médica Digital",
      featureTitle: "Historial Clínico Unificado",
      featureDesc: "Toda la información médica de tus pacientes protegida con encriptación de nivel clínico y accesibilidad instantánea.",
    },
    {
      title: "Facturación y Reportes Clave",
      description: "Monitorea tus ingresos diarios, mensuales y el estado de pagos de consultas de forma clara.",
      buttonText: "Ver reportes",
      badge: "Finanzas Médicas",
      featureTitle: "Métricas y Análisis de Crecimiento",
      featureDesc: "Toma decisiones basadas en datos reales. Analiza el rendimiento de tu clínica y optimiza la atención.",
    }
  ];

  const renderSlideVisual = (index: number) => {
    switch (index) {
      case 0: // Agenda
        return (
          <div className="relative w-full h-[220px] bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-100 dark:border-zinc-800 p-5 shadow-xl select-none animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
                <div className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
                <div className="w-2.5 h-2.5 rounded-full bg-green-400" />
              </div>
              <span className="text-[10px] font-bold text-[#A855F7] bg-[#A855F7]/10 px-2 py-0.5 rounded-full">Hoy</span>
            </div>
            
            <div className="space-y-2.5">
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100/30 dark:border-zinc-800/30">
                <div className="flex items-center gap-2.5">
                  <div className="w-1.5 h-7 rounded-full bg-[#A855F7]" />
                  <div className="text-left">
                    <p className="text-[11px] font-bold text-zinc-800 dark:text-zinc-200">Dra. Sofía Ramos</p>
                    <p className="text-[9px] text-zinc-400">Ginecología • Consulta</p>
                  </div>
                </div>
                <span className="text-[9px] font-semibold text-zinc-500 bg-zinc-100 dark:bg-zinc-700 px-2 py-0.5 rounded-md">14:30</span>
              </div>
              
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100/30 dark:border-zinc-800/30">
                <div className="flex items-center gap-2.5">
                  <div className="w-1.5 h-7 rounded-full bg-[#A855F7]/40" />
                  <div className="text-left">
                    <p className="text-[11px] font-bold text-zinc-800 dark:text-zinc-200">Dr. Carlos Mendoza</p>
                    <p className="text-[9px] text-zinc-400">Pediatría • Control</p>
                  </div>
                </div>
                <span className="text-[9px] font-semibold text-zinc-500 bg-zinc-100 dark:bg-zinc-700 px-2 py-0.5 rounded-md">15:15</span>
              </div>
            </div>
            
            {/* Overlapping floating card */}
            <div className="absolute -bottom-4 -right-2 bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-2xl p-2.5 shadow-xl flex items-center gap-2.5 animate-bounce-slow">
              <div className="w-7 h-7 rounded-lg bg-[#A855F7]/10 flex items-center justify-center text-[#A855F7]">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <div className="text-left">
                <p className="text-[9px] text-zinc-400 font-medium">Pacientes hoy</p>
                <p className="text-[11px] font-bold text-zinc-800 dark:text-zinc-200">18 Citas</p>
              </div>
            </div>
          </div>
        );
        
      case 1: // Historias
        return (
          <div className="relative w-full h-[220px] bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-100 dark:border-zinc-800 p-5 shadow-xl select-none animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-3 mb-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-[#A855F7]/10 flex items-center justify-center text-[#A855F7] font-semibold text-[10px]">MG</div>
                <div className="text-left">
                  <p className="text-[11px] font-bold text-zinc-800 dark:text-zinc-200">María González</p>
                  <p className="text-[8px] text-zinc-400">ID: FS-9082 • 28 años</p>
                </div>
              </div>
              <span className="text-[8px] font-bold text-green-500 bg-green-500/10 px-2 py-0.5 rounded-full">Activo</span>
            </div>
            
            <div className="space-y-2 text-left">
              <div>
                <p className="text-[8px] font-medium text-zinc-400 uppercase tracking-wider">Diagnóstico Principal</p>
                <p className="text-[10px] font-bold text-zinc-700 dark:text-zinc-300">Migraña tensional recurrente</p>
              </div>
              <div>
                <p className="text-[8px] font-medium text-zinc-400 uppercase tracking-wider">Tratamiento Indicado</p>
                <p className="text-[10px] font-bold text-zinc-700 dark:text-zinc-300">Monitoreo de estrés + Analgésico condicionado</p>
              </div>
              <div className="flex items-center gap-2 pt-1">
                <span className="text-[8px] bg-zinc-100 dark:bg-zinc-800 text-zinc-500 font-semibold px-2 py-0.5 rounded">Sangre: O+</span>
                <span className="text-[8px] bg-red-500/10 text-red-500 font-semibold px-2 py-0.5 rounded">Alergia: Penicilina</span>
              </div>
            </div>
            
            {/* Overlapping floating card */}
            <div className="absolute -bottom-4 -right-2 bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-2xl p-2.5 shadow-xl flex items-center gap-2.5 animate-bounce-slow">
              <div className="w-7 h-7 rounded-lg bg-green-500/10 flex items-center justify-center text-green-500">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <div className="text-left">
                <p className="text-[9px] text-zinc-400 font-medium">Historial Clínico</p>
                <p className="text-[11px] font-bold text-zinc-800 dark:text-zinc-200">Protegido</p>
              </div>
            </div>
          </div>
        );
        
      case 2: // Facturas
        return (
          <div className="relative w-full h-[220px] bg-gradient-to-tr from-[#A855F7] to-[#7c3aed] rounded-3xl p-5 shadow-xl text-white select-none animate-in fade-in slide-in-from-bottom-4 duration-500 flex flex-col justify-between">
            <div className="flex items-start justify-between">
              <div className="text-left">
                <p className="text-[9px] uppercase tracking-wider opacity-70">FemeSalud Suite</p>
                <p className="text-xs font-bold mt-0.5">Control Financiero Premium</p>
              </div>
              {/* Metallic Chip */}
              <div className="w-8 h-6 bg-gradient-to-br from-yellow-300 via-yellow-400 to-yellow-600 rounded-md shadow-sm border border-yellow-200/50 flex flex-col justify-between p-0.5 overflow-hidden">
                <div className="grid grid-cols-3 gap-0.5 opacity-30 h-full">
                  <div className="border border-zinc-950/20" />
                  <div className="border border-zinc-950/20" />
                  <div className="border border-zinc-950/20" />
                  <div className="border border-zinc-950/20" />
                  <div className="border border-zinc-950/20" />
                  <div className="border border-zinc-950/20" />
                </div>
              </div>
            </div>
            
            <div className="text-left my-1">
              <p className="text-base font-mono tracking-widest">**** **** **** 2026</p>
            </div>
            
            <div className="flex justify-between items-end">
              <div className="text-left">
                <p className="text-[8px] uppercase opacity-70">Médico Suscriptor</p>
                <p className="text-[10px] font-bold font-mono">DRA. KATHERINE M.</p>
              </div>
              <div className="text-right">
                <p className="text-[8px] uppercase opacity-70">Registro</p>
                <p className="text-[10px] font-bold font-mono">12/28</p>
              </div>
            </div>
            
            {/* Overlapping floating card */}
            <div className="absolute -bottom-4 -right-2 bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-2xl p-2.5 shadow-xl flex items-center gap-2.5 text-zinc-800 dark:text-zinc-100 animate-bounce-slow">
              <div className="w-7 h-7 rounded-lg bg-[#A855F7]/10 flex items-center justify-center text-[#A855F7]">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="text-left">
                <p className="text-[9px] text-zinc-400 font-medium">Ingresos hoy</p>
                <p className="text-[11px] font-bold">$350.40</p>
              </div>
            </div>
          </div>
        );
        
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen w-full flex bg-background font-sans">
      {/* Left side: Login/Register Form */}
      <div className="w-full md:w-[50%] lg:w-[45%] flex flex-col justify-between p-8 sm:p-12 lg:p-16 bg-white dark:bg-zinc-950">
        
        {/* Top brand logo */}
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#A855F7]/10 text-[#A855F7] shadow-sm">
            <Heart className="h-5 w-5" fill="currentColor" />
          </div>
          <span className="font-display font-bold text-xl tracking-tight text-zinc-950 dark:text-white">
            feme<span className="text-[#A855F7]">salud</span>
          </span>
        </div>

        {/* Form Body Container */}
        <div className="my-auto py-8 max-w-[360px] w-full mx-auto">
          {mode === "login" ? (
            <>
              <h2 className="font-display text-3xl font-bold tracking-tight text-zinc-900 dark:text-white">Sign in</h2>
              <p className="text-sm text-zinc-400 mt-2">
                ¿Primer administrador?{" "}
                <button
                  type="button"
                  onClick={() => setMode("bootstrap")}
                  className="text-[#A855F7] font-semibold hover:underline bg-transparent border-0 p-0 cursor-pointer"
                >
                  Crear ahora
                </button>
              </p>

              <form onSubmit={handleLogin} className="mt-8 space-y-5">
                <div className="space-y-1.5 text-left">
                  <Label htmlFor="email" className="text-zinc-500 font-medium text-xs">E-mail</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="ejemplo@gmail.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoComplete="email"
                    className="rounded-2xl border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 px-4 py-3 h-11 focus-visible:ring-2 focus-visible:ring-[#A855F7] transition-all"
                  />
                </div>

                <div className="space-y-1.5 text-left">
                  <Label htmlFor="password" className="text-zinc-500 font-medium text-xs">Password</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      autoComplete="current-password"
                      className="rounded-2xl border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 px-4 py-3 pr-10 h-11 focus-visible:ring-2 focus-visible:ring-[#A855F7] transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 p-0 cursor-pointer bg-transparent border-0 flex items-center"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs pt-1">
                  <label className="flex items-center gap-2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      className="rounded border-zinc-300 dark:border-zinc-800 text-[#A855F7] focus:ring-[#A855F7] w-4 h-4 cursor-pointer"
                    />
                    <span>Remember me</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => toast.info("Comunícate con soporte para restablecer tu contraseña.")}
                    className="font-bold text-zinc-400 hover:text-[#A855F7] transition-colors bg-transparent border-0 cursor-pointer p-0"
                  >
                    Forgot Password?
                  </button>
                </div>

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full h-11 rounded-2xl bg-[#A855F7] hover:bg-[#9333EA] text-white font-semibold shadow-md shadow-purple-500/10 hover:shadow-purple-500/20 active:scale-[0.99] transition-all flex items-center justify-center gap-2 border-0"
                >
                  {loading ? <Loader2 className="h-4 w-4 animate-spin text-white" /> : "Sign in"}
                </Button>
              </form>
            </>
          ) : (
            <>
              <h2 className="font-display text-3xl font-bold tracking-tight text-zinc-900 dark:text-white">Primer Admin</h2>
              <p className="text-sm text-zinc-400 mt-2">
                ¿Ya tienes una cuenta?{" "}
                <button
                  type="button"
                  onClick={() => setMode("login")}
                  className="text-[#A855F7] font-semibold hover:underline bg-transparent border-0 p-0 cursor-pointer"
                >
                  Iniciar sesión
                </button>
              </p>

              <form onSubmit={handleBootstrap} className="mt-8 space-y-4">
                <div className="space-y-1.5 text-left">
                  <Label htmlFor="bfn" className="text-zinc-500 font-medium text-xs">Nombre completo</Label>
                  <Input
                    id="bfn"
                    placeholder="Dra. Katherine Mendoza"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                    className="rounded-2xl border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 px-4 py-3 h-11 focus-visible:ring-2 focus-visible:ring-[#A855F7] transition-all"
                  />
                </div>

                <div className="space-y-1.5 text-left">
                  <Label htmlFor="bem" className="text-zinc-500 font-medium text-xs">E-mail</Label>
                  <Input
                    id="bem"
                    type="email"
                    placeholder="admin@femesalud.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="rounded-2xl border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 px-4 py-3 h-11 focus-visible:ring-2 focus-visible:ring-[#A855F7] transition-all"
                  />
                </div>

                <div className="space-y-1.5 text-left">
                  <Label htmlFor="bpw" className="text-zinc-500 font-medium text-xs">Contraseña (mín. 8)</Label>
                  <div className="relative">
                    <Input
                      id="bpw"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      minLength={8}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="rounded-2xl border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 px-4 py-3 pr-10 h-11 focus-visible:ring-2 focus-visible:ring-[#A855F7] transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 p-0 cursor-pointer bg-transparent border-0 flex items-center"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full h-11 rounded-2xl bg-[#A855F7] hover:bg-[#9333EA] text-white font-semibold shadow-md shadow-purple-500/10 hover:shadow-purple-500/20 active:scale-[0.99] transition-all flex items-center justify-center gap-2 border-0 pt-1"
                >
                  {loading ? <Loader2 className="h-4 w-4 animate-spin text-white" /> : "Crear administrador"}
                </Button>
              </form>
            </>
          )}

          {/* Social login partition */}
          <div className="relative flex py-5 items-center">
            <div className="flex-grow border-t border-zinc-100 dark:border-zinc-800"></div>
            <span className="flex-shrink mx-4 text-[10px] text-zinc-400 font-bold uppercase tracking-wider">or</span>
            <div className="flex-grow border-t border-zinc-100 dark:border-zinc-800"></div>
          </div>

          {/* Social buttons */}
          <div className="space-y-3">
            <button
              type="button"
              onClick={() => handleSocialLogin("google")}
              className="w-full h-11 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 text-xs font-semibold shadow-sm transition-all flex items-center justify-center gap-3 cursor-pointer"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#EA4335"
                  d="M12.24 10.285V14.4h6.887c-.648 2.41-2.519 4.114-5.136 4.114-3.478 0-6.3-2.822-6.3-6.3s2.822-6.3 6.3-6.3c1.706 0 3.208.68 4.3 1.777l3.076-3.076C18.66 1.896 15.65 1 12.24 1c-6.076 0-11 4.924-11 11s4.924 11 11 11c5.87 0 10.87-4.223 10.87-11 0-.717-.078-1.417-.24-2.114H12.24z"
                />
              </svg>
              Continue with Google
            </button>

            <button
              type="button"
              onClick={() => handleSocialLogin("facebook")}
              className="w-full h-11 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 text-xs font-semibold shadow-sm transition-all flex items-center justify-center gap-3 cursor-pointer"
            >
              <svg className="w-4 h-4" fill="#1877F2" viewBox="0 0 24 24">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
              </svg>
              Continue with Facebook
            </button>
          </div>
        </div>

        {/* Footer info */}
        <div className="text-center text-[10px] text-zinc-400 font-medium">
          © {new Date().getFullYear()} FemeSalud. Todos los derechos reservados.
        </div>
      </div>

      {/* Right side: Image Showcase Carousel */}
      <div className="hidden md:flex md:w-[50%] lg:w-[55%] flex-col justify-between p-12 lg:p-16 relative overflow-hidden bg-gradient-to-br from-[#120422] via-[#240c42] to-[#3b0764] text-white">
        
        {/* Glow Effects */}
        <div className="absolute top-[-20%] left-[-20%] w-[80%] h-[80%] bg-[#A855F7]/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-[#A855F7]/15 rounded-full blur-[100px] pointer-events-none" />

        {/* Top bar */}
        <div className="flex justify-end z-10">
          <button
            onClick={() => toast.success("Soporte FemeSalud iniciado. Escríbenos a soporte@femesalud.com")}
            className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 transition-all text-xs font-semibold cursor-pointer"
          >
            <Headphones className="w-3.5 h-3.5 text-[#A855F7]" />
            <span>Support</span>
          </button>
        </div>

        {/* Mid section: Visual Card Showcase */}
        <div className="my-auto max-w-[440px] mx-auto w-full z-10 flex flex-col items-center">
          
          {/* Card Presentation Frame */}
          <div className="w-full relative mb-12 px-6">
            {renderSlideVisual(currentSlide)}
          </div>

          {/* Text content details */}
          <div className="text-left w-full space-y-4 px-2 min-h-[140px]">
            <span className="text-[10px] uppercase font-bold tracking-widest text-[#A855F7] bg-[#A855F7]/10 border border-[#A855F7]/20 px-3 py-1 rounded-full">
              {slides[currentSlide].badge}
            </span>
            <h3 className="font-display text-2xl font-bold tracking-tight text-white mt-2 leading-tight">
              {slides[currentSlide].title}
            </h3>
            <p className="text-xs text-purple-200/70 font-medium leading-relaxed">
              {slides[currentSlide].description}
            </p>
          </div>
        </div>

        {/* Bottom bar: Carousel Indicators */}
        <div className="flex items-center justify-between z-10 w-full">
          {/* Slide Description info */}
          <div className="text-left hidden lg:block max-w-[280px]">
            <p className="text-[10px] font-bold text-purple-300/60 uppercase tracking-wider">
              {slides[currentSlide].featureTitle}
            </p>
            <p className="text-[9px] text-purple-300/40 mt-1 leading-normal font-medium">
              {slides[currentSlide].featureDesc}
            </p>
          </div>

          {/* Indicators dots & navigation */}
          <div className="flex items-center gap-4 ml-auto">
            {/* Dots */}
            <div className="flex gap-2">
              {slides.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentSlide(i)}
                  className={`h-2 rounded-full cursor-pointer transition-all border-0 p-0 ${
                    i === currentSlide ? "w-5 bg-[#A855F7]" : "w-2 bg-white/20 hover:bg-white/40"
                  }`}
                  aria-label={`Ir al slide ${i + 1}`}
                />
              ))}
            </div>

            {/* Arrows */}
            <div className="flex items-center gap-1.5 border border-white/5 bg-white/5 rounded-xl p-0.5">
              <button
                onClick={() => setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length)}
                className="w-7 h-7 rounded-lg hover:bg-white/10 flex items-center justify-center text-white/70 hover:text-white transition-all bg-transparent border-0 cursor-pointer"
                aria-label="Slide anterior"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setCurrentSlide((prev) => (prev + 1) % slides.length)}
                className="w-7 h-7 rounded-lg hover:bg-white/10 flex items-center justify-center text-white/70 hover:text-white transition-all bg-transparent border-0 cursor-pointer"
                aria-label="Siguiente slide"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

