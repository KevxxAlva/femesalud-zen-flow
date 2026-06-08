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
  store, useStore, type Appointment, type AppointmentStatus, DOCTORS,
} from "@/lib/store";

const STATUSES: AppointmentStatus[] = ["programada", "completada", "cancelada"];

export function AppointmentForm({
  open, onOpenChange, appointment, defaultPatientId,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  appointment?: Appointment | null;
  defaultPatientId?: string;
}) {
  const patients = useStore((s) => s.patients);
  const isEdit = !!appointment;
  const [patientId, setPatientId] = useState(appointment?.patientId ?? defaultPatientId ?? patients[0]?.id ?? "");
  const [doctor, setDoctor] = useState(appointment?.doctor ?? DOCTORS[0]);
  const [date, setDate] = useState(appointment?.date ?? new Date().toISOString().slice(0, 10));
  const [time, setTime] = useState(appointment?.time ?? "09:00");
  const [reason, setReason] = useState(appointment?.reason ?? "");
  const [status, setStatus] = useState<AppointmentStatus>(appointment?.status ?? "programada");

  const submit = () => {
    const patient = patients.find((p) => p.id === patientId);
    if (!patient || !reason.trim()) return;
    const payload = { patientId, patientName: patient.name, doctor, date, time, reason: reason.trim(), status };
    if (isEdit && appointment) store.updateAppointment(appointment.id, payload);
    else store.addAppointment(payload);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg rounded-3xl">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Editar cita" : "Nueva cita"}</DialogTitle>
          <DialogDescription>
            {isEdit ? "Actualiza los datos de la cita." : "Programa una cita médica."}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-2">
          <div className="grid gap-2">
            <Label>Paciente</Label>
            <Select value={patientId} onValueChange={setPatientId}>
              <SelectTrigger><SelectValue placeholder="Selecciona paciente" /></SelectTrigger>
              <SelectContent>{patients.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label>Médico</Label>
            <Select value={doctor} onValueChange={setDoctor}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{DOCTORS.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-2">
              <Label htmlFor="date">Fecha</Label>
              <Input id="date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="time">Hora</Label>
              <Input id="time" type="time" value={time} onChange={(e) => setTime(e.target.value)} />
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="reason">Motivo</Label>
            <Input id="reason" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Control, ecografía…" />
          </div>
          <div className="grid gap-2">
            <Label>Estado</Label>
            <Select value={status} onValueChange={(v) => setStatus(v as AppointmentStatus)}>
              <SelectTrigger className="capitalize"><SelectValue /></SelectTrigger>
              <SelectContent>{STATUSES.map((s) => <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>)}</SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={submit} className="bg-gradient-to-r from-mauve to-mauve-soft text-primary-foreground hover:opacity-95">
            {isEdit ? "Guardar cambios" : "Crear cita"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
