import { Clock } from "lucide-react";
import { formatSeconds } from "@/hooks/useSubjectTimer";

export function SubjectTimer({ secondsLeft }: { secondsLeft: number }) {
  const danger = secondsLeft <= 60;
  const warn = !danger && secondsLeft <= 300;
  return (
    <div
      className={`flex items-center gap-2 rounded-lg px-3 py-2 font-mono text-lg font-bold tabular-nums ${
        danger
          ? "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300"
          : warn
            ? "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300"
            : "bg-secondary text-foreground"
      }`}
    >
      <Clock className="h-5 w-5" />
      {formatSeconds(secondsLeft)}
    </div>
  );
}
