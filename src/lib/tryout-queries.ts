import { supabase } from "@/integrations/supabase/client";
import {
  ANSWER_OPTIONS,
  SCORE_PER_CORRECT,
  type AnswerOption,
  type Question,
  type Subject,
  type SubjectTimer,
  type TryoutAnswer,
  type TryoutEvent,
  type TryoutSession,
} from "@/lib/tryout-types";

// ────────────────────────────────────────────────────────────────────────────
// Subjects
// ────────────────────────────────────────────────────────────────────────────
export async function fetchSubjects(): Promise<Subject[]> {
  const { data, error } = await supabase
    .from("subjects")
    .select("*")
    .order("order_index", { ascending: true });
  if (error) throw error;
  return (data ?? []) as Subject[];
}

// ────────────────────────────────────────────────────────────────────────────
// Tryout events
// ────────────────────────────────────────────────────────────────────────────
export async function fetchTryoutEvents(): Promise<TryoutEvent[]> {
  const { data, error } = await supabase
    .from("tryout_events")
    .select("*")
    .eq("status", "published")
    .order("start_date", { ascending: false });
  if (error) throw error;
  return (data ?? []) as TryoutEvent[];
}

export async function fetchTryoutEvent(eventId: string): Promise<TryoutEvent | null> {
  const { data, error } = await supabase
    .from("tryout_events")
    .select("*")
    .eq("id", eventId)
    .maybeSingle();
  if (error) throw error;
  return data as TryoutEvent | null;
}

export async function fetchEventSubjectsWithCounts(eventId: string): Promise<
  Array<Subject & { question_count: number }>
> {
  const subjects = await fetchSubjects();
  const { data: links, error } = await supabase
    .from("tryout_event_questions")
    .select("subject_id")
    .eq("event_id", eventId);
  if (error) throw error;

  const counts = new Map<string, number>();
  for (const row of links ?? []) {
    counts.set(row.subject_id, (counts.get(row.subject_id) ?? 0) + 1);
  }
  return subjects
    .map((s) => ({ ...s, question_count: counts.get(s.id) ?? 0 }))
    .filter((s) => s.question_count > 0);
}

// ────────────────────────────────────────────────────────────────────────────
// Questions for the exam (sanitized — no correct_answer/explanation)
// ────────────────────────────────────────────────────────────────────────────
export async function fetchEventQuestionsForSubject(
  eventId: string,
  subjectId: string
): Promise<Question[]> {
  const { data, error } = await supabase
    .from("tryout_event_questions")
    .select(
      `order_index, question:questions(
        id, subject_id, question_text, image_url,
        option_a, option_b, option_c, option_d, option_e,
        difficulty
      )`
    )
    .eq("event_id", eventId)
    .eq("subject_id", subjectId)
    .order("order_index", { ascending: true });
  if (error) throw error;
  return ((data ?? [])
    .map((row: { question: Question | null }) => row.question)
    .filter(Boolean) as Question[]);
}

// Full questions (including correct_answer + explanation) — only call AFTER submit
export async function fetchEventQuestionsFull(
  eventId: string
): Promise<Array<Question & { correct_answer: AnswerOption }>> {
  const { data, error } = await supabase
    .from("tryout_event_questions")
    .select(
      `order_index, subject_id, question:questions(*)`
    )
    .eq("event_id", eventId)
    .order("order_index", { ascending: true });
  if (error) throw error;
  return ((data ?? [])
    .map((row: { question: (Question & { correct_answer: AnswerOption }) | null }) =>
      row.question
    )
    .filter(Boolean) as Array<Question & { correct_answer: AnswerOption }>);
}

// ────────────────────────────────────────────────────────────────────────────
// Sessions
// ────────────────────────────────────────────────────────────────────────────
export async function createSession(eventId: string, userId: string): Promise<TryoutSession> {
  const { data, error } = await supabase
    .from("tryout_sessions")
    .insert({ event_id: eventId, user_id: userId, status: "in_progress" })
    .select("*")
    .single();
  if (error) throw error;
  return data as TryoutSession;
}

export async function fetchActiveSession(
  eventId: string,
  userId: string
): Promise<TryoutSession | null> {
  const { data, error } = await supabase
    .from("tryout_sessions")
    .select("*")
    .eq("event_id", eventId)
    .eq("user_id", userId)
    .eq("status", "in_progress")
    .order("started_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data as TryoutSession | null;
}

export async function fetchSession(sessionId: string): Promise<TryoutSession | null> {
  const { data, error } = await supabase
    .from("tryout_sessions")
    .select("*")
    .eq("id", sessionId)
    .maybeSingle();
  if (error) throw error;
  return data as TryoutSession | null;
}

export async function updateSessionCurrentSubject(
  sessionId: string,
  subjectId: string
): Promise<void> {
  const { error } = await supabase
    .from("tryout_sessions")
    .update({ current_subject_id: subjectId })
    .eq("id", sessionId);
  if (error) throw error;
}

// ────────────────────────────────────────────────────────────────────────────
// Subject timers (server-controlled via expires_at)
// ────────────────────────────────────────────────────────────────────────────
export async function getOrCreateTimer(
  sessionId: string,
  subject: Subject
): Promise<SubjectTimer> {
  const { data: existing, error: selErr } = await supabase
    .from("tryout_subject_timers")
    .select("*")
    .eq("session_id", sessionId)
    .eq("subject_id", subject.id)
    .maybeSingle();
  if (selErr) throw selErr;
  if (existing) return existing as SubjectTimer;

  const expiresAt = new Date(Date.now() + subject.duration_minutes * 60_000).toISOString();
  const { data, error } = await supabase
    .from("tryout_subject_timers")
    .insert({
      session_id: sessionId,
      subject_id: subject.id,
      expires_at: expiresAt,
    })
    .select("*")
    .single();
  if (error) throw error;
  return data as SubjectTimer;
}

export async function markTimerSubmitted(timerId: string): Promise<void> {
  const { error } = await supabase
    .from("tryout_subject_timers")
    .update({ submitted_at: new Date().toISOString() })
    .eq("id", timerId);
  if (error) throw error;
}

export async function fetchSessionTimers(sessionId: string): Promise<SubjectTimer[]> {
  const { data, error } = await supabase
    .from("tryout_subject_timers")
    .select("*")
    .eq("session_id", sessionId);
  if (error) throw error;
  return (data ?? []) as SubjectTimer[];
}

// ────────────────────────────────────────────────────────────────────────────
// Answers
// ────────────────────────────────────────────────────────────────────────────
export async function fetchSessionAnswers(sessionId: string): Promise<TryoutAnswer[]> {
  const { data, error } = await supabase
    .from("tryout_answers")
    .select("*")
    .eq("session_id", sessionId);
  if (error) throw error;
  return (data ?? []) as TryoutAnswer[];
}

export async function upsertAnswer(input: {
  sessionId: string;
  questionId: string;
  subjectId: string;
  selectedAnswer: AnswerOption | null;
}): Promise<void> {
  const { error } = await supabase.from("tryout_answers").upsert(
    {
      session_id: input.sessionId,
      question_id: input.questionId,
      subject_id: input.subjectId,
      selected_answer: input.selectedAnswer,
      is_correct: null, // computed at submit
    },
    { onConflict: "session_id,question_id" }
  );
  if (error) throw error;
}

// ────────────────────────────────────────────────────────────────────────────
// Submit subject — grade only that subject's answers
// ────────────────────────────────────────────────────────────────────────────
export async function submitSubject(input: {
  sessionId: string;
  subjectId: string;
}): Promise<void> {
  // Pull this subject's questions with correct_answer
  const { data: qs, error: qErr } = await supabase
    .from("questions")
    .select("id, correct_answer")
    .eq("subject_id", input.subjectId);
  if (qErr) throw qErr;

  const correctMap = new Map<string, string>();
  for (const q of qs ?? []) correctMap.set(q.id, q.correct_answer);

  // Pull existing answers for this session+subject
  const { data: answers, error: aErr } = await supabase
    .from("tryout_answers")
    .select("id, question_id, selected_answer")
    .eq("session_id", input.sessionId)
    .eq("subject_id", input.subjectId);
  if (aErr) throw aErr;

  // Update each answer's is_correct (one update per answer for safety)
  for (const a of answers ?? []) {
    const correct = correctMap.get(a.question_id);
    const isCorrect = !!a.selected_answer && a.selected_answer === correct;
    const { error } = await supabase
      .from("tryout_answers")
      .update({ is_correct: isCorrect })
      .eq("id", a.id);
    if (error) throw error;
  }

  // Mark timer submitted
  const { data: timer } = await supabase
    .from("tryout_subject_timers")
    .select("id")
    .eq("session_id", input.sessionId)
    .eq("subject_id", input.subjectId)
    .maybeSingle();
  if (timer?.id) await markTimerSubmitted(timer.id);
}

// ────────────────────────────────────────────────────────────────────────────
// Submit whole session — compute total score
// ────────────────────────────────────────────────────────────────────────────
export async function submitSession(sessionId: string): Promise<TryoutSession> {
  const { data: answers, error } = await supabase
    .from("tryout_answers")
    .select("is_correct")
    .eq("session_id", sessionId);
  if (error) throw error;

  const correctCount = (answers ?? []).filter((a) => a.is_correct === true).length;
  const totalScore = correctCount * SCORE_PER_CORRECT;

  const { data, error: updErr } = await supabase
    .from("tryout_sessions")
    .update({
      status: "submitted",
      submitted_at: new Date().toISOString(),
      total_score: totalScore,
    })
    .eq("id", sessionId)
    .select("*")
    .single();
  if (updErr) throw updErr;
  return data as TryoutSession;
}

// ────────────────────────────────────────────────────────────────────────────
// Ranking
// ────────────────────────────────────────────────────────────────────────────
export async function fetchEventRanking(
  eventId: string
): Promise<Array<Pick<TryoutSession, "id" | "user_id" | "total_score" | "submitted_at">>> {
  const { data, error } = await supabase
    .from("tryout_sessions")
    .select("id, user_id, total_score, submitted_at")
    .eq("event_id", eventId)
    .eq("status", "submitted")
    .order("total_score", { ascending: false });
  if (error) throw error;
  return (data ?? []) as Array<
    Pick<TryoutSession, "id" | "user_id" | "total_score" | "submitted_at">
  >;
}

// Helper used by exam page to validate selectedAnswer values
export function isValidAnswerOption(v: string | null | undefined): v is AnswerOption {
  return !!v && (ANSWER_OPTIONS as string[]).includes(v);
}
