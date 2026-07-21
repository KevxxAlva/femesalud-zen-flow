import { createFileRoute, redirect } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQueryClient } from "@tanstack/react-query";
import { UserRound, Plus, Shield, Stethoscope, Trash2, Loader2, ShieldOff, Search, X, Filter, ChevronLeft, ChevronRight, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";
import { useAllProfilesWithRoles, useToggleRole, type ProfileWithRoles } from "@/lib/api/profiles";
import { adminCreateUser, adminDeleteUser } from "@/lib/admin.functions";
import { supabase } from "@/integrations/supabase/client";
import { useAuthSession } from "@/hooks/useAuth";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/doctores")({
  head: () => ({ meta: [{ title: "Doctores — FemeSalud" }] }),
  beforeLoad: async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw redirect({ to: "/auth" });
  },
  component: DoctoresAdmin,
});

const initials = (n: string) => (n || "?").split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase();

function DoctoresAdmin() {
  const { data: profiles = [], isLoading } = useAllProfilesWithRoles();
  const toggle = useToggleRole();
  const create = useServerFn(adminCreateUser);
  const del = useServerFn(adminDeleteUser);
  const qc = useQueryClient();
  const { user: me } = useAuthSession();

  const [openCreate, setOpenCreate] = useState(false);
  const [toDelete, setToDelete] = useState<ProfileWithRoles | null>(null);
  const [busy, setBusy] = useState(false);

  const [form, setForm] = useState({ email: "", password: "", full_name: "", specialty: "", role: "doctor" as "admin" | "doctor" });

  const [q, setQ] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  const filtered = profiles.filter((p) => {
    if (!q) return true;
    const term = q.toLowerCase();
    return (p.full_name?.toLowerCase().includes(term) || p.email?.toLowerCase().includes(term) || p.specialty?.toLowerCase().includes(term));
  });

  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const paginated = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      await create({ data: form });
      toast.success("Usuario creado");
      setOpenCreate(false);
      setForm({ email: "", password: "", full_name: "", specialty: "", role: "doctor" });
      qc.invalidateQueries({ queryKey: ["profiles_with_roles"] });
      qc.invalidateQueries({ queryKey: ["doctors"] });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al crear");
    } finally { setBusy(false); }
  };

  const handleToggleAdmin = async (p: ProfileWithRoles) => {
    const isAdmin = p.roles.includes("admin");
    try {
      await toggle.mutateAsync({ userId: p.id, role: "admin", enable: !isAdmin });
      toast.success(isAdmin ? "Admin removido" : "Promovido a admin");
    } catch (err) { toast.error(err instanceof Error ? err.message : "Error"); }
  };

  const handleToggleDoctor = async (p: ProfileWithRoles) => {
    const isDoctor = p.roles.includes("doctor");
    try {
      await toggle.mutateAsync({ userId: p.id, role: "doctor", enable: !isDoctor });
      toast.success(isDoctor ? "Doctor removido" : "Promovido a doctor");
    } catch (err) { toast.error(err instanceof Error ? err.message : "Error"); }
  };

  const handleDelete = async () => {
    if (!toDelete) return;
    setBusy(true);
    try {
      await del({ data: { user_id: toDelete.id } });
      toast.success("Usuario eliminado");
      qc.invalidateQueries({ queryKey: ["profiles_with_roles"] });
      qc.invalidateQueries({ queryKey: ["doctors"] });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error");
    } finally {
      setBusy(false);
      setToDelete(null);
    }
  };

  return (
    <div className="bg-white rounded-[2rem] p-6 shadow-sm min-h-[calc(100vh-8rem)] font-sans flex flex-col">
      {/* TOP HEADER */}
      <header className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <button className="text-[#a3aed1] hover:text-[#2b3674]"><ChevronLeft className="h-5 w-5" /></button>
          <h1 className="text-xl font-bold text-[#2b3674]">Personal</h1>
        </div>
        <div className="flex-1 max-w-xl mx-auto">
          <div className="flex items-center gap-2 rounded-full bg-gray-50 border border-gray-100 px-4 py-2.5 w-full">
            <Search className="h-4 w-4 text-[#a3aed1]" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Buscar personal..."
              className="w-full bg-transparent text-sm outline-none placeholder:text-[#a3aed1] text-[#2b3674]"
            />
            {q && <button onClick={() => setQ("")} className="text-[#a3aed1] hover:text-[#2b3674]"><X className="h-4 w-4" /></button>}
          </div>
        </div>
        <div className="flex items-center gap-4 hidden md:flex">
          <button onClick={() => setOpenCreate(true)} className="flex items-center gap-2 bg-black text-white px-5 py-2.5 rounded-xl text-xs font-bold shadow-md hover:bg-gray-800 transition">
            <Plus className="h-3.5 w-3.5" /> Añadir Personal
          </button>
        </div>
      </header>

      {/* SECONDARY TOOLBAR */}
      <div className="flex flex-wrap items-center justify-between mb-4 border-b border-[#f0f2f5] pb-4 mt-2">
        <div className="flex items-center gap-2 text-sm font-bold text-[#a3aed1]">
          <Users className="h-4 w-4" /> {filtered.length} miembros
        </div>
        <div className="flex items-center gap-3 md:hidden">
          <button onClick={() => setOpenCreate(true)} className="flex items-center gap-2 bg-black text-white px-5 py-2.5 rounded-xl text-xs font-bold shadow-md hover:bg-gray-800 transition">
            <Plus className="h-3.5 w-3.5" /> Añadir Personal
          </button>
        </div>
      </div>

      {/* TABLE */}
      <div className="flex-1 overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-[#f8f9fb] text-[10px] font-bold text-[#a3aed1] uppercase tracking-wider">
              <th className="p-4 w-12 rounded-tl-xl"><input type="checkbox" className="rounded border-gray-300" /></th>
              <th className="p-4">Nombre <span className="ml-1">↕</span></th>
              <th className="p-4">Correo <span className="ml-1">↕</span></th>
              <th className="p-4">Especialidad <span className="ml-1">↕</span></th>
              <th className="p-4">Rol <span className="ml-1">↕</span></th>
              <th className="p-4 rounded-tr-xl">Acción <span className="ml-1">↕</span></th>
            </tr>
          </thead>
          <tbody className="text-sm">
            {isLoading ? (
              <tr><td colSpan={6} className="p-12 text-center"><Loader2 className="mx-auto h-6 w-6 animate-spin text-[#a3aed1]" /></td></tr>
            ) : paginated.length === 0 ? (
              <tr><td colSpan={6} className="p-12 text-center text-[#a3aed1] font-medium">No se encontró personal.</td></tr>
            ) : (
              paginated.map((p) => {
                const isAdmin = p.roles.includes("admin");
                const isDoctor = p.roles.includes("doctor");
                const isMe = p.id === me?.id;
                return (
                  <tr key={p.id} className="border-b border-[#f0f2f5] hover:bg-gray-50/50 transition group">
                    <td className="p-4"><input type="checkbox" className="rounded border-gray-300" /></td>
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-[#2b3674] text-[10px] font-bold">
                          {initials(p.full_name || p.email)}
                        </div>
                        <span className="font-bold text-[#2b3674]">{p.full_name || "—"} {isMe && <span className="text-[10px] text-gray-400 font-normal ml-1">(tú)</span>}</span>
                      </div>
                    </td>
                    <td className="p-4 text-[#a3aed1] font-medium">
                      {p.email}
                    </td>
                    <td className="p-4 text-[#2b3674] font-bold text-xs">
                      {p.specialty || "—"}
                    </td>
                    <td className="p-4">
                      <div className="flex flex-wrap gap-1">
                        {p.roles.map((r) => (
                          <span key={r} className={cn(
                            "text-[9px] font-bold px-2 py-1 rounded-full uppercase tracking-wider flex items-center gap-1",
                            r === "admin" ? "bg-purple-50 text-purple-600 border border-purple-100" : "bg-green-50 text-green-600 border border-green-100"
                          )}>
                            {r === "admin" ? <Shield className="h-2.5 w-2.5" /> : <Stethoscope className="h-2.5 w-2.5" />} {r}
                          </span>
                        ))}
                        {p.roles.length === 0 && <span className="text-[9px] bg-gray-50 text-gray-400 px-2 py-1 rounded-full border border-gray-100">Ninguno</span>}
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-3 text-[#a3aed1]">
                        <button
                          onClick={() => handleToggleAdmin(p)}
                          disabled={isMe || toggle.isPending}
                          className="hover:text-purple-600 disabled:opacity-30 flex flex-col items-center gap-1"
                          title={isAdmin ? "Quitar Admin" : "Hacer Admin"}
                        >
                          {isAdmin ? <ShieldOff className="h-4 w-4" /> : <Shield className="h-4 w-4" />}
                        </button>
                        <div className="h-3 w-px bg-gray-200"></div>
                        <button
                          onClick={() => handleToggleDoctor(p)}
                          disabled={toggle.isPending}
                          className="hover:text-green-600 disabled:opacity-30 flex flex-col items-center gap-1"
                          title={isDoctor ? "Quitar Doctor" : "Hacer Doctor"}
                        >
                          {isDoctor ? <ShieldOff className="h-4 w-4" /> : <Stethoscope className="h-4 w-4" />}
                        </button>
                        <div className="h-3 w-px bg-gray-200"></div>
                        <button 
                          onClick={() => setToDelete(p)} 
                          disabled={isMe}
                          className="hover:text-red-500 disabled:opacity-30"
                          title="Eliminar Usuario"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between pt-4 border-t border-[#f0f2f5]">
          <p className="text-xs text-[#a3aed1] font-medium">
            Mostrando <span className="font-bold text-[#2b3674]">{(currentPage - 1) * itemsPerPage + 1} - {Math.min(filtered.length, currentPage * itemsPerPage)}</span> de <span className="font-bold text-[#2b3674]">{filtered.length}</span> miembros
          </p>
          <div className="flex gap-1">
            <button disabled={currentPage === 1} onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))} className="h-8 w-8 flex items-center justify-center rounded-lg border border-[#f0f2f5] text-[#a3aed1] hover:bg-gray-50 disabled:opacity-50"><ChevronLeft className="h-4 w-4" /></button>
            <button disabled={currentPage === totalPages} onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))} className="h-8 w-8 flex items-center justify-center rounded-lg border border-[#f0f2f5] text-[#a3aed1] hover:bg-gray-50 disabled:opacity-50"><ChevronRight className="h-4 w-4" /></button>
          </div>
        </div>
      )}

      <Dialog open={openCreate} onOpenChange={setOpenCreate}>
        <DialogContent className="rounded-3xl sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Nuevo usuario</DialogTitle>
            <DialogDescription>Crea una cuenta para un doctor o administrador.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreate} className="grid gap-4 py-2">
            <div className="grid gap-2">
              <Label htmlFor="fn">Nombre completo</Label>
              <Input id="fn" value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="em">Email</Label>
              <Input id="em" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="pw">Contraseña (mín. 8)</Label>
              <Input id="pw" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required minLength={8} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-2">
                <Label htmlFor="sp">Especialidad</Label>
                <Input id="sp" value={form.specialty} onChange={(e) => setForm({ ...form, specialty: e.target.value })} placeholder="Ginecología" />
              </div>
              <div className="grid gap-2">
                <Label>Rol</Label>
                <Select value={form.role} onValueChange={(v) => setForm({ ...form, role: v as "admin" | "doctor" })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="doctor">Doctor</SelectItem>
                    <SelectItem value="admin">Administrador</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setOpenCreate(false)}>Cancelar</Button>
              <Button type="submit" disabled={busy} className="bg-gradient-to-r from-mauve to-mauve-soft text-primary-foreground hover:opacity-95">
                {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Crear
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!toDelete} onOpenChange={(o) => !o && setToDelete(null)}>
        <AlertDialogContent className="rounded-3xl">
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar usuario?</AlertDialogTitle>
            <AlertDialogDescription>
              Se eliminará la cuenta de {toDelete?.full_name || toDelete?.email} y todos sus datos. Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
