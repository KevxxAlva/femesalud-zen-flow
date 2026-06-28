import React from "react";
import { Search, Loader2, ChevronLeft, ChevronRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Patient } from "@/lib/api/patients";

interface HistoriasSidebarProps {
  searchQuery: string;
  setSearchQuery: (val: string) => void;
  loadingPatients: boolean;
  paginatedPatients: Patient[];
  selectedPatientId: string | null;
  setSelectedPatientId: (id: string | null) => void;
  setExpandedConsultations: (val: Record<string, boolean>) => void;
  sidebarPage: number;
  setSidebarPage: React.Dispatch<React.SetStateAction<number>>;
  totalPages: number;
}

export const HistoriasSidebar = React.memo(function HistoriasSidebar({
  searchQuery,
  setSearchQuery,
  loadingPatients,
  paginatedPatients,
  selectedPatientId,
  setSelectedPatientId,
  setExpandedConsultations,
  sidebarPage,
  setSidebarPage,
  totalPages,
}: HistoriasSidebarProps) {
  return (
    <div className="md:col-span-1 rounded-3xl glass-card border border-border/40 p-4 flex flex-col min-h-0 shadow-sm">
      <div className="relative mb-3">
        <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Buscar por nombre, historia o cédula..."
          className="pl-9 rounded-2xl bg-muted/40 h-10 border-border/30 text-xs"
        />
      </div>

      <ScrollArea className="flex-1 pr-1.5">
        {loadingPatients ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : paginatedPatients.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-8">
            No se encontraron pacientes.
          </p>
        ) : (
          <div className="space-y-1.5">
            {paginatedPatients.map((p) => (
              <button
                key={p.id}
                onClick={() => {
                  setSelectedPatientId(p.id);
                  setExpandedConsultations({});
                }}
                className={cn(
                  "w-full text-left p-3 rounded-2xl border transition duration-200 flex flex-col gap-1 cursor-pointer",
                  selectedPatientId === p.id
                    ? "bg-mauve/10 border-mauve text-mauve-foreground"
                    : "bg-card/50 border-border/40 hover:bg-card hover:border-border"
                )}
              >
                <div className="flex items-start justify-between">
                  <span className="font-bold text-xs truncate pr-1">{p.full_name}</span>
                  {p.historia_number && (
                    <span className="text-[10px] bg-muted px-1.5 py-0.5 rounded font-extrabold text-muted-foreground shrink-0">
                      #{p.historia_number}
                    </span>
                  )}
                </div>
                <div className="flex items-center justify-between text-[10px] text-muted-foreground mt-0.5">
                  <span>C.I. {p.document_id || "—"}</span>
                  <span>{p.phone || "—"}</span>
                </div>
              </button>
            ))}
          </div>
        )}
      </ScrollArea>

      {totalPages > 1 && (
        <div className="mt-3 flex items-center justify-between gap-2 border-t border-border/40 pt-2.5 animate-fade-in">
          <Button
            variant="ghost"
            size="sm"
            disabled={sidebarPage === 1}
            onClick={() => setSidebarPage((prev) => Math.max(1, prev - 1))}
            className="h-8 w-8 p-0 rounded-xl hover:bg-mauve/10 cursor-pointer flex items-center justify-center"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-[10px] font-semibold text-muted-foreground">
            Pág. {sidebarPage} de {totalPages}
          </span>
          <Button
            variant="ghost"
            size="sm"
            disabled={sidebarPage === totalPages}
            onClick={() => setSidebarPage((prev) => Math.min(totalPages, prev + 1))}
            className="h-8 w-8 p-0 rounded-xl hover:bg-mauve/10 cursor-pointer flex items-center justify-center"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
});
