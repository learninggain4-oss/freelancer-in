import { useAuth } from "@/contexts/AuthContext";
import { useNavigate, useLocation } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import {
  Settings,
  Shield,
  User,
  Mail,
  Fingerprint,
  Lock,
  ChevronRight,
  KeyRound,
  ShieldCheck,
  LogOut,
} from "lucide-react";

const AccountSettings = () => {
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const basePath = location.pathname.split("/settings")[0];

  const securityItems = [
    {
      key: "mpin",
      icon: KeyRound,
      label: "M-Pin (Login Security PIN)",
      description: "Set or change your login security PIN",
      path: `${basePath}/settings/security/mpin`,
    },
    {
      key: "totp",
      icon: ShieldCheck,
      label: "Google Authenticator (2FA)",
      description: "Two-factor authentication with 6-digit code",
      path: `${basePath}/settings/security/google-authenticator`,
    },
    {
      key: "withdrawal",
      icon: Lock,
      label: "Withdrawal Password",
      description: "Secure password required for fund withdrawals",
      path: `${basePath}/settings/security/withdrawal-password`,
    },
  ];

  return (
    <div className="max-w-2xl mx-auto space-y-6 p-4 pb-12 animate-in fade-in duration-500">
      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-indigo-600 to-violet-600 p-8 text-white shadow-lg">
        <div className="relative z-10">
          <h1 className="text-2xl font-bold">Account Settings</h1>
          <p className="text-indigo-100 opacity-90">Manage your security and profile preferences</p>
        </div>
        <Settings className="absolute right-6 top-6 h-20 w-20 text-white/10" />
      </div>

      <Tabs defaultValue="security" className="w-full">
        <TabsList className="grid w-full grid-cols-2 p-1 bg-muted/50 rounded-2xl">
          <TabsTrigger
            value="security"
            className="rounded-xl data-[state=active]:bg-background data-[state=active]:shadow-sm"
          >
            <Shield className="mr-2 h-4 w-4" /> Security
          </TabsTrigger>
          <TabsTrigger
            value="account"
            className="rounded-xl data-[state=active]:bg-background data-[state=active]:shadow-sm"
          >
            <User className="mr-2 h-4 w-4" /> Account
          </TabsTrigger>
        </TabsList>

        <TabsContent value="security" className="space-y-4 mt-6">
          <Card className="rounded-2xl border shadow-sm">
            <CardContent className="p-0">
              {securityItems.map((item, idx) => (
                <div key={item.key}>
                  <button
                    onClick={() => navigate(item.path)}
                    className="w-full flex items-center gap-4 p-5 hover:bg-slate-50 transition-all duration-200 text-left group"
                  >
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 group-hover:scale-105 transition-transform">
                      <item.icon className="h-6 w-6" />
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-slate-900">{item.label}</p>
                      <p className="text-sm text-slate-500">{item.description}</p>
                    </div>
                    <ChevronRight className="h-5 w-5 text-slate-300 group-hover:text-indigo-500" />
                  </button>
                  {idx < securityItems.length - 1 && <Separator />}
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="account" className="space-y-4 mt-6">
          <Card className="rounded-2xl border shadow-sm">
            <CardHeader className="border-b px-6 py-4">
              <CardTitle className="text-lg">Profile Details</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {[
                {
                  icon: User,
                  label: "Full Name",
                  value: Array.isArray(profile?.full_name) ? profile.full_name[0] : profile?.full_name,
                },
                {
                  icon: Fingerprint,
                  label: "User Code",
                  value: Array.isArray(profile?.user_code) ? profile.user_code[0] : profile?.user_code,
                  isBadge: true,
                },
                { icon: Mail, label: "Email Address", value: profile?.email },
                { icon: Lock, label: "Account Type", value: profile?.user_type, isBadge: true },
              ].map((item, idx) => (
                <div key={idx} className="flex items-center gap-4 p-5 border-b last:border-b-0">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100">
                    <item.icon className="h-5 w-5 text-slate-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold">{item.label}</p>
                    {item.isBadge ? (
                      <Badge variant="outline" className="mt-1 px-3 py-1">
                        {item.value}
                      </Badge>
                    ) : (
                      <p className="font-medium text-slate-900">{item.value}</p>
                    )}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Button variant="destructive" className="w-full rounded-xl py-6 gap-2" onClick={() => signOut()}>
            <LogOut className="h-4 w-4" /> Sign Out
          </Button>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AccountSettings;
