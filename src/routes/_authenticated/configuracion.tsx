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
  const [profileUniversity, setProfileUniversity] = useState("");
  const [profileMpps, setProfileMpps] = useState("");
  const [profileCmc, setProfileCmc] = useState("");

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
      setProfileUniversity(profile.university || "");
      setProfileMpps(profile.mpps || "");
      setProfileCmc(profile.cmc || "");
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
        university: profileUniversity.trim() || null,
        mpps: profileMpps.trim() || null,
        cmc: profileCmc.trim() || null,
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
    <div className="space-y-6 max-w-4xl mx-auto py-2 font-sans text-foreground">
      <header className="flex flex-col gap-1 ml-14 md:ml-0">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Ajustes Generales</p>
        <h1 className="text-primaryxl font-bold text-primary tracking-tight flex items-center gap-2">
          <Settings className="h-6 w-6 animate-spin-slow" /> Configuración
        </h1>
      </header>

      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="grid w-full grid-cols-2 bg-muted/50 p-1 rounded-2xl mb-6 max-w-md">
          <TabsTrigger value="profile" className="rounded-xl font-bold text-xs flex items-center gap-1.5 py-2.5 data-[state=active]:bg-card data-[state=active]:text-primary data-[state=active]:shadow-sm text-muted-foreground">
            <UserIcon className="h-4 w-4" /> Mi Perfil
          </TabsTrigger>
          <TabsTrigger
            value="clinic"
            className="rounded-xl font-bold text-xs flex items-center gap-1.5 py-2.5 data-[state=active]:bg-card data-[state=active]:text-primary data-[state=active]:shadow-sm text-muted-foreground"
            disabled={!isAdmin && !loadingProfile}
          >
            <Building className="h-4 w-4" /> Datos de la Clínica
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
                  {initials(profileName || user?.email)}
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

        {/* TAB 2: CLINIC DETAILS */}
        {isAdmin && (
          <TabsContent value="clinic" className="outline-none space-y-4">
            <div className="bg-card border border-border/40 rounded-[2rem] p-8 shadow-sm relative overflow-hidden">
              <div className="absolute right-0 top-0 w-32 h-32 bg-primary/5 rounded-full blur-2xl -mr-10 -mt-10" />

              <form onSubmit={handleSaveClinic} className="space-y-6">
                <div className="pb-4 border-b border-border/40">
                  <h3 className="font-bold text-lg text-foreground flex items-center gap-2">
                    <Building className="h-5 w-5 text-primary" /> Datos Generales de la Clínica
                  </h3>
                  <p className="text-xs text-muted-foreground font-medium mt-1">
                    Esta información aparecerá impresa en los récipes, constancias y facturas generadas por el sistema.
                  </p>
                </div>

                {/* Form Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="clinic-name" className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                      Nombre Comercial
                    </Label>
                    <Input
                      id="clinic-name"
                      value={clinicName}
                      onChange={(e) => setClinicName(e.target.value)}
                      required
                      disabled={isClinicLoading}
                      placeholder="Ej. Femesalud"
                      className="rounded-xl h-11 border-border/40 focus:border-[#4361ee] focus:ring-[#4361ee]/20 font-medium text-foreground shadow-sm"
                    />
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="clinic-address1" className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                      Dirección (Línea 1)
                    </Label>
                    <Input
                      id="clinic-address1"
                      value={clinicAddress1}
                      onChange={(e) => setClinicAddress1(e.target.value)}
                      required
                      disabled={isClinicLoading}
                      placeholder="Ej. Calle las Flores entre González Padrón y Shettino, Número 16."
                      className="rounded-xl h-11 border-border/40 focus:border-[#4361ee] focus:ring-[#4361ee]/20 font-medium text-foreground shadow-sm"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="clinic-address2" className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                      Dirección (Línea 2 - Ciudad, Estado)
                    </Label>
                    <Input
                      id="clinic-address2"
                      value={clinicAddress2}
                      onChange={(e) => setClinicAddress2(e.target.value)}
                      required
                      disabled={isClinicLoading}
                      placeholder="Ej. Valle de la Pascua, Estado Guárico."
                      className="rounded-xl h-11 border-border/40 focus:border-[#4361ee] focus:ring-[#4361ee]/20 font-medium text-foreground shadow-sm"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="clinic-phone" className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                      Teléfonos de Contacto
                    </Label>
                    <Input
                      id="clinic-phone"
                      value={clinicPhone}
                      onChange={(e) => setClinicPhone(e.target.value)}
                      required
                      disabled={isClinicLoading}
                      placeholder="Ej. 0412/8299890 0424/4609387"
                      className="rounded-xl h-11 border-border/40 focus:border-[#4361ee] focus:ring-[#4361ee]/20 font-medium text-foreground shadow-sm"
                    />
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="clinic-rif" className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                      Registro de Información Fiscal (RIF)
                    </Label>
                    <Input
                      id="clinic-rif"
                      value={clinicRif}
                      onChange={(e) => setClinicRif(e.target.value)}
                      required
                      disabled={isClinicLoading}
                      placeholder="Ej. J-12345678-9"
                      className="rounded-xl h-11 border-border/40 focus:border-[#4361ee] focus:ring-[#4361ee]/20 font-medium text-foreground shadow-sm"
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-4">
                  <Button
                    type="submit"
                    disabled={isClinicLoading}
                    className="rounded-xl bg-primary text-primary-foreground hover:bg-[#3451d6] shadow-sm h-11 px-6 flex items-center gap-2 font-bold text-sm"
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
