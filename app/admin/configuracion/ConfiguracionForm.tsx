"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Primitives";

interface Config {
  nombre_publico?: string | null;
  logo_url?: string | null;
  hero_titulo?: string | null;
  hero_subtitulo?: string | null;
  contacto?: Record<string, string> | null;
  config_prestamos?: Record<string, number> | null;
  info_transferencia?: Record<string, string> | null;
}

const fieldClass = "w-full px-3.5 py-3 border border-white/15 rounded-xl text-sm bg-white/5 text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-[#eac888]/40 focus:border-[#eac888]/60";
const labelClass = "block text-sm font-semibold text-white/85 mb-1.5";

export default function ConfiguracionForm({ prestamistaId, initial }: { prestamistaId: string; initial: Config | null }) {
  const router = useRouter();
  const supabase = createClient();

  const cp = initial?.config_prestamos ?? {};
  const contacto = initial?.contacto ?? {};

  const [nombrePublico, setNombrePublico] = useState(initial?.nombre_publico ?? "Prestamigo");
  const [heroTitulo, setHeroTitulo] = useState(initial?.hero_titulo ?? "Financiamiento inteligente para tu próximo paso.");
  const [heroSubtitulo, setHeroSubtitulo] = useState(initial?.hero_subtitulo ?? "Solicita, aprueba y da seguimiento a tu préstamo con la seguridad de una plataforma construida para crecer contigo.");
  const [logoUrl, setLogoUrl] = useState(initial?.logo_url ?? "");
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [whatsapp, setWhatsapp] = useState((contacto as any).whatsapp ?? "");
  const [correo, setCorreo] = useState((contacto as any).correo ?? "");
  const infoT = initial?.info_transferencia ?? {};
  const [banco, setBanco] = useState((infoT as any).banco ?? "");
  const [numeroCuenta, setNumeroCuenta] = useState((infoT as any).numero_cuenta ?? "");
  const [tipoCuenta, setTipoCuenta] = useState((infoT as any).tipo_cuenta ?? "Ahorros");
  const [titular, setTitular] = useState((infoT as any).titular ?? "");
  const [paypalLink, setPaypalLink] = useState((infoT as any).paypal_link ?? "");
  const [tasaSemanal, setTasaSemanal] = useState(String(cp.tasa_semanal ?? 15));
  const [tasaQuincenal, setTasaQuincenal] = useState(String(cp.tasa_quincenal ?? 20));
  const [tasaMensual, setTasaMensual] = useState(String(cp.tasa_mensual ?? 30));
  const [moraDiaria, setMoraDiaria] = useState(String(cp.mora_diaria ?? 50));
  const [ltvUmbral, setLtvUmbral] = useState(String(cp.ltv_umbral ?? 2));
  const [ltvDescuento, setLtvDescuento] = useState(String(cp.ltv_descuento_puntos ?? 10));

  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setGuardando(true);
    setMensaje(null);

    let finalLogoUrl = logoUrl;
    if (logoFile) {
      const path = `${prestamistaId}/logo-${Date.now()}-${logoFile.name}`;
      const { error: upErr } = await supabase.storage.from("branding").upload(path, logoFile, { upsert: true });
      if (!upErr) {
        const { data: pub } = supabase.storage.from("branding").getPublicUrl(path);
        finalLogoUrl = pub.publicUrl;
      }
    }

    const { error } = await supabase.from("configuracion_plataforma").upsert({
      prestamista_id: prestamistaId,
      nombre_publico: nombrePublico,
      hero_titulo: heroTitulo,
      hero_subtitulo: heroSubtitulo,
      logo_url: finalLogoUrl || null,
      contacto: { whatsapp, correo },
      info_transferencia: { banco, numero_cuenta: numeroCuenta, tipo_cuenta: tipoCuenta, titular, paypal_link: paypalLink },
      config_prestamos: {
        tasa_semanal: Number(tasaSemanal),
        tasa_quincenal: Number(tasaQuincenal),
        tasa_mensual: Number(tasaMensual),
        mora_diaria: Number(moraDiaria),
        ltv_umbral: Number(ltvUmbral),
        ltv_descuento_puntos: Number(ltvDescuento),
      },
    }, { onConflict: "prestamista_id" });

    setGuardando(false);
    if (error) {
      setMensaje("Hubo un error al guardar. Intenta de nuevo.");
    } else {
      setLogoUrl(finalLogoUrl);
      setMensaje("Guardado — los cambios ya están activos en tu página.");
      router.refresh();
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      {mensaje && (
        <div className={`text-sm rounded-xl px-4 py-3 ${mensaje.startsWith("Guardado") ? "bg-emerald-400/10 text-emerald-300" : "bg-red-400/10 text-red-300"}`}>
          {mensaje}
        </div>
      )}

      <Card className="p-6">
        <h2 className="text-lg font-semibold mb-4">Marca</h2>
        <div className="mb-4">
          <label className={labelClass}>Nombre público</label>
          <input value={nombrePublico} onChange={(e) => setNombrePublico(e.target.value)} className={fieldClass} />
        </div>
        <div className="mb-1">
          <label className={labelClass}>Logo</label>
          {logoUrl && <img src={logoUrl} alt="Logo actual" className="w-14 h-14 rounded-full object-cover border border-white/15 mb-2" />}
          <input type="file" accept="image/*" onChange={(e) => setLogoFile(e.target.files?.[0] ?? null)} className="w-full text-sm text-white/70" />
        </div>
      </Card>

      <Card className="p-6">
        <h2 className="text-lg font-semibold mb-4">Textos de la página principal</h2>
        <div className="mb-4">
          <label className={labelClass}>Título principal</label>
          <textarea rows={2} value={heroTitulo} onChange={(e) => setHeroTitulo(e.target.value)} className={fieldClass} />
        </div>
        <div>
          <label className={labelClass}>Subtítulo</label>
          <textarea rows={2} value={heroSubtitulo} onChange={(e) => setHeroSubtitulo(e.target.value)} className={fieldClass} />
        </div>
      </Card>

      <Card className="p-6">
        <h2 className="text-lg font-semibold mb-4">Contacto</h2>
        <div className="mb-4">
          <label className={labelClass}>WhatsApp (solo números, con código de país, ej. 8095551234)</label>
          <input value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} className={fieldClass} placeholder="8095551234" />
        </div>
        <div>
          <label className={labelClass}>Correo de contacto</label>
          <input type="email" value={correo} onChange={(e) => setCorreo(e.target.value)} className={fieldClass} />
        </div>
      </Card>

      <Card className="p-6">
        <h2 className="text-lg font-semibold mb-1">Métodos de pago para clientes</h2>
        <p className="text-xs text-white/40 mb-4">Esto es lo que verá el cliente al tocar "Pagar" en su panel.</p>
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div><label className={labelClass}>Banco</label><input value={banco} onChange={(e) => setBanco(e.target.value)} className={fieldClass} placeholder="Banco Popular" /></div>
          <div><label className={labelClass}>Tipo de cuenta</label><input value={tipoCuenta} onChange={(e) => setTipoCuenta(e.target.value)} className={fieldClass} placeholder="Ahorros" /></div>
        </div>
        <div className="mb-4">
          <label className={labelClass}>Número de cuenta</label>
          <input value={numeroCuenta} onChange={(e) => setNumeroCuenta(e.target.value)} className={fieldClass} />
        </div>
        <div className="mb-5">
          <label className={labelClass}>Titular de la cuenta</label>
          <input value={titular} onChange={(e) => setTitular(e.target.value)} className={fieldClass} />
        </div>
        <div>
          <label className={labelClass}>Enlace de PayPal (PayPal.me, opcional)</label>
          <input value={paypalLink} onChange={(e) => setPaypalLink(e.target.value)} className={fieldClass} placeholder="https://paypal.me/tunombre" />
          <p className="text-xs text-white/40 mt-1.5">Déjalo vacío si todavía no quieres ofrecer PayPal.</p>
        </div>
      </Card>

      <Card className="p-6">
        <h2 className="text-lg font-semibold mb-1">Condiciones del préstamo</h2>
        <p className="text-xs text-white/40 mb-4">Estas tasas y el recargo se aplican de inmediato a nuevas solicitudes y recordatorios.</p>
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div><label className={labelClass}>Tasa semanal (%)</label><input type="number" value={tasaSemanal} onChange={(e) => setTasaSemanal(e.target.value)} className={fieldClass} /></div>
          <div><label className={labelClass}>Tasa quincenal (%)</label><input type="number" value={tasaQuincenal} onChange={(e) => setTasaQuincenal(e.target.value)} className={fieldClass} /></div>
          <div><label className={labelClass}>Tasa mensual (%)</label><input type="number" value={tasaMensual} onChange={(e) => setTasaMensual(e.target.value)} className={fieldClass} /></div>
        </div>
        <div className="mb-4">
          <label className={labelClass}>Recargo por día de atraso (RD$)</label>
          <input type="number" value={moraDiaria} onChange={(e) => setMoraDiaria(e.target.value)} className={fieldClass} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div><label className={labelClass}>Garantía vale X veces el préstamo</label><input type="number" value={ltvUmbral} onChange={(e) => setLtvUmbral(e.target.value)} className={fieldClass} /></div>
          <div><label className={labelClass}>Descuento de interés (puntos)</label><input type="number" value={ltvDescuento} onChange={(e) => setLtvDescuento(e.target.value)} className={fieldClass} /></div>
        </div>
      </Card>

      <Button type="submit" disabled={guardando} className="w-full">
        {guardando ? "Guardando..." : "Guardar cambios"}
      </Button>
    </form>
  );
}
