import { ShieldX } from "lucide-react";

const BlockedScreen = () => (
  <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-background">
    <div className="mx-4 max-w-md text-center space-y-4">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
        <ShieldX className="h-8 w-8 text-destructive" />
      </div>
      <h1 className="text-2xl font-bold text-foreground">Access Restricted</h1>
      <p className="text-muted-foreground">
        Access to this website has been restricted. If you believe this is an
        error, please contact support.
      </p>
    </div>
  </div>
);

export default BlockedScreen;
