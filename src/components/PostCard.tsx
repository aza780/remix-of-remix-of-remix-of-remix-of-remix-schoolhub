import { Link } from "@tanstack/react-router";
import { Calendar } from "lucide-react";
import type { Post } from "@/lib/supabase-queries";
import { getDeadlineStatus, formatDeadline } from "@/lib/helpers";
import { getPostStatus } from "@/lib/getPostStatus";
import { StatusBadge } from "@/components/StatusBadge";
import { BookmarkButton } from "@/components/BookmarkButton";

const deadlineClasses: Record<string, string> = {
  green: "bg-deadline-green text-deadline-green-foreground",
  yellow: "bg-deadline-yellow text-deadline-yellow-foreground",
  red: "bg-deadline-red text-deadline-red-foreground",
  gray: "bg-deadline-gray text-deadline-gray-foreground",
};

export function PostCard({ post }: { post: Post }) {
  const deadlineStatus = getDeadlineStatus(post.deadline);
  const postStatus = getPostStatus(post);

  return (
    <Link
      to="/posts/$slug"
      params={{ slug: post.slug }}
      className="group relative flex flex-col overflow-hidden rounded-xl border bg-card shadow-sm transition-all hover:shadow-md"
    >
      <div className="relative aspect-video overflow-hidden bg-secondary">
        {post.image_url ? (
          <img src={post.image_url} alt={post.title} className="h-full w-full object-cover transition-transform group-hover:scale-105" />
        ) : (
          <div className="flex h-full items-center justify-center text-muted-foreground">
            <Calendar className="h-10 w-10" />
          </div>
        )}
        <div className="absolute top-3 right-3 flex items-center gap-1.5">
          <BookmarkButton postId={post.id} />
          <StatusBadge status={postStatus} />
        </div>
      </div>
      <div className="flex flex-1 flex-col gap-2 p-4">
        <div className="flex items-center gap-2">
          <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
            post.category === "scholarship"
              ? "bg-primary/10 text-primary"
              : "bg-emerald/10 text-emerald"
          }`}>
            {post.category === "scholarship" ? "Beasiswa" : "Lomba"}
          </span>
          {post.deadline && (
            <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${deadlineClasses[deadlineStatus]}`}>
              {formatDeadline(post.deadline)}
            </span>
          )}
        </div>
        <h3 className="line-clamp-2 text-base font-semibold text-card-foreground group-hover:text-primary transition-colors">
          {post.title}
        </h3>
        {post.description && (
          <p className="line-clamp-3 text-sm text-muted-foreground">{post.description}</p>
        )}
        <span className="mt-auto pt-2 text-sm font-medium text-primary">
          Lihat Detail →
        </span>
      </div>
    </Link>
  );
}
