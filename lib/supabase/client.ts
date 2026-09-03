import { createBrowserClient } from "@supabase/ssr";

// Nota: se dejó sin el genérico <Database> a propósito. Con la versión
// actual de @supabase/supabase-js, forzar ese tipado estricto rompía la
// compilación en cascada (todo se volvía "never"). Los tipos de cada tabla
// (Prestamo, Cliente, etc. en types/database.types.ts) se siguen usando
// para anotar manualmente los datos en cada componente.
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
