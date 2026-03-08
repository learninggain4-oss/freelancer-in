import { useState, useEffect, useRef, useCallback } from "react";
import { Briefcase, Shield, MessageCircle, CreditCard, Users, ArrowRight, Star, CheckCircle, Download, Smartphone, Share, Building2, Quote, Code, Palette, PenTool, BarChart3, Camera, Music, Globe, Megaphone, FileText, Wrench, GraduationCap, Heart, Headphones, ShoppingCart, Cpu, BookOpen, Smartphone as PhoneIcon, TrendingUp, Layers, Search, ChevronDown, ChevronUp } from "lucide-react";
import { Link, Navigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Carousel, CarouselContent, CarouselItem, CarouselPrevious, CarouselNext, type CarouselApi } from "@/components/ui/carousel";
import Autoplay from "embla-carousel-autoplay";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

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

const trustedCompanies = [
  "TCS", "Infosys", "Wipro", "HCL Tech", "Tech Mahindra",
  "Accenture", "Cognizant", "Flipkart", "Razorpay", "Zoho",
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

const allCategories = [
  { icon: Code, label: "Web Development", count: "450+" },
  { icon: Palette, label: "Graphic Design", count: "380+" },
  { icon: PenTool, label: "Content Writing", count: "320+" },
  { icon: BarChart3, label: "Digital Marketing", count: "290+" },
  { icon: Camera, label: "Video & Animation", count: "210+" },
  { icon: Music, label: "Music & Audio", count: "150+" },
  { icon: Globe, label: "Translation", count: "180+" },
  { icon: Megaphone, label: "Social Media", count: "200+" },
  { icon: FileText, label: "Data Entry", count: "160+" },
  { icon: Wrench, label: "IT & Networking", count: "130+" },
  { icon: GraduationCap, label: "Online Tutoring", count: "120+" },
  { icon: Heart, label: "Lifestyle & Wellness", count: "110+" },
  { icon: Headphones, label: "Customer Support", count: "140+" },
  { icon: ShoppingCart, label: "E-commerce", count: "170+" },
  { icon: Cpu, label: "AI & Machine Learning", count: "90+" },
  { icon: BookOpen, label: "Academic Writing", count: "100+" },
  { icon: PhoneIcon, label: "App Development", count: "260+" },
  { icon: TrendingUp, label: "Business Consulting", count: "85+" },
  { icon: Layers, label: "UI/UX Design", count: "230+" },
  { icon: Search, label: "SEO Services", count: "190+" },
];

const CategoriesGrid = () => {
  const [showAll, setShowAll] = useState(false);
  const visible = showAll ? allCategories : allCategories.slice(0, 8);

  return (
    <>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {visible.map((cat, i) => (
          <ScrollFadeIn key={cat.label} delay={i * 80}>
            <Card className="group border bg-card transition-all duration-300 hover:shadow-lg hover:-translate-y-1 hover:border-primary/20 cursor-pointer">
              <CardContent className="flex items-center gap-3 p-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 transition-colors group-hover:bg-primary/20">
                  <cat.icon className="h-5 w-5 text-primary" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-foreground truncate">{cat.label}</p>
                  <p className="text-xs text-muted-foreground">{cat.count} services</p>
                </div>
              </CardContent>
            </Card>
          </ScrollFadeIn>
        ))}
      </div>
      <div className="mt-6 text-center">
        <Button
          variant="outline"
          onClick={() => setShowAll(!showAll)}
          className="gap-2 transition-transform hover:scale-105"
        >
          {showAll ? (
            <>Show Less <ChevronUp className="h-4 w-4" /></>
          ) : (
            <>View All {allCategories.length} Categories <ChevronDown className="h-4 w-4" /></>
          )}
        </Button>
      </div>
    </>
  );
};

const TestimonialCarousel = ({ testimonials }: { testimonials: any[] }) => {
  const [api, setApi] = useState<CarouselApi>();
  const [current, setCurrent] = useState(0);
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!api) return;
    setCount(api.scrollSnapList().length);
    setCurrent(api.selectedScrollSnap());
    api.on("select", () => setCurrent(api.selectedScrollSnap()));
  }, [api]);

  return (
    <div className="mx-auto w-full max-w-5xl">
      <Carousel setApi={setApi} opts={{ align: "start", loop: true }} plugins={[Autoplay({ delay: 4000, stopOnInteraction: false })]}>
        <CarouselContent className="-ml-4">
          {testimonials.map((t) => (
            <CarouselItem key={t.id} className="pl-4 sm:basis-1/2 lg:basis-1/3">
              <Card className="group h-full border bg-card transition-all duration-300 hover:shadow-xl hover:-translate-y-1.5 hover:border-primary/20">
                <CardContent className="flex h-full flex-col p-5 sm:p-6">
                  <Quote className="mb-3 h-8 w-8 text-primary/20 transition-all duration-300 group-hover:text-primary/40 group-hover:scale-110" />
                  <p className="flex-1 text-sm text-muted-foreground leading-relaxed italic">
                    "{t.quote}"
                  </p>
                  <div className="mt-4 flex items-center gap-3 border-t pt-4">
                    {t.photo_path ? (
                      <img
                        src={t.photo_path}
                        alt={t.name}
                        className="h-10 w-10 rounded-full object-cover border transition-transform duration-300 group-hover:scale-110"
                      />
                    ) : (
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-bold transition-transform duration-300 group-hover:scale-110">
                        {t.name.charAt(0)}
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-foreground truncate">{t.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{t.role}</p>
                    </div>
                    <div className="ml-auto flex gap-0.5">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star
                          key={s}
                          className={cn(
                            "h-3.5 w-3.5 transition-transform duration-300",
                            s <= t.rating ? "fill-yellow-400 text-yellow-400 group-hover:scale-110" : "text-muted-foreground/30"
                          )}
                          style={{ transitionDelay: `${s * 50}ms` }}
                        />
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious className="hidden sm:flex -left-4 lg:-left-12" />
        <CarouselNext className="hidden sm:flex -right-4 lg:-right-12" />
      </Carousel>
      <div className="flex justify-center gap-1.5 mt-6">
        {Array.from({ length: count }).map((_, i) => (
          <button
            key={i}
            onClick={() => api?.scrollTo(i)}
            className={cn(
              "h-2 rounded-full transition-all duration-300",
              i === current ? "w-6 bg-primary" : "w-2 bg-muted-foreground/30 hover:bg-muted-foreground/50"
            )}
          />
        ))}
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

  const { data: testimonials = [] } = useQuery({
    queryKey: ["landing-testimonials"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("testimonials")
        .select("*")
        .eq("is_active", true)
        .order("display_order", { ascending: true });
      if (error) throw error;
      return data;
    },
  });

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
                {[...trustedCompanies, ...trustedCompanies].map((name, i) => (
                  <div
                    key={`${name}-${i}`}
                    className="flex shrink-0 items-center gap-2 rounded-lg border bg-card/60 px-5 py-2.5 shadow-sm"
                  >
                    <Building2 className="h-4 w-4 text-primary/60" />
                    <span className="whitespace-nowrap text-sm font-semibold text-muted-foreground">{name}</span>
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

      {/* Categories */}
      <section className="border-t bg-muted/30 px-4 py-12 sm:px-6 md:py-20">
        <div className="mx-auto max-w-6xl">
          <ScrollFadeIn className="mx-auto mb-10 max-w-lg text-center">
            <h2 className="text-2xl font-bold text-foreground sm:text-3xl">
              Get work done in over <span className="text-primary">2,700+</span> different Categories
            </h2>
            <p className="mt-2 text-sm text-muted-foreground sm:text-base">
              Whatever your project needs, we have the right talent for you
            </p>
          </ScrollFadeIn>
          <CategoriesGrid />
        </div>
      </section>

      {testimonials.length > 0 && (
        <section className="border-t bg-muted/30 px-4 py-12 sm:px-6 md:py-20">
          <div className="mx-auto max-w-6xl">
            <ScrollFadeIn className="mx-auto mb-10 max-w-lg text-center">
              <h2 className="text-2xl font-bold text-foreground sm:text-3xl">What Clients Say</h2>
              <p className="mt-2 text-sm text-muted-foreground sm:text-base">
                Hear from professionals who trust our platform
              </p>
            </ScrollFadeIn>
            <TestimonialCarousel testimonials={testimonials} />
          </div>
        </section>
      )}

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
