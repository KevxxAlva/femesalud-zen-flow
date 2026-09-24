import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, File, Upload, Trash2, Download, FileText, Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { toast } from "sonner";
import { formatBytes, cn } from "@/lib/utils";

export function PatientFilesTab({ patientId }: { patientId: number | string }) {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [activeCategory, setActiveCategory] = useState("Todos");
  const categories = ["Todos", "Ecografías", "Laboratorios", "Documentos"];
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const { data: files = [], isLoading } = useQuery({
    queryKey: ["patient_files", patientId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("archivos_pacientes")
        .select("*")
        .eq("id_paciente", patientId)
        .order("fecha_subida", { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      setIsUploading(true);
      const fileExt = file.name.split('.').pop();
      const fileName = `${patientId}_${Date.now()}.${fileExt}`;
      const filePath = `${patientId}/${fileName}`;

      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from("patient-files")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Insert record in DB
      const { data, error: dbError } = await supabase
        .from("archivos_pacientes")
        .insert({
          id_paciente: patientId,
          nombre_archivo: file.name,
          ruta_archivo: filePath,
          tipo_archivo: file.type,
          tamano_bytes: file.size,
        })
        .select()
        .single();

      if (dbError) throw dbError;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["patient_files", patientId] });
      toast.success("Archivo subido con éxito");
      if (fileInputRef.current) fileInputRef.current.value = "";
    },
    onError: (err: any) => {
      toast.error(`Error al subir archivo: ${err.message}`);
    },
    onSettled: () => {
      setIsUploading(false);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (fileRecord: any) => {
      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from("patient-files")
        .remove([fileRecord.ruta_archivo]);

      if (storageError) throw storageError;

      // Delete from DB
      const { error: dbError } = await supabase
        .from("archivos_pacientes")
        .delete()
        .eq("id", fileRecord.id);

      if (dbError) throw dbError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["patient_files", patientId] });
      toast.success("Archivo eliminado");
    },
    onError: (err: any) => {
      toast.error(`Error al eliminar archivo: ${err.message}`);
    }
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      uploadMutation.mutate(e.target.files[0]);
    }
  };

  const downloadFile = async (fileRecord: any) => {
    try {
      const { data, error } = await supabase.storage
        .from("patient-files")
        .download(fileRecord.ruta_archivo);
        
      if (error) throw error;
      
      const url = URL.createObjectURL(data);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileRecord.nombre_archivo;
      document.body.appendChild(a);
      a.click();
      URL.revokeObjectURL(url);
      a.remove();
    } catch (err: any) {
      toast.error(`Error al descargar: ${err.message}`);
    }
  };

  const handleFileClick = async (f: any) => {
    if (f.tipo_archivo?.startsWith("image/")) {
      try {
        const { data, error } = await supabase.storage.from("patient-files").download(f.ruta_archivo);
        if (error) throw error;
        const url = URL.createObjectURL(data);
        setSelectedImage(url);
        setLightboxOpen(true);
      } catch (err: any) {
        toast.error(`Error al abrir imagen: ${err.message}`);
      }
    } else {
      downloadFile(f);
    }
  };

  const filteredFiles = files.filter(f => {
    if (activeCategory === "Todos") return true;
    if (activeCategory === "Ecografías") return f.tipo_archivo?.startsWith("image/");
    if (activeCategory === "Documentos") return f.tipo_archivo?.includes("pdf") || f.tipo_archivo?.includes("doc");
    if (activeCategory === "Laboratorios") return !f.tipo_archivo?.startsWith("image/") && !f.tipo_archivo?.includes("pdf") && !f.tipo_archivo?.includes("doc");
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-border/40 pb-4">
        <div>
          <h3 className="text-sm font-bold text-foreground">Archivos y Documentos</h3>
          <p className="text-xs text-muted-foreground">Sube exámenes de laboratorio, ecosonogramas, etc.</p>
        </div>
        <div>
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileChange} 
            className="hidden" 
            accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
          />
          <Button 
            onClick={() => fileInputRef.current?.click()} 
            disabled={isUploading}
            className="rounded-xl h-8 px-4 text-xs bg-mauve text-white hover:bg-mauve-dark cursor-pointer"
          >
            {isUploading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Upload className="h-3.5 w-3.5 mr-2" />}
            Subir Archivo
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-2 mb-4 overflow-x-auto pb-2 no-scrollbar">
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={cn(
              "px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-colors border",
              activeCategory === cat 
                ? "bg-mauve text-white border-mauve" 
                : "bg-transparent text-muted-foreground border-border/40 hover:bg-muted"
            )}
          >
            {cat}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-mauve" /></div>
      ) : filteredFiles.length === 0 ? (
        <div className="text-center py-12 border border-dashed border-border/40 rounded-3xl bg-muted/20">
          <FileText className="h-8 w-8 mx-auto text-muted-foreground/40 mb-3" />
          <p className="text-sm font-bold text-muted-foreground">No hay archivos en esta categoría</p>
          <p className="text-xs text-muted-foreground mt-1">Sube uno nuevo o intenta con otra categoría.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {filteredFiles.map(f => {
            const isImage = f.tipo_archivo?.startsWith("image/");
            return (
              <div 
                key={f.id} 
                onClick={() => handleFileClick(f)}
                className="flex flex-col items-center justify-center p-4 rounded-2xl border border-border/40 bg-card shadow-sm hover:shadow-md hover:border-mauve/30 transition-all group cursor-pointer relative"
              >
                <div className={`p-4 rounded-xl flex-shrink-0 mb-3 transition-transform group-hover:scale-105 ${isImage ? 'bg-indigo-50 text-indigo-500' : 'bg-rose-50 text-rose-500'}`}>
                  {isImage ? <ImageIcon className="h-8 w-8" /> : <FileText className="h-8 w-8" />}
                </div>
                <div className="w-full text-center px-1">
                  <p className="text-xs font-bold text-foreground truncate" title={f.nombre_archivo}>
                    {f.nombre_archivo}
                  </p>
                  <p className="text-[10px] text-muted-foreground font-medium mt-1">
                    {formatBytes(f.tamano_bytes)} • {new Date(f.fecha_subida).toLocaleDateString()}
                  </p>
                </div>
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col gap-1">
                  <Button variant="ghost" size="icon" className="h-7 w-7 rounded-full bg-background shadow-sm hover:bg-destructive/10 hover:text-destructive cursor-pointer" onClick={(e) => { e.stopPropagation(); deleteMutation.mutate(f); }}>
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Lightbox Dialog */}
      <Dialog open={lightboxOpen} onOpenChange={setLightboxOpen}>
        <DialogContent className="max-w-4xl p-1 bg-transparent border-none shadow-none flex justify-center items-center [&>button]:text-white">
          {selectedImage && <img src={selectedImage} alt="Preview" className="max-h-[80vh] max-w-full rounded-xl object-contain shadow-2xl" />}
        </DialogContent>
      </Dialog>
    </div>
  );
}
