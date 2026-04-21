import { Link } from "@tanstack/react-router";
import { ArrowRight, Calendar } from "lucide-react";
import { getEventStatus, type TryoutEvent } from "@/lib/tryout-types";
import { formatDateID } from "@/lib/formatDate";

const STATUS_BADGE: Record<
  ReturnType<typeof getEventStatus>,
  { label: string; cls: string }
> = {
  upcoming: { label: "Akan Datang", cls: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300" },
  active: { label: "Berlangsung", cls: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300" },
  ended: { label: "Berakhir", cls: "bg-muted text-muted-foreground" },
  draft: { label: "Draft", cls: "bg-amber-100 text-amber-700" },
};

export function TryoutEventCard({ event }: { event: TryoutEvent }) {
  const status = getEventStatus(event);
  const badge = STATUS_BADGE[status];

  return (
    <Link
      to="/tryout/$eventId"
      params={{ eventId: event.id }}
      className="block rounded-xl border bg-card p-5 shadow-sm transition-all hover:border-primary/40 hover:shadow-md"
    >
      <div className="mb-3 flex items-start justify-between gap-3">
        <h3 className="text-lg font-semibold text-foreground">{event.title}</h3>
        <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold ${badge.cls}`}>
          {badge.label}
        </span>
      </div>

      {event.description && (
        <p className="mb-3 line-clamp-2 text-sm text-muted-foreground">{event.description}</p>
      )}

      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Calendar className="h-3.5 w-3.5" />
        <span>
          {formatDateID(event.start_date.slice(0, 10))} — {formatDateID(event.end_date.slice(0, 10))}
        </span>
      </div>

      <div className="mt-4 flex items-center gap-1 text-sm font-medium text-primary">
        Lihat Detail <ArrowRight className="h-4 w-4" />
      </div>
    </Link>
  );
}
