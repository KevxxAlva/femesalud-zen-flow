import { useState } from "react";
import { Search, Plus, X, Pencil, Trash2, ChevronLeft, Filter, Headphones, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useTickets, useCreateTicket, useUpdateTicket, useDeleteTicket, type SupportTicket } from "@/lib/api/support";
import { toast } from "sonner";
import { Textarea } from "@/components/ui/textarea";

export function CustomerSupportPage() {
  const { data: tickets = [], isLoading } = useTickets();
  const createTicket = useCreateTicket();
  const updateTicket = useUpdateTicket();
  const deleteTicket = useDeleteTicket();

  const [q, setQ] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<SupportTicket | null>(null);

  const filtered = tickets.filter((ticket) => {
    if (!q) return true;
    const term = q.toLowerCase();
    return ticket.patient_name.toLowerCase().includes(term) || ticket.subject.toLowerCase().includes(term);
  });

  const handleDelete = async (id: string) => {
    if (confirm("¿Estás seguro de que deseas eliminar este ticket?")) {
      try {
        await deleteTicket.mutateAsync(id);
        toast.success("Ticket eliminado");
      } catch (e) {
        toast.error("Error al eliminar ticket");
      }
    }
  };

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    
    const ticketData = {
      patient_name: fd.get("patient_name") as string,
      subject: fd.get("subject") as string,
      description: fd.get("description") as string,
      priority: fd.get("priority") as "Low" | "Medium" | "High",
      status: fd.get("status") as "Open" | "In Progress" | "Resolved",
    };
    
    try {
      if (editing) {
        await updateTicket.mutateAsync({ ...ticketData, id: editing.id });
        toast.success("Ticket actualizado");
      } else {
        await createTicket.mutateAsync(ticketData);
        toast.success("Ticket creado");
      }
      setFormOpen(false);
    } catch (err) {
      toast.error("Error al guardar ticket");
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
          <h1 className="text-xl font-bold text-[#2b3674]">Soporte Técnico (Ayuda del Sistema)</h1>
        </div>
        <div className="flex-1 max-w-xl mx-auto">
          <div className="flex items-center gap-2 rounded-full bg-gray-50 border border-gray-100 px-4 py-2.5 w-full">
            <Search className="h-4 w-4 text-[#a3aed1]" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Buscar por usuario o duda del sistema..."
              className="w-full bg-transparent text-sm outline-none placeholder:text-[#a3aed1] text-[#2b3674]"
            />
            {q && <button onClick={() => setQ("")} className="text-[#a3aed1] hover:text-[#2b3674]"><X className="h-4 w-4" /></button>}
          </div>
        </div>
        <div className="flex items-center gap-4 hidden md:flex"></div>
      </header>

      <div className="flex flex-wrap items-center justify-between mb-4 border-b border-[#f0f2f5] pb-4 mt-2">
        <div className="flex items-center gap-2 text-sm font-bold text-[#a3aed1]">
          <Headphones className="h-4 w-4" /> {filtered.length} tickets
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-[#2b3674] border border-[#f0f2f5] rounded-xl hover:bg-gray-50">
            <Filter className="h-3.5 w-3.5" /> Filtros
          </button>
          <button onClick={() => { setEditing(null); setFormOpen(true); }} className="flex items-center gap-2 bg-[#4361ee] text-white px-5 py-2.5 rounded-xl text-xs font-bold shadow-sm hover:bg-[#3451d6] transition">
            <Plus className="h-3.5 w-3.5" /> Nuevo Ticket
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-[#f8f9fb] text-[10px] font-bold text-[#a3aed1] uppercase tracking-wider">
              <th className="p-4 w-12 rounded-tl-xl"><input type="checkbox" className="rounded border-gray-300" /></th>
              <th className="p-4">Usuario Afectado</th>
              <th className="p-4">Asunto</th>
              <th className="p-4">Prioridad</th>
              <th className="p-4">Estado</th>
              <th className="p-4 text-right rounded-tr-xl">Acción</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={6} className="p-12 text-center text-[#a3aed1] font-medium">No se encontraron tickets.</td></tr>
            ) : (
              filtered.map((ticket) => (
                <tr key={ticket.id} className="border-b border-[#f0f2f5] hover:bg-gray-50/50 transition group">
                  <td className="p-4"><input type="checkbox" className="rounded border-gray-300" /></td>
                  <td className="p-4 font-bold text-[#2b3674]">{ticket.patient_name}</td>
                  <td className="p-4 text-[#a3aed1] font-medium">{ticket.subject}</td>
                  <td className="p-4">
                    <span className={cn(
                      "text-[10px] font-bold px-2.5 py-1 rounded-full tracking-wide",
                      ticket.priority === "High" ? "bg-red-50 text-red-600 border border-red-100" : 
                      ticket.priority === "Medium" ? "bg-yellow-50 text-yellow-600 border border-yellow-100" :
                      "bg-blue-50 text-blue-600 border border-blue-100"
                    )}>
                      {ticket.priority === "High" ? "Alta" : ticket.priority === "Medium" ? "Media" : "Baja"}
                    </span>
                  </td>
                  <td className="p-4">
                    <span className={cn(
                      "text-[10px] font-bold px-2.5 py-1 rounded-full tracking-wide",
                      ticket.status === "Resolved" ? "bg-green-50 text-green-600 border border-green-100" : 
                      ticket.status === "In Progress" ? "bg-purple-50 text-purple-600 border border-purple-100" :
                      "bg-gray-100 text-gray-500 border border-gray-200"
                    )}>
                      {ticket.status === "Resolved" ? "Resuelto" : ticket.status === "In Progress" ? "En Progreso" : "Abierto"}
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center justify-end gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => { setEditing(ticket); setFormOpen(true); }} className="hover:text-[#2b3674]"><Pencil className="h-4 w-4" /></button>
                      <button onClick={() => handleDelete(ticket.id)} className="hover:text-red-500"><Trash2 className="h-4 w-4" /></button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="sm:max-w-[500px] p-6 rounded-3xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-[#2b3674]">
              {editing ? "Editar Ticket" : "Nuevo Ticket"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSave} className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label htmlFor="patient_name" className="text-xs font-bold text-[#2b3674]">USUARIO / ROL *</Label>
              <Input id="patient_name" name="patient_name" defaultValue={editing?.patient_name} placeholder="Ej. Dra. Carli (Médico)" required className="bg-gray-50 border-gray-200" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="subject" className="text-xs font-bold text-[#2b3674]">ASUNTO / DUDA DEL SISTEMA *</Label>
              <Input id="subject" name="subject" defaultValue={editing?.subject} placeholder="Ej. ¿Cómo exportar el reporte a PDF?" required className="bg-gray-50 border-gray-200" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description" className="text-xs font-bold text-[#2b3674]">DESCRIPCIÓN DETALLADA DEL PROBLEMA</Label>
              <Textarea id="description" name="description" defaultValue={editing?.description || ""} placeholder="Describe con detalle la duda o el error que te aparece en pantalla..." className="bg-gray-50 border-gray-200 resize-none h-24" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="priority" className="text-xs font-bold text-[#2b3674]">PRIORIDAD</Label>
                <select id="priority" name="priority" defaultValue={editing?.priority || "Medium"} className="w-full h-10 px-3 py-2 rounded-md bg-gray-50 border border-gray-200 text-sm outline-none">
                  <option value="Low">Baja</option>
                  <option value="Medium">Media</option>
                  <option value="High">Alta</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="status" className="text-xs font-bold text-[#2b3674]">ESTADO</Label>
                <select id="status" name="status" defaultValue={editing?.status || "Open"} className="w-full h-10 px-3 py-2 rounded-md bg-gray-50 border border-gray-200 text-sm outline-none">
                  <option value="Open">Abierto</option>
                  <option value="In Progress">En Progreso</option>
                  <option value="Resolved">Resuelto</option>
                </select>
              </div>
            </div>
            <div className="pt-4 flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={() => setFormOpen(false)} className="rounded-xl border-[#e2e8f0] text-[#2b3674] font-medium h-11">Cancelar</Button>
              <Button type="submit" className="bg-[#4361ee] text-white hover:bg-[#3451d6] shadow-sm rounded-xl font-bold h-11 px-6">
                {createTicket.isPending || updateTicket.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                {editing ? "Guardar Cambios" : "Crear Ticket"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
