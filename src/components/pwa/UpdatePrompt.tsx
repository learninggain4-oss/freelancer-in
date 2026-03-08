import { useRegisterSW } from "virtual:pwa-register/react";
import { RefreshCw } from "lucide-react";
import { useEffect, useState, useRef } from "react";
import { Progress } from "@/components/ui/progress";
import { toast } from "@/hooks/use-toast";

const UpdatePrompt = () => {
  const [updating, setUpdating] = useState(false);
  const [progress, setProgress] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval>>();

  const {
    needRefresh: [needRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(_swUrl, registration) {
      if (registration) {
        setInterval(() => {
          registration.update();
        }, 60 * 1000);
      }
    },
  });

  useEffect(() => {
    if (needRefresh && !updating) {
      setUpdating(true);
      setProgress(0);

      // Simulate progress while SW activates
      let current = 0;
      intervalRef.current = setInterval(() => {
        current += Math.random() * 15 + 5;
        if (current >= 95) {
          current = 95;
          clearInterval(intervalRef.current);
        }
        setProgress(Math.min(current, 95));
      }, 150);

      // Trigger the update immediately
      updateServiceWorker(true).then(() => {
        clearInterval(intervalRef.current);
        setProgress(100);
      });
    }

    return () => clearInterval(intervalRef.current);
  }, [needRefresh]);

  if (!updating) return null;

  return (
    <div className="fixed bottom-20 left-1/2 z-[100] w-[280px] -translate-x-1/2 animate-in slide-in-from-bottom-4 fade-in duration-300">
      <div className="flex flex-col gap-2 rounded-xl border bg-card px-4 py-3 shadow-lg">
        <div className="flex items-center gap-2">
          <RefreshCw className="h-4 w-4 text-primary animate-spin" />
          <span className="text-sm font-medium text-foreground">
            Updating… {Math.round(progress)}%
          </span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>
    </div>
  );
};

export default UpdatePrompt;
