import { useState, useCallback, useEffect, useRef } from "react";
import { useRegisterSW } from "virtual:pwa-register/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { Loader2, RefreshCw, Download, Smartphone, Info, CheckCircle2 } from "lucide-react";
import confetti from "canvas-confetti";

type Phase = "idle" | "checking" | "downloading" | "done";

const AppPage = () => {
  const { toast } = useToast();
  const [phase, setPhase] = useState<Phase>("idle");
  const [progress, setProgress] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval>>();
  const checkingRef = useRef(false);

  const {
    needRefresh: [needRefresh],
    updateServiceWorker,
  } = useRegisterSW();

  const startDownload = useCallback(() => {
    setPhase("downloading");
    setProgress(0);
    let current = 0;
    intervalRef.current = setInterval(() => {
      current += Math.random() * 12 + 3;
      if (current >= 95) {
        current = 95;
        clearInterval(intervalRef.current);
      }
      setProgress(Math.min(current, 95));
    }, 180);

    updateServiceWorker(true).then(() => {
      clearInterval(intervalRef.current);
      setProgress(100);
      setTimeout(() => {
        setPhase("done");
        confetti({ particleCount: 120, spread: 80, origin: { y: 0.7 } });
        toast({ title: "Update complete!", description: "App updated to the latest version." });
        setTimeout(() => window.location.reload(), 1500);
      }, 400);
    });
  }, [updateServiceWorker, toast]);

  // Auto-transition: if needRefresh flips true while checking, start download
  useEffect(() => {
    if (needRefresh && checkingRef.current) {
      checkingRef.current = false;
      startDownload();
    }
  }, [needRefresh, startDownload]);

  const handleCheckUpdate = useCallback(async () => {
    if (phase === "downloading") return;
    setPhase("checking");
    checkingRef.current = true;
    try {
      const registrations = await navigator.serviceWorker?.getRegistrations();
      if (registrations?.length) {
        await Promise.all(registrations.map((r) => r.update()));
      }
      // Wait a moment for SW to detect new version
      await new Promise((r) => setTimeout(r, 2000));

      if (needRefresh) {
        // Update found during or before check
        checkingRef.current = false;
        startDownload();
      } else if (checkingRef.current) {
        // No update found
        checkingRef.current = false;
        setPhase("idle");
        toast({ title: "You're up to date!", description: "No new updates available." });
      }
    } catch {
      checkingRef.current = false;
      setPhase("idle");
      toast({ title: "Could not check for updates", variant: "destructive" });
    }
  }, [needRefresh, toast, phase, startDownload]);

  const isStandalone = window.matchMedia("(display-mode: standalone)").matches;

  const renderUpdateContent = () => {
    if (phase === "checking") {
      return (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Checking for updates...</p>
          </div>
        </div>
      );
    }

    if (phase === "downloading") {
      return (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Download className="h-4 w-4 text-primary animate-bounce" />
              <p className="text-sm font-medium text-foreground">Downloading update...</p>
            </div>
            <span className="text-sm font-bold text-primary">{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} className="h-2.5" />
        </div>
      );
    }

    if (phase === "done") {
      return (
        <div className="flex items-center gap-2">
          <CheckCircle2 className="h-5 w-5 text-accent" />
          <p className="text-sm font-medium text-foreground">Update complete! Reloading...</p>
        </div>
      );
    }

    // idle
    if (needRefresh) {
      return (
        <>
          <p className="text-sm text-muted-foreground">A new version is available. Update now to get the latest features and fixes.</p>
          <Button onClick={startDownload} className="w-full gap-2">
            <Download className="h-4 w-4" /> Update Now
          </Button>
        </>
      );
    }

    return (
      <>
        <p className="text-sm text-muted-foreground">Your app is up to date.</p>
        <Button variant="outline" onClick={handleCheckUpdate} className="w-full gap-2">
          <RefreshCw className="h-4 w-4" /> Check for Updates
        </Button>
      </>
    );
  };

  return (
    <div className="space-y-6 px-4 py-6">
      <h2 className="text-2xl font-bold text-foreground">App</h2>

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

      <Card className={needRefresh || phase === "downloading" ? "border-primary/30 bg-primary/5" : ""}>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Download className="h-5 w-5 text-primary" />
            App Updates
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {renderUpdateContent()}
        </CardContent>
      </Card>

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
