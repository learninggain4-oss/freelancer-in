import {
  Settings, User, Bell, FileText, Shield, LogOut, Gift, Smartphone,
  Coins, Star, Wallet, ChevronRight,
} from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate, useLocation } from "react-router-dom";
import { DashboardTheme } from "@/hooks/use-dashboard-theme";

const A1 = "#6366f1";
const A2 = "#8b5cf6";

interface SideDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  theme?: DashboardTheme;
}

const SideDrawer = ({ open, onOpenChange, theme = "black" }: SideDrawerProps) => {
  const { signOut, profile } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const isDark = theme === "black" || theme === "wb";
  const drawerBg    = isDark ? "#0d0d24"                    : "#ffffff";
  const borderColor = isDark ? "rgba(255,255,255,.07)"      : "rgba(0,0,0,.09)";
  const secTitle    = isDark ? "rgba(255,255,255,.25)"      : "#9ca3af";
  const itemFg      = isDark ? "rgba(255,255,255,.75)"      : "#374151";
  const itemHover   = isDark ? "rgba(255,255,255,.05)"      : "rgba(0,0,0,.04)";
  const chevronFg   = isDark ? "rgba(255,255,255,.18)"      : "rgba(0,0,0,.2)";
  const dividerBg   = isDark ? "rgba(255,255,255,.05)"      : "rgba(0,0,0,.06)";
  const nameFg      = isDark ? "white"                      : "#0d0d24";
  const iconBoxBg   = isDark ? "rgba(255,255,255,.06)"      : "#f1f5f9";

  const basePath = profile?.user_type === "client" ? "/employer"
    : pathname.startsWith("/freelancer") ? "/freelancer"
    : "/employee";
  const initials = (profile?.full_name?.[0] || "U").slice(0, 2).toUpperCase();
  const userType = profile?.user_type || "user";
  const userCode = Array.isArray(profile?.user_code) ? profile.user_code[0] : (profile?.user_code || "");

  const menuSections = [
    {
      title: "Account",
      items: [
        { label: "My Profile",             icon: User,       path: `${basePath}/profile`,              color: A1 },
        { label: "Account Settings",       icon: Settings,   path: `${basePath}/settings`,             color: isDark ? "rgba(255,255,255,.5)" : "#6b7280" },
        { label: "Notification Settings",  icon: Bell,       path: `${basePath}/notification-settings`,color: "#f59e0b" },
      ],
    },
    {
      title: "Rewards & More",
      items: [
        { label: "Write a Review", icon: Star,       path: `${basePath}/review`,       color: "#f59e0b" },
        { label: "Get Free",       icon: Gift,       path: `${basePath}/get-free`,     color: "#4ade80" },
        { label: "Get Coins",      icon: Coins,      path: `${basePath}/get-coins`,    color: "#f59e0b" },
        { label: "Wallet Types",   icon: Wallet,     path: `${basePath}/wallet-types`, color: A1 },
      ],
    },
    {
      title: "App & Legal",
      items: [
        { label: "Install App",       icon: Smartphone, path: `${basePath}/app`,              color: isDark ? "rgba(255,255,255,.4)" : "#6b7280" },
        { label: "Terms of Service",  icon: FileText,   path: "/legal/terms-of-service",      color: isDark ? "rgba(255,255,255,.4)" : "#6b7280" },
        { label: "Privacy Policy",    icon: Shield,     path: "/legal/privacy-policy",        color: isDark ? "rgba(255,255,255,.4)" : "#6b7280" },
      ],
    },
  ];

  const handleLogout = async () => { onOpenChange(false); await signOut(); navigate("/login"); };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" style={{ width: 300, padding: 0, display: "flex", flexDirection: "column", background: drawerBg, border: `1px solid ${borderColor}` }}>

        {/* Profile Header */}
        <div style={{ position: "relative", overflow: "hidden", padding: "24px 20px 20px" }}>
          <div style={{ position: "absolute", inset: 0, background: `linear-gradient(135deg,rgba(99,102,241,.22) 0%,rgba(139,92,246,.12) 100%)`, zIndex: 0 }} />
          <div style={{ position: "absolute", top: -20, right: -20, width: 100, height: 100, borderRadius: "50%", background: "rgba(99,102,241,.12)", filter: "blur(20px)", zIndex: 0 }} />

          <SheetHeader style={{ position: "relative", zIndex: 1 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              {/* Avatar */}
              <div style={{ width: 52, height: 52, borderRadius: 16, background: `linear-gradient(135deg,${A1},${A2})`, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 18, color: "white", border: "2px solid rgba(255,255,255,.2)", boxShadow: "0 8px 24px rgba(99,102,241,.4)", flexShrink: 0 }}>
                {initials}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <SheetTitle style={{ color: "white", fontWeight: 800, fontSize: 15, margin: 0 }}>
                  {profile?.full_name?.[0] || "User"}
                </SheetTitle>
                <div style={{ display: "flex", gap: 6, marginTop: 5, flexWrap: "wrap" }}>
                  {userCode && (
                    <span style={{ padding: "2px 8px", borderRadius: 6, background: "rgba(255,255,255,.12)", border: "1px solid rgba(255,255,255,.18)", color: "rgba(255,255,255,.75)", fontSize: 10, fontWeight: 700 }}>
                      {userCode}
                    </span>
                  )}
                  <span style={{ padding: "2px 8px", borderRadius: 6, background: "rgba(99,102,241,.22)", border: "1px solid rgba(99,102,241,.35)", color: "#c4b5fd", fontSize: 10, fontWeight: 700, textTransform: "capitalize" }}>
                    {userType}
                  </span>
                </div>
              </div>
            </div>
          </SheetHeader>
        </div>

        {/* Menu Sections */}
        <div style={{ flex: 1, overflowY: "auto", padding: "12px" }}>
          {menuSections.map((section, idx) => (
            <div key={section.title} style={{ marginTop: idx > 0 ? 18 : 0 }}>
              {idx > 0 && <div style={{ height: 1, background: dividerBg, marginBottom: 12 }} />}
              <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase", color: secTitle, padding: "0 8px 8px" }}>
                {section.title}
              </p>
              <nav style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                {section.items.map(item => (
                  <button key={item.label}
                    onClick={() => { onOpenChange(false); navigate(item.path); }}
                    style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px", borderRadius: 12, background: "none", border: "none", cursor: "pointer", width: "100%", textAlign: "left", transition: "background .15s" }}
                    onMouseEnter={e => (e.currentTarget.style.background = itemHover)}
                    onMouseLeave={e => (e.currentTarget.style.background = "none")}>
                    <div style={{ width: 34, height: 34, borderRadius: 10, background: iconBoxBg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <item.icon size={16} style={{ color: item.color }} />
                    </div>
                    <span style={{ flex: 1, fontSize: 13, fontWeight: 500, color: itemFg }}>{item.label}</span>
                    <ChevronRight size={13} style={{ color: chevronFg }} />
                  </button>
                ))}
              </nav>
            </div>
          ))}
        </div>

        {/* Logout */}
        <div style={{ padding: 12, borderTop: `1px solid ${borderColor}` }}>
          <button onClick={handleLogout}
            style={{ width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "11px 12px", borderRadius: 12, background: "rgba(239,68,68,.08)", border: "1px solid rgba(239,68,68,.15)", color: "#ef4444", cursor: "pointer", fontSize: 13, fontWeight: 600, transition: "all .15s" }}
            onMouseEnter={e => (e.currentTarget.style.background = "rgba(239,68,68,.15)")}
            onMouseLeave={e => (e.currentTarget.style.background = "rgba(239,68,68,.08)")}>
            <div style={{ width: 32, height: 32, borderRadius: 9, background: "rgba(239,68,68,.12)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <LogOut size={15} color="#ef4444" />
            </div>
            Logout
          </button>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default SideDrawer;
