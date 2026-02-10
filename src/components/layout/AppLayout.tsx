import { useState } from "react";
import { Outlet } from "react-router-dom";
import BottomTabBar from "./BottomTabBar";
import SideDrawer from "./SideDrawer";

interface AppLayoutProps {
  userType: "employee" | "client";
}

const AppLayout = ({ userType }: AppLayoutProps) => {
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <main className="flex-1 pb-20">
        <Outlet />
      </main>
      <BottomTabBar userType={userType} onMenuClick={() => setDrawerOpen(true)} />
      <SideDrawer open={drawerOpen} onOpenChange={setDrawerOpen} />
    </div>
  );
};

export default AppLayout;
