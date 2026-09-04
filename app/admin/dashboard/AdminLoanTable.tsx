"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Primitives";

const TIPO_GARANTIA_LABEL: Record<string, string> = {
  telefono: "Teléfono", tv: "TV", vehiculo: "Vehículo",
  joyas: "Joyas", electronico: "Electrónico", otro: "Otro",
};

// Porcentaje del valor estimado de la garantía que se sugiere como monto
// máximo de préstamo (loan-to-value). Reduce el riesgo de prestar más de
// lo que el artículo cubre si hay que quedárselo.
const LTV_SUGERIDO = 0.6;

function money(n: number) {
  return "RD$ " + Number(n).toLocaleString("es-DO", { maximumFractionDigits: 0 });
}

function diasPorFrecuencia(f: string) {
  return f === "semanal" ? 7 : f === "quincenal" ? 15 : 30;
}

interface Garantia {
  tipo: string;
  descripcion?: string | null;
  valor_estimado?: number | null;
  fotos?: string[] | null;
  estado?: string | null;
}

interface PrestamoRow {
  id: string;
  prestamista_id?: string;
  monto_solicitado: number;
  monto_aprobado: number | null;
  tasa_interes: number;
  plazo_cuotas: number;
  frecuencia_pago: string;
  estado: string;
  saldo_pendiente: number | null;
  clientes: { nombre_completo: string; correo: string | null; telefono?: string | null } | null;
  garantias: Garantia[] | null;
}

export default function AdminLoanTable({ prestamos }: { prestamos: PrestamoRow[] }) {
  const router = useRouter();
  const supabase = createClient();
  const [busqueda, setBusqueda] = useState("");
  const [cargandoId, setCargandoId] = useState<string | null>(null);
  const [modalRechazo, setModalRechazo] = useState<string | null>(null);
  const [modalAprobar, setModalAprobar] = useState<PrestamoRow | null>(null);
  const [modalFoto, setModalFoto] = useState<string | null>(null);
  const [modalConfirmarPago, setModalConfirmarPago] = useState<PrestamoRow | null>(null);
  const [modalEliminar, setModalEliminar] = useState<PrestamoRow | null>(null);
  const [errorEliminar, setErrorEliminar] = useState<string | null>(null);
  const [motivo, setMotivo] = useState("");
  const [montoFinal, setMontoFinal] = useState("");
  const [tasaFinal, setTasaFinal] = useState("20");

  const filtrados = prestamos.filter((p) =>
    !busqueda || p.clientes?.nombre_completo.toLowerCase().includes(busqueda.toLowerCase()) || p.clientes?.correo?.toLowerCase().includes(busqueda.toLowerCase())
  );

  async function cambiarEstado(id: string, estado: string) {
    setCargandoId(id);
    await supabase.from("prestamos").update({ estado }).eq("id", id);
    setCargandoId(null);
    router.refresh();
  }

  function abrirAprobar(p: PrestamoRow) {
    const garantia = p.garantias?.[0];
    const sugerido = garantia?.valor_estimado ? Math.round(garantia.valor_estimado * LTV_SUGERIDO) : p.monto_solicitado;
    setMontoFinal(String(Math.min(sugerido, p.monto_solicitado) || p.monto_solicitado));
    setTasaFinal("20");
    setModalAprobar(p);
  }

  async function confirmarAprobar() {
    const p = modalAprobar;
    if (!p) return;
    setCargandoId(p.id);

    const monto = Number(montoFinal);
    const tasa = Number(tasaFinal);
    const total = monto * (1 + tasa / 100);
    const cuota = total / p.plazo_cuotas;
    const fechaAprobacion = new Date();

    await supabase.from("prestamos").update({
      estado: "activo",
      monto_aprobado: monto,
      tasa_interes: tasa,
      saldo_pendiente: total,
      fecha_aprobacion: fechaAprobacion.toISOString(),
    }).eq("id", p.id);

    // Genera el plan de cuotas real, con fecha de vencimiento de cada una,
    // según la frecuencia elegida por el cliente (semanal/quincenal/mensual).
    const dias = diasPorFrecuencia(p.frecuencia_pago);
    const filas = Array.from({ length: p.plazo_cuotas }, (_, i) => {
      const venc = new Date(fechaAprobacion);
      venc.setDate(venc.getDate() + dias * (i + 1));
      return {
        prestamo_id: p.id,
        numero_cuota: i + 1,
        fecha_vencimiento: venc.toISOString().slice(0, 10),
        monto_cuota: cuota,
      };
    });
    await supabase.from("cuotas").insert(filas);

    // Marca la garantía como verificada al aprobar.
    await supabase.from("garantias").update({ estado: "verificada" }).eq("prestamo_id", p.id);

    setCargandoId(null);
    setModalAprobar(null);
    router.refresh();
  }

  async function confirmarRechazo(id: string) {
    setCargandoId(id);
    await supabase.from("prestamos").update({ estado: "rechazado", motivo_rechazo: motivo || "No especificado" }).eq("id", id);
    await supabase.from("garantias").update({ estado: "devuelta" }).eq("prestamo_id", id);
    setCargandoId(null);
    setModalRechazo(null);
    setMotivo("");
    router.refresh();
  }

  async function registrarPago(p: PrestamoRow) {
    setCargandoId(p.id);
    const cuota = (p.monto_aprobado ?? p.monto_solicitado) * (1 + p.tasa_interes / 100) / p.plazo_cuotas;
    await supabase.from("pagos").insert({
      prestamista_id: p.prestamista_id,
      prestamo_id: p.id,
      monto: cuota,
      metodo: "efectivo",
      estado: "confirmado",
    });
    setCargandoId(null);
    setModalConfirmarPago(null);
    router.refresh();
  }

  function calcularCuota(p: PrestamoRow) {
    return (p.monto_aprobado ?? p.monto_solicitado) * (1 + p.tasa_interes / 100) / p.plazo_cuotas;
  }

  async function eliminarSolicitud(p: PrestamoRow) {
    setCargandoId(p.id);
    setErrorEliminar(null);
    // Los pagos nunca se pueden borrar (protección de la base de datos),
    // así que esto solo puede afectar solicitudes que nunca llegaron a
    // tener un pago real — es decir, rechazadas.
    await supabase.from("garantias").delete().eq("prestamo_id", p.id);
    await supabase.from("cuotas").delete().eq("prestamo_id", p.id);
    const { error: delError } = await supabase.from("prestamos").delete().eq("id", p.id);
    setCargandoId(null);
    if (delError) {
      setErrorEliminar("No se pudo eliminar (probablemente tiene pagos asociados, por seguridad no se puede borrar historial con pagos).");
      return;
    }
    setModalEliminar(null);
    router.refresh();
  }

  function linkWhatsapp(p: PrestamoRow) {
    const tel = (p.clientes?.telefono || "").replace(/\D/g, "");
    const saldo = money(p.saldo_pendiente ?? 0);
    const nombre = p.clientes?.nombre_completo?.split(" ")[0] ?? "";
    const mensaje = encodeURIComponent(
      `Hola ${nombre}, te escribimos de Prestamigo para recordarte que tienes un saldo pendiente de ${saldo}. Recuerda que cada día de atraso se suman RD$50 al total. ¿Podemos coordinar tu pago? Gracias.`
    );
    return `https://wa.me/1${tel}?text=${mensaje}`;
  }

  return (
    <div>
      <input
        type="text"
        placeholder="Buscar cliente..."
        value={busqueda}
        onChange={(e) => setBusqueda(e.target.value)}
        className="mb-4 px-4 py-2 border border-white/15 bg-white/5 text-white placeholder-white/30 rounded-full text-sm w-64 focus:outline-none focus:ring-2 focus:ring-[#eac888]/40"
      />

      {filtrados.length === 0 ? (
        <div className="text-center py-12 text-white/40">Aún no hay solicitudes de préstamo.</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase text-white/40 border-b border-white/10">
                <th className="pb-3">Cliente</th>
                <th className="pb-3">Monto</th>
                <th className="pb-3">Garantía</th>
                <th className="pb-3">Estado</th>
                <th className="pb-3"></th>
              </tr>
            </thead>
            <tbody>
              {filtrados.map((p) => {
                const garantia = p.garantias?.[0];
                const foto = garantia?.fotos?.[0];
                const busy = cargandoId === p.id;
                const enMora = p.estado === "activo" && p.saldo_pendiente && Number(p.saldo_pendiente) > 0;
                return (
                  <tr key={p.id} className="border-b border-white/8 align-top">
                    <td className="py-3.5">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-[#eac888]/10 text-[#eac888] flex items-center justify-center font-bold text-xs flex-shrink-0">
                          {p.clientes?.nombre_completo?.[0]?.toUpperCase() ?? "?"}
                        </div>
                        <div>
                          <div className="font-semibold">{p.clientes?.nombre_completo ?? "—"}</div>
                          <div className="text-white/40 text-xs">{p.clientes?.correo}</div>
                        </div>
                      </div>
                    </td>
                    <td className="font-mono py-3.5">{money(p.monto_solicitado)}</td>
                    <td className="py-3.5">
                      <div className="flex items-center gap-2">
                        {foto && (
                          <button type="button" onClick={() => setModalFoto(foto)} className="flex-shrink-0">
                            <img src={foto} alt="Garantía" className="w-9 h-9 rounded-lg object-cover border border-white/15 hover:border-[#eac888]/60 transition" />
                          </button>
                        )}
                        <div className="text-white/70">
                          <div>{garantia ? TIPO_GARANTIA_LABEL[garantia.tipo] : "—"}</div>
                          {garantia?.valor_estimado ? (
                            <div className="text-xs text-white/40 font-mono">Est. {money(garantia.valor_estimado)}</div>
                          ) : null}
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5">
                      <Badge estado={p.estado}>{p.estado}</Badge>
                      {enMora && <div className="text-[10px] text-red-300 mt-1">Saldo activo</div>}
                    </td>
                    <td className="py-3.5">
                      <div className="flex gap-1.5 flex-wrap">
                        {(p.estado === "pendiente" || p.estado === "revision") && (
                          <>
                            {p.estado === "pendiente" && (
                              <Button size="sm" variant="ghost" disabled={busy} onClick={() => cambiarEstado(p.id, "revision")}>
                                Mandar a revisión
                              </Button>
                            )}
                            <Button size="sm" disabled={busy} onClick={() => abrirAprobar(p)}>Aprobar</Button>
                            <Button size="sm" variant="danger" disabled={busy} onClick={() => setModalRechazo(p.id)}>Rechazar</Button>
                          </>
                        )}
                        {p.estado === "activo" && (
                          <>
                            <Button size="sm" variant="ghost" disabled={busy} onClick={() => setModalConfirmarPago(p)}>Registrar pago</Button>
                            {p.clientes?.telefono && (
                              <a href={linkWhatsapp(p)} target="_blank" rel="noopener noreferrer">
                                <Button size="sm" variant="ghost" type="button">Recordar por WhatsApp</Button>
                              </a>
                            )}
                          </>
                        )}
                        {p.estado === "rechazado" && (
                          <Button size="sm" variant="danger" disabled={busy} onClick={() => setModalEliminar(p)}>Eliminar</Button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal: ver foto de garantía en grande */}
      {modalFoto && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-5 z-50" onClick={() => setModalFoto(null)}>
          <img src={modalFoto} alt="Garantía" className="max-w-full max-h-[80vh] rounded-2xl border border-white/15" />
        </div>
      )}

      {/* Modal: aprobar con monto final y tasa preferencial */}
      {modalAprobar && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-5 z-50" onClick={(e) => e.target === e.currentTarget && setModalAprobar(null)}>
          <div className="bg-[#0a0906] border border-white/10 rounded-2xl p-7 max-w-sm w-full">
            <h3 className="text-lg font-semibold mb-1">Aprobar préstamo</h3>
            <p className="text-sm text-white/50 mb-4">
              Cliente: <b className="text-white">{modalAprobar.clientes?.nombre_completo}</b>
            </p>

            {modalAprobar.garantias?.[0]?.valor_estimado ? (
              <p className="text-xs text-[#eac888]/80 bg-[#eac888]/[0.06] border border-[#eac888]/20 rounded-lg px-3 py-2 mb-4">
                Valor estimado de la garantía: {money(modalAprobar.garantias[0].valor_estimado!)} — sugerido máx. {Math.round(LTV_SUGERIDO * 100)}%: {money(modalAprobar.garantias[0].valor_estimado! * LTV_SUGERIDO)}
              </p>
            ) : null}

            <label className="block text-sm font-semibold text-white/85 mb-1.5">Monto final a aprobar (RD$)</label>
            <input type="number" value={montoFinal} onChange={(e) => setMontoFinal(e.target.value)}
              className="w-full px-3.5 py-3 border border-white/15 bg-white/5 text-white rounded-xl text-sm mb-4 focus:outline-none focus:ring-2 focus:ring-[#eac888]/40" />

            <label className="block text-sm font-semibold text-white/85 mb-1.5">Tasa de interés (%)</label>
            <input type="number" value={tasaFinal} onChange={(e) => setTasaFinal(e.target.value)}
              className="w-full px-3.5 py-3 border border-white/15 bg-white/5 text-white rounded-xl text-sm mb-1 focus:outline-none focus:ring-2 focus:ring-[#eac888]/40" />
            <p className="text-xs text-white/40 mb-5">Puedes dar una tasa preferencial si la garantía cubre bien el monto.</p>

            <div className="flex justify-end gap-2">
              <Button size="sm" variant="ghost" onClick={() => setModalAprobar(null)}>Cancelar</Button>
              <Button size="sm" onClick={confirmarAprobar} disabled={cargandoId === modalAprobar.id}>Confirmar y activar</Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: doble confirmación antes de registrar un pago (no se puede deshacer) */}
      {modalConfirmarPago && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-5 z-50" onClick={(e) => e.target === e.currentTarget && setModalConfirmarPago(null)}>
          <div className="bg-[#0a0906] border border-red-400/25 rounded-2xl p-7 max-w-sm w-full">
            <h3 className="text-lg font-semibold mb-1">Confirmar registro de pago</h3>
            <p className="text-sm text-white/50 mb-4">Esta acción <b className="text-red-300">no se puede deshacer</b> — el saldo del cliente se reducirá de inmediato.</p>
            <div className="bg-white/5 border border-white/10 rounded-xl p-4 mb-5 text-sm space-y-1.5">
              <div className="flex justify-between"><span className="text-white/50">Cliente</span><span className="font-semibold">{modalConfirmarPago.clientes?.nombre_completo}</span></div>
              <div className="flex justify-between"><span className="text-white/50">Monto a registrar</span><span className="font-mono text-[#eac888]">{money(calcularCuota(modalConfirmarPago))}</span></div>
              <div className="flex justify-between"><span className="text-white/50">Método</span><span>Efectivo</span></div>
            </div>
            <p className="text-xs text-white/40 mb-5">Verifica que estos datos sean correctos antes de continuar.</p>
            <div className="flex justify-end gap-2">
              <Button size="sm" variant="ghost" onClick={() => setModalConfirmarPago(null)}>Cancelar</Button>
              <Button size="sm" variant="danger" disabled={cargandoId === modalConfirmarPago.id} onClick={() => registrarPago(modalConfirmarPago)}>
                Sí, registrar este pago
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: eliminar solicitud rechazada */}
      {modalEliminar && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-5 z-50" onClick={(e) => e.target === e.currentTarget && setModalEliminar(null)}>
          <div className="bg-[#0a0906] border border-red-400/25 rounded-2xl p-7 max-w-sm w-full">
            <h3 className="text-lg font-semibold mb-1">Eliminar solicitud</h3>
            <p className="text-sm text-white/50 mb-4">
              Se eliminará la solicitud de <b className="text-white">{modalEliminar.clientes?.nombre_completo}</b> por {money(modalEliminar.monto_solicitado)} — esta acción no se puede deshacer.
            </p>
            {errorEliminar && <div className="bg-red-400/10 text-red-300 text-sm rounded-xl px-4 py-3 mb-4">{errorEliminar}</div>}
            <div className="flex justify-end gap-2">
              <Button size="sm" variant="ghost" onClick={() => { setModalEliminar(null); setErrorEliminar(null); }}>Cancelar</Button>
              <Button size="sm" variant="danger" disabled={cargandoId === modalEliminar.id} onClick={() => eliminarSolicitud(modalEliminar)}>Sí, eliminar</Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: rechazar */}
      {modalRechazo && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-5 z-50" onClick={(e) => e.target === e.currentTarget && setModalRechazo(null)}>
          <div className="bg-[#0a0906] border border-white/10 rounded-2xl p-7 max-w-sm w-full">
            <h3 className="text-lg font-semibold mb-2">Rechazar solicitud</h3>
            <p className="text-sm text-white/50 mb-4">Escribe el motivo — el cliente lo verá en su panel.</p>
            <textarea
              rows={3}
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              placeholder="Ej. Garantía no verificable."
              className="w-full px-3.5 py-3 border border-white/15 bg-white/5 text-white placeholder-white/30 rounded-xl text-sm mb-4 focus:outline-none focus:ring-2 focus:ring-[#eac888]/40"
            />
            <div className="flex justify-end gap-2">
              <Button size="sm" variant="ghost" onClick={() => setModalRechazo(null)}>Cancelar</Button>
              <Button size="sm" variant="danger" onClick={() => confirmarRechazo(modalRechazo)}>Confirmar rechazo</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
