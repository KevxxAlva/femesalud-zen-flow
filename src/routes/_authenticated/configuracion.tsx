import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { 
  Settings, User as UserIcon, Building, Save, Loader2, Shield, Search, ClipboardList, 
  FileText, Lock, KeyRound, ShieldCheck, CheckCircle2, AlertCircle, Eye, EyeOff, Trash2, Check 
} from "lucide-react";
import { useAuthSession, useIsAdmin, useRoles } from "@/hooks/useAuth";
import { useMyProfile, useUpdateProfile } from "@/lib/api/profiles";
import { useAuditLogs } from "@/lib/api/audit";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { RecipeDesigner } from "@/components/settings/RecipeDesigner";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { supabase } from "@/integrations/supabase/client";
import { removeQuickAccessAccount, saveQuickAccessAccount } from "@/lib/auth/quickAccess";

export const Route = createFileRoute("/_authenticated/configuracion")({
  head: () => ({ meta: [{ title: "Configuración — FemeSalud" }] }),
  component: ConfiguracionPage,
});

function ConfiguracionPage() {
  const { user } = useAuthSession();
  const { data: profile, isLoading: loadingProfile } = useMyProfile(user?.id);
  const { data: roles = [] } = useRoles();
  const isAdmin = useIsAdmin();

  const updateProfile = useUpdateProfile();

  // Profile Form State
  const [profileName, setProfileName] = useState("");
  const [profileSpecialty, setProfileSpecialty] = useState("");
  const [profileUniversity, setProfileUniversity] = useState("");
  const [profileMpps, setProfileMpps] = useState("");
  const [profileCmc, setProfileCmc] = useState("");

  // Sync profile data when loaded
  useEffect(() => {
    if (profile) {
      setProfileName(profile.full_name || "");
      setProfileSpecialty(profile.specialty || "");
      setProfileUniversity(profile.university || "");
      setProfileMpps(profile.mpps || "");
      setProfileCmc(profile.cmc || "");
    }
  }, [profile]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id) return;
    try {
      await updateProfile.mutateAsync({
        userId: user.id,
        fullName: profileName.trim(),
        specialty: profileSpecialty.trim() || null,
        university: profileUniversity.trim() || null,
        mpps: profileMpps.trim() || null,
        cmc: profileCmc.trim() || null,
      });
      toast.success("Perfil actualizado correctamente");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al actualizar perfil");
    }
  };

  const initials = (name: string) => {
    return (name || "?")
      .split(" ")
      .map((n) => n[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();
  };

  const isProfileLoading = loadingProfile || updateProfile.isPending;

  return (
    <div className="space-y-6 max-w-4xl mx-auto py-2 font-sans text-foreground">
      <header className="flex flex-col gap-1 ml-14 md:ml-0">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Ajustes Generales</p>
        <h1 className="text-2xl font-bold text-primary tracking-tight flex items-center gap-2">
          <Settings className="h-6 w-6 animate-spin-slow" /> Configuración
        </h1>
      </header>

      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 bg-muted/50 p-1 rounded-2xl mb-6 max-w-2xl h-auto flex-wrap">
          <TabsTrigger value="profile" className="rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 py-2.5 data-[state=active]:bg-card data-[state=active]:text-primary data-[state=active]:shadow-sm text-muted-foreground">
            <UserIcon className="h-4 w-4" /> Mi Perfil
          </TabsTrigger>
          <TabsTrigger
            value="security"
            className="rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 py-2.5 data-[state=active]:bg-card data-[state=active]:text-primary data-[state=active]:shadow-sm text-muted-foreground"
          >
            <Lock className="h-4 w-4" /> Seguridad
          </TabsTrigger>
          <TabsTrigger
            value="audit"
            className="rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 py-2.5 data-[state=active]:bg-card data-[state=active]:text-primary data-[state=active]:shadow-sm text-muted-foreground"
            disabled={!isAdmin && !loadingProfile}
          >
            <ClipboardList className="h-4 w-4" /> Auditoría
          </TabsTrigger>
          <TabsTrigger
            value="recipe"
            className="rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 py-2.5 data-[state=active]:bg-card data-[state=active]:text-primary data-[state=active]:shadow-sm text-muted-foreground"
            disabled={!isAdmin && !loadingProfile}
          >
            <FileText className="h-4 w-4" /> Recetario
          </TabsTrigger>
        </TabsList>

        {/* TAB 1: USER PROFILE */}
        <TabsContent value="profile" className="outline-none space-y-4">
          <div className="bg-card border border-border/40 rounded-[2rem] p-8 shadow-sm relative overflow-hidden">
            <div className="absolute right-0 top-0 w-32 h-32 bg-primary/5 rounded-full blur-2xl -mr-10 -mt-10" />
            
            <form onSubmit={handleSaveProfile} className="space-y-6">
              {/* Profile Avatar Card */}
              <div className="flex flex-col sm:flex-row items-center gap-4 pb-6 border-b border-border/40">
                <div className="h-20 w-20 rounded-[1.25rem] bg-muted/50 text-primary flex items-center justify-center font-black text-2xl shadow-sm border border-border/40">
                  {initials(profileName || user?.email || "")}
                </div>
                <div className="text-center sm:text-left">
                  <h3 className="font-bold text-lg text-foreground">{profileName || "Usuario FemeSalud"}</h3>
                  <p className="text-xs text-muted-foreground font-medium">{user?.email}</p>
                  <div className="flex items-center gap-2 justify-center sm:justify-start mt-2">
                    {roles.map((r) => (
                      <span
                        key={r}
                        className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-[#e8f0fe] text-primary uppercase flex items-center gap-1"
                      >
                        <Shield className="h-3 w-3" /> {r === "admin" ? "Administrador" : "Médico"}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Form Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="profile-name" className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                    Nombre Completo
                  </Label>
                  <Input
                    id="profile-name"
                    value={profileName}
                    onChange={(e) => setProfileName(e.target.value)}
                    required
                    disabled={isProfileLoading}
                    placeholder="Ej. Dra. Carli Solé Aquino"
                    className="rounded-xl h-11 border-border/40 focus:border-[#4361ee] focus:ring-[#4361ee]/20 font-medium text-foreground shadow-sm"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="profile-specialty" className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                    Especialidad / Cargo
                  </Label>
                  <Input
                    id="profile-specialty"
                    value={profileSpecialty}
                    onChange={(e) => setProfileSpecialty(e.target.value)}
                    disabled={isProfileLoading}
                    placeholder="Ej. Ginecología y Obstetricia"
                    className="rounded-xl h-11 border-border/40 focus:border-[#4361ee] focus:ring-[#4361ee]/20 font-medium text-foreground shadow-sm"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="profile-university" className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                    Universidad / Colegio
                  </Label>
                  <Input
                    id="profile-university"
                    value={profileUniversity}
                    onChange={(e) => setProfileUniversity(e.target.value)}
                    disabled={isProfileLoading}
                    placeholder="Ej. UC-CHET"
                    className="rounded-xl h-11 border-border/40 focus:border-[#4361ee] focus:ring-[#4361ee]/20 font-medium text-foreground shadow-sm"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="profile-mpps" className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                      MPPS
                    </Label>
                    <Input
                      id="profile-mpps"
                      value={profileMpps}
                      onChange={(e) => setProfileMpps(e.target.value)}
                      disabled={isProfileLoading}
                      placeholder="Ej. 102.927"
                      className="rounded-xl h-11 border-border/40 focus:border-[#4361ee] focus:ring-[#4361ee]/20 font-medium text-foreground shadow-sm"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="profile-cmc" className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                      CMC
                    </Label>
                    <Input
                      id="profile-cmc"
                      value={profileCmc}
                      onChange={(e) => setProfileCmc(e.target.value)}
                      disabled={isProfileLoading}
                      placeholder="Ej. 11.619"
                      className="rounded-xl h-11 border-border/40 focus:border-[#4361ee] focus:ring-[#4361ee]/20 font-medium text-foreground shadow-sm"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-4">
                <Button
                  type="submit"
                  disabled={isProfileLoading}
                  className="rounded-xl bg-primary text-primary-foreground hover:bg-[#3451d6] shadow-sm h-11 px-6 flex items-center gap-2 font-bold text-sm"
                >
                  {isProfileLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                  Guardar Perfil
                </Button>
              </div>
            </form>
          </div>
        </TabsContent>

        {/* TAB 2: SEGURIDAD */}
        <TabsContent value="security" className="outline-none space-y-4">
          <SecuritySection />
        </TabsContent>

        {/* TAB 3: AUDITORIA */}
        {isAdmin && (
          <TabsContent value="audit" className="outline-none space-y-4">
            <AuditLogSection />
          </TabsContent>
        )}
      
      {/* TAB 4: RECIPES */}
      <TabsContent value="recipe" className="outline-none space-y-4">
        <RecipeDesigner />
      </TabsContent>
      </Tabs>
    </div>
  );
}

function AuditLogSection() {
  const { data: logs = [], isLoading } = useAuditLogs(100);

  return (
    <div className="bg-card border border-border/40 rounded-[2rem] p-8 shadow-sm">
      <h2 className="text-xl font-bold text-primary mb-4 flex items-center gap-2">
        <Shield className="h-5 w-5" /> Registro de Actividades
      </h2>
      <p className="text-muted-foreground text-sm mb-6">
        Este es el registro de auditoría de las acciones críticas (como eliminaciones) realizadas por los usuarios.
      </p>

      {isLoading ? (
        <div className="flex justify-center p-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
      ) : logs.length === 0 ? (
        <div className="text-center p-8 text-muted-foreground bg-muted/20 rounded-2xl">
          No hay registros de auditoría disponibles.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border/40">
          <table className="w-full text-left border-collapse whitespace-nowrap">
            <thead>
              <tr className="bg-muted/50 text-muted-foreground text-xs uppercase tracking-wider">
                <th className="p-4 font-bold border-b border-border/40">Created At (Fecha)</th>
                <th className="p-4 font-bold border-b border-border/40">Action (Acción)</th>
                <th className="p-4 font-bold border-b border-border/40">Table Name (Tabla)</th>
                <th className="p-4 font-bold border-b border-border/40">Record ID</th>
                <th className="p-4 font-bold border-b border-border/40">Usuario</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {logs.map((log: any) => (
                <tr key={log.id} className="border-b border-border/40 hover:bg-muted/20 transition">
                  <td className="p-4 font-medium text-foreground">
                    {new Date(log.created_at).toLocaleString()}
                  </td>
                  <td className="p-4">
                    <span className="bg-destructive/10 text-destructive border border-red-100 text-[10px] font-bold px-2 py-1 rounded-full uppercase">
                      {log.action_type}
                    </span>
                  </td>
                  <td className="p-4 text-muted-foreground">
                    {log.entity_type}
                  </td>
                  <td className="p-4 text-muted-foreground font-mono text-xs">
                    {log.entity_id}
                  </td>
                  <td className="p-4 text-muted-foreground">
                    {log.perfiles?.full_name || log.perfiles?.email || log.user_id}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function SecuritySection() {
  const { user } = useAuthSession();
  const [pin, setPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [showPin, setShowPin] = useState(false);
  const [savedPin, setSavedPin] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // Interactive PIN verification test
  const [testPin, setTestPin] = useState("");
  const [testResult, setTestResult] = useState<"success" | "error" | null>(null);

  // Load existing PIN
  useEffect(() => {
    const fetchExistingPin = async () => {
      // 1. Check user_metadata
      const metaPin = user?.user_metadata?.security_pin;
      if (metaPin) {
        setSavedPin(String(metaPin));
        return;
      }

      // 2. Check localStorage
      if (user?.id) {
        const localPin = localStorage.getItem(`femesalud_pin_${user.id}`);
        if (localPin) {
          setSavedPin(localPin);
          return;
        }
      }

      // 3. Check usuarios table
      if (user?.id) {
        const { data } = await supabase
          .from("usuarios")
          .select("pin_seguridad")
          .eq("auth_id", user.id)
          .maybeSingle();

        if (data?.pin_seguridad) {
          setSavedPin(data.pin_seguridad);
        }
      }
    };

    fetchExistingPin();
  }, [user]);

  const handleSavePin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pin.length !== 4 || !/^\d{4}$/.test(pin)) {
      toast.error("La clave debe tener exactamente 4 dígitos numéricos.");
      return;
    }
    if (pin !== confirmPin) {
      toast.error("Las claves ingresadas no coinciden.");
      return;
    }

    setLoading(true);
    try {
      // 1. Update Supabase Auth user metadata
      await supabase.auth.updateUser({
        data: { security_pin: pin },
      });

      // 2. Update public.usuarios table
      if (user?.id) {
        await supabase
          .from("usuarios")
          .update({ pin_seguridad: pin })
          .eq("auth_id", user.id);

        localStorage.setItem(`femesalud_pin_${user.id}`, pin);

        // Update device quick access vault
        try {
          await saveQuickAccessAccount({
            userId: user.id,
            email: user.email || "",
            fullName: user.user_metadata?.full_name || user.email?.split("@")[0] || "Usuario",
            pin,
          });
        } catch {
          // vault will register on next login
        }
      }

      setSavedPin(pin);
      setPin("");
      setConfirmPin("");
      setIsEditing(false);
      setTestPin("");
      setTestResult(null);
      toast.success("¡Clave de 4 dígitos guardada con éxito!");
    } catch (err: any) {
      toast.error(err?.message || "Error al guardar la clave");
    } finally {
      setLoading(false);
    }
  };

  const handleRemovePin = async () => {
    if (!confirm("¿Estás seguro de que deseas eliminar tu clave de seguridad de 4 dígitos?")) return;

    setLoading(true);
    try {
      await supabase.auth.updateUser({
        data: { security_pin: null },
      });

      if (user?.id) {
        await supabase
          .from("usuarios")
          .update({ pin_seguridad: null })
          .eq("auth_id", user.id);

        localStorage.removeItem(`femesalud_pin_${user.id}`);
        removeQuickAccessAccount(user.id);
      }

      setSavedPin(null);
      setPin("");
      setConfirmPin("");
      setIsEditing(false);
      setTestPin("");
      setTestResult(null);
      toast.success("Clave de seguridad eliminada.");
    } catch (err: any) {
      toast.error(err?.message || "Error al eliminar la clave");
    } finally {
      setLoading(false);
    }
  };

  const handleTestPinChange = (val: string) => {
    const cleanVal = val.replace(/\D/g, "");
    setTestPin(cleanVal);
    if (cleanVal.length === 4) {
      if (cleanVal === savedPin) {
        setTestResult("success");
        toast.success("¡Clave correcta! ✅");
      } else {
        setTestResult("error");
        toast.error("Clave incorrecta ❌");
      }
    } else {
      setTestResult(null);
    }
  };

  return (
    <div className="bg-card border border-border/40 rounded-[2rem] p-8 shadow-sm relative overflow-hidden space-y-6">
      <div className="flex items-center justify-between pb-4 border-b border-border/40 flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
            <KeyRound className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-foreground">Clave de Seguridad</h2>
            <p className="text-xs text-muted-foreground">Protección con PIN numérico de 4 dígitos</p>
          </div>
        </div>

        {savedPin ? (
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
            <CheckCircle2 className="h-3.5 w-3.5" /> Clave Activa
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-amber-500/10 text-amber-600 border border-amber-500/20">
            <AlertCircle className="h-3.5 w-3.5" /> Sin Configurar
          </span>
        )}
      </div>

      {/* If PIN already exists and user is not currently editing */}
      {savedPin && !isEditing ? (
        <div className="space-y-6">
          <div className="bg-muted/40 p-5 rounded-2xl border border-border/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <p className="text-sm font-bold text-foreground flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-emerald-500" /> Clave de 4 dígitos establecida
              </p>
              <p className="text-xs text-muted-foreground">
                Tu cuenta está protegida. Puedes cambiar tu clave o probar que funcione correctamente en cualquier momento.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEditing(true)}
                className="rounded-xl font-bold text-xs"
              >
                Cambiar Clave
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleRemovePin}
                disabled={loading}
                className="text-destructive hover:bg-destructive/10 rounded-xl font-bold text-xs"
              >
                <Trash2 className="h-3.5 w-3.5 mr-1" /> Eliminar
              </Button>
            </div>
          </div>

          {/* Quick interactive test area */}
          <div className="bg-card p-5 rounded-2xl border border-border/40 space-y-3">
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              Probar mi clave de seguridad
            </p>
            <div className="flex items-center gap-4 flex-wrap">
              <InputOTP
                maxLength={4}
                value={testPin}
                onChange={handleTestPinChange}
              >
                <InputOTPGroup>
                  <InputOTPSlot index={0} className="w-11 h-12 text-lg font-bold" />
                  <InputOTPSlot index={1} className="w-11 h-12 text-lg font-bold" />
                  <InputOTPSlot index={2} className="w-11 h-12 text-lg font-bold" />
                  <InputOTPSlot index={3} className="w-11 h-12 text-lg font-bold" />
                </InputOTPGroup>
              </InputOTP>

              {testResult === "success" && (
                <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                  <Check className="h-4 w-4" /> ¡Clave correcta!
                </span>
              )}
              {testResult === "error" && (
                <span className="text-xs font-bold text-destructive">
                  Clave incorrecta
                </span>
              )}
            </div>
            <p className="text-[11px] text-muted-foreground">
              Ingresa tus 4 dígitos aquí para confirmar que los recuerdas.
            </p>
          </div>
        </div>
      ) : (
        /* Form to set or change PIN */
        <form onSubmit={handleSavePin} className="space-y-6 max-w-md">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center justify-between">
                <span>Nueva Clave de 4 Dígitos</span>
                <button
                  type="button"
                  onClick={() => setShowPin(!showPin)}
                  className="text-muted-foreground hover:text-foreground text-[11px] flex items-center gap-1 font-semibold"
                >
                  {showPin ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                  {showPin ? "Ocultar" : "Mostrar"}
                </button>
              </Label>
              <InputOTP
                maxLength={4}
                value={pin}
                onChange={(val) => setPin(val.replace(/\D/g, ""))}
              >
                <InputOTPGroup>
                  <InputOTPSlot index={0} className="w-12 h-14 text-xl font-bold" />
                  <InputOTPSlot index={1} className="w-12 h-14 text-xl font-bold" />
                  <InputOTPSlot index={2} className="w-12 h-14 text-xl font-bold" />
                  <InputOTPSlot index={3} className="w-12 h-14 text-xl font-bold" />
                </InputOTPGroup>
              </InputOTP>
              <p className="text-[11px] text-muted-foreground">
                Ingresa exactamente 4 números (ej. 1234).
              </p>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                Confirmar Clave de 4 Dígitos
              </Label>
              <InputOTP
                maxLength={4}
                value={confirmPin}
                onChange={(val) => setConfirmPin(val.replace(/\D/g, ""))}
              >
                <InputOTPGroup>
                  <InputOTPSlot index={0} className="w-12 h-14 text-xl font-bold" />
                  <InputOTPSlot index={1} className="w-12 h-14 text-xl font-bold" />
                  <InputOTPSlot index={2} className="w-12 h-14 text-xl font-bold" />
                  <InputOTPSlot index={3} className="w-12 h-14 text-xl font-bold" />
                </InputOTPGroup>
              </InputOTP>
            </div>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <Button
              type="submit"
              disabled={loading || pin.length !== 4 || confirmPin.length !== 4}
              className="rounded-xl bg-primary text-primary-foreground font-bold px-6 h-11"
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Guardar Clave de 4 Dígitos
            </Button>

            {isEditing && (
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  setIsEditing(false);
                  setPin("");
                  setConfirmPin("");
                }}
                className="rounded-xl font-bold text-xs"
              >
                Cancelar
              </Button>
            )}
          </div>
        </form>
      )}
    </div>
  );
}

