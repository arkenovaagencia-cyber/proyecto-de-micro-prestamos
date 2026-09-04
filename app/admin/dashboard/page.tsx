import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Card } from "@/components/ui/Primitives";
import LogoutButton from "@/components/LogoutButton";
import AdminLoanTable from "./AdminLoanTable";

function money(n: number) {
  return "RD$ " + Number(n).toLocaleString("es-DO", { maximumFractionDigits: 0 });
}

export default async function AdminDashboard() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase.from("profiles").select("nombre, role, prestamista_id").eq("id", user.id).single();
  if (!profile || (profile.role !== "prestamista_admin" && profile.role !== "plataforma_admin")) redirect("/cliente/dashboard");

  const esPlataformaAdmin = profile.role === "plataforma_admin";

  let prestamosQuery = supabase
    .from("prestamos")
    .select("*, prestamista_id, clientes(nombre_completo, correo, telefono), garantias(tipo, descripcion, valor_estimado, fotos, estado)")
    .order("fecha_solicitud", { ascending: false });
  if (!esPlataformaAdmin && profile.prestamista_id) {
    prestamosQuery = prestamosQuery.eq("prestamista_id", profile.prestamista_id);
  }
  const { data: prestamos } = await prestamosQuery;

  let clientesQuery = supabase.from("clientes").select("id", { count: "exact", head: true });
  if (!esPlataformaAdmin && profile.prestamista_id) clientesQuery = clientesQuery.eq("prestamista_id", profile.prestamista_id);
  const { count: totalClientes } = await clientesQuery;

  const lista = prestamos ?? [];
  const dineroPrestado = lista.filter((p) => ["activo", "pagado"].includes(p.estado)).reduce((s, p) => s + Number(p.monto_aprobado ?? p.monto_solicitado), 0);
  const pendientePorCobrar = lista.filter((p) => p.estado === "activo").reduce((s, p) => s + Number(p.saldo_pendiente ?? 0), 0);
  const solicitudesPendientes = lista.filter((p) => ["pendiente", "revision"].includes(p.estado)).length;

  return (
    <div className="min-h-screen bg-black text-white">
      <header className="border-b border-[#eac888]/15 px-6 py-4 flex justify-between items-center bg-[#0a0906]">
        <div className="flex items-center gap-2.5 font-semibold">
          <span className="w-7 h-7 rounded-full border border-[#eac888]/40 flex items-center justify-center text-[#eac888] text-xs font-mono">P$</span>
          Prestamigo <span className="text-white/30 font-normal">· Admin</span>
        </div>
        <div className="flex items-center gap-4 text-sm">
          <Link href="/admin/configuracion" className="text-white/60 hover:text-[#eac888] transition">Personalizar página</Link>
          <span className="text-white/50">{profile.nombre}</span>
          <LogoutButton />
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-6 pt-9 pb-20">
        <h1 className="text-2xl font-semibold">Panel de administrador</h1>
        <p className="text-white/50 text-sm mt-1 mb-7">Todo el negocio, de un vistazo.</p>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-7">
          <Card className="p-5 border-l-2 border-l-[#eac888]/50"><div className="text-xs text-white/50 mb-2">Clientes registrados</div><div className="font-mono text-xl font-bold">{totalClientes ?? 0}</div></Card>
          <Card className={`p-5 border-l-2 ${solicitudesPendientes > 0 ? "border-l-amber-400" : "border-l-[#eac888]/50"}`}>
            <div className="text-xs text-white/50 mb-2">Solicitudes pendientes</div>
            <div className={`font-mono text-xl font-bold ${solicitudesPendientes > 0 ? "text-amber-300" : ""}`}>{solicitudesPendientes}</div>
          </Card>
          <Card className="p-5 border-l-2 border-l-[#eac888]/50"><div className="text-xs text-white/50 mb-2">Dinero prestado</div><div className="font-mono text-xl font-bold text-[#eac888]">{money(dineroPrestado)}</div></Card>
          <Card className="p-5 border-l-2 border-l-[#eac888]/50"><div className="text-xs text-white/50 mb-2">Pendiente por cobrar</div><div className="font-mono text-xl font-bold text-[#eac888]">{money(pendientePorCobrar)}</div></Card>
          <Card className="p-5 border-l-2 border-l-[#eac888]/50"><div className="text-xs text-white/50 mb-2">Solicitudes totales</div><div className="font-mono text-xl font-bold">{lista.length}</div></Card>
        </div>

        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-5">Solicitudes y préstamos</h2>
          <AdminLoanTable prestamos={lista} />
        </Card>
      </div>
    </div>
  );
}
