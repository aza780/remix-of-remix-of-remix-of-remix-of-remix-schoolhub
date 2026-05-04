import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

export type UserRole = "super_admin" | "admin" | "public";

export function useUserRole() {
  const { session, loading: authLoading } = useAuth();

  return useQuery({
    queryKey: ["user-role", session?.user.id],
    queryFn: async (): Promise<UserRole> => {
      if (!session) return "public";

      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", session.user.id)
        .single();

      if (error || !data) return "public";
      return data.role as UserRole;
    },
    enabled: !authLoading,
    staleTime: 5 * 60 * 1000,
    retry: false,
  });
}
