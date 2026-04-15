import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { User, Bookmark, LogOut } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { useAuth } from "@/hooks/use-auth";
import { useBookmarkedPosts } from "@/hooks/useBookmarks";
import { useLogout } from "@/hooks/useLogout";
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
  const logout = useLogout();

  if (!loading && !user) {
    navigate({ to: "/login" });
    return null;
  }

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

  const email = user?.email ?? "";

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="mx-auto max-w-4xl px-4 py-8">
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
          <button
            onClick={() => setActiveTab("disimpan")}
            className={`flex flex-1 items-center justify-center gap-2 rounded-md px-4 py-2.5 text-sm font-medium transition-colors ${
              activeTab === "disimpan"
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Bookmark className="h-4 w-4" />
            Disimpan
          </button>
        </div>

        {activeTab === "profil" ? (
          <ProfilTab email={email} onLogout={logout} />
        ) : (
          <DisimpanTab />
        )}
      </div>
    </div>
  );
}

function ProfilTab({ email, onLogout }: { email: string; onLogout: () => Promise<void> }) {
  return (
    <div className="rounded-xl border bg-card p-6">
      <div className="flex items-center gap-4">
        <UserAvatar email={email} size="md" />
        <div>
          <p className="text-sm text-muted-foreground">Email</p>
          <p className="font-medium text-foreground">{email}</p>
        </div>
      </div>
      <div className="mt-6 border-t pt-6">
        <Button variant="destructive" onClick={onLogout} className="gap-2">
          <LogOut className="h-4 w-4" />
          Keluar
        </Button>
      </div>
    </div>
  );
}

function DisimpanTab() {
  const { data: bookmarks, isLoading } = useBookmarkedPosts();

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <PostCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (!bookmarks || bookmarks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border bg-card py-16 text-center">
        <Bookmark className="mb-4 h-12 w-12 text-muted-foreground/40" />
        <h3 className="text-lg font-semibold text-muted-foreground">Belum ada yang disimpan</h3>
        <p className="mt-1 text-sm text-muted-foreground/70">
          Simpan beasiswa atau lomba yang menarik agar mudah ditemukan kembali.
        </p>
        <Link to="/" className="mt-4">
          <Button variant="outline">Jelajahi Postingan</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {bookmarks.map((b) => (
        <PostCard key={b.id} post={b.post as unknown as Post} />
      ))}
    </div>
  );
}
