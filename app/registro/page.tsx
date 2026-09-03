import { createClient } from "@/lib/supabase/server";
import AuthBackground from "@/components/layout/AuthBackground";
import RegistroForm from "./RegistroForm";

export default async function RegistroPage() {
  const supabase = createClient();
  const { data: prestamistas } = await supabase
    .from("prestamistas")
    .select("id, nombre_negocio")
    .eq("activo", true)
    .order("nombre_negocio");

  return (
    <AuthBackground>
      <RegistroForm prestamistas={prestamistas ?? []} />
    </AuthBackground>
  );
}
