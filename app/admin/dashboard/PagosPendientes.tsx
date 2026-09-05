"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";

function money(n: number) {
  return "RD$ " + Number(n).toLocaleString("es-DO", { minimumFractionDigits: 2 });
}

interface Pago {
  id: string;
  monto: number;
  metodo: string;
  comprobante_url: string | null;
  prestamos: { clientes: { nombre_completo: string } | null } | null;
}

export default function PagosPendientes({ pagos }: { pagos: Pago[] }) {
  const router = useRouter();
  const supabase = createClient();
  const [cargando, setCargando] = useState<string | null>(null);

  async function resolver(id: string, estado: "confirmado" | "rechazado") {
    setCargando(id);
    await supabase.from("pagos").update({ estado }).eq("id", id);
    setCargando(null);
    router.refresh();
  }

  if (pagos.length === 0) return null;

  return (
    <div className="p-6 bg-white/[0.03] border border-amber-400/30 rounded-2xl mb-7">
      <h2 className="text-lg font-semibold mb-1">Pagos por confirmar</h2>
      <p className="text-xs text-white/40 mb-4">Comprobantes que subieron los clientes — revisa antes de confirmar.</p>
      <div className="space-y-3">
        {pagos.map((p) => {
          const cliente = Array.isArray(p.prestamos) ? p.prestamos[0]?.clientes : p.prestamos?.clientes;
          return (
            <div key={p.id} className="flex items-center justify-between gap-4 border border-white/10 rounded-xl p-4 flex-wrap">
              <div className="flex items-center gap-3">
                {p.comprobante_url && (
                  <a href={p.comprobante_url} target="_blank" rel="noopener noreferrer">
                    <img src={p.comprobante_url} alt="Comprobante" className="w-12 h-12 rounded-lg object-cover border border-white/15" />
                  </a>
                )}
                <div>
                  <div className="font-semibold text-sm">{cliente?.nombre_completo ?? "Cliente"}</div>
                  <div className="text-xs text-white/50 font-mono">{money(p.monto)} · {p.metodo}</div>
                </div>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="danger" disabled={cargando === p.id} onClick={() => resolver(p.id, "rechazado")}>Rechazar</Button>
                <Button size="sm" disabled={cargando === p.id} onClick={() => resolver(p.id, "confirmado")}>Confirmar</Button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
