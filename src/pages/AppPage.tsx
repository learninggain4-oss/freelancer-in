import { useState, useCallback } from "react";
import { useRegisterSW } from "virtual:pwa-register/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Loader2, RefreshCw, Download, Smartphone, Info } from "lucide-react";

const AppPage = () => {
  const { toast } = useToast();
  const [checking, setChecking] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [updateProgress, setUpdateProgress] = useState(0);

  const {
    needRefresh: [needRefresh],
    updateServiceWorker,
  } = useRegisterSW();

  const handleCheckUpdate = useCallback(async () => {
    setChecking(true);
    try {
      const registrations = await navigator.serviceWorker?.getRegistrations();
      if (registrations?.length) {
        await Promise.all(registrations.map((r) => r.update()));
      }
      await new Promise((r) => setTimeout(r, 1500));
      if (!needRefresh) {
        toast({ title: "You're up to date!", description: "No new updates available." });
      }
    } catch {
      toast({ title: "Could not check for updates", variant: "destructive" });
    } finally {
      setChecking(false);
    }
  }, [needRefresh, toast]);

  const handleUpdate = useCallback(() => {
    setUpdating(true);
    setUpdateProgress(0);
    const interval = setInterval(() => {
      setUpdateProgress((prev) => {
        if (prev >= 90) {
          clearInterval(interval);
          return 95;
        }
        return prev + Math.random() * 15 + 5;
      });
    }, 200);
    updateServiceWorker(true).finally(() => {
      clearInterval(interval);
      setUpdateProgress(100);
      setTimeout(() => window.location.reload(), 300);
    });
  }, [updateServiceWorker]);

  const isStandalone = window.matchMedia("(display-mode: standalone)").matches;

  return (
    <div className="space-y-6 px-4 py-6">
      <h2 className="text-2xl font-bold text-foreground">App</h2>

      {/* App Info */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Smartphone className="h-5 w-5 text-primary" />
            App Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">App Name</span>
            <span className="text-sm font-medium">Freelancer</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Mode</span>
            <span className="text-sm font-medium">{isStandalone ? "Installed (PWA)" : "Browser"}</span>
          </div>
        </CardContent>
      </Card>

      {/* App Updates */}
      <Card className={needRefresh ? "border-primary/30 bg-primary/5" : ""}>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Download className="h-5 w-5 text-primary" />
            App Updates
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {updating ? (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">Updating... {Math.min(Math.round(updateProgress), 100)}%</p>
              <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full rounded-full bg-primary transition-all duration-200"
                  style={{ width: `${Math.min(updateProgress, 100)}%` }}
                />
              </div>
            </div>
          ) : needRefresh ? (
            <>
              <p className="text-sm text-muted-foreground">A new version is available. Update now to get the latest features and fixes.</p>
              <Button onClick={handleUpdate} className="w-full gap-2">
                <RefreshCw className="h-4 w-4" /> Update Now
              </Button>
            </>
          ) : (
            <>
              <p className="text-sm text-muted-foreground">Your app is up to date.</p>
              <Button variant="outline" onClick={handleCheckUpdate} disabled={checking} className="w-full gap-2">
                {checking ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                Check for Updates
              </Button>
            </>
          )}
        </CardContent>
      </Card>

      {/* Install Tip */}
      {!isStandalone && (
        <Card className="border-accent/20 bg-accent/5">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Info className="h-5 w-5 text-accent" />
              Install the App
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              For the best experience, install Freelancer on your device. Tap the share/menu button in your browser and select "Add to Home Screen" or "Install App".
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AppPage;
