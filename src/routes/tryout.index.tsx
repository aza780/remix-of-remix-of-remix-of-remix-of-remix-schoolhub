import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Navbar } from "@/components/Navbar";
import { TryoutEventCard } from "@/components/tryout/TryoutEventCard";
import { fetchTryoutEvents } from "@/lib/tryout-queries";
import { FileText } from "lucide-react";

export const Route = createFileRoute("/tryout/")({
  head: () => ({
    meta: [
      { title: "Tryout SNBT — Agenda Prestasi" },
      { name: "description", content: "Latihan tryout SNBT online dengan soal terkini." },
    ],
  }),
  component: TryoutListPage,
});

function TryoutListPage() {
  const { data: events, isLoading, isError } = useQuery({
    queryKey: ["tryout-events"],
    queryFn: fetchTryoutEvents,
  });

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="mx-auto max-w-4xl px-4 py-8">
        <div className="mb-6 flex items-center gap-3">
          <div className="rounded-lg bg-primary/10 p-2.5">
            <FileText className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Tryout SNBT</h1>
            <p className="text-sm text-muted-foreground">
              Latihan soal SNBT dengan timer per mata pelajaran.
            </p>
          </div>
        </div>

        {isLoading && (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-32 animate-pulse rounded-xl bg-muted" />
            ))}
          </div>
        )}

        {isError && (
          <div className="rounded-xl border bg-card p-8 text-center text-muted-foreground">
            Gagal memuat daftar tryout.
          </div>
        )}

        {!isLoading && events && events.length === 0 && (
          <div className="rounded-xl border bg-card p-10 text-center">
            <p className="text-muted-foreground">Belum ada tryout yang tersedia.</p>
            <Link to="/" className="mt-4 inline-block text-sm font-medium text-primary hover:underline">
              ← Kembali ke Beranda
            </Link>
          </div>
        )}

        {events && events.length > 0 && (
          <div className="grid gap-4">
            {events.map((e) => (
              <TryoutEventCard key={e.id} event={e} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
