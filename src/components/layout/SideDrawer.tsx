import {
  Settings, User, Bell, FileText, Shield, LogOut, Gift, Smartphone,
  Coins, Star, Wallet, ChevronRight, Sparkles,
} from "lucide-react";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle,
} from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";

interface SideDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const SideDrawer = ({ open, onOpenChange }: SideDrawerProps) => {
  const { signOut, profile } = useAuth();
  const navigate = useNavigate();

  const basePath = profile?.user_type === "client" ? "/client" : "/employee";
  const initials = profile?.full_name?.[0]?.slice(0, 2)?.toUpperCase() || "U";

  const menuSections = [
    {
      title: "Account",
      items: [
        { label: "Profile", icon: User, path: `${basePath}/profile`, color: "text-primary" },
        { label: "Account Settings", icon: Settings, path: `${basePath}/settings`, color: "text-muted-foreground" },
        { label: "Notification Settings", icon: Bell, path: `${basePath}/notification-settings`, color: "text-muted-foreground" },
      ],
    },
    {
      title: "Rewards & More",
      items: [
        { label: "Write a Review", icon: Star, path: `${basePath}/review`, color: "text-warning" },
        { label: "Get Free", icon: Gift, path: `${basePath}/get-free`, color: "text-accent" },
        { label: "Get Coins", icon: Coins, path: `${basePath}/get-coins`, color: "text-warning" },
        { label: "Wallet Types", icon: Wallet, path: `${basePath}/wallet-types`, color: "text-primary" },
      ],
    },
    {
      title: "App & Legal",
      items: [
        { label: "Install App", icon: Smartphone, path: `${basePath}/app`, color: "text-muted-foreground" },
        { label: "Terms of Service", icon: FileText, path: "/legal/terms-of-service", color: "text-muted-foreground" },
        { label: "Privacy Policy", icon: Shield, path: "/legal/privacy-policy", color: "text-muted-foreground" },
      ],
    },
  ];

  const handleLogout = async () => {
    onOpenChange(false);
    await signOut();
    navigate("/login");
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-80 bg-card p-0 flex flex-col">
        {/* Profile Header */}
        <div className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary/90 to-primary/70" />
          <div className="absolute -right-8 -top-8 h-28 w-28 rounded-full bg-primary-foreground/10 blur-2xl" />
          <div className="relative z-10 p-5 pt-6">
            <SheetHeader className="space-y-0">
              <div className="flex items-center gap-3">
                <Avatar className="h-12 w-12 border-2 border-primary-foreground/30 shadow-lg">
                  <AvatarFallback className="bg-primary-foreground/20 text-primary-foreground font-bold text-sm">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <SheetTitle className="text-left text-base font-bold text-primary-foreground truncate">
                    {profile?.full_name?.[0] || "User"}
                  </SheetTitle>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <Badge variant="secondary" className="bg-primary-foreground/20 text-primary-foreground/90 border-0 text-[10px] px-1.5 py-0 h-4">
                      {profile?.user_code?.[0] || ""}
                    </Badge>
                    <Badge variant="secondary" className="bg-primary-foreground/15 text-primary-foreground/80 border-0 text-[10px] px-1.5 py-0 h-4 capitalize">
                      {profile?.user_type || "user"}
                    </Badge>
                  </div>
                </div>
              </div>
            </SheetHeader>
          </div>
        </div>

        {/* Menu Sections */}
        <div className="flex-1 overflow-y-auto px-3 py-3 space-y-1">
          {menuSections.map((section, idx) => (
            <div key={section.title}>
              {idx > 0 && <Separator className="my-2" />}
              <p className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground/70 px-3 py-1.5">
                {section.title}
              </p>
              <nav className="space-y-0.5">
                {section.items.map((item) => (
                  <button
                    key={item.label}
                    className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-foreground transition-all hover:bg-muted/80 active:scale-[0.98] group"
                    onClick={() => { onOpenChange(false); navigate(item.path); }}
                  >
                    <div className={cn("flex h-8 w-8 items-center justify-center rounded-lg bg-muted/60 transition-colors group-hover:bg-muted", item.color)}>
                      <item.icon className="h-4 w-4" />
                    </div>
                    <span className="flex-1 text-left font-medium">{item.label}</span>
                    <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/40 group-hover:text-muted-foreground transition-colors" />
                  </button>
                ))}
              </nav>
            </div>
          ))}
        </div>

        {/* Logout */}
        <div className="p-3 border-t border-border/50">
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-destructive transition-all hover:bg-destructive/10 active:scale-[0.98] group"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-destructive/10 group-hover:bg-destructive/15">
              <LogOut className="h-4 w-4" />
            </div>
            <span className="font-medium">Logout</span>
          </button>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default SideDrawer;
