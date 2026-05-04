import { getCategoryConfig, type Category } from "@/lib/getCategoryConfig";
import { MonthlyListItem } from "./MonthlyListItem";

interface MonthlyListPost {
  id: string;
  slug: string;
  title: string;
  category: string;
  open_date: string | null;
  deadline: string | null;
  announcement_date: string | null;
}

interface MonthlyListSectionProps {
  category: Category;
  posts: MonthlyListPost[];
  isLoading: boolean;
  monthLabel: string;
}

export function MonthlyListSection({ category, posts, isLoading, monthLabel }: MonthlyListSectionProps) {
  const config = getCategoryConfig(category);

  return (
    <section className="mb-6">
      <div className="mb-3 flex items-center gap-2">
        <span className={`inline-block h-2.5 w-2.5 rounded-full ${config.dotClass}`} />
        <h3 className="text-sm font-semibold text-foreground sm:text-base">
          {config.label} Bulan {monthLabel}
        </h3>
        {!isLoading && posts.length > 0 && (
          <span className="text-xs text-muted-foreground">({posts.length})</span>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="h-24 animate-pulse rounded-lg border bg-muted/30" />
          ))}
        </div>
      ) : posts.length === 0 ? (
        <div className="rounded-lg border border-dashed bg-muted/20 p-4 text-center">
          <p className="text-xs text-muted-foreground sm:text-sm">
            Tidak ada {config.label.toLowerCase()} di bulan ini
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {posts.map((post) => (
            <MonthlyListItem key={post.id} post={post} />
          ))}
        </div>
      )}
    </section>
  );
}
