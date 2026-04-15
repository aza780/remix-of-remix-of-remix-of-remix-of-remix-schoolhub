export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function getDeadlineStatus(deadline: string | null): "green" | "yellow" | "red" | "gray" {
  if (!deadline) return "gray";
  const now = new Date();
  const dl = new Date(deadline);
  const diffDays = Math.ceil((dl.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays < 0) return "gray";
  if (diffDays <= 7) return "red";
  if (diffDays <= 30) return "yellow";
  return "green";
}

export function formatDeadline(deadline: string | null): string {
  if (!deadline) return "Tidak ada deadline";
  const dl = new Date(deadline);
  const now = new Date();
  const diffDays = Math.ceil((dl.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays < 0) return "Sudah lewat";
  if (diffDays === 0) return "Hari ini";
  if (diffDays === 1) return "Besok";
  return dl.toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
}
