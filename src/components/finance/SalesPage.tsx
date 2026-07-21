import { useState } from "react";
import { Search, Plus, X, Pencil, Trash2, ChevronLeft, ChevronRight, Filter, ReceiptText, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

type Invoice = {
  id_factura: number;
  id_paciente: number | null;
  paciente_nombre?: string;
  fecha_emision: string;
  subtotal: number;
  monto_paciente: number;
  total_general: number;
  estado_pago: string;
};

export function SalesPage() {
  const [q, setQ] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  const { data: facturas = [], isLoading } = useQuery({
    queryKey: ["facturas"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("facturas")
        .select(`
          id_factura, 
          id_paciente,
          fecha_emision,
          subtotal,
          monto_paciente,
          total_general,
          estado_pago,
          pacientes (nombre, apellido)
        `)
        .order("fecha_emision", { ascending: false });

      if (error) throw error;
      
      return data.map((f: any) => ({
        id_factura: f.id_factura,
        id_paciente: f.id_paciente,
        paciente_nombre: f.pacientes ? `${f.pacientes.nombre} ${f.pacientes.apellido}` : "Paciente Desconocido",
        fecha_emision: f.fecha_emision,
        subtotal: f.subtotal,
        monto_paciente: f.monto_paciente,
        total_general: f.total_general,
        estado_pago: f.estado_pago || "Pendiente",
      })) as Invoice[];
    }
  });

  const filtered = facturas.filter((f) => {
    if (!q) return true;
    const term = q.toLowerCase();
    return f.id_factura.toString().includes(term) || (f.paciente_nombre?.toLowerCase().includes(term));
  });

  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const paginated = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <div className="bg-white rounded-[2rem] p-6 shadow-sm min-h-[calc(100vh-8rem)] font-sans flex flex-col">
      <header className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <button className="text-[#a3aed1] hover:text-[#2b3674]"><ChevronLeft className="h-5 w-5" /></button>
          <h1 className="text-xl font-bold text-[#2b3674]">Facturación</h1>
        </div>
        <div className="flex-1 max-w-xl mx-auto">
          <div className="flex items-center gap-2 rounded-full bg-gray-50 border border-gray-100 px-4 py-2.5 w-full">
            <Search className="h-4 w-4 text-[#a3aed1]" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Buscar facturas por ID o paciente..."
              className="w-full bg-transparent text-sm outline-none placeholder:text-[#a3aed1] text-[#2b3674]"
            />
            {q && <button onClick={() => setQ("")} className="text-[#a3aed1] hover:text-[#2b3674]"><X className="h-4 w-4" /></button>}
          </div>
        </div>
        <div className="flex items-center gap-4 hidden md:flex">
          {/* Nueva Factura button was removed here */}
        </div>
      </header>

      <div className="flex flex-wrap items-center justify-between mb-4 border-b border-[#f0f2f5] pb-4 mt-2">
        <div className="flex items-center gap-2 text-sm font-bold text-[#a3aed1]">
          <ReceiptText className="h-4 w-4" /> {filtered.length} facturas
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-[#2b3674] border border-[#f0f2f5] rounded-xl hover:bg-gray-50">
            <Filter className="h-3.5 w-3.5" /> Filtros
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-[#f8f9fb] text-[10px] font-bold text-[#a3aed1] uppercase tracking-wider">
              <th className="p-4 w-12 rounded-tl-xl"><input type="checkbox" className="rounded border-gray-300" /></th>
              <th className="p-4">ID Factura <span className="ml-1">↕</span></th>
              <th className="p-4">Paciente <span className="ml-1">↕</span></th>
              <th className="p-4">Fecha <span className="ml-1">↕</span></th>
              <th className="p-4">Monto Total <span className="ml-1">↕</span></th>
              <th className="p-4">Estado <span className="ml-1">↕</span></th>
              <th className="p-4 rounded-tr-xl">Acción <span className="ml-1">↕</span></th>
            </tr>
          </thead>
          <tbody className="text-sm">
            {isLoading ? (
              <tr><td colSpan={7} className="p-12 text-center"><Loader2 className="mx-auto h-6 w-6 animate-spin text-[#a3aed1]" /></td></tr>
            ) : paginated.length === 0 ? (
              <tr><td colSpan={7} className="p-12 text-center text-[#a3aed1] font-medium">No se encontraron facturas.</td></tr>
            ) : (
              paginated.map((f) => (
                <tr key={f.id_factura} className="border-b border-[#f0f2f5] hover:bg-gray-50/50 transition group">
                  <td className="p-4"><input type="checkbox" className="rounded border-gray-300" /></td>
                  <td className="p-4 font-bold text-[#2b3674]">INV-{f.id_factura.toString().padStart(4, '0')}</td>
                  <td className="p-4 text-[#a3aed1] font-medium">{f.paciente_nombre}</td>
                  <td className="p-4 text-[#a3aed1] font-medium">{f.fecha_emision ? new Date(f.fecha_emision).toLocaleDateString() : '—'}</td>
                  <td className="p-4">
                    <span className="font-bold text-[#2b3674]">
                      ${f.total_general.toFixed(2)}
                    </span>
                  </td>
                  <td className="p-4">
                    <span className={cn(
                      "text-[10px] font-bold px-2.5 py-1 rounded-full tracking-wide capitalize",
                      f.estado_pago === "pagado" || f.estado_pago === "Paid" ? "bg-green-50 text-green-600 border border-green-100" : 
                      f.estado_pago === "pendiente" || f.estado_pago === "Pending" ? "bg-yellow-50 text-yellow-600 border border-yellow-100" :
                      "bg-red-50 text-red-600 border border-red-100"
                    )}>
                      {f.estado_pago === "Paid" ? "pagado" : f.estado_pago === "Pending" ? "pendiente" : f.estado_pago}
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-3 text-[#a3aed1]">
                      <button className="hover:text-[#2b3674]"><Pencil className="h-4 w-4" /></button>
                      <button className="hover:text-red-500"><Trash2 className="h-4 w-4" /></button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between pt-4 border-t border-[#f0f2f5]">
          <p className="text-xs text-[#a3aed1] font-medium">
            Mostrando <span className="font-bold text-[#2b3674]">{(currentPage - 1) * itemsPerPage + 1} - {Math.min(filtered.length, currentPage * itemsPerPage)}</span> de <span className="font-bold text-[#2b3674]">{filtered.length}</span> facturas
          </p>
          <div className="flex gap-1">
            <button disabled={currentPage === 1} onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))} className="h-8 w-8 flex items-center justify-center rounded-lg border border-[#f0f2f5] text-[#a3aed1] hover:bg-gray-50 disabled:opacity-50"><ChevronLeft className="h-4 w-4" /></button>
            <button disabled={currentPage === totalPages} onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))} className="h-8 w-8 flex items-center justify-center rounded-lg border border-[#f0f2f5] text-[#a3aed1] hover:bg-gray-50 disabled:opacity-50"><ChevronRight className="h-4 w-4" /></button>
          </div>
        </div>
      )}
    </div>
  );
}
