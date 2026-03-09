import { differenceInSeconds } from "date-fns";

export function formatDuration(checkInAt: string, checkOutAt: string | null): string | null {
  if (!checkOutAt) return null;
  
  const totalSeconds = differenceInSeconds(new Date(checkOutAt), new Date(checkInAt));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m ${seconds}s`;
}
