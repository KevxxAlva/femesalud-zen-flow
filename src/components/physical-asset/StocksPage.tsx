import { useState } from "react";
import { Search, Plus, X, Pencil, Trash2, ChevronLeft, ChevronRight, Filter, Box, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useStocks, useCreateStock, useUpdateStock, useDeleteStock, type StockItem } from "@/lib/api/inventory";
import { toast } from "sonner";

export function StocksPage() {
  const { data: items = [], isLoading } = useStocks();
  const createItem = useCreateStock();
  const updateItem = useUpdateStock();
  const deleteItem = useDeleteStock();
  const [q, setQ] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<StockItem | null>(null);

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  const filtered = items.filter((item) => {
    if (!q) return true;
    const term = q.toLowerCase();
    return item.name.toLowerCase().includes(term) || item.category.toLowerCase().includes(term);
  });

  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const paginated = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handleDelete = async (id: string) => {
    if (confirm("¿Estás seguro de que deseas eliminar este artículo del inventario?")) {
      try {
        await deleteItem.mutateAsync(id);
        toast.success("Artículo eliminado");
      } catch (e) {
        toast.error("Error al eliminar el artículo");
      }
    }
  };

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    
    const qty = parseInt(fd.get("quantity") as string, 10);
    const status = qty === 0 ? "Out of Stock" : qty <= 100 ? "Low Stock" : "In Stock";

    const itemData = {
      name: fd.get("name") as string,
      category: fd.get("category") as string,
      quantity: qty,
      status: status as "In Stock" | "Low Stock" | "Out of Stock",
    };
    
    try {
      if (editing) {
        await updateItem.mutateAsync({ ...itemData, id: editing.id });
        toast.success("Artículo actualizado");
      } else {
        await createItem.mutateAsync(itemData);
        toast.success("Artículo añadido");
      }
      setFormOpen(false);
    } catch (err) {
      toast.error("Error al guardar el artículo");
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-[#4361ee]" />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-[2rem] p-6 shadow-sm min-h-[calc(100vh-8rem)] font-sans flex flex-col">
      <header className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <button className="text-[#a3aed1] hover:text-[#2b3674]"><ChevronLeft className="h-5 w-5" /></button>
          <h1 className="text-xl font-bold text-[#2b3674]">Inventario de Existencias</h1>
        </div>
        <div className="flex-1 max-w-xl mx-auto">
          <div className="flex items-center gap-2 rounded-full bg-gray-50 border border-gray-100 px-4 py-2.5 w-full">
            <Search className="h-4 w-4 text-[#a3aed1]" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Buscar artículos de inventario..."
              className="w-full bg-transparent text-sm outline-none placeholder:text-[#a3aed1] text-[#2b3674]"
            />
            {q && <button onClick={() => setQ("")} className="text-[#a3aed1] hover:text-[#2b3674]"><X className="h-4 w-4" /></button>}
          </div>
        </div>
        <div className="flex items-center gap-4 hidden md:flex"></div>
      </header>

      <div className="flex flex-wrap items-center justify-between mb-4 border-b border-[#f0f2f5] pb-4 mt-2">
        <div className="flex items-center gap-2 text-sm font-bold text-[#a3aed1]">
          <Box className="h-4 w-4" /> {filtered.length} artículos
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-[#2b3674] border border-[#f0f2f5] rounded-xl hover:bg-gray-50">
            <Filter className="h-3.5 w-3.5" /> Filtros
          </button>
          <button onClick={() => { setEditing(null); setFormOpen(true); }} className="flex items-center gap-2 bg-black text-white px-5 py-2.5 rounded-xl text-xs font-bold shadow-md hover:bg-gray-800 transition">
            <Plus className="h-3.5 w-3.5" /> Añadir Artículo
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-[#f8f9fb] text-[10px] font-bold text-[#a3aed1] uppercase tracking-wider">
              <th className="p-4 w-12 rounded-tl-xl"><input type="checkbox" className="rounded border-gray-300" /></th>
              <th className="p-4">Nombre del Artículo <span className="ml-1">↕</span></th>
              <th className="p-4">SKU / ID <span className="ml-1">↕</span></th>
              <th className="p-4">Categoría <span className="ml-1">↕</span></th>
              <th className="p-4">Cantidad <span className="ml-1">↕</span></th>
              <th className="p-4">Estado <span className="ml-1">↕</span></th>
              <th className="p-4 rounded-tr-xl">Acción <span className="ml-1">↕</span></th>
            </tr>
          </thead>
          <tbody className="text-sm">
            {paginated.length === 0 ? (
              <tr><td colSpan={7} className="p-12 text-center text-[#a3aed1] font-medium">No se encontraron artículos en stock.</td></tr>
            ) : (
              paginated.map((item) => (
                <tr key={item.id} className="border-b border-[#f0f2f5] hover:bg-gray-50/50 transition group">
                  <td className="p-4"><input type="checkbox" className="rounded border-gray-300" /></td>
                  <td className="p-4 font-bold text-[#2b3674]">{item.name}</td>
                  <td className="p-4 text-[#a3aed1] font-medium">{item.id}</td>
                  <td className="p-4 text-[#a3aed1] font-medium">{item.category}</td>
                  <td className="p-4 font-bold text-[#2b3674]">{item.quantity}</td>
                  <td className="p-4">
                    <span className={cn(
                      "text-[10px] font-bold px-2.5 py-1 rounded-full tracking-wide",
                      item.status === "In Stock" ? "bg-green-50 text-green-600 border border-green-100" : 
                      item.status === "Low Stock" ? "bg-yellow-50 text-yellow-600 border border-yellow-100" :
                      "bg-red-50 text-red-600 border border-red-100"
                    )}>
                      {item.status === "In Stock" ? "En Stock" : item.status === "Low Stock" ? "Stock Bajo" : "Agotado"}
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-3 text-[#a3aed1]">
                      <button onClick={() => { setEditing(item); setFormOpen(true); }} className="hover:text-[#2b3674]"><Pencil className="h-4 w-4" /></button>
                      <button onClick={() => handleDelete(item.id)} className="hover:text-red-500"><Trash2 className="h-4 w-4" /></button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between pt-4 border-t border-[#f0f2f5]">
          <p className="text-xs text-[#a3aed1] font-medium">
            Mostrando <span className="font-bold text-[#2b3674]">{(currentPage - 1) * itemsPerPage + 1} - {Math.min(filtered.length, currentPage * itemsPerPage)}</span> de <span className="font-bold text-[#2b3674]">{filtered.length}</span> artículos
          </p>
          <div className="flex gap-1">
            <button disabled={currentPage === 1} onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))} className="h-8 w-8 flex items-center justify-center rounded-lg border border-[#f0f2f5] text-[#a3aed1] hover:bg-gray-50 disabled:opacity-50"><ChevronLeft className="h-4 w-4" /></button>
            <button disabled={currentPage === totalPages} onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))} className="h-8 w-8 flex items-center justify-center rounded-lg border border-[#f0f2f5] text-[#a3aed1] hover:bg-gray-50 disabled:opacity-50"><ChevronRight className="h-4 w-4" /></button>
          </div>
        </div>
      )}

      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{editing ? "Editar Artículo" : "Añadir Nuevo Artículo"}</DialogTitle>
            <DialogDescription>Actualizar niveles y detalles de inventario.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSave} className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-xs font-bold text-[#2b3674]">NOMBRE DEL ARTÍCULO *</Label>
              <Input id="name" name="name" defaultValue={editing?.name} placeholder="Ej. Guantes Quirúrgicos" required className="bg-gray-50 border-gray-200" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="category" className="text-xs font-bold text-[#2b3674]">CATEGORÍA</Label>
                <select id="category" name="category" defaultValue={editing?.category || "Medical Supplies"} className="w-full h-10 px-3 py-2 rounded-md bg-gray-50 border border-gray-200 text-sm outline-none">
                  <option value="Medical Supplies">Insumos Médicos</option>
                  <option value="Consumables">Consumibles</option>
                  <option value="Equipment">Equipos</option>
                  <option value="Office">Oficina</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="quantity" className="text-xs font-bold text-[#2b3674]">CANTIDAD *</Label>
                <Input id="quantity" name="quantity" type="number" min="0" defaultValue={editing?.quantity || 0} required className="bg-gray-50 border-gray-200" />
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={() => setFormOpen(false)} className="rounded-xl border-gray-200 text-gray-500">Cancelar</Button>
              <Button type="submit" className="rounded-xl bg-[#4361ee] hover:bg-[#3b55d9] text-white">
                {createItem.isPending || updateItem.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                {editing ? "Guardar Cambios" : "Guardar Artículo"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
