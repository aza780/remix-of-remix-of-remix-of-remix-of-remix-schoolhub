import { useEffect, useState } from "react";
import { getOrCreateTimer } from "@/lib/tryout-queries";
import type { Subject, SubjectTimer } from "@/lib/tryout-types";

/**
 * Server-side timer per subject. Reads `expires_at` from DB so refresh
 * cannot reset the countdown. Returns seconds remaining.
 */
export function useSubjectTimer(
  sessionId: string | null,
  subject: Subject | null,
  onExpire: () => void
) {
  const [timer, setTimer] = useState<SubjectTimer | null>(null);
  const [secondsLeft, setSecondsLeft] = useState<number>(0);

  // Initialize / fetch timer when session+subject change
  useEffect(() => {
    let cancelled = false;
    setTimer(null);
    setSecondsLeft(0);
    if (!sessionId || !subject) return;

    (async () => {
      try {
        const t = await getOrCreateTimer(sessionId, subject);
        if (cancelled) return;
        setTimer(t);
        const remaining = Math.max(
          0,
          Math.floor((new Date(t.expires_at).getTime() - Date.now()) / 1000)
        );
        setSecondsLeft(remaining);
      } catch (err) {
        console.error("Failed to init timer:", err);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [sessionId, subject?.id]);

  // Tick every second based on actual expires_at (drift-resistant)
  useEffect(() => {
    if (!timer) return;
    const tick = () => {
      const remaining = Math.max(
        0,
        Math.floor((new Date(timer.expires_at).getTime() - Date.now()) / 1000)
      );
      setSecondsLeft(remaining);
      if (remaining <= 0) {
        onExpire();
      }
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [timer, onExpire]);

  return { timer, secondsLeft };
}

export function formatSeconds(total: number): string {
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}
