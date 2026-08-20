import Link from "next/link";

export default function LobbyPage() {
  return (
    <main className="min-h-screen bg-zinc-950 px-6 py-10 text-white">
      <div className="mx-auto max-w-6xl">
        <header className="flex flex-col gap-4 border-b border-zinc-800 pb-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-cyan-400">
              Code Arena
            </p>

            <h1 className="mt-2 text-3xl font-bold">Lobby</h1>
          </div>

          <Link
            href="/"
            className="text-sm text-zinc-400 transition hover:text-white"
          >
            Cerrar sesión
          </Link>
        </header>

        <section className="mt-10 grid gap-6 lg:grid-cols-2">
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-7">
            <h2 className="text-xl font-semibold">Crear partida</h2>

            <p className="mt-2 text-sm leading-6 text-zinc-400">
              Crea una nueva sala y comparte el código con otro jugador.
            </p>

            <Link
              href="/game"
              className="mt-6 inline-block rounded-xl bg-cyan-500 px-5 py-3 font-semibold text-black transition hover:bg-cyan-400"
            >
              Crear partida
            </Link>
          </div>

          <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-7">
            <h2 className="text-xl font-semibold">Unirse a una partida</h2>

            <p className="mt-2 text-sm leading-6 text-zinc-400">
              Ingresa el código de una sala existente.
            </p>

            <input
              type="text"
              placeholder="Ejemplo: A7X92"
              className="mt-6 w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 uppercase outline-none transition focus:border-cyan-500"
            />

            <Link
              href="/game"
              className="mt-4 inline-block rounded-xl border border-zinc-700 px-5 py-3 font-semibold transition hover:bg-zinc-800"
            >
              Unirse
            </Link>
          </div>
        </section>

        <section className="mt-8 rounded-2xl border border-zinc-800 bg-zinc-900 p-7">
          <h2 className="text-xl font-semibold">Estado del sistema</h2>

          <div className="mt-5 grid gap-4 sm:grid-cols-3">
            <div className="rounded-xl bg-zinc-950 p-4">
              <p className="text-sm text-zinc-500">Web</p>
              <p className="mt-1 font-semibold text-emerald-400">Disponible</p>
            </div>

            <div className="rounded-xl bg-zinc-950 p-4">
              <p className="text-sm text-zinc-500">Servidor</p>
              <p className="mt-1 font-semibold text-amber-400">
                Pendiente
              </p>
            </div>

            <div className="rounded-xl bg-zinc-950 p-4">
              <p className="text-sm text-zinc-500">Firebase</p>
              <p className="mt-1 font-semibold text-amber-400">
                Pendiente
              </p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}