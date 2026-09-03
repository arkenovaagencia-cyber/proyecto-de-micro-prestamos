import Image from "next/image";
import Link from "next/link";

/**
 * Fondo compartido para páginas de autenticación (login/registro) — la misma
 * imagen negro/dorado del Hero, responsiva (vertical en móvil, horizontal en
 * desktop), para que toda la marca se sienta como una sola página.
 */
export default function AuthBackground({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-screen text-white overflow-hidden">
      <div className="absolute inset-0 md:hidden">
        <Image src="/hero/fondo-oro-mobile.png" alt="" fill priority quality={90} sizes="100vw" className="object-cover object-center" />
      </div>
      <div className="absolute inset-0 hidden md:block">
        <Image src="/hero/fondo-oro-desktop.png" alt="" fill priority quality={90} sizes="100vw" className="object-cover object-center" />
      </div>
      <div className="absolute inset-0 bg-black/55" />

      <header className="relative z-10 max-w-6xl mx-auto px-6 py-6">
        <Link href="/" className="inline-flex items-center gap-2.5 font-semibold text-lg tracking-tight">
          <span className="w-8 h-8 rounded-full border border-white/20 flex items-center justify-center text-[#eac888] text-xs font-mono">P$</span>
          Prestamigo
        </Link>
      </header>

      <div className="relative z-10 max-w-md mx-auto px-6 pt-8 pb-20">
        {children}
      </div>
    </div>
  );
}
