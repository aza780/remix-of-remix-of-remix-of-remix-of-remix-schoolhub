import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { ArrowLeft, BookOpen, Calendar, Clock, LogIn, Play } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import {
  createSession,
  fetchActiveSession,
  fetchEventSubjectsWithCounts,
  fetchTryoutEvent,
} from "@/lib/tryout-queries";
import { getEventStatus } from "@/lib/tryout-types";
import { formatDateID } from "@/lib/formatDate";

export const Route = createFileRoute("/tryout/$eventId")({
  head: () => ({
    meta: [
      { title: "Detail Tryout — Agenda Prestasi" },
      { name: "description", content: "Detail event tryout SNBT." },
    ],
  }),
  component: TryoutDetailPage,
});

function TryoutDetailPage() {
  const { eventId } = Route.useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [starting, setStarting] = useState(false);

  const { data: event, isLoading } = useQuery({
    queryKey: ["tryout-event", eventId],
    queryFn: () => fetchTryoutEvent(eventId),
  });

  const { data: subjects } = useQuery({
    queryKey: ["tryout-event-subjects", eventId],
    queryFn: () => fetchEventSubjectsWithCounts(eventId),
  });

  const totalQuestions = (subjects ?? []).reduce((s, x) => s + x.question_count, 0);
  const status = event ? getEventStatus(event) : null;
  const isActive = status === "active";

  const handleStart = async () => {
    if (!user) return;
    setStarting(true);
    try {
      // Reuse existing in-progress session if any
      const existing = await fetchActiveSession(eventId, user.id);
      const session = existing ?? (await createSession(eventId, user.id));
      navigate({
        to: "/tryout/$eventId/exam",
        params: { eventId },
        search: { sessionId: session.id },
      });
    } catch (err) {
      console.error(err);
      toast.error("Gagal memulai tryout");
    } finally {
      setStarting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="mx-auto max-w-3xl px-4 py-8">
          <div className="h-64 animate-pulse rounded-xl bg-muted" />
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="mx-auto max-w-3xl px-4 py-12 text-center">
          <p className="text-muted-foreground">Event tryout tidak ditemukan.</p>
          <Link to="/tryout" className="mt-4 inline-block text-sm font-medium text-primary hover:underline">
            ← Kembali
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="mx-auto max-w-3xl px-4 py-8">
        <Link to="/tryout" className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Semua Tryout
        </Link>

        <div className="rounded-xl border bg-card p-6 shadow-sm">
          <h1 className="mb-2 text-2xl font-bold text-foreground">{event.title}</h1>

          <div className="mb-4 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              {formatDateID(event.start_date.slice(0, 10))} — {formatDateID(event.end_date.slice(0, 10))}
            </span>
            <span className="flex items-center gap-1">
              <BookOpen className="h-4 w-4" />
              {subjects?.length ?? 0} mata pelajaran • {totalQuestions} soal
            </span>
          </div>

          {event.description && (
            <p className="mb-6 text-sm text-foreground/80">{event.description}</p>
          )}

          {subjects && subjects.length > 0 && (
            <div className="mb-6">
              <h2 className="mb-2 text-sm font-semibold text-foreground">Mata Pelajaran</h2>
              <div className="overflow-hidden rounded-lg border">
                <table className="w-full text-sm">
                  <tbody>
                    {subjects.map((s) => (
                      <tr key={s.id} className="border-b last:border-0">
                        <td className="w-16 px-3 py-2 font-mono text-xs font-semibold text-primary">{s.code}</td>
                        <td className="px-3 py-2 text-foreground">{s.name}</td>
                        <td className="px-3 py-2 text-right text-xs text-muted-foreground">
                          {s.question_count} soal
                        </td>
                        <td className="w-20 px-3 py-2 text-right text-xs text-muted-foreground">
                          <span className="inline-flex items-center gap-1">
                            <Clock className="h-3 w-3" /> {s.duration_minutes}m
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <div className="mb-6 rounded-lg bg-secondary/40 p-4 text-sm text-foreground">
            <p className="mb-1 font-semibold">Peraturan</p>
            <ul className="list-inside list-disc space-y-0.5 text-muted-foreground">
              <li>Setiap mata pelajaran memiliki timer terpisah.</li>
              <li>Jawaban tersimpan otomatis saat dipilih.</li>
              <li>Refresh halaman tidak akan mereset timer.</li>
              <li>Skor SNBT: benar +4, salah/kosong 0.</li>
            </ul>
          </div>

          {!user && (
            <Link to="/login">
              <Button className="w-full" size="lg">
                <LogIn className="mr-2 h-4 w-4" />
                Login untuk Mengerjakan
              </Button>
            </Link>
          )}

          {user && !isActive && (
            <Button className="w-full" size="lg" disabled>
              {status === "upcoming" ? "Belum Tersedia" : "Tryout Telah Berakhir"}
            </Button>
          )}

          {user && isActive && totalQuestions > 0 && (
            <Button className="w-full" size="lg" onClick={handleStart} disabled={starting}>
              <Play className="mr-2 h-4 w-4" />
              {starting ? "Memulai…" : "Mulai Tryout"}
            </Button>
          )}

          {user && isActive && totalQuestions === 0 && (
            <Button className="w-full" size="lg" disabled>
              Soal Belum Tersedia
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
