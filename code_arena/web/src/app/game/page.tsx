export default function GamePage() {
  return (
    <main className="min-h-screen bg-zinc-950 text-white">
      <div className="mx-auto flex min-h-screen max-w-7xl flex-col px-6 py-8">
        <header className="mb-6">
          <h1 className="text-3xl font-bold">Code Arena</h1>
          <p className="mt-2 text-zinc-400">
            Unity Web multiplayer arena
          </p>
        </header>

        <section className="flex flex-1 items-center justify-center">
          <iframe
            src="/unity/arena/index.html"
            title="ArenaMultiplayer"
            className="h-[720px] w-full max-w-[1280px] border-0"
            allow="fullscreen"
          />
        </section>
      </div>
    </main>
  );
}