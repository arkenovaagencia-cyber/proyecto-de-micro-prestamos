"use client";

import Image from "next/image";
import Link from "next/link";
import Reveal from "./Reveal";

export default function HomeExperience({
  nombrePublico = "Prestamigo",
  heroTitulo = "Financiamiento inteligente para tu próximo paso.",
  heroSubtitulo = "Solicita, aprueba y da seguimiento a tu préstamo con la seguridad de una plataforma construida para crecer contigo.",
  logoUrl,
}: {
  nombrePublico?: string;
  heroTitulo?: string;
  heroSubtitulo?: string;
  logoUrl?: string | null;
}) {
  const pasos = [
    { n: "01", t: "Solicita en minutos", d: "Monto, plazo y garantía desde tu teléfono." },
    { n: "02", t: "Revisamos con criterio", d: "Aprobamos, ajustamos o explicamos por qué no." },
    { n: "03", t: "Recibe y da seguimiento", d: "Saldo, cuotas e historial siempre a la vista." },
  ];
  const garantias = ["Teléfono móvil", "Televisor", "Vehículo", "Joyas", "Equipo electrónico", "Otro"];

  return (
    <div className="relative text-white" style={{ scrollSnapType: "y mandatory" }}>
      {/* Fondo fijo — nunca se mueve, todo lo demás se desliza encima */}
      <div className="fixed inset-0 z-0">
        <div className="absolute inset-0 md:hidden">
          <Image src="/hero/fondo-oro-mobile.png" alt="" fill priority quality={90} sizes="100vw" className="object-cover object-center" />
        </div>
        <div className="absolute inset-0 hidden md:block">
          <Image src="/hero/fondo-oro-desktop.png" alt="" fill priority quality={90} sizes="100vw" className="object-cover object-center" />
        </div>
        <div className="absolute inset-0 bg-gradient-to-b from-black/45 via-black/10 to-black/55" />
      </div>

      {/* Navbar fijo */}
      <header className="fixed top-0 left-0 right-0 z-20">
        <nav className="max-w-6xl mx-auto flex items-center justify-between px-6 py-6">
          <div className="flex items-center gap-2.5 font-semibold text-lg tracking-tight">
            {logoUrl ? (
              <img src={logoUrl} alt={nombrePublico} className="w-8 h-8 rounded-full object-cover border border-white/20" />
            ) : (
              <span className="w-8 h-8 rounded-full border border-white/20 flex items-center justify-center text-[#eac888] text-xs font-mono">P$</span>
            )}
            {nombrePublico}
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm text-white/70">
            <a href="#como-funciona" className="hover:text-white transition">Cómo funciona</a>
            <a href="#confianza" className="hover:text-white transition">Confianza</a>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login" className="text-sm font-semibold text-white hover:text-[#eac888] px-4 py-2 rounded-full border border-white/25 hover:border-[#eac888]/50 transition">
              Iniciar sesión
            </Link>
            <Link href="/registro" className="text-sm font-semibold text-[#1a1305] bg-[#eac888] hover:bg-[#f0d9a3] px-5 py-2 rounded-full transition">
              Crear cuenta
            </Link>
          </div>
        </nav>
      </header>

      {/* Contenido que se desliza encima del fondo fijo */}
      <main className="relative z-10">
        {/* Sección 1: Hero */}
        <section className="min-h-[100dvh] flex flex-col items-center justify-center text-center px-6" style={{ scrollSnapAlign: "start" }}>
          <Reveal>
            <span className="inline-flex items-center gap-2 text-[11px] font-mono uppercase tracking-[0.16em] text-[#eac888]/90 border border-[#eac888]/25 bg-[#eac888]/[0.06] px-4 py-1.5 rounded-full mb-7">
              Tecnología financiera de confianza
            </span>
          </Reveal>
          <Reveal delayMs={100}>
            <h1 className="font-semibold leading-[1.05] tracking-tight text-4xl sm:text-5xl md:text-6xl mb-6 max-w-3xl" style={{ textShadow: "0 2px 30px rgba(0,0,0,0.65)" }}>
              {heroTitulo}
            </h1>
          </Reveal>
          <Reveal delayMs={200}>
            <p className="text-base sm:text-lg text-white/75 max-w-xl mb-3" style={{ textShadow: "0 2px 20px rgba(0,0,0,0.7)" }}>
              {heroSubtitulo}
            </p>
            <p className="text-sm text-[#eac888]/90 font-medium mb-8">
              Crea tu cuenta gratis para solicitar — sin cuenta no se puede pedir prestado.
            </p>
          </Reveal>
          <Reveal delayMs={300}>
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <Link href="/registro" className="text-sm font-semibold text-[#1a1305] bg-[#eac888] hover:bg-[#f0d9a3] px-7 py-3.5 rounded-full transition">
                Crear cuenta y solicitar →
              </Link>
              <Link href="/login" className="text-sm font-medium text-white/80 hover:text-white px-7 py-3.5 rounded-full border border-white/15 hover:border-white/30 transition">
                Ya tengo cuenta
              </Link>
            </div>
            <p className="text-xs text-white/45 mt-4">
              Requiere dejar una garantía (teléfono, TV, vehículo u otro artículo de valor).
            </p>
          </Reveal>

          <div className="absolute bottom-9 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2">
            <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-white/50">Desliza</span>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth="2" className="animate-bounce">
              <path d="M6 9l6 6 6-6" />
            </svg>
          </div>
        </section>

        {/* Sección 2: Cómo funciona */}
        <section id="como-funciona" className="min-h-[100dvh] flex flex-col items-center justify-center text-center px-6" style={{ scrollSnapAlign: "start" }}>
          <Reveal>
            <span className="inline-flex items-center gap-2 text-[11px] font-mono uppercase tracking-[0.16em] text-[#eac888]/90 border border-[#eac888]/25 bg-[#eac888]/[0.06] px-4 py-1.5 rounded-full mb-6">
              Tres pasos
            </span>
          </Reveal>
          <Reveal delayMs={100}>
            <h2 className="text-3xl md:text-4xl font-semibold mb-12 max-w-lg" style={{ textShadow: "0 2px 30px rgba(0,0,0,0.65)" }}>
              De la solicitud al dinero en tu cuenta
            </h2>
          </Reveal>
          <div className="flex flex-col gap-6 max-w-md w-full">
            {pasos.map((p, i) => (
              <Reveal key={p.n} delayMs={150 + i * 120}>
                <div className="flex gap-4 items-start text-left border border-white/12 rounded-2xl p-5 bg-black/25 backdrop-blur-sm">
                  <span className="font-mono text-xs text-[#eac888] border border-[#eac888]/35 rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0">{p.n}</span>
                  <div>
                    <b className="block text-sm mb-1">{p.t}</b>
                    <span className="text-sm text-white/60">{p.d}</span>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </section>

        {/* Sección 3: Garantías */}
        <section className="min-h-[100dvh] flex flex-col items-center justify-center text-center px-6" style={{ scrollSnapAlign: "start" }}>
          <Reveal>
            <span className="inline-flex items-center gap-2 text-[11px] font-mono uppercase tracking-[0.16em] text-[#eac888]/90 border border-[#eac888]/25 bg-[#eac888]/[0.06] px-4 py-1.5 rounded-full mb-6">
              Garantías aceptadas
            </span>
          </Reveal>
          <Reveal delayMs={100}>
            <h2 className="text-3xl md:text-4xl font-semibold mb-10 max-w-lg" style={{ textShadow: "0 2px 30px rgba(0,0,0,0.65)" }}>
              Respaldamos el préstamo con lo que ya tienes
            </h2>
          </Reveal>
          <Reveal delayMs={220}>
            <div className="flex flex-wrap gap-3 justify-center max-w-xl">
              {garantias.map((g) => (
                <span key={g} className="text-sm px-5 py-2.5 rounded-full border border-white/20 bg-black/25 backdrop-blur-sm">{g}</span>
              ))}
            </div>
          </Reveal>
        </section>

        {/* Sección 4: Confianza + CTA final */}
        <section id="confianza" className="min-h-[100dvh] flex flex-col items-center justify-center text-center px-6" style={{ scrollSnapAlign: "start" }}>
          <Reveal>
            <span className="inline-flex items-center gap-2 text-[11px] font-mono uppercase tracking-[0.16em] text-[#eac888]/90 border border-[#eac888]/25 bg-[#eac888]/[0.06] px-4 py-1.5 rounded-full mb-6">
              Confianza
            </span>
          </Reveal>
          <Reveal delayMs={100}>
            <h2 className="text-3xl md:text-4xl font-semibold mb-4 max-w-lg" style={{ textShadow: "0 2px 30px rgba(0,0,0,0.65)" }}>
              Construido para que tus datos sean solo tuyos
            </h2>
          </Reveal>
          <Reveal delayMs={200}>
            <p className="text-white/70 mb-9 max-w-md">
              Cada cliente ve únicamente su propia información — protegido a nivel de base de datos, no solo en la pantalla.
            </p>
          </Reveal>
          <Reveal delayMs={300}>
            <Link href="/registro" className="inline-block text-sm font-semibold text-[#1a1305] bg-[#eac888] hover:bg-[#f0d9a3] px-7 py-3.5 rounded-full transition">
              Crear cuenta y solicitar →
            </Link>
          </Reveal>

          <div className="absolute bottom-8 left-0 right-0 text-center text-xs text-white/40">
            © {nombrePublico} — <Link href="/login" className="underline hover:text-white/70">Iniciar sesión</Link>
          </div>
        </section>
      </main>
    </div>
  );
}
