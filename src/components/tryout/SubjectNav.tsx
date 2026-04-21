import type { Subject } from "@/lib/tryout-types";
import { Check, Lock } from "lucide-react";

export function SubjectNav({
  subjects,
  currentSubjectId,
  submittedSubjectIds,
  onSelect,
}: {
  subjects: Array<Subject & { question_count: number }>;
  currentSubjectId: string | null;
  submittedSubjectIds: Set<string>;
  onSelect: (id: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {subjects.map((s) => {
        const isCurrent = s.id === currentSubjectId;
        const isSubmitted = submittedSubjectIds.has(s.id);
        const disabled = isSubmitted && !isCurrent;
        return (
          <button
            key={s.id}
            onClick={() => !disabled && onSelect(s.id)}
            disabled={disabled}
            className={`flex items-center gap-1 rounded-md px-2.5 py-1.5 text-xs font-semibold transition-colors ${
              isCurrent
                ? "bg-primary text-primary-foreground"
                : isSubmitted
                  ? "bg-muted text-muted-foreground"
                  : "bg-secondary text-foreground hover:bg-secondary/70"
            } ${disabled ? "cursor-not-allowed" : ""}`}
            title={s.name}
          >
            {isSubmitted ? <Check className="h-3 w-3" /> : disabled ? <Lock className="h-3 w-3" /> : null}
            {s.code}
          </button>
        );
      })}
    </div>
  );
}
