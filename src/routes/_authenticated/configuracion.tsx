import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Settings, User as UserIcon, Building, Save, Loader2, Shield, Search, ClipboardList } from "lucide-react";
import { useAuthSession, useIsAdmin, useRoles } from "@/hooks/useAuth";
import { useMyProfile, useUpdateProfile } from "@/lib/api/profiles";
import { useAuditLogs } from "@/lib/api/audit";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { RecipeDesigner } from "@/components/settings/RecipeDesigner";
import { FileText } from "lucide-react";

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
        <h1 className="text-primaryxl font-bold text-primary tracking-tight flex items-center gap-2">
          <Settings className="h-6 w-6 animate-spin-slow" /> Configuración
        </h1>
      </header>

      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 bg-muted/50 p-1 rounded-2xl mb-6 max-w-2xl h-auto flex-wrap">
          <TabsTrigger value="profile" className="rounded-xl font-bold text-xs flex items-center gap-1.5 py-2.5 data-[state=active]:bg-card data-[state=active]:text-primary data-[state=active]:shadow-sm text-muted-foreground">
            <UserIcon className="h-4 w-4" /> Mi Perfil
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
                <th className="p-4 font-bold border-b border-border/40">Fecha</th>
                <th className="p-4 font-bold border-b border-border/40">Usuario</th>
                <th className="p-4 font-bold border-b border-border/40">Acción</th>
                <th className="p-4 font-bold border-b border-border/40">Detalles</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {logs.map((log: any) => (
                <tr key={log.id} className="border-b border-border/40 hover:bg-muted/20 transition">
                  <td className="p-4 font-medium text-foreground">
                    {new Date(log.created_at).toLocaleString()}
                  </td>
                  <td className="p-4 text-muted-foreground">
                    {log.perfiles?.full_name || log.perfiles?.email || log.user_id}
                  </td>
                  <td className="p-4">
                    <span className="bg-destructive/10 text-destructive border border-red-100 text-[10px] font-bold px-2 py-1 rounded-full uppercase">
                      {log.action_type} {log.entity_type}
                    </span>
                  </td>
                  <td className="p-4 text-muted-foreground text-xs">
                    {log.details?.message || `ID: ${log.entity_id}`}
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
