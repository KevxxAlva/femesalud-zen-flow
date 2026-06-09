import { useState, useMemo } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useCreatePatient, useUpdatePatient, type Patient } from "@/lib/api/patients";
import { useDoctors } from "@/lib/api/profiles";
import { useAuthSession, useIsAdmin } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

const STATUSES = ["nuevo", "activo", "en_tratamiento", "alta"];
const statusLabel = (s: string) => ({ nuevo: "Nuevo", activo: "Activo", en_tratamiento: "En tratamiento", alta: "Alta" } as Record<string, string>)[s] ?? s;

export function PatientForm({
  open, onOpenChange, patient,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  patient?: Patient | null;
}) {
  const isEdit = !!patient;
  const { user } = useAuthSession();
  const isAdmin = useIsAdmin();
  const { data: doctors = [] } = useDoctors();

  const defaultDoctor = useMemo(
    () => patient?.assigned_doctor_id ?? (isAdmin ? doctors[0]?.id ?? "" : user?.id ?? ""),
    [patient, isAdmin, doctors, user],
  );

  const [full_name, setName] = useState(patient?.full_name ?? "");
  const [email, setEmail] = useState(patient?.email ?? "");
  const [phone, setPhone] = useState(patient?.phone ?? "");
  const [birth_date, setBirth] = useState(patient?.birth_date ?? "");
  const [gender, setGender] = useState(patient?.gender ?? "femenino");
  const [status, setStatus] = useState(patient?.status ?? "nuevo");
  const [assigned_doctor_id, setDoctor] = useState(defaultDoctor);
  const [notes, setNotes] = useState(patient?.notes ?? "");

  const create = useCreatePatient();
  const update = useUpdatePatient();
  const busy = create.isPending || update.isPending;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!full_name.trim()) return;
    const doctorId = isAdmin ? assigned_doctor_id : user?.id ?? "";
    if (!doctorId) {
      toast.error("Falta médico asignado");
      return;
    }
    try {
      const payload = {
        full_name: full_name.trim(),
        email: email || null,
        phone: phone || null,
        birth_date: birth_date || null,
        gender: gender || null,
        status,
        assigned_doctor_id: doctorId,
        address: null,
        notes: notes || null,
      };
      if (isEdit && patient) {
        await update.mutateAsync({ id: patient.id, ...payload });
        toast.success("Paciente actualizado");
      } else {
        await create.mutateAsync(payload);
        toast.success("Paciente creado");
      }
      onOpenChange(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error guardando");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg rounded-3xl">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Editar paciente" : "Nuevo paciente"}</DialogTitle>
          <DialogDescription>
            {isEdit ? "Actualiza los datos del paciente." : "Registra un paciente en la clínica."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="grid gap-4 py-2">
          <div className="grid gap-2">
            <Label htmlFor="name">Nombre completo</Label>
            <Input id="name" value={full_name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={email ?? ""} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="phone">Teléfono</Label>
              <Input id="phone" value={phone ?? ""} onChange={(e) => setPhone(e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="grid gap-2">
              <Label htmlFor="birth">Nacimiento</Label>
              <Input id="birth" type="date" value={birth_date ?? ""} onChange={(e) => setBirth(e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label>Género</Label>
              <Select value={gender ?? ""} onValueChange={setGender}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="femenino">Femenino</SelectItem>
                  <SelectItem value="masculino">Masculino</SelectItem>
                  <SelectItem value="otro">Otro</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Estado</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{STATUSES.map((s) => <SelectItem key={s} value={s}>{statusLabel(s)}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          {isAdmin && (
            <div className="grid gap-2">
              <Label>Médico asignado</Label>
              <Select value={assigned_doctor_id} onValueChange={setDoctor}>
                <SelectTrigger><SelectValue placeholder="Selecciona doctor" /></SelectTrigger>
                <SelectContent>
                  {doctors.map((d) => <SelectItem key={d.id} value={d.id}>{d.full_name || d.email}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          )}
          <div className="grid gap-2">
            <Label htmlFor="notes">Notas</Label>
            <Input id="notes" value={notes ?? ""} onChange={(e) => setNotes(e.target.value)} placeholder="Observaciones" />
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit" disabled={busy} className="bg-gradient-to-r from-mauve to-mauve-soft text-primary-foreground hover:opacity-95">
              {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEdit ? "Guardar cambios" : "Crear paciente"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
