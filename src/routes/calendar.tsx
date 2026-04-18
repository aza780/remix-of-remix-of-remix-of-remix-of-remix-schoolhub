import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useMemo, useCallback } from "react";
import { ChevronLeft, ChevronRight, Filter, X, Calendar as CalendarIcon } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { useCalendarPosts } from "@/hooks/useCalendarPosts";
import { getPostStatus } from "@/lib/getPostStatus";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/use-mobile";
import { ALL_CATEGORIES, CATEGORY_CONFIG, getCategoryConfig, type Category } from "@/lib/getCategoryConfig";
import { MonthlyListSection } from "@/components/calendar/MonthlyListSection";
import { getMonthLabelID } from "@/lib/formatDate";

export const Route = createFileRoute("/calendar")({
  head: () => ({
    meta: [
      { title: "Kalender — Agenda Prestasi" },
      { name: "description", content: "Kalender deadline beasiswa, lomba, dan event." },
    ],
  }),
  component: CalendarPage,
});

type EventType = "open" | "deadline" | "announcement";
type CategoryFilter = Category;

interface CalendarEvent {
  id: string;
  title: string;
  slug: string;
  category: string;
  open_date: string | null;
  deadline: string | null;
  announcement_date: string | null;
  status: string;
  eventType: EventType;
  date: string;
}

const EVENT_TYPE_LABELS: Record<EventType, string> = {
  open: "Buka",
  deadline: "Tutup",
  announcement: "Pengumuman",
};

const MONTH_NAMES_ID = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember",
];

const DAY_NAMES = ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"];

function CalendarPage() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [filterOpen, setFilterOpen] = useState(false);
  const [categoryFilters, setCategoryFilters] = useState<Set<CategoryFilter>>(new Set(ALL_CATEGORIES));
  const [eventTypeFilters, setEventTypeFilters] = useState<Set<EventType>>(new Set(["open", "deadline", "announcement"]));
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const isMobile = useIsMobile(); // < 768px

  const { data: posts, isLoading, isError, refetch } = useCalendarPosts(year, month);

  const maxDate = new Date(now.getFullYear(), now.getMonth() + 13, 1);
  const canGoNext = new Date(year, month, 1) < maxDate;

  const goNext = useCallback(() => {
    if (!canGoNext) return;
    if (month === 12) { setYear(y => y + 1); setMonth(1); }
    else setMonth(m => m + 1);
  }, [month, canGoNext]);

  const goPrev = useCallback(() => {
    if (month === 1) { setYear(y => y - 1); setMonth(12); }
    else setMonth(m => m - 1);
  }, [month]);

  const events = useMemo(() => {
    if (!posts) return [];
    const result: CalendarEvent[] = [];
    for (const post of posts) {
      if (post.open_date && eventTypeFilters.has("open") && categoryFilters.has(post.category as CategoryFilter)) {
        result.push({ ...post, eventType: "open", date: post.open_date });
      }
      if (post.deadline && eventTypeFilters.has("deadline") && categoryFilters.has(post.category as CategoryFilter)) {
        result.push({ ...post, eventType: "deadline", date: post.deadline });
      }
      if (post.announcement_date && eventTypeFilters.has("announcement") && categoryFilters.has(post.category as CategoryFilter)) {
        result.push({ ...post, eventType: "announcement", date: post.announcement_date });
      }
    }
    return result;
  }, [posts, categoryFilters, eventTypeFilters]);

  const grid = useMemo(() => {
    const daysInMonth = new Date(year, month, 0).getDate();
    let firstDayOfWeek = new Date(year, month - 1, 1).getDay();
    firstDayOfWeek = (firstDayOfWeek + 6) % 7;
    const cells: (number | null)[] = [];
    for (let i = 0; i < firstDayOfWeek; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(d);
    while (cells.length % 7 !== 0) cells.push(null);
    return cells;
  }, [year, month]);

  const eventsForDay = useCallback(
    (day: number) => {
      const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
      return events.filter((e) => e.date === dateStr);
    },
    [events, year, month]
  );

  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;

  const toggleCategoryFilter = (cat: CategoryFilter) => {
    setCategoryFilters((prev) => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat);
      else next.add(cat);
      return next;
    });
  };

  const toggleEventTypeFilter = (et: EventType) => {
    setEventTypeFilters((prev) => {
      const next = new Set(prev);
      if (next.has(et)) next.delete(et);
      else next.add(et);
      return next;
    });
  };

  // Use bottom sheet for < 640px (sm breakpoint), centered modal for >= 640px
  // useIsMobile is 768px, so we check window width for 640 cutoff
  const isSmallMobile = typeof window !== "undefined" && window.innerWidth < 640;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="mx-auto max-w-4xl px-4 py-6 sm:py-8">
        {/* Header */}
        <div className="mb-2 flex items-center justify-between sm:mb-6">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" className="h-8 w-8 sm:h-9 sm:w-9" onClick={goPrev}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <h1 className="min-w-[160px] text-center text-base font-semibold text-foreground sm:min-w-[180px] sm:text-lg md:text-xl md:font-bold">
              {MONTH_NAMES_ID[month - 1]} {year}
            </h1>
            <Button variant="outline" size="icon" className="h-8 w-8 sm:h-9 sm:w-9" onClick={goNext} disabled={!canGoNext}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          <div className="relative">
            <Button variant="outline" size="sm" onClick={() => setFilterOpen((v) => !v)}>
              <Filter className="mr-1 h-4 w-4" /> Filter
            </Button>
            {filterOpen && (
              <div className="absolute right-0 top-full z-40 mt-2 w-52 rounded-lg border bg-card p-3 shadow-lg">
                <p className="mb-2 text-xs font-semibold text-muted-foreground">Kategori</p>
                {ALL_CATEGORIES.map((key) => (
                  <label key={key} className="flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 text-sm hover:bg-secondary">
                    <input type="checkbox" checked={categoryFilters.has(key)} onChange={() => toggleCategoryFilter(key)} className="accent-primary" />
                    {CATEGORY_CONFIG[key].label}
                  </label>
                ))}
                <hr className="my-2" />
                <p className="mb-2 text-xs font-semibold text-muted-foreground">Tanggal</p>
                {([["open", "Tanggal Buka"], ["deadline", "Deadline"], ["announcement", "Pengumuman"]] as const).map(([key, label]) => (
                  <label key={key} className="flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 text-sm hover:bg-secondary">
                    <input type="checkbox" checked={eventTypeFilters.has(key)} onChange={() => toggleEventTypeFilter(key)} className="accent-primary" />
                    {label}
                  </label>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Legend — below header on mobile, below grid on desktop */}
        {!isLoading && !isError && (
          <div className="mb-3 flex flex-wrap items-center gap-x-4 gap-y-1 px-1 text-xs text-muted-foreground sm:hidden">
            {ALL_CATEGORIES.map((cat) => (
              <span key={cat} className="flex items-center gap-1">
                <span className={`inline-block h-2 w-2 rounded-full ${CATEGORY_CONFIG[cat].dotClass}`} />
                {CATEGORY_CONFIG[cat].label}
              </span>
            ))}
          </div>
        )}

        {/* Calendar grid */}
        {isLoading ? (
          <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
            <div className="grid grid-cols-7 border-b">
              {DAY_NAMES.map((d) => (
                <div key={d} className="py-2 text-center text-xs font-medium text-muted-foreground">{d}</div>
              ))}
            </div>
            <div className="grid grid-cols-7">
              {Array.from({ length: 35 }).map((_, i) => (
                <div key={i} className="h-[52px] animate-pulse border-b border-r bg-muted/30 sm:h-24 md:h-28" />
              ))}
            </div>
          </div>
        ) : isError ? (
          <div className="flex flex-col items-center justify-center rounded-xl border bg-card py-20 text-center">
            <p className="mb-3 text-muted-foreground">Gagal memuat data kalender.</p>
            <Button variant="outline" onClick={() => refetch()}>Coba Lagi</Button>
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
            <div className="grid grid-cols-7 border-b">
              {DAY_NAMES.map((d) => (
                <div key={d} className="py-2 text-center text-xs font-medium text-muted-foreground">{d}</div>
              ))}
            </div>
            <div className="grid grid-cols-7">
              {grid.map((day, i) => {
                if (day === null) {
                  return <div key={i} className="min-h-[52px] border-b border-r bg-muted/10 sm:h-24 md:h-28" />;
                }
                const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
                const isToday = dateStr === todayStr;
                const dayEvents = eventsForDay(day);
                const showEvents = dayEvents.slice(0, 2);
                const remaining = dayEvents.length - showEvents.length;

                return (
                  <div
                    key={i}
                    className={`relative min-h-[52px] overflow-hidden border-b border-r p-1 sm:h-24 md:h-28 md:p-1.5 ${
                      isToday ? "bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-300" : ""
                    }`}
                    onClick={() => {
                      // On mobile, tapping a cell with events opens the first event
                      if (dayEvents.length > 0 && isSmallMobile) {
                        setSelectedEvent(dayEvents[0]);
                      }
                    }}
                  >
                    <span className={`text-sm font-medium ${isToday ? "text-primary font-bold" : "text-foreground"}`}>
                      {day}
                    </span>

                    {/* Mobile < 640px: dots only */}
                    <div className="mt-0.5 flex flex-wrap gap-0.5 px-0.5 sm:hidden">
                      {dayEvents.slice(0, 3).map((ev, idx) => (
                        <button
                          key={`${ev.id}-${ev.eventType}-${idx}`}
                          onClick={(e) => { e.stopPropagation(); setSelectedEvent(ev); }}
                          className={`h-2 w-2 rounded-full ${getCategoryConfig(ev.category).dotClass}`}
                          aria-label={ev.title}
                        />
                      ))}
                      {dayEvents.length > 3 && (
                        <span className="text-[9px] leading-none text-muted-foreground">+{dayEvents.length - 3}</span>
                      )}
                    </div>

                    {/* Desktop >= 640px: text pills */}
                    <div className="mt-0.5 hidden flex-col gap-0.5 sm:flex">
                      {showEvents.map((ev, idx) => (
                        <button
                          key={`${ev.id}-${ev.eventType}-${idx}`}
                          onClick={() => setSelectedEvent(ev)}
                          className={`w-full truncate rounded px-1 py-0.5 text-left text-[10px] font-medium leading-tight md:text-xs ${getCategoryConfig(ev.category).calendarPillClass}`}
                        >
                          ● {ev.title.length > 18 ? ev.title.slice(0, 18) + "…" : ev.title}
                          <span className="ml-0.5 opacity-60">({EVENT_TYPE_LABELS[ev.eventType]})</span>
                        </button>
                      ))}
                      {remaining > 0 && (
                        <span className="px-1 text-[10px] text-muted-foreground">+{remaining} lagi</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Desktop legend */}
        {!isLoading && !isError && (
          <div className="mt-4 hidden flex-wrap items-center gap-4 text-xs text-muted-foreground sm:flex">
            {ALL_CATEGORIES.map((cat) => (
              <span key={cat} className="flex items-center gap-1">
                <span className={`inline-block h-2.5 w-2.5 rounded-full ${CATEGORY_CONFIG[cat].dotClass}`} />
                {CATEGORY_CONFIG[cat].label}
              </span>
            ))}
          </div>
        )}

        {/* Empty state */}
        {!isLoading && !isError && events.length === 0 && (
          <div className="mt-8 text-center">
            <CalendarIcon className="mx-auto mb-2 h-10 w-10 text-muted-foreground/40" />
            <p className="text-muted-foreground">Tidak ada jadwal di bulan ini.</p>
          </div>
        )}
      </div>

      {/* Event Modal / Bottom Sheet */}
      {selectedEvent && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40 bg-black/40 transition-opacity duration-200"
            onClick={() => setSelectedEvent(null)}
          />

          {/* Bottom sheet for < 640px */}
          <div className="fixed inset-x-0 bottom-0 z-50 max-h-[85vh] overflow-y-auto rounded-t-2xl bg-card shadow-xl transition-transform duration-300 sm:hidden">
            {/* Drag handle */}
            <div className="flex justify-center pt-3 pb-4">
              <div className="h-1 w-10 rounded-full bg-muted-foreground/30" />
            </div>
            <div className="px-5 pb-6">
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${getCategoryConfig(selectedEvent.category).badgeClass}`}>
                  {getCategoryConfig(selectedEvent.category).label}
                </span>
                <StatusBadge status={getPostStatus(selectedEvent)} />
              </div>

              <h2 className="mb-2 text-lg font-bold text-foreground">{selectedEvent.title}</h2>

              <div className="mb-4 space-y-1.5 text-sm text-muted-foreground">
                {selectedEvent.open_date && (
                  <p>📅 Buka: {new Date(selectedEvent.open_date + "T00:00:00").toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}</p>
                )}
                {selectedEvent.deadline && (
                  <p>⏰ Tutup: {new Date(selectedEvent.deadline + "T00:00:00").toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}</p>
                )}
                {selectedEvent.announcement_date && (
                  <p>📢 Pengumuman: {new Date(selectedEvent.announcement_date + "T00:00:00").toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}</p>
                )}
              </div>

              <Link
                to="/posts/$slug"
                params={{ slug: selectedEvent.slug }}
                onClick={() => setSelectedEvent(null)}
              >
                <Button className="w-full">Lihat Detail Lengkap →</Button>
              </Link>
            </div>
          </div>

          {/* Centered modal for >= 640px */}
          <div
            className="fixed inset-0 z-50 hidden items-center justify-center sm:flex"
            onClick={() => setSelectedEvent(null)}
          >
            <div
              className="mx-4 w-full max-w-md rounded-xl bg-card p-6 shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="mb-4 flex items-start justify-between">
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${getCategoryConfig(selectedEvent.category).badgeClass}`}>
                    {getCategoryConfig(selectedEvent.category).label}
                  </span>
                  <StatusBadge status={getPostStatus(selectedEvent)} />
                </div>
                <button onClick={() => setSelectedEvent(null)} className="rounded-full p-1 text-muted-foreground hover:bg-secondary">
                  <X className="h-4 w-4" />
                </button>
              </div>

              <h2 className="mb-2 text-lg font-bold text-foreground">{selectedEvent.title}</h2>

              <div className="mb-4 space-y-1.5 text-sm text-muted-foreground">
                {selectedEvent.open_date && (
                  <p>📅 Buka: {new Date(selectedEvent.open_date + "T00:00:00").toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}</p>
                )}
                {selectedEvent.deadline && (
                  <p>⏰ Tutup: {new Date(selectedEvent.deadline + "T00:00:00").toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}</p>
                )}
                {selectedEvent.announcement_date && (
                  <p>📢 Pengumuman: {new Date(selectedEvent.announcement_date + "T00:00:00").toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}</p>
                )}
              </div>

              <Link
                to="/posts/$slug"
                params={{ slug: selectedEvent.slug }}
                className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
                onClick={() => setSelectedEvent(null)}
              >
                Lihat Detail Lengkap →
              </Link>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
