import { Clock, Mail, ArrowLeft, LogOut } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";

const VerificationPending = () => {
  const { profile, signOut } = useAuth();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
      <div className="mx-auto w-full max-w-sm">
        <Card className="border-warning/30 bg-warning/5">
          <CardContent className="flex flex-col items-center p-6 text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-warning/10">
              <Clock className="h-8 w-8 text-warning" />
            </div>
            <h1 className="mb-2 text-xl font-bold text-foreground">
              {profile?.approval_status === "rejected" ? "Registration Rejected" : "Verification Pending"}
            </h1>
            {profile?.approval_status === "rejected" ? (
              <p className="mb-1 text-sm text-muted-foreground">
                Your registration has been rejected.
                {profile.approval_notes && (
                  <span className="mt-2 block rounded bg-destructive/10 p-2 text-xs text-destructive">
                    Reason: {profile.approval_notes}
                  </span>
                )}
              </p>
            ) : (
              <>
                <p className="mb-1 text-sm text-muted-foreground">
                  Your account is under review. Admin approval typically takes up to <strong>6 hours</strong>.
                </p>
                {profile?.user_code && (
                  <p className="mt-2 text-xs text-muted-foreground">
                    Your code: <span className="font-mono font-bold text-primary">{profile.user_code}</span>
                  </p>
                )}
              </>
            )}
            <div className="mt-4 flex items-center gap-2 rounded-lg bg-muted p-3">
              <Mail className="h-4 w-4 shrink-0 text-muted-foreground" />
              <p className="text-xs text-muted-foreground">
                You'll receive a notification once your account is approved.
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="mt-4 flex flex-col gap-2">
          <Button variant="outline" onClick={signOut} className="w-full gap-2">
            <LogOut className="h-4 w-4" /> Sign Out
          </Button>
          <Link to="/">
            <Button variant="ghost" size="sm" className="w-full gap-1">
              <ArrowLeft className="h-4 w-4" /> Back to Home
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default VerificationPending;
