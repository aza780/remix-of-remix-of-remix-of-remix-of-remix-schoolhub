import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { zodValidator, fallback } from "@tanstack/zod-adapter";
import { z } from "zod";
import { useState } from "react";
import { toast } from "sonner";
import {
  fetchQuestionsPaged,
  deleteQuestion,
  fetchEventsUsingQuestion,
} from "@/lib/tryout-admin-queries";
import { fetchSubjects } from "@/lib/tryout-queries";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { LatexText } from "@/lib/latex";
import { Plus, Pencil, Trash2, Search } from "lucide-react";

const searchSchema = z.object({
  page: fallback(z.number().int().min(1), 1).default(1),
  subject: fallback(z.string(), "").default(""),
  difficulty: fallback(z.enum(["easy", "medium", "hard", ""]), "").default(""),
  search: fallback(z.string(), "").default(""),
});

export const Route = createFileRoute("/admin/questions/")({
  validateSearch: zodValidator(searchSchema),
  component: QuestionsAdminPage,
});

function QuestionsAdminPage() {
  const navigate = useNavigate({ from: "/admin/questions" });
  const { page, subject, difficulty, search } = Route.useSearch();
  const qc = useQueryClient();
  const [searchInput, setSearchInput] = useState(search);
  const [deleteState, setDeleteState] = useState<
    | { id: string; title: string; events: Array<{ id: string; title: string }> }
    | null
  >(null);

  const { data: subjects = [] } = useQuery({
    queryKey: ["subjects"],
    queryFn: fetchSubjects,
  });

  const { data, isLoading } = useQuery({
    queryKey: ["admin-questions", page, subject, difficulty, search],
    queryFn: () =>
      fetchQuestionsPaged({
        page,
        subjectId: subject || null,
        difficulty: (difficulty || null) as any,
        search: search || null,
      }),
  });

  const deleteMut = useMutation({
    mutationFn: deleteQuestion,
    onSuccess: () => {
      toast.success("Soal dihapus");
      qc.invalidateQueries({ queryKey: ["admin-questions"] });
      setDeleteState(null);
    },
    onError: (e: any) => toast.error(e.message),
  });

  const total = data?.total ?? 0;
  const pageSize = 20;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const update = (patch: Partial<typeof Route.types.fullSearchSchema>) =>
    navigate({ search: (prev) => ({ ...prev, ...patch, page: 1 }) });

  const tryDelete = async (id: string, title: string) => {
    const events = await fetchEventsUsingQuestion(id);
    setDeleteState({ id, title, events });
  };

  const subjectMap = new Map(subjects.map((s) => [s.id, s.name]));

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Bank Soal</h1>
        <Link to="/admin/questions/new">
          <Button><Plus className="mr-1 h-4 w-4" /> Tambah Soal</Button>
        </Link>
      </div>

      <div className="mb-4 flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") update({ search: searchInput }); }}
            onBlur={() => { if (searchInput !== search) update({ search: searchInput }); }}
            placeholder="Cari soal..."
            className="pl-8"
          />
        </div>
        <Select value={subject || "__all"} onValueChange={(v) => update({ subject: v === "__all" ? "" : v })}>
          <SelectTrigger className="w-[200px]"><SelectValue placeholder="Semua Mapel" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="__all">Semua Mapel</SelectItem>
            {subjects.map((s) => (
              <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={difficulty || "__all"} onValueChange={(v) => update({ difficulty: (v === "__all" ? "" : v) as any })}>
          <SelectTrigger className="w-[160px]"><SelectValue placeholder="Semua Kesulitan" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="__all">Semua Kesulitan</SelectItem>
            <SelectItem value="easy">Mudah</SelectItem>
            <SelectItem value="medium">Sedang</SelectItem>
            <SelectItem value="hard">Sulit</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="py-12 text-center text-muted-foreground">Memuat...</div>
      ) : !data?.rows.length ? (
        <div className="py-12 text-center text-muted-foreground">
          Belum ada soal. Tambahkan soal pertama!
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border bg-card">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-secondary/50">
                <th className="px-4 py-3 text-left font-medium">Soal</th>
                <th className="px-4 py-3 text-left font-medium hidden md:table-cell">Mapel</th>
                <th className="px-4 py-3 text-left font-medium hidden sm:table-cell">Kesulitan</th>
                <th className="px-4 py-3 text-left font-medium">Jawaban</th>
                <th className="px-4 py-3 text-right font-medium">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {data.rows.map((q) => (
                <tr key={q.id} className="border-b last:border-0 hover:bg-secondary/30">
                  <td className="px-4 py-3 max-w-[400px]">
                    <div className="line-clamp-2 text-sm">
                      <LatexText text={q.question_text} />
                    </div>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell text-muted-foreground">
                    {subjectMap.get(q.subject_id) ?? "—"}
                  </td>
                  <td className="px-4 py-3 hidden sm:table-cell">
                    <span className="rounded-full bg-secondary px-2 py-0.5 text-xs">
                      {q.difficulty === "easy" ? "Mudah" : q.difficulty === "hard" ? "Sulit" : "Sedang"}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-semibold">{q.correct_answer}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <Link
                        to="/admin/questions/$id/edit"
                        params={{ id: q.id }}
                        className="rounded-lg p-2 text-muted-foreground hover:bg-secondary hover:text-foreground"
                      >
                        <Pencil className="h-4 w-4" />
                      </Link>
                      <button
                        onClick={() => tryDelete(q.id, q.question_text.slice(0, 60))}
                        className="rounded-lg p-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between">
          <span className="text-sm text-muted-foreground">
            Halaman {page} dari {totalPages} · {total} soal
          </span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => navigate({ search: (p) => ({ ...p, page: page - 1 }) })}
            >
              Sebelumnya
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => navigate({ search: (p) => ({ ...p, page: page + 1 }) })}
            >
              Selanjutnya
            </Button>
          </div>
        </div>
      )}

      <AlertDialog open={!!deleteState} onOpenChange={(o) => { if (!o) setDeleteState(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {deleteState?.events.length ? "Tidak bisa menghapus soal" : "Hapus soal?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {deleteState?.events.length ? (
                <>
                  Soal ini dipakai di event berikut:
                  <ul className="mt-2 list-disc pl-5">
                    {deleteState.events.map((e) => (
                      <li key={e.id}>{e.title}</li>
                    ))}
                  </ul>
                  <span className="block mt-2">Lepas soal dari event-event tersebut sebelum menghapus.</span>
                </>
              ) : (
                "Tindakan ini tidak bisa dibatalkan."
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            {!deleteState?.events.length && (
              <AlertDialogAction
                onClick={() => deleteState && deleteMut.mutate(deleteState.id)}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Hapus
              </AlertDialogAction>
            )}
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
