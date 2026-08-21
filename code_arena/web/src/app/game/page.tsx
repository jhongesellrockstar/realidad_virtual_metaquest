"use client";

import Link from "next/link";
import { AuthGuard } from "@/components/auth/auth-guard";

export default function GamePage() {
  return (
    <AuthGuard>
    <main className="min-h-screen bg-zinc-950 text-white">
      <div className="mx-auto flex min-h-screen max-w-7xl flex-col px-6 py-8">
        <header className="mb-6 flex items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Code Arena</h1>
            <p className="mt-2 text-zinc-400">Unity Web multiplayer arena</p>
          </div>
          <Link href="/lobby" className="rounded-lg border border-zinc-700 px-4 py-2 text-sm hover:bg-zinc-900">Volver al lobby</Link>
        </header>

        <section className="flex flex-1 items-center justify-center overflow-hidden rounded-2xl border border-zinc-800 bg-black">
          <iframe
            src="/unity/arena/index.html"
            title="ArenaMultiplayer"
            className="h-[min(720px,75vh)] w-full max-w-[1280px] border-0"
            allow="fullscreen"
          />
        </section>
      </div>
    </main>
    </AuthGuard>
  );
}
