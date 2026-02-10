import { Clock, Mail, Phone, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const VerificationPending = () => {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b bg-card/80 backdrop-blur-md pt-safe">
        <div className="mx-auto flex h-14 max-w-lg items-center gap-3 px-4">
          <Link to="/">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <span className="font-semibold text-foreground">Verification Status</span>
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-lg flex-1 flex-col items-center justify-center px-4 py-8">
        <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-warning/10">
          <Clock className="h-10 w-10 text-warning" />
        </div>

        <h1 className="mb-2 text-2xl font-bold text-foreground">Verification Pending</h1>
        <p className="mb-8 text-center text-sm text-muted-foreground">
          Your account is being reviewed by our admin team. You will be notified once your account is approved.
        </p>

        <Card className="w-full">
          <CardContent className="p-6">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                  <Clock className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">Estimated Approval Time</p>
                  <p className="text-xs text-muted-foreground">Within 6 hours of registration</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent/10">
                  <Phone className="h-5 w-5 text-accent" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">WhatsApp Notification</p>
                  <p className="text-xs text-muted-foreground">You'll receive a message on approval</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted">
                  <Mail className="h-5 w-5 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">Email Confirmation</p>
                  <p className="text-xs text-muted-foreground">Check your inbox for updates</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="mt-6 flex w-full flex-col gap-3">
          <Link to="/login" className="w-full">
            <Button variant="outline" className="w-full">
              Go to Login
            </Button>
          </Link>
          <Link to="/" className="w-full">
            <Button variant="ghost" className="w-full">
              Back to Home
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default VerificationPending;
