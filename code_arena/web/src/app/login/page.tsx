import Link from "next/link";

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-zinc-950 px-6 text-white">
      <div className="w-full max-w-md rounded-2xl border border-zinc-800 bg-zinc-900 p-8 shadow-2xl">
        <div className="mb-8">
          <p className="text-sm font-semibold uppercase tracking-[0.25em] text-cyan-400">
            Code Arena
          </p>

          <h1 className="mt-3 text-3xl font-bold">Iniciar sesión</h1>

          <p className="mt-2 text-sm text-zinc-400">
            Accede al lobby para crear o unirte a una partida.
          </p>
        </div>

        <form className="space-y-5">
          <div>
            <label
              htmlFor="email"
              className="mb-2 block text-sm font-medium text-zinc-300"
            >
              Correo electrónico
            </label>

            <input
              id="email"
              type="email"
              placeholder="jugador@correo.com"
              className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 outline-none transition focus:border-cyan-500"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="mb-2 block text-sm font-medium text-zinc-300"
            >
              Contraseña
            </label>

            <input
              id="password"
              type="password"
              placeholder="••••••••"
              className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 outline-none transition focus:border-cyan-500"
            />
          </div>

          <Link
            href="/lobby"
            className="block w-full rounded-xl bg-cyan-500 px-4 py-3 text-center font-semibold text-black transition hover:bg-cyan-400"
          >
            Iniciar sesión
          </Link>
        </form>

        <div className="mt-6 border-t border-zinc-800 pt-6 text-center text-sm text-zinc-400">
          La autenticación real con Firebase se integrará en la siguiente fase.
        </div>

        <Link
          href="/"
          className="mt-6 block text-center text-sm text-zinc-500 hover:text-white"
        >
          ← Volver al inicio
        </Link>
      </div>
    </main>
  );
}