import { Home, Briefcase, Wallet, User, Menu } from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";

interface BottomTabBarProps {
  userType: "employee" | "client";
  onMenuClick: () => void;
}

const BottomTabBar = ({ userType, onMenuClick }: BottomTabBarProps) => {
  const location = useLocation();
  const base = userType === "employee" ? "/employee" : "/client";

  const tabs = [
    { label: "Dashboard", icon: Home, path: `${base}/dashboard` },
    { label: "Projects", icon: Briefcase, path: `${base}/projects` },
    { label: "Wallet", icon: Wallet, path: `${base}/wallet` },
    { label: "Profile", icon: User, path: `${base}/profile` },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t bg-card pb-safe">
      <div className="mx-auto flex h-16 max-w-lg items-center justify-around">
        {tabs.map((tab) => {
          const isActive = location.pathname.startsWith(tab.path);
          return (
            <NavLink
              key={tab.path}
              to={tab.path}
              className={cn(
                "flex flex-col items-center justify-center gap-0.5 px-3 py-2 text-xs transition-colors",
                isActive
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <tab.icon className="h-5 w-5" />
              <span>{tab.label}</span>
            </NavLink>
          );
        })}
        <button
          onClick={onMenuClick}
          className="flex flex-col items-center justify-center gap-0.5 px-3 py-2 text-xs text-muted-foreground transition-colors hover:text-foreground"
        >
          <Menu className="h-5 w-5" />
          <span>Menu</span>
        </button>
      </div>
    </nav>
  );
};

export default BottomTabBar;
