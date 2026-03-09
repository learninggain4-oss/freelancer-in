import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import UserTotpSetupCard from "@/components/auth/UserTotpSetupCard";
import WithdrawalPasswordCard from "@/components/settings/WithdrawalPasswordCard";
import NotificationPreferences from "@/components/notifications/NotificationPreferences";

const AccountSettings = () => {
  const { profile } = useAuth();

  return (
    <div className="space-y-6 px-4 py-6">
      <h2 className="text-2xl font-bold text-foreground">Account Settings</h2>

      <Tabs defaultValue="security" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="account">Account</TabsTrigger>
        </TabsList>

        {/* Tab: Notifications */}
        <TabsContent value="notifications" className="space-y-4 mt-4">
          <NotificationPreferences />
        </TabsContent>

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
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AccountSettings;
