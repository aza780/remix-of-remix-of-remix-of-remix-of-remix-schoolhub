import { LatexText } from "@/lib/latex";
import type { AnswerOption, Question } from "@/lib/tryout-types";
import { ANSWER_OPTIONS } from "@/lib/tryout-types";

export function QuestionDisplay({
  question,
  questionNumber,
  totalQuestions,
  selectedAnswer,
  onSelect,
}: {
  question: Question;
  questionNumber: number;
  totalQuestions: number;
  selectedAnswer: AnswerOption | null;
  onSelect: (option: AnswerOption) => void;
}) {
  const optionTexts: Record<AnswerOption, string> = {
    A: question.option_a,
    B: question.option_b,
    C: question.option_c,
    D: question.option_d,
    E: question.option_e,
  };

  return (
    <div>
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        Soal {questionNumber} dari {totalQuestions}
      </p>

      <div className="prose prose-sm mb-4 max-w-none text-foreground">
        <LatexText text={question.question_text} />
      </div>

      {question.image_url && (
        <img
          src={question.image_url}
          alt="Soal"
          className="mb-4 max-h-64 rounded-lg border object-contain"
        />
      )}

      <div className="space-y-2">
        {ANSWER_OPTIONS.map((opt) => {
          const isSelected = selectedAnswer === opt;
          return (
            <button
              key={opt}
              onClick={() => onSelect(opt)}
              className={`flex w-full items-start gap-3 rounded-lg border p-3 text-left transition-colors ${
                isSelected
                  ? "border-primary bg-primary/5"
                  : "border-border bg-card hover:border-primary/40 hover:bg-secondary/50"
              }`}
            >
              <span
                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-sm font-semibold ${
                  isSelected
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-foreground"
                }`}
              >
                {opt}
              </span>
              <span className="pt-0.5 text-sm text-foreground">
                <LatexText text={optionTexts[opt]} />
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
