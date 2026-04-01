import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate, Link, Navigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Briefcase, Loader2, RefreshCw, Shield, Zap, Users, CreditCard,
  Star, ChevronDown, ChevronUp, ArrowRight, CheckCircle, Clock,
  MessageCircle, TrendingUp, Award, Globe, Mail, Phone, MapPin,
  Twitter, Linkedin, Instagram, Github, Lock, Eye, EyeOff,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { loginSchema, type LoginFormData } from "@/lib/validations/registration";
import { supabase } from "@/integrations/supabase/client";
import TotpVerifyDialog from "@/components/admin/TotpVerifyDialog";

/* ─── Keyframe CSS ─── */
const GLOBAL_CSS = `
@keyframes floatA { 0%,100%{transform:translateY(0px) rotateX(0deg) rotateZ(0deg)} 33%{transform:translateY(-18px) rotateX(8deg) rotateZ(3deg)} 66%{transform:translateY(-8px) rotateX(-4deg) rotateZ(-2deg)} }
@keyframes floatB { 0%,100%{transform:translateY(0px) rotateZ(0deg)} 50%{transform:translateY(-22px) rotateZ(180deg)} }
@keyframes floatC { 0%,100%{transform:translateY(0px) scale(1)} 50%{transform:translateY(-14px) scale(1.08)} }
@keyframes floatD { 0%,100%{transform:translateY(0px) rotateX(0deg)} 40%{transform:translateY(-20px) rotateX(15deg)} 70%{transform:translateY(-6px) rotateX(-8deg)} }
@keyframes orbit  { 0%{transform:rotate(0deg) translateX(90px) rotate(0deg)} 100%{transform:rotate(360deg) translateX(90px) rotate(-360deg)} }
@keyframes pulse3d{ 0%,100%{box-shadow:0 0 0 0 rgba(99,102,241,.5),0 20px 60px rgba(99,102,241,.2)} 50%{box-shadow:0 0 0 16px rgba(99,102,241,0),0 20px 60px rgba(99,102,241,.5)} }
@keyframes shimmer { 0%{background-position:-400px 0} 100%{background-position:400px 0} }
@keyframes countUp { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
@keyframes slideInLeft  { from{opacity:0;transform:translateX(-60px)} to{opacity:1;transform:translateX(0)} }
@keyframes slideInRight { from{opacity:0;transform:translateX(60px)}  to{opacity:1;transform:translateX(0)} }
@keyframes fadeInUp     { from{opacity:0;transform:translateY(40px)}  to{opacity:1;transform:translateY(0)} }
@keyframes spinSlow     { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
@keyframes orbGlow      { 0%,100%{opacity:.55;transform:scale(1)} 50%{opacity:.85;transform:scale(1.15)} }
@keyframes cardFloat    { 0%,100%{transform:translateY(0) rotateY(0deg)} 50%{transform:translateY(-12px) rotateY(4deg)} }
@keyframes blink        { 0%,100%{opacity:1} 50%{opacity:.3} }
.li-card:hover { transform: translateY(-8px) rotateX(4deg) rotateY(-2deg) scale(1.02); box-shadow: 0 24px 64px rgba(99,102,241,.35); }
.li-card { transition: transform .4s cubic-bezier(.23,1.08,.32,1), box-shadow .4s ease; transform-style: preserve-3d; }
.li-feat-card:hover { transform: translateY(-10px) rotateX(6deg) scale(1.04); }
.li-feat-card { transition: transform .35s cubic-bezier(.23,1.08,.32,1), box-shadow .35s ease; transform-style: preserve-3d; cursor: default; }
.li-step:hover .li-step-num { transform: rotateY(180deg); }
.li-step-num { transition: transform .6s ease; transform-style: preserve-3d; }
.li-faq-btn:hover { background: rgba(99,102,241,.12) !important; }
.testimonial-track { display:flex; gap:24px; animation:marquee 28s linear infinite; }
.testimonial-track:hover { animation-play-state:paused; }
@keyframes marquee { 0%{transform:translateX(0)} 100%{transform:translateX(-50%)} }
`;

/* ─── Theme (reuse same palette as Index) ─── */
const BG = "#070714";
const A1 = "#6366f1";
const A2 = "#8b5cf6";

/* ─── Section heading ─── */
const SectionHeading = ({ tag, title, sub }: { tag: string; title: string; sub: string }) => (
  <div className="text-center mb-14">
    <span className="inline-block text-xs font-bold uppercase tracking-widest px-4 py-1.5 rounded-full mb-4"
      style={{ background: "rgba(99,102,241,.15)", color: A1, border: `1px solid rgba(99,102,241,.3)` }}>
      {tag}
    </span>
    <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white mb-4"
      style={{ textShadow: "0 0 40px rgba(99,102,241,.3)" }}
      dangerouslySetInnerHTML={{ __html: title }} />
    <p className="text-white/50 max-w-xl mx-auto text-base">{sub}</p>
  </div>
);

/* ─── Animated Counter ─── */
const Counter = ({ target, suffix = "" }: { target: number; suffix?: string }) => {
  const [val, setVal] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return;
      obs.disconnect();
      let start = 0;
      const step = target / 60;
      const t = setInterval(() => {
        start += step;
        if (start >= target) { setVal(target); clearInterval(t); }
        else setVal(Math.floor(start));
      }, 25);
    }, { threshold: 0.3 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, [target]);
  return <span ref={ref}>{val.toLocaleString()}{suffix}</span>;
};

/* ─── FAQ Item ─── */
const FAQItem = ({ q, a }: { q: string; a: string }) => {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-2xl overflow-hidden mb-3"
      style={{ background: "rgba(255,255,255,.04)", border: "1px solid rgba(255,255,255,.08)" }}>
      <button className="li-faq-btn w-full flex items-center justify-between px-6 py-4 text-left transition-all"
        style={{ background: open ? "rgba(99,102,241,.1)" : "transparent" }}
        onClick={() => setOpen(o => !o)}>
        <span className="text-white font-semibold text-sm">{q}</span>
        {open ? <ChevronUp className="h-4 w-4 text-indigo-400 flex-shrink-0" /> : <ChevronDown className="h-4 w-4 text-white/40 flex-shrink-0" />}
      </button>
      {open && (
        <div className="px-6 pb-5 text-sm text-white/55 leading-relaxed" style={{ borderTop: "1px solid rgba(255,255,255,.06)" }}>
          <div className="pt-4">{a}</div>
        </div>
      )}
    </div>
  );
};

/* ─── Testimonial Card ─── */
const TestiCard = ({ name, role, text, rating }: { name: string; role: string; text: string; rating: number }) => (
  <div className="li-card flex-shrink-0 w-72 rounded-2xl p-5"
    style={{ background: "rgba(255,255,255,.05)", border: "1px solid rgba(255,255,255,.1)", backdropFilter: "blur(12px)" }}>
    <div className="flex gap-0.5 mb-3">
      {Array.from({ length: rating }).map((_, i) => (
        <Star key={i} className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
      ))}
    </div>
    <p className="text-white/70 text-xs leading-relaxed mb-4">"{text}"</p>
    <div className="flex items-center gap-2">
      <div className="h-8 w-8 rounded-full flex items-center justify-center text-white text-xs font-bold"
        style={{ background: `linear-gradient(135deg,${A1},${A2})` }}>
        {name[0]}
      </div>
      <div>
        <p className="text-white text-xs font-semibold">{name}</p>
        <p className="text-white/40 text-[10px]">{role}</p>
      </div>
    </div>
  </div>
);

/* ═══════════════════ MAIN LOGIN PAGE ═══════════════════ */
const Login = () => {
  const [loading, setLoading] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [showTotpDialog, setShowTotpDialog] = useState(false);
  const [pendingAdminNav, setPendingAdminNav] = useState(false);
  const [pendingUserNav, setPendingUserNav] = useState<string | null>(null);
  const [captchaA, setCaptchaA] = useState(0);
  const [captchaB, setCaptchaB] = useState(0);
  const [captchaAnswer, setCaptchaAnswer] = useState("");
  const [captchaVerified, setCaptchaVerified] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { signIn, user, profile, loading: authLoading } = useAuth();

  const regenerateCaptcha = useCallback(() => {
    setCaptchaA(Math.floor(Math.random() * 9) + 1);
    setCaptchaB(Math.floor(Math.random() * 9) + 1);
    setCaptchaAnswer("");
    setCaptchaVerified(false);
  }, []);

  const verifyCaptcha = () => {
    if (parseInt(captchaAnswer) === captchaA + captchaB) {
      setCaptchaVerified(true);
      toast({ title: "CAPTCHA verified!" });
    } else {
      toast({ title: "Wrong answer", description: "Please try again.", variant: "destructive" });
      regenerateCaptcha();
    }
  };

  useEffect(() => { regenerateCaptcha(); }, [regenerateCaptcha]);

  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  useEffect(() => {
    if (!user) { setIsAdmin(null); return; }
    supabase.rpc("has_role", { _user_id: user.id, _role: "admin" as const })
      .then(({ data }) => setIsAdmin(!!data));
  }, [user]);

  if (!authLoading && user && profile && isAdmin !== null) {
    if (isAdmin) return <Navigate to="/admin/dashboard" replace />;
    if (profile.approval_status !== "approved") return <Navigate to="/verification-pending" replace />;
    const base = profile.user_type === "employee" ? "/employee" : "/client";
    return <Navigate to={`${base}/dashboard`} replace />;
  }

  const onSubmit = async (data: LoginFormData) => {
    setLoading(true);
    try {
      const { error } = await signIn(data.email, data.password);
      if (error) throw error;
      toast({ title: "Welcome back!" });
      const waitForProfile = async () => {
        for (let i = 0; i < 20; i++) {
          await new Promise((r) => setTimeout(r, 500));
          const { data: { session } } = await supabase.auth.getSession();
          if (!session?.user) break;
          const { data: prof } = await supabase
            .from("profiles").select("user_type, approval_status")
            .eq("user_id", session.user.id).maybeSingle();
          if (!prof) continue;
          if (prof.approval_status !== "approved") { navigate("/verification-pending", { replace: true }); return; }
          const { data: adminCheck } = await supabase.rpc("has_role", { _user_id: session.user.id, _role: "admin" as const });
          if (adminCheck) {
            const totpRes = await supabase.functions.invoke("admin-totp", { body: { action: "check_status" } });
            if (totpRes.data?.is_enabled) { setPendingAdminNav(true); setShowTotpDialog(true); return; }
            navigate("/admin/dashboard", { replace: true });
          } else {
            const base = prof.user_type === "employee" ? "/employee" : "/client";
            const dest = `${base}/dashboard`;
            const userTotpRes = await supabase.functions.invoke("user-totp", { body: { action: "check_status_by_id", user_id: session.user.id } });
            if (userTotpRes.data?.is_enabled) { setPendingUserNav(dest); setShowTotpDialog(true); return; }
            navigate(dest, { replace: true });
          }
          return;
        }
      };
      waitForProfile();
    } catch (error: any) {
      toast({ title: "Login failed", description: error.message, variant: "destructive" });
      regenerateCaptcha();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ background: BG, color: "white", minHeight: "100vh", fontFamily: "Inter,system-ui,sans-serif", overflowX: "hidden" }}>
      <style>{GLOBAL_CSS}</style>

      {/* ── Ambient orbs ── */}
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0 }}>
        <div style={{ position: "absolute", top: "-10%", left: "-10%", width: 600, height: 600, borderRadius: "50%", background: `radial-gradient(circle,rgba(99,102,241,.18) 0%,transparent 70%)`, animation: "orbGlow 6s ease-in-out infinite" }} />
        <div style={{ position: "absolute", bottom: "20%", right: "-5%", width: 500, height: 500, borderRadius: "50%", background: `radial-gradient(circle,rgba(139,92,246,.14) 0%,transparent 70%)`, animation: "orbGlow 8s ease-in-out infinite 2s" }} />
        <div style={{ position: "absolute", top: "50%", left: "50%", width: 400, height: 400, borderRadius: "50%", background: `radial-gradient(circle,rgba(99,102,241,.08) 0%,transparent 70%)`, transform: "translate(-50%,-50%)", animation: "orbGlow 10s ease-in-out infinite 4s" }} />
      </div>

      {/* ── Navbar ── */}
      <nav style={{ position: "relative", zIndex: 10, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 32px", borderBottom: "1px solid rgba(255,255,255,.06)", backdropFilter: "blur(20px)", background: "rgba(7,7,20,.8)" }}>
        <Link to="/" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: `linear-gradient(135deg,${A1},${A2})`, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: `0 0 20px rgba(99,102,241,.5)` }}>
            <Briefcase size={18} color="white" />
          </div>
          <span style={{ fontWeight: 800, fontSize: 18, color: "white", letterSpacing: "-0.5px" }}>Freelancer<span style={{ color: A1 }}>.</span>in</span>
        </Link>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <Link to="/" style={{ color: "rgba(255,255,255,.6)", fontSize: 13, textDecoration: "none", fontWeight: 500 }} onMouseEnter={e => (e.currentTarget.style.color = "white")} onMouseLeave={e => (e.currentTarget.style.color = "rgba(255,255,255,.6)")}>Home</Link>
          <Link to="/register/employee" style={{ padding: "8px 20px", borderRadius: 10, background: `linear-gradient(135deg,${A1},${A2})`, color: "white", fontSize: 13, fontWeight: 700, textDecoration: "none", boxShadow: `0 4px 20px rgba(99,102,241,.4)` }}>Register</Link>
        </div>
      </nav>

      {/* ════════════ HERO + LOGIN FORM ════════════ */}
      <section style={{ position: "relative", zIndex: 1, minHeight: "100vh", display: "flex", alignItems: "center", padding: "60px 5%" }}>
        <div style={{ maxWidth: 1280, width: "100%", margin: "0 auto", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 64, alignItems: "center" }}
          className="lg:grid-cols-2 flex-col sm:flex-row">

          {/* LEFT: 3D Illustration */}
          <div style={{ animation: "slideInLeft .8s ease both", position: "relative" }} className="hidden lg:block">
            <div style={{ position: "relative", width: "100%", maxWidth: 520, margin: "0 auto" }}>

              {/* Central 3D card */}
              <div style={{ perspective: 1000, animation: "cardFloat 5s ease-in-out infinite" }}>
                <div style={{ borderRadius: 28, padding: 32, background: "rgba(255,255,255,.05)", border: "1px solid rgba(255,255,255,.12)", backdropFilter: "blur(20px)", boxShadow: "0 40px 100px rgba(0,0,0,.5), inset 0 1px 0 rgba(255,255,255,.15)", transformStyle: "preserve-3d" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
                    <div style={{ width: 48, height: 48, borderRadius: 14, background: `linear-gradient(135deg,${A1},${A2})`, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: `0 8px 24px rgba(99,102,241,.5)` }}>
                      <Briefcase size={22} color="white" />
                    </div>
                    <div>
                      <p style={{ color: "white", fontWeight: 700, fontSize: 16 }}>Freelancer India</p>
                      <p style={{ color: "rgba(255,255,255,.4)", fontSize: 12 }}>Premium Platform</p>
                    </div>
                    <div style={{ marginLeft: "auto", display: "flex", gap: 4 }}>
                      {[A1, A2, "#06b6d4"].map((c, i) => <div key={i} style={{ width: 10, height: 10, borderRadius: "50%", background: c }} />)}
                    </div>
                  </div>

                  {/* Stats row */}
                  {[
                    { label: "Active Freelancers", val: "12,400+", icon: Users, color: A1 },
                    { label: "Projects Completed", val: "38,000+", icon: CheckCircle, color: "#22c55e" },
                    { label: "Avg. Rating", val: "4.9 ⭐", icon: Star, color: "#f59e0b" },
                  ].map(({ label, val, icon: Icon, color }) => (
                    <div key={label} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", borderRadius: 14, marginBottom: 10, background: "rgba(255,255,255,.04)", border: "1px solid rgba(255,255,255,.06)" }}>
                      <div style={{ width: 36, height: 36, borderRadius: 10, background: `${color}22`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <Icon size={16} color={color} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <p style={{ color: "rgba(255,255,255,.45)", fontSize: 11 }}>{label}</p>
                        <p style={{ color: "white", fontWeight: 700, fontSize: 14 }}>{val}</p>
                      </div>
                      <TrendingUp size={14} color="#22c55e" />
                    </div>
                  ))}
                </div>
              </div>

              {/* Floating badges */}
              <div style={{ position: "absolute", top: -24, right: -24, padding: "10px 16px", borderRadius: 14, background: "rgba(99,102,241,.2)", border: "1px solid rgba(99,102,241,.4)", backdropFilter: "blur(12px)", animation: "floatA 4s ease-in-out infinite", boxShadow: "0 8px 32px rgba(99,102,241,.3)" }}>
                <p style={{ color: A1, fontWeight: 700, fontSize: 13 }}>🔐 Secure Login</p>
              </div>
              <div style={{ position: "absolute", bottom: 40, left: -32, padding: "10px 16px", borderRadius: 14, background: "rgba(34,197,94,.15)", border: "1px solid rgba(34,197,94,.3)", backdropFilter: "blur(12px)", animation: "floatC 5s ease-in-out infinite 1s" }}>
                <p style={{ color: "#22c55e", fontWeight: 700, fontSize: 13 }}>✅ 2FA Protected</p>
              </div>
              <div style={{ position: "absolute", top: "40%", left: -40, padding: "10px 16px", borderRadius: 14, background: "rgba(245,158,11,.15)", border: "1px solid rgba(245,158,11,.3)", backdropFilter: "blur(12px)", animation: "floatB 6s ease-in-out infinite .5s" }}>
                <p style={{ color: "#f59e0b", fontWeight: 700, fontSize: 13 }}>⚡ Instant Access</p>
              </div>

              {/* Orbiting dot */}
              <div style={{ position: "absolute", top: "50%", left: "50%", width: 0, height: 0 }}>
                <div style={{ position: "absolute", animation: "orbit 8s linear infinite", transformOrigin: "0 0" }}>
                  <div style={{ width: 12, height: 12, borderRadius: "50%", background: A1, boxShadow: `0 0 16px ${A1}` }} />
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT: Login Form */}
          <div style={{ animation: "slideInRight .8s ease both", animationDelay: ".1s" }}>
            <div style={{ marginBottom: 32 }}>
              <span style={{ display: "inline-block", fontSize: 11, fontWeight: 700, letterSpacing: 2, color: A1, textTransform: "uppercase", background: "rgba(99,102,241,.12)", padding: "4px 12px", borderRadius: 20, border: `1px solid rgba(99,102,241,.25)`, marginBottom: 16 }}>
                Welcome Back
              </span>
              <h1 style={{ fontSize: "clamp(2rem,4vw,3rem)", fontWeight: 900, lineHeight: 1.1, marginBottom: 12, letterSpacing: "-1px" }}>
                Sign in to your<br />
                <span style={{ background: `linear-gradient(90deg,${A1},${A2})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                  account
                </span>
              </h1>
              <p style={{ color: "rgba(255,255,255,.5)", fontSize: 15, lineHeight: 1.6 }}>
                Access your freelance dashboard, projects, and earnings in one place.
              </p>
            </div>

            {/* Glass card form */}
            <div style={{ borderRadius: 24, padding: "32px", background: "rgba(255,255,255,.05)", border: "1px solid rgba(255,255,255,.1)", backdropFilter: "blur(24px)", boxShadow: "0 32px 80px rgba(0,0,0,.4), inset 0 1px 0 rgba(255,255,255,.1)" }}>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">

                  {/* Email */}
                  <FormField control={form.control} name="email" render={({ field }) => (
                    <FormItem>
                      <FormLabel style={{ color: "rgba(255,255,255,.7)", fontSize: 13, fontWeight: 600 }}>Email Address</FormLabel>
                      <FormControl>
                        <div style={{ position: "relative" }}>
                          <Mail size={15} style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "rgba(255,255,255,.3)" }} />
                          <Input type="email" placeholder="you@example.com" {...field}
                            style={{ paddingLeft: 40, background: "rgba(255,255,255,.06)", border: "1px solid rgba(255,255,255,.1)", borderRadius: 12, color: "white", height: 46 }}
                            className="placeholder:text-white/25 focus:border-indigo-500 focus:ring-indigo-500/20" />
                        </div>
                      </FormControl>
                      <FormMessage className="text-red-400 text-xs" />
                    </FormItem>
                  )} />

                  {/* Password */}
                  <FormField control={form.control} name="password" render={({ field }) => (
                    <FormItem>
                      <FormLabel style={{ color: "rgba(255,255,255,.7)", fontSize: 13, fontWeight: 600 }}>Password</FormLabel>
                      <FormControl>
                        <div style={{ position: "relative" }}>
                          <Lock size={15} style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "rgba(255,255,255,.3)" }} />
                          <Input type={showPassword ? "text" : "password"} placeholder="Enter your password" {...field}
                            style={{ paddingLeft: 40, paddingRight: 44, background: "rgba(255,255,255,.06)", border: "1px solid rgba(255,255,255,.1)", borderRadius: 12, color: "white", height: 46 }}
                            className="placeholder:text-white/25 focus:border-indigo-500 focus:ring-indigo-500/20" />
                          <button type="button" onClick={() => setShowPassword(v => !v)}
                            style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", color: "rgba(255,255,255,.3)", background: "none", border: "none", cursor: "pointer" }}>
                            {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                          </button>
                        </div>
                      </FormControl>
                      <FormMessage className="text-red-400 text-xs" />
                    </FormItem>
                  )} />

                  {/* Forgot password */}
                  <div style={{ textAlign: "right" }}>
                    <Link to="/forgot-password" style={{ color: A1, fontSize: 12, textDecoration: "none", fontWeight: 600 }}>Forgot password?</Link>
                  </div>

                  {/* Terms checkbox */}
                  <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                    <Checkbox id="terms" checked={agreedToTerms}
                      onCheckedChange={(c) => setAgreedToTerms(c === true)}
                      style={{ marginTop: 2 }} />
                    <label htmlFor="terms" style={{ fontSize: 12, color: "rgba(255,255,255,.5)", lineHeight: 1.5, cursor: "pointer" }}>
                      I agree to the{" "}
                      <Link to="/legal/terms-of-service" target="_blank" style={{ color: A1 }}>Terms of Service</Link>{" "}and{" "}
                      <Link to="/legal/privacy-policy" target="_blank" style={{ color: A1 }}>Privacy Policy</Link>
                    </label>
                  </div>

                  {/* CAPTCHA */}
                  <div style={{ borderRadius: 12, border: "1px solid rgba(255,255,255,.1)", background: "rgba(255,255,255,.04)", padding: "14px 16px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: captchaVerified ? 0 : 10 }}>
                      <span style={{ fontSize: 13, fontWeight: 600, color: "rgba(255,255,255,.7)", whiteSpace: "nowrap" }}>
                        What is {captchaA} + {captchaB} =
                      </span>
                      <Input type="number" value={captchaAnswer}
                        onChange={(e) => { setCaptchaAnswer(e.target.value); setCaptchaVerified(false); }}
                        placeholder="?" disabled={captchaVerified}
                        style={{ width: 70, textAlign: "center", background: "rgba(255,255,255,.07)", border: "1px solid rgba(255,255,255,.12)", borderRadius: 10, color: "white", height: 36, fontSize: 14 }} />
                      <button type="button" onClick={regenerateCaptcha}
                        style={{ color: "rgba(255,255,255,.3)", background: "none", border: "none", cursor: "pointer" }} aria-label="New captcha">
                        <RefreshCw size={14} />
                      </button>
                    </div>
                    {!captchaVerified ? (
                      <button type="button" onClick={verifyCaptcha} disabled={!captchaAnswer}
                        style={{ width: "100%", padding: "8px", borderRadius: 10, border: `1px solid rgba(99,102,241,.4)`, background: "rgba(99,102,241,.12)", color: A1, fontSize: 12, fontWeight: 600, cursor: captchaAnswer ? "pointer" : "not-allowed", opacity: captchaAnswer ? 1 : .5 }}>
                        Verify CAPTCHA
                      </button>
                    ) : (
                      <p style={{ color: "#22c55e", fontSize: 12, fontWeight: 600, textAlign: "center" }}>✓ CAPTCHA verified</p>
                    )}
                  </div>

                  {/* Submit */}
                  <button type="submit" disabled={loading || !agreedToTerms || !captchaVerified}
                    style={{ width: "100%", padding: "14px", borderRadius: 14, background: loading || !agreedToTerms || !captchaVerified ? "rgba(99,102,241,.3)" : `linear-gradient(135deg,${A1},${A2})`, color: "white", fontWeight: 700, fontSize: 15, border: "none", cursor: loading || !agreedToTerms || !captchaVerified ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, transition: "all .2s", boxShadow: loading || !agreedToTerms || !captchaVerified ? "none" : "0 8px 24px rgba(99,102,241,.4)" }}>
                    {loading ? <Loader2 size={18} style={{ animation: "spin 1s linear infinite" }} /> : null}
                    {loading ? "Signing in…" : "Sign In"}
                    {!loading && <ArrowRight size={16} />}
                  </button>
                </form>
              </Form>
            </div>

            <p style={{ marginTop: 20, textAlign: "center", fontSize: 13, color: "rgba(255,255,255,.4)" }}>
              Don't have an account?{" "}
              <Link to="/register/employee" style={{ color: A1, fontWeight: 700, textDecoration: "none" }}>Register here</Link>
            </p>
          </div>
        </div>
      </section>

      {/* ════════════ FEATURES ════════════ */}
      <section style={{ position: "relative", zIndex: 1, padding: "100px 5%" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <SectionHeading tag="Why Choose Us" title="Everything you need to <span style='background:linear-gradient(90deg,#6366f1,#8b5cf6);-webkit-background-clip:text;-webkit-text-fill-color:transparent'>succeed</span>" sub="A complete ecosystem for freelancers and businesses — secure, fast, and built for India." />
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))", gap: 24 }}>
            {[
              { icon: Shield, color: A1, bg: "rgba(99,102,241,.15)", title: "Secure Payments", desc: "End-to-end encrypted transactions with instant UPI/bank transfers." },
              { icon: Zap, color: "#f59e0b", bg: "rgba(245,158,11,.12)", title: "Lightning Fast", desc: "Get matched with the right talent or project in under 60 seconds." },
              { icon: Users, color: "#22c55e", bg: "rgba(34,197,94,.12)", title: "Verified Network", desc: "Every freelancer is KYC-verified with Aadhaar & bank details." },
              { icon: MessageCircle, color: "#06b6d4", bg: "rgba(6,182,212,.12)", title: "Real-time Chat", desc: "Built-in messaging with file sharing and live project updates." },
              { icon: Award, color: "#f43f5e", bg: "rgba(244,63,94,.12)", title: "Skill Ratings", desc: "Transparent review system to help you hire or get hired with confidence." },
              { icon: TrendingUp, color: A2, bg: "rgba(139,92,246,.12)", title: "Earnings Dashboard", desc: "Track income, invoices, and growth analytics in real time." },
            ].map(({ icon: Icon, color, bg, title, desc }, i) => (
              <div key={title} className="li-feat-card" style={{ borderRadius: 20, padding: 28, background: "rgba(255,255,255,.04)", border: "1px solid rgba(255,255,255,.08)", animation: `fadeInUp .6s ease both`, animationDelay: `${i * .1}s`, boxShadow: "0 8px 32px rgba(0,0,0,.2)" }}>
                <div style={{ width: 52, height: 52, borderRadius: 16, background: bg, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 18, boxShadow: `0 8px 24px ${color}33` }}>
                  <Icon size={24} color={color} />
                </div>
                <h3 style={{ color: "white", fontWeight: 700, fontSize: 16, marginBottom: 8 }}>{title}</h3>
                <p style={{ color: "rgba(255,255,255,.45)", fontSize: 13, lineHeight: 1.6 }}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════ HOW IT WORKS ════════════ */}
      <section style={{ position: "relative", zIndex: 1, padding: "80px 5%", background: "rgba(255,255,255,.02)" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <SectionHeading tag="How It Works" title="Get started in <span style='background:linear-gradient(90deg,#6366f1,#8b5cf6);-webkit-background-clip:text;-webkit-text-fill-color:transparent'>3 simple steps</span>" sub="From registration to your first payment — the whole journey in minutes." />
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))", gap: 32, position: "relative" }}>
            {/* Connector line */}
            <div style={{ position: "absolute", top: 44, left: "16%", right: "16%", height: 2, background: `linear-gradient(90deg,transparent,${A1},${A2},transparent)`, display: "none" }} className="hidden lg:block" />
            {[
              { num: "01", icon: Users, color: A1, title: "Create Account", desc: "Sign up as a Freelancer or Employer. Complete KYC verification in minutes." },
              { num: "02", icon: Briefcase, color: A2, title: "Post or Find Work", desc: "Browse thousands of projects or post your requirements for free." },
              { num: "03", icon: CreditCard, color: "#22c55e", title: "Get Paid Securely", desc: "Receive payments directly to your bank account with zero delay." },
            ].map(({ num, icon: Icon, color, title, desc }, i) => (
              <div key={num} className="li-step" style={{ textAlign: "center", animation: `fadeInUp .7s ease both`, animationDelay: `${i * .15}s` }}>
                <div className="li-step-num" style={{ width: 72, height: 72, borderRadius: "50%", background: `linear-gradient(135deg,${color}33,${color}11)`, border: `2px solid ${color}66`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 24px", boxShadow: `0 0 32px ${color}33` }}>
                  <Icon size={28} color={color} />
                </div>
                <div style={{ fontSize: 11, fontWeight: 800, color, letterSpacing: 2, marginBottom: 8 }}>STEP {num}</div>
                <h3 style={{ color: "white", fontWeight: 700, fontSize: 18, marginBottom: 10 }}>{title}</h3>
                <p style={{ color: "rgba(255,255,255,.45)", fontSize: 13, lineHeight: 1.7, maxWidth: 260, margin: "0 auto" }}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════ SERVICES ════════════ */}
      <section style={{ position: "relative", zIndex: 1, padding: "100px 5%" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <SectionHeading tag="Popular Services" title="Top <span style='background:linear-gradient(90deg,#6366f1,#8b5cf6);-webkit-background-clip:text;-webkit-text-fill-color:transparent'>freelance services</span> on our platform" sub="From design to development — find skilled professionals for any task." />
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: 20 }}>
            {[
              { emoji: "🎨", label: "UI/UX Design", count: "2,400+ freelancers", color: "#f43f5e" },
              { emoji: "💻", label: "Web Development", count: "5,100+ freelancers", color: A1 },
              { emoji: "📱", label: "App Development", count: "3,200+ freelancers", color: A2 },
              { emoji: "✍️", label: "Content Writing", count: "4,800+ freelancers", color: "#f59e0b" },
              { emoji: "📊", label: "Data Analysis", count: "1,900+ freelancers", color: "#06b6d4" },
              { emoji: "📷", label: "Photography", count: "2,100+ freelancers", color: "#22c55e" },
              { emoji: "🎬", label: "Video Editing", count: "1,600+ freelancers", color: "#f97316" },
              { emoji: "🔊", label: "Digital Marketing", count: "3,700+ freelancers", color: "#ec4899" },
            ].map(({ emoji, label, count, color }, i) => (
              <div key={label} className="li-card" style={{ borderRadius: 18, padding: "22px 20px", background: "rgba(255,255,255,.04)", border: "1px solid rgba(255,255,255,.08)", animation: `fadeInUp .6s ease both`, animationDelay: `${i * .07}s`, cursor: "pointer" }}>
                <div style={{ fontSize: 32, marginBottom: 12 }}>{emoji}</div>
                <div style={{ borderBottom: `2px solid ${color}`, width: 32, marginBottom: 12 }} />
                <h4 style={{ color: "white", fontWeight: 700, fontSize: 14, marginBottom: 4 }}>{label}</h4>
                <p style={{ color: "rgba(255,255,255,.35)", fontSize: 12 }}>{count}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════ STATS ════════════ */}
      <section style={{ position: "relative", zIndex: 1, padding: "80px 5%", background: `linear-gradient(135deg,rgba(99,102,241,.08) 0%,rgba(139,92,246,.08) 100%)`, borderTop: "1px solid rgba(255,255,255,.06)", borderBottom: "1px solid rgba(255,255,255,.06)" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))", gap: 32, textAlign: "center" }}>
            {[
              { target: 12400, suffix: "+", label: "Active Freelancers", icon: Users, color: A1 },
              { target: 38000, suffix: "+", label: "Projects Completed", icon: CheckCircle, color: "#22c55e" },
              { target: 500, suffix: "+ Cr", label: "Total Earnings Paid", icon: CreditCard, color: "#f59e0b" },
              { target: 98, suffix: "%", label: "Client Satisfaction", icon: Star, color: "#f43f5e" },
            ].map(({ target, suffix, label, icon: Icon, color }, i) => (
              <div key={label} style={{ animation: `countUp .8s ease both`, animationDelay: `${i * .15}s` }}>
                <div style={{ width: 56, height: 56, borderRadius: 16, background: `${color}18`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px", boxShadow: `0 0 24px ${color}33` }}>
                  <Icon size={24} color={color} />
                </div>
                <p style={{ fontSize: "clamp(2rem,4vw,3rem)", fontWeight: 900, color: "white", lineHeight: 1 }}>
                  <Counter target={target} suffix={suffix} />
                </p>
                <p style={{ color: "rgba(255,255,255,.45)", fontSize: 13, marginTop: 8, fontWeight: 500 }}>{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════ TESTIMONIALS ════════════ */}
      <section style={{ position: "relative", zIndex: 1, padding: "100px 5%", overflow: "hidden" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <SectionHeading tag="Testimonials" title="Loved by <span style='background:linear-gradient(90deg,#6366f1,#8b5cf6);-webkit-background-clip:text;-webkit-text-fill-color:transparent'>thousands</span> of professionals" sub="Real stories from freelancers and businesses across India." />
        </div>
        <div style={{ overflow: "hidden" }}>
          <div className="testimonial-track">
            {[
              { name: "Priya Sharma", role: "UI/UX Designer, Mumbai", text: "Found 3 long-term clients in my first week. Payments are always on time!", rating: 5 },
              { name: "Rahul Verma", role: "Full Stack Dev, Bangalore", text: "The platform's project management tools are incredible. Revenue doubled in 3 months.", rating: 5 },
              { name: "Anita Patel", role: "Content Writer, Ahmedabad", text: "Love how seamless everything is — from proposal to payment. Highly recommend!", rating: 5 },
              { name: "Vikram Singh", role: "Digital Marketer, Delhi", text: "Best freelance platform in India. Verified clients and instant payments are a game-changer.", rating: 5 },
              { name: "Sneha Nair", role: "Graphic Designer, Kochi", text: "I was skeptical at first, but the quality of projects here is unmatched. 10/10!", rating: 5 },
              { name: "Arjun Mehta", role: "Data Analyst, Pune", text: "Secured projects worth ₹5L in my first month. The support team is amazing too.", rating: 5 },
              // Duplicated for infinite scroll
              { name: "Priya Sharma", role: "UI/UX Designer, Mumbai", text: "Found 3 long-term clients in my first week. Payments are always on time!", rating: 5 },
              { name: "Rahul Verma", role: "Full Stack Dev, Bangalore", text: "The platform's project management tools are incredible. Revenue doubled in 3 months.", rating: 5 },
              { name: "Anita Patel", role: "Content Writer, Ahmedabad", text: "Love how seamless everything is — from proposal to payment. Highly recommend!", rating: 5 },
              { name: "Vikram Singh", role: "Digital Marketer, Delhi", text: "Best freelance platform in India. Verified clients and instant payments are a game-changer.", rating: 5 },
              { name: "Sneha Nair", role: "Graphic Designer, Kochi", text: "I was skeptical at first, but the quality of projects here is unmatched. 10/10!", rating: 5 },
              { name: "Arjun Mehta", role: "Data Analyst, Pune", text: "Secured projects worth ₹5L in my first month. The support team is amazing too.", rating: 5 },
            ].map((t, i) => <TestiCard key={i} {...t} />)}
          </div>
        </div>
      </section>

      {/* ════════════ FAQ ════════════ */}
      <section style={{ position: "relative", zIndex: 1, padding: "80px 5%", background: "rgba(255,255,255,.02)" }}>
        <div style={{ maxWidth: 800, margin: "0 auto" }}>
          <SectionHeading tag="FAQ" title="Frequently asked <span style='background:linear-gradient(90deg,#6366f1,#8b5cf6);-webkit-background-clip:text;-webkit-text-fill-color:transparent'>questions</span>" sub="Everything you need to know about getting started on Freelancer India." />
          {[
            { q: "How do I create an account?", a: "Click 'Register here' below the login form, choose your role (Freelancer or Employer), fill in your details and complete KYC verification. The whole process takes under 5 minutes." },
            { q: "Is my payment information secure?", a: "Absolutely. We use AES-256 encryption for all financial data, and payments are processed through RBI-compliant gateways. Your bank details are never stored in plain text." },
            { q: "How long does KYC verification take?", a: "Aadhaar-based KYC is typically verified within 2–4 hours. Bank account verification via penny drop takes about 30 minutes." },
            { q: "What fees does the platform charge?", a: "We charge a transparent 5% platform fee on completed projects. There are no hidden fees, no subscription charges, and no withdrawal fees." },
            { q: "Can I work as both a freelancer and an employer?", a: "Yes! You can post projects as an employer and also take on work as a freelancer — just switch roles from your profile settings." },
            { q: "What if I have a dispute with a client or freelancer?", a: "Our dispute resolution team reviews evidence from both sides and typically resolves cases within 48 hours. Funds are held in escrow until the dispute is settled." },
          ].map((item) => <FAQItem key={item.q} {...item} />)}
        </div>
      </section>

      {/* ════════════ CTA STRIP ════════════ */}
      <section style={{ position: "relative", zIndex: 1, padding: "80px 5%" }}>
        <div style={{ maxWidth: 900, margin: "0 auto", borderRadius: 28, padding: "60px 48px", textAlign: "center", background: `linear-gradient(135deg,${A1}22,${A2}22)`, border: `1px solid rgba(99,102,241,.3)`, backdropFilter: "blur(12px)", boxShadow: `0 0 80px rgba(99,102,241,.15)` }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🚀</div>
          <h2 style={{ fontSize: "clamp(1.8rem,4vw,2.8rem)", fontWeight: 900, color: "white", marginBottom: 16, letterSpacing: "-0.5px" }}>
            Ready to start earning?
          </h2>
          <p style={{ color: "rgba(255,255,255,.55)", fontSize: 16, marginBottom: 36, maxWidth: 500, margin: "0 auto 36px" }}>
            Join 12,000+ professionals already earning on India's most trusted freelance platform.
          </p>
          <div style={{ display: "flex", gap: 16, justifyContent: "center", flexWrap: "wrap" }}>
            <Link to="/register/employee" style={{ padding: "14px 32px", borderRadius: 14, background: `linear-gradient(135deg,${A1},${A2})`, color: "white", fontWeight: 700, textDecoration: "none", display: "flex", alignItems: "center", gap: 8, boxShadow: `0 8px 24px rgba(99,102,241,.4)` }}>
              Join as Freelancer <ArrowRight size={16} />
            </Link>
            <Link to="/register/client" style={{ padding: "14px 32px", borderRadius: 14, border: "1px solid rgba(255,255,255,.2)", color: "white", fontWeight: 700, textDecoration: "none", background: "rgba(255,255,255,.06)", backdropFilter: "blur(8px)" }}>
              Hire Talent
            </Link>
          </div>
        </div>
      </section>

      {/* ════════════ FOOTER ════════════ */}
      <footer style={{ position: "relative", zIndex: 1, borderTop: "1px solid rgba(255,255,255,.07)", padding: "60px 5% 32px" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr", gap: 48, marginBottom: 48 }} className="grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
            {/* Brand */}
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: `linear-gradient(135deg,${A1},${A2})`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Briefcase size={18} color="white" />
                </div>
                <span style={{ fontWeight: 800, fontSize: 18, color: "white" }}>Freelancer<span style={{ color: A1 }}>.in</span></span>
              </div>
              <p style={{ color: "rgba(255,255,255,.4)", fontSize: 13, lineHeight: 1.7, maxWidth: 260, marginBottom: 20 }}>
                India's most trusted platform connecting skilled freelancers with quality clients.
              </p>
              <div style={{ display: "flex", gap: 12 }}>
                {[Twitter, Linkedin, Instagram, Github].map((Icon, i) => (
                  <div key={i} style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(255,255,255,.07)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", transition: "background .2s" }}
                    onMouseEnter={e => (e.currentTarget.style.background = `rgba(99,102,241,.25)`)}
                    onMouseLeave={e => (e.currentTarget.style.background = "rgba(255,255,255,.07)")}>
                    <Icon size={15} color="rgba(255,255,255,.6)" />
                  </div>
                ))}
              </div>
            </div>

            {/* Links */}
            {[
              { head: "Platform", links: ["How It Works", "Pricing", "For Freelancers", "For Businesses", "Categories"] },
              { head: "Company", links: ["About Us", "Careers", "Blog", "Press", "Contact"] },
              { head: "Legal", links: ["Privacy Policy", "Terms of Service", "Cookie Policy", "GDPR", "Refund Policy"] },
            ].map(({ head, links }) => (
              <div key={head}>
                <p style={{ color: "white", fontWeight: 700, fontSize: 14, marginBottom: 16 }}>{head}</p>
                {links.map(link => (
                  <a key={link} href="#" style={{ display: "block", color: "rgba(255,255,255,.4)", fontSize: 13, marginBottom: 10, textDecoration: "none", transition: "color .2s" }}
                    onMouseEnter={e => (e.currentTarget.style.color = "white")}
                    onMouseLeave={e => (e.currentTarget.style.color = "rgba(255,255,255,.4)")}>
                    {link}
                  </a>
                ))}
              </div>
            ))}
          </div>

          {/* Contact + Bottom bar */}
          <div style={{ borderTop: "1px solid rgba(255,255,255,.07)", paddingTop: 28, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16 }}>
            <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
              {[
                { icon: Mail, text: "support@freelancer.in" },
                { icon: Phone, text: "+91 98765 43210" },
                { icon: MapPin, text: "Mumbai, India" },
              ].map(({ icon: Icon, text }) => (
                <div key={text} style={{ display: "flex", alignItems: "center", gap: 8, color: "rgba(255,255,255,.35)", fontSize: 12 }}>
                  <Icon size={13} /> {text}
                </div>
              ))}
            </div>
            <p style={{ color: "rgba(255,255,255,.25)", fontSize: 12 }}>
              © 2026 Freelancer India. All rights reserved.
            </p>
          </div>
        </div>
      </footer>

      {/* ── TOTP Dialog ── */}
      <TotpVerifyDialog
        open={showTotpDialog}
        onClose={() => { setShowTotpDialog(false); setPendingAdminNav(false); setPendingUserNav(null); }}
        onVerified={() => {
          setShowTotpDialog(false);
          if (pendingAdminNav) { setPendingAdminNav(false); navigate("/admin/dashboard", { replace: true }); }
          else if (pendingUserNav) { const d = pendingUserNav; setPendingUserNav(null); navigate(d, { replace: true }); }
        }}
        title={pendingAdminNav ? "Admin Verification" : "Two-Factor Verification"}
        description="Enter your Google Authenticator code to continue."
        functionName={pendingAdminNav ? "admin-totp" : "user-totp"}
      />
    </div>
  );
};

export default Login;
