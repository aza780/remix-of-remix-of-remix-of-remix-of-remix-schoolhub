import { supabase } from "@/integrations/supabase/client";

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export type UserRole = "super_admin" | "admin" | null;

export async function getUserRole(userId: string): Promise<UserRole> {
  const { data } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .single();
  return (data?.role as UserRole) ?? null;
}

export async function checkIsAdmin(userId: string): Promise<boolean> {
  const role = await getUserRole(userId);
  return role === "admin" || role === "super_admin";
}
