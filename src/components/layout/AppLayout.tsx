import { useState } from "react";
import { Outlet } from "react-router-dom";
import BottomTabBar from "./BottomTabBar";
import SideDrawer from "./SideDrawer";
import NotificationBell from "@/components/notifications/NotificationBell";
import ChatBotPopup from "@/components/chatbot/ChatBotPopup";

interface AppLayoutProps {
  userType: "employee" | "client";
}

const AppLayout = ({ userType }: AppLayoutProps) => {
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <div className="flex min-h-[100dvh] flex-col bg-background">
      <header className="sticky top-0 z-30 border-b bg-card/95 backdrop-blur-md pt-safe">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary shadow-sm">
              <span className="text-sm font-bold text-primary-foreground">F</span>
            </div>
            <h1 className="text-lg font-bold tracking-tight text-foreground">Freelancer</h1>
          </div>
          <NotificationBell />
        </div>
      </header>
      <main className="mx-auto w-full max-w-5xl flex-1 overflow-y-auto pb-20">
        <Outlet />
      </main>
      <BottomTabBar userType={userType} onMenuClick={() => setDrawerOpen(true)} />
      <SideDrawer open={drawerOpen} onOpenChange={setDrawerOpen} />
      <ChatBotPopup />
    </div>
  );
};

export default AppLayout;
