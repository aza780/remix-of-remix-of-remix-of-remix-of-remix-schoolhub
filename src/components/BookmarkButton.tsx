import { Bookmark } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import { useAuth } from "@/hooks/use-auth";
import { useBookmarkedIds, useToggleBookmark } from "@/hooks/useBookmarks";

export function BookmarkButton({ postId }: { postId: string }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { data: bookmarkedIds } = useBookmarkedIds();
  const toggleBookmark = useToggleBookmark();

  const isBookmarked = bookmarkedIds?.has(postId) ?? false;

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!user) {
      navigate({ to: "/login" });
      return;
    }

    toggleBookmark.mutate({ postId, isBookmarked });
  };

  return (
    <button
      onClick={handleClick}
      className={`rounded-full p-1.5 backdrop-blur-sm transition-all ${
        isBookmarked
          ? "bg-primary text-primary-foreground"
          : "bg-background/70 text-muted-foreground hover:text-primary hover:bg-background/90"
      }`}
      aria-label={isBookmarked ? "Hapus bookmark" : "Simpan bookmark"}
    >
      <Bookmark className={`h-4 w-4 ${isBookmarked ? "fill-current" : ""}`} />
    </button>
  );
}
