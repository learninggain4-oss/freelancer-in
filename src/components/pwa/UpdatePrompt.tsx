import { useRegisterSW } from "virtual:pwa-register/react";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";

const UpdatePrompt = () => {
  const {
    needRefresh: [needRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(swUrl, registration) {
      if (registration) {
        // Check for updates every 60 seconds
        setInterval(() => {
          registration.update();
        }, 60 * 1000);
      }
    },
  });

  if (!needRefresh) return null;

  return (
    <div className="fixed bottom-20 left-1/2 z-[100] -translate-x-1/2 animate-in slide-in-from-bottom-4 fade-in duration-300">
      <div className="flex items-center gap-3 rounded-xl border bg-card px-4 py-3 shadow-lg">
        <RefreshCw className="h-4 w-4 text-primary animate-spin" />
        <span className="text-sm font-medium text-foreground">
          New update available
        </span>
        <Button size="sm" onClick={() => updateServiceWorker(true)}>
          Update Now
        </Button>
      </div>
    </div>
  );
};

export default UpdatePrompt;
