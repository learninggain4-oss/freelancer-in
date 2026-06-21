import { useEffect, useState } from "react";
import { Clock } from "lucide-react";
import { Progress } from "@/components/ui/progress";

const TWO_HOURS_MS = 2 * 60 * 60 * 1000;

export const WithdrawalCountdown = ({ requestedAt }: { requestedAt: string }) => {
  const [remaining, setRemaining] = useState(() => {
    const deadline = new Date(requestedAt).getTime() + TWO_HOURS_MS;
    return Math.max(0, deadline - Date.now());
  });

  useEffect(() => {
    const interval = setInterval(() => {
      const deadline = new Date(requestedAt).getTime() + TWO_HOURS_MS;
      const left = Math.max(0, deadline - Date.now());
      setRemaining(left);
      if (left <= 0) clearInterval(interval);
    }, 1000);
    return () => clearInterval(interval);
  }, [requestedAt]);

  const totalSeconds = Math.floor(remaining / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const progress = (remaining / TWO_HOURS_MS) * 100;

  if (remaining <= 0) {
    return (
      <p className="text-xs font-medium text-destructive flex items-center gap-1">
        <Clock className="h-3 w-3" /> Expired — will be auto-rejected
      </p>
    );
  }

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className="flex items-center gap-1 text-muted-foreground">
          <Clock className="h-3 w-3" /> Time remaining
        </span>
        <span className={`font-mono font-medium ${remaining < 30 * 60 * 1000 ? "text-destructive" : "text-warning"}`}>
          {String(hours).padStart(2, "0")}:{String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
        </span>
      </div>
      <Progress value={progress} className="h-1.5" />
    </div>
  );
};
