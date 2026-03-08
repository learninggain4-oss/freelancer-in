import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { Briefcase, Shield, MessageCircle, CreditCard, Users, ArrowRight, Star, CheckCircle, Download, Smartphone, Share, ChevronDown } from "lucide-react";
import { Link, Navigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

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

// Fallback companies if DB is empty or loading
const fallbackCompanies = [
  { name: "TCS", logo: "/logos/tcs.png" },
  { name: "Infosys", logo: "/logos/infosys.png" },
  { name: "Wipro", logo: "/logos/wipro.png" },
  { name: "HCL Tech", logo: "/logos/hcltech.png" },
  { name: "Tech Mahindra", logo: "/logos/techmahindra.png" },
  { name: "Accenture", logo: "/logos/accenture.png" },
  { name: "Cognizant", logo: "/logos/cognizant.png" },
  { name: "Paytm", logo: "/logos/paytm.png" },
  { name: "Reliance", logo: "/logos/reliance.png" },
  { name: "Flipkart", logo: "/logos/flipkart.png" },
  { name: "Razorpay", logo: "/logos/razorpay.png" },
  { name: "Zoho", logo: "/logos/zoho.png" },
];

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

/** Typewriter-style animated hero heading */
const HeroAnimatedText = () => {
  const words = ["Connect.", "Collaborate."];
  const [visibleWords, setVisibleWords] = useState(0);
  const [showHighlight, setShowHighlight] = useState(false);

  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];
    words.forEach((_, i) => {
      timers.push(setTimeout(() => setVisibleWords(i + 1), 300 + i * 400));
    });
    timers.push(setTimeout(() => setShowHighlight(true), 300 + words.length * 400 + 200));
    return () => timers.forEach(clearTimeout);
  }, []);

  return (
    <>
      {words.map((word, i) => (
        <span
          key={word}
          className="inline-block transition-all duration-500"
          style={{
            opacity: i < visibleWords ? 1 : 0,
            transform: i < visibleWords ? "translateY(0)" : "translateY(20px)",
            transitionDelay: `${i * 100}ms`,
          }}
        >
          {word}{" "}
        </span>
      ))}
      <span
        className="inline-block bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent transition-all duration-700"
        style={{
          opacity: showHighlight ? 1 : 0,
          transform: showHighlight ? "translateY(0) scale(1)" : "translateY(20px) scale(0.9)",
        }}
      >
        Get Paid.
      </span>
    </>
  );
};

/** Animated counter that counts up to the stat value */
const AnimatedCounter = ({ value }: { value: string }) => {
  const [display, setDisplay] = useState(value);
  const ref = useRef<HTMLParagraphElement>(null);
  const hasAnimated = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated.current) {
          hasAnimated.current = true;
          // Extract numeric part
          const numMatch = value.match(/[\d]+/);
          if (!numMatch) return;
          const target = parseInt(numMatch[0]);
          const prefix = value.slice(0, value.indexOf(numMatch[0]));
          const suffix = value.slice(value.indexOf(numMatch[0]) + numMatch[0].length);
          const duration = 1500;
          const startTime = performance.now();

          const animate = (now: number) => {
            const elapsed = now - startTime;
            const progress = Math.min(elapsed / duration, 1);
            // Ease out cubic
            const eased = 1 - Math.pow(1 - progress, 3);
            const current = Math.round(eased * target);
            setDisplay(`${prefix}${current}${suffix}`);
            if (progress < 1) requestAnimationFrame(animate);
          };
          requestAnimationFrame(animate);
        }
      },
      { threshold: 0.5 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [value]);

  return (
    <p ref={ref} className="text-2xl font-extrabold text-foreground sm:text-3xl">
      {display}
    </p>
  );
};

/** Scroll-triggered fade-in wrapper */
const ScrollFadeIn = ({ children, className = "", delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) => {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); observer.disconnect(); } },
      { threshold: 0.15 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ease-out ${className}`}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(30px)",
        transitionDelay: `${delay}ms`,
      }}
    >
      {children}
    </div>
  );
};

/** Collapsible FAQ item */
const FAQItem = ({ question, answer }: { question: string; answer: string }) => {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-lg border bg-card transition-colors">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-4 p-4 text-left sm:p-5"
      >
        <span className="text-sm font-semibold text-foreground sm:text-base">{question}</span>
        <ChevronDown
          className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        />
      </button>
      <div
        className="overflow-hidden transition-all duration-300"
        style={{ maxHeight: open ? "200px" : "0", opacity: open ? 1 : 0 }}
      >
        <p className="px-4 pb-4 text-sm leading-relaxed text-muted-foreground sm:px-5 sm:pb-5">{answer}</p>
      </div>
    </div>
  );
};

const Index = () => {
  const { user, profile, loading } = useAuth();
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showIOSTip, setShowIOSTip] = useState(false);
  const [showBanner, setShowBanner] = useState(false);
  const [bannerDismissed, setBannerDismissed] = useState(false);

  const { data: dbCompanies } = useQuery({
    queryKey: ["trusted-companies-landing"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("trusted_companies")
        .select("*")
        .eq("is_active", true)
        .order("display_order", { ascending: true });
      if (error) throw error;
      return data.map((c: any) => ({
        name: c.name,
        logo: c.logo_path
          ? supabase.storage.from("company-logos").getPublicUrl(c.logo_path).data.publicUrl
          : null,
      }));
    },
    staleTime: 5 * 60 * 1000,
  });

  const trustedCompanies = dbCompanies && dbCompanies.length > 0 ? dbCompanies : fallbackCompanies;

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

      {/* Trusted Companies */}
      <section className="border-t px-4 py-10 sm:px-6">
        <div className="mx-auto max-w-6xl">
          <ScrollFadeIn className="text-center mb-6">
            <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
              Trusted by professionals from leading companies
            </p>
          </ScrollFadeIn>
          <ScrollFadeIn delay={100}>
            <div className="relative overflow-hidden">
              {/* Gradient fades */}
              <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-16 bg-gradient-to-r from-background to-transparent" />
              <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-16 bg-gradient-to-l from-background to-transparent" />
              <div className="animate-scroll-left flex w-max gap-8 sm:gap-12">
                {[...trustedCompanies, ...trustedCompanies].map((company, i) => (
                  <div
                    key={`${company.name}-${i}`}
                    className="flex shrink-0 items-center gap-3 rounded-lg border bg-card/60 px-5 py-2.5 shadow-sm"
                  >
                    {company.logo ? (
                      <img src={company.logo} alt={company.name} className="h-7 w-7 object-contain" />
                    ) : (
                      <div className="h-7 w-7 rounded bg-muted" />
                    )}
                    <span className="whitespace-nowrap text-sm font-semibold text-muted-foreground">{company.name}</span>
                  </div>
                ))}
              </div>
            </div>
          </ScrollFadeIn>
        </div>
      </section>

      <section className="border-t bg-muted/30 px-4 py-12 sm:px-6 md:py-20">
        <div className="mx-auto max-w-6xl">
          <ScrollFadeIn className="mx-auto mb-10 max-w-lg text-center">
            <h2 className="text-2xl font-bold text-foreground sm:text-3xl">Everything you need</h2>
            <p className="mt-2 text-sm text-muted-foreground sm:text-base">
              A complete platform designed for professional freelancing
            </p>
          </ScrollFadeIn>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((feature, i) => (
              <ScrollFadeIn key={feature.title} delay={i * 120}>
                <Card className="border bg-card transition-all hover:shadow-lg hover:-translate-y-0.5 h-full">
                  <CardContent className="p-5 sm:p-6">
                    <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10">
                      <feature.icon className="h-5 w-5 text-primary" />
                    </div>
                    <h3 className="text-sm font-semibold text-foreground sm:text-base">{feature.title}</h3>
                    <p className="mt-1.5 text-xs text-muted-foreground sm:text-sm leading-relaxed">{feature.description}</p>
                  </CardContent>
                </Card>
              </ScrollFadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="px-4 py-12 sm:px-6 md:py-20">
        <div className="mx-auto max-w-6xl">
          <ScrollFadeIn className="mx-auto mb-10 max-w-lg text-center">
            <h2 className="text-2xl font-bold text-foreground sm:text-3xl">How it works</h2>
            <p className="mt-2 text-sm text-muted-foreground sm:text-base">Get started in four simple steps</p>
          </ScrollFadeIn>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {steps.map((s, i) => (
              <ScrollFadeIn key={s.step} delay={i * 150}>
                <div className="relative text-center sm:text-left">
                  <span className="text-4xl font-extrabold text-primary/10 sm:text-5xl">{s.step}</span>
                  <h3 className="mt-1 text-sm font-semibold text-foreground sm:text-base">{s.title}</h3>
                  <p className="mt-1 text-xs text-muted-foreground sm:text-sm">{s.description}</p>
                </div>
              </ScrollFadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* What Clients Say */}
      <section className="border-t bg-muted/30 px-4 py-12 sm:px-6 md:py-20">
        <div className="mx-auto max-w-6xl">
          <ScrollFadeIn className="mx-auto mb-10 max-w-lg text-center">
            <h2 className="text-2xl font-bold text-foreground sm:text-3xl">What Clients Say</h2>
            <p className="mt-2 text-sm text-muted-foreground sm:text-base">
              Hear from businesses that found the perfect freelancers
            </p>
          </ScrollFadeIn>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {[
              {
                name: "Rajesh Kumar",
                role: "Startup Founder",
                rating: 5,
                quote: "Freelancer helped us find talented developers quickly. The payment system is transparent and the project management tools are excellent.",
              },
              {
                name: "Priya Sharma",
                role: "Marketing Director",
                rating: 5,
                quote: "The verification process gives us confidence in every hire. We've completed over 20 projects seamlessly through this platform.",
              },
              {
                name: "Amit Patel",
                role: "Small Business Owner",
                rating: 4,
                quote: "Real-time chat and file sharing made collaboration effortless. The secure UPI payments are a huge plus for Indian businesses.",
              },
            ].map((testimonial, i) => (
              <ScrollFadeIn key={testimonial.name} delay={i * 150}>
                <Card className="h-full border bg-card transition-all hover:shadow-lg hover:-translate-y-0.5">
                  <CardContent className="flex flex-col gap-4 p-5 sm:p-6">
                    <div className="flex gap-0.5">
                      {Array.from({ length: 5 }).map((_, si) => (
                        <Star
                          key={si}
                          className={`h-4 w-4 ${si < testimonial.rating ? "fill-warning text-warning" : "text-muted"}`}
                        />
                      ))}
                    </div>
                    <p className="flex-1 text-sm leading-relaxed text-muted-foreground italic">
                      "{testimonial.quote}"
                    </p>
                    <div className="flex items-center gap-3 pt-2 border-t">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                        {testimonial.name.charAt(0)}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-foreground">{testimonial.name}</p>
                        <p className="text-xs text-muted-foreground">{testimonial.role}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </ScrollFadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="border-t px-4 py-12 sm:px-6 md:py-20">
        <div className="mx-auto max-w-3xl">
          <ScrollFadeIn className="mb-10 text-center">
            <h2 className="text-2xl font-bold text-foreground sm:text-3xl">Frequently Asked Questions</h2>
            <p className="mt-2 text-sm text-muted-foreground sm:text-base">
              Got questions? We've got answers.
            </p>
          </ScrollFadeIn>
          <div className="space-y-3">
            {[
              {
                q: "Is it free to sign up?",
                a: "Yes! Signing up, posting jobs, and searching for freelancers is completely free. We only charge a 2.9% handling fee on invoice payments.",
              },
              {
                q: "How does the verification process work?",
                a: "After registration, your profile is reviewed and approved by our admin team within 6 hours. We verify your identity through WhatsApp and document verification to ensure authentic interactions.",
              },
              {
                q: "What payment methods are supported?",
                a: "We support UPI transfers and bank transfers (NEFT/RTGS). All payments are processed securely through our platform with full transaction tracking.",
              },
              {
                q: "How do I get paid as a freelancer?",
                a: "Once your project is validated and completed, your earnings are credited to your wallet. You can withdraw anytime via UPI or bank transfer.",
              },
              {
                q: "Can I hire multiple freelancers for a project?",
                a: "Currently, each project is assigned to one freelancer. However, you can create multiple projects and assign different freelancers to each.",
              },
              {
                q: "What happens if there's a dispute?",
                a: "Our support team mediates all disputes. You can raise a recovery request and communicate through our dedicated support chat to resolve issues quickly.",
              },
            ].map((faq, i) => (
              <ScrollFadeIn key={i} delay={i * 80}>
                <FAQItem question={faq.q} answer={faq.a} />
              </ScrollFadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t bg-muted/30 px-4 py-12 sm:px-6 md:py-20">
        <ScrollFadeIn className="mx-auto max-w-6xl">
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
        </ScrollFadeIn>
      </section>

      {/* Footer */}
      <footer className="mt-auto border-t bg-card px-4 py-8 sm:px-6">
        <ScrollFadeIn className="mx-auto max-w-6xl">
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
        </ScrollFadeIn>
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
