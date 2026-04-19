import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { User, Bookmark, Mail, ExternalLink } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { useAuth } from "@/hooks/use-auth";
import { useBookmarkedPosts } from "@/hooks/useBookmarks";
import { PostCard } from "@/components/PostCard";
import { PostCardSkeleton } from "@/components/PostCardSkeleton";
import { UserAvatar } from "@/components/ui/UserAvatar";
import { Button } from "@/components/ui/button";
import type { Post } from "@/lib/supabase-queries";

export const Route = createFileRoute("/profile")({
  component: ProfilePage,
});

function ProfilePage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<"profil" | "disimpan">("profil");

  // Wait for auth to finish before deciding to redirect
  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="mx-auto max-w-4xl px-4 py-12">
          <PostCardSkeleton />
        </div>
      </div>
    );
  }

  if (!user) {
    navigate({ to: "/login" });
    return null;
  }

  const email = user?.email ?? "";
  const createdAt = user?.created_at
    ? new Intl.DateTimeFormat("id-ID", { month: "long", year: "numeric" }).format(new Date(user.created_at))
    : "-";

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="mx-auto max-w-4xl px-4 py-8">
        {/* Header */}
        <div className="mb-8 flex items-center gap-4">
          <UserAvatar email={email} size="md" />
          <div>
            <p className="font-semibold text-foreground">{email}</p>
            <p className="text-sm text-muted-foreground">Bergabung sejak {createdAt}</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-8 flex gap-1 rounded-lg border bg-card p-1">
          <button
            onClick={() => setActiveTab("profil")}
            className={`flex flex-1 items-center justify-center gap-2 rounded-md px-4 py-2.5 text-sm font-medium transition-colors ${
              activeTab === "profil"
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <User className="h-4 w-4" />
            Profil
          </button>
          <DisimpanTabButton active={activeTab === "disimpan"} onClick={() => setActiveTab("disimpan")} />
        </div>

        {activeTab === "profil" ? (
          <ProfilTab email={email} createdAt={createdAt} />
        ) : (
          <DisimpanTab />
        )}
      </div>
    </div>
  );
}

function DisimpanTabButton({ active, onClick }: { active: boolean; onClick: () => void }) {
  const { data: bookmarks } = useBookmarkedPosts();
  const posts = bookmarks?.map((b) => b.post).filter(Boolean) ?? [];

  return (
    <button
      onClick={onClick}
      className={`flex flex-1 items-center justify-center gap-2 rounded-md px-4 py-2.5 text-sm font-medium transition-colors ${
        active
          ? "bg-primary text-primary-foreground shadow-sm"
          : "text-muted-foreground hover:text-foreground"
      }`}
    >
      <Bookmark className="h-4 w-4" />
      Disimpan
      {posts.length > 0 && (
        <span className={`ml-1 rounded-full px-2 py-0.5 text-xs font-semibold ${
          active ? "bg-primary-foreground/20 text-primary-foreground" : "bg-primary/10 text-primary"
        }`}>
          {posts.length}
        </span>
      )}
    </button>
  );
}

function ProfilTab({ email, createdAt }: { email: string; createdAt: string }) {
  return (
    <div className="rounded-xl border bg-card p-6">
      <h3 className="mb-4 text-base font-semibold text-foreground">Informasi Akun</h3>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Email</span>
          <span className="text-sm font-medium text-foreground">{email}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Bergabung</span>
          <span className="text-sm font-medium text-foreground">{createdAt}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Status</span>
          <span className="text-sm font-medium text-foreground">Pengguna Aktif</span>
        </div>
      </div>
    </div>
  );
}

function DisimpanTab() {
  const { data: bookmarks, isLoading } = useBookmarkedPosts();

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <PostCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  const posts = bookmarks?.map((b) => b.post).filter(Boolean) ?? [];

  if (posts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border bg-card py-16 text-center">
        <Bookmark className="mb-4 h-12 w-12 text-muted-foreground/30" />
        <h3 className="text-lg font-semibold text-muted-foreground">Belum ada yang disimpan</h3>
        <p className="mt-1 max-w-xs text-sm text-muted-foreground/70">
          Temukan beasiswa dan lomba menarik untuk disimpan
        </p>
        <Link to="/" className="mt-6">
          <Button variant="outline" className="gap-1">
            Jelajahi Sekarang →
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {posts.map((p) => (
        <PostCard key={(p as Post).id} post={p as Post} />
      ))}
    </div>
  );
}
