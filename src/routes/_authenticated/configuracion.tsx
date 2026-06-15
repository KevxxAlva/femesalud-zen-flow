import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Settings, User as UserIcon, Building, Save, Loader2, Shield } from "lucide-react";
import { useAuthSession, useIsAdmin, useRoles } from "@/hooks/useAuth";
import { useMyProfile, useUpdateProfile } from "@/lib/api/profiles";
import { useClinicInfo, useUpdateClinicInfo } from "@/lib/api/clinic";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";

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
  const { data: clinic, isLoading: loadingClinic } = useClinicInfo();
  const updateClinic = useUpdateClinicInfo();

  // Profile Form State
  const [profileName, setProfileName] = useState("");
  const [profileSpecialty, setProfileSpecialty] = useState("");

  // Clinic Form State
  const [clinicName, setClinicName] = useState("");
  const [clinicAddress1, setClinicAddress1] = useState("");
  const [clinicAddress2, setClinicAddress2] = useState("");
  const [clinicPhone, setClinicPhone] = useState("");
  const [clinicRif, setClinicRif] = useState("");

  // Sync profile data when loaded
  useEffect(() => {
    if (profile) {
      setProfileName(profile.full_name || "");
      setProfileSpecialty(profile.specialty || "");
    }
  }, [profile]);

  // Sync clinic data when loaded
  useEffect(() => {
    if (clinic) {
      setClinicName(clinic.name || "");
      setClinicAddress1(clinic.address_line1 || "");
      setClinicAddress2(clinic.address_line2 || "");
      setClinicPhone(clinic.phone || "");
      setClinicRif(clinic.rif || "");
    }
  }, [clinic]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id) return;
    try {
      await updateProfile.mutateAsync({
        userId: user.id,
        fullName: profileName.trim(),
        specialty: profileSpecialty.trim() || null,
      });
      toast.success("Perfil actualizado correctamente");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al actualizar perfil");
    }
  };

  const handleSaveClinic = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateClinic.mutateAsync({
        name: clinicName.trim(),
        address_line1: clinicAddress1.trim(),
        address_line2: clinicAddress2.trim(),
        phone: clinicPhone.trim(),
        rif: clinicRif.trim(),
      });
      toast.success("Datos de la clínica actualizados");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al actualizar datos de la clínica");
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
  const isClinicLoading = loadingClinic || updateClinic.isPending;

  return (
    <div className="space-y-6 max-w-4xl mx-auto py-2">
      <header className="flex flex-col gap-1 ml-14 md:ml-0">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Ajustes Generales</p>
        <h1 className="text-2xl font-black text-foreground flex items-center gap-2">
          <Settings className="h-6 w-6 text-mauve animate-spin-slow" /> Configuración
        </h1>
      </header>

      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="grid w-full grid-cols-2 bg-muted/60 p-1 rounded-2xl mb-6 max-w-md">
          <TabsTrigger value="profile" className="rounded-xl font-medium text-xs flex items-center gap-1.5 py-2">
            <UserIcon className="h-3.5 w-3.5" /> Mi Perfil
          </TabsTrigger>
          <TabsTrigger
            value="clinic"
            className="rounded-xl font-medium text-xs flex items-center gap-1.5 py-2"
            disabled={!isAdmin && !loadingProfile}
          >
            <Building className="h-3.5 w-3.5" /> Datos de la Clínica
          </TabsTrigger>
        </TabsList>

        {/* TAB 1: USER PROFILE */}
        <TabsContent value="profile" className="outline-none space-y-4">
          <div className="bg-card/50 border border-border/40 rounded-3xl p-6 shadow-sm relative overflow-hidden backdrop-blur-sm">
            <div className="absolute right-0 top-0 w-32 h-32 bg-mauve/5 rounded-full blur-2xl -mr-10 -mt-10" />
            
            <form onSubmit={handleSaveProfile} className="space-y-6">
              {/* Profile Avatar Card */}
              <div className="flex flex-col sm:flex-row items-center gap-4 pb-4 border-b border-border/30">
                <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-mauve to-blush text-primary-foreground flex items-center justify-center font-bold text-xl shadow-md shadow-mauve/20">
                  {initials(profileName || user?.email)}
                </div>
                <div className="text-center sm:text-left">
                  <h3 className="font-bold text-sm text-foreground">{profileName || "Usuario FemeSalud"}</h3>
                  <p className="text-xs text-muted-foreground">{user?.email}</p>
                  <div className="flex items-center gap-1 justify-center sm:justify-start mt-1.5">
                    {roles.map((r) => (
                      <span
                        key={r}
                        className="px-2 py-0.5 rounded-md text-[9px] font-bold bg-mauve/10 text-mauve-foreground border border-mauve/15 uppercase flex items-center gap-0.5"
                      >
                        <Shield className="h-2.5 w-2.5" /> {r === "admin" ? "Administrador" : "Médico"}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Form Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="profile-name" className="text-xs font-bold text-muted-foreground uppercase">
                    Nombre Completo
                  </Label>
                  <Input
                    id="profile-name"
                    value={profileName}
                    onChange={(e) => setProfileName(e.target.value)}
                    required
                    disabled={isProfileLoading}
                    placeholder="Ej. Dra. Carli Solé Aquino"
                    className="rounded-xl h-10 border-border/40 focus:border-mauve focus:ring-mauve/10"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="profile-specialty" className="text-xs font-bold text-muted-foreground uppercase">
                    Especialidad / Cargo
                  </Label>
                  <Input
                    id="profile-specialty"
                    value={profileSpecialty}
                    onChange={(e) => setProfileSpecialty(e.target.value)}
                    disabled={isProfileLoading}
                    placeholder="Ej. Ginecología y Obstetricia"
                    className="rounded-xl h-10 border-border/40 focus:border-mauve focus:ring-mauve/10"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <Button
                  type="submit"
                  disabled={isProfileLoading}
                  className="rounded-xl bg-gradient-to-r from-mauve to-mauve-soft text-primary-foreground hover:opacity-95 shadow-sm shadow-mauve/25 cursor-pointer h-10 px-5 flex items-center gap-1.5 font-semibold text-xs"
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

        {/* TAB 2: CLINIC DETAILS */}
        {isAdmin && (
          <TabsContent value="clinic" className="outline-none space-y-4">
            <div className="bg-card/50 border border-border/40 rounded-3xl p-6 shadow-sm relative overflow-hidden backdrop-blur-sm">
              <div className="absolute right-0 top-0 w-32 h-32 bg-mauve/5 rounded-full blur-2xl -mr-10 -mt-10" />

              <form onSubmit={handleSaveClinic} className="space-y-6">
                <div className="pb-2 border-b border-border/30">
                  <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
                    <Building className="h-4 w-4 text-mauve" /> Datos Generales de la Clínica
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Esta información aparecerá impresa en los récipes, constancias y facturas generadas por el sistema.
                  </p>
                </div>

                {/* Form Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="clinic-name" className="text-xs font-bold text-muted-foreground uppercase">
                      Nombre Comercial
                    </Label>
                    <Input
                      id="clinic-name"
                      value={clinicName}
                      onChange={(e) => setClinicName(e.target.value)}
                      required
                      disabled={isClinicLoading}
                      placeholder="Ej. Femesalud"
                      className="rounded-xl h-10 border-border/40 focus:border-mauve focus:ring-mauve/10"
                    />
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="clinic-address1" className="text-xs font-bold text-muted-foreground uppercase">
                      Dirección (Línea 1)
                    </Label>
                    <Input
                      id="clinic-address1"
                      value={clinicAddress1}
                      onChange={(e) => setClinicAddress1(e.target.value)}
                      required
                      disabled={isClinicLoading}
                      placeholder="Ej. Calle las Flores entre González Padrón y Shettino, Número 16."
                      className="rounded-xl h-10 border-border/40 focus:border-mauve focus:ring-mauve/10"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="clinic-address2" className="text-xs font-bold text-muted-foreground uppercase">
                      Dirección (Línea 2 - Ciudad, Estado)
                    </Label>
                    <Input
                      id="clinic-address2"
                      value={clinicAddress2}
                      onChange={(e) => setClinicAddress2(e.target.value)}
                      required
                      disabled={isClinicLoading}
                      placeholder="Ej. Valle de la Pascua, Estado Guárico."
                      className="rounded-xl h-10 border-border/40 focus:border-mauve focus:ring-mauve/10"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="clinic-phone" className="text-xs font-bold text-muted-foreground uppercase">
                      Teléfonos de Contacto
                    </Label>
                    <Input
                      id="clinic-phone"
                      value={clinicPhone}
                      onChange={(e) => setClinicPhone(e.target.value)}
                      required
                      disabled={isClinicLoading}
                      placeholder="Ej. 0412/8299890 0424/4609387"
                      className="rounded-xl h-10 border-border/40 focus:border-mauve focus:ring-mauve/10"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="clinic-rif" className="text-xs font-bold text-muted-foreground uppercase">
                      Registro de Información Fiscal (RIF)
                    </Label>
                    <Input
                      id="clinic-rif"
                      value={clinicRif}
                      onChange={(e) => setClinicRif(e.target.value)}
                      required
                      disabled={isClinicLoading}
                      placeholder="Ej. J-12345678-9"
                      className="rounded-xl h-10 border-border/40 focus:border-mauve focus:ring-mauve/10"
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <Button
                    type="submit"
                    disabled={isClinicLoading}
                    className="rounded-xl bg-gradient-to-r from-mauve to-mauve-soft text-primary-foreground hover:opacity-95 shadow-sm shadow-mauve/25 cursor-pointer h-10 px-5 flex items-center gap-1.5 font-semibold text-xs"
                  >
                    {isClinicLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Save className="h-4 w-4" />
                    )}
                    Guardar Datos Clínicos
                  </Button>
                </div>
              </form>
            </div>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
