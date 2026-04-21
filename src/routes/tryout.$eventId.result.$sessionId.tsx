import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { ArrowLeft, CheckCircle2, Trophy, XCircle } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { LatexText } from "@/lib/latex";
import { supabase } from "@/integrations/supabase/client";
import {
  fetchEventQuestionsFull,
  fetchEventRanking,
  fetchSession,
  fetchSessionAnswers,
  fetchSubjects,
} from "@/lib/tryout-queries";
import { useAuth } from "@/hooks/use-auth";
import { SCORE_PER_CORRECT } from "@/lib/tryout-types";

export const Route = createFileRoute("/tryout/$eventId/result/$sessionId")({
  beforeLoad: async () => {
    if (typeof window === "undefined") return;
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw redirect({ to: "/login" });
  },
  component: TryoutResultPage,
});

function TryoutResultPage() {
  const { eventId, sessionId } = Route.useParams();
  const { user } = useAuth();
  const [showExplanations, setShowExplanations] = useState(false);

  const { data: session } = useQuery({
    queryKey: ["tryout-session", sessionId],
    queryFn: () => fetchSession(sessionId),
  });

  const { data: subjects } = useQuery({
    queryKey: ["subjects"],
    queryFn: fetchSubjects,
  });

  const { data: answers } = useQuery({
    queryKey: ["tryout-answers", sessionId],
    queryFn: () => fetchSessionAnswers(sessionId),
  });

  const { data: ranking } = useQuery({
    queryKey: ["tryout-ranking", eventId],
    queryFn: () => fetchEventRanking(eventId),
  });

  // Only fetch full questions (with correct answer + explanation) AFTER session is submitted
  const { data: fullQuestions } = useQuery({
    queryKey: ["tryout-full-questions", eventId, session?.status],
    queryFn: () => fetchEventQuestionsFull(eventId),
    enabled: session?.status === "submitted",
  });

  const breakdownPerSubject = useMemo(() => {
    if (!subjects || !answers) return [];
    return subjects
      .map((s) => {
        const subAnswers = answers.filter((a) => a.subject_id === s.id);
        if (subAnswers.length === 0) return null;
        const correct = subAnswers.filter((a) => a.is_correct === true).length;
        const total = subAnswers.length;
        return { subject: s, correct, total, score: correct * SCORE_PER_CORRECT };
      })
      .filter(Boolean) as Array<{
        subject: NonNullable<typeof subjects>[number];
        correct: number;
        total: number;
        score: number;
      }>;
  }, [subjects, answers]);

  const totalAnswered = answers?.length ?? 0;
  const maxScore = totalAnswered * SCORE_PER_CORRECT;
  const totalScore = session?.total_score ?? 0;
  const pct = maxScore > 0 ? Math.round((Number(totalScore) / maxScore) * 100) : 0;

  const myRank = useMemo(() => {
    if (!ranking || !user) return null;
    const idx = ranking.findIndex((r) => r.id === sessionId);
    return idx >= 0 ? { rank: idx + 1, total: ranking.length } : null;
  }, [ranking, user, sessionId]);

  const answersById = useMemo(() => {
    const map = new Map<string, (typeof answers)[number] | undefined>();
    (answers ?? []).forEach((a) => map.set(a.question_id, a));
    return map;
  }, [answers]);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="mx-auto max-w-3xl px-4 py-8">
        <Link to="/tryout" className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Semua Tryout
        </Link>

        <div className="rounded-xl border bg-card p-6 shadow-sm">
          <div className="mb-6 text-center">
            <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
              <Trophy className="h-7 w-7" />
            </div>
            <h1 className="text-2xl font-bold text-foreground">Tryout Selesai!</h1>
            <p className="text-sm text-muted-foreground">Berikut hasil pengerjaan kamu.</p>
          </div>

          {/* Score */}
          <div className="mb-6 rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 p-6 text-center">
            <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Skor Total
            </p>
            <p className="text-4xl font-bold text-primary">{Number(totalScore).toFixed(0)}</p>
            <p className="mt-1 text-sm text-muted-foreground">
              dari {maxScore} ({pct}%)
            </p>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-secondary">
              <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${pct}%` }} />
            </div>
          </div>

          {/* Ranking */}
          {myRank && (
            <div className="mb-6 flex items-center justify-center gap-2 rounded-lg bg-amber-50 px-4 py-3 text-sm font-medium text-amber-900 dark:bg-amber-900/20 dark:text-amber-200">
              <Trophy className="h-4 w-4" />
              Ranking #{myRank.rank} dari {myRank.total} peserta
            </div>
          )}

          {/* Per-subject breakdown */}
          <div className="mb-6">
            <h2 className="mb-3 text-sm font-semibold text-foreground">Per Mata Pelajaran</h2>
            <div className="space-y-2">
              {breakdownPerSubject.map((b) => {
                const subjectPct = Math.round((b.correct / b.total) * 100);
                return (
                  <div key={b.subject.id} className="rounded-lg border p-3">
                    <div className="mb-1 flex items-center justify-between text-sm">
                      <span className="font-medium text-foreground">
                        <span className="mr-2 font-mono text-xs text-primary">{b.subject.code}</span>
                        {b.subject.name}
                      </span>
                      <span className="font-semibold text-foreground">
                        {b.correct}/{b.total}
                      </span>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-secondary">
                      <div
                        className="h-full rounded-full bg-emerald-500"
                        style={{ width: `${subjectPct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setShowExplanations((v) => !v)}
            >
              {showExplanations ? "Sembunyikan Pembahasan" : "Lihat Pembahasan"}
            </Button>
            <Link to="/tryout/$eventId" params={{ eventId }} className="flex-1">
              <Button className="w-full">Coba Lagi</Button>
            </Link>
          </div>
        </div>

        {/* Explanations */}
        {showExplanations && fullQuestions && (
          <div className="mt-6 space-y-3">
            {subjects?.map((s) => {
              const sQs = fullQuestions.filter((q) => q.subject_id === s.id);
              if (sQs.length === 0) return null;
              return (
                <details key={s.id} className="rounded-xl border bg-card shadow-sm" open>
                  <summary className="cursor-pointer px-5 py-3 text-sm font-semibold text-foreground">
                    {s.code} — {s.name} ({sQs.length} soal)
                  </summary>
                  <div className="space-y-4 border-t px-5 py-4">
                    {sQs.map((q, i) => {
                      const userAnswer = answersById.get(q.id)?.selected_answer ?? null;
                      const isCorrect = userAnswer === q.correct_answer;
                      return (
                        <div key={q.id} className="border-b pb-4 last:border-0 last:pb-0">
                          <div className="mb-2 flex items-start gap-2">
                            {userAnswer ? (
                              isCorrect ? (
                                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                              ) : (
                                <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-600" />
                              )
                            ) : (
                              <span className="mt-0.5 inline-block h-4 w-4 shrink-0 rounded-full bg-muted" />
                            )}
                            <p className="text-sm font-semibold text-foreground">
                              Soal {i + 1}
                              <span className="ml-2 text-xs font-normal text-muted-foreground">
                                Jawabanmu:{" "}
                                <span className={isCorrect ? "text-emerald-600" : "text-red-600"}>
                                  {userAnswer ?? "—"}
                                </span>
                                {!isCorrect && (
                                  <>
                                    {" • "}Benar:{" "}
                                    <span className="text-emerald-600">{q.correct_answer}</span>
                                  </>
                                )}
                              </span>
                            </p>
                          </div>
                          <div className="ml-6 prose prose-sm max-w-none text-sm text-foreground">
                            <LatexText text={q.question_text} />
                          </div>
                          {q.explanation && (
                            <div className="ml-6 mt-2 rounded-lg bg-secondary/40 p-3 text-sm text-foreground">
                              <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                Pembahasan
                              </p>
                              <LatexText text={q.explanation} />
                              {q.explanation_image_url && (
                                <img
                                  src={q.explanation_image_url}
                                  alt="Pembahasan"
                                  className="mt-2 max-h-64 rounded border object-contain"
                                />
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </details>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
