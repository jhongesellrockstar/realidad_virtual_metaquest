import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen bg-zinc-950 text-white">
      <section className="mx-auto flex min-h-screen max-w-7xl flex-col justify-center px-6 py-16">
        <div className="max-w-3xl">
          <p className="mb-4 text-sm font-semibold uppercase tracking-[0.3em] text-cyan-400">
            Multiplayer Web Experience
          </p>

          <h1 className="text-5xl font-bold tracking-tight sm:text-7xl">
            Code Arena
          </h1>

          <p className="mt-6 max-w-2xl text-lg leading-8 text-zinc-400">
            Una arena multijugador construida con Unity Web, Next.js y
            tecnologías de comunicación en tiempo real.
          </p>

          <div className="mt-10 flex flex-wrap gap-4">
            <Link
              href="/login"
              className="rounded-xl bg-cyan-500 px-6 py-3 font-semibold text-black transition hover:bg-cyan-400"
            >
              Entrar
            </Link>

            <Link
              href="/register"
              className="rounded-xl border border-zinc-700 px-6 py-3 font-semibold transition hover:border-zinc-500 hover:bg-zinc-900"
            >
              Crear cuenta
            </Link>
          </div>
        </div>

        <div className="mt-20 grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
            <h2 className="font-semibold">Unity Web</h2>
            <p className="mt-2 text-sm text-zinc-400">
              Juego ejecutándose directamente dentro del navegador.
            </p>
          </div>

          <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
            <h2 className="font-semibold">Tiempo real</h2>
            <p className="mt-2 text-sm text-zinc-400">
              Preparado para sincronizar jugadores mediante servidor
              multijugador.
            </p>
          </div>

          <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
            <h2 className="font-semibold">Fullstack</h2>
            <p className="mt-2 text-sm text-zinc-400">
              Next.js, autenticación, base de datos y despliegue integrados.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
