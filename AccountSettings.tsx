import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import UserTotpSetupCard from "@/components/auth/UserTotpSetupCard";
import WithdrawalPasswordCard from "@/components/settings/WithdrawalPasswordCard";
import { Settings, Shield, User, Mail, Fingerprint, Lock, ChevronRight } from "lucide-react";

const AccountSettings = () => {
  const { profile } = useAuth();

  return (
    <div className="space-y-5 p-4 pb-8">
      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary via-primary/90 to-primary/70 p-5 text-primary-foreground">
        <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-primary-foreground/10 blur-2xl" />
        <div className="absolute -bottom-4 -left-4 h-20 w-20 rounded-full bg-primary-foreground/5 blur-xl" />
        <div className="relative z-10 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-foreground/20 backdrop-blur-sm">
            <Settings className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight">Account Settings</h1>
            <p className="text-xs text-primary-foreground/70">Manage your security & account</p>
          </div>
        </div>
      </div>

      <Tabs defaultValue="security" className="w-full">
        <TabsList className="grid w-full grid-cols-2 h-11 rounded-xl">
          <TabsTrigger value="security" className="gap-1.5 rounded-lg text-xs font-semibold">
            <Shield className="h-3.5 w-3.5" /> Security
          </TabsTrigger>
          <TabsTrigger value="account" className="gap-1.5 rounded-lg text-xs font-semibold">
            <User className="h-3.5 w-3.5" /> Account
          </TabsTrigger>
        </TabsList>

        {/* Tab: Security */}
        <TabsContent value="security" className="space-y-4 mt-4">
          <UserTotpSetupCard />
          <WithdrawalPasswordCard />
        </TabsContent>

        {/* Tab: Account */}
        <TabsContent value="account" className="space-y-4 mt-4">
          <Card className="border-0 shadow-sm overflow-hidden">
            <div className="h-1 bg-gradient-to-r from-primary via-accent to-primary" />
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <User className="h-4 w-4 text-primary" />
                Account Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-0">
              {[
                { icon: User, label: "Name", value: Array.isArray(profile?.full_name) ? profile.full_name[0] : profile?.full_name },
                { icon: Fingerprint, label: "User Code", value: Array.isArray(profile?.user_code) ? profile.user_code[0] : profile?.user_code, isBadge: true },
                { icon: Mail, label: "Email", value: profile?.email },
                { icon: Lock, label: "Account Type", value: profile?.user_type === "employee" ? "Employee" : "Client", isBadge: true },
              ].map((item, idx) => (
                <div key={idx}>
                  <div className="flex items-center gap-3 py-3.5">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted">
                      <item.icon className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-muted-foreground">{item.label}</p>
                      {item.isBadge ? (
                        <Badge variant="secondary" className="mt-0.5 text-xs">{item.value}</Badge>
                      ) : (
                        <p className="text-sm font-medium text-foreground truncate">{item.value}</p>
                      )}
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground/40" />
                  </div>
                  {idx < 3 && <Separator />}
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AccountSettings;
