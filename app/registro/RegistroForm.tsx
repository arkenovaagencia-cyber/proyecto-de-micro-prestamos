"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Primitives";
import Link from "next/link";

interface Prestamista { id: string; nombre_negocio: string }

export default function RegistroForm({ prestamistas }: { prestamistas: Prestamista[] }) {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [form, setForm] = useState({
    nombre: "", email: "", telefono: "", cedula: "", password: "",
    prestamista_id: prestamistas[0]?.id ?? "",
  });

  function update<K extends keyof typeof form>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!form.prestamista_id) {
      setError("No hay ningún prestamista activo disponible todavía. Contacta al administrador.");
      return;
    }
    setLoading(true);

    const { data, error: signUpError } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: {
        data: {
          nombre: form.nombre,
          telefono: form.telefono,
          cedula: form.cedula,
          role: "cliente",
          prestamista_id: form.prestamista_id,
        },
      },
    });

    if (signUpError) {
      setError(signUpError.message === "User already registered" ? "Ya existe una cuenta con ese correo." : signUpError.message);
      setLoading(false);
      return;
    }

    // Si tu proyecto de Supabase tiene activada la confirmación de correo
    // (Authentication → Providers → Email → "Confirm email"), aquí no hay
    // sesión todavía — el usuario debe confirmar su correo antes de entrar.
    if (!data.session) {
      setLoading(false);
      setInfo("Cuenta creada. Revisa tu correo y confirma tu cuenta antes de ingresar.");
      return;
    }

    // Con sesión activa (confirmación de correo desactivada, o ya confirmado):
    // crea también la ficha de negocio en `clientes`, ligada a este prestamista.
    if (data.user) {
      await supabase.from("clientes").insert({
        prestamista_id: form.prestamista_id,
        profile_id: data.user.id,
        nombre_completo: form.nombre,
        telefono: form.telefono,
        cedula: form.cedula,
        correo: form.email,
      });
    }

    setLoading(false);
    router.push("/cliente/dashboard");
    router.refresh();
  }

  return (
    <div className="bg-black/40 backdrop-blur-md border border-white/10 rounded-3xl p-9">
      <h1 className="text-2xl font-semibold mb-1.5">Crea tu cuenta</h1>
      <p className="text-sm text-white/60 mb-6">Con tu correo, teléfono o cédula puedes solicitar préstamos y llevar tu cuenta al día.</p>

      {error && <div className="bg-red-400/10 text-red-300 text-sm rounded-xl px-4 py-3 mb-4">{error}</div>}
      {info && <div className="bg-emerald-400/10 text-emerald-300 text-sm rounded-xl px-4 py-3 mb-4">{info}</div>}

      <form onSubmit={onSubmit}>
        {prestamistas.length > 1 && (
          <div className="mb-4">
            <label className="block text-sm font-semibold text-white/85 mb-1.5">Prestamista</label>
            <select
              value={form.prestamista_id}
              onChange={(e) => update("prestamista_id", e.target.value)}
              className="w-full px-3.5 py-3 border border-white/15 rounded-xl text-sm bg-white/5 text-white"
            >
              {prestamistas.map((p) => (
                <option key={p.id} value={p.id} className="text-black">{p.nombre_negocio}</option>
              ))}
            </select>
          </div>
        )}
        <Input label="Nombre completo" required value={form.nombre} onChange={(e) => update("nombre", e.target.value)} />
        <Input label="Correo electrónico" type="email" required value={form.email} onChange={(e) => update("email", e.target.value)} />
        <Input label="Teléfono" type="tel" placeholder="809-000-0000" required value={form.telefono} onChange={(e) => update("telefono", e.target.value)} />
        <Input label="Cédula" placeholder="000-0000000-0" required value={form.cedula} onChange={(e) => update("cedula", e.target.value)} />
        <Input label="Contraseña" type="password" minLength={6} required value={form.password} onChange={(e) => update("password", e.target.value)} />
        <Button type="submit" variant="primary" className="w-full" disabled={loading}>
          {loading ? "Creando cuenta..." : "Crear cuenta"}
        </Button>
      </form>
      <p className="text-center text-sm text-white/50 mt-6">
        ¿Ya tienes cuenta? <Link href="/login" className="text-[#eac888] font-semibold underline">Ingresa</Link>
      </p>
    </div>
  );
}
