import { useState } from "react";
import { Outlet, NavLink, useNavigate, useLocation } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import {
  LayoutDashboard,
  Users,
  Wallet,
  LogOut,
  Menu,
  X,
  ChevronLeft,
  ShieldCheck,
  Fingerprint,
  UserCheck,
  Building2,
  Edit,
  FileText,
  Layers,
  IndianRupee,
  Settings,
  Landmark,
  Megaphone,
  Briefcase,
  LifeBuoy,
  Bell,
  HelpCircle,
  BarChart3,
  CreditCard,
  Clock,
  BadgeCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const navItems = [
  { label: "Overview", icon: LayoutDashboard, path: "/admin/dashboard" },
  { label: "Users", icon: Users, path: "/admin/users" },
  { label: "Employees", icon: UserCheck, path: "/admin/employees" },
  { label: "Clients", icon: Building2, path: "/admin/clients" },
  { label: "Profile Edits", icon: Edit, path: "/admin/profile-edits" },
  { label: "Withdrawals", icon: Wallet, path: "/admin/withdrawals" },
  { label: "Wallet Mgmt", icon: IndianRupee, path: "/admin/wallet-management" },
  { label: "Aadhaar Verify", icon: Fingerprint, path: "/admin/verifications" },
  { label: "Bank Verify", icon: Landmark, path: "/admin/bank-verifications" },
  { label: "Jobs", icon: Briefcase, path: "/admin/jobs" },
  { label: "Recovery", icon: LifeBuoy, path: "/admin/recovery-requests" },
  { label: "Help & Support", icon: HelpCircle, path: "/admin/help-support" },
  { label: "Support Reports", icon: BarChart3, path: "/admin/support-reporting" },
  { label: "Validation", icon: BadgeCheck, path: "/admin/validation" },
  { label: "Payment Methods", icon: CreditCard, path: "/admin/payment-methods" },
  { label: "Countdowns", icon: Clock, path: "/admin/countdowns" },
  { label: "Services", icon: Layers, path: "/admin/services" },
  { label: "Legal Docs", icon: FileText, path: "/admin/legal-documents" },
  { label: "Notifications", icon: Bell, path: "/admin/notifications" },
  { label: "Announcements", icon: Megaphone, path: "/admin/announcements" },
  { label: "Settings", icon: Settings, path: "/admin/settings" },
];

const AdminLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const currentNav = navItems.find((item) => location.pathname === item.path);
  const isSubPage = location.pathname !== "/admin/dashboard";

  const { data: pendingRecoveryCount = 0 } = useQuery({
    queryKey: ["admin-recovery-pending-count"],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("recovery_requests")
        .select("*", { count: "exact", head: true })
        .eq("status", "pending");
      if (error) throw error;
      return count || 0;
    },
    refetchInterval: 30000,
  });

  const handleLogout = async () => {
    await signOut();
    navigate("/login");
  };

  return (
    <div className="flex min-h-screen bg-background">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r bg-card transition-transform lg:static lg:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex items-center gap-2 border-b px-5 py-4">
          <ShieldCheck className="h-6 w-6 text-primary" />
          <span className="text-lg font-bold text-foreground">Admin Panel</span>
          <button
            className="ml-auto lg:hidden"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="h-5 w-5 text-muted-foreground" />
          </button>
        </div>

        <nav className="flex flex-1 flex-col gap-1 p-3">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-300 ease-out",
                  isActive
                    ? "bg-primary/10 text-primary shadow-sm scale-[1.02]"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )
              }
            >
              <item.icon className="h-4 w-4" />
              {item.label}
              {item.path === "/admin/recovery-requests" && pendingRecoveryCount > 0 && (
                <span className="ml-auto inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-destructive px-1.5 text-[10px] font-bold text-destructive-foreground">
                  {pendingRecoveryCount}
                </span>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="border-t p-3">
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-destructive transition-colors hover:bg-destructive/10"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex flex-1 flex-col">
        <header className="sticky top-0 z-30 flex items-center gap-3 border-b bg-card px-4 py-3 lg:px-6">
          <button
            className="lg:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-5 w-5 text-muted-foreground" />
          </button>
          <h1 className="text-lg font-bold text-primary lg:hidden">Admin</h1>
          {isSubPage && (
            <div className="ml-auto flex items-center gap-1.5 text-sm lg:ml-0">
              <button
                onClick={() => navigate("/admin/dashboard")}
                className="flex items-center gap-1 text-muted-foreground transition-colors hover:text-foreground"
              >
                <ChevronLeft className="h-4 w-4" />
                <span className="hidden sm:inline">Dashboard</span>
              </button>
              {currentNav && (
                <>
                  <span className="text-muted-foreground">/</span>
                  <span className="font-medium text-foreground">{currentNav.label}</span>
                </>
              )}
            </div>
          )}
        </header>
        <main className="flex-1 p-4 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
