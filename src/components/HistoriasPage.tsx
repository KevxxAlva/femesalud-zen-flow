import { useState, useMemo, useEffect } from "react";
import { User, Printer, HeartPulse } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { usePaginatedPatients } from "@/lib/api/patients";
import { useConsultations } from "@/lib/api/consultations";
import { useDoctors } from "@/lib/api/profiles";
import { useClinicInfo } from "@/lib/api/clinic";
import { supabase } from "@/integrations/supabase/client";

import { exportFullHistory } from "@/lib/pdf/historial-completo";
import { generateRecipePDF } from "@/lib/utils/recipePdf";

// Decoupled components
import { HistoriasSidebar } from "./historias/HistoriasSidebar";
import { HistoriasTimeline } from "./historias/HistoriasTimeline";
import { HistoriasClinicalData } from "./historias/HistoriasClinicalData";

export function HistoriasPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [expandedConsultations, setExpandedConsultations] = useState<Record<string, boolean>>({});
  const [sidebarPage, setSidebarPage] = useState(1);
  const itemsPerPage = 20;

  const { data: doctors = [] } = useDoctors();
  const { data: clinic } = useClinicInfo();
  const doctorMap = useMemo(() => new Map(doctors.map((d) => [d.id, d.full_name || d.email])), [doctors]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery.trim());
      setSidebarPage(1);
    }, 350);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const { data: paginatedResult, isLoading: loadingPatients } = usePaginatedPatients(
    sidebarPage,
    itemsPerPage,
    debouncedQuery || undefined,
    undefined,
    true
  );
  
  const paginatedPatients = paginatedResult?.data ?? [];
  const totalCount = paginatedResult?.count ?? 0;
  const totalPages = Math.ceil(totalCount / itemsPerPage);

  const selectedPatient = paginatedPatients.find((p) => p.id === selectedPatientId);

  const { data: consultations = [], isLoading: loadingConsultations } = useConsultations(
    selectedPatientId || undefined
  );

  const [consumablesByConsultation, setConsumablesByConsultation] = useState<Record<string, any[]>>({});

  useEffect(() => {
    async function fetchConsumables() {
      if (!selectedPatientId || consultations.length === 0) return;
      const consultationIds = consultations.map((c) => c.id);
      
      const { data, error } = await supabase
        .from('consultation_consumables')
        .select(`
          id,
          consultation_id,
          quantity,
          inventory_items (
            name,
            unit
          )
        `)
        .in('consultation_id', consultationIds);
        
      if (!error && data) {
        const grouped: Record<string, any[]> = {};
        data.forEach(row => {
          if (!grouped[row.consultation_id]) grouped[row.consultation_id] = [];
          grouped[row.consultation_id].push({
            id: row.id,
            item_name: row.inventory_items?.name,
            unit: row.inventory_items?.unit,
            quantity: row.quantity
          });
        });
        setConsumablesByConsultation(grouped);
      }
    }
    fetchConsumables();
  }, [selectedPatientId, consultations]);

  const patientConsultations = consultations.map((c) => ({
    ...c,
    consumables: consumablesByConsultation[c.id] || [],
  }));

  const toggleConsultation = (id: string) => {
    setExpandedConsultations((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleExportRecipe = async (patient: any, consultation: any) => {
    const docObj = doctors.find((d) => d.id === consultation.doctor_id);
    const docInfo = {
      name: docObj?.full_name || "Médico Tratante",
      specialty: docObj?.specialty || "Ginecólogo Obstetra",
      uni: docObj?.full_name?.toLowerCase().includes("carli") || docObj?.full_name?.toLowerCase().includes("sole") ? "UC-CHET" : (docObj?.specialty ? "Ginecólogo Obstetra" : "UC-CHET"),
      mpps: docObj?.full_name?.toLowerCase().includes("carli") || docObj?.full_name?.toLowerCase().includes("sole") ? "102.927" : "",
      cmc: docObj?.full_name?.toLowerCase().includes("carli") || docObj?.full_name?.toLowerCase().includes("sole") ? "11.619" : "",
    };
    await generateRecipePDF(patient, consultation, clinic, docInfo);
  };

  return (
    <div className="space-y-4 max-h-[calc(100vh-80px)] flex flex-col">
      <header className="flex flex-col gap-1.5 ml-14 md:ml-0 shrink-0">
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Módulo Médico</p>
        <h1 className="text-2xl font-semibold tracking-tight">Historias Clínicas</h1>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 flex-1 min-h-0">
        {/* LEFT PANEL: Patient Search & List */}
        <HistoriasSidebar 
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          loadingPatients={loadingPatients}
          paginatedPatients={paginatedPatients}
          selectedPatientId={selectedPatientId}
          setSelectedPatientId={setSelectedPatientId}
          setExpandedConsultations={setExpandedConsultations}
          sidebarPage={sidebarPage}
          setSidebarPage={setSidebarPage}
          totalPages={totalPages}
        />

        {/* RIGHT PANEL: Patient Detail & Clinical Timeline */}
        <div className="md:col-span-2 rounded-3xl glass-card border border-border/40 p-5 flex flex-col min-h-0 shadow-sm relative">
          {!selectedPatient ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-12 text-muted-foreground">
              <HeartPulse className="h-12 w-12 text-muted-foreground/30 animate-pulse mb-3" />
              <p className="font-semibold text-sm">Selecciona una paciente</p>
              <p className="text-xs text-muted-foreground/80 mt-1">Busca y haz clic en una paciente en el panel izquierdo para visualizar su expediente clínico completo.</p>
            </div>
          ) : (
            <>
              {/* Header Info */}
              <div className="flex items-start justify-between border-b border-border/20 pb-4 mb-4 shrink-0">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-mauve to-blush text-primary-foreground font-bold shadow-sm">
                    <User className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold flex items-center gap-2">
                      {selectedPatient.full_name}
                      {selectedPatient.historia_number && (
                        <span className="text-xs bg-mauve/10 text-mauve-foreground px-2 py-0.5 rounded-md font-bold">
                          Nº Historia: {selectedPatient.historia_number}
                        </span>
                      )}
                    </h2>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      C.I. {selectedPatient.document_id || "—"} · Tel: {selectedPatient.phone || "—"}
                    </p>
                  </div>
                </div>

                <Button
                  onClick={() => exportFullHistory(selectedPatient, patientConsultations, clinic, doctorMap)}
                  size="sm"
                  className="rounded-xl flex items-center gap-1 bg-gradient-to-r from-mauve to-mauve-soft text-primary-foreground shadow-sm shadow-mauve/20 cursor-pointer h-9 px-4"
                >
                  <Printer className="h-4 w-4" /> Exportar Expediente
                </Button>
              </div>

              <Tabs defaultValue="timeline" className="flex-1 flex flex-col min-h-0">
                <TabsList className="grid w-full grid-cols-4 bg-muted/60 p-1 rounded-2xl mb-4 shrink-0">
                  <TabsTrigger value="timeline" className="rounded-xl font-medium text-xs">Cronología de Consultas</TabsTrigger>
                  <TabsTrigger value="gyn-obs" className="rounded-xl font-medium text-xs">Ginecología y Obstetricia</TabsTrigger>
                  <TabsTrigger value="base" className="rounded-xl font-medium text-xs">Antecedentes Clínicos</TabsTrigger>
                  <TabsTrigger value="info" className="rounded-xl font-medium text-xs">Ficha de Identificación</TabsTrigger>
                </TabsList>

                <ScrollArea className="flex-1 pr-1">
                  {/* TAB 1: TIMELINE */}
                  <TabsContent value="timeline" className="space-y-4 mt-0 outline-none">
                    <HistoriasTimeline 
                      patientConsultations={patientConsultations}
                      loadingConsultations={loadingConsultations}
                      expandedConsultations={expandedConsultations}
                      toggleConsultation={toggleConsultation}
                      doctorMap={doctorMap}
                      selectedPatient={selectedPatient}
                      handleExportRecipe={handleExportRecipe}
                    />
                  </TabsContent>

                  <HistoriasClinicalData 
                    selectedPatient={selectedPatient}
                    doctorMap={doctorMap}
                  />
                </ScrollArea>
              </Tabs>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
