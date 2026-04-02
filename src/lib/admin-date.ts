import { format, formatDistanceToNow, FormatDistanceToNowOptions } from "date-fns";

export function safeFmt(raw: string | null | undefined, fmt: string, fallback = "—"): string {
  try {
    if (!raw) return fallback;
    const d = new Date(raw);
    if (isNaN(d.getTime())) return fallback;
    return format(d, fmt);
  } catch {
    return fallback;
  }
}

export function safeDist(raw: string | null | undefined, fallback = "—", opts?: FormatDistanceToNowOptions): string {
  try {
    if (!raw) return fallback;
    const d = new Date(raw);
    if (isNaN(d.getTime())) return fallback;
    return formatDistanceToNow(d, opts);
  } catch {
    return fallback;
  }
}
