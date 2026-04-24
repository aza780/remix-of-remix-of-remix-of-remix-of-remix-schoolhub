import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { TryoutEventForm } from "@/components/admin/TryoutEventForm";
import { createTryoutEvent } from "@/lib/tryout-admin-queries";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/admin/tryouts/new")({
  component: NewTryoutEventPage,
});

function NewTryoutEventPage() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { user } = useAuth();

  const mutation = useMutation({
    mutationFn: (data: any) => createTryoutEvent({ ...data, created_by: user?.id ?? null }),
    onSuccess: (ev) => {
      qc.invalidateQueries({ queryKey: ["admin-tryout-events"] });
      toast.success("Event dibuat. Sekarang tambahkan soalnya.");
      navigate({ to: "/admin/tryouts/$id/edit", params: { id: ev.id } });
    },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Buat Event Tryout</h1>
      <TryoutEventForm onSubmit={(d) => mutation.mutate(d)} loading={mutation.isPending} />
    </div>
  );
}
