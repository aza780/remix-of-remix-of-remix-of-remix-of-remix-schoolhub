import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type UserRole = "super_admin" | "admin" | "public";

export function useUserRole() {
  return useQuery({
    queryKey: ["user-role"],
    queryFn: async (): Promise<UserRole> => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return "public";

      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", session.user.id)
        .single();

      if (error || !data) return "public";
      return data.role as UserRole;
    },
    staleTime: 5 * 60 * 1000,
    retry: false,
  });
}
