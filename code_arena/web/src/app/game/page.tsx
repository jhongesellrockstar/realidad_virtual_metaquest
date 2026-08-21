"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { AuthGuard } from "@/components/auth/auth-guard";
import { useAuth } from "@/components/auth/auth-provider";
import { getFirebaseErrorMessage } from "@/lib/firebase/errors";
import { subscribeToRoom, type Room } from "@/lib/firebase/rooms";

export default function GamePage() {
  return (
    <AuthGuard>
      <Suspense fallback={<GameLoading />}>
        <GameContent />
      </Suspense>
    </AuthGuard>
  );
}

function GameContent() {
  const searchParams = useSearchParams();
  const code = searchParams.get("room")?.trim().toUpperCase() ?? "";
  const { user } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(Boolean(code));
  const [room, setRoom] = useState<Room | null>(null);

  useEffect(() => {
    if (!user || !code) {
      return undefined;
    }

    return subscribeToRoom(
      code,
      (nextRoom) => {
        if (!nextRoom) {
          setError("La sala no existe.");
        } else if (!nextRoom.playerUids.includes(user.uid)) {
          setError("No perteneces a esta sala.");
        } else {
          setRoom(nextRoom);
          setError(null);
        }
        setLoading(false);
      },
      (caughtError) => {
        setError(getFirebaseErrorMessage(caughtError));
        setLoading(false);
      },
    );
  }, [code, user]);

  const gameReady = room?.status === "ready" || room?.status === "playing";

  return (
    <main className="min-h-screen bg-zinc-950 text-white">
      <div className="mx-auto flex min-h-screen max-w-7xl flex-col px-6 py-8">
        <header className="mb-6 flex items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Code Arena</h1>
            <p className="mt-2 text-zinc-400">Sala <span className="font-mono font-semibold tracking-widest text-cyan-300">{code || "sin código"}</span></p>
          </div>
          <Link href="/lobby" className="rounded-lg border border-zinc-700 px-4 py-2 text-sm hover:bg-zinc-900">Volver al lobby</Link>
        </header>

        {loading ? <GameLoading /> : error || !code ? (
          <section className="flex flex-1 flex-col items-center justify-center rounded-2xl border border-red-950 bg-zinc-900 p-8 text-center">
            <p role="alert" className="text-red-300">{error || "Selecciona una sala desde el lobby."}</p>
            <Link href="/lobby" className="mt-5 rounded-lg bg-cyan-500 px-4 py-2 font-semibold text-black">Buscar sala</Link>
          </section>
        ) : !gameReady ? (
          <section className="flex flex-1 flex-col items-center justify-center rounded-2xl border border-zinc-800 bg-zinc-900 p-8 text-center">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-zinc-700 border-t-cyan-400" />
            <h2 className="mt-6 text-2xl font-semibold">Esperando al segundo jugador</h2>
            <p className="mt-3 text-zinc-400">Comparte el código <span className="font-mono font-bold tracking-widest text-cyan-300">{code}</span></p>
          </section>
        ) : (
          <section className="flex flex-1 items-center justify-center overflow-hidden rounded-2xl border border-zinc-800 bg-black">
          <iframe
            src="/unity/arena/index.html"
            title="ArenaMultiplayer"
            className="h-[min(720px,75vh)] w-full max-w-[1280px] border-0"
            allow="fullscreen"
          />
          </section>
        )}
      </div>
    </main>
  );
}

function GameLoading() {
  return <main className="flex min-h-screen items-center justify-center bg-zinc-950 text-zinc-400">Cargando sala…</main>;
}
