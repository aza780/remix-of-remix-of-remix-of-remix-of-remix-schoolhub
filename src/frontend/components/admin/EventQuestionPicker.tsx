import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchEventQuestionLinks,
  searchQuestionsForPicker,
  addQuestionsToEvent,
  removeEventQuestion,
  reorderEventQuestion,
} from "@/lib/tryout-admin-queries";
import type { Subject } from "@/lib/tryout-types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { LatexText } from "@/lib/latex";
import { ChevronUp, ChevronDown, X, Plus, Search } from "lucide-react";
import { toast } from "sonner";

export function EventQuestionPicker({
  eventId,
  subjects,
}: {
  eventId: string;
  subjects: Subject[];
}) {
  const qc = useQueryClient();
  const { data: links = [], isLoading } = useQuery({
    queryKey: ["event-questions", eventId],
    queryFn: () => fetchEventQuestionLinks(eventId),
  });

  const [pickerSubject, setPickerSubject] = useState<Subject | null>(null);

  const removeMut = useMutation({
    mutationFn: removeEventQuestion,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["event-questions", eventId] }),
    onError: (e: any) => toast.error(e.message),
  });

  const reorderMut = useMutation({
    mutationFn: ({ id, dir }: { id: string; dir: "up" | "down" }) =>
      reorderEventQuestion(id, dir),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["event-questions", eventId] }),
    onError: (e: any) => toast.error(e.message),
  });

  if (isLoading) {
    return <div className="text-sm text-muted-foreground">Memuat soal...</div>;
  }

  const grouped = new Map<string, typeof links>();
  for (const l of links) {
    if (!grouped.has(l.subject_id)) grouped.set(l.subject_id, [] as any);
    grouped.get(l.subject_id)!.push(l);
  }

  return (
    <div className="rounded-xl border bg-card p-6 shadow-sm">
      <h2 className="mb-4 text-lg font-semibold">Soal di Event</h2>
      <Accordion type="multiple" defaultValue={subjects.map((s) => s.id)}>
        {subjects.map((s) => {
          const list = grouped.get(s.id) ?? [];
          return (
            <AccordionItem key={s.id} value={s.id}>
              <AccordionTrigger>
                <span>
                  {s.name}{" "}
                  <span className="text-muted-foreground text-sm">({list.length} soal)</span>
                </span>
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-2">
                  {list.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Belum ada soal.</p>
                  ) : (
                    list.map((row, idx) => (
                      <div
                        key={row.id}
                        className="flex items-start gap-2 rounded-lg border p-3"
                      >
                        <div className="flex flex-col gap-1">
                          <button
                            disabled={idx === 0 || reorderMut.isPending}
                            onClick={() => reorderMut.mutate({ id: row.id, dir: "up" })}
                            className="rounded p-1 hover:bg-secondary disabled:opacity-30"
                          >
                            <ChevronUp className="h-4 w-4" />
                          </button>
                          <button
                            disabled={idx === list.length - 1 || reorderMut.isPending}
                            onClick={() => reorderMut.mutate({ id: row.id, dir: "down" })}
                            className="rounded p-1 hover:bg-secondary disabled:opacity-30"
                          >
                            <ChevronDown className="h-4 w-4" />
                          </button>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-xs text-muted-foreground mb-1">
                            #{idx + 1} · {row.question.difficulty ?? "medium"}
                          </div>
                          <div className="text-sm line-clamp-2">
                            <LatexText text={row.question.question_text} />
                          </div>
                        </div>
                        <button
                          onClick={() => removeMut.mutate(row.id)}
                          className="rounded p-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                          title="Lepas soal"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ))
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPickerSubject(s)}
                  >
                    <Plus className="mr-1 h-4 w-4" /> Tambah Soal
                  </Button>
                </div>
              </AccordionContent>
            </AccordionItem>
          );
        })}
      </Accordion>

      {pickerSubject && (
        <PickerDialog
          eventId={eventId}
          subject={pickerSubject}
          excludeIds={links.filter((l) => l.subject_id === pickerSubject.id).map((l) => l.question_id)}
          onClose={() => setPickerSubject(null)}
        />
      )}
    </div>
  );
}

function PickerDialog({
  eventId,
  subject,
  excludeIds,
  onClose,
}: {
  eventId: string;
  subject: Subject;
  excludeIds: string[];
  onClose: () => void;
}) {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const { data: questions = [], isLoading } = useQuery({
    queryKey: ["picker", subject.id, search, excludeIds.length],
    queryFn: () =>
      searchQuestionsForPicker({
        subjectId: subject.id,
        search,
        excludeIds,
      }),
  });

  const addMut = useMutation({
    mutationFn: () =>
      addQuestionsToEvent(eventId, subject.id, Array.from(selected)),
    onSuccess: () => {
      toast.success(`${selected.size} soal ditambahkan`);
      qc.invalidateQueries({ queryKey: ["event-questions", eventId] });
      onClose();
    },
    onError: (e: any) => toast.error(e.message),
  });

  const toggle = (id: string) => {
    const n = new Set(selected);
    if (n.has(id)) n.delete(id);
    else n.add(id);
    setSelected(n);
  };

  return (
    <Dialog open onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Pilih Soal — {subject.name}</DialogTitle>
        </DialogHeader>

        <div className="relative">
          <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari soal..."
            className="pl-8"
          />
        </div>

        <div className="flex-1 overflow-y-auto space-y-2 -mx-2 px-2">
          {isLoading ? (
            <p className="text-sm text-muted-foreground py-4">Memuat...</p>
          ) : questions.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4">Tidak ada soal tersedia.</p>
          ) : (
            questions.map((q) => (
              <label
                key={q.id}
                className="flex items-start gap-3 rounded-lg border p-3 cursor-pointer hover:bg-secondary/30"
              >
                <Checkbox
                  checked={selected.has(q.id)}
                  onCheckedChange={() => toggle(q.id)}
                  className="mt-0.5"
                />
                <div className="flex-1 min-w-0">
                  <div className="text-xs text-muted-foreground mb-1">
                    {q.difficulty ?? "medium"}
                  </div>
                  <div className="text-sm line-clamp-2">
                    <LatexText text={q.question_text} />
                  </div>
                </div>
              </label>
            ))
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Batal</Button>
          <Button
            disabled={selected.size === 0 || addMut.isPending}
            onClick={() => addMut.mutate()}
          >
            Tambahkan ({selected.size})
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
