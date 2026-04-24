import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import type { TryoutEvent } from "@/lib/tryout-types";
import type { TryoutEventInsert } from "@/lib/tryout-admin-queries";

function toLocalInput(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function TryoutEventForm({
  initial,
  onSubmit,
  loading,
}: {
  initial?: TryoutEvent;
  onSubmit: (data: TryoutEventInsert) => void;
  loading?: boolean;
}) {
  const [title, setTitle] = useState(initial?.title ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [startDate, setStartDate] = useState(toLocalInput(initial?.start_date));
  const [endDate, setEndDate] = useState(toLocalInput(initial?.end_date));
  const [status, setStatus] = useState<"draft" | "published" | "ended">(
    (initial?.status as any) ?? "draft"
  );

  const submit = () => {
    if (!title.trim()) { toast.error("Judul harus diisi"); return; }
    if (!startDate || !endDate) { toast.error("Tanggal mulai & selesai harus diisi"); return; }
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (end <= start) { toast.error("Tanggal selesai harus setelah tanggal mulai"); return; }
    onSubmit({
      title: title.trim(),
      description: description.trim() || null,
      start_date: start.toISOString(),
      end_date: end.toISOString(),
      status,
    });
  };

  return (
    <div className="space-y-6 rounded-xl border bg-card p-6 shadow-sm">
      <div className="space-y-2">
        <Label htmlFor="title">Judul *</Label>
        <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Judul event tryout" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="desc">Deskripsi</Label>
        <Textarea id="desc" rows={3} value={description} onChange={(e) => setDescription(e.target.value)} />
      </div>
      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="start">Mulai *</Label>
          <Input id="start" type="datetime-local" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="end">Selesai *</Label>
          <Input id="end" type="datetime-local" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
        </div>
      </div>
      <div className="space-y-2 max-w-xs">
        <Label>Status</Label>
        <Select value={status} onValueChange={(v) => setStatus(v as any)}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="published">Published</SelectItem>
            <SelectItem value="ended">Ended</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <Button onClick={submit} disabled={loading}>
        {loading ? "Menyimpan..." : "Simpan"}
      </Button>
    </div>
  );
}
