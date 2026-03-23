import { useState } from "react";
import { Outlet, NavLink, useNavigate, useLocation } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import {
  LayoutDashboard, Users, Wallet, LogOut, Menu, X, ChevronLeft,
  ShieldCheck, Fingerprint, UserCheck, Building2, Edit, UserPlus,
  FileText, Layers, IndianRupee, Settings, Landmark, Megaphone,
  Briefcase, LifeBuoy, Bell, HelpCircle, BarChart3, CreditCard,
  Clock, BadgeCheck, Monitor, MessageSquareQuote, Wifi,
  SlidersHorizontal, Eye, ClipboardCheck, Star, ArrowUpCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";

type NavItem = { label: string; icon: React.ElementType; path: string; badge?: number };

const navSections: { title: string; items: NavItem[] }[] = [
  {
    title: "Overview",
    items: [
      { label: "Dashboard", icon: LayoutDashboard, path: "/admin/dashboard" },
      { label: "My Wallet", icon: Wallet, path: "/admin/wallet" },
    ],
  },
  {
    title: "User Management",
    items: [
      { label: "All Users", icon: Users, path: "/admin/users" },
      { label: "Employees", icon: UserCheck, path: "/admin/employees" },
      { label: "Clients", icon: Building2, path: "/admin/clients" },
      { label: "Profile Edits", icon: Edit, path: "/admin/profile-edits" },
      { label: "Sessions", icon: Monitor, path: "/admin/sessions" },
      { label: "Online Status", icon: Wifi, path: "/admin/online-status" },
    ],
  },
  {
    title: "Financial",
    items: [
      { label: "Withdrawals", icon: Wallet, path: "/admin/withdrawals" },
      { label: "Wallet Mgmt", icon: IndianRupee, path: "/admin/wallet-management" },
      { label: "Wallet Types", icon: Wallet, path: "/admin/wallet-types" },
      { label: "Payment Methods", icon: CreditCard, path: "/admin/payment-methods" },
      { label: "Banks", icon: Landmark, path: "/admin/banks" },
    ],
  },
  {
    title: "Verification",
    items: [
      { label: "Aadhaar Verify", icon: Fingerprint, path: "/admin/verifications" },
      { label: "Bank Verify", icon: Landmark, path: "/admin/bank-verifications" },
      { label: "Validation", icon: BadgeCheck, path: "/admin/validation" },
    ],
  },
  {
    title: "Projects & Work",
    items: [
      { label: "Jobs", icon: Briefcase, path: "/admin/jobs" },
      { label: "Attendance", icon: ClipboardCheck, path: "/admin/attendance" },
      { label: "Services", icon: Layers, path: "/admin/services" },
    ],
  },
  {
    title: "Communication",
    items: [
      { label: "Help & Support", icon: HelpCircle, path: "/admin/help-support" },
      { label: "Support Reports", icon: BarChart3, path: "/admin/support-reporting" },
      { label: "Recovery", icon: LifeBuoy, path: "/admin/recovery-requests" },
      { label: "Notifications", icon: Bell, path: "/admin/notifications" },
      { label: "Announcements", icon: Megaphone, path: "/admin/announcements" },
    ],
  },
  {
    title: "Security & Monitoring",
    items: [
      { label: "IP Blocking", icon: ShieldCheck, path: "/admin/ip-blocking" },
      { label: "App Installs", icon: Monitor, path: "/admin/pwa-installs" },
    ],
  },
  {
    title: "Content & Config",
    items: [
      { label: "Hero Slideshow", icon: SlidersHorizontal, path: "/admin/hero-slides" },
      { label: "Testimonials", icon: MessageSquareQuote, path: "/admin/testimonials" },
      { label: "User Reviews", icon: Star, path: "/admin/reviews" },
      { label: "Legal Docs", icon: FileText, path: "/admin/legal-documents" },
      { label: "Countdowns", icon: Clock, path: "/admin/countdowns" },
      { label: "Referrals", icon: UserPlus, path: "/admin/referrals" },
      { label: "Site Visitors", icon: Eye, path: "/admin/visitors" },
      { label: "Settings", icon: Settings, path: "/admin/settings" },
    ],
  },
];

// Flatten for breadcrumb lookup
const allNavItems = navSections.flatMap(s => s.items);

const AdminLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const currentNav = allNavItems.find((item) => location.pathname === item.path);
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
        <div className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r bg-card transition-transform lg:static lg:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Logo Header */}
        <div className="flex items-center gap-2.5 border-b px-5 py-4">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
            <ShieldCheck className="h-4.5 w-4.5 text-primary" />
          </div>
          <div className="flex-1">
            <span className="text-base font-bold text-foreground">Bank Manager</span>
            <p className="text-[10px] text-muted-foreground leading-none">Admin Panel</p>
          </div>
          <button className="lg:hidden" onClick={() => setSidebarOpen(false)}>
            <X className="h-5 w-5 text-muted-foreground" />
          </button>
        </div>

        {/* Nav Sections */}
        <ScrollArea className="flex-1">
          <nav className="flex flex-col gap-0.5 p-3">
            {navSections.map((section, idx) => (
              <div key={section.title} className={cn(idx > 0 && "mt-4")}>
                <p className="mb-1.5 px-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60">
                  {section.title}
                </p>
                {section.items.map((item) => (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    onClick={() => setSidebarOpen(false)}
                    className={({ isActive }) =>
                      cn(
                        "flex items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] font-medium transition-all duration-200",
                        isActive
                          ? "bg-primary/10 text-primary shadow-sm"
                          : "text-muted-foreground hover:bg-muted hover:text-foreground"
                      )
                    }
                  >
                    <item.icon className="h-4 w-4 shrink-0" />
                    <span className="truncate">{item.label}</span>
                    {item.path === "/admin/recovery-requests" && pendingRecoveryCount > 0 && (
                      <span className="ml-auto inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-destructive px-1.5 text-[10px] font-bold text-destructive-foreground">
                        {pendingRecoveryCount}
                      </span>
                    )}
                  </NavLink>
                ))}
              </div>
            ))}
          </nav>
        </ScrollArea>

        {/* Logout */}
        <div className="border-t p-3">
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] text-destructive transition-colors hover:bg-destructive/10"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex flex-1 flex-col">
        <header className="sticky top-0 z-30 flex items-center gap-3 border-b bg-card/95 backdrop-blur-sm px-4 py-3 lg:px-6">
          <button className="lg:hidden" onClick={() => setSidebarOpen(true)}>
            <Menu className="h-5 w-5 text-muted-foreground" />
          </button>
          <h1 className="text-lg font-bold text-primary lg:hidden">Bank Manager</h1>
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
