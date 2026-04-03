import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { CheckCircle, X, ArrowLeft, Zap, Shield, Star, CreditCard, HelpCircle, ChevronDown, ChevronUp } from "lucide-react";

const THEMES = [
  { id: "midnight", bg: "#070714", bgRgb: "7,7,20",    a1: "#6366f1", a2: "#8b5cf6", a1rgb: "99,102,241",  a2rgb: "139,92,246" },
  { id: "crimson",  bg: "#130a0a", bgRgb: "19,10,10",  a1: "#f43f5e", a2: "#fb923c", a1rgb: "244,63,94",   a2rgb: "251,146,60" },
  { id: "ocean",    bg: "#030d1a", bgRgb: "3,13,26",   a1: "#0ea5e9", a2: "#06b6d4", a1rgb: "14,165,233",  a2rgb: "6,182,212"  },
  { id: "forest",   bg: "#030f0a", bgRgb: "3,15,10",   a1: "#22c55e", a2: "#10b981", a1rgb: "34,197,94",   a2rgb: "16,185,129" },
  { id: "amber",    bg: "#120d02", bgRgb: "18,13,2",   a1: "#f59e0b", a2: "#f97316", a1rgb: "245,158,11",  a2rgb: "249,115,22" },
];

const PLANS = [
  {
    name: "Starter", price: "Free", sub: "Forever free to join", commission: "0%",
    commissionNote: "first 3 months, then 10%", color: "#34d399", popular: false,
    features: [
      { name: "Project bids per month", val: "Unlimited" },
      { name: "Profile listing", val: "Basic" },
      { name: "Withdrawal methods", val: "UPI & Bank" },
      { name: "Support", val: "Email (48hrs)" },
      { name: "Project chat", val: true },
      { name: "Invoice generation", val: true },
      { name: "Verified badge", val: false },
      { name: "Priority in search", val: false },
      { name: "Advanced analytics", val: false },
      { name: "Instant withdrawal", val: false },
      { name: "Dedicated manager", val: false },
      { name: "API access", val: false },
    ],
    cta: "Get Started Free", ctaLink: "/register/freelancer",
  },
  {
    name: "Pro", price: "₹499", sub: "per month", commission: "8%",
    commissionNote: "on all earnings", color: "#6366f1", popular: true,
    features: [
      { name: "Project bids per month", val: "Unlimited" },
      { name: "Profile listing", val: "Featured" },
      { name: "Withdrawal methods", val: "UPI, Bank, NEFT" },
      { name: "Support", val: "Priority chat (2hrs)" },
      { name: "Project chat", val: true },
      { name: "Invoice generation", val: true },
      { name: "Verified badge", val: true },
      { name: "Priority in search", val: true },
      { name: "Advanced analytics", val: true },
      { name: "Instant withdrawal", val: true },
      { name: "Dedicated manager", val: false },
      { name: "API access", val: false },
    ],
    cta: "Go Pro", ctaLink: "/register/freelancer",
  },
  {
    name: "Business", price: "₹1,499", sub: "per month", commission: "5%",
    commissionNote: "lowest commission tier", color: "#f59e0b", popular: false,
    features: [
      { name: "Project bids per month", val: "Unlimited" },
      { name: "Profile listing", val: "Top Featured" },
      { name: "Withdrawal methods", val: "All methods" },
      { name: "Support", val: "24/7 dedicated (15min)" },
      { name: "Project chat", val: true },
      { name: "Invoice generation", val: true },
      { name: "Verified badge", val: true },
      { name: "Priority in search", val: true },
      { name: "Advanced analytics", val: true },
      { name: "Instant withdrawal", val: true },
      { name: "Dedicated manager", val: true },
      { name: "API access", val: true },
    ],
    cta: "Go Business", ctaLink: "/register/freelancer",
  },
];

const PRICING_FAQS = [
  { q: "Is the Starter plan really free forever?", a: "Yes, absolutely. The Starter plan is free forever. You only pay a 10% commission on completed projects after your first 3 months (which are 0% commission as a launch offer)." },
  { q: "How is commission calculated?", a: "Commission is taken only on the project amount you earn. For example, if you complete a ₹10,000 project on Pro plan, you keep ₹9,200 (8% commission = ₹800)." },
  { q: "Can I switch plans at any time?", a: "Yes. You can upgrade or downgrade your plan at any time from your dashboard. Upgrades take effect immediately; downgrades apply at the next billing cycle." },
  { q: "What payment methods are accepted for Pro/Business?", a: "We accept UPI, Razorpay, all Indian debit/credit cards, net banking, and EMI options. Your plan is auto-renewed monthly." },
  { q: "Is there a refund policy?", a: "If you upgrade to Pro or Business and don't win any projects in the first 30 days, we offer a full refund — no questions asked." },
  { q: "Do employers pay any commission?", a: "Employers pay a 3% service fee on the project amount released. This covers escrow management, payment processing, and dispute resolution." },
];

const COMMISSION_EXAMPLES = [
  { plan: "Starter", project: 10000, commission: 0.10, color: "#34d399" },
  { plan: "Pro",     project: 10000, commission: 0.08, color: "#6366f1" },
  { plan: "Business",project: 10000, commission: 0.05, color: "#f59e0b" },
];

export default function Pricing() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [billing, setBilling] = useState<"monthly" | "yearly">("monthly");

  useEffect(() => {
    const id = (localStorage.getItem("fi-theme") || "midnight") as string;
    const t = THEMES.find(x => x.id === id) ?? THEMES[0];
    const root = document.documentElement;
    root.style.setProperty("--t-bg", t.bg);
    root.style.setProperty("--t-bg-rgb", t.bgRgb);
    root.style.setProperty("--t-a1", t.a1);
    root.style.setProperty("--t-a2", t.a2);
    root.style.setProperty("--t-a1-rgb", t.a1rgb);
    root.style.setProperty("--t-a2-rgb", t.a2rgb);
    document.body.style.background = t.bg;
    document.title = "Pricing Plans | Freelancer India | 0% Commission for 3 Months";
    const desc = document.querySelector('meta[name="description"]');
    if (desc) desc.setAttribute("content", "Freelancer India pricing plans. Start free with 0% commission for 3 months. Upgrade to Pro (8% commission, ₹499/mo) or Business (5% commission, ₹1,499/mo). No hidden fees. UPI & bank withdrawals.");
    return () => {
      document.title = "Freelancer India — Hire Top Indian Freelancers | UPI Payments | ₹0 Commission (3 Months)";
      document.body.style.background = "";
    };
  }, []);

  return (
    <div className="min-h-screen" style={{ background: "var(--t-bg)", color: "#fff" }}>
      {/* Header */}
      <div className="sticky top-0 z-40 backdrop-blur-xl" style={{ background: "rgba(var(--t-bg-rgb),0.92)", borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <Link to="/" className="flex items-center gap-2 text-sm text-white/60 hover:text-white transition-colors">
            <ArrowLeft className="h-4 w-4" /> Back to Home
          </Link>
          <Link to="/" className="flex items-center gap-1.5 font-black text-white text-lg">
            <span className="text-xl">💼</span> Freelancer<span style={{ color: "var(--t-a1)" }}>.</span>
          </Link>
          <div className="flex gap-2">
            <Link to="/register/employee"><button className="rounded-xl px-4 py-1.5 text-xs font-semibold text-white" style={{ background: "linear-gradient(135deg, var(--t-a1), var(--t-a2))" }}>Get Started</button></Link>
          </div>
        </div>
      </div>

      {/* Hero */}
      <section className="relative py-20 px-4 sm:px-6 text-center overflow-hidden">
        <div className="pointer-events-none absolute inset-0" style={{ background: "radial-gradient(ellipse 70% 50% at 50% 0%, rgba(var(--t-a1-rgb),0.1) 0%, transparent 70%)" }} />
        <div className="mx-auto max-w-3xl relative">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-semibold" style={{ background: "rgba(var(--t-a1-rgb),0.12)", border: "1px solid rgba(var(--t-a1-rgb),0.25)", color: "var(--t-a1)" }}>
            <CreditCard className="h-3.5 w-3.5" /> Transparent Pricing
          </div>
          <h1 className="text-5xl sm:text-6xl font-black text-white mb-4 leading-tight">
            Simple, Honest <span style={{ background: "linear-gradient(135deg, var(--t-a1), var(--t-a2))", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Pricing</span>
          </h1>
          <p className="text-white/55 text-lg mb-8 max-w-md mx-auto">No hidden fees. No surprise charges. Start free, upgrade when you're ready.</p>
          {/* Billing toggle */}
          <div className="inline-flex rounded-2xl p-1 gap-1" style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}>
            {(["monthly", "yearly"] as const).map(b => (
              <button key={b} onClick={() => setBilling(b)} className="rounded-xl px-5 py-2 text-sm font-semibold transition-all" style={{ background: billing === b ? "rgba(var(--t-a1-rgb),0.2)" : "transparent", color: billing === b ? "var(--t-a1)" : "rgba(255,255,255,0.5)", border: billing === b ? "1px solid rgba(var(--t-a1-rgb),0.35)" : "1px solid transparent" }}>
                {b === "monthly" ? "Monthly" : "Yearly (Save 20%)"}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Plans */}
      <section className="px-4 sm:px-6 pb-16">
        <div className="mx-auto max-w-6xl">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {PLANS.map(plan => {
              const price = billing === "yearly" && plan.price !== "Free" ? `₹${Math.round(parseInt(plan.price.replace(/[₹,]/g, "")) * 0.8).toLocaleString("en-IN")}` : plan.price;
              return (
                <div key={plan.name} className="relative rounded-3xl p-6 flex flex-col" style={{ background: plan.popular ? `${plan.color}0d` : "rgba(255,255,255,0.04)", border: plan.popular ? `1px solid ${plan.color}45` : "1px solid rgba(255,255,255,0.08)", boxShadow: plan.popular ? `0 0 50px ${plan.color}12` : "none" }}>
                  {plan.popular && <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full px-4 py-1 text-[10px] font-black text-white" style={{ background: plan.color }}>MOST POPULAR</div>}
                  <div className="mb-5">
                    <div className="flex items-center gap-2 mb-3"><div className="h-3 w-3 rounded-full" style={{ background: plan.color }} /><span className="text-sm font-bold text-white/60 uppercase tracking-wider">{plan.name}</span></div>
                    <div className="text-4xl font-black text-white mb-0.5">{price}</div>
                    <p className="text-xs text-white/40">{billing === "yearly" && plan.price !== "Free" ? "per month, billed yearly" : plan.sub}</p>
                  </div>
                  <div className="rounded-xl p-3 mb-5 text-center" style={{ background: `${plan.color}12`, border: `1px solid ${plan.color}25` }}>
                    <span className="text-2xl font-black" style={{ color: plan.color }}>{plan.commission}</span>
                    <span className="ml-1 text-xs text-white/50">{plan.commissionNote}</span>
                  </div>
                  <ul className="space-y-2.5 flex-1 mb-6">
                    {plan.features.map(f => (
                      <li key={f.name} className="flex items-center justify-between gap-2 text-xs">
                        <span className="text-white/55">{f.name}</span>
                        {typeof f.val === "boolean" ? (
                          f.val ? <CheckCircle className="h-4 w-4 shrink-0" style={{ color: plan.color }} /> : <X className="h-4 w-4 shrink-0 text-white/20" />
                        ) : (
                          <span className="font-bold text-white/80 text-right">{f.val}</span>
                        )}
                      </li>
                    ))}
                  </ul>
                  <Link to={plan.ctaLink}>
                    <button className="w-full rounded-2xl py-3 text-sm font-semibold text-white transition-all hover:scale-[1.02]" style={{ background: plan.popular ? `linear-gradient(135deg, ${plan.color}cc, ${plan.color}88)` : "rgba(255,255,255,0.07)", border: plan.popular ? "none" : "1px solid rgba(255,255,255,0.12)" }}>
                      {plan.cta}
                    </button>
                  </Link>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Commission Example */}
      <section className="px-4 sm:px-6 py-16" style={{ background: "rgba(255,255,255,0.02)", borderTop: "1px solid rgba(255,255,255,0.05)", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
        <div className="mx-auto max-w-3xl">
          <h2 className="text-2xl font-black text-white text-center mb-2">Commission on a ₹10,000 Project</h2>
          <p className="text-white/40 text-sm text-center mb-8">See exactly how much you keep across each plan.</p>
          <div className="space-y-4">
            {COMMISSION_EXAMPLES.map(e => {
              const fee = Math.round(e.project * e.commission);
              const keep = e.project - fee;
              return (
                <div key={e.plan} className="rounded-2xl p-4" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-bold text-white">{e.plan} Plan</span>
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: `${e.color}18`, color: e.color }}>{(e.commission * 100).toFixed(0)}% commission</span>
                  </div>
                  <div className="flex rounded-xl overflow-hidden h-8 mb-2">
                    <div className="flex items-center justify-center text-xs font-black text-white" style={{ width: `${(keep / e.project) * 100}%`, background: e.color }}>₹{keep.toLocaleString("en-IN")} yours</div>
                    <div className="flex items-center justify-center text-xs font-bold text-white/60" style={{ width: `${e.commission * 100}%`, background: "rgba(255,255,255,0.1)" }}>₹{fee}</div>
                  </div>
                  <div className="flex justify-between text-xs text-white/40"><span>You receive: <strong className="text-white">₹{keep.toLocaleString("en-IN")}</strong></span><span>Platform fee: ₹{fee}</span></div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Trust badges */}
      <section className="px-4 sm:px-6 py-12 text-center">
        <div className="mx-auto max-w-4xl">
          <p className="text-xs text-white/30 uppercase tracking-widest mb-6">All plans include</p>
          <div className="flex flex-wrap justify-center gap-3">
            {["Escrow Protection","GST Invoice","Dispute Resolution","INR Withdrawals","24/7 Support","Fraud Detection","RBI Compliant","SSL Encrypted"].map(b => (
              <span key={b} className="inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-semibold text-emerald-300" style={{ background: "rgba(52,211,153,0.08)", border: "1px solid rgba(52,211,153,0.18)" }}>
                <CheckCircle className="h-3 w-3" /> {b}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="px-4 sm:px-6 py-16">
        <div className="mx-auto max-w-2xl">
          <h2 className="text-3xl font-black text-white text-center mb-10 flex items-center justify-center gap-2"><HelpCircle className="h-7 w-7" style={{ color: "var(--t-a1)" }} /> Pricing FAQ</h2>
          <div className="space-y-3">
            {PRICING_FAQS.map((faq, i) => (
              <div key={i} className="rounded-2xl overflow-hidden" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
                <button onClick={() => setOpenFaq(openFaq === i ? null : i)} className="w-full flex items-center justify-between px-5 py-4 text-left text-sm font-semibold text-white hover:text-white/80 transition-colors">
                  {faq.q}
                  {openFaq === i ? <ChevronUp className="h-4 w-4 shrink-0 text-white/40" /> : <ChevronDown className="h-4 w-4 shrink-0 text-white/40" />}
                </button>
                {openFaq === i && <div className="px-5 pb-4 text-sm text-white/55 leading-relaxed">{faq.a}</div>}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="px-4 sm:px-6 py-20 text-center">
        <div className="mx-auto max-w-xl">
          <div className="rounded-3xl p-8" style={{ background: "linear-gradient(135deg, rgba(var(--t-a1-rgb),0.12), rgba(var(--t-a2-rgb),0.12))", border: "1px solid rgba(var(--t-a1-rgb),0.25)" }}>
            <div className="text-4xl mb-3">🚀</div>
            <h2 className="text-2xl font-black text-white mb-2">Start Free Today</h2>
            <p className="text-white/50 text-sm mb-6">Zero commission for 3 months. No credit card required.</p>
            <div className="flex gap-3 justify-center">
              <Link to="/register/employee"><button className="rounded-2xl px-7 py-3 text-sm font-semibold text-white hover:scale-105 transition-all" style={{ background: "linear-gradient(135deg, var(--t-a1), var(--t-a2))" }}>Join as Freelancer</button></Link>
              <Link to="/register/employer"><button className="rounded-2xl px-7 py-3 text-sm font-semibold text-white hover:scale-105 transition-all" style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.12)" }}>Hire Talent</button></Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
