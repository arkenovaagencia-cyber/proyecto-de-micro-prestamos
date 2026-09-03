"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Primitives";
import AuthBackground from "@/components/layout/AuthBackground";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { data, error: signInError } = await supabase.auth.signInWithPassword({ email, password });
    if (signInError) {
      setError("Correo o contraseña incorrectos.");
      setLoading(false);
      return;
    }

    const { data: profile } = await supabase.from("profiles").select("role").eq("id", data.user.id).single();
    setLoading(false);

    if (profile?.role === "prestamista_admin" || profile?.role === "plataforma_admin") {
      router.push("/admin/dashboard");
    } else {
      router.push("/cliente/dashboard");
    }
    router.refresh();
  }

  return (
    <AuthBackground>
      <div className="bg-black/40 backdrop-blur-md border border-white/10 rounded-3xl p-9">
        <h1 className="text-2xl font-semibold mb-1.5">Bienvenido de nuevo</h1>
        <p className="text-sm text-white/60 mb-7">Ingresa con tu correo y contraseña.</p>

        {error && <div className="bg-red-400/10 text-red-300 text-sm rounded-xl px-4 py-3 mb-4">{error}</div>}

        <form onSubmit={onSubmit}>
          <Input label="Correo electrónico" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          <Input label="Contraseña" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} />
          <Button type="submit" className="w-full" disabled={loading}>{loading ? "Ingresando..." : "Ingresar"}</Button>
        </form>
        <p className="text-center text-sm text-white/50 mt-6">
          ¿No tienes cuenta? <Link href="/registro" className="text-[#eac888] font-semibold underline">Regístrate</Link>
        </p>
      </div>
    </AuthBackground>
  );
}
