"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AuthGuard } from "@/components/auth/auth-guard";
import { useAuth } from "@/components/auth/auth-provider";
import { getFirebaseErrorMessage } from "@/lib/firebase/errors";
import {
  createRoom,
  joinRoom,
  subscribeToWaitingRooms,
  type Room,
} from "@/lib/firebase/rooms";

export default function LobbyPage() {
  return <AuthGuard><LobbyContent /></AuthGuard>;
}

function LobbyContent() {
  const router = useRouter();
  const { logout, user } = useAuth();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [roomCode, setRoomCode] = useState("");
  const [rooms, setRooms] = useState<Room[]>([]);

  useEffect(() => {
    if (!user) {
      return undefined;
    }

    return subscribeToWaitingRooms(
      setRooms,
      (caughtError) => setError(getFirebaseErrorMessage(caughtError)),
    );
  }, [user]);

  async function handleCreateRoom() {
    if (!user) return;
    setBusy(true);
    setError(null);
    try {
      const code = await createRoom(user);
      router.push(`/game?room=${code}`);
    } catch (caughtError) {
      setError(getFirebaseErrorMessage(caughtError));
      setBusy(false);
    }
  }

  async function handleJoinRoom(code = roomCode) {
    if (!user) return;
    setBusy(true);
    setError(null);
    try {
      const normalizedCode = await joinRoom(user, code);
      router.push(`/game?room=${normalizedCode}`);
    } catch (caughtError) {
      setError(getFirebaseErrorMessage(caughtError));
      setBusy(false);
    }
  }

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
            <button onClick={handleCreateRoom} disabled={busy} className="mt-6 rounded-xl bg-cyan-500 px-5 py-3 font-semibold text-black transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-50">
              {busy ? "Procesando…" : "Crear sala"}
            </button>
          </div>

          <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-7">
            <h2 className="text-xl font-semibold">Unirse a una partida</h2>
            <p className="mt-2 text-sm leading-6 text-zinc-400">Ingresa el código de una sala existente.</p>
            <input value={roomCode} onChange={(event) => setRoomCode(event.target.value.toUpperCase().slice(0, 5))} type="text" inputMode="text" autoComplete="off" placeholder="Ejemplo: A7X92" className="mt-6 w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 uppercase outline-none focus:border-cyan-500" />
            <button onClick={() => handleJoinRoom()} disabled={busy || roomCode.length !== 5} className="mt-4 rounded-xl border border-zinc-700 px-5 py-3 font-semibold transition hover:border-cyan-500 hover:text-cyan-300 disabled:cursor-not-allowed disabled:opacity-50">Unirse</button>
          </div>
        </section>

        <section className="mt-8 rounded-2xl border border-zinc-800 bg-zinc-900 p-7">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold">Salas disponibles</h2>
              <p className="mt-1 text-sm text-zinc-400">Se actualizan en tiempo real.</p>
            </div>
            <span className="rounded-full bg-zinc-950 px-3 py-1 text-sm text-zinc-400">{rooms.length}</span>
          </div>
          <div className="mt-5 grid gap-3">
            {rooms.length === 0 ? <p className="rounded-xl bg-zinc-950 p-4 text-sm text-zinc-500">No hay salas esperando jugadores.</p> : rooms.map((room) => (
              <div key={room.code} className="flex flex-col gap-3 rounded-xl bg-zinc-950 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-mono text-lg font-bold tracking-[0.2em] text-cyan-300">{room.code}</p>
                  <p className="mt-1 text-sm text-zinc-500">Anfitrión: {room.hostName} · {room.playerUids.length}/2</p>
                </div>
                <button onClick={() => handleJoinRoom(room.code)} disabled={busy} className="rounded-lg border border-zinc-700 px-4 py-2 text-sm font-semibold transition hover:border-cyan-500 hover:text-cyan-300 disabled:opacity-50">
                  {room.hostUid === user?.uid ? "Volver a entrar" : "Unirse"}
                </button>
              </div>
            ))}
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
