import { useState, useRef, useEffect } from "react";
import { useClinicInfo, useUpdateClinicInfo } from "@/lib/api/clinic";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Upload, Loader2, Save, Eye, Palette } from "lucide-react";
import { cn } from "@/lib/utils";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export function RecipeDesigner() {
  const { data: clinic, isLoading } = useClinicInfo();
  const updateClinic = useUpdateClinicInfo();
  
  const [logoBase64, setLogoBase64] = useState("");
  const [primaryColor, setPrimaryColor] = useState("#008080"); // default teal
  const [fontFamily, setFontFamily] = useState("font-serif"); // default to serif as requested
  const [headerText, setHeaderText] = useState("");
  
  // Clinic general details that appear in header
  const [clinicName, setClinicName] = useState("");
  const [clinicType, setClinicType] = useState("");
  const [addressLine1, setAddressLine1] = useState("");
  const [addressLine2, setAddressLine2] = useState("");
  const [clinicPhone, setClinicPhone] = useState("");
  const [clinicRif, setClinicRif] = useState("");
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync state when data loads
  useEffect(() => {
    if (clinic) {
      setLogoBase64(clinic.recipe_logo_url || "");
      setPrimaryColor(clinic.recipe_primary_color || "#008080");
      setFontFamily(clinic.recipe_font_family || "font-serif");
      setHeaderText(clinic.recipe_header_text || "");
      
      setClinicName(clinic.name || "");
      setClinicType(clinic.recipe_clinic_type || "Consultorio Ginecológico Obstétrico");
      setAddressLine1(clinic.address_line1 || "");
      setAddressLine2(clinic.address_line2 || "");
      setClinicPhone(clinic.phone || "");
      setClinicRif(clinic.rif || "");
    }
  }, [clinic]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check size (max 1MB)
    if (file.size > 1024 * 1024) {
      toast.error("La imagen es muy pesada. Debe ser menor a 1MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setLogoBase64(event.target.result as string);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    try {
      await updateClinic.mutateAsync({
        name: clinicName,
        recipe_clinic_type: clinicType,
        address_line1: addressLine1,
        address_line2: addressLine2,
        phone: clinicPhone,
        rif: clinicRif,
        recipe_logo_url: logoBase64,
        recipe_primary_color: primaryColor,
        recipe_font_family: fontFamily,
        recipe_header_text: headerText,
      });
      toast.success("Configuración del recetario guardada con éxito");
    } catch (err: any) {
      toast.error("Error al guardar: Asegúrate de ejecutar el comando SQL de la base de datos.");
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex flex-col xl:flex-row gap-8 w-full animate-in fade-in zoom-in-95 duration-300">
      
      {/* LEFT PANEL: CONFIGURATION */}
      <div className="w-full xl:w-[450px] space-y-6 shrink-0">
        <div className="bg-card border border-border/40 rounded-[2rem] p-6 shadow-sm relative overflow-hidden">
          <div className="absolute right-0 top-0 w-32 h-32 bg-primary/5 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none" />
          
          <div className="flex items-center gap-3 mb-6 border-b border-border/40 pb-4 relative">
            <div className="p-2.5 bg-primary/10 rounded-xl text-primary">
              <Palette className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-foreground">Diseñador de Récipes</h2>
              <p className="text-xs text-muted-foreground">Personaliza la identidad visual</p>
            </div>
          </div>

          <div className="space-y-6 relative">
            
            {/* Logo Upload */}
            <div className="space-y-3">
              <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Logo del Documento</Label>
              <div 
                onClick={() => fileInputRef.current?.click()}
                className={cn(
                  "relative h-28 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-all overflow-hidden group",
                  logoBase64 ? "border-primary/50 bg-primary/5" : "border-border/50 hover:border-primary/50 hover:bg-muted"
                )}
              >
                {logoBase64 ? (
                  <>
                    <img src={logoBase64} alt="Logo" className="h-full object-contain p-4" />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <span className="text-white text-xs font-bold shadow-sm">Cambiar Imagen</span>
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col items-center gap-2 text-muted-foreground group-hover:text-primary transition-colors">
                    <Upload className="h-6 w-6" />
                    <span className="text-xs font-medium">Subir archivo (Max 1MB)</span>
                  </div>
                )}
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  className="hidden" 
                  accept="image/png, image/jpeg, image/svg+xml"
                  onChange={handleImageUpload}
                />
              </div>
              {logoBase64 && (
                <button onClick={() => setLogoBase64("")} className="text-[10px] text-destructive hover:underline font-bold mt-1">
                  Quitar logo
                </button>
              )}
            </div>

            {/* Color Picker */}
            <div className="space-y-3">
              <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Color Corporativo</Label>
              <div className="flex items-center gap-3">
                <div 
                  className="w-12 h-12 rounded-xl shadow-inner border-2 border-white overflow-hidden relative cursor-pointer ring-2 ring-border/50"
                  style={{ backgroundColor: primaryColor }}
                >
                  <input 
                    type="color" 
                    value={primaryColor} 
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    className="absolute inset-0 w-[200%] h-[200%] -top-2 -left-2 cursor-pointer opacity-0"
                  />
                </div>
                <Input 
                  value={primaryColor} 
                  onChange={(e) => setPrimaryColor(e.target.value)}
                  className="font-mono text-sm uppercase flex-1 rounded-xl bg-muted border-gray-200 h-12 text-foreground font-bold" 
                  maxLength={7}
                />
              </div>
            </div>

            {/* Font Family Selector */}
            <div className="space-y-3">
              <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Tipo de Letra (Fuente)</Label>
              <Select value={fontFamily} onValueChange={setFontFamily}>
                <SelectTrigger className="w-full h-11 rounded-xl bg-muted border-gray-200">
                  <SelectValue placeholder="Selecciona una fuente" />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="font-sans"><span className="font-sans">Moderna (Sans-serif)</span></SelectItem>
                  <SelectItem value="font-serif"><span className="font-serif">Clásica (Serif)</span></SelectItem>
                  <SelectItem value="font-mono"><span className="font-mono">Máquina de Escribir (Mono)</span></SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* General Header Fields */}
            <div className="space-y-4 bg-muted/30 p-4 rounded-xl border border-border/40">
              <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Datos Principales (Arriba)</Label>
              
              <Input 
                placeholder="Línea 1: Dirección (Ej: Calle las Flores...)"
                className="rounded-xl bg-background border-border/40 text-sm"
                value={addressLine1}
                onChange={(e) => setAddressLine1(e.target.value)}
              />
              
              <Input 
                placeholder="Línea 2: Ciudad (Ej: Valle de la Pascua...)"
                className="rounded-xl bg-background border-border/40 text-sm"
                value={addressLine2}
                onChange={(e) => setAddressLine2(e.target.value)}
              />

              <Input 
                placeholder="Teléfonos"
                className="rounded-xl bg-background border-border/40 text-sm"
                value={clinicPhone}
                onChange={(e) => setClinicPhone(e.target.value)}
              />

              <Input 
                placeholder="RIF (Opcional)"
                className="rounded-xl bg-background border-border/40 text-sm"
                value={clinicRif}
                onChange={(e) => setClinicRif(e.target.value)}
              />

              <Input 
                placeholder="Tipo de Consultorio (Ej: Consultorio Ginecológico)"
                className="rounded-xl bg-background border-border/40 text-sm font-bold"
                value={clinicType}
                onChange={(e) => setClinicType(e.target.value)}
              />

              <Input 
                placeholder="Nombre de la Clínica"
                className="rounded-xl bg-background border-border/40 text-sm font-bold text-primary"
                value={clinicName}
                onChange={(e) => setClinicName(e.target.value)}
              />
            </div>

            {/* Header Text */}
            <div className="space-y-3">
              <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Subtítulo Adicional</Label>
              <Textarea 
                placeholder="Ej: DRA. CARLI SOLE AQUINO\nGinecóloga Obstetra"
                className="min-h-[80px] rounded-xl bg-muted border-gray-200 resize-none text-sm text-foreground"
                value={headerText}
                onChange={(e) => setHeaderText(e.target.value)}
              />
              <p className="text-[10px] text-muted-foreground">Presiona Enter para saltos de línea. Se mostrará centrado en la parte superior.</p>
            </div>
            
          </div>
          
          <div className="mt-8 pt-6 border-t border-border/40">
            <Button onClick={handleSave} disabled={updateClinic.isPending} className="w-full rounded-xl py-6 font-bold shadow-md bg-black text-primary-foreground hover:bg-gray-800 transition-all active:scale-[0.98]">
              {updateClinic.isPending ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : <Save className="h-5 w-5 mr-2" />}
              Guardar Diseño
            </Button>
          </div>
        </div>
      </div>

      {/* RIGHT PANEL: LIVE PREVIEW */}
      <div className="flex-1 bg-muted/40 rounded-[2rem] sm:rounded-[3rem] p-2 sm:p-8 flex items-start sm:items-center justify-center overflow-x-auto overflow-y-auto border border-border/40 relative min-h-[500px] sm:min-h-[600px]">
        <div className="absolute top-6 left-8 flex items-center gap-2 text-muted-foreground font-bold text-xs uppercase tracking-wider">
          <Eye className="h-4 w-4" /> Vista Previa del Documento
        </div>

        {/* Paper Simulation */}
        <div className={cn("bg-white w-[320px] sm:w-[400px] md:w-[500px] shrink-0 aspect-[1/1.414] rounded-sm shadow-2xl overflow-hidden flex flex-col relative transition-all duration-300 transform origin-top mt-12 sm:mt-0 hover:scale-[1.02]", fontFamily)}>
          
          {/* Paper Header */}
          <div className={cn("px-6 pt-8 pb-4 transition-colors duration-300 text-gray-800", fontFamily)}>
            <div className="flex items-start justify-between">
              {/* Left Logo Space */}
              <div className="w-[60px] h-[60px] flex-shrink-0">
                {logoBase64 && (
                  <img 
                    src={logoBase64} 
                    alt="Logo Superior" 
                    className="w-full h-full object-contain"
                  />
                )}
              </div>
              
              {/* Center Text */}
              <div className="flex-1 text-center px-2">
                {/* Address & Phone */}
                <div className="text-[9px] text-gray-500 mb-2 leading-tight">
                  <div>{addressLine1 || "Calle las Flores entre González Padrón y Shettino, Número 16."}</div>
                  <div>{addressLine2 || "Valle de la Pascua, Estado Guárico."}</div>
                  <div>Teléfono: {clinicPhone || "0412/8299890 0424/4609387"} {clinicRif ? `| RIF: ${clinicRif}` : ""}</div>
                </div>
                
                {/* Clinic Name */}
                <div className="text-[11px] mb-1">
                  {clinicType || "Consultorio Ginecológico Obstétrico"}
                </div>
                <div className="text-xl italic font-bold">
                  {clinicName || "Femesalud"}
                </div>
              </div>
              
              {/* Right Spacer (to keep center text perfectly centered) */}
              <div className="w-[60px] flex-shrink-0"></div>
            </div>

            {/* Custom Header Text */}
            <div className="text-sm text-center whitespace-pre-wrap leading-relaxed font-bold mt-4">
              {headerText || <span className="text-gray-400 italic font-normal text-xs">Aquí irá tu texto adicional...</span>}
            </div>
          </div>

          <div className="mx-8 border-b-2 transition-colors duration-300" style={{ borderColor: primaryColor }}></div>

          {/* Paper Body (Simulated content) */}
          <div className="flex-1 p-6 sm:p-8 flex flex-col">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-6 sm:mb-8 text-[10px] sm:text-xs text-gray-500 border-b border-gray-100 pb-4 gap-2 sm:gap-0">
              <div><span className="font-bold text-gray-700">Paciente:</span> Katherine Álvarez</div>
              <div><span className="font-bold text-gray-700">Fecha:</span> 28/07/2026</div>
            </div>

            {logoBase64 ? (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden">
                <img 
                  src={logoBase64} 
                  alt="Watermark Logo" 
                  className="w-64 h-64 object-contain opacity-[0.08] select-none scale-150" 
                />
              </div>
            ) : (
              <div className={cn("text-5xl font-black opacity-[0.03] mb-4 select-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 scale-150", fontFamily)} style={{ color: primaryColor }}>
                FemeSalud
              </div>
            )}
            
            <div className={cn("text-3xl font-black opacity-20 mb-8 select-none", fontFamily)} style={{ color: primaryColor }}>
              Rx
            </div>

            <div className="space-y-5 relative z-10">
              <div className="h-3 w-3/4 bg-gray-100 rounded-full"></div>
              <div className="h-3 w-1/2 bg-gray-100 rounded-full"></div>
              <div className="h-3 w-full bg-gray-100 rounded-full"></div>
              <div className="h-3 w-5/6 bg-gray-100 rounded-full"></div>
            </div>

            <div className="mt-auto pt-16 flex justify-center">
              <div className="w-48 border-t-2 border-gray-300 text-center pt-2 text-xs font-bold text-gray-500">
                Firma y Sello del Médico
              </div>
            </div>
          </div>
          
        </div>
      </div>
      
    </div>
  );
}
