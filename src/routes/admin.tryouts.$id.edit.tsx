import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { TryoutEventForm } from "@/components/admin/TryoutEventForm";
import { EventQuestionPicker } from "@/components/admin/EventQuestionPicker";
import { updateTryoutEvent } from "@/lib/tryout-admin-queries";
import { fetchTryoutEvent, fetchSubjects } from "@/lib/tryout-queries";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/admin/tryouts/$id/edit")({
  component: EditTryoutEventPage,
});

// Need an admin-aware fetch: fetchTryoutEvent already returns any status via maybeSingle on tryout_events
async function fetchEventForAdmin(id: string) {
  const { data, error } = await supabase
    .from("tryout_events")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data;
}

function EditTryoutEventPage() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();

  const { data: event, isLoading } = useQuery({
    queryKey: ["tryout-event", id],
    queryFn: () => fetchEventForAdmin(id),
  });
  const { data: subjects = [] } = useQuery({
    queryKey: ["subjects"],
    queryFn: fetchSubjects,
  });

  const mutation = useMutation({
    mutationFn: (data: any) => updateTryoutEvent(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-tryout-events"] });
      qc.invalidateQueries({ queryKey: ["tryout-event", id] });
      toast.success("Event diperbarui!");
    },
    onError: (e: any) => toast.error(e.message),
  });

  if (isLoading) return <div className="text-muted-foreground">Memuat...</div>;
  if (!event) return <div>Event tidak ditemukan.</div>;

  return (
    <div className="space-y-8">
      <div>
        <button
          onClick={() => navigate({ to: "/admin/tryouts" })}
          className="mb-2 text-sm text-muted-foreground hover:text-foreground"
        >
          ← Kembali
        </button>
        <h1 className="text-2xl font-bold">Edit Event Tryout</h1>
      </div>
      <TryoutEventForm
        initial={event as any}
        loading={mutation.isPending}
        onSubmit={(d) => mutation.mutate(d)}
      />
      <EventQuestionPicker eventId={id} subjects={subjects} />
    </div>
  );
}
