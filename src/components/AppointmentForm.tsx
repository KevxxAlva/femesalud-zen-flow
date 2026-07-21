import { useState, useMemo, useEffect } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { useCreateAppointment, useUpdateAppointment, type Appointment } from "@/lib/api/appointments";
import { usePaginatedPatients, usePatient } from "@/lib/api/patients";
import { useDoctors } from "@/lib/api/profiles";
import { useServices } from "@/lib/api/services";
import { useAuthSession, useIsAdmin } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Loader2, Check, ChevronsUpDown } from "lucide-react";

const STATUSES = ["programada", "completada", "cancelada"];

function splitDateTime(iso: string | null | undefined, defaultDate?: string) {
  if (!iso) {
    return {
      date: (defaultDate && defaultDate !== "") ? defaultDate : new Date().toISOString().slice(0, 10),
      time: "09:00"
    };
  }
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return {
    date: `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`,
    time: `${pad(d.getHours())}:${pad(d.getMinutes())}`,
  };
}

export function AppointmentForm({
  open, onOpenChange, appointment, defaultPatientId, defaultDate,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  appointment?: Appointment | null;
  defaultPatientId?: string;
  defaultDate?: string;
}) {
  const isEdit = !!appointment;
  const { user } = useAuthSession();
  const isAdmin = useIsAdmin();
  const { data: doctors = [] } = useDoctors();
  const { data: services = [] } = useServices();

  const init = useMemo(() => splitDateTime(appointment?.scheduled_at, defaultDate), [appointment, defaultDate]);
  const [patient_id, setPatient] = useState(appointment?.patient_id ?? defaultPatientId ?? "");
  const defaultDoctorId = useMemo(() => doctors.find(d => d.email === user?.email)?.id || doctors[0]?.id || "", [doctors, user]);
  const [doctor_id, setDoctorId] = useState(appointment?.doctor_id ?? defaultDoctorId);
  const [date, setDate] = useState(init.date);
  const [time, setTime] = useState(init.time);
  const [reason, setReason] = useState(appointment?.reason ?? "");
  const [status, setStatus] = useState(appointment?.status ?? "programada");
  const [duration, setDuration] = useState(String(appointment?.duration_minutes ?? 30));
  const [price, setPrice] = useState(String(appointment?.price ?? 0));
  const [selectedServiceId, setSelectedServiceId] = useState<string>("none");

  const [popoverOpen, setPopoverOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const { data: selectedPatient } = usePatient(patient_id || undefined);
  const { data: paginatedData } = usePaginatedPatients(1, 15, searchTerm || undefined);

  const selectedPatientName = selectedPatient?.full_name || "Selecciona paciente...";

  const filteredPatients = useMemo(() => {
    const list = paginatedData?.data || [];
    if (!searchTerm && selectedPatient && !list.some(p => p.id === patient_id)) {
      return [selectedPatient, ...list].slice(0, 15);
    }
    return list;
  }, [paginatedData, selectedPatient, searchTerm, patient_id]);

  const create = useCreateAppointment();
  const update = useUpdateAppointment();
  const busy = create.isPending || update.isPending;

  useEffect(() => {
    if (open) {
      const initData = splitDateTime(appointment?.scheduled_at, defaultDate);
      setPatient(appointment?.patient_id ?? defaultPatientId ?? "");
      setDoctorId(appointment?.doctor_id ?? defaultDoctorId);
      setDate(initData.date);
      setTime(initData.time);
      setReason(appointment?.reason ?? "");
      setStatus(appointment?.status ?? "programada");
      setDuration(String(appointment?.duration_minutes ?? 30));
      setPrice(String(appointment?.price ?? 0));
    }
  }, [open, appointment, defaultDate, defaultPatientId, user, defaultDoctorId]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!patient_id) { toast.error("Selecciona un paciente"); return; }
    const finalDoctor = doctor_id;
    if (!finalDoctor) { toast.error("Falta seleccionar un doctor"); return; }
    // Avoid timezone shift by passing local ISO string without Z
    const scheduled_at = `${date}T${time}:00`;
    const payload = {
      patient_id, doctor_id: finalDoctor, scheduled_at,
      duration_minutes: Number(duration) || 30,
      reason: reason || null, status,
      price: Number(price) || 0,
    };
    try {
      if (isEdit && appointment) {
        await update.mutateAsync({ id: appointment.id, ...payload });
        toast.success("Cita actualizada");
      } else {
        await create.mutateAsync(payload);
        toast.success("Cita programada");
      }
      onOpenChange(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al guardar");
    }
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
        <form onSubmit={submit} className="grid gap-4 py-2">
          <div className="grid gap-2">
            <Label>Paciente</Label>
            <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={popoverOpen}
                  className="w-full justify-between rounded-xl font-normal text-xs h-10 border-border/30 bg-muted/40 hover:bg-muted/60 text-left px-3"
                >
                  <span className="truncate">{selectedPatientName}</span>
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0 rounded-2xl border-border/40 shadow-lg" align="start">
                <Command shouldFilter={false}>
                  <CommandInput
                    placeholder="Buscar paciente por nombre, cédula o historia..."
                    value={searchTerm}
                    onValueChange={setSearchTerm}
                    className="text-xs h-9"
                  />
                  <CommandList className="max-h-[200px] overflow-y-auto">
                    <CommandEmpty className="text-xs text-muted-foreground p-3 text-center">
                      No se encontraron pacientes.
                    </CommandEmpty>
                    <CommandGroup>
                      {filteredPatients.map((p) => (
                        <CommandItem
                          key={p.id}
                          value={p.id}
                          onSelect={() => {
                            setPatient(p.id);
                            setPopoverOpen(false);
                            setSearchTerm("");
                          }}
                          className="text-xs rounded-xl flex items-center justify-between cursor-pointer p-2 hover:bg-mauve/10"
                        >
                          <div className="flex flex-col gap-0.5 min-w-0">
                            <span className="font-semibold truncate">{p.full_name}</span>
                            <span className="text-[10px] text-muted-foreground">
                              C.I. {p.document_id || "—"} {p.historia_number && `· #${p.historia_number}`}
                            </span>
                          </div>
                          {patient_id === p.id && (
                            <Check className="h-4 w-4 text-mauve shrink-0 ml-2" />
                          )}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>
          <div className="grid gap-2">
            <Label>Médico</Label>
            <Select value={doctor_id || undefined} onValueChange={setDoctorId}>
              <SelectTrigger><SelectValue placeholder="Selecciona doctor" /></SelectTrigger>
              <SelectContent>
                {doctors.length === 0 ? (
                  <SelectItem value="none" disabled>No hay doctores registrados</SelectItem>
                ) : (
                  doctors.map((d) => <SelectItem key={d.id} value={d.id}>{d.full_name || d.email}</SelectItem>)
                )}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-2">
              <Label htmlFor="date">Fecha</Label>
              <Input id="date" type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="time">Hora</Label>
              <Input id="time" type="time" value={time} onChange={(e) => setTime(e.target.value)} required />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="grid gap-2">
              <Label>Duración (min)</Label>
              <Input type="number" value={duration} onChange={(e) => setDuration(e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label>Precio</Label>
              <Input type="number" value={price} onChange={(e) => setPrice(e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label>Estado</Label>
              <Select value={status || undefined} onValueChange={setStatus}>
                <SelectTrigger className="capitalize"><SelectValue /></SelectTrigger>
                <SelectContent>{STATUSES.map((s) => <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid gap-2">
            <Label>Tratamiento / Servicio</Label>
            <Select 
              value={selectedServiceId} 
              onValueChange={(val) => {
                setSelectedServiceId(val);
                if (val !== "none") {
                  const s = services.find(x => x.id_servicio === val);
                  if (s) {
                    setPrice(String(s.costo_base || 0));
                    setReason(s.nombre_servicio);
                  }
                }
              }}
            >
              <SelectTrigger><SelectValue placeholder="Selecciona tratamiento..." /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Ninguno (Consulta General)</SelectItem>
                {services.map((s) => (
                  <SelectItem key={s.id_servicio} value={s.id_servicio}>
                    {s.nombre_servicio} {s.costo_base ? `($${s.costo_base})` : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="reason">Motivo o Detalles Adicionales</Label>
            <Input id="reason" value={reason ?? ""} onChange={(e) => setReason(e.target.value)} placeholder="Control, ecografía…" />
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit" disabled={busy} className="bg-gradient-to-r from-mauve to-mauve-soft text-primary-foreground hover:opacity-95">
              {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEdit ? "Guardar cambios" : "Crear cita"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
