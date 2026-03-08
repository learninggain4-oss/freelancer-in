import { useState, useEffect, useRef } from "react";
import { Briefcase, Shield, MessageCircle, CreditCard, Users, ArrowRight, Star, CheckCircle, Download, Smartphone, Share } from "lucide-react";
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

const stats = [
  { value: "500+", label: "Active Freelancers" },
  { value: "₹10L+", label: "Projects Completed" },
  { value: "99%", label: "Satisfaction Rate" },
];

const steps = [
  { step: "01", title: "Create Account", description: "Sign up as an employee or client with quick verification." },
  { step: "02", title: "Find Projects", description: "Browse available jobs or post your project requirements." },
  { step: "03", title: "Collaborate", description: "Work together with real-time chat and file sharing." },
  { step: "04", title: "Get Paid", description: "Receive secure payments directly to your UPI or bank account." },
];

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const Index = () => {
  const { user, profile, loading } = useAuth();
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showIOSTip, setShowIOSTip] = useState(false);
  const [showBanner, setShowBanner] = useState(false);
  const [bannerDismissed, setBannerDismissed] = useState(false);

  useEffect(() => {
    setIsIOS(/iPad|iPhone|iPod/.test(navigator.userAgent));
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setIsInstalled(true);
    }
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", handler);
    window.addEventListener("appinstalled", () => setIsInstalled(true));
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  // Show bottom banner after 5 seconds on mobile
  useEffect(() => {
    if (isInstalled || bannerDismissed) return;
    const timer = setTimeout(() => setShowBanner(true), 5000);
    return () => clearTimeout(timer);
  }, [isInstalled, bannerDismissed, deferredPrompt, isIOS]);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") setIsInstalled(true);
    setDeferredPrompt(null);
  };

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
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <Briefcase className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="text-lg font-bold text-foreground">Freelancer</span>
          </div>
          <div className="flex items-center gap-2">
            {!isInstalled && (deferredPrompt || isIOS) && (
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5"
                onClick={() => {
                  if (deferredPrompt) handleInstall();
                  else if (isIOS) setShowIOSTip((v) => !v);
                }}
              >
                <Download className="h-3.5 w-3.5" /> Install App
              </Button>
            )}
            <Link to="/register/employee">
              <Button variant="ghost" size="sm" className="hidden sm:inline-flex">Register</Button>
            </Link>
            <Link to="/login">
              <Button size="sm">Login</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* iOS Install Tip */}
      {showIOSTip && isIOS && (
        <div className="border-b bg-muted/50 px-4 py-3">
          <div className="mx-auto flex max-w-6xl items-start gap-3 text-sm">
            <Smartphone className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
            <div className="space-y-1">
              <p className="font-medium text-foreground">Install on iOS</p>
              <p className="flex items-center gap-1.5 text-muted-foreground"><Share className="h-3.5 w-3.5 text-primary" /> Tap the Share button in Safari</p>
              <p className="flex items-center gap-1.5 text-muted-foreground"><Download className="h-3.5 w-3.5 text-primary" /> Tap "Add to Home Screen"</p>
            </div>
            <button onClick={() => setShowIOSTip(false)} className="ml-auto text-xs text-muted-foreground hover:text-foreground">✕</button>
          </div>
        </div>
      )}

      {/* Hero */}
      <section className="relative overflow-hidden px-4 pb-12 pt-16 sm:px-6 md:pb-20 md:pt-24">
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-primary/5 via-transparent to-transparent" />
        <div className="absolute -right-32 -top-32 -z-10 h-96 w-96 rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute -bottom-32 -left-32 -z-10 h-96 w-96 rounded-full bg-accent/5 blur-3xl" />
        <div className="mx-auto max-w-6xl">
          <div className="mx-auto max-w-2xl text-center lg:max-w-3xl">
            <div className="mb-5 inline-flex items-center gap-1.5 rounded-full border bg-muted px-3 py-1 text-xs font-medium text-muted-foreground animate-fade-in">
              <Star className="h-3 w-3 text-warning" /> Trusted by professionals across India
            </div>
            <h1 className="mb-4 text-4xl font-extrabold leading-tight tracking-tight text-foreground sm:text-5xl lg:text-6xl">
              <HeroAnimatedText />
            </h1>
            <p className="mb-8 text-base text-muted-foreground sm:text-lg lg:text-xl animate-fade-in" style={{ animationDelay: "1.2s", animationFillMode: "both" }}>
              The all-in-one platform connecting skilled freelancers with clients. Manage projects, communicate in real-time, and handle payments seamlessly.
            </p>
            <div className="flex flex-col gap-3 sm:flex-row sm:justify-center animate-fade-in" style={{ animationDelay: "1.5s", animationFillMode: "both" }}>
              <Link to="/register/employee" className="w-full sm:w-auto">
                <Button size="lg" className="w-full gap-2 text-base sm:px-8 transition-transform hover:scale-105">
                  Join as Employee <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link to="/register/client" className="w-full sm:w-auto">
                <Button size="lg" variant="outline" className="w-full gap-2 text-base sm:px-8 transition-transform hover:scale-105">
                  Join as Client <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>

          {/* Stats */}
          <div className="mx-auto mt-12 grid max-w-md grid-cols-3 gap-4 sm:max-w-lg md:mt-16">
            {stats.map((stat, i) => (
              <div key={stat.label} className="text-center animate-fade-in" style={{ animationDelay: `${1.8 + i * 0.15}s`, animationFillMode: "both" }}>
                <AnimatedCounter value={stat.value} />
                <p className="mt-1 text-xs text-muted-foreground sm:text-sm">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="border-t bg-muted/30 px-4 py-12 sm:px-6 md:py-20">
        <div className="mx-auto max-w-6xl">
          <div className="mx-auto mb-10 max-w-lg text-center">
            <h2 className="text-2xl font-bold text-foreground sm:text-3xl">Everything you need</h2>
            <p className="mt-2 text-sm text-muted-foreground sm:text-base">
              A complete platform designed for professional freelancing
            </p>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((feature) => (
              <Card key={feature.title} className="border bg-card transition-all hover:shadow-lg hover:-translate-y-0.5">
                <CardContent className="p-5 sm:p-6">
                  <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10">
                    <feature.icon className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="text-sm font-semibold text-foreground sm:text-base">{feature.title}</h3>
                  <p className="mt-1.5 text-xs text-muted-foreground sm:text-sm leading-relaxed">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="px-4 py-12 sm:px-6 md:py-20">
        <div className="mx-auto max-w-6xl">
          <div className="mx-auto mb-10 max-w-lg text-center">
            <h2 className="text-2xl font-bold text-foreground sm:text-3xl">How it works</h2>
            <p className="mt-2 text-sm text-muted-foreground sm:text-base">Get started in four simple steps</p>
          </div>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {steps.map((s) => (
              <div key={s.step} className="relative text-center sm:text-left">
                <span className="text-4xl font-extrabold text-primary/10 sm:text-5xl">{s.step}</span>
                <h3 className="mt-1 text-sm font-semibold text-foreground sm:text-base">{s.title}</h3>
                <p className="mt-1 text-xs text-muted-foreground sm:text-sm">{s.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t bg-muted/30 px-4 py-12 sm:px-6 md:py-20">
        <div className="mx-auto max-w-6xl">
          <Card className="overflow-hidden border-0 bg-gradient-to-br from-primary to-primary/80 shadow-xl">
            <CardContent className="flex flex-col items-center gap-6 p-8 text-center sm:p-12 md:flex-row md:text-left">
              <div className="flex-1">
                <h2 className="text-xl font-bold text-primary-foreground sm:text-2xl lg:text-3xl">Ready to get started?</h2>
                <p className="mt-2 text-sm text-primary-foreground/80 sm:text-base">
                  Create your free account and start working on projects today.
                </p>
                <div className="mt-3 flex flex-wrap gap-3">
                  {["No hidden fees", "Instant setup", "Secure payments"].map((item) => (
                    <span key={item} className="inline-flex items-center gap-1 text-xs text-primary-foreground/80">
                      <CheckCircle className="h-3 w-3" /> {item}
                    </span>
                  ))}
                </div>
              </div>
              <Link to="/register/employee">
                <Button size="lg" variant="secondary" className="gap-2 whitespace-nowrap">
                  Create Free Account <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto border-t bg-card px-4 py-8 sm:px-6">
        <div className="mx-auto max-w-6xl">
          <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary">
                <Briefcase className="h-3.5 w-3.5 text-primary-foreground" />
              </div>
              <span className="text-sm font-bold text-foreground">Freelancer</span>
            </div>
            <div className="flex gap-4">
              <Link to="/legal/privacy-policy" className="text-xs text-muted-foreground hover:text-foreground transition-colors">Privacy Policy</Link>
              <Link to="/legal/terms-of-service" className="text-xs text-muted-foreground hover:text-foreground transition-colors">Terms of Service</Link>
            </div>
            <p className="text-xs text-muted-foreground">© 2026 Freelancer. All rights reserved.</p>
          </div>
        </div>
      </footer>
      {/* Install Banner */}
      {showBanner && !isInstalled && !bannerDismissed && (
        <div className="fixed inset-x-0 bottom-0 z-50 animate-slide-in-bottom p-4 pb-safe sm:hidden">
          <div className="rounded-2xl border bg-card/95 p-4 shadow-2xl backdrop-blur-lg">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                <Download className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-foreground">Install Freelancer</p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {isIOS
                    ? "Add to your home screen for the best experience"
                    : "Install for quick access & offline support"}
                </p>
                <div className="mt-3 flex gap-2">
                  <Button
                    size="sm"
                    className="h-8 gap-1.5 text-xs"
                    onClick={() => {
                      if (deferredPrompt) {
                        handleInstall();
                      } else if (isIOS) {
                        setShowIOSTip(true);
                        setShowBanner(false);
                      }
                    }}
                  >
                    <Download className="h-3.5 w-3.5" />
                    {isIOS ? "How to Install" : "Install Now"}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-8 text-xs text-muted-foreground"
                    onClick={() => { setShowBanner(false); setBannerDismissed(true); }}
                  >
                    Not now
                  </Button>
                </div>
              </div>
              <button
                onClick={() => { setShowBanner(false); setBannerDismissed(true); }}
                className="text-muted-foreground hover:text-foreground"
              >
                ✕
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Index;
