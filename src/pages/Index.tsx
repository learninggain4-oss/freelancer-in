import { useEffect } from "react";
import { Briefcase, Shield, MessageCircle, CreditCard, Users, ArrowRight } from "lucide-react";
import { Link, Navigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";

const features = [
  { icon: Shield, title: "Verified Profiles", description: "WhatsApp-verified users with admin approval for authentic interactions." },
  { icon: Briefcase, title: "Project Management", description: "End-to-end project tracking from inquiry to validation and completion." },
  { icon: CreditCard, title: "Secure Payments", description: "Integrated UPI and bank transfers with transparent balance tracking." },
  { icon: MessageCircle, title: "Real-time Chat", description: "In-app messaging for seamless project discussions and validation." },
];

const Index = () => {
  const { user, profile, loading, refreshProfile } = useAuth();

  // Auto-refresh every 10 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      refreshProfile();
    }, 10000);
    return () => clearInterval(interval);
  }, [refreshProfile]);
  // Redirect logged-in approved users to their dashboard
  if (!loading && user && profile) {
    if (profile.approval_status === "approved") {
      const base = profile.user_type === "employee" ? "/employee" : "/client";
      return <Navigate to={`${base}/dashboard`} replace />;
    }
    if (profile.approval_status === "pending" || profile.approval_status === "rejected") {
      return <Navigate to="/verification-pending" replace />;
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b bg-card/80 backdrop-blur-md pt-safe">
        <div className="mx-auto flex h-14 max-w-lg items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <Briefcase className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="text-lg font-bold text-foreground">Freelancer</span>
          </div>
          <Link to="/login">
            <Button variant="ghost" size="sm">Login</Button>
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="px-4 pb-8 pt-12">
        <div className="mx-auto max-w-lg text-center">
          <div className="mb-4 inline-flex items-center gap-1.5 rounded-full border bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
            <Users className="h-3 w-3" /> Trusted by professionals
          </div>
          <h1 className="mb-3 text-3xl font-extrabold leading-tight tracking-tight text-foreground sm:text-4xl">
            Connect. Collaborate. <span className="text-primary">Get Paid.</span>
          </h1>
          <p className="mb-8 text-base text-muted-foreground">
            The all-in-one platform connecting skilled freelancers with clients. Manage projects, communicate in real-time, and handle payments seamlessly.
          </p>
          <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Link to="/register/employee" className="w-full sm:w-auto">
              <Button size="lg" className="w-full gap-2">Join as Employee <ArrowRight className="h-4 w-4" /></Button>
            </Link>
            <Link to="/register/client" className="w-full sm:w-auto">
              <Button size="lg" variant="outline" className="w-full gap-2">Join as Client <ArrowRight className="h-4 w-4" /></Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="px-4 py-8">
        <div className="mx-auto max-w-lg">
          <h2 className="mb-6 text-center text-xl font-bold text-foreground">Everything you need</h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {features.map((feature) => (
              <Card key={feature.title} className="border bg-card transition-shadow hover:shadow-md">
                <CardContent className="flex gap-3 p-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                    <feature.icon className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-foreground">{feature.title}</h3>
                    <p className="mt-0.5 text-xs text-muted-foreground">{feature.description}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-4 py-8">
        <div className="mx-auto max-w-lg">
          <Card className="overflow-hidden border-primary/20 bg-primary/5">
            <CardContent className="p-6 text-center">
              <h2 className="mb-2 text-lg font-bold text-foreground">Ready to get started?</h2>
              <p className="mb-4 text-sm text-muted-foreground">Create your account and start working on projects today.</p>
              <Link to="/register/employee">
                <Button size="lg" className="gap-2">Create Free Account <ArrowRight className="h-4 w-4" /></Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto border-t bg-card px-4 py-6">
        <div className="mx-auto max-w-lg text-center">
          <div className="mb-3 flex items-center justify-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded bg-primary">
              <Briefcase className="h-3 w-3 text-primary-foreground" />
            </div>
            <span className="text-sm font-bold text-foreground">Freelancer</span>
          </div>
          <p className="text-xs text-muted-foreground">© 2026 Freelancer. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
