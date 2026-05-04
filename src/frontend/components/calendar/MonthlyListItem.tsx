import { useNavigate } from "@tanstack/react-router";
import { BookmarkButton } from "@/components/BookmarkButton";
import { formatDateID } from "@/lib/formatDate";

interface MonthlyListItemPost {
  id: string;
  slug: string;
  title: string;
  open_date: string | null;
  deadline: string | null;
  announcement_date: string | null;
}

export function MonthlyListItem({ post }: { post: MonthlyListItemPost }) {
  const navigate = useNavigate();

  return (
    <div
      onClick={() => navigate({ to: "/posts/$slug", params: { slug: post.slug } })}
      className="group flex cursor-pointer items-start gap-3 rounded-lg border bg-card p-3 transition-all hover:border-primary/40 hover:shadow-sm"
    >
      <div className="min-w-0 flex-1">
        <h4 className="line-clamp-2 text-sm font-semibold text-card-foreground group-hover:text-primary">
          {post.title}
        </h4>
        <div className="mt-2 space-y-0.5 text-xs">
          {post.open_date && (
            <div className="flex gap-2">
              <span className="w-20 shrink-0 text-muted-foreground">Mulai:</span>
              <span className="font-medium text-foreground">{formatDateID(post.open_date)}</span>
            </div>
          )}
          {post.deadline && (
            <div className="flex gap-2">
              <span className="w-20 shrink-0 text-muted-foreground">Deadline:</span>
              <span className="font-medium text-foreground">{formatDateID(post.deadline)}</span>
            </div>
          )}
          {post.announcement_date && (
            <div className="flex gap-2">
              <span className="w-20 shrink-0 text-muted-foreground">Pengumuman:</span>
              <span className="font-medium text-foreground">{formatDateID(post.announcement_date)}</span>
            </div>
          )}
        </div>
      </div>
      <div onClick={(e) => e.stopPropagation()}>
        <BookmarkButton postId={post.id} variant="list" />
      </div>
    </div>
  );
}
