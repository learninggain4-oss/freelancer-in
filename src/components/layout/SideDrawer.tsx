import { Settings, HelpCircle, Bell, FileText, Shield, LogOut } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";

interface SideDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const menuItems = [
  { label: "Account Settings", icon: Settings, path: "/settings" },
  { label: "Help & Support", icon: HelpCircle, path: "/help" },
  { label: "Notification Settings", icon: Bell, path: "/notifications" },
  { label: "Terms & Conditions", icon: FileText, path: "/terms" },
  { label: "Privacy Policy", icon: Shield, path: "/privacy" },
];

const SideDrawer = ({ open, onOpenChange }: SideDrawerProps) => {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-72 bg-card">
        <SheetHeader>
          <SheetTitle className="text-left text-lg font-bold text-foreground">
            Freelancer
          </SheetTitle>
        </SheetHeader>
        <Separator className="my-4" />
        <nav className="flex flex-col gap-1">
          {menuItems.map((item) => (
            <button
              key={item.label}
              className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-foreground transition-colors hover:bg-muted"
              onClick={() => onOpenChange(false)}
            >
              <item.icon className="h-4 w-4 text-muted-foreground" />
              <span>{item.label}</span>
            </button>
          ))}
        </nav>
        <Separator className="my-4" />
        <button className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-destructive transition-colors hover:bg-destructive/10">
          <LogOut className="h-4 w-4" />
          <span>Logout</span>
        </button>
      </SheetContent>
    </Sheet>
  );
};

export default SideDrawer;
