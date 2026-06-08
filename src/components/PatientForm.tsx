import { useState } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  store, type Patient, type PatientStatus, DOCTORS,
} from "@/lib/store";

const STATUSES: PatientStatus[] = ["Activo", "En tratamiento", "Alta", "Nuevo"];

export function PatientForm({
  open, onOpenChange, patient,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  patient?: Patient | null;
}) {
  const isEdit = !!patient;
  const [name, setName] = useState(patient?.name ?? "");
  const [email, setEmail] = useState(patient?.email ?? "");
  const [phone, setPhone] = useState(patient?.phone ?? "");
  const [age, setAge] = useState(patient?.age?.toString() ?? "");
  const [status, setStatus] = useState<PatientStatus>(patient?.status ?? "Nuevo");
  const [doctor, setDoctor] = useState(patient?.doctor ?? DOCTORS[0]);
  const [notes, setNotes] = useState(patient?.notes ?? "");

  const submit = () => {
    if (!name.trim()) return;
    const payload = {
      name: name.trim(), email, phone, age: Number(age) || 0,
      status, doctor, notes,
      lastVisit: patient?.lastVisit ?? new Date().toISOString().slice(0, 10),
    };
    if (isEdit && patient) store.updatePatient(patient.id, payload);
    else store.addPatient(payload);
    onOpenChange(false);
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
        <div className="grid gap-4 py-2">
          <div className="grid gap-2">
            <Label htmlFor="name">Nombre completo</Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="María Fernández" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="phone">Teléfono</Label>
              <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="grid gap-2">
              <Label htmlFor="age">Edad</Label>
              <Input id="age" type="number" value={age} onChange={(e) => setAge(e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label>Estado</Label>
              <Select value={status} onValueChange={(v) => setStatus(v as PatientStatus)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Médico</Label>
              <Select value={doctor} onValueChange={setDoctor}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{DOCTORS.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="notes">Notas</Label>
            <Input id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Observaciones" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={submit} className="bg-gradient-to-r from-mauve to-mauve-soft text-primary-foreground hover:opacity-95">
            {isEdit ? "Guardar cambios" : "Crear paciente"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
