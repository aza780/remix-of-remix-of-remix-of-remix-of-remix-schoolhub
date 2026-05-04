import { supabase } from "@/integrations/supabase/client";
import type { Question, TryoutEvent } from "@/lib/tryout-types";

export type QuestionInsert = Omit<Question, "id"> & {
  correct_answer: "A" | "B" | "C" | "D" | "E";
  created_by?: string | null;
};

export type Difficulty = "easy" | "medium" | "hard";

// ── Questions ──────────────────────────────────────────────────────────────
export async function fetchQuestionsPaged(params: {
  subjectId?: string | null;
  difficulty?: Difficulty | null;
  search?: string | null;
  page: number;
  pageSize?: number;
}): Promise<{ rows: Question[]; total: number }> {
  const pageSize = params.pageSize ?? 20;
  const from = (params.page - 1) * pageSize;
  const to = from + pageSize - 1;

  let q = supabase
    .from("questions")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(from, to);

  if (params.subjectId) q = q.eq("subject_id", params.subjectId);
  if (params.difficulty) q = q.eq("difficulty", params.difficulty);
  if (params.search && params.search.trim()) {
    q = q.ilike("question_text", `%${params.search.trim()}%`);
  }

  const { data, count, error } = await q;
  if (error) throw error;
  return { rows: (data ?? []) as Question[], total: count ?? 0 };
}

export async function fetchQuestion(id: string): Promise<Question | null> {
  const { data, error } = await supabase
    .from("questions")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data as Question | null;
}

export async function createQuestion(input: QuestionInsert): Promise<Question> {
  const { data, error } = await supabase
    .from("questions")
    .insert(input as any)
    .select("*")
    .single();
  if (error) throw error;
  return data as Question;
}

export async function updateQuestion(
  id: string,
  input: Partial<QuestionInsert>
): Promise<Question> {
  const { data, error } = await supabase
    .from("questions")
    .update(input as any)
    .eq("id", id)
    .select("*")
    .single();
  if (error) throw error;
  return data as Question;
}

export async function deleteQuestion(id: string): Promise<void> {
  const { error } = await supabase.from("questions").delete().eq("id", id);
  if (error) throw error;
}

export async function fetchEventsUsingQuestion(questionId: string): Promise<
  Array<{ id: string; title: string }>
> {
  const { data, error } = await supabase
    .from("tryout_event_questions")
    .select("event_id, tryout_events:event_id(id, title)")
    .eq("question_id", questionId);
  if (error) throw error;
  const seen = new Set<string>();
  const out: Array<{ id: string; title: string }> = [];
  for (const row of (data ?? []) as any[]) {
    const ev = row.tryout_events;
    if (ev && !seen.has(ev.id)) {
      seen.add(ev.id);
      out.push({ id: ev.id, title: ev.title });
    }
  }
  return out;
}

// ── Image upload ───────────────────────────────────────────────────────────
export async function uploadQuestionImage(
  file: File,
  kind: "question" | "explanation"
): Promise<string> {
  const ext = file.name.split(".").pop() ?? "png";
  const path = `${kind}/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage
    .from("question-images")
    .upload(path, file, { cacheControl: "3600", upsert: false });
  if (error) throw error;
  const { data } = supabase.storage.from("question-images").getPublicUrl(path);
  return data.publicUrl;
}

// ── Tryout events (admin) ──────────────────────────────────────────────────
export async function fetchAllTryoutEvents(): Promise<TryoutEvent[]> {
  const { data, error } = await supabase
    .from("tryout_events")
    .select("*")
    .order("start_date", { ascending: false });
  if (error) throw error;
  return (data ?? []) as TryoutEvent[];
}

export type TryoutEventInsert = {
  title: string;
  description: string | null;
  start_date: string;
  end_date: string;
  status: "draft" | "published" | "ended";
  created_by?: string | null;
};

export async function createTryoutEvent(
  input: TryoutEventInsert
): Promise<TryoutEvent> {
  const { data, error } = await supabase
    .from("tryout_events")
    .insert(input as any)
    .select("*")
    .single();
  if (error) throw error;
  return data as TryoutEvent;
}

export async function updateTryoutEvent(
  id: string,
  input: Partial<TryoutEventInsert>
): Promise<TryoutEvent> {
  const { data, error } = await supabase
    .from("tryout_events")
    .update(input as any)
    .eq("id", id)
    .select("*")
    .single();
  if (error) throw error;
  return data as TryoutEvent;
}

export async function deleteTryoutEvent(id: string): Promise<void> {
  // Manually clean dependents (no FK cascade defined in schema)
  await supabase.from("tryout_event_questions").delete().eq("event_id", id);
  await supabase.from("tryout_sessions").delete().eq("event_id", id);
  const { error } = await supabase.from("tryout_events").delete().eq("id", id);
  if (error) throw error;
}

// ── Event ↔ Question links ─────────────────────────────────────────────────
export type EventQuestionRow = {
  id: string;
  event_id: string;
  question_id: string;
  subject_id: string;
  order_index: number;
  question: Question;
};

export async function fetchEventQuestionLinks(
  eventId: string
): Promise<EventQuestionRow[]> {
  const { data, error } = await supabase
    .from("tryout_event_questions")
    .select(
      `id, event_id, question_id, subject_id, order_index, question:questions(*)`
    )
    .eq("event_id", eventId)
    .order("subject_id", { ascending: true })
    .order("order_index", { ascending: true });
  if (error) throw error;
  return (data ?? []).filter((r: any) => r.question) as EventQuestionRow[];
}

export async function addQuestionsToEvent(
  eventId: string,
  subjectId: string,
  questionIds: string[]
): Promise<void> {
  if (!questionIds.length) return;
  // find current max order_index for this subject in the event
  const { data: existing, error: e1 } = await supabase
    .from("tryout_event_questions")
    .select("order_index")
    .eq("event_id", eventId)
    .eq("subject_id", subjectId)
    .order("order_index", { ascending: false })
    .limit(1);
  if (e1) throw e1;
  let next = (existing?.[0]?.order_index ?? -1) + 1;
  const rows = questionIds.map((qid) => ({
    event_id: eventId,
    subject_id: subjectId,
    question_id: qid,
    order_index: next++,
  }));
  const { error } = await supabase
    .from("tryout_event_questions")
    .insert(rows as any);
  if (error) throw error;
}

export async function removeEventQuestion(linkId: string): Promise<void> {
  const { error } = await supabase
    .from("tryout_event_questions")
    .delete()
    .eq("id", linkId);
  if (error) throw error;
}

export async function reorderEventQuestion(
  linkId: string,
  direction: "up" | "down"
): Promise<void> {
  // Fetch current
  const { data: cur, error: e1 } = await supabase
    .from("tryout_event_questions")
    .select("id, event_id, subject_id, order_index")
    .eq("id", linkId)
    .single();
  if (e1) throw e1;

  // Find neighbor in same subject
  const op = direction === "up" ? "lt" : "gt";
  const ord = direction === "up" ? false : true; // up: highest below; down: lowest above
  const { data: neighbor, error: e2 } = await supabase
    .from("tryout_event_questions")
    .select("id, order_index")
    .eq("event_id", cur.event_id)
    .eq("subject_id", cur.subject_id)
    [op]("order_index", cur.order_index)
    .order("order_index", { ascending: ord })
    .limit(1)
    .maybeSingle();
  if (e2) throw e2;
  if (!neighbor) return;

  // Swap via temporary high value to avoid unique conflicts (none here, but safe)
  await supabase
    .from("tryout_event_questions")
    .update({ order_index: -1 })
    .eq("id", cur.id);
  await supabase
    .from("tryout_event_questions")
    .update({ order_index: cur.order_index })
    .eq("id", neighbor.id);
  await supabase
    .from("tryout_event_questions")
    .update({ order_index: neighbor.order_index })
    .eq("id", cur.id);
}

export async function searchQuestionsForPicker(params: {
  subjectId: string;
  search?: string;
  excludeIds?: string[];
  limit?: number;
}): Promise<Question[]> {
  const limit = params.limit ?? 50;
  let q = supabase
    .from("questions")
    .select("*")
    .eq("subject_id", params.subjectId)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (params.search && params.search.trim()) {
    q = q.ilike("question_text", `%${params.search.trim()}%`);
  }
  if (params.excludeIds && params.excludeIds.length) {
    q = q.not("id", "in", `(${params.excludeIds.join(",")})`);
  }
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []) as Question[];
}
