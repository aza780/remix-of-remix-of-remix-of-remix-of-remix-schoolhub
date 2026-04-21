import { createFileRoute, Link, redirect, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { ArrowLeft, ArrowRight, CheckCircle2 } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { SubjectNav } from "@/components/tryout/SubjectNav";
import { SubjectTimer } from "@/components/tryout/SubjectTimer";
import { QuestionDisplay } from "@/components/tryout/QuestionDisplay";
import { AnswerGrid } from "@/components/tryout/AnswerGrid";
import { useSubjectTimer } from "@/hooks/useSubjectTimer";
import { supabase } from "@/integrations/supabase/client";
import {
  fetchEventQuestionsForSubject,
  fetchEventSubjectsWithCounts,
  fetchSession,
  fetchSessionAnswers,
  fetchSessionTimers,
  fetchTryoutEvent,
  isValidAnswerOption,
  submitSession,
  submitSubject,
  updateSessionCurrentSubject,
  upsertAnswer,
} from "@/lib/tryout-queries";
import type { AnswerOption } from "@/lib/tryout-types";

type ExamSearch = { sessionId: string };

export const Route = createFileRoute("/tryout/$eventId/exam")({
  validateSearch: (search: Record<string, unknown>): ExamSearch => ({
    sessionId: String(search.sessionId ?? ""),
  }),
  beforeLoad: async ({ search }) => {
    if (typeof window === "undefined") return;
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      throw redirect({ to: "/login" });
    }
    if (!search.sessionId) {
      throw redirect({ to: "/tryout" });
    }
  },
  component: TryoutExamPage,
});

function TryoutExamPage() {
  const { eventId } = Route.useParams();
  const { sessionId } = Route.useSearch();
  const navigate = useNavigate();
  const qc = useQueryClient();

  const [currentSubjectId, setCurrentSubjectId] = useState<string | null>(null);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, AnswerOption>>({});
  const [submittedSubjectIds, setSubmittedSubjectIds] = useState<Set<string>>(new Set());
  const [submitting, setSubmitting] = useState(false);
  const submittingRef = useRef(false);

  const { data: event } = useQuery({
    queryKey: ["tryout-event", eventId],
    queryFn: () => fetchTryoutEvent(eventId),
  });

  const { data: subjects } = useQuery({
    queryKey: ["tryout-event-subjects", eventId],
    queryFn: () => fetchEventSubjectsWithCounts(eventId),
  });

  const { data: session } = useQuery({
    queryKey: ["tryout-session", sessionId],
    queryFn: () => fetchSession(sessionId),
  });

  // Initial: hydrate answers + submitted subjects
  useEffect(() => {
    (async () => {
      try {
        const [allAnswers, timers] = await Promise.all([
          fetchSessionAnswers(sessionId),
          fetchSessionTimers(sessionId),
        ]);
        const map: Record<string, AnswerOption> = {};
        for (const a of allAnswers) {
          if (isValidAnswerOption(a.selected_answer)) {
            map[a.question_id] = a.selected_answer;
          }
        }
        setAnswers(map);
        setSubmittedSubjectIds(new Set(timers.filter((t) => t.submitted_at).map((t) => t.subject_id)));
      } catch (err) {
        console.error(err);
      }
    })();
  }, [sessionId]);

  // Pick initial subject when subjects load
  useEffect(() => {
    if (currentSubjectId || !subjects || subjects.length === 0) return;
    // Prefer session.current_subject_id if not yet submitted
    const pref = session?.current_subject_id ?? null;
    const next = subjects.find((s) => !submittedSubjectIds.has(s.id) && (pref ? s.id === pref : true))
      ?? subjects.find((s) => !submittedSubjectIds.has(s.id));
    if (next) {
      setCurrentSubjectId(next.id);
      setQuestionIndex(0);
    } else {
      // All subjects submitted — finalize
      void finalizeWholeSession();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subjects, session, submittedSubjectIds]);

  const currentSubject = useMemo(
    () => subjects?.find((s) => s.id === currentSubjectId) ?? null,
    [subjects, currentSubjectId]
  );

  const { data: questions } = useQuery({
    queryKey: ["tryout-questions", eventId, currentSubjectId],
    queryFn: () => fetchEventQuestionsForSubject(eventId, currentSubjectId!),
    enabled: !!currentSubjectId,
  });

  // Persist current subject to session
  useEffect(() => {
    if (!currentSubjectId) return;
    void updateSessionCurrentSubject(sessionId, currentSubjectId);
  }, [currentSubjectId, sessionId]);

  const finalizeWholeSession = useCallback(async () => {
    if (submittingRef.current) return;
    submittingRef.current = true;
    try {
      const finalSession = await submitSession(sessionId);
      navigate({
        to: "/tryout/$eventId/result/$sessionId",
        params: { eventId, sessionId: finalSession.id },
      });
    } catch (err) {
      console.error(err);
      toast.error("Gagal menyelesaikan tryout");
      submittingRef.current = false;
    }
  }, [eventId, sessionId, navigate]);

  const handleSubmitSubject = useCallback(async () => {
    if (!currentSubject || submitting) return;
    setSubmitting(true);
    try {
      await submitSubject({ sessionId, subjectId: currentSubject.id });
      const newSubmitted = new Set(submittedSubjectIds);
      newSubmitted.add(currentSubject.id);
      setSubmittedSubjectIds(newSubmitted);
      qc.invalidateQueries({ queryKey: ["tryout-session", sessionId] });

      // Find next subject
      const nextSubject = subjects?.find((s) => !newSubmitted.has(s.id));
      if (nextSubject) {
        setCurrentSubjectId(nextSubject.id);
        setQuestionIndex(0);
        toast.success(`${currentSubject.code} tersubmit. Lanjut ke ${nextSubject.code}.`);
      } else {
        toast.success("Semua mata pelajaran selesai. Menghitung skor…");
        await finalizeWholeSession();
      }
    } catch (err) {
      console.error(err);
      toast.error("Gagal submit mata pelajaran");
    } finally {
      setSubmitting(false);
    }
  }, [currentSubject, submitting, sessionId, submittedSubjectIds, subjects, qc, finalizeWholeSession]);

  // Timer expires → auto-submit current subject
  const onTimerExpire = useCallback(() => {
    if (submitting || !currentSubject) return;
    if (submittedSubjectIds.has(currentSubject.id)) return;
    toast.warning(`Waktu ${currentSubject.code} habis. Auto-submit.`);
    void handleSubmitSubject();
  }, [submitting, currentSubject, submittedSubjectIds, handleSubmitSubject]);

  const { secondsLeft } = useSubjectTimer(sessionId, currentSubject, onTimerExpire);

  const handleSelectAnswer = async (option: AnswerOption) => {
    if (!questions || !currentSubjectId) return;
    const q = questions[questionIndex];
    if (!q) return;
    setAnswers((prev) => ({ ...prev, [q.id]: option }));
    try {
      await upsertAnswer({
        sessionId,
        questionId: q.id,
        subjectId: currentSubjectId,
        selectedAnswer: option,
      });
    } catch (err) {
      console.error(err);
      toast.error("Gagal menyimpan jawaban");
    }
  };

  const answeredIndices = useMemo(() => {
    const set = new Set<number>();
    if (!questions) return set;
    questions.forEach((q, i) => {
      if (answers[q.id]) set.add(i);
    });
    return set;
  }, [questions, answers]);

  if (!event || !subjects || subjects.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="mx-auto max-w-4xl px-4 py-8">
          <div className="h-64 animate-pulse rounded-xl bg-muted" />
        </div>
      </div>
    );
  }

  const currentQuestion = questions?.[questionIndex];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="mx-auto max-w-6xl px-4 py-6">
        {/* Top bar */}
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-base font-semibold text-foreground sm:text-lg">{event.title}</h1>
          <SubjectNav
            subjects={subjects}
            currentSubjectId={currentSubjectId}
            submittedSubjectIds={submittedSubjectIds}
            onSelect={(id) => {
              if (submittedSubjectIds.has(id)) return;
              setCurrentSubjectId(id);
              setQuestionIndex(0);
            }}
          />
        </div>

        <div className="grid gap-4 lg:grid-cols-[1fr_280px]">
          {/* Question column */}
          <div className="rounded-xl border bg-card p-5 shadow-sm">
            {!questions ? (
              <div className="h-72 animate-pulse rounded-lg bg-muted" />
            ) : questions.length === 0 ? (
              <p className="py-12 text-center text-muted-foreground">
                Tidak ada soal di mata pelajaran ini.
              </p>
            ) : currentQuestion ? (
              <>
                <QuestionDisplay
                  question={currentQuestion}
                  questionNumber={questionIndex + 1}
                  totalQuestions={questions.length}
                  selectedAnswer={answers[currentQuestion.id] ?? null}
                  onSelect={handleSelectAnswer}
                />
                <div className="mt-6 flex items-center justify-between">
                  <Button
                    variant="outline"
                    onClick={() => setQuestionIndex((i) => Math.max(0, i - 1))}
                    disabled={questionIndex === 0}
                  >
                    <ArrowLeft className="mr-1 h-4 w-4" /> Sebelumnya
                  </Button>
                  <Button
                    onClick={() => setQuestionIndex((i) => Math.min(questions.length - 1, i + 1))}
                    disabled={questionIndex >= questions.length - 1}
                  >
                    Lanjut <ArrowRight className="ml-1 h-4 w-4" />
                  </Button>
                </div>
              </>
            ) : null}
          </div>

          {/* Side panel */}
          <div className="space-y-4">
            <div className="rounded-xl border bg-card p-4 shadow-sm">
              <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Sisa Waktu
              </p>
              <SubjectTimer secondsLeft={secondsLeft} />
              {currentSubject && (
                <p className="mt-2 text-xs text-muted-foreground">{currentSubject.name}</p>
              )}
            </div>

            <div className="rounded-xl border bg-card p-4 shadow-sm">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Navigasi Soal
              </p>
              {questions ? (
                <AnswerGrid
                  total={questions.length}
                  currentIndex={questionIndex}
                  answeredIndices={answeredIndices}
                  onJump={setQuestionIndex}
                />
              ) : (
                <div className="h-20 animate-pulse rounded bg-muted" />
              )}
              <Button
                className="mt-4 w-full"
                variant="default"
                onClick={handleSubmitSubject}
                disabled={submitting}
              >
                <CheckCircle2 className="mr-1 h-4 w-4" />
                {submitting ? "Menyimpan…" : "Submit Mata Pelajaran"}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
