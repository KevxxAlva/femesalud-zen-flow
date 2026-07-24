import { useState } from "react";
import { Search, Plus, X, Pencil, Trash2, ChevronLeft, ChevronRight, Filter, Wallet, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useAccounts, useCreateAccount, useUpdateAccount, useDeleteAccount, type FinancialAccount as Account } from "@/lib/api/accounts";
import { toast } from "sonner";

export function AccountsPage() {
  const { data: accounts = [], isLoading } = useAccounts();
  const createAcc = useCreateAccount();
  const updateAcc = useUpdateAccount();
  const deleteAcc = useDeleteAccount();
  const [q, setQ] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Account | null>(null);

  // Pagination & Filtering
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  const filtered = accounts.filter((a) => {
    if (!q) return true;
    const term = q.toLowerCase();
    return a.name.toLowerCase().includes(term) || a.type.toLowerCase().includes(term);
  });

  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const paginated = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handleDelete = async (id: string) => {
    if (confirm("¿Estás seguro de que deseas eliminar esta cuenta?")) {
      try {
        await deleteAcc.mutateAsync(id);
        toast.success("Cuenta eliminada");
      } catch (e) {
        toast.error("Error al eliminar cuenta");
      }
    }
  };

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const accData = {
      name: fd.get("name") as string,
      type: fd.get("type") as string,
      balance: parseFloat(fd.get("balance") as string),
      status: fd.get("status") as "Active" | "Inactive",
    };
    
    try {
      if (editing) {
        await updateAcc.mutateAsync({ ...accData, id: editing.id });
        toast.success("Cuenta actualizada");
      } else {
        await createAcc.mutateAsync(accData);
        toast.success("Cuenta añadida");
      }
      setFormOpen(false);
    } catch (err) {
      toast.error("Error al guardar cuenta");
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
      {/* TOP HEADER */}
      <header className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <button className="text-muted-foreground hover:text-foreground"><ChevronLeft className="h-5 w-5" /></button>
          <h1 className="text-xl font-bold text-foreground">Cuentas</h1>
        </div>
        <div className="flex-1 max-w-xl mx-auto">
          <div className="flex items-center gap-2 rounded-full bg-muted border border-gray-100 px-4 py-2.5 w-full">
            <Search className="h-4 w-4 text-muted-foreground" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Buscar cuentas..."
              className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground text-foreground"
            />
            {q && <button onClick={() => setQ("")} className="text-muted-foreground hover:text-foreground"><X className="h-4 w-4" /></button>}
          </div>
        </div>
        <div className="flex items-center gap-4 hidden md:flex">
          {/* Action icons could go here */}
        </div>
      </header>

      {/* SECONDARY TOOLBAR */}
      <div className="flex flex-wrap items-center justify-between mb-4 border-b border-border/40 pb-4 mt-2">
        <div className="flex items-center gap-2 text-sm font-bold text-muted-foreground">
          <Wallet className="h-4 w-4" /> {filtered.length} cuentas
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-foreground border border-border/40 rounded-xl hover:bg-muted">
            <Filter className="h-3.5 w-3.5" /> Filtros
          </button>
          <button onClick={() => { setEditing(null); setFormOpen(true); }} className="flex items-center gap-2 bg-black text-primary-foreground px-5 py-2.5 rounded-xl text-xs font-bold shadow-md hover:bg-gray-800 transition">
            <Plus className="h-3.5 w-3.5" /> Añadir Cuenta
          </button>
        </div>
      </div>

      {/* TABLE */}
      <div className="flex-1 overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-muted text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
              <th className="p-4 w-12 rounded-tl-xl"><input type="checkbox" className="rounded border-gray-300" /></th>
              <th className="p-4">Nombre de Cuenta <span className="ml-1">↕</span></th>
              <th className="p-4">ID de Cuenta <span className="ml-1">↕</span></th>
              <th className="p-4">Tipo <span className="ml-1">↕</span></th>
              <th className="p-4">Balance <span className="ml-1">↕</span></th>
              <th className="p-4">Estado <span className="ml-1">↕</span></th>
              <th className="p-4 rounded-tr-xl">Acción <span className="ml-1">↕</span></th>
            </tr>
          </thead>
          <tbody className="text-sm">
            {paginated.length === 0 ? (
              <tr><td colSpan={7} className="p-12 text-center text-muted-foreground font-medium">No se encontraron cuentas.</td></tr>
            ) : (
              paginated.map((a) => (
                <tr key={a.id} className="border-b border-border/40 hover:bg-muted/50 transition group">
                  <td className="p-4"><input type="checkbox" className="rounded border-gray-300" /></td>
                  <td className="p-4 font-bold text-foreground">{a.name}</td>
                  <td className="p-4 text-muted-foreground font-medium">{a.id}</td>
                  <td className="p-4 text-muted-foreground font-medium">{a.type}</td>
                  <td className="p-4">
                    <span className="bg-green-50 text-green-600 font-bold px-3 py-1.5 text-xs rounded-full border border-green-100">
                      ${a.balance.toFixed(2)}
                    </span>
                  </td>
                  <td className="p-4">
                    <span className={cn(
                      "text-[10px] font-bold px-2.5 py-1 rounded-full tracking-wide",
                      a.status === "Active" ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                    )}>
                      {a.status === "Active" ? "Activa" : "Inactiva"}
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-3 text-muted-foreground">
                      <button onClick={() => { setEditing(a); setFormOpen(true); }} className="hover:text-foreground"><Pencil className="h-4 w-4" /></button>
                      <button onClick={() => handleDelete(a.id)} className="hover:text-destructive"><Trash2 className="h-4 w-4" /></button>
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
            Mostrando <span className="font-bold text-foreground">{(currentPage - 1) * itemsPerPage + 1} - {Math.min(filtered.length, currentPage * itemsPerPage)}</span> de <span className="font-bold text-foreground">{filtered.length}</span> cuentas
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
            <DialogTitle>{editing ? "Editar Cuenta" : "Añadir Nueva Cuenta"}</DialogTitle>
            <DialogDescription>Completa los detalles para la cuenta financiera.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSave} className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-xs font-bold text-foreground">NOMBRE DE LA CUENTA *</Label>
              <Input id="name" name="name" defaultValue={editing?.name} required className="bg-muted border-gray-200" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="type" className="text-xs font-bold text-foreground">TIPO</Label>
                <select id="type" name="type" defaultValue={editing?.type || "Bank"} className="w-full h-10 px-3 py-2 rounded-md bg-muted border border-gray-200 text-sm outline-none">
                  <option value="Bank">Banco</option>
                  <option value="Cash">Efectivo (Cash)</option>
                  <option value="Digital">Digital / Crypto</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="balance" className="text-xs font-bold text-foreground">BALANCE ($) *</Label>
                <Input id="balance" name="balance" type="number" step="0.01" defaultValue={editing?.balance || 0} required className="bg-muted border-gray-200" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="status" className="text-xs font-bold text-foreground">ESTADO</Label>
              <select id="status" name="status" defaultValue={editing?.status || "Active"} className="w-full h-10 px-3 py-2 rounded-md bg-muted border border-gray-200 text-sm outline-none">
                <option value="Active">Activa</option>
                <option value="Inactive">Inactiva</option>
              </select>
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={() => setFormOpen(false)} className="rounded-xl border-gray-200 text-muted-foreground">Cancelar</Button>
              <Button type="submit" className="rounded-xl bg-primary hover:bg-[#3b55d9] text-primary-foreground">
                {createAcc.isPending || updateAcc.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                {editing ? "Guardar Cambios" : "Crear Cuenta"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
