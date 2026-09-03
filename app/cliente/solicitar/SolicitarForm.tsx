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

function money(n: number) {
  return "RD$ " + n.toLocaleString("es-DO", { minimumFractionDigits: 2 });
}

export default function SolicitarForm({ clienteId, prestamistaId }: { clienteId: string; prestamistaId: string }) {
  const router = useRouter();
  const supabase = createClient();

  const [monto, setMonto] = useState(5000);
  const [plazo, setPlazo] = useState(4);
  const [frecuencia, setFrecuencia] = useState<"semanal" | "quincenal" | "mensual">("mensual");
  const [tipoGarantia, setTipoGarantia] = useState<string | null>(null);
  const [descripcion, setDescripcion] = useState("");
  const [valorEstimado, setValorEstimado] = useState("");
  const [foto, setFoto] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const TASA = 20;
  const { interes, total, cuota } = useMemo(() => {
    const i = monto * (TASA / 100);
    const t = monto + i;
    return { interes: i, total: t, cuota: t / plazo };
  }, [monto, plazo]);

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
        tasa_interes: TASA,
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
            {[1, 2, 4, 6, 12].map((n) => <option key={n} value={n} className="text-black">{n} cuotas</option>)}
          </select>
        </div>
        <div className="mb-6">
          <label className={labelClass}>Frecuencia de pago</label>
          <select value={frecuencia} onChange={(e) => setFrecuencia(e.target.value as typeof frecuencia)} className={fieldClass}>
            <option value="mensual" className="text-black">Mensual</option>
            <option value="quincenal" className="text-black">Quincenal</option>
            <option value="semanal" className="text-black">Semanal</option>
          </select>
        </div>

        <label className={clsx(labelClass, "mb-2")}>Garantía — elige lo que dejarás como respaldo</label>
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
            <p className="text-xs text-[#eac888]/80 mt-1.5">
              Con ese valor, normalmente se aprueba hasta {money(Number(valorEstimado) * 0.6)} (60% del valor del artículo).
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
          <div className="flex justify-between border-b border-white/10 pb-2.5"><span className="text-white/50">Interés (20%)</span><span className="font-mono">{money(interes)}</span></div>
          <div className="flex justify-between border-b border-white/10 pb-2.5"><span className="text-white/50">Cuota por pago</span><span className="font-mono">{money(cuota)}</span></div>
          <div className="flex justify-between"><span className="text-white/50">Garantía</span><span>{tipoGarantia ? GARANTIAS.find((g) => g.id === tipoGarantia)?.lb : "— sin elegir —"}</span></div>
        </div>
      </div>
    </form>
  );
}
