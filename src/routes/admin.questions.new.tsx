import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
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

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Tambah Soal Baru</h1>
      {isLoading ? (
        <div className="text-muted-foreground">Memuat mapel...</div>
      ) : (
        <QuestionForm
          subjects={subjects}
          showSaveAndNew
          onSubmit={async (data, mode) => {
            try {
              await createQuestion({ ...(data as any), created_by: user?.id ?? null });
              qc.invalidateQueries({ queryKey: ["admin-questions"] });
              toast.success("Soal berhasil dibuat!");
              if (mode !== "save_and_new") navigate({ to: "/admin/questions" });
            } catch (e: any) {
              toast.error(e.message);
            }
          }}
        />
      )}
    </div>
  );
}
