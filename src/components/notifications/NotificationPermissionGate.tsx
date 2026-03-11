import { useState, useEffect, useCallback } from "react";
import { BellOff, Bell, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";

const NotificationPermissionGate = ({ children }: { children: React.ReactNode }) => {
  const [permission, setPermission] = useState<NotificationPermission | "loading">("loading");

  const checkPermission = useCallback(() => {
    if (!("Notification" in window)) {
      // Browser doesn't support notifications — allow through
      setPermission("granted");
      return;
    }
    setPermission(Notification.permission);
  }, []);

  useEffect(() => {
    checkPermission();
    // Re-check when tab becomes visible (user may have changed permission in settings)
    const handleVisibility = () => {
      if (document.visibilityState === "visible") checkPermission();
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, [checkPermission]);

  const requestPermission = async () => {
    try {
      const result = await Notification.requestPermission();
      setPermission(result);
    } catch {
      setPermission(Notification.permission);
    }
  };

  if (permission === "loading") return null;
  if (permission === "granted") return <>{children}</>;

  // Denied or default — show full-screen blocker
  const isDenied = permission === "denied";

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-background">
      <div className="mx-4 max-w-md text-center space-y-6">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
          {isDenied ? (
            <ShieldAlert className="h-10 w-10 text-destructive" />
          ) : (
            <Bell className="h-10 w-10 text-primary animate-bounce" />
          )}
        </div>

        <h1 className="text-2xl font-bold text-foreground">
          {isDenied ? "Notifications Blocked" : "Enable Notifications"}
        </h1>

        <p className="text-muted-foreground leading-relaxed">
          {isDenied
            ? "You have blocked notifications for this app. To continue using Freelancer, please enable notifications in your browser settings, then reload the page."
            : "Freelancer requires notification permission to keep you updated on projects, payments, and messages. Please allow notifications to continue."}
        </p>

        {isDenied ? (
          <div className="space-y-3">
            <div className="rounded-lg border border-border bg-muted/50 p-4 text-left text-sm text-muted-foreground space-y-2">
              <p className="font-medium text-foreground">How to enable:</p>
              <ol className="list-decimal list-inside space-y-1">
                <li>Click the lock/info icon in your browser's address bar</li>
                <li>Find "Notifications" and set it to "Allow"</li>
                <li>Reload this page</li>
              </ol>
            </div>
            <Button onClick={() => window.location.reload()} variant="outline" className="w-full">
              Reload Page
            </Button>
          </div>
        ) : (
          <Button onClick={requestPermission} size="lg" className="w-full gap-2">
            <Bell className="h-5 w-5" />
            Allow Notifications
          </Button>
        )}

        <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
          <BellOff className="h-3 w-3" />
          <span>This is required to use the app</span>
        </div>
      </div>
    </div>
  );
};

export default NotificationPermissionGate;
