import { useState } from "react";
import { Outlet } from "react-router-dom";
import BottomTabBar from "./BottomTabBar";
import SideDrawer from "./SideDrawer";
import NotificationBell from "@/components/notifications/NotificationBell";

interface AppLayoutProps {
  userType: "employee" | "client";
}

const AppLayout = ({ userType }: AppLayoutProps) => {
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="sticky top-0 z-30 flex items-center justify-between border-b bg-card px-4 py-2">
        <h1 className="text-lg font-bold text-primary">Freelancer</h1>
        <NotificationBell />
      </header>
      <main className="flex-1 pb-20">
        <Outlet />
      </main>
      <BottomTabBar userType={userType} onMenuClick={() => setDrawerOpen(true)} />
      <SideDrawer open={drawerOpen} onOpenChange={setDrawerOpen} />
    </div>
  );
};

export default AppLayout;
