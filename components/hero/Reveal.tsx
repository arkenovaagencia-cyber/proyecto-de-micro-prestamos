"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Envuelve cualquier contenido y lo hace aparecer de forma "mágica" cuando
 * entra en pantalla al hacer scroll: desenfoque que se enfoca + escala +
 * desplazamiento. Vuelve a ocultarse si sales de la vista, para que el
 * efecto se repita al subir y bajar.
 */
export default function Reveal({
  children,
  delayMs = 0,
  className = "",
}: {
  children: React.ReactNode;
  delayMs?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => setInView(entry.isIntersecting),
      { threshold: 0.35 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: inView ? 1 : 0,
        transform: inView ? "translateY(0) scale(1)" : "translateY(46px) scale(0.94)",
        filter: inView ? "blur(0px)" : "blur(9px)",
        transition: `opacity 0.9s cubic-bezier(.16,1,.3,1) ${delayMs}ms, transform 0.9s cubic-bezier(.16,1,.3,1) ${delayMs}ms, filter 0.9s cubic-bezier(.16,1,.3,1) ${delayMs}ms`,
      }}
    >
      {children}
    </div>
  );
}
