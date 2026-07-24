import { useState } from "react";
import { Search, Plus, X, Pencil, Trash2, ChevronLeft, ChevronRight, Filter, CreditCard, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { usePaymentMethods, useCreatePaymentMethod, useUpdatePaymentMethod, useDeletePaymentMethod, type PaymentMethod } from "@/lib/api/paymentMethods";
import { toast } from "sonner";

export function PaymentMethodsPage() {
  const { data: methods = [], isLoading } = usePaymentMethods();
  const createMethod = useCreatePaymentMethod();
  const updateMethod = useUpdatePaymentMethod();
  const deleteMethod = useDeletePaymentMethod();
  const [q, setQ] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<PaymentMethod | null>(null);

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  const filtered = methods.filter((m) => {
    if (!q) return true;
    const term = q.toLowerCase();
    return m.name.toLowerCase().includes(term) || m.category.toLowerCase().includes(term);
  });

  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const paginated = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handleDelete = async (id: string) => {
    if (confirm("¿Estás seguro de que deseas eliminar este método de pago?")) {
      try {
        await deleteMethod.mutateAsync(id);
        toast.success("Método de pago eliminado");
      } catch (e) {
        toast.error("Error al eliminar el método");
      }
    }
  };

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const methodData = {
      name: fd.get("name") as string,
      category: fd.get("category") as string,
      status: fd.get("status") as "Active" | "Inactive",
    };
    
    try {
      if (editing) {
        await updateMethod.mutateAsync({ ...methodData, id: editing.id });
        toast.success("Método actualizado");
      } else {
        await createMethod.mutateAsync(methodData);
        toast.success("Método añadido");
      }
      setFormOpen(false);
    } catch (err) {
      toast.error("Error al guardar el método");
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="bg-card rounded-[2rem] p-6 shadow-sm min-h-[calc(100vh-8rem)] font-sans flex flex-col">
      <header className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <button className="text-muted-foreground hover:text-foreground"><ChevronLeft className="h-5 w-5" /></button>
          <h1 className="text-xl font-bold text-foreground">Métodos de Pago</h1>
        </div>
        <div className="flex-1 max-w-xl mx-auto">
          <div className="flex items-center gap-2 rounded-full bg-muted border border-gray-100 px-4 py-2.5 w-full">
            <Search className="h-4 w-4 text-muted-foreground" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Buscar métodos de pago..."
              className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground text-foreground"
            />
            {q && <button onClick={() => setQ("")} className="text-muted-foreground hover:text-foreground"><X className="h-4 w-4" /></button>}
          </div>
        </div>
        <div className="flex items-center gap-4 hidden md:flex"></div>
      </header>

      <div className="flex flex-wrap items-center justify-between mb-4 border-b border-border/40 pb-4 mt-2">
        <div className="flex items-center gap-2 text-sm font-bold text-muted-foreground">
          <CreditCard className="h-4 w-4" /> {filtered.length} métodos
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-foreground border border-border/40 rounded-xl hover:bg-muted">
            <Filter className="h-3.5 w-3.5" /> Filtros
          </button>
          <button onClick={() => { setEditing(null); setFormOpen(true); }} className="flex items-center gap-2 bg-black text-primary-foreground px-5 py-2.5 rounded-xl text-xs font-bold shadow-md hover:bg-gray-800 transition">
            <Plus className="h-3.5 w-3.5" /> Añadir Método
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-muted text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
              <th className="p-4 w-12 rounded-tl-xl"><input type="checkbox" className="rounded border-gray-300" /></th>
              <th className="p-4">Nombre del Método <span className="ml-1">↕</span></th>
              <th className="p-4">Categoría <span className="ml-1">↕</span></th>
              <th className="p-4">Estado <span className="ml-1">↕</span></th>
              <th className="p-4 rounded-tr-xl">Acción <span className="ml-1">↕</span></th>
            </tr>
          </thead>
          <tbody className="text-sm">
            {paginated.length === 0 ? (
              <tr><td colSpan={5} className="p-12 text-center text-muted-foreground font-medium">No se encontraron métodos de pago.</td></tr>
            ) : (
              paginated.map((m) => (
                <tr key={m.id} className="border-b border-border/40 hover:bg-muted/50 transition group">
                  <td className="p-4"><input type="checkbox" className="rounded border-gray-300" /></td>
                  <td className="p-4 font-bold text-foreground">{m.name}</td>
                  <td className="p-4 text-muted-foreground font-medium">{m.category}</td>
                  <td className="p-4">
                    <span className={cn(
                      "text-[10px] font-bold px-2.5 py-1 rounded-full tracking-wide",
                      m.status === "Active" ? "bg-green-50 text-green-600 border border-green-100" : "bg-muted text-muted-foreground"
                    )}>
                      {m.status === "Active" ? "Activo" : "Inactivo"}
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-3 text-muted-foreground">
                      <button onClick={() => { setEditing(m); setFormOpen(true); }} className="hover:text-foreground"><Pencil className="h-4 w-4" /></button>
                      <button onClick={() => handleDelete(m.id)} className="hover:text-destructive"><Trash2 className="h-4 w-4" /></button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between pt-4 border-t border-border/40">
          <p className="text-xs text-muted-foreground font-medium">
            Mostrando <span className="font-bold text-foreground">{(currentPage - 1) * itemsPerPage + 1} - {Math.min(filtered.length, currentPage * itemsPerPage)}</span> de <span className="font-bold text-foreground">{filtered.length}</span> métodos
          </p>
          <div className="flex gap-1">
            <button disabled={currentPage === 1} onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))} className="h-8 w-8 flex items-center justify-center rounded-lg border border-border/40 text-muted-foreground hover:bg-muted disabled:opacity-50"><ChevronLeft className="h-4 w-4" /></button>
            <button disabled={currentPage === totalPages} onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))} className="h-8 w-8 flex items-center justify-center rounded-lg border border-border/40 text-muted-foreground hover:bg-muted disabled:opacity-50"><ChevronRight className="h-4 w-4" /></button>
          </div>
        </div>
      )}

      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{editing ? "Editar Método" : "Añadir Método de Pago"}</DialogTitle>
            <DialogDescription>Configurar una nueva opción de pago.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSave} className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-xs font-bold text-foreground">NOMBRE DEL MÉTODO *</Label>
              <Input id="name" name="name" defaultValue={editing?.name} placeholder="Ej. Zelle" required className="bg-muted border-gray-200" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="category" className="text-xs font-bold text-foreground">CATEGORÍA</Label>
                <select id="category" name="category" defaultValue={editing?.category || "Bank"} className="w-full h-10 px-3 py-2 rounded-md bg-muted border border-gray-200 text-sm outline-none">
                  <option value="Card">Tarjeta</option>
                  <option value="Bank">Transferencia Bancaria</option>
                  <option value="Digital Wallet">Billetera Digital</option>
                  <option value="Cash">Efectivo</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="status" className="text-xs font-bold text-foreground">ESTADO</Label>
                <select id="status" name="status" defaultValue={editing?.status || "Active"} className="w-full h-10 px-3 py-2 rounded-md bg-muted border border-gray-200 text-sm outline-none">
                  <option value="Active">Activo</option>
                  <option value="Inactive">Inactivo</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={() => setFormOpen(false)} className="rounded-xl border-gray-200 text-muted-foreground">Cancelar</Button>
              <Button type="submit" className="rounded-xl bg-primary hover:bg-[#3b55d9] text-primary-foreground">
                {createMethod.isPending || updateMethod.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                {editing ? "Guardar Cambios" : "Guardar Método"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
