"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { AuthGuard } from "@/components/auth/auth-guard";
import { useAuth } from "@/components/auth/auth-provider";
import { getFirebaseErrorMessage } from "@/lib/firebase/errors";

export default function LobbyPage() {
  return <AuthGuard><LobbyContent /></AuthGuard>;
}

function LobbyContent() {
  const router = useRouter();
  const { logout, user } = useAuth();
  const [error, setError] = useState<string | null>(null);

  async function handleLogout() {
    setError(null);
    try {
      await logout();
      router.replace("/");
    } catch (caughtError) {
      setError(getFirebaseErrorMessage(caughtError));
    }
  }

  return (
    <main className="min-h-screen bg-zinc-950 px-6 py-10 text-white">
      <div className="mx-auto max-w-6xl">
        <header className="flex flex-col gap-4 border-b border-zinc-800 pb-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-cyan-400">Code Arena</p>
            <h1 className="mt-2 text-3xl font-bold">Lobby</h1>
            <p className="mt-2 text-sm text-zinc-400">
              Sesión: <span className="text-zinc-200">{user?.displayName || user?.email}</span>
            </p>
          </div>
          <button onClick={handleLogout} className="rounded-lg border border-zinc-700 px-4 py-2 text-sm text-zinc-300 transition hover:bg-zinc-900 hover:text-white">
            Cerrar sesión
          </button>
        </header>

        {error ? <p role="alert" className="mt-6 rounded-xl border border-red-900 bg-red-950/60 p-4 text-sm text-red-200">{error}</p> : null}

        <section className="mt-10 grid gap-6 lg:grid-cols-2">
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-7">
            <h2 className="text-xl font-semibold">Crear partida</h2>
            <p className="mt-2 text-sm leading-6 text-zinc-400">Crea una nueva sala y comparte el código con otro jugador.</p>
            <button disabled className="mt-6 rounded-xl bg-cyan-500 px-5 py-3 font-semibold text-black opacity-50">
              Preparando Firestore…
            </button>
          </div>

          <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-7">
            <h2 className="text-xl font-semibold">Unirse a una partida</h2>
            <p className="mt-2 text-sm leading-6 text-zinc-400">Ingresa el código de una sala existente.</p>
            <input disabled type="text" placeholder="Ejemplo: A7X92" className="mt-6 w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 uppercase opacity-50 outline-none" />
            <button disabled className="mt-4 rounded-xl border border-zinc-700 px-5 py-3 font-semibold opacity-50">Unirse</button>
          </div>
        </section>

        <section className="mt-8 rounded-2xl border border-zinc-800 bg-zinc-900 p-7">
          <h2 className="text-xl font-semibold">Estado del sistema</h2>
          <div className="mt-5 grid gap-4 sm:grid-cols-3">
            <Status name="Web" value="Disponible" ready />
            <Status name="Servidor" value="Pendiente" />
            <Status name="Firebase" value="Conectado" ready />
          </div>
        </section>
      </div>
    </main>
  );
}

function Status({ name, value, ready = false }: { name: string; value: string; ready?: boolean }) {
  return (
    <div className="rounded-xl bg-zinc-950 p-4">
      <p className="text-sm text-zinc-500">{name}</p>
      <p className={`mt-1 font-semibold ${ready ? "text-emerald-400" : "text-amber-400"}`}>{value}</p>
    </div>
  );
}
