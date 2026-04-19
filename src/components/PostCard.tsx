import { Link } from "@tanstack/react-router";
import { Calendar, Clock, Megaphone } from "lucide-react";
import type { Post } from "@/lib/supabase-queries";
import { getPostStatus } from "@/lib/getPostStatus";
import { getCategoryConfig } from "@/lib/getCategoryConfig";
import { formatDateID } from "@/lib/formatDate";
import { StatusBadge } from "@/components/StatusBadge";
import { BookmarkButton } from "@/components/BookmarkButton";

type DateTone = "open" | "deadline" | "announcement";

function DateRow({
  icon: Icon,
  label,
  date,
  tone = "open",
}: {
  icon: React.ElementType;
  label: string;
  date: string | null;
  tone?: DateTone;
}) {
  if (!date) return null;

  const toneClass =
    tone === "deadline"
      ? "text-red-600 dark:text-red-400"
      : tone === "announcement"
        ? "text-emerald-600 dark:text-emerald-400"
        : "text-blue-600 dark:text-blue-400";

  const valueClass =
    tone === "deadline"
      ? "text-red-600 dark:text-red-400 font-semibold"
      : "text-foreground font-medium";

  return (
    <div className="flex items-center gap-2 text-xs">
      <Icon className={`h-3.5 w-3.5 shrink-0 ${toneClass}`} />
      <span className={`w-20 shrink-0 ${toneClass}`}>{label}</span>
      <span className={valueClass}>{formatDateID(date)}</span>
    </div>
  );
}

export function PostCard({ post }: { post: Post }) {
  const postStatus = getPostStatus(post);
  const categoryConfig = getCategoryConfig(post.category);
  const hasAnyDate = post.open_date || post.deadline || post.announcement_date;

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
          <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${categoryConfig.pillClass}`}>
            {categoryConfig.label}
          </span>
        </div>
        <h3 className="line-clamp-2 text-base font-semibold text-card-foreground group-hover:text-primary transition-colors">
          {post.title}
        </h3>
        {post.description && (
          <p className="line-clamp-3 text-sm text-muted-foreground">{post.description}</p>
        )}
        {hasAnyDate && (
          <div className="mt-2 space-y-1.5 border-t pt-3">
            <DateRow icon={Calendar} label="Buka" date={post.open_date} tone="open" />
            <DateRow icon={Clock} label="Tutup" date={post.deadline} tone="deadline" />
            <DateRow icon={Megaphone} label="Pengumuman" date={post.announcement_date} tone="announcement" />
          </div>
        )}
        <span className="mt-auto pt-2 text-sm font-medium text-primary">
          Lihat Detail →
        </span>
      </div>
    </Link>
  );
}
