"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { PublicOnly } from "@/components/auth/auth-guard";
import { useAuth } from "@/components/auth/auth-provider";
import { getFirebaseErrorMessage } from "@/lib/firebase/errors";

export default function LoginPage() {
  return (
    <PublicOnly>
      <LoginForm />
    </PublicOnly>
  );
}

function LoginForm() {
  const router = useRouter();
  const { configurationError, login } = useAuth();
  const [error, setError] = useState<string | null>(configurationError);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);

    const formData = new FormData(event.currentTarget);

    try {
      await login(
        String(formData.get("email") ?? "").trim(),
        String(formData.get("password") ?? ""),
      );
      router.replace("/lobby");
    } catch (caughtError) {
      setError(getFirebaseErrorMessage(caughtError));
      setSubmitting(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-zinc-950 px-6 py-12 text-white">
      <div className="w-full max-w-md rounded-2xl border border-zinc-800 bg-zinc-900 p-8 shadow-2xl">
        <div className="mb-8">
          <p className="text-sm font-semibold uppercase tracking-[0.25em] text-cyan-400">Code Arena</p>
          <h1 className="mt-3 text-3xl font-bold">Iniciar sesión</h1>
          <p className="mt-2 text-sm text-zinc-400">Accede al lobby para crear o unirte a una partida.</p>
        </div>

        <form className="space-y-5" onSubmit={handleSubmit}>
          <label className="block text-sm font-medium text-zinc-300">
            Correo electrónico
            <input name="email" type="email" autoComplete="email" required placeholder="jugador@correo.com" className="mt-2 w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-white outline-none transition focus:border-cyan-500" />
          </label>
          <label className="block text-sm font-medium text-zinc-300">
            Contraseña
            <input name="password" type="password" autoComplete="current-password" required minLength={6} placeholder="••••••••" className="mt-2 w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-white outline-none transition focus:border-cyan-500" />
          </label>

          {error ? <p role="alert" className="rounded-xl border border-red-900 bg-red-950/60 p-3 text-sm text-red-200">{error}</p> : null}

          <button type="submit" disabled={submitting || Boolean(configurationError)} className="w-full rounded-xl bg-cyan-500 px-4 py-3 font-semibold text-black transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-50">
            {submitting ? "Ingresando…" : "Iniciar sesión"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-zinc-400">
          ¿Aún no tienes cuenta?{" "}
          <Link href="/register" className="font-semibold text-cyan-400 hover:text-cyan-300">Regístrate</Link>
        </p>
        <Link href="/" className="mt-6 block text-center text-sm text-zinc-500 hover:text-white">← Volver al inicio</Link>
      </div>
    </main>
  );
}
