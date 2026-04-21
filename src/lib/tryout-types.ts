// Domain types for the Tryout SNBT feature.
// Note: correct_answer & explanation* are only sent to client AFTER session is submitted.

export type Subject = {
  id: string;
  code: string;
  name: string;
  duration_minutes: number;
  order_index: number;
};

export type Question = {
  id: string;
  subject_id: string;
  question_text: string;
  image_url: string | null;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  option_e: string;
  // Only present after the session is submitted
  correct_answer?: "A" | "B" | "C" | "D" | "E";
  explanation?: string | null;
  explanation_image_url?: string | null;
  difficulty?: "easy" | "medium" | "hard";
};

export type TryoutEvent = {
  id: string;
  title: string;
  description: string | null;
  start_date: string;
  end_date: string;
  status: "draft" | "published" | "ended";
  created_at: string;
};

export type TryoutSession = {
  id: string;
  user_id: string;
  event_id: string;
  current_subject_id: string | null;
  started_at: string;
  submitted_at: string | null;
  total_score: number | null;
  status: "in_progress" | "submitted";
};

export type TryoutAnswer = {
  id: string;
  session_id: string;
  question_id: string;
  subject_id: string;
  selected_answer: "A" | "B" | "C" | "D" | "E" | null;
  is_correct: boolean | null;
};

export type SubjectTimer = {
  id: string;
  session_id: string;
  subject_id: string;
  started_at: string;
  expires_at: string;
  submitted_at: string | null;
};

export type AnswerOption = "A" | "B" | "C" | "D" | "E";
export const ANSWER_OPTIONS: AnswerOption[] = ["A", "B", "C", "D", "E"];

// SNBT scoring: correct = +4, wrong = 0, blank = 0
export const SCORE_PER_CORRECT = 4;

export function getEventStatus(
  event: Pick<TryoutEvent, "start_date" | "end_date" | "status">
): "upcoming" | "active" | "ended" | "draft" {
  if (event.status === "draft") return "draft";
  const now = Date.now();
  const start = new Date(event.start_date).getTime();
  const end = new Date(event.end_date).getTime();
  if (now < start) return "upcoming";
  if (now > end) return "ended";
  return "active";
}
