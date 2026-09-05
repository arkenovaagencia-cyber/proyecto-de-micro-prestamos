"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";

function money(n: number) {
  return "RD$ " + Number(n).toLocaleString("es-DO", { minimumFractionDigits: 2 });
}

export default function PagoModal({
  prestamoId, prestamistaId, cuotaId, montoSugerido, infoTransferencia,
}: {
  prestamoId: string; prestamistaId: string; cuotaId: string; montoSugerido: number;
  infoTransferencia: Record<string, string>;
}) {
  const router = useRouter();
  const supabase = createClient();
  const [abierto, setAbierto] = useState(false);
  const [metodo, setMetodo] = useState<"transferencia" | "paypal" | null>(null);
  const [monto, setMonto] = useState(String(Math.round(montoSugerido)));
  const [comprobante, setComprobante] = useState<File | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [enviado, setEnviado] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const tieneTransferencia = !!infoTransferencia?.numero_cuenta;
  const tienePaypal = !!infoTransferencia?.paypal_link;

  async function enviarComprobante() {
    if (!comprobante) { setError("Adjunta tu comprobante de pago."); return; }
    setEnviando(true);
    setError(null);
    const userId = (await supabase.auth.getUser()).data.user?.id;
    const path = `${userId}/${prestamoId}-${Date.now()}-${comprobante.name}`;
    const { error: upErr } = await supabase.storage.from("comprobantes").upload(path, comprobante);
    if (upErr) { setError("No se pudo subir el comprobante."); setEnviando(false); return; }
    const { data: pub } = supabase.storage.from("comprobantes").getPublicUrl(path);

    const { error: insErr } = await supabase.from("pagos").insert({
      prestamista_id: prestamistaId,
      prestamo_id: prestamoId,
      cuota_id: cuotaId,
      monto: Number(monto),
      metodo,
      estado: "pendiente",
      comprobante_url: pub.publicUrl,
    });
    setEnviando(false);
    if (insErr) { setError("No se pudo registrar el pago."); return; }
    setEnviado(true);
    router.refresh();
  }

  function cerrar() {
    setAbierto(false);
    setMetodo(null);
    setComprobante(null);
    setEnviado(false);
    setError(null);
  }

  return (
    <>
      <Button size="sm" className="mt-3" onClick={() => setAbierto(true)}>Pagar</Button>

      {abierto && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-5 z-50" onClick={(e) => e.target === e.currentTarget && cerrar()}>
          <div className="bg-[#0a0906] border border-white/10 rounded-2xl p-7 max-w-sm w-full">
            {enviado ? (
              <>
                <h3 className="text-lg font-semibold mb-2">Comprobante enviado</h3>
                <p className="text-sm text-white/60 mb-5">Tu pago quedó pendiente de confirmación. Te avisaremos cuando se apruebe.</p>
                <Button size="sm" className="w-full" onClick={cerrar}>Cerrar</Button>
              </>
            ) : !metodo ? (
              <>
                <h3 className="text-lg font-semibold mb-4">¿Cómo quieres pagar?</h3>
                <div className="space-y-2">
                  {tieneTransferencia && (
                    <button onClick={() => setMetodo("transferencia")} className="w-full text-left border border-white/15 hover:border-[#eac888]/50 rounded-xl p-4 transition">
                      <div className="font-semibold text-sm">Transferencia bancaria</div>
                      <div className="text-xs text-white/50 mt-0.5">Te mostramos la cuenta y subes tu comprobante</div>
                    </button>
                  )}
                  {tienePaypal && (
                    <button onClick={() => setMetodo("paypal")} className="w-full text-left border border-white/15 hover:border-[#eac888]/50 rounded-xl p-4 transition">
                      <div className="font-semibold text-sm">PayPal</div>
                      <div className="text-xs text-white/50 mt-0.5">Pagas por PayPal y subes tu comprobante</div>
                    </button>
                  )}
                  {!tieneTransferencia && !tienePaypal && (
                    <p className="text-sm text-white/50">Todavía no hay métodos de pago configurados. Contacta al administrador.</p>
                  )}
                </div>
                <Button size="sm" variant="ghost" className="w-full mt-4" onClick={cerrar}>Cancelar</Button>
              </>
            ) : (
              <>
                <h3 className="text-lg font-semibold mb-3">{metodo === "transferencia" ? "Transferencia bancaria" : "Pago con PayPal"}</h3>

                {metodo === "transferencia" && (
                  <div className="bg-white/5 border border-white/10 rounded-xl p-4 mb-4 text-sm space-y-1.5">
                    <div className="flex justify-between"><span className="text-white/50">Banco</span><span>{infoTransferencia.banco}</span></div>
                    <div className="flex justify-between"><span className="text-white/50">Cuenta</span><span className="font-mono">{infoTransferencia.numero_cuenta}</span></div>
                    <div className="flex justify-between"><span className="text-white/50">Tipo</span><span>{infoTransferencia.tipo_cuenta}</span></div>
                    <div className="flex justify-between"><span className="text-white/50">Titular</span><span>{infoTransferencia.titular}</span></div>
                  </div>
                )}
                {metodo === "paypal" && (
                  <a href={infoTransferencia.paypal_link} target="_blank" rel="noopener noreferrer" className="block text-center bg-[#eac888] text-[#1a1305] font-semibold rounded-full py-3 text-sm mb-4">
                    Ir a pagar con PayPal →
                  </a>
                )}

                <label className="block text-sm font-semibold text-white/85 mb-1.5">Monto que pagaste (RD$)</label>
                <input type="number" value={monto} onChange={(e) => setMonto(e.target.value)}
                  className="w-full px-3.5 py-3 border border-white/15 bg-white/5 text-white rounded-xl text-sm mb-4 focus:outline-none focus:ring-2 focus:ring-[#eac888]/40" />

                <label className="block text-sm font-semibold text-white/85 mb-1.5">Sube tu comprobante</label>
                <input type="file" accept="image/*,.pdf" onChange={(e) => setComprobante(e.target.files?.[0] ?? null)} className="w-full text-sm text-white/70 mb-4" />

                {error && <div className="bg-red-400/10 text-red-300 text-sm rounded-xl px-4 py-3 mb-4">{error}</div>}

                <div className="flex gap-2">
                  <Button size="sm" variant="ghost" onClick={() => setMetodo(null)}>Atrás</Button>
                  <Button size="sm" className="flex-1" disabled={enviando} onClick={enviarComprobante}>
                    {enviando ? "Enviando..." : "Enviar comprobante"}
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
