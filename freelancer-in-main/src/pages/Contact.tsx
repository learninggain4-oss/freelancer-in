import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Mail, Phone, MapPin, MessageCircle, Clock, Send, CheckCircle, HelpCircle, Shield, Briefcase } from "lucide-react";

const THEMES = [
  { id: "midnight", bg: "#070714", bgRgb: "7,7,20",    a1: "#6366f1", a2: "#8b5cf6", a1rgb: "99,102,241",  a2rgb: "139,92,246" },
  { id: "crimson",  bg: "#130a0a", bgRgb: "19,10,10",  a1: "#f43f5e", a2: "#fb923c", a1rgb: "244,63,94",   a2rgb: "251,146,60" },
  { id: "ocean",    bg: "#030d1a", bgRgb: "3,13,26",   a1: "#0ea5e9", a2: "#06b6d4", a1rgb: "14,165,233",  a2rgb: "6,182,212"  },
  { id: "forest",   bg: "#030f0a", bgRgb: "3,15,10",   a1: "#22c55e", a2: "#10b981", a1rgb: "34,197,94",   a2rgb: "16,185,129" },
  { id: "amber",    bg: "#120d02", bgRgb: "18,13,2",   a1: "#f59e0b", a2: "#f97316", a1rgb: "245,158,11",  a2rgb: "249,115,22" },
];

const CONTACT_METHODS = [
  {
    icon: Mail,        color: "#6366f1",
    title: "Email Support",
    value: "support@freelancer.in",
    desc: "For general queries, account issues, and feedback.",
    action: "mailto:support@freelancer.in",
    cta: "Send Email",
  },
  {
    icon: MessageCircle, color: "#34d399",
    title: "Live Chat",
    value: "In-App Support Chat",
    desc: "Log in to your account and use the Help & Support chat for fastest responses.",
    action: "/help-support",
    cta: "Open Chat",
    internal: true,
  },
  {
    icon: Briefcase,   color: "#f59e0b",
    title: "Business & Partnerships",
    value: "biz@freelancer.in",
    desc: "For enterprise hiring, bulk projects, and partnership inquiries.",
    action: "mailto:biz@freelancer.in",
    cta: "Get in Touch",
  },
  {
    icon: Shield,      color: "#ec4899",
    title: "Trust & Safety",
    value: "safety@freelancer.in",
    desc: "To report fraud, abuse, or policy violations. All reports are confidential.",
    action: "mailto:safety@freelancer.in",
    cta: "Report Issue",
  },
];

const FAQS = [
  { q: "How do I reset my password?", a: "Go to the Login page and click 'Forgot Password'. We'll send a reset link to your registered email." },
  { q: "When will my withdrawal be processed?", a: "UPI withdrawals are processed within 24–48 hours on business days. Bank transfers may take 2–3 business days." },
  { q: "How do I get verified?", a: "Go to Profile → Aadhaar Verification or Bank Verification from your dashboard. Verification usually completes within 1 business day." },
  { q: "What if an employer doesn't release payment?", a: "Open a dispute from your project dashboard within 7 days of work completion. Our Trust & Safety team reviews and resolves within 3 business days." },
  { q: "Can I use Freelancer India on mobile?", a: "Yes! Install the Freelancer India app directly from your browser — it works as a PWA on Android and iOS without needing an app store." },
  { q: "Is there a commission fee?", a: "Zero commission for your first 3 months. After that, plans start at a low flat fee — check the Pricing page for details." },
];

export default function Contact() {
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });
  const [sent, setSent] = useState(false);

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
    document.title = "Contact Us | Freelancer India";
    return () => {
      document.title = "Freelancer India";
      document.body.style.background = "";
    };
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const mailtoLink = `mailto:support@freelancer.in?subject=${encodeURIComponent(form.subject || "Contact Form Submission")}&body=${encodeURIComponent(`Name: ${form.name}\nEmail: ${form.email}\n\n${form.message}`)}`;
    window.location.href = mailtoLink;
    setSent(true);
  };

  const inputStyle = {
    background: "rgba(255,255,255,0.06)",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: "12px",
    color: "#fff",
    outline: "none",
    width: "100%",
    padding: "12px 16px",
    fontSize: "14px",
  } as React.CSSProperties;

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
          <Link to="/help-support">
            <button className="rounded-xl px-4 py-1.5 text-xs font-semibold text-white" style={{ background: "linear-gradient(135deg, var(--t-a1), var(--t-a2))" }}>
              Help Centre
            </button>
          </Link>
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-4 sm:px-6 py-16 md:py-24 space-y-20">

        {/* Hero */}
        <div className="text-center space-y-5">
          <div className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-semibold text-indigo-300" style={{ background: "rgba(var(--t-a1-rgb),0.12)", border: "1px solid rgba(var(--t-a1-rgb),0.25)" }}>
            <MessageCircle className="h-3.5 w-3.5" /> Get in Touch
          </div>
          <h1 className="text-4xl sm:text-5xl font-black text-white">
            We're Here to{" "}
            <span style={{ background: "linear-gradient(135deg, var(--t-a1), var(--t-a2))", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              Help
            </span>
          </h1>
          <p className="text-white/50 max-w-xl mx-auto">Have a question, issue, or idea? Reach out through any channel below. We typically respond within 24 hours on business days.</p>
        </div>

        {/* Response Time */}
        <div className="flex flex-wrap justify-center gap-6 text-center">
          {[
            { icon: "⚡", label: "Live Chat", time: "< 2 hours" },
            { icon: "📧", label: "Email",     time: "< 24 hours" },
            { icon: "📞", label: "Business",  time: "< 48 hours" },
          ].map(r => (
            <div key={r.label} className="flex items-center gap-3 rounded-2xl px-5 py-3" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
              <span className="text-xl">{r.icon}</span>
              <div className="text-left">
                <div className="text-xs font-semibold text-white">{r.label}</div>
                <div className="text-xs text-white/40 flex items-center gap-1"><Clock className="h-3 w-3" />{r.time}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Contact Methods */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {CONTACT_METHODS.map(c => (
            <div key={c.title} className="rounded-2xl p-6 space-y-3" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ background: `${c.color}20` }}>
                  <c.icon className="h-5 w-5" style={{ color: c.color }} />
                </div>
                <div>
                  <div className="font-bold text-white text-sm">{c.title}</div>
                  <div className="text-xs text-white/40">{c.value}</div>
                </div>
              </div>
              <p className="text-sm text-white/50 leading-relaxed">{c.desc}</p>
              {c.internal ? (
                <Link to={c.action}>
                  <button className="mt-1 rounded-xl px-4 py-2 text-xs font-semibold text-white transition-all hover:scale-105" style={{ background: `${c.color}20`, border: `1px solid ${c.color}40`, color: c.color }}>
                    {c.cta} →
                  </button>
                </Link>
              ) : (
                <a href={c.action}>
                  <button className="mt-1 rounded-xl px-4 py-2 text-xs font-semibold transition-all hover:scale-105" style={{ background: `${c.color}20`, border: `1px solid ${c.color}40`, color: c.color }}>
                    {c.cta} →
                  </button>
                </a>
              )}
            </div>
          ))}
        </div>

        {/* Contact Form + Location */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Form */}
          <div className="rounded-3xl p-8 space-y-5" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
            <h2 className="text-xl font-black text-white">Send Us a Message</h2>
            {sent ? (
              <div className="flex flex-col items-center py-10 gap-4 text-center">
                <CheckCircle className="h-14 w-14" style={{ color: "var(--t-a1)" }} />
                <div className="font-bold text-white text-lg">Message Sent!</div>
                <p className="text-white/50 text-sm">Your email client opened with your message. We'll get back to you within 24 hours.</p>
                <button onClick={() => setSent(false)} className="text-xs text-white/40 hover:text-white transition-colors">Send another message</button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-white/40 mb-1.5 block">Your Name</label>
                    <input required style={inputStyle} placeholder="Arjun Kumar" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
                  </div>
                  <div>
                    <label className="text-xs text-white/40 mb-1.5 block">Email Address</label>
                    <input required type="email" style={inputStyle} placeholder="arjun@email.com" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
                  </div>
                </div>
                <div>
                  <label className="text-xs text-white/40 mb-1.5 block">Subject</label>
                  <input required style={inputStyle} placeholder="Payment issue / General query..." value={form.subject} onChange={e => setForm(f => ({ ...f, subject: e.target.value }))} />
                </div>
                <div>
                  <label className="text-xs text-white/40 mb-1.5 block">Message</label>
                  <textarea required rows={5} style={{ ...inputStyle, resize: "vertical" }} placeholder="Describe your issue or question in detail..." value={form.message} onChange={e => setForm(f => ({ ...f, message: e.target.value }))} />
                </div>
                <button type="submit" className="w-full flex items-center justify-center gap-2 rounded-2xl py-3 font-semibold text-white transition-all hover:scale-[1.02]" style={{ background: "linear-gradient(135deg, var(--t-a1), var(--t-a2))" }}>
                  <Send className="h-4 w-4" /> Send Message
                </button>
              </form>
            )}
          </div>

          {/* Info */}
          <div className="space-y-5">
            <div className="rounded-2xl p-6 space-y-4" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
              <h3 className="font-bold text-white flex items-center gap-2"><MapPin className="h-4 w-4" style={{ color: "var(--t-a1)" }} /> Office</h3>
              <div className="space-y-1 text-sm text-white/50">
                <p>Freelancer India</p>
                <p>India 🇮🇳</p>
                <p className="text-xs text-white/30 mt-2">Fully remote team — we serve all of India.</p>
              </div>
            </div>
            <div className="rounded-2xl p-6 space-y-4" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
              <h3 className="font-bold text-white flex items-center gap-2"><Clock className="h-4 w-4" style={{ color: "var(--t-a1)" }} /> Support Hours</h3>
              <div className="space-y-2 text-sm text-white/50">
                <div className="flex justify-between"><span>Monday – Friday</span><span className="text-white">9 AM – 8 PM IST</span></div>
                <div className="flex justify-between"><span>Saturday</span><span className="text-white">10 AM – 5 PM IST</span></div>
                <div className="flex justify-between"><span>Sunday</span><span className="text-white/30">Closed</span></div>
              </div>
            </div>
            <div className="rounded-2xl p-6 space-y-3" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
              <h3 className="font-bold text-white flex items-center gap-2"><HelpCircle className="h-4 w-4" style={{ color: "var(--t-a1)" }} /> Quick Links</h3>
              <div className="space-y-2">
                {[
                  ["Help & Support Centre", "/help-support"],
                  ["How It Works", "/how-it-works"],
                  ["Pricing & Plans", "/pricing"],
                  ["Legal Documents", "/legal/terms-of-service"],
                ].map(([label, href]) => (
                  <Link key={href} to={href} className="flex items-center justify-between text-sm text-white/50 hover:text-white transition-colors py-1">
                    <span>{label}</span>
                    <span>→</span>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* FAQs */}
        <div>
          <h2 className="text-3xl font-black text-white text-center mb-10">Frequently Asked Questions</h2>
          <div className="space-y-4">
            {FAQS.map(faq => (
              <div key={faq.q} className="rounded-2xl p-6 space-y-2" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
                <div className="flex items-start gap-3">
                  <HelpCircle className="h-4 w-4 shrink-0 mt-0.5" style={{ color: "var(--t-a1)" }} />
                  <div>
                    <p className="font-semibold text-white text-sm">{faq.q}</p>
                    <p className="text-sm text-white/50 mt-1 leading-relaxed">{faq.a}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
