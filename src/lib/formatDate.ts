export function formatDateID(dateString: string | null | undefined): string {
  if (!dateString) return "-";
  const date = new Date(dateString + "T00:00:00");
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

export function getMonthLabelID(year: number, month: number): string {
  const date = new Date(year, month - 1, 1);
  return new Intl.DateTimeFormat("id-ID", { month: "long" }).format(date);
}
