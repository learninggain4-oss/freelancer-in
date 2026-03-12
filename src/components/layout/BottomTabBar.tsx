import { Home, Briefcase, Wallet, CircleHelp, Menu, ClipboardCheck, FileText, MessagesSquare, Crown } from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";

interface BottomTabBarProps {
  userType: "employee" | "client";
  onMenuClick: () => void;
}

const BottomTabBar = ({ userType, onMenuClick }: BottomTabBarProps) => {
  const location = useLocation();
  const base = userType === "employee" ? "/employee" : "/client";

  const tabs = userType === "employee"
    ? [
        { label: "Dashboard", icon: Home, path: `${base}/dashboard` },
        { label: "Jobs", icon: Briefcase, path: `${base}/projects` },
        { label: "Attendance", icon: ClipboardCheck, path: `${base}/attendance` },
        { label: "Requests", icon: FileText, path: `${base}/requests` },
        { label: "Wallet", icon: Wallet, path: `${base}/wallet` },
        { label: "Messages", icon: MessagesSquare, path: `${base}/help-support` },
      ]
    : [
        { label: "Dashboard", icon: Home, path: `${base}/dashboard` },
        { label: "Attendance", icon: ClipboardCheck, path: `${base}/attendance` },
        { label: "Jobs", icon: Briefcase, path: `${base}/projects` },
        { label: "Wallet", icon: Wallet, path: `${base}/wallet` },
        { label: "Help", icon: CircleHelp, path: `${base}/help-support` },
      ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t bg-card/95 backdrop-blur-md pb-safe">
      <div className="mx-auto flex h-16 max-w-lg items-center justify-around">
        {tabs.map((tab) => {
          const isActive = location.pathname.startsWith(tab.path);
          return (
            <NavLink
              key={tab.path}
              to={tab.path}
              className={cn(
                "nav-link flex flex-1 flex-col items-center justify-center gap-0.5 py-2 text-[10px] font-medium transition-all duration-200",
                isActive
                  ? "text-primary scale-105"
                  : "text-muted-foreground active:text-foreground"
              )}
            >
              <div className={cn(
                "flex items-center justify-center rounded-full p-1 transition-all duration-200",
                isActive && "bg-primary/10"
              )}>
                <tab.icon className={cn("h-5 w-5", isActive && "stroke-[2.5]")} />
              </div>
              <span>{tab.label}</span>
            </NavLink>
          );
        })}
        <button
          onClick={onMenuClick}
          className="nav-link flex flex-1 flex-col items-center justify-center gap-0.5 py-2 text-[10px] font-medium text-muted-foreground transition-all duration-200 active:text-foreground"
        >
          <div className="flex items-center justify-center rounded-full p-1">
            <Menu className="h-5 w-5" />
          </div>
          <span>Menu</span>
        </button>
      </div>
    </nav>
  );
};

export default BottomTabBar;
