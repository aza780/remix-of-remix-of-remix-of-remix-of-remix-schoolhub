import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import {
  fetchAllTryoutEvents,
  updateTryoutEvent,
  deleteTryoutEvent,
} from "@/lib/tryout-admin-queries";
import { Button } from "@/components/ui/button";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Plus, Pencil, Trash2, Eye, EyeOff } from "lucide-react";

export const Route = createFileRoute("/admin/tryouts/")({
  component: TryoutEventsAdminPage,
});

function TryoutEventsAdminPage() {
  const qc = useQueryClient();
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data: events = [], isLoading } = useQuery({
    queryKey: ["admin-tryout-events"],
    queryFn: fetchAllTryoutEvents,
  });

  const toggleMut = useMutation({
    mutationFn: ({ id, status }: { id: string; status: "draft" | "published" | "ended" }) =>
      updateTryoutEvent(id, { status }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-tryout-events"] });
      toast.success("Status diubah");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const deleteMut = useMutation({
    mutationFn: deleteTryoutEvent,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-tryout-events"] });
      toast.success("Event dihapus");
      setDeleteId(null);
    },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Event Tryout</h1>
        <Link to="/admin/tryouts/new">
          <Button><Plus className="mr-1 h-4 w-4" /> Buat Event</Button>
        </Link>
      </div>

      {isLoading ? (
        <div className="py-12 text-center text-muted-foreground">Memuat...</div>
      ) : events.length === 0 ? (
        <div className="py-12 text-center text-muted-foreground">Belum ada event tryout.</div>
      ) : (
        <div className="overflow-x-auto rounded-xl border bg-card">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-secondary/50">
                <th className="px-4 py-3 text-left font-medium">Judul</th>
                <th className="px-4 py-3 text-left font-medium hidden md:table-cell">Mulai</th>
                <th className="px-4 py-3 text-left font-medium hidden md:table-cell">Selesai</th>
                <th className="px-4 py-3 text-left font-medium">Status</th>
                <th className="px-4 py-3 text-right font-medium">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {events.map((e) => (
                <tr key={e.id} className="border-b last:border-0 hover:bg-secondary/30">
                  <td className="px-4 py-3 max-w-[300px]">
                    <div className="font-medium truncate">{e.title}</div>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell text-muted-foreground">
                    {new Date(e.start_date).toLocaleString("id-ID")}
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell text-muted-foreground">
                    {new Date(e.end_date).toLocaleString("id-ID")}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      e.status === "published" ? "bg-deadline-green text-deadline-green-foreground" :
                      e.status === "ended" ? "bg-secondary text-foreground" :
                      "bg-deadline-gray text-deadline-gray-foreground"
                    }`}>
                      {e.status === "published" ? "Published" : e.status === "ended" ? "Ended" : "Draft"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => toggleMut.mutate({
                          id: e.id,
                          status: e.status === "published" ? "draft" : "published",
                        })}
                        className="rounded-lg p-2 text-muted-foreground hover:bg-secondary hover:text-foreground"
                        title={e.status === "published" ? "Unpublish" : "Publish"}
                      >
                        {e.status === "published" ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                      <Link
                        to="/admin/tryouts/$id/edit"
                        params={{ id: e.id }}
                        className="rounded-lg p-2 text-muted-foreground hover:bg-secondary hover:text-foreground"
                      >
                        <Pencil className="h-4 w-4" />
                      </Link>
                      <button
                        onClick={() => setDeleteId(e.id)}
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

      <AlertDialog open={!!deleteId} onOpenChange={(o) => { if (!o) setDeleteId(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus event tryout?</AlertDialogTitle>
            <AlertDialogDescription>
              Semua sesi peserta dan tautan soal pada event ini akan dihapus. Tindakan ini tidak bisa dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteId && deleteMut.mutate(deleteId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
