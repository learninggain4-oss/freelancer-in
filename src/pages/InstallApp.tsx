import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Download, Smartphone, CheckCircle, Share } from "lucide-react";
import { Link } from "react-router-dom";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const InstallApp = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    const ua = navigator.userAgent;
    setIsIOS(/iPad|iPhone|iPod/.test(ua));

    if (window.matchMedia("(display-mode: standalone)").matches) {
      setIsInstalled(true);
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener("beforeinstallprompt", handler);
    window.addEventListener("appinstalled", () => setIsInstalled(true));

    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") setIsInstalled(true);
    setDeferredPrompt(null);
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <img src="/pwa-icon-512.png" alt="Freelancer" className="mx-auto mb-4 h-20 w-20 rounded-2xl" />
          <CardTitle className="text-2xl text-foreground">Install Freelancer</CardTitle>
          <p className="text-sm text-muted-foreground">Get the full app experience on your device</p>
        </CardHeader>
        <CardContent className="space-y-4">
          {isInstalled ? (
            <div className="flex flex-col items-center gap-3 py-4">
              <CheckCircle className="h-12 w-12 text-accent" />
              <p className="text-center font-medium text-foreground">App is installed!</p>
              <p className="text-center text-sm text-muted-foreground">Open it from your home screen.</p>
            </div>
          ) : isIOS ? (
            <div className="space-y-3">
              <p className="text-sm font-medium text-foreground">To install on iOS:</p>
              <div className="space-y-2 rounded-lg border p-3">
                <p className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Share className="h-4 w-4 text-primary" /> 1. Tap the Share button in Safari
                </p>
                <p className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Download className="h-4 w-4 text-primary" /> 2. Tap "Add to Home Screen"
                </p>
                <p className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Smartphone className="h-4 w-4 text-primary" /> 3. Tap "Add" to confirm
                </p>
              </div>
            </div>
          ) : deferredPrompt ? (
            <Button onClick={handleInstall} className="w-full" size="lg">
              <Download className="mr-2 h-5 w-5" /> Install App
            </Button>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground text-center">
                Open this page in Chrome or Edge to install the app, or use your browser's menu to add it to your home screen.
              </p>
            </div>
          )}

          <div className="space-y-2 pt-2">
            <p className="text-xs font-medium text-muted-foreground">Benefits:</p>
            <ul className="space-y-1 text-xs text-muted-foreground">
              <li>• Works offline and loads instantly</li>
              <li>• Full-screen app experience</li>
              <li>• Quick access from home screen</li>
            </ul>
          </div>

          <Link to="/" className="block">
            <Button variant="outline" className="w-full">Back to App</Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
};

export default InstallApp;
