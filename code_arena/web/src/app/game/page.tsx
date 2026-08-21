"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef, useState } from "react";
import { AuthGuard } from "@/components/auth/auth-guard";
import { useAuth } from "@/components/auth/auth-provider";
import { getFirebaseErrorMessage } from "@/lib/firebase/errors";
import { subscribeToRoom, type Room } from "@/lib/firebase/rooms";
import {
  createMultiplayerSocket,
  type MultiplayerSocket,
  type PlayerState,
} from "@/lib/multiplayer/client";

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
  const [serverState, setServerState] = useState<"connecting" | "connected" | "offline">("connecting");
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const socketRef = useRef<MultiplayerSocket | null>(null);

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

  useEffect(() => {
    if (!gameReady || !user || !code) return undefined;

    let cancelled = false;
    let activeSocket: MultiplayerSocket | null = null;
    const latestRemotePlayers = new Map<string, PlayerState>();
    const authenticatedUid = user.uid;

    function sendToUnity(type: string, payload: PlayerState | string) {
      iframeRef.current?.contentWindow?.postMessage({ source: "code-arena-web", type, payload }, window.location.origin);
    }

    void createMultiplayerSocket(user).then((socket) => {
      if (cancelled) {
        socket.disconnect();
        return;
      }

      activeSocket = socket;
      socketRef.current = socket;
      socket.on("connect", () => {
        socket.emit("join_room", code, (result) => {
          if (!result.ok) {
            setError(result.error);
            setServerState("offline");
            return;
          }
          setServerState("connected");
          result.snapshot.players
            .filter((player) => player.uid !== authenticatedUid)
            .forEach((player) => {
              latestRemotePlayers.set(player.uid, player);
              sendToUnity("remote_state", player);
            });
          sendToUnity("local_uid", authenticatedUid);
        });
      });
      socket.on("connect_error", () => setServerState("offline"));
      socket.on("disconnect", () => setServerState("offline"));
      socket.on("player_joined", (player) => {
        latestRemotePlayers.set(player.uid, player);
        sendToUnity("remote_state", player);
      });
      socket.on("player_moved", (player) => {
        latestRemotePlayers.set(player.uid, player);
        sendToUnity("remote_state", player);
      });
      socket.on("player_left", (uid) => {
        latestRemotePlayers.delete(uid);
        sendToUnity("remote_left", uid);
      });
      socket.connect();
    }).catch((caughtError) => {
      if (!cancelled) {
        setError(getFirebaseErrorMessage(caughtError));
        setServerState("offline");
      }
    });

    function handleUnityMessage(event: MessageEvent) {
      if (event.source !== iframeRef.current?.contentWindow || event.data?.source !== "code-arena-unity") return;
      if (event.data.type === "unity_ready") {
        sendToUnity("local_uid", authenticatedUid);
        latestRemotePlayers.forEach((player) => sendToUnity("remote_state", player));
        return;
      }
      if (event.data.type !== "player_move") return;
      const movement = event.data.payload;
      if (!movement || !Number.isFinite(movement.x) || !Number.isFinite(movement.y) || !Number.isInteger(movement.sequence)) return;
      socketRef.current?.emit("player_move", {
        x: movement.x,
        y: movement.y,
        sequence: movement.sequence,
      });
    }

    window.addEventListener("message", handleUnityMessage);
    return () => {
      cancelled = true;
      window.removeEventListener("message", handleUnityMessage);
      activeSocket?.disconnect();
      socketRef.current = null;
    };
  }, [code, gameReady, user]);

  return (
    <main className="min-h-screen bg-zinc-950 text-white">
      <div className="mx-auto flex min-h-screen max-w-7xl flex-col px-6 py-8">
        <header className="mb-6 flex items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Code Arena</h1>
            <p className="mt-2 text-zinc-400">Sala <span className="font-mono font-semibold tracking-widest text-cyan-300">{code || "sin código"}</span></p>
            {gameReady ? <p className={`mt-1 text-xs ${serverState === "connected" ? "text-emerald-400" : serverState === "offline" ? "text-red-400" : "text-amber-400"}`}>Servidor: {serverState === "connected" ? "conectado" : serverState === "offline" ? "sin conexión" : "conectando…"}</p> : null}
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
            ref={iframeRef}
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
