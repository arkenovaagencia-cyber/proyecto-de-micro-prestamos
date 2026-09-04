import { createClient } from "@/lib/supabase/server";
import HomeExperience from "@/components/hero/HomeExperience";

export default async function HomePage() {
  const supabase = createClient();
  const { data: prestamista } = await supabase.from("prestamistas").select("id").eq("activo", true).limit(1).single();

  let config = null;
  if (prestamista) {
    const { data } = await supabase
      .from("configuracion_plataforma")
      .select("nombre_publico, hero_titulo, hero_subtitulo, logo_url")
      .eq("prestamista_id", prestamista.id)
      .single();
    config = data;
  }

  return (
    <HomeExperience
      nombrePublico={config?.nombre_publico ?? undefined}
      heroTitulo={config?.hero_titulo ?? undefined}
      heroSubtitulo={config?.hero_subtitulo ?? undefined}
      logoUrl={config?.logo_url}
    />
  );
}
