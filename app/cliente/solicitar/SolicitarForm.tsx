"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Primitives";
import { clsx } from "clsx";

const GARANTIAS = [
  { id: "telefono", lb: "Teléfono móvil" },
  { id: "tv", lb: "Televisor" },
  { id: "vehiculo", lb: "Vehículo" },
  { id: "joyas", lb: "Joyas" },
  { id: "electronico", lb: "Equipo electrónico" },
  { id: "otro", lb: "Otro artículo" },
] as const;

// Quincenal primero porque es el plazo que este negocio prefiere ofrecer.
const FRECUENCIAS = [
  { id: "quincenal", lb: "Quincenal (recomendado)" },
  { id: "semanal", lb: "Semanal" },
  { id: "mensual", lb: "Mensual" },
] as const;

// Los plazos posibles dependen de la frecuencia — evita combinaciones que
// no tienen sentido para un microcrédito (ej. 12 cuotas mensuales = 1 año
// para un préstamo de RD$5,000).
const PLAZOS_POR_FRECUENCIA: Record<string, number[]> = {
  semanal: [1, 2, 3, 4],
  quincenal: [1, 2, 3, 4],
  mensual: [1, 2, 3],
};

function money(n: number) {
  return "RD$ " + n.toLocaleString("es-DO", { minimumFractionDigits: 2 });
}

interface Tasas { semanal: number; quincenal: number; mensual: number }
interface Ltv { umbral: number; descuentoPuntos: number }

export default function SolicitarForm({
  clienteId, prestamistaId, tasas, ltv,
}: {
  clienteId: string; prestamistaId: string; tasas: Tasas; ltv: Ltv;
}) {
  const router = useRouter();
  const supabase = createClient();

  const [monto, setMonto] = useState(5000);
  const [plazo, setPlazo] = useState(4);
  const [frecuencia, setFrecuencia] = useState<"semanal" | "quincenal" | "mensual">("quincenal");
  const [tipoGarantia, setTipoGarantia] = useState<string | null>(null);
  const [descripcion, setDescripcion] = useState("");
  const [valorEstimado, setValorEstimado] = useState("");
  const [foto, setFoto] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function cambiarFrecuencia(f: "semanal" | "quincenal" | "mensual") {
    setFrecuencia(f);
    const opciones = PLAZOS_POR_FRECUENCIA[f];
    if (!opciones.includes(plazo)) setPlazo(opciones[opciones.length - 1]);
  }

  const { tasaBase, tasaFinal, descuentoAplicado, interes, total, cuota } = useMemo(() => {
    const base = tasas[frecuencia];
    const valor = Number(valorEstimado) || 0;
    const califica = valor > 0 && monto > 0 && valor >= monto * ltv.umbral;
    const final = califica ? Math.max(base - ltv.descuentoPuntos, 5) : base;
    const i = monto * (final / 100);
    const t = monto + i;
    return { tasaBase: base, tasaFinal: final, descuentoAplicado: califica, interes: i, total: t, cuota: t / plazo };
  }, [monto, plazo, frecuencia, valorEstimado, tasas, ltv]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!tipoGarantia) { setError("Selecciona un tipo de garantía."); return; }
    if (monto < 500) { setError("El monto mínimo es RD$500."); return; }

    setLoading(true);

    const { data: prestamo, error: prestamoError } = await supabase
      .from("prestamos")
      .insert({
        prestamista_id: prestamistaId,
        cliente_id: clienteId,
        monto_solicitado: monto,
        tasa_interes: tasaFinal,
        plazo_cuotas: plazo,
        frecuencia_pago: frecuencia,
        estado: "pendiente",
      })
      .select()
      .single();

    if (prestamoError || !prestamo) {
      setError("No se pudo enviar la solicitud. Intenta de nuevo.");
      setLoading(false);
      return;
    }

    let fotoUrl: string[] = [];
    if (foto) {
      const path = `${(await supabase.auth.getUser()).data.user?.id}/${prestamo.id}-${foto.name}`;
      const { error: uploadError } = await supabase.storage.from("garantias").upload(path, foto);
      if (!uploadError) {
        const { data: pub } = supabase.storage.from("garantias").getPublicUrl(path);
        fotoUrl = [pub.publicUrl];
      }
    }

    await supabase.from("garantias").insert({
      prestamo_id: prestamo.id,
      tipo: tipoGarantia,
      descripcion: descripcion || "Sin descripción adicional",
      valor_estimado: valorEstimado ? Number(valorEstimado) : null,
      fotos: fotoUrl,
    });

    setLoading(false);
    router.push("/cliente/dashboard");
    router.refresh();
  }

  const fieldClass = "w-full px-3.5 py-3 border border-white/15 rounded-xl text-sm bg-white/5 text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-[#eac888]/40 focus:border-[#eac888]/60";
  const labelClass = "block text-sm font-semibold text-white/85 mb-1.5";

  return (
    <form onSubmit={onSubmit} className="grid md:grid-cols-[1.1fr,0.9fr] gap-6 items-start">
      <Card className="p-6">
        {error && <div className="bg-red-400/10 text-red-300 text-sm rounded-xl px-4 py-3 mb-4">{error}</div>}

        <div className="mb-4">
          <label className={labelClass}>Monto solicitado (RD$)</label>
          <input type="number" min={500} step={100} value={monto} onChange={(e) => setMonto(Number(e.target.value))} className={fieldClass} />
        </div>
        <div className="mb-4">
          <label className={labelClass}>Plazo</label>
          <select value={plazo} onChange={(e) => setPlazo(Number(e.target.value))} className={fieldClass}>
            {PLAZOS_POR_FRECUENCIA[frecuencia].map((n) => <option key={n} value={n} className="text-black">{n} {n === 1 ? "cuota" : "cuotas"}</option>)}
          </select>
        </div>
        <div className="mb-2">
          <label className={labelClass}>Frecuencia de pago</label>
          <div className="grid grid-cols-3 gap-2">
            {FRECUENCIAS.map((f) => (
              <button
                type="button"
                key={f.id}
                onClick={() => cambiarFrecuencia(f.id)}
                className={clsx(
                  "border rounded-xl py-2.5 px-2 text-center text-xs font-semibold transition",
                  frecuencia === f.id ? "border-[#eac888] bg-[#eac888]/10 text-[#eac888]" : "border-white/15 text-white/70 hover:border-white/30"
                )}
              >
                {f.lb}
                <div className="font-mono text-[10px] text-white/40 mt-0.5">{tasas[f.id]}% interés</div>
              </button>
            ))}
          </div>
          <p className="text-xs text-white/40 mt-2">Quincenal tiene la tasa más baja — es nuestra opción recomendada.</p>
        </div>

        <label className={clsx(labelClass, "mb-2 mt-4")}>Garantía — elige lo que dejarás como respaldo</label>
        <div className="grid grid-cols-3 gap-2.5 mb-4">
          {GARANTIAS.map((g) => (
            <button
              type="button"
              key={g.id}
              onClick={() => setTipoGarantia(g.id)}
              className={clsx(
                "border rounded-xl p-3.5 text-center transition text-xs font-semibold",
                tipoGarantia === g.id ? "border-[#eac888] bg-[#eac888]/10 text-[#eac888]" : "border-white/15 text-white/70 hover:border-white/30"
              )}
            >
              {g.lb}
            </button>
          ))}
        </div>

        <div className="mb-4">
          <label className={labelClass}>Describe brevemente la garantía</label>
          <textarea rows={2} value={descripcion} onChange={(e) => setDescripcion(e.target.value)}
            placeholder="Ej. iPhone 12, 128GB, color negro, con caja." className={fieldClass} />
        </div>
        <div className="mb-4">
          <label className={labelClass}>Valor estimado (RD$, opcional)</label>
          <input type="number" value={valorEstimado} onChange={(e) => setValorEstimado(e.target.value)} className={fieldClass} />
          {Number(valorEstimado) > 0 && (
            <p className={clsx("text-xs mt-1.5", descuentoAplicado ? "text-emerald-300" : "text-white/40")}>
              {descuentoAplicado
                ? `¡Tu garantía califica para un descuento de ${ltv.descuentoPuntos} puntos de interés! Tasa final: ${tasaFinal}% en vez de ${tasaBase}%.`
                : `Si tu garantía vale ${ltv.umbral}x o más el monto solicitado, obtienes ${ltv.descuentoPuntos} puntos menos de interés.`}
            </p>
          )}
        </div>
        <div className="mb-6">
          <label className={labelClass}>Foto de la garantía (opcional)</label>
          <input type="file" accept="image/*" onChange={(e) => setFoto(e.target.files?.[0] ?? null)} className="w-full text-sm text-white/70" />
        </div>

        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? "Enviando..." : "Enviar solicitud →"}
        </Button>
      </Card>

      <div className="bg-black/40 border border-[#eac888]/20 backdrop-blur-sm rounded-2xl p-6 sticky top-6">
        <div className="text-xs uppercase tracking-wider text-[#eac888]/70 mb-1.5">Resumen del préstamo</div>
        <div className="font-mono text-3xl font-bold mb-4 text-[#eac888]">{money(total)}</div>
        <div className="space-y-2.5 text-sm">
          <div className="flex justify-between border-b border-white/10 pb-2.5"><span className="text-white/50">Monto solicitado</span><span className="font-mono">{money(monto)}</span></div>
          <div className="flex justify-between border-b border-white/10 pb-2.5">
            <span className="text-white/50">Interés ({tasaFinal}%)</span>
            <span className="font-mono">
              {money(interes)}
              {descuentoAplicado && <span className="text-emerald-300 text-xs ml-1.5">(con descuento)</span>}
            </span>
          </div>
          <div className="flex justify-between border-b border-white/10 pb-2.5"><span className="text-white/50">Cuota por pago</span><span className="font-mono">{money(cuota)}</span></div>
          <div className="flex justify-between"><span className="text-white/50">Garantía</span><span>{tipoGarantia ? GARANTIAS.find((g) => g.id === tipoGarantia)?.lb : "— sin elegir —"}</span></div>
        </div>
      </div>
    </form>
  );
}
