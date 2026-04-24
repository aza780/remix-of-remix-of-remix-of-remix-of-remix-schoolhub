import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { QuestionForm } from "@/components/admin/QuestionForm";
import { fetchSubjects } from "@/lib/tryout-queries";
import { createQuestion } from "@/lib/tryout-admin-queries";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/admin/questions/new")({
  component: NewQuestionPage,
});

function NewQuestionPage() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { user } = useAuth();
  const { data: subjects = [], isLoading } = useQuery({
    queryKey: ["subjects"],
    queryFn: fetchSubjects,
  });

  const mutation = useMutation({
    mutationFn: (data: any) => createQuestion({ ...data, created_by: user?.id ?? null }),
    onSuccess: (_q, _v, ctx: any) => {
      qc.invalidateQueries({ queryKey: ["admin-questions"] });
      toast.success("Soal berhasil dibuat!");
      if (ctx?.mode !== "save_and_new") navigate({ to: "/admin/questions" });
    },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Tambah Soal Baru</h1>
      {isLoading ? (
        <div className="text-muted-foreground">Memuat mapel...</div>
      ) : (
        <QuestionForm
          subjects={subjects}
          loading={mutation.isPending}
          showSaveAndNew
          onSubmit={(data, mode) =>
            mutation.mutate(data, { onSuccess: () => {
              qc.invalidateQueries({ queryKey: ["admin-questions"] });
              toast.success("Soal berhasil dibuat!");
              if (mode !== "save_and_new") navigate({ to: "/admin/questions" });
            }} as any)
          }
        />
      )}
    </div>
  );
}
