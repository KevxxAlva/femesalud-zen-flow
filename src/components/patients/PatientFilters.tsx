import React from "react";
import { Search, X } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Database } from "@/integrations/supabase/types";

type Doctor = Database["public"]["Tables"]["profiles"]["Row"];

interface PatientFiltersProps {
  q: string;
  setQ: (val: string) => void;
  status: string;
  setStatus: (val: string) => void;
  doctorFilter: string;
  setDoctorFilter: (val: string) => void;
  doctors: Doctor[];
  STATUSES: string[];
  statusLabel: (s: string) => string;
}

export const PatientFilters = React.memo(function PatientFilters({
  q,
  setQ,
  status,
  setStatus,
  doctorFilter,
  setDoctorFilter,
  doctors,
  STATUSES,
  statusLabel,
}: PatientFiltersProps) {
  return (
    <div className="rounded-3xl glass-card p-4 shadow-sm">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex flex-1 min-w-[220px] items-center gap-2 rounded-2xl bg-muted/60 px-3.5 py-2.5">
          <Search className="h-4 w-4 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar por nombre o email…"
            className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
          {q && (
            <button
              onClick={() => setQ("")}
              className="text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-[170px] rounded-2xl">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {STATUSES.map((s) => (
              <SelectItem key={s} value={s}>
                {statusLabel(s)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={doctorFilter} onValueChange={setDoctorFilter}>
          <SelectTrigger className="w-[210px] rounded-2xl">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Todos">Todos los médicos</SelectItem>
            {doctors.map((d) => (
              <SelectItem key={d.id} value={d.id}>
                {d.full_name || d.email}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
});
