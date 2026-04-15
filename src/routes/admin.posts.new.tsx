import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { PostForm } from "@/components/PostForm";
import { createPost, type PostInsert } from "@/lib/supabase-queries";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/admin/posts/new")({
  component: NewPostPage,
});

function NewPostPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const mutation = useMutation({
    mutationFn: (data: PostInsert) => createPost({ ...data, author_id: user?.id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-posts"] });
      toast.success("Post berhasil dibuat!");
      navigate({ to: "/admin" });
    },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Buat Post Baru</h1>
      <PostForm onSubmit={(data) => mutation.mutate(data)} loading={mutation.isPending} />
    </div>
  );
}
