import type { UserRole } from "@/hooks/useUserRole";

export const can = {
  accessAdmin: (role: UserRole) =>
    role === "admin" || role === "super_admin",

  editPost: (role: UserRole, authorId: string | null, currentUserId: string) =>
    role === "super_admin" || (role === "admin" && authorId === currentUserId),

  deletePost: (role: UserRole, authorId: string | null, currentUserId: string) =>
    role === "super_admin" || (role === "admin" && authorId === currentUserId),

  publishPost: (role: UserRole, authorId: string | null, currentUserId: string) =>
    role === "super_admin" || (role === "admin" && authorId === currentUserId),

  manageRoles: (role: UserRole) =>
    role === "super_admin",
};
