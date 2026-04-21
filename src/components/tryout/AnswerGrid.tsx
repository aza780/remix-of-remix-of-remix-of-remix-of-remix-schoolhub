export function AnswerGrid({
  total,
  currentIndex,
  answeredIndices,
  onJump,
}: {
  total: number;
  currentIndex: number;
  answeredIndices: Set<number>;
  onJump: (index: number) => void;
}) {
  return (
    <div className="grid grid-cols-5 gap-1.5 sm:grid-cols-6">
      {Array.from({ length: total }).map((_, i) => {
        const isCurrent = i === currentIndex;
        const answered = answeredIndices.has(i);
        return (
          <button
            key={i}
            onClick={() => onJump(i)}
            className={`flex h-8 w-full items-center justify-center rounded-md text-xs font-semibold transition-colors ${
              isCurrent
                ? "bg-primary text-primary-foreground ring-2 ring-primary/30"
                : answered
                  ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-200 dark:bg-emerald-900/40 dark:text-emerald-300"
                  : "bg-secondary text-foreground hover:bg-secondary/70"
            }`}
          >
            {i + 1}
          </button>
        );
      })}
    </div>
  );
}
