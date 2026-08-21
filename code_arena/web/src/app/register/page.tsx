"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { PublicOnly } from "@/components/auth/auth-guard";
import { useAuth } from "@/components/auth/auth-provider";
import { getFirebaseErrorMessage } from "@/lib/firebase/errors";

export default function RegisterPage() {
  return <PublicOnly><RegisterForm /></PublicOnly>;
}

function RegisterForm() {
  const router = useRouter();
  const { configurationError, register } = useAuth();
  const [error, setError] = useState<string | null>(configurationError);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    const formData = new FormData(event.currentTarget);
    const displayName = String(formData.get("displayName") ?? "").trim();
    const email = String(formData.get("email") ?? "").trim();
    const password = String(formData.get("password") ?? "");
    const confirmation = String(formData.get("confirmation") ?? "");

    if (password !== confirmation) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    setSubmitting(true);
    try {
      await register(displayName, email, password);
      router.replace("/lobby");
    } catch (caughtError) {
      setError(getFirebaseErrorMessage(caughtError));
      setSubmitting(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-zinc-950 px-6 py-12 text-white">
      <div className="w-full max-w-md rounded-2xl border border-zinc-800 bg-zinc-900 p-8 shadow-2xl">
        <p className="text-sm font-semibold uppercase tracking-[0.25em] text-cyan-400">Code Arena</p>
        <h1 className="mt-3 text-3xl font-bold">Crear cuenta</h1>
        <p className="mt-2 text-sm text-zinc-400">Tu perfil se guardará de forma segura en Firebase.</p>

        <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
          <Field label="Nombre de jugador" name="displayName" type="text" autoComplete="nickname" minLength={2} />
          <Field label="Correo electrónico" name="email" type="email" autoComplete="email" />
          <Field label="Contraseña" name="password" type="password" autoComplete="new-password" minLength={6} />
          <Field label="Confirmar contraseña" name="confirmation" type="password" autoComplete="new-password" minLength={6} />
          {error ? <p role="alert" className="rounded-xl border border-red-900 bg-red-950/60 p-3 text-sm text-red-200">{error}</p> : null}
          <button type="submit" disabled={submitting || Boolean(configurationError)} className="w-full rounded-xl bg-cyan-500 px-4 py-3 font-semibold text-black transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-50">
            {submitting ? "Creando cuenta…" : "Registrarme"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-zinc-400">
          ¿Ya tienes cuenta?{" "}
          <Link href="/login" className="font-semibold text-cyan-400 hover:text-cyan-300">Inicia sesión</Link>
        </p>
      </div>
    </main>
  );
}

function Field({ label, name, type, autoComplete, minLength }: { label: string; name: string; type: string; autoComplete: string; minLength?: number }) {
  return (
    <label className="block text-sm font-medium text-zinc-300">
      {label}
      <input name={name} type={type} autoComplete={autoComplete} required minLength={minLength} className="mt-2 w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-white outline-none transition focus:border-cyan-500" />
    </label>
  );
}
