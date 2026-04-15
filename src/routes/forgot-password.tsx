import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { resetPassword } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/forgot-password")({
  component: ForgotPasswordPage,
});

function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await resetPassword(email);
      setSent(true);
      toast.success("Email reset password terkirim!");
    } catch (err: any) {
      toast.error(err.message || "Gagal mengirim email");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <Link to="/" className="text-2xl font-bold text-primary">ScholarHub</Link>
          <p className="mt-2 text-sm text-muted-foreground">Reset password kamu</p>
        </div>
        {sent ? (
          <div className="rounded-xl border bg-card p-6 text-center shadow-sm">
            <p className="text-sm text-muted-foreground">Cek email kamu untuk link reset password.</p>
            <Link to="/login" className="mt-4 inline-block text-sm text-primary hover:underline">Kembali ke Login</Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 rounded-xl border bg-card p-6 shadow-sm">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="nama@email.com" />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Mengirim..." : "Kirim Link Reset"}
            </Button>
            <p className="text-center text-sm">
              <Link to="/login" className="text-muted-foreground hover:text-foreground">Kembali ke Login</Link>
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
