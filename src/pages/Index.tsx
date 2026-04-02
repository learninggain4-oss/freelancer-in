import { useState, useEffect, useRef, createContext, useContext } from "react";
import { translations, RTL_LANGS, LANG_LABELS, type LangCode, type Translations } from "@/i18n/translations";
import {
  Briefcase, Shield, MessageCircle, CreditCard, Users, ArrowRight, Star,
  CheckCircle, Download, Smartphone, Share, Building2, Quote, Code, Palette,
  PenTool, BarChart3, Camera, Music, Globe, Megaphone, FileText, Wrench,
  GraduationCap, Heart, Headphones, ShoppingCart, Cpu, BookOpen,
  Smartphone as PhoneIcon, TrendingUp, Layers, Search, ChevronDown, ChevronUp,
  Zap, Lock, Clock, Plus, Minus, Twitter, Linkedin, Instagram, Github,
  MapPin, Mail, Phone,
} from "lucide-react";
import { Link, Navigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Carousel, CarouselContent, CarouselItem, CarouselPrevious, CarouselNext, type CarouselApi } from "@/components/ui/carousel";
import Autoplay from "embla-carousel-autoplay";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

/* ─────────────────────── Themes ─────────────────────── */
const THEMES = [
  { id: "midnight", label: "Midnight", dot: "#6366f1",
    bg: "#070714", bgRgb: "7,7,20",    a1: "#6366f1", a2: "#8b5cf6", a1rgb: "99,102,241",  a2rgb: "139,92,246" },
  { id: "crimson",  label: "Crimson",  dot: "#f43f5e",
    bg: "#0f0407", bgRgb: "15,4,7",    a1: "#f43f5e", a2: "#fb7185", a1rgb: "244,63,94",   a2rgb: "251,113,133" },
  { id: "ocean",    label: "Ocean",    dot: "#0ea5e9",
    bg: "#020b12", bgRgb: "2,11,18",   a1: "#0ea5e9", a2: "#06b6d4", a1rgb: "14,165,233",  a2rgb: "6,182,212"  },
  { id: "forest",   label: "Forest",   dot: "#22c55e",
    bg: "#030f06", bgRgb: "3,15,6",    a1: "#22c55e", a2: "#16a34a", a1rgb: "34,197,94",   a2rgb: "22,163,74"  },
  { id: "amber",    label: "Amber",    dot: "#f59e0b",
    bg: "#0c0800", bgRgb: "12,8,0",    a1: "#f59e0b", a2: "#f97316", a1rgb: "245,158,11",  a2rgb: "249,115,22" },
] as const;
type ThemeId = typeof THEMES[number]["id"];

/* ─────────────────────── Language Context ─────────────────────── */
const LangContext = createContext<{ lang: LangCode; setLang: (l: LangCode) => void; t: Translations }>({
  lang: "en", setLang: () => {}, t: translations["en"],
});
const useLang = () => useContext(LangContext);

const LanguageSwitcher = () => {
  const { lang, setLang } = useLang();
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        title="Change language"
        className="hidden sm:flex items-center gap-1.5 h-8 px-2.5 rounded-full transition-all hover:scale-105 text-xs font-semibold text-white/70 hover:text-white"
        style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)" }}
      >
        <Globe className="h-3.5 w-3.5" />
        <span>{LANG_LABELS[lang].split(" ")[0]}</span>
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-10 z-50 rounded-2xl shadow-2xl overflow-hidden" style={{ background: "rgba(15,15,35,0.97)", border: "1px solid rgba(255,255,255,0.12)", backdropFilter: "blur(20px)", minWidth: 170 }}>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-white/30 px-3 pt-3 pb-1">Language</p>
            {(Object.entries(LANG_LABELS) as [LangCode, string][]).map(([code, label]) => (
              <button
                key={code}
                onClick={() => { setLang(code); setOpen(false); }}
                className="flex w-full items-center justify-between gap-2 px-3 py-2.5 text-sm text-left transition-all hover:bg-white/5"
              >
                <span className={cn("font-medium", lang === code ? "text-white" : "text-white/50")}>{label}</span>
                {lang === code && <CheckCircle className="h-3.5 w-3.5 shrink-0" style={{ color: "var(--t-a1)" }} />}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

/* ─────────────────────── Global animation styles ─────────────────────── */
const GlobalStyles = () => (
  <style>{`
    @keyframes float {
      0%,100% { transform: translateY(0px) rotate(0deg); }
      33%      { transform: translateY(-18px) rotate(1.5deg); }
      66%      { transform: translateY(-9px) rotate(-1deg); }
    }
    @keyframes float2 {
      0%,100% { transform: translateY(0px); }
      50%      { transform: translateY(16px); }
    }
    @keyframes float3 {
      0%,100% { transform: translateY(0px) translateX(0px); }
      50%      { transform: translateY(-12px) translateX(8px); }
    }
    @keyframes spin-slow { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
    @keyframes spin-reverse { from { transform: rotate(360deg); } to { transform: rotate(0deg); } }
    @keyframes pulse-glow {
      0%,100% { opacity:.35; transform:scale(1); }
      50%      { opacity:.65; transform:scale(1.12); }
    }
    @keyframes gradient-shift {
      0%,100% { background-position: 0% 50%; }
      50%      { background-position: 100% 50%; }
    }
    @keyframes marquee { 0% { transform:translateX(0); } 100% { transform:translateX(-50%); } }
    @keyframes slide-up {
      from { opacity:0; transform:translateY(40px); }
      to   { opacity:1; transform:translateY(0); }
    }
    @keyframes fade-in {
      from { opacity:0; } to { opacity:1; }
    }
    @keyframes rotate-3d {
      0%   { transform: perspective(800px) rotateY(0deg) rotateX(5deg); }
      50%  { transform: perspective(800px) rotateY(8deg) rotateX(2deg); }
      100% { transform: perspective(800px) rotateY(0deg) rotateX(5deg); }
    }
    @keyframes modal-in {
      from { opacity:0; transform:scale(0.9) translateY(20px); }
      to   { opacity:1; transform:scale(1) translateY(0); }
    }
    @keyframes overlay-in {
      from { opacity:0; } to { opacity:1; }
    }
    .modal-enter { animation: modal-in 0.3s cubic-bezier(.17,.67,.34,1.2) both; }
    .overlay-enter { animation: overlay-in 0.25s ease both; }
    .float-1 { animation: float  6s ease-in-out infinite; }
    .float-2 { animation: float2 7s ease-in-out infinite 1s; }
    .float-3 { animation: float3 8s ease-in-out infinite 2s; }
    .float-4 { animation: float  9s ease-in-out infinite 0.5s; }
    .float-5 { animation: float2 5s ease-in-out infinite 3s; }
    .spin-slow    { animation: spin-slow    20s linear infinite; }
    .spin-reverse { animation: spin-reverse 25s linear infinite; }
    .pulse-glow   { animation: pulse-glow   3s ease-in-out infinite; }
    .rotate-3d    { animation: rotate-3d    8s ease-in-out infinite; }
    .marquee-track { animation: marquee 30s linear infinite; }
    .gradient-animated {
      background-size: 300% 300%;
      animation: gradient-shift 5s ease infinite;
    }
    .gradient-text {
      background: linear-gradient(135deg, var(--t-a1), var(--t-a2), var(--t-a1));
      background-size: 300% 300%;
      animation: gradient-shift 4s ease infinite;
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }
    .glass {
      background: rgba(255,255,255,0.07);
      backdrop-filter: blur(20px);
      -webkit-backdrop-filter: blur(20px);
      border: 1px solid rgba(255,255,255,0.12);
    }
    .glass-light {
      background: rgba(255,255,255,0.85);
      backdrop-filter: blur(20px);
      -webkit-backdrop-filter: blur(20px);
      border: 1px solid rgba(255,255,255,0.6);
    }
    .card-3d {
      transition: transform 0.4s cubic-bezier(.17,.67,.34,1.2), box-shadow 0.4s ease;
    }
    .card-3d:hover {
      transform: perspective(900px) rotateX(-6deg) rotateY(3deg) translateY(-10px) scale(1.02);
      box-shadow: 0 30px 60px -10px rgba(0,0,0,0.5), 0 0 40px rgba(var(--t-a2-rgb),0.2);
    }
    .feature-card-3d {
      transition: transform 0.4s cubic-bezier(.17,.67,.34,1.2), box-shadow 0.4s ease;
    }
    .feature-card-3d:hover {
      transform: perspective(800px) rotateX(-8deg) rotateY(4deg) translateY(-12px);
      box-shadow: 0 25px 50px -10px rgba(0,0,0,0.4), 0 0 30px rgba(var(--t-a1-rgb),0.25);
    }
    .step-3d {
      transition: transform 0.35s cubic-bezier(.17,.67,.34,1.2), box-shadow 0.35s ease;
    }
    .step-3d:hover {
      transform: perspective(700px) rotateX(-5deg) translateY(-8px) scale(1.03);
      box-shadow: 0 20px 40px -8px rgba(0,0,0,0.4);
    }
    .service-3d {
      transition: transform 0.35s cubic-bezier(.17,.67,.34,1.2), box-shadow 0.35s ease;
    }
    .service-3d:hover {
      transform: perspective(800px) rotateX(-7deg) rotateY(-3deg) translateY(-10px);
      box-shadow: 0 25px 50px -10px rgba(0,0,0,0.45), 0 0 25px rgba(52,211,153,0.2);
    }
    .hero-dashboard {
      animation: rotate-3d 10s ease-in-out infinite;
    }
    ::-webkit-scrollbar { width:6px; }
    ::-webkit-scrollbar-track { background:#0f0f1a; }
    ::-webkit-scrollbar-thumb { background:#4f46e5; border-radius:3px; }
  `}</style>
);

/* ─────────────────────── Data ─────────────────────── */
const features = [
  { icon: Shield,       title: "Verified Profiles",    description: "Every user is verified by admin for authentic, secure interactions.", color: "from-violet-500 to-purple-600" },
  { icon: Briefcase,    title: "Project Management",   description: "End-to-end tracking from inquiry through validation to completion.", color: "from-blue-500 to-cyan-600" },
  { icon: CreditCard,   title: "Secure Payments",      description: "Integrated UPI & bank transfers with full transparency.", color: "from-emerald-500 to-teal-600" },
  { icon: MessageCircle,title: "Real-time Chat",       description: "Instant in-app messaging for seamless project collaboration.", color: "from-rose-500 to-pink-600" },
  { icon: Zap,          title: "Instant Matching",     description: "AI-powered matching connects you with the right talent fast.", color: "from-amber-500 to-orange-600" },
  { icon: Lock,         title: "Data Security",        description: "Enterprise-grade encryption keeps your data private and safe.", color: "from-indigo-500 to-violet-600" },
  { icon: Clock,        title: "24/7 Support",         description: "Round-the-clock support to resolve any issue quickly.", color: "from-cyan-500 to-blue-600" },
  { icon: TrendingUp,   title: "Growth Analytics",     description: "Track your earnings, projects, and growth over time.", color: "from-fuchsia-500 to-purple-600" },
];

const steps = [
  { step: "01", title: "Create Account", description: "Sign up as employee or client with quick WhatsApp verification.", icon: Users,     color: "from-violet-600 to-purple-700" },
  { step: "02", title: "Find Projects",  description: "Browse available jobs or post your project requirements.", icon: Search,    color: "from-blue-600 to-cyan-700" },
  { step: "03", title: "Collaborate",    description: "Work together with real-time chat and milestone tracking.", icon: MessageCircle, color: "from-emerald-600 to-teal-700" },
  { step: "04", title: "Get Paid",       description: "Receive secure payments instantly to your UPI or bank account.", icon: CreditCard,  color: "from-rose-600 to-pink-700" },
];

const services = [
  { icon: Code,         label: "Web Development",    count: "450+", gradient: "from-blue-500/20 to-cyan-500/20",    iconColor: "text-blue-400" },
  { icon: Palette,      label: "Graphic Design",     count: "380+", gradient: "from-purple-500/20 to-pink-500/20",  iconColor: "text-purple-400" },
  { icon: PenTool,      label: "Content Writing",    count: "320+", gradient: "from-emerald-500/20 to-teal-500/20", iconColor: "text-emerald-400" },
  { icon: BarChart3,    label: "Digital Marketing",  count: "290+", gradient: "from-orange-500/20 to-amber-500/20", iconColor: "text-orange-400" },
  { icon: Camera,       label: "Video & Animation",  count: "210+", gradient: "from-rose-500/20 to-red-500/20",     iconColor: "text-rose-400" },
  { icon: PhoneIcon,    label: "App Development",    count: "260+", gradient: "from-violet-500/20 to-indigo-500/20",iconColor: "text-violet-400" },
  { icon: Layers,       label: "UI/UX Design",       count: "230+", gradient: "from-cyan-500/20 to-sky-500/20",     iconColor: "text-cyan-400" },
  { icon: Cpu,          label: "AI & Machine Learning",count:"90+", gradient: "from-fuchsia-500/20 to-pink-500/20", iconColor: "text-fuchsia-400" },
];

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

const stats = [
  { value: "500",  suffix: "+",   label: "Active Freelancers",    prefix: "" },
  { value: "10",   suffix: "L+",  label: "Projects Completed",    prefix: "₹" },
  { value: "99",   suffix: "%",   label: "Satisfaction Rate",     prefix: "" },
  { value: "2700", suffix: "+",   label: "Service Categories",    prefix: "" },
];

const trustedCompanies = ["TCS","Infosys","Wipro","HCL Tech","Tech Mahindra","Accenture","Cognizant","Flipkart","Razorpay","Zoho"];

const faqs = [
  { q: "How does the verification process work?", a: "Every user undergoes a WhatsApp number verification and admin review before being approved. This ensures all freelancers and clients are genuine." },
  { q: "What payment methods are supported?", a: "We support all major UPI apps (GPay, PhonePe, Paytm), direct bank transfers (NEFT/IMPS), and our integrated wallet system for instant payments." },
  { q: "Is there a fee to join the platform?", a: "Basic registration is free. We offer different wallet tiers with enhanced features and limits. You only pay when you upgrade your wallet plan." },
  { q: "How are disputes resolved?", a: "Our admin team mediates disputes through the in-app support chat. We hold payments in escrow until project validation is complete, protecting both parties." },
  { q: "Can I work on multiple projects simultaneously?", a: "Yes! Employees can manage multiple projects. Our dashboard gives you a clear overview of all active projects, deadlines, and earnings." },
  { q: "How do I withdraw my earnings?", a: "Go to your Wallet section, set up your UPI ID or bank account, and request a withdrawal. Transfers are typically processed within 24 hours." },
];

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

/* ─────────────────────── Scroll-triggered reveal ─────────────────────── */
const Reveal = ({ children, className = "", delay = 0, direction = "up" }: {
  children: React.ReactNode; className?: string; delay?: number; direction?: "up"|"left"|"right";
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current; if (!el) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect(); } }, { threshold: 0.1 });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  const from = direction === "left" ? "translateX(-40px)" : direction === "right" ? "translateX(40px)" : "translateY(40px)";
  return (
    <div ref={ref} className={className} style={{ opacity: visible ? 1 : 0, transform: visible ? "none" : from, transition: `opacity .7s ease ${delay}ms, transform .7s ease ${delay}ms` }}>
      {children}
    </div>
  );
};

/* ─────────────────────── Animated Counter ─────────────────────── */
const AnimatedCounter = ({ value, prefix = "", suffix = "" }: { value: string; prefix?: string; suffix?: string }) => {
  const [display, setDisplay] = useState("0");
  const ref = useRef<HTMLSpanElement>(null);
  const animated = useRef(false);
  useEffect(() => {
    const el = ref.current; if (!el) return;
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting && !animated.current) {
        animated.current = true;
        const target = parseInt(value.replace(/,/g, ""));
        const dur = 2000; const start = performance.now();
        const tick = (now: number) => {
          const t = Math.min((now - start) / dur, 1);
          const eased = 1 - Math.pow(1 - t, 3);
          setDisplay(Math.round(eased * target).toLocaleString("en-IN"));
          if (t < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      }
    }, { threshold: 0.5 });
    obs.observe(el);
    return () => obs.disconnect();
  }, [value]);
  return <span ref={ref}>{prefix}{display}{suffix}</span>;
};

/* ─────────────────────── Hero 3D Illustration ─────────────────────── */
const HeroDashboard = () => (
  <div className="relative w-full max-w-lg mx-auto select-none hero-dashboard" style={{ perspective: "1200px" }}>
    {/* Main dashboard card */}
    <div className="glass rounded-2xl p-5 shadow-2xl" style={{ boxShadow: "0 40px 80px -20px rgba(0,0,0,0.6), 0 0 60px rgba(var(--t-a1-rgb),0.15)" }}>
      {/* Top bar */}
      <div className="flex items-center gap-2 mb-4">
        <div className="flex gap-1.5">
          <div className="h-3 w-3 rounded-full bg-rose-400/80" />
          <div className="h-3 w-3 rounded-full bg-amber-400/80" />
          <div className="h-3 w-3 rounded-full bg-emerald-400/80" />
        </div>
        <div className="flex-1 h-5 rounded-md mx-4 glass" />
      </div>
      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        {[["₹2.4L","Earned","emerald"],["12","Projects","blue"],["98%","Rating","violet"]].map(([v,l,c]) => (
          <div key={l} className="glass rounded-xl p-3 text-center">
            <div className={`text-lg font-bold text-${c}-400`}>{v}</div>
            <div className="text-xs text-white/50">{l}</div>
          </div>
        ))}
      </div>
      {/* Chart area */}
      <div className="glass rounded-xl p-3 mb-4">
        <div className="flex items-end gap-1.5 h-16">
          {[40,65,45,80,60,90,75,95,70,85].map((h,i) => (
            <div key={i} className="flex-1 rounded-sm" style={{ height:`${h}%`, background: `linear-gradient(to top, var(--t-a1), var(--t-a2))`, opacity: 0.7 + i * 0.03 }} />
          ))}
        </div>
        <div className="text-xs text-white/40 mt-1">Monthly Earnings ↑ 24%</div>
      </div>
      {/* Recent activity */}
      {[["UI Design Project","₹15,000","Completed"],["Backend API Work","₹22,500","In Progress"]].map(([t,a,s]) => (
        <div key={t} className="flex items-center justify-between glass rounded-lg px-3 py-2 mb-2">
          <div>
            <div className="text-xs font-medium text-white/80">{t}</div>
            <div className="text-xs text-white/40">{s}</div>
          </div>
          <div className={`text-xs font-bold ${s==="Completed" ? "text-emerald-400" : "text-amber-400"}`}>{a}</div>
        </div>
      ))}
    </div>

    {/* Floating badge: Live */}
    <div className="absolute -top-5 -right-6 float-1">
      <div className="glass rounded-2xl px-3 py-2 flex items-center gap-2 shadow-lg">
        <div className="h-2 w-2 rounded-full bg-emerald-400 pulse-glow" />
        <span className="text-xs font-semibold text-white/90">Live Tracking</span>
      </div>
    </div>

    {/* Floating badge: Payment */}
    <div className="absolute -bottom-4 -left-8 float-2">
      <div className="glass rounded-2xl px-3 py-2.5 flex items-center gap-2 shadow-lg">
        <div className="h-7 w-7 rounded-full flex items-center justify-center" style={{ background: "linear-gradient(135deg,#10b981,#059669)" }}>
          <CreditCard className="h-3.5 w-3.5 text-white" />
        </div>
        <div>
          <div className="text-xs font-bold text-white/90">+₹8,200</div>
          <div className="text-xs text-white/50">Just received</div>
        </div>
      </div>
    </div>

    {/* Floating badge: Rating */}
    <div className="absolute top-1/2 -left-12 float-3">
      <div className="glass rounded-2xl px-3 py-2 flex items-center gap-1.5 shadow-lg">
        <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
        <span className="text-sm font-bold text-white/90">4.9</span>
      </div>
    </div>
  </div>
);

/* ─────────────────────── Orb decorations ─────────────────────── */
const Orbs = () => (
  <>
    <div className="pointer-events-none absolute -top-40 -left-40 h-96 w-96 rounded-full pulse-glow" style={{ background: "radial-gradient(circle, rgba(var(--t-a2-rgb),0.35) 0%, transparent 70%)", filter: "blur(40px)" }} />
    <div className="pointer-events-none absolute top-1/3 -right-32 h-80 w-80 rounded-full pulse-glow" style={{ background: "radial-gradient(circle, rgba(var(--t-a1-rgb),0.3) 0%, transparent 70%)", filter: "blur(40px)", animationDelay: "1.5s" }} />
    <div className="pointer-events-none absolute -bottom-20 left-1/4 h-72 w-72 rounded-full pulse-glow" style={{ background: "radial-gradient(circle, rgba(52,211,153,0.2) 0%, transparent 70%)", filter: "blur(40px)", animationDelay: "3s" }} />
  </>
);

/* ─────────────────────── Register Role Modal ─────────────────────── */
const RegisterModal = ({ open, onClose }: { open: boolean; onClose: () => void }) => {
  const { t } = useLang();
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center px-4" onClick={onClose}>
      <div className="overlay-enter absolute inset-0" style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)" }} />
      <div className="modal-enter relative w-full max-w-md rounded-3xl p-8 shadow-2xl" style={{ background: "linear-gradient(145deg, rgba(15,15,35,0.98), rgba(20,20,50,0.98))", border: "1px solid rgba(255,255,255,0.12)" }} onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} className="absolute right-5 top-5 flex h-8 w-8 items-center justify-center rounded-full text-white/40 hover:text-white transition-colors hover:bg-white/10">✕</button>
        <div className="text-center mb-8">
          <img src="/logo.png" alt="Logo" className="h-14 w-14 object-contain mx-auto mb-4" />
          <h2 className="text-2xl font-black text-white mb-1">Join Freelancer<span className="gradient-text">.</span></h2>
          <p className="text-sm text-white/50">{t.registerModal.sub}</p>
        </div>
        <div className="grid grid-cols-1 gap-4">
          <Link to="/register/employee" onClick={onClose} className="group relative flex items-center gap-4 rounded-2xl p-5 text-left transition-all duration-300 hover:scale-[1.02]" style={{ background: "rgba(var(--t-a1-rgb),0.1)", border: "1px solid rgba(var(--t-a1-rgb),0.25)" }}>
            <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" style={{ background: "linear-gradient(135deg, rgba(var(--t-a1-rgb),0.15), rgba(var(--t-a2-rgb),0.1))" }} />
            <div className="relative flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl" style={{ background: "linear-gradient(135deg,var(--t-a1),var(--t-a2))", boxShadow: "0 8px 20px rgba(var(--t-a1-rgb),0.35)" }}>
              <Briefcase className="h-6 w-6 text-white" />
            </div>
            <div className="relative flex-1">
              <div className="flex items-center justify-between">
                <p className="text-base font-bold text-white">{t.registerModal.freelancer}</p>
                <ArrowRight className="h-4 w-4 text-white/40 group-hover:text-indigo-400 group-hover:translate-x-1 transition-all" />
              </div>
              <p className="text-sm text-white/50 mt-0.5">{t.registerModal.freelancerDesc}</p>
            </div>
          </Link>
          <Link to="/register/client" onClick={onClose} className="group relative flex items-center gap-4 rounded-2xl p-5 text-left transition-all duration-300 hover:scale-[1.02]" style={{ background: "rgba(52,211,153,0.08)", border: "1px solid rgba(52,211,153,0.2)" }}>
            <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" style={{ background: "linear-gradient(135deg, rgba(52,211,153,0.12), rgba(16,185,129,0.08))" }} />
            <div className="relative flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl" style={{ background: "linear-gradient(135deg,#10b981,#059669)", boxShadow: "0 8px 20px rgba(16,185,129,0.3)" }}>
              <Users className="h-6 w-6 text-white" />
            </div>
            <div className="relative flex-1">
              <div className="flex items-center justify-between">
                <p className="text-base font-bold text-white">{t.registerModal.employer}</p>
                <ArrowRight className="h-4 w-4 text-white/40 group-hover:text-emerald-400 group-hover:translate-x-1 transition-all" />
              </div>
              <p className="text-sm text-white/50 mt-0.5">{t.registerModal.employerDesc}</p>
            </div>
          </Link>
        </div>
        <p className="text-center text-sm text-white/40 mt-6">
          {t.registerModal.haveAccount}{" "}
          <Link to="/login" onClick={onClose} className="text-indigo-400 hover:text-indigo-300 font-semibold transition-colors">{t.registerModal.loginLink}</Link>
        </p>
      </div>
    </div>
  );
};

/* ─────────────────────── Theme Picker ─────────────────────── */
const ThemePicker = ({ active, onChange }: { active: ThemeId; onChange: (id: ThemeId) => void }) => {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        title="Change theme"
        className="hidden sm:flex items-center justify-center h-8 w-8 rounded-full transition-all hover:scale-110"
        style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)" }}
      >
        <Palette className="h-3.5 w-3.5 text-white/70" />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-10 z-50 rounded-2xl p-3 shadow-2xl" style={{ background: "rgba(15,15,35,0.97)", border: "1px solid rgba(255,255,255,0.12)", backdropFilter: "blur(20px)", minWidth: 160 }}>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-white/30 px-1 mb-2">Theme</p>
            {THEMES.map(t => (
              <button
                key={t.id}
                onClick={() => { onChange(t.id); setOpen(false); }}
                className="flex w-full items-center gap-3 rounded-xl px-2 py-2 text-sm text-left transition-all hover:bg-white/5"
              >
                <span className="h-5 w-5 rounded-full shrink-0 ring-2 ring-offset-1 ring-offset-transparent transition-all"
                  style={{ background: `linear-gradient(135deg,${t.dot},${t.a2})`, outline: active === t.id ? `2px solid ${t.dot}` : "2px solid transparent" }} />
                <span className={cn("font-medium", active === t.id ? "text-white" : "text-white/50")}>{t.label}</span>
                {active === t.id && <CheckCircle className="ml-auto h-3.5 w-3.5" style={{ color: t.dot }} />}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

/* ─────────────────────── Live Clock ─────────────────────── */
const LiveClock = () => {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const dateStr = now.toLocaleDateString("en-IN", { weekday: "short", day: "2-digit", month: "short", year: "numeric" });
  const timeStr = now.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: true });

  return (
    <div className="hidden md:flex items-center gap-2 rounded-xl px-3 py-1.5 select-none" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}>
      <Clock className="h-3.5 w-3.5 shrink-0" style={{ color: "var(--t-a1)" }} />
      <div className="flex flex-col leading-none">
        <span className="text-[10px] font-medium text-white/40 tracking-wide">{dateStr}</span>
        <span className="text-xs font-mono font-semibold tabular-nums" style={{ color: "var(--t-a1)" }}>{timeStr}</span>
      </div>
    </div>
  );
};

/* ─────────────────────── Navbar ─────────────────────── */
const Navbar = ({ deferredPrompt, isInstalled, isIOS, onInstall, onIOSTip, activeTheme, onThemeChange }: any) => {
  const [scrolled, setScrolled] = useState(false);
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const { t } = useLang();

  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", h, { passive: true });
    return () => window.removeEventListener("scroll", h);
  }, []);

  return (
    <>
      <RegisterModal open={showRegisterModal} onClose={() => setShowRegisterModal(false)} />
      <header className={cn(
        "sticky top-0 z-50 transition-all duration-300",
        scrolled ? "py-2" : "py-3"
      )} style={{ background: scrolled ? "rgba(var(--t-bg-rgb),0.85)" : "transparent", backdropFilter: scrolled ? "blur(20px)" : "none", borderBottom: scrolled ? "1px solid rgba(255,255,255,0.08)" : "none" }}>
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="Freelancer Logo" className="h-10 w-10 object-contain" />
            <span className="text-lg font-bold text-white">Freelancer<span className="gradient-text">.</span></span>
            <LiveClock />
          </div>
          <div className="flex items-center gap-2.5">
            {!isInstalled && (deferredPrompt || isIOS) && (
              <button onClick={() => deferredPrompt ? onInstall() : onIOSTip()} className="hidden sm:flex items-center gap-1.5 text-sm text-white/70 hover:text-white transition-colors">
                <Download className="h-3.5 w-3.5" /> {t.nav.install}
              </button>
            )}
            <LanguageSwitcher />
            <ThemePicker active={activeTheme} onChange={onThemeChange} />
            <button onClick={() => setShowRegisterModal(true)} className="hidden sm:inline-flex text-sm text-white/70 hover:text-white transition-colors px-3 py-1.5 rounded-xl hover:bg-white/5">
              {t.nav.register}
            </button>
            <Link to="/login">
              <button className="relative inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-semibold text-white transition-all hover:scale-105" style={{ background: "linear-gradient(135deg, var(--t-a1), var(--t-a2))", boxShadow: "0 0 20px rgba(var(--t-a1-rgb),0.4)" }}>
                {t.nav.login} <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </Link>
          </div>
        </div>
      </header>
    </>
  );
};

/* ─────────────────────── Hero Section ─────────────────────── */
const HeroSection = ({ stats: heroStats }: { stats: typeof stats }) => {
  const { t } = useLang();
  return (
  <section className="relative overflow-hidden py-20 md:py-28 lg:py-36 px-4 sm:px-6">
    <Orbs />
    <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: "linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)", backgroundSize: "60px 60px" }} />

    <div className="mx-auto max-w-7xl">
      <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
        <div className="text-center lg:text-left" style={{ animation: "slide-up 0.7s ease both" }}>
          <div className="mb-5 inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-semibold text-white/80" style={{ background: "rgba(var(--t-a1-rgb),0.15)", border: "1px solid rgba(var(--t-a1-rgb),0.3)" }}>
            <div className="h-1.5 w-1.5 rounded-full bg-emerald-400 pulse-glow" />
            {t.hero.trustBadge}
          </div>
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black leading-[1.05] tracking-tight text-white mb-6" style={{ animation: "slide-up 0.7s ease 0.1s both" }}>
            {t.hero.line1}{" "}
            <br />
            {t.hero.line2}{" "}
            <br />
            <span className="gradient-text">{t.hero.line3}</span>
          </h1>
          <p className="text-base sm:text-lg text-white/60 leading-relaxed mb-8 max-w-lg mx-auto lg:mx-0" style={{ animation: "slide-up 0.7s ease 0.2s both" }}>
            {t.hero.subtitle}
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start mb-10" style={{ animation: "slide-up 0.7s ease 0.3s both" }}>
            <Link to="/register/employee">
              <button className="group flex items-center justify-center gap-2 rounded-2xl px-7 py-3.5 text-base font-semibold text-white transition-all hover:scale-105 w-full sm:w-auto" style={{ background: "linear-gradient(135deg, var(--t-a1), var(--t-a2))", boxShadow: "0 0 30px rgba(var(--t-a1-rgb),0.4), inset 0 1px 0 rgba(255,255,255,0.1)" }}>
                <Briefcase className="h-5 w-5" />
                {t.hero.joinFreelancer}
                <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </button>
            </Link>
            <Link to="/register/client">
              <button className="flex items-center justify-center gap-2 rounded-2xl px-7 py-3.5 text-base font-semibold text-white/80 hover:text-white transition-all hover:scale-105 w-full sm:w-auto" style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.15)" }}>
                <Users className="h-5 w-5" />
                {t.hero.joinEmployer}
              </button>
            </Link>
          </div>
          {/* Mini stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-lg mx-auto lg:mx-0" style={{ animation: "slide-up 0.7s ease 0.4s both" }}>
            {heroStats.map((s) => (
              <div key={s.label} className="text-center lg:text-left">
                <div className="text-2xl font-black text-white">
                  <AnimatedCounter value={s.value} prefix={s.prefix} suffix={s.suffix} />
                </div>
                <div className="text-xs text-white/40 mt-0.5">{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: 3D Dashboard */}
        <div className="lg:flex lg:justify-end" style={{ animation: "slide-up 0.9s ease 0.2s both" }}>
          <HeroDashboard />
        </div>
      </div>
    </div>

    <div className="absolute bottom-0 left-0 right-0 h-32 pointer-events-none" style={{ background: "linear-gradient(to bottom, transparent, var(--t-bg))" }} />
  </section>
  );
};

/* ─────────────────────── Trusted Companies ─────────────────────── */
const TrustBar = () => (
  <section className="py-10 px-4 relative overflow-hidden" style={{ borderTop: "1px solid rgba(255,255,255,0.06)", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
    <Reveal className="text-center mb-5">
      <p className="text-xs font-semibold uppercase tracking-widest text-white/30">Trusted by professionals from</p>
    </Reveal>
    <div className="relative overflow-hidden">
      <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-20" style={{ background: "linear-gradient(to right, var(--t-bg), transparent)" }} />
      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-20" style={{ background: "linear-gradient(to left, var(--t-bg), transparent)" }} />
      <div className="flex marquee-track" style={{ width: "max-content" }}>
        {[...trustedCompanies, ...trustedCompanies, ...trustedCompanies].map((name, i) => (
          <div key={i} className="flex shrink-0 items-center gap-2 mx-4 rounded-xl px-5 py-2.5" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
            <Building2 className="h-3.5 w-3.5 text-indigo-400/60" />
            <span className="whitespace-nowrap text-sm font-semibold text-white/40">{name}</span>
          </div>
        ))}
      </div>
    </div>
  </section>
);

/* ─────────────────────── Features Section ─────────────────────── */
const featureMeta = [
  { icon: Shield,        color: "from-violet-500 to-purple-600" },
  { icon: Briefcase,     color: "from-blue-500 to-cyan-600" },
  { icon: CreditCard,    color: "from-emerald-500 to-teal-600" },
  { icon: MessageCircle, color: "from-rose-500 to-pink-600" },
  { icon: Zap,           color: "from-amber-500 to-orange-600" },
  { icon: Lock,          color: "from-indigo-500 to-violet-600" },
  { icon: Clock,         color: "from-cyan-500 to-blue-600" },
  { icon: TrendingUp,    color: "from-fuchsia-500 to-purple-600" },
];
const FeaturesSection = () => {
  const { t } = useLang();
  return (
    <section id="features" className="relative py-20 md:py-28 px-4 sm:px-6 overflow-hidden">
      <div className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[600px] w-[600px] rounded-full" style={{ background: "radial-gradient(circle, rgba(var(--t-a1-rgb),0.08) 0%, transparent 70%)" }} />
      <div className="mx-auto max-w-7xl">
        <Reveal className="text-center mb-14">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-semibold text-indigo-300" style={{ background: "rgba(var(--t-a1-rgb),0.12)", border: "1px solid rgba(var(--t-a1-rgb),0.25)" }}>
            <Zap className="h-3.5 w-3.5" /> Platform Features
          </div>
          <h2 className="text-4xl sm:text-5xl font-black text-white mb-4 gradient-text">{t.features.heading}</h2>
          <p className="text-white/50 max-w-md mx-auto">{t.features.subheading}</p>
        </Reveal>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {featureMeta.map((f, i) => (
            <Reveal key={i} delay={i * 80}>
              <div className="feature-card-3d group relative h-full rounded-2xl p-5 cursor-pointer overflow-hidden" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
                <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-br ${f.color} rounded-2xl`} style={{ opacity: 0 }} />
                <div className="relative z-10">
                  <div className={`mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${f.color} float-${(i % 3) + 1}`} style={{ boxShadow: "0 8px 20px rgba(0,0,0,0.3)" }}>
                    <f.icon className="h-5 w-5 text-white" />
                  </div>
                  <h3 className="text-base font-bold text-white mb-2">{t.features.items[i]?.title}</h3>
                  <p className="text-sm text-white/50 leading-relaxed">{t.features.items[i]?.desc}</p>
                </div>
                <div className={`absolute -bottom-6 -right-6 h-20 w-20 rounded-full bg-gradient-to-br ${f.color} opacity-10 group-hover:opacity-20 transition-opacity blur-xl`} />
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
};

/* ─────────────────────── How It Works ─────────────────────── */
const stepMeta = [
  { step: "01", icon: Users,         color: "from-violet-600 to-purple-700" },
  { step: "02", icon: Search,        color: "from-blue-600 to-cyan-700" },
  { step: "03", icon: MessageCircle, color: "from-emerald-600 to-teal-700" },
  { step: "04", icon: CreditCard,    color: "from-rose-600 to-pink-700" },
];
const HowItWorksSection = () => {
  const { t } = useLang();
  return (
    <section id="how-it-works" className="relative py-20 md:py-28 px-4 sm:px-6 overflow-hidden">
      <div className="pointer-events-none absolute inset-0" style={{ background: "linear-gradient(180deg, transparent 0%, rgba(var(--t-a1-rgb),0.04) 50%, transparent 100%)" }} />
      <div className="mx-auto max-w-7xl">
        <Reveal className="text-center mb-14">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-semibold text-emerald-300" style={{ background: "rgba(52,211,153,0.1)", border: "1px solid rgba(52,211,153,0.2)" }}>
            <CheckCircle className="h-3.5 w-3.5" /> Simple Process
          </div>
          <h2 className="text-4xl sm:text-5xl font-black text-white mb-4">{t.howItWorks.heading}</h2>
          <p className="text-white/50 max-w-md mx-auto">{t.howItWorks.sub}</p>
        </Reveal>
        <div className="relative">
          <div className="hidden lg:block absolute top-16 left-[12.5%] right-[12.5%] h-px" style={{ background: "linear-gradient(to right, transparent, rgba(var(--t-a1-rgb),0.4), rgba(var(--t-a2-rgb),0.4), rgba(52,211,153,0.4), transparent)" }} />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {stepMeta.map((s, i) => (
              <Reveal key={s.step} delay={i * 120}>
                <div className="step-3d group relative rounded-2xl p-6 text-center cursor-pointer" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
                  <div className="relative mx-auto mb-5 flex h-14 w-14 items-center justify-center">
                    <div className={`absolute inset-0 rounded-full bg-gradient-to-br ${s.color} opacity-20 group-hover:opacity-40 transition-opacity blur-lg`} />
                    <div className={`relative flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br ${s.color} shadow-lg`} style={{ boxShadow: "0 8px 24px rgba(0,0,0,0.3)" }}>
                      <s.icon className="h-6 w-6 text-white" />
                    </div>
                    <div className="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full text-xs font-black text-white" style={{ background: "linear-gradient(135deg,var(--t-a1),var(--t-a2))" }}>
                      {i + 1}
                    </div>
                  </div>
                  <div className="text-5xl font-black mb-1" style={{ color: "rgba(255,255,255,0.05)" }}>{s.step}</div>
                  <h3 className="text-base font-bold text-white mb-2 -mt-4">{t.howItWorks.steps[i]?.title}</h3>
                  <p className="text-sm text-white/50 leading-relaxed">{t.howItWorks.steps[i]?.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

/* ─────────────────────── Services / Categories Section ─────────────────────── */
const ServicesSection = () => {
  const [showAll, setShowAll] = useState(false);
  const visible = showAll ? allCategories : allCategories.slice(0, 8);
  return (
    <section id="services" className="relative py-20 md:py-28 px-4 sm:px-6 overflow-hidden">
      <div className="pointer-events-none absolute top-0 right-0 h-[500px] w-[500px]" style={{ background: "radial-gradient(circle at top right, rgba(52,211,153,0.06) 0%, transparent 60%)" }} />
      <div className="mx-auto max-w-7xl">
        <Reveal className="text-center mb-14">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-semibold text-cyan-300" style={{ background: "rgba(34,211,238,0.1)", border: "1px solid rgba(34,211,238,0.2)" }}>
            <Layers className="h-3.5 w-3.5" /> 2,700+ Categories
          </div>
          <h2 className="text-4xl sm:text-5xl font-black text-white mb-4">Top <span className="gradient-text">Service</span> Categories</h2>
          <p className="text-white/50 max-w-md mx-auto">Whatever your project needs, we have the right talent for you.</p>
        </Reveal>

        {/* Featured 8 cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {services.map((s, i) => (
            <Reveal key={s.label} delay={i * 70}>
              <div className={`service-3d group relative rounded-2xl p-5 cursor-pointer overflow-hidden bg-gradient-to-br ${s.gradient}`} style={{ border: "1px solid rgba(255,255,255,0.08)" }}>
                <div className={`mb-3 flex h-11 w-11 items-center justify-center rounded-xl float-${(i % 5) + 1}`} style={{ background: "rgba(255,255,255,0.08)" }}>
                  <s.icon className={`h-5 w-5 ${s.iconColor}`} />
                </div>
                <div className="text-sm font-bold text-white mb-0.5">{s.label}</div>
                <div className="text-xs text-white/40">{s.count} services</div>
                <div className="absolute -bottom-4 -right-4 h-16 w-16 rounded-full opacity-20 blur-xl" style={{ background: s.iconColor.replace("text-", "bg-") }} />
              </div>
            </Reveal>
          ))}
        </div>

        {/* All categories expandable grid */}
        <div className="overflow-hidden transition-all duration-500" style={{ maxHeight: showAll ? "2000px" : "0" }}>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 mb-6">
            {allCategories.slice(8).map((cat, i) => (
              <Reveal key={cat.label} delay={i * 40}>
                <div className="group flex items-center gap-3 rounded-xl p-3.5 cursor-pointer transition-all hover:-translate-y-1" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg" style={{ background: "rgba(var(--t-a1-rgb),0.15)" }}>
                    <cat.icon className="h-4 w-4 text-indigo-400" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-white/80 truncate">{cat.label}</p>
                    <p className="text-xs text-white/40">{cat.count}</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>

        <Reveal className="flex justify-center gap-3 mt-4">
          <button onClick={() => setShowAll(!showAll)} className="flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white/70 hover:text-white transition-all hover:scale-105" style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}>
            {showAll ? <><ChevronUp className="h-4 w-4" /> Show Less</> : <><ChevronDown className="h-4 w-4" /> View More</>}
          </button>
          <Link to="/categories">
            <button className="flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white transition-all hover:scale-105" style={{ background: "linear-gradient(135deg,var(--t-a1),var(--t-a2))", boxShadow: "0 0 20px rgba(var(--t-a1-rgb),0.3)" }}>
              All Categories <ArrowRight className="h-4 w-4" />
            </button>
          </Link>
        </Reveal>
      </div>
    </section>
  );
};

/* ─────────────────────── Stats Section ─────────────────────── */
const StatsSection = () => {
  const { t } = useLang();
  const statItems = [
    { value: "500",  suffix: "+",   label: t.stats.labels.freelancers, prefix: "" },
    { value: "10",   suffix: "L+",  label: t.stats.labels.projects,    prefix: "₹" },
    { value: "99",   suffix: "%",   label: t.stats.labels.clients,     prefix: "" },
    { value: "2700", suffix: "+",   label: t.stats.labels.paid,        prefix: "" },
  ];
  return (
    <section className="relative py-20 md:py-24 px-4 sm:px-6 overflow-hidden">
      <div className="absolute inset-0" style={{ background: "linear-gradient(135deg, rgba(var(--t-a1-rgb),0.08) 0%, rgba(var(--t-a2-rgb),0.08) 50%, rgba(52,211,153,0.05) 100%)", borderTop: "1px solid rgba(255,255,255,0.06)", borderBottom: "1px solid rgba(255,255,255,0.06)" }} />
      <div className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-96 w-96 rounded-full spin-slow" style={{ border: "1px solid rgba(var(--t-a1-rgb),0.12)" }} />
      <div className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-64 w-64 rounded-full spin-reverse" style={{ border: "1px solid rgba(var(--t-a2-rgb),0.1)" }} />
      <div className="mx-auto max-w-7xl relative z-10">
        <Reveal className="text-center mb-14">
          <h2 className="text-4xl sm:text-5xl font-black text-white mb-4">{t.stats.heading}</h2>
          <p className="text-white/50">{t.stats.sub}</p>
        </Reveal>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
          {statItems.map((s, i) => (
            <Reveal key={i} delay={i * 100}>
              <div className="card-3d group relative rounded-2xl p-6 text-center overflow-hidden cursor-default" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" style={{ background: "linear-gradient(135deg, rgba(var(--t-a1-rgb),0.1), rgba(var(--t-a2-rgb),0.1))" }} />
                <div className="relative z-10">
                  <div className="text-4xl sm:text-5xl font-black mb-2" style={{ background: "linear-gradient(135deg, #a78bfa, #60a5fa)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                    <AnimatedCounter value={s.value} prefix={s.prefix} suffix={s.suffix} />
                  </div>
                  <p className="text-sm text-white/50 font-medium">{s.label}</p>
                </div>
                <div className="absolute -bottom-6 -right-6 h-24 w-24 rounded-full blur-2xl opacity-20 group-hover:opacity-40 transition-opacity" style={{ background: "linear-gradient(135deg,var(--t-a1),var(--t-a2))" }} />
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
};

/* ─────────────────────── Testimonials ─────────────────────── */
const TestimonialsSection = ({ testimonials }: { testimonials: any[] }) => {
  const [api, setApi] = useState<CarouselApi>();
  const [current, setCurrent] = useState(0);
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!api) return;
    setCount(api.scrollSnapList().length);
    setCurrent(api.selectedScrollSnap());
    api.on("select", () => setCurrent(api.selectedScrollSnap()));
  }, [api]);

  if (testimonials.length === 0) return null;

  return (
    <section id="testimonials" className="relative py-20 md:py-28 px-4 sm:px-6 overflow-hidden">
      <div className="pointer-events-none absolute bottom-0 left-0 h-[400px] w-[400px]" style={{ background: "radial-gradient(circle at bottom left, rgba(var(--t-a2-rgb),0.08) 0%, transparent 60%)" }} />
      <div className="mx-auto max-w-7xl">
        <Reveal className="text-center mb-14">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-semibold text-amber-300" style={{ background: "rgba(251,191,36,0.1)", border: "1px solid rgba(251,191,36,0.2)" }}>
            <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" /> Testimonials
          </div>
          <h2 className="text-4xl sm:text-5xl font-black text-white mb-4">What they <span className="gradient-text">say</span></h2>
          <p className="text-white/50 max-w-md mx-auto">Real stories from professionals building careers on our platform.</p>
        </Reveal>

        <div className="mx-auto max-w-6xl">
          <Carousel setApi={setApi} opts={{ align: "start", loop: true }} plugins={[Autoplay({ delay: 4000, stopOnInteraction: false })]}>
            <CarouselContent className="-ml-4">
              {testimonials.map((t) => (
                <CarouselItem key={t.id} className="pl-4 sm:basis-1/2 lg:basis-1/3">
                  <div className="card-3d group h-full rounded-2xl p-5 cursor-pointer overflow-hidden" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
                    <Quote className="mb-3 h-8 w-8 text-indigo-400/30 group-hover:text-indigo-400/60 transition-colors" />
                    <p className="text-sm text-white/60 leading-relaxed italic mb-4 flex-1">"{t.quote}"</p>
                    <div className="flex items-center gap-3 pt-4" style={{ borderTop: "1px solid rgba(255,255,255,0.07)" }}>
                      {t.photo_path ? (
                        <img src={t.photo_path} alt={t.name} className="h-10 w-10 rounded-full object-cover ring-2 ring-indigo-500/30" />
                      ) : (
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white" style={{ background: "linear-gradient(135deg,var(--t-a1),var(--t-a2))" }}>
                          {t.name.charAt(0)}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-white truncate">{t.name}</p>
                        <p className="text-xs text-white/40 truncate">{t.role}</p>
                      </div>
                      <div className="flex gap-0.5">
                        {[1,2,3,4,5].map((s) => (
                          <Star key={s} className={cn("h-3 w-3", s <= t.rating ? "fill-amber-400 text-amber-400" : "text-white/20")} />
                        ))}
                      </div>
                    </div>
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious className="hidden sm:flex -left-5 bg-white/5 border-white/10 text-white hover:bg-white/10" />
            <CarouselNext className="hidden sm:flex -right-5 bg-white/5 border-white/10 text-white hover:bg-white/10" />
          </Carousel>
          <div className="flex justify-center gap-1.5 mt-6">
            {Array.from({ length: count }).map((_, i) => (
              <button key={i} onClick={() => api?.scrollTo(i)} className={cn("h-1.5 rounded-full transition-all duration-300", i === current ? "w-8 bg-indigo-400" : "w-1.5 bg-white/20 hover:bg-white/40")} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

/* ─────────────────────── CTA Section ─────────────────────── */
const CTASection = () => {
  const { t } = useLang();
  return (
    <section className="relative py-20 md:py-28 px-4 sm:px-6 overflow-hidden">
      <Reveal>
        <div className="mx-auto max-w-5xl relative rounded-3xl overflow-hidden p-10 md:p-16 text-center" style={{ background: "linear-gradient(135deg, rgba(var(--t-a1-rgb),0.15) 0%, rgba(var(--t-a2-rgb),0.15) 50%, rgba(52,211,153,0.1) 100%)", border: "1px solid rgba(255,255,255,0.1)" }}>
          <div className="absolute -top-20 -right-20 h-60 w-60 rounded-full spin-slow" style={{ border: "1px solid rgba(var(--t-a1-rgb),0.15)" }} />
          <div className="absolute -bottom-20 -left-20 h-60 w-60 rounded-full spin-reverse" style={{ border: "1px solid rgba(var(--t-a2-rgb),0.1)" }} />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-80 w-80 rounded-full pulse-glow" style={{ background: "radial-gradient(circle, rgba(var(--t-a1-rgb),0.1) 0%, transparent 70%)" }} />
          <div className="relative z-10">
            <h2 className="text-4xl sm:text-5xl font-black text-white mb-4">{t.cta.heading}</h2>
            <p className="text-white/60 mb-6 max-w-md mx-auto">{t.cta.sub}</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/register/employee">
                <button className="group flex items-center justify-center gap-2 rounded-2xl px-8 py-3.5 text-base font-semibold text-white transition-all hover:scale-105 w-full sm:w-auto" style={{ background: "linear-gradient(135deg,var(--t-a1),var(--t-a2))", boxShadow: "0 0 30px rgba(var(--t-a1-rgb),0.4)" }}>
                  <Briefcase className="h-4 w-4" /> {t.cta.joinFreelancer} <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </button>
              </Link>
              <Link to="/register/client">
                <button className="flex items-center justify-center gap-2 rounded-2xl px-8 py-3.5 text-base font-semibold text-white/80 hover:text-white transition-all hover:scale-105 w-full sm:w-auto" style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.15)" }}>
                  <Users className="h-4 w-4" /> {t.cta.joinEmployer}
                </button>
              </Link>
            </div>
          </div>
        </div>
      </Reveal>
    </section>
  );
};

/* ─────────────────────── FAQ Section ─────────────────────── */
const FAQSection = () => {
  const [open, setOpen] = useState<number | null>(null);
  const { t } = useLang();
  return (
    <section id="faq" className="relative py-20 md:py-28 px-4 sm:px-6 overflow-hidden">
      <div className="pointer-events-none absolute top-0 right-0 h-[400px] w-[400px]" style={{ background: "radial-gradient(circle at top right, rgba(52,211,153,0.05) 0%, transparent 60%)" }} />
      <div className="mx-auto max-w-3xl">
        <Reveal className="text-center mb-14">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-semibold text-emerald-300" style={{ background: "rgba(52,211,153,0.1)", border: "1px solid rgba(52,211,153,0.2)" }}>
            <MessageCircle className="h-3.5 w-3.5" /> FAQ
          </div>
          <h2 className="text-4xl sm:text-5xl font-black text-white mb-4">{t.faq.heading}</h2>
          <p className="text-white/50">{t.faq.sub}</p>
        </Reveal>
        <div className="space-y-3">
          {t.faq.items.map((faq, i) => (
            <Reveal key={i} delay={i * 60}>
              <div className="rounded-2xl overflow-hidden transition-all duration-300" style={{ background: open === i ? "rgba(var(--t-a1-rgb),0.08)" : "rgba(255,255,255,0.03)", border: open === i ? "1px solid rgba(var(--t-a1-rgb),0.25)" : "1px solid rgba(255,255,255,0.07)" }}>
                <button onClick={() => setOpen(open === i ? null : i)} className="flex w-full items-center justify-between px-6 py-4 text-left gap-4">
                  <span className="text-sm sm:text-base font-semibold text-white/90">{faq.q}</span>
                  <div className="shrink-0 flex h-7 w-7 items-center justify-center rounded-lg transition-all" style={{ background: open === i ? "rgba(var(--t-a1-rgb),0.3)" : "rgba(255,255,255,0.06)" }}>
                    {open === i ? <Minus className="h-3.5 w-3.5 text-indigo-400" /> : <Plus className="h-3.5 w-3.5 text-white/50" />}
                  </div>
                </button>
                <div style={{ maxHeight: open === i ? "300px" : "0", overflow: "hidden", transition: "max-height 0.4s ease" }}>
                  <p className="px-6 pb-5 text-sm text-white/50 leading-relaxed">{faq.a}</p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
};

/* ─────────────────────── Footer ─────────────────────── */
const Footer = () => {
  const { t } = useLang();
  return (
    <footer className="relative py-16 px-4 sm:px-6 overflow-hidden" style={{ borderTop: "1px solid rgba(255,255,255,0.07)", background: "rgba(0,0,0,0.3)" }}>
      <div className="mx-auto max-w-7xl">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-10 mb-12">
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <img src="/logo.png" alt="Freelancer Logo" className="h-10 w-10 object-contain" />
              <span className="text-lg font-bold text-white">Freelancer<span className="gradient-text">.</span></span>
            </div>
            <p className="text-sm text-white/40 leading-relaxed mb-5 max-w-xs">{t.footer.tagline}</p>
            <div className="flex gap-3">
              {[Twitter, Linkedin, Instagram, Github].map((Icon, i) => (
                <div key={i} className="flex h-8 w-8 items-center justify-center rounded-lg cursor-pointer hover:scale-110 transition-transform" style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)" }}>
                  <Icon className="h-3.5 w-3.5 text-white/50" />
                </div>
              ))}
            </div>
          </div>
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-widest text-white/30 mb-4">{t.footer.platform}</h4>
            <ul className="space-y-2.5">
              {[t.footer.links.findWork, t.footer.links.howItWorks, t.footer.links.pricing].map((item) => (
                <li key={item}><a href="#" className="text-sm text-white/50 hover:text-white transition-colors">{item}</a></li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-widest text-white/30 mb-4">{t.footer.company}</h4>
            <ul className="space-y-2.5">
              {[[t.footer.links.about, "#"],[t.footer.links.blog, "#"],[t.footer.links.careers, "#"],[t.footer.links.contact, "#"]].map(([name, href]) => (
                <li key={name}><a href={href} className="text-sm text-white/50 hover:text-white transition-colors">{name}</a></li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-widest text-white/30 mb-4">Contact</h4>
            <ul className="space-y-3">
              {[[Mail,"support@freelancer.in"],[Phone,"+91 90000 00000"],[MapPin,"India"]].map(([Icon,text],i) => (
                <li key={i} className="flex items-center gap-2.5 text-sm text-white/50">
                  {/* @ts-ignore */}
                  <Icon className="h-3.5 w-3.5 text-indigo-400 shrink-0" />
                  {text}
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-8" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
          <p className="text-xs text-white/30">{t.footer.copyright}</p>
          <div className="flex gap-6">
            <Link to="/legal/privacy-policy" className="text-xs text-white/30 hover:text-white/60 transition-colors">{t.footer.links.privacy}</Link>
            <Link to="/legal/terms-of-service" className="text-xs text-white/30 hover:text-white/60 transition-colors">{t.footer.links.terms}</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

/* ─────────────────────── Main Page ─────────────────────── */
const Index = () => {
  const { user, profile, loading } = useAuth();
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showIOSTip, setShowIOSTip] = useState(false);
  const [showBanner, setShowBanner] = useState(false);
  const [bannerDismissed, setBannerDismissed] = useState(false);
  const [themeId, setThemeId] = useState<ThemeId>(() => (localStorage.getItem("fi-theme") as ThemeId) || "midnight");
  const [lang, setLangState] = useState<LangCode>(() => (localStorage.getItem("fi-lang") as LangCode) || "en");
  const theme = THEMES.find(t => t.id === themeId) ?? THEMES[0];

  const handleLangChange = (l: LangCode) => {
    setLangState(l);
    localStorage.setItem("fi-lang", l);
  };

  const handleThemeChange = (id: ThemeId) => {
    setThemeId(id);
    localStorage.setItem("fi-theme", id);
  };

  const { data: testimonials = [] } = useQuery({
    queryKey: ["landing-testimonials"],
    queryFn: async () => {
      const { data, error } = await supabase.from("testimonials").select("*").eq("is_active", true).order("display_order", { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  useEffect(() => {
    setIsIOS(/iPad|iPhone|iPod/.test(navigator.userAgent));
    if (window.matchMedia("(display-mode: standalone)").matches) setIsInstalled(true);
    const handler = (e: Event) => { e.preventDefault(); setDeferredPrompt(e as BeforeInstallPromptEvent); };
    window.addEventListener("beforeinstallprompt", handler);
    window.addEventListener("appinstalled", () => setIsInstalled(true));
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  useEffect(() => {
    if (isInstalled || bannerDismissed) return;
    const t = setTimeout(() => setShowBanner(true), 5000);
    return () => clearTimeout(t);
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
      return <Navigate to={`/${profile.user_type === "employee" ? "employee" : "client"}/dashboard`} replace />;
    }
    if (profile.approval_status === "pending" || profile.approval_status === "rejected") {
      return <Navigate to="/verification-pending" replace />;
    }
  }

  const cssVars = {
    "--t-bg":     theme.bg,
    "--t-bg-rgb": theme.bgRgb,
    "--t-a1":     theme.a1,
    "--t-a2":     theme.a2,
    "--t-a1-rgb": theme.a1rgb,
    "--t-a2-rgb": theme.a2rgb,
  } as React.CSSProperties;

  const isRTL = RTL_LANGS.includes(lang);

  return (
    <LangContext.Provider value={{ lang, setLang: handleLangChange, t: translations[lang] }}>
    <div className="min-h-screen flex flex-col" dir={isRTL ? "rtl" : "ltr"} style={{ ...cssVars, background: "var(--t-bg)", color: "white" }}>
      <GlobalStyles />

      <Navbar deferredPrompt={deferredPrompt} isInstalled={isInstalled} isIOS={isIOS} onInstall={handleInstall} onIOSTip={() => setShowIOSTip(v => !v)} activeTheme={themeId} onThemeChange={handleThemeChange} />

      {/* iOS tip */}
      {showIOSTip && isIOS && (
        <div className="px-4 py-3" style={{ background: "rgba(var(--t-a1-rgb),0.1)", borderBottom: "1px solid rgba(var(--t-a1-rgb),0.2)" }}>
          <div className="mx-auto flex max-w-6xl items-start gap-3 text-sm">
            <Smartphone className="mt-0.5 h-4 w-4 shrink-0 text-indigo-400" />
            <div className="space-y-1">
              <p className="font-medium text-white">Install on iOS</p>
              <p className="flex items-center gap-1.5 text-white/60"><Share className="h-3.5 w-3.5 text-indigo-400" /> Tap the Share button in Safari</p>
              <p className="flex items-center gap-1.5 text-white/60"><Download className="h-3.5 w-3.5 text-indigo-400" /> Tap "Add to Home Screen"</p>
            </div>
            <button onClick={() => setShowIOSTip(false)} className="ml-auto text-xs text-white/40 hover:text-white">✕</button>
          </div>
        </div>
      )}

      <main>
        <HeroSection stats={stats} />
        <TrustBar />
        <FeaturesSection />
        <HowItWorksSection />
        <ServicesSection />
        <StatsSection />
        <TestimonialsSection testimonials={testimonials} />
        <CTASection />
        <FAQSection />
      </main>

      <Footer />

      {/* Install Banner */}
      {showBanner && !isInstalled && !bannerDismissed && (
        <div className="fixed inset-x-0 bottom-0 z-50 p-4 pb-safe sm:hidden">
          <div className="rounded-2xl p-4 shadow-2xl" style={{ background: "rgba(var(--t-bg-rgb),0.95)", border: "1px solid rgba(var(--t-a1-rgb),0.3)", backdropFilter: "blur(20px)" }}>
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl" style={{ background: "linear-gradient(135deg,var(--t-a1),var(--t-a2))" }}>
                <Download className="h-5 w-5 text-white" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-white">Install Freelancer</p>
                <p className="mt-0.5 text-xs text-white/50">{isIOS ? "Add to your home screen for the best experience" : "Install for quick access & offline support"}</p>
                <div className="mt-3 flex gap-2">
                  <button className="rounded-lg px-3 py-1.5 text-xs font-semibold text-white flex items-center gap-1" style={{ background: "linear-gradient(135deg,var(--t-a1),var(--t-a2))" }} onClick={() => { if (deferredPrompt) handleInstall(); else if (isIOS) { setShowIOSTip(true); setShowBanner(false); } }}>
                    <Download className="h-3.5 w-3.5" /> {isIOS ? "How to Install" : "Install Now"}
                  </button>
                  <button className="rounded-lg px-3 py-1.5 text-xs text-white/40 hover:text-white" onClick={() => { setShowBanner(false); setBannerDismissed(true); }}>Not now</button>
                </div>
              </div>
              <button onClick={() => { setShowBanner(false); setBannerDismissed(true); }} className="text-white/30 hover:text-white">✕</button>
            </div>
          </div>
        </div>
      )}
    </div>
    </LangContext.Provider>
  );
};

export default Index;
