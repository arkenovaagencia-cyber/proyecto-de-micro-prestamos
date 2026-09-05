import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Card, Badge } from "@/components/ui/Primitives";
import LogoutButton from "@/components/LogoutButton";
import PagoModal from "@/components/cliente/PagoModal";

const TIPO_GARANTIA_LABEL: Record<string, string> = {
  telefono: "Teléfono móvil", tv: "Televisor", vehiculo: "Vehículo",
  joyas: "Joyas", electronico: "Equipo electrónico", otro: "Otro",
};

const ESTADO_GARANTIA_LABEL: Record<string, string> = {
  pendiente_verificacion: "Pendiente de verificar",
  verificada: "En custodia — verificada",
  rechazada: "Rechazada",
  devuelta: "Devuelta",
};

function money(n: number) {
  return "RD$ " + Number(n).toLocaleString("es-DO", { minimumFractionDigits: 2 });
}

function fmtFecha(f: string) {
  return new Date(f + "T00:00:00").toLocaleDateString("es-DO", { day: "2-digit", month: "short", year: "numeric" });
}

const MORA_DIARIA_DEFAULT = 50;

function calcularRecargo(fechaVencimiento: string, montoMoraDiaria: number) {
  const hoy = new Date();
  const venc = new Date(fechaVencimiento + "T00:00:00");
  const diasAtraso = Math.floor((hoy.getTime() - venc.getTime()) / 86400000);
  if (diasAtraso <= 0) return { diasAtraso: 0, recargo: 0 };
  return { diasAtraso, recargo: diasAtraso * montoMoraDiaria };
}

export default async function ClienteDashboard() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase.from("profiles").select("nombre, telefono, cedula, prestamista_id").eq("id", user.id).single();
  let { data: cliente } = await supabase.from("clientes").select("id").eq("profile_id", user.id).single();

  if (!cliente && profile?.prestamista_id) {
    const { data: nuevoCliente } = await supabase
      .from("clientes")
      .insert({
        prestamista_id: profile.prestamista_id,
        profile_id: user.id,
        nombre_completo: profile.nombre,
        telefono: profile.telefono ?? "",
        cedula: profile.cedula,
        correo: user.email,
      })
      .select("id")
      .single();
    cliente = nuevoCliente;
  }

  const { data: prestamos } = cliente
    ? await supabase
        .from("prestamos")
        .select("*, garantias(*), cuotas(*)")
        .eq("cliente_id", cliente.id)
        .order("fecha_solicitud", { ascending: false })
    : { data: [] };

  let moraDiaria = MORA_DIARIA_DEFAULT;
  let contactoWhatsapp: string | null = null;
  let contactoCorreo: string | null = null;
  let infoTransferencia: Record<string, string> = {};
  let prestamistaIdActual: string | null = null;
  if (profile?.prestamista_id) {
    prestamistaIdActual = profile.prestamista_id;
    const { data: config } = await supabase
      .from("configuracion_plataforma")
      .select("config_prestamos, contacto, info_transferencia")
      .eq("prestamista_id", profile.prestamista_id)
      .single();
    const cp = (config?.config_prestamos ?? {}) as Record<string, number>;
    moraDiaria = cp.mora_diaria ?? MORA_DIARIA_DEFAULT;
    const contacto = (config?.contacto ?? {}) as Record<string, string>;
    contactoWhatsapp = contacto.whatsapp || null;
    contactoCorreo = contacto.correo || null;
    infoTransferencia = (config?.info_transferencia ?? {}) as Record<string, string>;
  }

  const activos = (prestamos ?? []).filter((p) => p.estado === "activo").length;
  const enRevision = (prestamos ?? []).filter((p) => ["pendiente", "revision"].includes(p.estado)).length;
  const pagados = (prestamos ?? []).filter((p) => p.estado === "pagado").length;
  const saldoTotal = (prestamos ?? [])
    .filter((p) => p.estado === "activo")
    .reduce((s, p) => s + Number(p.saldo_pendiente ?? p.monto_aprobado ?? 0), 0);

  return (
    <div className="min-h-screen bg-[#0a0906] text-white">
      <header className="border-b border-white/10 px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-2.5 font-semibold">
          <span className="w-7 h-7 rounded-full border border-white/20 flex items-center justify-center text-[#eac888] text-xs font-mono">P$</span>
          Prestamigo
        </div>
        <div className="flex items-center gap-4 text-sm">
          {contactoWhatsapp && (
            <a href={`https://wa.me/1${contactoWhatsapp.replace(/\D/g, "")}`} target="_blank" rel="noopener noreferrer" className="text-white/60 hover:text-[#eac888] transition">
              Contáctanos
            </a>
          )}
          {!contactoWhatsapp && contactoCorreo && (
            <a href={`mailto:${contactoCorreo}`} className="text-white/60 hover:text-[#eac888] transition">Contáctanos</a>
          )}
          <span className="text-white/60">Hola, <b className="text-white">{profile?.nombre?.split(" ")[0]}</b></span>
          <LogoutButton />
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-6 pt-10 pb-20">
        <h1 className="text-2xl font-semibold">Hola, {profile?.nombre?.split(" ")[0]}</h1>
        <p className="text-white/50 text-sm mt-1">Aquí está el resumen de tu cuenta.</p>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 my-8">
          <Card className="p-5"><div className="text-xs text-white/50 mb-2">Saldo pendiente</div><div className="font-mono text-xl font-bold text-[#eac888]">{money(saldoTotal)}</div></Card>
          <Card className="p-5"><div className="text-xs text-white/50 mb-2">Préstamos activos</div><div className="font-mono text-xl font-bold text-[#eac888]">{activos}</div></Card>
          <Card className="p-5"><div className="text-xs text-white/50 mb-2">En revisión</div><div className="font-mono text-xl font-bold text-[#eac888]">{enRevision}</div></Card>
          <Card className="p-5"><div className="text-xs text-white/50 mb-2">Pagados</div><div className="font-mono text-xl font-bold text-[#eac888]">{pagados}</div></Card>
        </div>

        <Card className="p-6 mb-16">
          <div className="flex justify-between items-center mb-5 flex-wrap gap-3">
            <h2 className="text-lg font-semibold">Mis préstamos</h2>
            <Link href="/cliente/solicitar"><Button variant="primary" size="sm">+ Solicitar préstamo</Button></Link>
          </div>

          {(!prestamos || prestamos.length === 0) ? (
            <div className="text-center py-12 text-white/40">Todavía no has solicitado ningún préstamo.</div>
          ) : (
            <div className="space-y-3">
              {prestamos.map((p) => {
                const saldo = Number(p.saldo_pendiente ?? p.monto_aprobado ?? p.monto_solicitado);
                const total = Number(p.monto_aprobado ?? p.monto_solicitado) * (1 + Number(p.tasa_interes) / 100);
                const garantia = Array.isArray(p.garantias) ? p.garantias[0] : p.garantias;
                const cuotas = (p.cuotas ?? []).sort((a: any, b: any) => a.numero_cuota - b.numero_cuota);
                const proximaCuota = cuotas.find((c: any) => c.estado === "pendiente" || c.estado === "parcial" || c.estado === "vencida");
                return (
                  <div key={p.id} className="border border-white/10 rounded-2xl p-5 bg-white/[0.02]">
                    <div className="flex justify-between items-start gap-3 flex-wrap mb-3">
                      <div>
                        <div className="font-mono text-xl font-bold text-[#eac888]">{money(p.monto_solicitado)}</div>
                        <div className="text-xs text-white/45 mt-0.5">{p.plazo_cuotas} cuotas · {p.frecuencia_pago}</div>
                      </div>
                      <Badge estado={p.estado}>{p.estado}</Badge>
                    </div>

                    {p.estado === "activo" && (
                      <div className="text-sm text-white/60 mb-1">Saldo pendiente: <b className="font-mono text-[#eac888]">{money(saldo)}</b></div>
                    )}
                    {p.estado === "activo" && proximaCuota && (() => {
                      const { diasAtraso, recargo } = calcularRecargo(proximaCuota.fecha_vencimiento, moraDiaria);
                      return (
                        <>
                          <div className="text-sm text-white/60">Próximo pago: <b className="text-white">{fmtFecha(proximaCuota.fecha_vencimiento)}</b> · <span className="font-mono">{money(proximaCuota.monto_cuota)}</span></div>
                          {diasAtraso > 0 && (
                            <div className="text-sm text-red-300 mt-1">
                              {diasAtraso} {diasAtraso === 1 ? "día" : "días"} de atraso — recargo: <b className="font-mono">{money(recargo)}</b> (total a pagar: <b className="font-mono">{money(proximaCuota.monto_cuota + recargo)}</b>)
                            </div>
                          )}
                          <PagoModal
                            prestamoId={p.id}
                            prestamistaId={prestamistaIdActual!}
                            cuotaId={proximaCuota.id}
                            montoSugerido={proximaCuota.monto_cuota + recargo}
                            infoTransferencia={infoTransferencia}
                          />
                        </>
                      );
                    })()}
                    {(p.estado === "pendiente" || p.estado === "revision") && (
                      <div className="text-sm text-white/50">Total con interés: <b className="font-mono text-white/80">{money(total)}</b></div>
                    )}

                    {garantia && (
                      <div className="flex flex-wrap items-center gap-2 mt-3">
                        <span className="inline-flex items-center gap-1.5 text-xs text-white/50 bg-white/5 px-3 py-1.5 rounded-full">
                          {TIPO_GARANTIA_LABEL[garantia.tipo]} {garantia.descripcion ? `— ${garantia.descripcion}` : ""}
                        </span>
                        {garantia.estado && (
                          <span className="text-xs text-white/40">
                            {ESTADO_GARANTIA_LABEL[garantia.estado] ?? garantia.estado}
                          </span>
                        )}
                      </div>
                    )}
                    {p.estado === "rechazado" && p.motivo_rechazo && (
                      <div className="text-xs text-red-300 mt-2">Motivo: {p.motivo_rechazo}</div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
