import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

export const Route = createFileRoute("/auth/callback")({
  component: AuthCallbackPage,
});

function AuthCallbackPage() {
  const navigate = useNavigate();

  useEffect(() => {
    // Listen for the auth state change triggered by Supabase
    // processing the OAuth callback (hash params or PKCE code exchange)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" && session) {
        navigate({ to: "/", replace: true });
      } else if (event === "TOKEN_REFRESHED") {
        // ignore, wait for SIGNED_IN
      } else if (event === "INITIAL_SESSION") {
        // If there's already a session from the hash/code exchange, redirect
        if (session) {
          navigate({ to: "/", replace: true });
        }
      }
    });

    // Fallback: if nothing happens within 5s, go to login
    const timeout = setTimeout(() => {
      navigate({ to: "/login", replace: true });
    }, 5000);

    return () => {
      subscription.unsubscribe();
      clearTimeout(timeout);
    };
  }, [navigate]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Sedang masuk...</p>
      </div>
    </div>
  );
}
