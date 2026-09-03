import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import SolicitarForm from "./SolicitarForm";

export default async function SolicitarPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  let { data: cliente } = await supabase
    .from("clientes")
    .select("id, prestamista_id")
    .eq("profile_id", user.id)
    .single();

  // Si por alguna razón nunca se creó la ficha de cliente (por ejemplo,
  // porque el registro se completó mientras el correo aún no estaba
  // confirmado), la creamos aquí mismo en vez de dejar al usuario
  // atascado sin explicación.
  if (!cliente) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("nombre, telefono, cedula, prestamista_id")
      .eq("id", user.id)
      .single();

    if (profile?.prestamista_id) {
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
        .select("id, prestamista_id")
        .single();
      cliente = nuevoCliente;
    }
  }

  if (!cliente) {
    // Esto solo pasa si el perfil ni siquiera tiene un prestamista asignado
    // (dato faltante real, no solo una ficha de cliente ausente).
    redirect("/cliente/dashboard?error=sin_prestamista");
  }

  return (
    <div className="min-h-screen bg-[#0a0906] text-white">
      <div className="max-w-4xl mx-auto px-6 pt-10 pb-20">
        <h1 className="text-2xl font-semibold">Solicitar préstamo</h1>
        <p className="text-white/50 text-sm mt-1 mb-8">Completa los datos — el resumen se actualiza mientras escribes.</p>
        <SolicitarForm clienteId={cliente.id} prestamistaId={cliente.prestamista_id} />
      </div>
    </div>
  );
}
