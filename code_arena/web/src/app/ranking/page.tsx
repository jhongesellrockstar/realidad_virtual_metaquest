"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AuthGuard } from "@/components/auth/auth-guard";
import { useAuth } from "@/components/auth/auth-provider";
import { getFirebaseErrorMessage } from "@/lib/firebase/errors";
import {
  subscribeToMatchHistory,
  subscribeToRanking,
  type MatchHistoryItem,
  type RankedScore,
} from "@/lib/firebase/results";

export default function RankingPage() {
  return <AuthGuard><RankingContent /></AuthGuard>;
}

function RankingContent() {
  const { user } = useAuth();
  const [scores, setScores] = useState<RankedScore[]>([]);
  const [matches, setMatches] = useState<MatchHistoryItem[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return undefined;
    const handleError = (caughtError: Error) => setError(getFirebaseErrorMessage(caughtError));
    const unsubscribeRanking = subscribeToRanking(setScores, handleError);
    const unsubscribeHistory = subscribeToMatchHistory(user.uid, setMatches, handleError);
    return () => {
      unsubscribeRanking();
      unsubscribeHistory();
    };
  }, [user]);

  return (
    <main className="min-h-screen bg-zinc-950 px-6 py-10 text-white">
      <div className="mx-auto max-w-6xl">
        <header className="flex flex-wrap items-end justify-between gap-4 border-b border-zinc-800 pb-6">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-cyan-400">Code Arena</p>
            <h1 className="mt-2 text-3xl font-bold">Ranking e historial</h1>
          </div>
          <Link href="/lobby" className="rounded-lg border border-zinc-700 px-4 py-2 text-sm hover:bg-zinc-900">Volver al lobby</Link>
        </header>

        {error ? <p role="alert" className="mt-6 rounded-xl border border-red-900 bg-red-950/60 p-4 text-red-200">{error}</p> : null}

        <div className="mt-8 grid gap-8 lg:grid-cols-[1.2fr_1fr]">
          <section className="overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900">
            <h2 className="p-6 text-xl font-semibold">Clasificación global</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-zinc-950 text-zinc-400"><tr><th className="px-6 py-3">#</th><th className="px-6 py-3">Jugador</th><th className="px-6 py-3">Pts</th><th className="px-6 py-3">V/D</th></tr></thead>
                <tbody>
                  {scores.map((score, index) => (
                    <tr key={score.uid} className={`border-t border-zinc-800 ${score.uid === user?.uid ? "bg-cyan-950/30" : ""}`}>
                      <td className="px-6 py-4 font-mono text-cyan-300">{index + 1}</td>
                      <td className="px-6 py-4 font-medium">{score.displayName}</td>
                      <td className="px-6 py-4 font-bold">{score.points}</td>
                      <td className="px-6 py-4 text-zinc-400">{score.wins}/{score.losses}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {scores.length === 0 ? <p className="p-6 text-sm text-zinc-500">Todavía no hay partidas finalizadas.</p> : null}
          </section>

          <section className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
            <h2 className="text-xl font-semibold">Tus últimas partidas</h2>
            <div className="mt-5 grid gap-3">
              {matches.map((match) => {
                const won = match.winnerUid === user?.uid;
                return <article key={match.id} className="rounded-xl bg-zinc-950 p-4"><div className="flex items-center justify-between gap-4"><span className={`font-bold ${won ? "text-emerald-400" : "text-amber-400"}`}>{won ? "Victoria" : "Derrota"}</span><span className="font-mono text-xs text-zinc-500">{match.roomCode}</span></div><p className="mt-2 text-sm text-zinc-400">Ganador: {match.playerNames[match.winnerUid] || "Jugador"}</p><time className="mt-2 block text-xs text-zinc-600">{match.completedAt?.toLocaleString() || "Fecha pendiente"}</time></article>;
              })}
              {matches.length === 0 ? <p className="rounded-xl bg-zinc-950 p-4 text-sm text-zinc-500">Tu historial aparecerá aquí.</p> : null}
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
