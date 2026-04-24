import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { QuestionForm } from "@/components/admin/QuestionForm";
import { fetchSubjects } from "@/lib/tryout-queries";
import { fetchQuestion, updateQuestion } from "@/lib/tryout-admin-queries";

export const Route = createFileRoute("/admin/questions/$id/edit")({
  component: EditQuestionPage,
});

function EditQuestionPage() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();

  const { data: subjects = [] } = useQuery({
    queryKey: ["subjects"],
    queryFn: fetchSubjects,
  });
  const { data: question, isLoading } = useQuery({
    queryKey: ["question", id],
    queryFn: () => fetchQuestion(id),
  });

  const mutation = useMutation({
    mutationFn: (data: any) => updateQuestion(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-questions"] });
      qc.invalidateQueries({ queryKey: ["question", id] });
      toast.success("Soal diperbarui!");
      navigate({ to: "/admin/questions" });
    },
    onError: (e: any) => toast.error(e.message),
  });

  if (isLoading) return <div className="text-muted-foreground">Memuat...</div>;
  if (!question) return <div>Soal tidak ditemukan.</div>;

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Edit Soal</h1>
      <QuestionForm
        subjects={subjects}
        initial={question}
        loading={mutation.isPending}
        onSubmit={(data) => mutation.mutate(data)}
      />
    </div>
  );
}
