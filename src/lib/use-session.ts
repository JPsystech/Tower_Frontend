"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

import { fetchSession, SESSION_COOKIE } from "@/lib/api";
import type { SessionPayload } from "@/lib/types";

export function useSession() {
  const router = useRouter();
  const pathname = usePathname();
  const [session, setSession] = useState<SessionPayload | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function refreshSession() {
    const result = await fetchSession();
    setSession(result);
    setError(null);
    return result;
  }

  function clearSession() {
    setSession(null);
    setError(null);
    document.cookie = `${SESSION_COOKIE}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
  }

  useEffect(() => {
    let active = true;

    async function loadSession() {
      setIsLoading(true);

      try {
        const result = await fetchSession();
        if (active) {
          setSession(result);
          setError(null);
        }
      } catch (err) {
        if (active) {
          setError(err instanceof Error ? err.message : "Unable to load session");
          setSession(null);
          document.cookie = `${SESSION_COOKIE}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;

          if (pathname !== "/login") {
            router.replace("/login");
          }
        }
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    }

    void loadSession();

    return () => {
      active = false;
    };
  }, [pathname, router]);

  return { session, isLoading, error, refreshSession, clearSession };
}
