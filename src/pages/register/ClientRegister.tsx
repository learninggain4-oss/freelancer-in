import { Briefcase } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const ClientRegister = () => {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
      <div className="mx-auto w-full max-w-sm text-center">
        <div className="mb-6 flex flex-col items-center gap-2">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary">
            <Briefcase className="h-6 w-6 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">Client Registration</h1>
          <p className="text-sm text-muted-foreground">Registration form coming in Phase 2.</p>
        </div>
        <Link to="/">
          <Button variant="ghost" size="sm">← Back to Home</Button>
        </Link>
      </div>
    </div>
  );
};

export default ClientRegister;
