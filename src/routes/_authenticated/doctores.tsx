import { createFileRoute, redirect } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQueryClient } from "@tanstack/react-query";
import { UserRound, Plus, Shield, Stethoscope, Trash2, Loader2, ShieldOff } from "lucide-react";
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
    const { data } = await supabase.from("user_roles").select("role").eq("user_id", user.id).eq("role", "admin").maybeSingle();
    if (!data) throw redirect({ to: "/" });
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
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div className="ml-14 md:ml-0">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Administración</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">Doctores y usuarios</h1>
          <p className="text-sm text-muted-foreground">{profiles.length} usuarios registrados</p>
        </div>
        <Button onClick={() => setOpenCreate(true)} className="rounded-2xl bg-gradient-to-r from-mauve to-mauve-soft text-primary-foreground shadow-sm shadow-mauve/30 hover:opacity-95">
          <Plus className="mr-1 h-4 w-4" /> Nuevo usuario
        </Button>
      </header>

      {isLoading ? (
        <div className="rounded-3xl glass-card p-12 text-center"><Loader2 className="mx-auto h-6 w-6 animate-spin text-muted-foreground" /></div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {profiles.map((p) => {
            const isAdmin = p.roles.includes("admin");
            const isMe = p.id === me?.id;
            return (
              <div key={p.id} className="rounded-3xl glass-card p-5 shadow-sm">
                <div className="flex items-start gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-mauve/80 to-blush text-sm font-semibold text-primary-foreground">
                    {initials(p.full_name || p.email)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">{p.full_name || "Sin nombre"} {isMe && <span className="text-[10px] text-muted-foreground">(tú)</span>}</p>
                    <p className="truncate text-[11px] text-muted-foreground">{p.email}</p>
                    {p.specialty && <p className="truncate text-[11px] text-muted-foreground">{p.specialty}</p>}
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {p.roles.map((r) => (
                    <span key={r} className={cn(
                      "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-medium capitalize",
                      r === "admin" ? "bg-mauve/15 text-mauve" : "bg-sage/40 text-sage-foreground",
                    )}>
                      {r === "admin" ? <Shield className="h-3 w-3" /> : <Stethoscope className="h-3 w-3" />} {r}
                    </span>
                  ))}
                  {p.roles.length === 0 && <span className="text-[11px] text-muted-foreground">Sin rol</span>}
                </div>
                <div className="mt-4 flex items-center justify-between gap-2 border-t border-border/60 pt-3">
                  <button
                    onClick={() => handleToggleAdmin(p)}
                    disabled={isMe || toggle.isPending}
                    className="text-xs font-medium text-mauve hover:underline disabled:opacity-40 disabled:no-underline"
                  >
                    {isAdmin ? <><ShieldOff className="mr-1 inline h-3 w-3" />Quitar admin</> : <><Shield className="mr-1 inline h-3 w-3" />Promover a admin</>}
                  </button>
                  <button
                    onClick={() => setToDelete(p)}
                    disabled={isMe}
                    className="flex h-8 w-8 items-center justify-center rounded-xl text-muted-foreground transition hover:bg-destructive/10 hover:text-destructive disabled:opacity-40"
                    aria-label="Eliminar usuario"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
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
