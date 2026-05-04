export type PostStatus = "upcoming" | "active" | "closed";

export function getPostStatus(post: { open_date?: string | null; deadline?: string | null }): PostStatus {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const open = post.open_date ? new Date(post.open_date) : null;
  const close = post.deadline ? new Date(post.deadline) : null;

  if (close && today > close) return "closed";
  if (open && today < open) return "upcoming";
  return "active";
}
