"use client";

import { useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { useAuth } from "./auth-provider";

export function AuthGuard({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { configurationError, loading, user } = useAuth();

  useEffect(() => {
    if (!loading && !configurationError && !user) {
      router.replace("/login");
    }
  }, [configurationError, loading, router, user]);

  if (configurationError) {
    return <AuthStateMessage message={configurationError} tone="error" />;
  }

  if (loading || !user) {
    return <AuthStateMessage message="Verificando tu sesión…" tone="loading" />;
  }

  return children;
}

export function PublicOnly({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { loading, user } = useAuth();

  useEffect(() => {
    if (!loading && user) {
      router.replace("/lobby");
    }
  }, [loading, router, user]);

  if (loading || user) {
    return <AuthStateMessage message="Cargando Code Arena…" tone="loading" />;
  }

  return children;
}

function AuthStateMessage({
  message,
  tone,
}: {
  message: string;
  tone: "error" | "loading";
}) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-zinc-950 px-6 text-white">
      <div className="max-w-lg rounded-2xl border border-zinc-800 bg-zinc-900 p-8 text-center shadow-2xl">
        <div
          className={`mx-auto mb-5 h-3 w-3 rounded-full ${
            tone === "error" ? "bg-red-400" : "animate-pulse bg-cyan-400"
          }`}
        />
        <p className={tone === "error" ? "text-red-200" : "text-zinc-300"}>
          {message}
        </p>
      </div>
    </main>
  );
}
