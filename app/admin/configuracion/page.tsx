import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import ConfiguracionForm from "./ConfiguracionForm";

export default async function ConfiguracionPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase.from("profiles").select("role, prestamista_id").eq("id", user.id).single();
  if (!profile || (profile.role !== "prestamista_admin" && profile.role !== "plataforma_admin")) redirect("/cliente/dashboard");

  // Si es admin de toda la plataforma sin un prestamista fijo asignado,
  // edita el primero activo (por ahora solo existe uno: Prestamigo).
  let prestamistaId = profile.prestamista_id;
  if (!prestamistaId) {
    const { data: p } = await supabase.from("prestamistas").select("id").eq("activo", true).limit(1).single();
    prestamistaId = p?.id ?? null;
  }
  if (!prestamistaId) redirect("/admin/dashboard");

  const { data: config } = await supabase
    .from("configuracion_plataforma")
    .select("*")
    .eq("prestamista_id", prestamistaId)
    .single();

  return (
    <div className="min-h-screen bg-black text-white">
      <header className="border-b border-[#eac888]/15 px-6 py-4 flex justify-between items-center bg-[#0a0906]">
        <div className="flex items-center gap-2.5 font-semibold">
          <span className="w-7 h-7 rounded-full border border-[#eac888]/40 flex items-center justify-center text-[#eac888] text-xs font-mono">P$</span>
          Prestamigo <span className="text-white/30 font-normal">· Personalizar página</span>
        </div>
        <Link href="/admin/dashboard" className="text-sm text-white/60 hover:text-[#eac888] transition">← Volver al panel</Link>
      </header>

      <div className="max-w-3xl mx-auto px-6 py-10">
        <h1 className="text-2xl font-semibold mb-1.5">Personaliza tu página</h1>
        <p className="text-white/50 text-sm mb-8">Cambia textos, logo, contacto y las condiciones del préstamo — se actualiza en la página real sin tocar código.</p>
        <ConfiguracionForm prestamistaId={prestamistaId} initial={config ?? null} />
      </div>
    </div>
  );
}
