import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Smartphone, Info } from "lucide-react";

declare const __BUILD_TIME__: string;

const formatVersion = (iso: string) => {
  const d = new Date(iso);
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}-${String(d.getHours()).padStart(2, "0")}${String(d.getMinutes()).padStart(2, "0")}`;
};

const AppPage = () => {
  const appVersion = formatVersion(__BUILD_TIME__);
  const isStandalone = window.matchMedia("(display-mode: standalone)").matches;

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
            <span className="text-sm text-muted-foreground">Version</span>
            <span className="text-sm font-medium font-mono">{appVersion}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Mode</span>
            <span className="text-sm font-medium">{isStandalone ? "Installed (PWA)" : "Browser"}</span>
          </div>
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
