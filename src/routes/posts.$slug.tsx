import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, ExternalLink, Calendar } from "lucide-react";
import { fetchPostBySlug } from "@/lib/supabase-queries";
import { getDeadlineStatus, formatDeadline } from "@/lib/helpers";
import { getPostStatus } from "@/lib/getPostStatus";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Navbar } from "@/components/Navbar";

export const Route = createFileRoute("/posts/$slug")({
  component: PostDetailPage,
});

const deadlineClasses: Record<string, string> = {
  green: "bg-deadline-green text-deadline-green-foreground",
  yellow: "bg-deadline-yellow text-deadline-yellow-foreground",
  red: "bg-deadline-red text-deadline-red-foreground",
  gray: "bg-deadline-gray text-deadline-gray-foreground",
};

function PostDetailPage() {
  const { slug } = Route.useParams();
  const { data: post, isLoading, error } = useQuery({
    queryKey: ["post", slug],
    queryFn: () => fetchPostBySlug(slug),
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="mx-auto max-w-3xl px-4 py-8">
          <Skeleton className="mb-6 h-8 w-32" />
          <Skeleton className="aspect-video w-full rounded-xl" />
          <Skeleton className="mt-6 h-10 w-3/4" />
          <Skeleton className="mt-4 h-4 w-full" />
          <Skeleton className="mt-2 h-4 w-2/3" />
        </div>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <h2 className="text-xl font-semibold">Post tidak ditemukan</h2>
          <Link to="/" className="mt-4 text-primary hover:underline">Kembali ke Beranda</Link>
        </div>
      </div>
    );
  }

  const deadlineStatus = getDeadlineStatus(post.deadline);
  const postStatus = getPostStatus(post);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <article className="mx-auto max-w-3xl px-4 py-8">
        <Link to="/" className="mb-6 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-4 w-4" /> Kembali
        </Link>

        {post.image_url && (
          <div className="relative mb-8 overflow-hidden rounded-xl">
            <img src={post.image_url} alt={post.title} className="w-full object-cover" style={{ maxHeight: 400 }} />
            <StatusBadge status={postStatus} className="absolute top-3 right-3" />
          </div>
        )}

        {!post.image_url && (
          <div className="mb-4 flex justify-end">
            <StatusBadge status={postStatus} />
          </div>
        )}

        <div className="mb-4 flex flex-wrap items-center gap-2">
          <span className={`rounded-full px-3 py-1 text-xs font-medium ${
            post.category === "scholarship" ? "bg-primary/10 text-primary" : "bg-emerald/10 text-emerald"
          }`}>
            {post.category === "scholarship" ? "Beasiswa" : "Lomba"}
          </span>
          {post.deadline && (
            <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium ${deadlineClasses[deadlineStatus]}`}>
              <Calendar className="h-3 w-3" />
              {formatDeadline(post.deadline)}
            </span>
          )}
        </div>

        <h1 className="text-2xl font-bold text-foreground md:text-3xl">{post.title}</h1>

        {post.description && (
          <p className="mt-4 text-muted-foreground leading-relaxed">{post.description}</p>
        )}

        {post.content && (
          <div className="prose mt-8 max-w-none text-foreground" dangerouslySetInnerHTML={{ __html: post.content }} />
        )}

        {post.link && (
          <div className="mt-8">
            <a href={post.link} target="_blank" rel="noopener noreferrer">
              <Button size="lg" className="gap-2">
                Kunjungi Situs Resmi <ExternalLink className="h-4 w-4" />
              </Button>
            </a>
          </div>
        )}
      </article>
    </div>
  );
}
