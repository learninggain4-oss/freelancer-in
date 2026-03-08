import { useState, useCallback } from "react";
import { useRegisterSW } from "virtual:pwa-register/react";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Loader2, RefreshCw, Download } from "lucide-react";
import UserTotpSetupCard from "@/components/auth/UserTotpSetupCard";
import WithdrawalPasswordCard from "@/components/settings/WithdrawalPasswordCard";

const AccountSettings = () => {
  const { profile } = useAuth();
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

  return (
    <div className="space-y-6 px-4 py-6">
      <h2 className="text-2xl font-bold text-foreground">Account Settings</h2>

      <Tabs defaultValue="security" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="account">Account</TabsTrigger>
        </TabsList>

        {/* Tab: Security */}
        <TabsContent value="security" className="space-y-4 mt-4">
          <UserTotpSetupCard />
          <WithdrawalPasswordCard />
        </TabsContent>

        {/* Tab: Account */}
        <TabsContent value="account" className="space-y-4 mt-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Account Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Name</span>
                <span className="text-sm font-medium">{profile?.full_name?.[0]}</span>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">User Code</span>
                <Badge variant="secondary">{profile?.user_code?.[0]}</Badge>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Email</span>
                <span className="text-sm font-medium">{profile?.email}</span>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Account Type</span>
                <Badge>{profile?.user_type === "employee" ? "Employee" : "Client"}</Badge>
              </div>
            </CardContent>
          </Card>

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
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AccountSettings;
