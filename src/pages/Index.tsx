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

    /* ── NEW: Particle drift ── */
    @keyframes particle-drift {
      0%   { transform: translateY(0px) translateX(0px) scale(1); opacity: 0; }
      10%  { opacity: 1; }
      90%  { opacity: 1; }
      100% { transform: translateY(-120px) translateX(var(--drift-x, 20px)) scale(0.4); opacity: 0; }
    }
    /* ── NEW: Shimmer scan line ── */
    @keyframes shimmer-scan {
      0%   { transform: translateX(-100%) skewX(-15deg); }
      100% { transform: translateX(300%) skewX(-15deg); }
    }
    /* ── NEW: Orbit rings ── */
    @keyframes orbit-cw  { from { transform: rotate(0deg);   } to { transform: rotate(360deg);  } }
    @keyframes orbit-ccw { from { transform: rotate(0deg);   } to { transform: rotate(-360deg); } }
    /* ── NEW: Neon border pulse ── */
    @keyframes neon-border {
      0%,100% { box-shadow: 0 0 8px rgba(var(--t-a1-rgb),0.4), 0 0 30px rgba(var(--t-a1-rgb),0.15), inset 0 0 8px rgba(var(--t-a1-rgb),0.05); }
      50%     { box-shadow: 0 0 20px rgba(var(--t-a1-rgb),0.7), 0 0 60px rgba(var(--t-a1-rgb),0.3), inset 0 0 15px rgba(var(--t-a1-rgb),0.1); }
    }
    /* ── NEW: Sparkle burst ── */
    @keyframes sparkle {
      0%   { transform: scale(0) rotate(0deg); opacity:0; }
      50%  { opacity: 1; }
      100% { transform: scale(1.5) rotate(180deg); opacity: 0; }
    }
    /* ── NEW: Blink cursor ── */
    @keyframes blink-cursor {
      0%,100% { opacity: 1; }
      50%     { opacity: 0; }
    }
    /* ── NEW: Morph blob ── */
    @keyframes morph-blob {
      0%,100% { border-radius: 60% 40% 30% 70% / 60% 30% 70% 40%; }
      25%     { border-radius: 30% 60% 70% 40% / 50% 60% 30% 60%; }
      50%     { border-radius: 50% 50% 20% 80% / 25% 80% 20% 75%; }
      75%     { border-radius: 67% 33% 47% 53% / 37% 20% 80% 63%; }
    }
    /* ── NEW: Wave stagger ── */
    @keyframes wave-up {
      from { opacity:0; transform: translateY(30px) scale(0.97); }
      to   { opacity:1; transform: translateY(0)    scale(1); }
    }
    /* ── NEW: Glow ping ── */
    @keyframes glow-ping {
      0%   { transform: scale(1);   opacity: 0.8; }
      100% { transform: scale(2.2); opacity: 0; }
    }
    /* ── NEW: Scan line (hero card) ── */
    @keyframes scan-line {
      0%   { top: -10%; }
      100% { top: 110%; }
    }
    /* ── NEW: Hue rotate ── */
    @keyframes hue-rotate {
      0%   { filter: hue-rotate(0deg); }
      100% { filter: hue-rotate(360deg); }
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
    .rotate-3d    { animation: rotate-3d    10s ease-in-out infinite; }
    .marquee-track { animation: marquee 30s linear infinite; }
    .orbit-cw-12  { animation: orbit-cw  12s linear infinite; }
    .orbit-cw-18  { animation: orbit-cw  18s linear infinite; }
    .orbit-ccw-15 { animation: orbit-ccw 15s linear infinite; }
    .neon-border  { animation: neon-border 3s ease-in-out infinite; }
    .morph-blob   { animation: morph-blob 10s ease-in-out infinite; }
    .blink-cursor { animation: blink-cursor 1s step-end infinite; }
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
    /* shimmer btn */
    .shimmer-btn { position: relative; overflow: hidden; }
    .shimmer-btn::after {
      content: '';
      position: absolute;
      top: 0; left: 0; bottom: 0;
      width: 40%;
      background: linear-gradient(90deg, transparent, rgba(255,255,255,0.25), transparent);
      animation: shimmer-scan 2.4s ease-in-out infinite;
    }
    /* glow ping ring */
    .glow-ping::before {
      content: '';
      position: absolute;
      inset: -4px;
      border-radius: inherit;
      border: 2px solid rgba(var(--t-a1-rgb), 0.6);
      animation: glow-ping 1.8s ease-out infinite;
    }
    /* feature card shimmer on hover */
    .card-shimmer { position: relative; overflow: hidden; }
    .card-shimmer::before {
      content: '';
      position: absolute;
      top: 0; left: -80%;
      width: 60%; height: 100%;
      background: linear-gradient(90deg, transparent, rgba(255,255,255,0.06), transparent);
      transform: skewX(-15deg);
      transition: none;
    }
    .card-shimmer:hover::before {
      animation: shimmer-scan 0.8s ease both;
    }
    /* ripple */
    .ripple-container { position: relative; overflow: hidden; }
    @keyframes ripple-expand {
      to { transform: scale(4); opacity: 0; }
    }
    .ripple-wave {
      position: absolute;
      border-radius: 50%;
      background: rgba(255,255,255,0.25);
      transform: scale(0);
      animation: ripple-expand 0.6s linear;
      pointer-events: none;
    }
    /* toast in/out for floating notifications */
    @keyframes toast-in {
      from { opacity:0; transform: translateX(60px) scale(0.9); }
      to   { opacity:1; transform: translateX(0)   scale(1); }
    }
    @keyframes toast-out {
      from { opacity:1; transform: translateX(0)   scale(1); }
      to   { opacity:0; transform: translateX(60px) scale(0.9); }
    }
    /* live job feed tags */
    @keyframes marquee-right { 0% { transform:translateX(0); } 100% { transform:translateX(-50%); } }
    .marquee-right { animation: marquee-right 22s linear infinite; }
    /* counter glow */
    @keyframes counter-pop {
      0%   { transform:scale(1); }
      40%  { transform:scale(1.15); }
      100% { transform:scale(1); }
    }
    .counter-pop { animation: counter-pop 0.4s cubic-bezier(.17,.67,.34,1.4) both; }
    /* progress bar fill */
    @keyframes bar-fill { from { width:0%; } to { width:var(--bar-w,80%); } }
    /* spotlight follow */
    .spotlight-card { position: relative; overflow: hidden; }
    .spotlight-card::after {
      content: '';
      position: absolute;
      width: 200px; height: 200px;
      border-radius: 50%;
      background: radial-gradient(circle, rgba(255,255,255,0.08) 0%, transparent 70%);
      left: var(--mx, -200px);
      top:  var(--my, -200px);
      transform: translate(-50%, -50%);
      pointer-events: none;
      transition: left 0.1s, top 0.1s;
    }
    /* magnetic float */
    .magnetic-btn { transition: transform 0.2s cubic-bezier(.17,.67,.34,1.4); }
    /* cursor trail sparkle */
    @keyframes cursor-trail {
      0%   { opacity: 0.9; transform: translate(-50%,-50%) scale(1); }
      100% { opacity: 0;   transform: translate(-50%,-50%) scale(0.1) translateY(-18px); }
    }
    /* floating skill tags */
    @keyframes float-tag {
      0%   { opacity: 0; transform: translateY(0px); }
      10%  { opacity: 1; }
      85%  { opacity: 0.9; }
      100% { opacity: 0; transform: translateY(-170px); }
    }
    /* aurora blobs drift */
    @keyframes aurora-drift {
      0%   { transform: translate(0, 0) scale(1); }
      30%  { transform: translate(50px, -35px) scale(1.12); }
      65%  { transform: translate(-30px, 40px) scale(0.9); }
      100% { transform: translate(0, 0) scale(1); }
    }
    /* animated gradient headline */
    @keyframes gradient-shift {
      0%   { background-position: 0% 50%; }
      50%  { background-position: 100% 50%; }
      100% { background-position: 0% 50%; }
    }
    .animated-headline {
      background: linear-gradient(270deg, #fff 0%, #a78bfa 25%, #60a5fa 50%, #f0abfc 75%, #fff 100%);
      background-size: 300% 300%;
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      animation: gradient-shift 6s ease-in-out infinite;
    }
    /* live dot pulse */
    @keyframes live-bounce { 0%,100% { transform:scale(1); opacity:1; } 50% { transform:scale(1.5); opacity:0.6; } }
    .live-dot-pulse { animation: live-bounce 1.4s ease-in-out infinite; }
    /* constellation canvas fade in */
    .constellation-canvas { animation: slide-up 1.2s ease 0.1s both; }
    /* rotating rainbow border */
    @keyframes spin-360 { to { transform: rotate(360deg); } }
    .rainbow-border { position:relative; border-radius:26px; overflow:hidden; padding:2px; }
    .rainbow-border::before {
      content:''; position:absolute;
      top:50%; left:50%; width:200%; padding-bottom:200%;
      background: conic-gradient(#6366f1,#8b5cf6,#ec4899,#fbbf24,#4ade80,#60a5fa,#f97316,#6366f1);
      transform:translate(-50%,-50%);
      animation: spin-360 5s linear infinite;
      opacity:0.75;
    }
    .rainbow-border-inner { position:relative; z-index:1; border-radius:24px; overflow:hidden; }
    /* money badge float */
    @keyframes money-float {
      0%   { opacity:0; transform:translateY(0) scale(0.85); }
      12%  { opacity:1; transform:translateY(-12px) scale(1); }
      88%  { opacity:1; }
      100% { opacity:0; transform:translateY(-220px) scale(0.9); }
    }
    /* split char reveal */
    @keyframes split-char {
      from { opacity:0; transform:translateY(24px) rotateX(-40deg); }
      to   { opacity:1; transform:translateY(0) rotateX(0deg); }
    }
    /* sparkle star burst */
    @keyframes star-burst {
      0%   { opacity:1; transform:translate(0,0) scale(1) rotate(0deg); }
      100% { opacity:0; transform:translate(var(--sx,30px),var(--sy,-30px)) scale(0) rotate(180deg); }
    }
    /* highlight sweep — reveals colored underline */
    @keyframes underline-grow { from { width:0; } to { width:100%; } }
    .underline-glow { position:relative; display:inline-block; }
    .underline-glow::after {
      content:''; position:absolute; bottom:-4px; left:0; height:3px; width:0;
      background:linear-gradient(90deg,var(--t-a1),var(--t-a2),#4ade80);
      border-radius:4px; box-shadow:0 0 10px var(--t-a1);
      animation: underline-grow 1.2s ease 0.8s both;
    }
    /* count pop for stats */
    @keyframes stat-pop {
      0%  { transform:scale(1); }
      50% { transform:scale(1.18); filter:drop-shadow(0 0 12px var(--t-a1)); }
      100%{ transform:scale(1); filter:none; }
    }
    .stat-pop-anim { animation: stat-pop 0.5s cubic-bezier(.17,.67,.34,1.4) both; }

    /* ── Meteor shower ── */
    @keyframes meteor-fall {
      0%   { transform: translateX(0) translateY(0); opacity: 1; }
      70%  { opacity: 0.6; }
      100% { transform: translateX(400px) translateY(400px); opacity: 0; }
    }
    .meteor {
      position: absolute;
      height: 2px;
      background: linear-gradient(90deg, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0.1) 60%, transparent 100%);
      border-radius: 9999px;
      transform: rotate(-35deg);
      animation: meteor-fall linear infinite;
    }
    .meteor::after {
      content: '';
      position: absolute;
      right: 0; top: 50%;
      transform: translateY(-50%);
      width: 5px; height: 5px;
      border-radius: 50%;
      background: white;
      box-shadow: 0 0 6px 3px rgba(180,180,255,0.7);
    }

    /* ── Emoji bubble rise ── */
    @keyframes emoji-bubble {
      0%   { transform: translateY(0) scale(1) rotate(0deg); opacity: 0.85; }
      40%  { transform: translateY(-80px) scale(1.15) rotate(6deg); opacity: 0.6; }
      80%  { transform: translateY(-160px) scale(0.9) rotate(-4deg); opacity: 0.3; }
      100% { transform: translateY(-230px) scale(0.7) rotate(8deg); opacity: 0; }
    }
    .emoji-bubble { animation: emoji-bubble ease-in-out infinite; pointer-events: none; user-select: none; }

    /* ── Neon card border pulse ── */
    @keyframes neon-card-pulse {
      0%, 100% { box-shadow: 0 0 0px rgba(var(--t-a1-rgb),0); border-color: rgba(255,255,255,0.08); }
      50%      { box-shadow: 0 0 18px rgba(var(--t-a1-rgb),0.35), 0 0 40px rgba(var(--t-a1-rgb),0.12); border-color: rgba(var(--t-a1-rgb),0.45); }
    }
    .neon-card { animation: neon-card-pulse 3s ease-in-out infinite; }

    /* ── Ripple expand rings ── */
    @keyframes ripple-ring {
      0%   { transform: translate(-50%,-50%) scale(0.3); opacity: 0.7; }
      100% { transform: translate(-50%,-50%) scale(2.5); opacity: 0; }
    }
    .ripple-ring { animation: ripple-ring ease-out infinite; border-radius: 50%; position: absolute; top: 50%; left: 50%; pointer-events: none; }

    /* ── Wave 5: Traveling beam along connector ── */
    @keyframes beam-travel {
      0%   { left: -80px; opacity: 0; }
      6%   { opacity: 1; }
      92%  { opacity: 1; }
      100% { left: calc(100% + 80px); opacity: 0; }
    }
    /* ── Wave 5: LIVE badge dot pulse ── */
    @keyframes live-badge-pulse {
      0%,100% { box-shadow: 0 0 0 0 rgba(74,222,128,0.7); }
      60%     { box-shadow: 0 0 0 6px rgba(74,222,128,0); }
    }
    .live-badge-dot { animation: live-badge-pulse 1.6s ease-in-out infinite; }
    /* ── Wave 5: Star pop sequential ── */
    @keyframes star-pop {
      0%   { transform: scale(0) rotate(-30deg); opacity:0; }
      60%  { transform: scale(1.4) rotate(8deg);  opacity:1; }
      100% { transform: scale(1)   rotate(0deg);  opacity:1; }
    }
    /* ── Wave 5: Glitch layers ── */
    @keyframes glitch-clip-1 {
      0%,89%,100% { clip-path: inset(0 0 100% 0); transform: none; }
      90%  { clip-path: inset(28% 0 55% 0); transform: translate(-4px, 0); }
      92%  { clip-path: inset(60% 0 20% 0); transform: translate(4px, 0); }
      94%  { clip-path: inset(10% 0 75% 0); transform: translate(-2px, 0); }
      96%  { clip-path: inset(45% 0 40% 0); transform: translate(2px, 0); }
      98%  { clip-path: inset(80% 0 5% 0);  transform: none; }
    }
    @keyframes glitch-clip-2 {
      0%,91%,100% { clip-path: inset(0 0 100% 0); transform: none; }
      92%  { clip-path: inset(50% 0 30% 0); transform: translate(4px, 0); }
      94%  { clip-path: inset(15% 0 65% 0); transform: translate(-3px, 0); }
      96%  { clip-path: inset(75% 0 10% 0); transform: translate(3px, 0); }
      98%  { clip-path: inset(35% 0 50% 0); transform: none; }
    }
    /* ── Wave 5: Service icon spin on hover ── */
    .service-icon-wrap { transition: transform 0.5s cubic-bezier(0.68,-0.55,0.265,1.55); }
    .service-3d:hover .service-icon-wrap { transform: rotate(360deg) scale(1.15); }
    /* ── Wave 5: CTA ticker ── */
    @keyframes ticker-in {
      from { transform: translateY(10px); opacity:0; }
      to   { transform: translateY(0);    opacity:1; }
    }
    /* ── Wave 5: FAQ line sweep ── */
    @keyframes faq-sweep {
      from { transform: translateX(-100%) skewX(-10deg); opacity:0.6; }
      to   { transform: translateX(250%)  skewX(-10deg); opacity:0; }
    }
    /* ── Wave 5: Footer social icon glow ── */
    .social-icon { transition: all 0.25s ease; }
    .social-icon:hover { transform: scale(1.2) translateY(-2px); box-shadow: 0 0 16px rgba(var(--t-a1-rgb),0.5) !important; border-color: rgba(var(--t-a1-rgb),0.5) !important; }
    .social-icon:hover svg { color: var(--t-a1) !important; }

    /* ── Wave 6: Confetti particle ── */
    @keyframes confetti-fly {
      0%   { transform: translate(0,0) rotate(0deg) scale(1); opacity:1; }
      80%  { opacity:0.8; }
      100% { transform: translate(var(--vx,0px),var(--vy,-90px)) rotate(var(--vr,360deg)) scale(0.2); opacity:0; }
    }
    /* ── Wave 6: Radar ping rings ── */
    @keyframes radar-ring {
      0%   { transform: scale(1);   opacity:0.55; }
      100% { transform: scale(2.9); opacity:0; }
    }
    /* ── Wave 6: Quote icon float-bob ── */
    @keyframes quote-bob {
      0%,100% { transform: translateY(0)   rotate(-4deg) scale(1); }
      50%     { transform: translateY(-9px) rotate(4deg)  scale(1.1); }
    }
    /* ── Wave 6: Opposite marquee ── */
    @keyframes marquee-opposite { 0% { transform:translateX(-50%); } 100% { transform:translateX(0); } }
    /* ── Wave 6: Neon divider pulse ── */
    @keyframes divider-glow {
      0%,100% { opacity:0.35; }
      50%     { opacity:0.9; }
    }
    /* ── Wave 6: Word by word reveal ── */
    @keyframes word-in {
      from { opacity:0; transform:translateY(22px) skewY(3deg); }
      to   { opacity:1; transform:translateY(0)    skewY(0deg); }
    }
    /* ── Wave 6: Hover shimmer on trust logos ── */
    .trust-logo { transition: all 0.3s ease; }
    .trust-logo:hover { transform: scale(1.08); filter: brightness(1.3); }

    /* ── Wave 7: Floating emoji ── */
    @keyframes emoji-float {
      0%   { transform: translateY(0) scale(0) rotate(-15deg); opacity:0; }
      12%  { transform: translateY(-20px) scale(1.15) rotate(8deg); opacity:1; }
      88%  { opacity:0.85; }
      100% { transform: translateY(-170px) scale(0.5) rotate(22deg); opacity:0; }
    }
    /* ── Wave 7: Holographic shine ── */
    .holo-card { position:relative; overflow:hidden; }
    .holo-card::after {
      content:''; position:absolute; inset:0; pointer-events:none; border-radius:inherit;
      background: radial-gradient(circle at var(--hx,50%) var(--hy,50%),
        rgba(255,255,255,0.14) 0%, rgba(var(--t-a1-rgb),0.1) 28%, rgba(var(--t-a2-rgb),0.06) 50%, transparent 68%);
      opacity: var(--holo-op,0); transition: opacity 0.4s ease;
    }
    /* ── Wave 7: Character wave ── */
    @keyframes char-wave {
      0%,100% { transform:translateY(0px) rotate(0deg); }
      50%     { transform:translateY(-8px) rotate(-2deg); }
    }
    /* ── Wave 7: Section badge glow pulse ── */
    @keyframes badge-glow {
      0%,100% { box-shadow:0 0 0 0 rgba(var(--t-a1-rgb),0); }
      50%     { box-shadow:0 0 0 5px rgba(var(--t-a1-rgb),0.18), 0 0 22px rgba(var(--t-a1-rgb),0.12); }
    }
    .badge-pulse { animation: badge-glow 2.8s ease-in-out infinite; }
    /* ── Wave 7: Magnetic wrapper spring ── */
    .magnetic-wrap { transition: transform 0.35s cubic-bezier(.17,.67,.34,1.4); display:inline-block; }
    /* ── Spinning accent border ── */
    .accent-spin-border { position:relative; border-radius:18px; padding:1.5px; }
    .accent-spin-border::before {
      content:''; position:absolute; inset:0; border-radius:18px; overflow:hidden;
      background: conic-gradient(from 0deg, transparent 30%, rgba(var(--t-a1-rgb),0.8) 50%, rgba(var(--t-a2-rgb),0.6) 60%, transparent 70%);
      animation: spin-360 4s linear infinite; z-index:0; mask: linear-gradient(#fff 0 0) padding-box,linear-gradient(#fff 0 0);
      mask-composite: exclude; -webkit-mask-composite: destination-out; padding: 1.5px;
    }
    .accent-spin-border-inner { position:relative; z-index:1; border-radius:16.5px; width:100%; height:100%; }
    /* ── Counter glow burst ── */
    @keyframes counter-burst {
      0%   { text-shadow: none; transform: scale(1); }
      35%  { text-shadow: 0 0 18px rgba(var(--t-a1-rgb),0.95), 0 0 36px rgba(var(--t-a2-rgb),0.6); transform: scale(1.14); }
      100% { text-shadow: none; transform: scale(1); }
    }
    /* ── Service card scan shimmer ── */
    .service-scan { position:relative; overflow:hidden; }
    .service-scan::after {
      content:''; position:absolute; top:0; left:-120%; width:60%; height:100%;
      background: linear-gradient(105deg, transparent 30%, rgba(255,255,255,0.10) 50%, transparent 70%);
      transition: none;
    }
    .service-scan:hover::after { animation: scan-sweep 0.55s ease forwards; }
    @keyframes scan-sweep { from { left:-120%; } to { left:140%; } }
    /* ── Feature section drifting dots ── */
    @keyframes dot-drift {
      0%,100% { transform:translateY(0) translateX(0) scale(1); opacity:0.5; }
      50%      { transform:translateY(-30px) translateX(15px) scale(1.3); opacity:1; }
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
  const [burst, setBurst] = useState(false);
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
          else { setBurst(true); setTimeout(() => setBurst(false), 750); }
        };
        requestAnimationFrame(tick);
      }
    }, { threshold: 0.5 });
    obs.observe(el);
    return () => obs.disconnect();
  }, [value]);
  return <span ref={ref} style={burst ? { animation: "counter-burst 0.75s ease forwards", display: "inline-block" } : {}}>{prefix}{display}{suffix}</span>;
};

/* ─────────────────────── Hero 3D Illustration ─────────────────────── */
const HeroDashboard = () => (
  <div className="relative w-full max-w-lg mx-auto select-none hero-dashboard" style={{ perspective: "1200px" }}>

    {/* ── Orbit Ring 1 (outer) ── */}
    <div className="pointer-events-none absolute inset-0 flex items-center justify-center" style={{ zIndex: 0 }}>
      <div className="orbit-cw-18 absolute" style={{
        width: "118%", height: "118%", borderRadius: "50%",
        border: "1px dashed rgba(var(--t-a1-rgb),0.18)",
      }}>
        {/* Orbit dot */}
        <div style={{ position: "absolute", top: -4, left: "50%", transform: "translateX(-50%)", width: 8, height: 8, borderRadius: "50%", background: "var(--t-a1)", boxShadow: "0 0 10px var(--t-a1)" }} />
      </div>
    </div>

    {/* ── Orbit Ring 2 (inner ccw) ── */}
    <div className="pointer-events-none absolute inset-0 flex items-center justify-center" style={{ zIndex: 0 }}>
      <div className="orbit-ccw-15 absolute" style={{
        width: "88%", height: "88%", borderRadius: "50%",
        border: "1px solid rgba(var(--t-a2-rgb),0.12)",
      }}>
        <div style={{ position: "absolute", bottom: -4, left: "50%", transform: "translateX(-50%)", width: 6, height: 6, borderRadius: "50%", background: "var(--t-a2)", boxShadow: "0 0 8px var(--t-a2)" }} />
      </div>
    </div>

    {/* ── Scan line on the card ── */}
    <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-2xl" style={{ zIndex: 2 }}>
      <div style={{
        position: "absolute", left: 0, right: 0, height: 2,
        background: "linear-gradient(90deg, transparent, rgba(var(--t-a1-rgb),0.5), transparent)",
        animation: "scan-line 4s linear infinite",
        filter: "blur(1px)",
      }} />
    </div>

    {/* Main dashboard card */}
    <div className="glass neon-border rounded-2xl p-5 shadow-2xl" style={{ position: "relative", zIndex: 1, boxShadow: "0 40px 80px -20px rgba(0,0,0,0.6), 0 0 60px rgba(var(--t-a1-rgb),0.15)" }}>
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

/* ─────────────────────── Wave 5: Traveling Beam ─────────────────────── */
const TravelingBeam = () => (
  <div className="absolute top-16 left-[12.5%] right-[12.5%] h-px pointer-events-none hidden lg:block" style={{ zIndex: 5 }}>
    <div style={{
      position: "absolute", top: "-3px", height: "7px", width: "70px", borderRadius: "99px",
      background: "linear-gradient(90deg, transparent, rgba(var(--t-a1-rgb),1), rgba(var(--t-a2-rgb),1), transparent)",
      boxShadow: "0 0 18px 4px rgba(var(--t-a1-rgb),0.7)",
      animation: "beam-travel 3.8s ease-in-out infinite",
    }} />
  </div>
);

/* ─────────────────────── Wave 5: Live Stat Badge ─────────────────────── */
const LiveBadge = () => (
  <div className="absolute top-3 right-3 flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider" style={{ background: "rgba(74,222,128,0.1)", border: "1px solid rgba(74,222,128,0.25)" }}>
    <span className="live-badge-dot inline-block h-1.5 w-1.5 rounded-full" style={{ background: "#4ade80" }} />
    <span style={{ color: "#4ade80" }}>Live</span>
  </div>
);

/* ─────────────────────── Wave 5: Animated Rating Stars ─────────────────────── */
const AnimatedStars = ({ rating }: { rating: number }) => {
  const [hoverKey, setHoverKey] = useState(0);
  return (
    <div className="flex gap-0.5" onMouseEnter={() => setHoverKey(k => k + 1)}>
      {[1, 2, 3, 4, 5].map((s) => (
        <Star
          key={`${hoverKey}-${s}`}
          className={cn("h-3 w-3", s <= rating ? "fill-amber-400 text-amber-400" : "text-white/20")}
          style={hoverKey > 0 && s <= rating ? { animation: `star-pop 0.35s cubic-bezier(.17,.67,.34,1.4) ${(s - 1) * 80}ms both` } : {}}
        />
      ))}
    </div>
  );
};

/* ─────────────────────── Wave 5: Glitch Heading ─────────────────────── */
const GlitchText = ({ text, className = "" }: { text: string; className?: string }) => (
  <span className={`relative inline-block ${className}`}>
    <span className="relative z-10">{text}</span>
    <span aria-hidden className="absolute inset-0 z-20 text-indigo-400" style={{ animation: "glitch-clip-1 9s step-end infinite" }}>{text}</span>
    <span aria-hidden className="absolute inset-0 z-20 text-pink-400" style={{ animation: "glitch-clip-2 9s step-end infinite 0.15s" }}>{text}</span>
  </span>
);

/* ─────────────────────── Wave 5: CTA Urgency Counter ─────────────────────── */
const CTAUrgencyCounter = () => {
  const [count, setCount] = useState(134);
  const [anim, setAnim] = useState(false);
  useEffect(() => {
    const id = setInterval(() => {
      if (Math.random() > 0.55) {
        setCount(c => c + 1);
        setAnim(true);
        setTimeout(() => setAnim(false), 400);
      }
    }, 2800);
    return () => clearInterval(id);
  }, []);
  return (
    <div className="inline-flex items-center gap-2.5 rounded-full px-5 py-2 mb-7 text-sm font-semibold" style={{ background: "rgba(74,222,128,0.08)", border: "1px solid rgba(74,222,128,0.22)" }}>
      <span className="live-badge-dot inline-block h-2 w-2 rounded-full" style={{ background: "#4ade80" }} />
      <span style={{ color: "#4ade80" }}>
        <span className="font-black" style={{ animation: anim ? "ticker-in 0.3s ease both" : "none" }}>{count}</span> people joined today
      </span>
    </div>
  );
};

/* ─────────────────────── Wave 5: FAQ Sweep ─────────────────────── */
const FAQSweep = ({ active }: { active: boolean }) => (
  active ? (
    <div className="absolute inset-0 overflow-hidden rounded-2xl pointer-events-none">
      <div style={{ position: "absolute", top: 0, left: 0, width: "50%", height: "100%", background: "linear-gradient(90deg, transparent, rgba(var(--t-a1-rgb),0.12), transparent)", animation: "faq-sweep 0.7s ease both" }} />
    </div>
  ) : null
);

/* ─────────────────────── Wave 6: Confetti Burst ─────────────────────── */
const CONFETTI_COLORS = ["#6366f1","#8b5cf6","#ec4899","#f59e0b","#4ade80","#60a5fa","#f97316","#e879f9","#34d399","#fb7185"];
const fireConfetti = (e: React.MouseEvent<HTMLElement>) => {
  const r = e.currentTarget.getBoundingClientRect();
  const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
  for (let i = 0; i < 32; i++) {
    const angle = (i / 32) * Math.PI * 2;
    const dist = 55 + Math.random() * 140;
    const vx = Math.cos(angle) * dist;
    const vy = Math.sin(angle) * dist - 55;
    const size = 5 + Math.random() * 9;
    const el = document.createElement("div");
    el.style.cssText = `position:fixed;left:${cx}px;top:${cy}px;width:${size}px;height:${size}px;background:${CONFETTI_COLORS[i % CONFETTI_COLORS.length]};border-radius:${Math.random() > 0.5 ? "50%" : "3px"};pointer-events:none;z-index:9999;--vx:${vx}px;--vy:${vy}px;--vr:${200 + Math.random() * 520}deg;animation:confetti-fly 1s cubic-bezier(.17,.67,.12,.99) ${Math.random() * 0.12}s forwards;`;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 1200);
  }
};

/* ─────────────────────── Wave 6: Radar Rings ─────────────────────── */
const RadarRings = () => (
  <>
    <div className="absolute inset-0 rounded-full pointer-events-none" style={{ border: "1.5px solid rgba(var(--t-a1-rgb),0.45)", animation: "radar-ring 2.4s ease-out infinite" }} />
    <div className="absolute inset-0 rounded-full pointer-events-none" style={{ border: "1.5px solid rgba(var(--t-a2-rgb),0.3)", animation: "radar-ring 2.4s ease-out infinite 0.8s" }} />
  </>
);

/* ─────────────────────── Wave 6: Opposite-direction marquee ─────────────────────── */
const TECH_TAGS = ["React","Node.js","Figma","Python","Vue.js","MongoDB","AWS","Laravel","Flutter","Swift","Kotlin","PostgreSQL","TypeScript","Next.js","Django","Redis","GraphQL","Tailwind","Docker","Supabase","Prisma","Firebase"];
const OppositeMarquee = () => (
  <div style={{ overflow: "hidden", position: "relative", padding: "10px 0", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
    <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 80, background: "linear-gradient(to right, var(--t-bg), transparent)", zIndex: 2 }} />
    <div style={{ position: "absolute", right: 0, top: 0, bottom: 0, width: 80, background: "linear-gradient(to left, var(--t-bg), transparent)", zIndex: 2 }} />
    <div style={{ display: "flex", gap: "0.75rem", width: "max-content", animation: "marquee-opposite 28s linear infinite" }}>
      {[...TECH_TAGS, ...TECH_TAGS].map((tag, i) => (
        <span key={i} style={{ display: "inline-flex", alignItems: "center", gap: 6, borderRadius: 100, padding: "5px 14px", fontSize: 11, fontWeight: 600, whiteSpace: "nowrap", background: "rgba(var(--t-a2-rgb),0.07)", border: "1px solid rgba(var(--t-a2-rgb),0.18)", color: "rgba(var(--t-a2-rgb),0.85)" }}>
          <span style={{ width: 5, height: 5, borderRadius: "50%", background: "rgba(var(--t-a2-rgb),0.7)", display: "inline-block" }} />
          {tag}
        </span>
      ))}
    </div>
  </div>
);

/* ─────────────────────── Wave 6: Neon Section Divider ─────────────────────── */
const NeonDivider = () => (
  <div style={{ position: "relative", height: 1, overflow: "hidden", background: "rgba(255,255,255,0.04)" }}>
    <div style={{ position: "absolute", inset: 0, background: "linear-gradient(90deg,transparent,rgba(var(--t-a1-rgb),0.7),rgba(var(--t-a2-rgb),0.9),rgba(52,211,153,0.6),transparent)", animation: "divider-glow 3.5s ease-in-out infinite" }} />
    <div style={{ position: "absolute", top: -3, height: 7, width: 90, borderRadius: 99, background: "linear-gradient(90deg,transparent,rgba(var(--t-a1-rgb),1),rgba(var(--t-a2-rgb),1),transparent)", boxShadow: "0 0 16px 3px rgba(var(--t-a1-rgb),0.65)", animation: "beam-travel 4.5s ease-in-out infinite 0.5s" }} />
  </div>
);

/* ─────────────────────── Wave 6: Word-by-Word Reveal ─────────────────────── */
const WordReveal = ({ text, className = "", delay = 0 }: { text: string; className?: string; delay?: number }) => {
  const [vis, setVis] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const el = ref.current; if (!el) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setVis(true); obs.disconnect(); } }, { threshold: 0.4 });
    obs.observe(el); return () => obs.disconnect();
  }, []);
  return (
    <span ref={ref} className={className}>
      {text.split(" ").map((word, i) => (
        <span key={i} style={{ display: "inline-block", marginRight: "0.3em", opacity: vis ? 1 : 0, transform: vis ? "none" : "translateY(22px) skewY(3deg)", transition: `opacity 0.5s ease ${delay + i * 110}ms, transform 0.5s cubic-bezier(.17,.67,.34,1.2) ${delay + i * 110}ms` }}>
          {word}
        </span>
      ))}
    </span>
  );
};

/* ─────────────────────── Wave 7: Floating Emoji ─────────────────────── */

/* ─────────────────────── Wave 7: Magnetic Wrapper ─────────────────────── */
const MagneticWrapper = ({ children, strength = 0.4 }: { children: React.ReactNode; strength?: number }) => {
  const ref = useRef<HTMLDivElement>(null);
  const onMove = (e: React.MouseEvent) => {
    const el = ref.current; if (!el) return;
    const r = el.getBoundingClientRect();
    const x = (e.clientX - r.left - r.width / 2) * strength;
    const y = (e.clientY - r.top - r.height / 2) * strength;
    el.style.transform = `translate(${x}px,${y}px) scale(1.04)`;
  };
  const onLeave = () => { if (ref.current) ref.current.style.transform = "translate(0,0) scale(1)"; };
  return (
    <div ref={ref} className="magnetic-wrap" onMouseMove={onMove} onMouseLeave={onLeave}>
      {children}
    </div>
  );
};

/* ─────────────────────── Wave 7: Holographic Stat Card ─────────────────────── */
const HoloCard = ({ children, className = "", style: st = {} }: { children: React.ReactNode; className?: string; style?: React.CSSProperties }) => {
  const ref = useRef<HTMLDivElement>(null);
  const onMove = (e: React.MouseEvent) => {
    const el = ref.current; if (!el) return;
    const r = el.getBoundingClientRect();
    el.style.setProperty("--hx", `${((e.clientX - r.left) / r.width) * 100}%`);
    el.style.setProperty("--hy", `${((e.clientY - r.top) / r.height) * 100}%`);
    el.style.setProperty("--holo-op", "1");
  };
  const onLeave = () => ref.current?.style.setProperty("--holo-op", "0");
  return (
    <div ref={ref} className={`holo-card ${className}`} style={st} onMouseMove={onMove} onMouseLeave={onLeave}>
      {children}
    </div>
  );
};

/* ─────────────────────── Wave 7: Wave Characters Headline ─────────────────────── */
const WaveChars = ({ text, className = "" }: { text: string; className?: string }) => (
  <span className={className}>
    {text.split("").map((ch, i) => (
      <span key={i} style={{
        display: "inline-block",
        animation: `char-wave ${2 + (i % 4) * 0.3}s ease-in-out ${i * 0.07}s infinite`,
      }}>
        {ch === " " ? "\u00A0" : ch}
      </span>
    ))}
  </span>
);

/* ─────────────────────── Wave 7: Hero Scroll Parallax ─────────────────────── */
const useParallax = (factor = 0.12) => {
  const [offset, setOffset] = useState(0);
  useEffect(() => {
    const h = () => setOffset(window.scrollY * factor);
    window.addEventListener("scroll", h, { passive: true });
    return () => window.removeEventListener("scroll", h);
  }, [factor]);
  return offset;
};

/* ─────────────────────── Rotating Rainbow Border Card ─────────────────────── */
const RotatingBorderCard = ({ children }: { children: React.ReactNode }) => (
  <div className="rainbow-border">
    <div className="rainbow-border-inner">{children}</div>
  </div>
);

/* ─────────────────────── Floating Money Badges ─────────────────────── */
const MONEY_BADGES = [
  { amount: "₹42,000", label: "App Dev",         emoji: "💻", color: "#a5b4fc", x: "72%" },
  { amount: "₹18,500", label: "UI Design",        emoji: "🎨", color: "#4ade80", x: "58%" },
  { amount: "₹67,500", label: "Full-Stack",       emoji: "🚀", color: "#60a5fa", x: "82%" },
  { amount: "₹8,750",  label: "Content",          emoji: "✍️",  color: "#fbbf24", x: "64%" },
  { amount: "₹31,200", label: "SEO Campaign",     emoji: "📈", color: "#34d399", x: "76%" },
  { amount: "₹15,000", label: "Photoshop",        emoji: "🖌️",  color: "#f9a8d4", x: "68%" },
];
const FloatingMoneyBadges = () => (
  <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 280, pointerEvents: "none", overflow: "hidden" }}>
    {MONEY_BADGES.map((b, i) => (
      <div key={i} style={{
        position: "absolute", bottom: 0, left: b.x,
        animation: `money-float ${4 + (i * 0.65) % 2.5}s ease-in ${(i * 0.9) % 5}s both infinite`,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 7, padding: "6px 13px", borderRadius: 12, background: "rgba(10,10,25,0.88)", border: `1px solid ${b.color}40`, backdropFilter: "blur(16px)", boxShadow: `0 4px 20px rgba(0,0,0,0.4), 0 0 14px ${b.color}20`, whiteSpace: "nowrap" }}>
          <span style={{ fontSize: 16 }}>{b.emoji}</span>
          <div>
            <p style={{ margin: 0, fontSize: 12, fontWeight: 800, color: b.color, lineHeight: 1.2 }}>{b.amount}</p>
            <p style={{ margin: 0, fontSize: 9.5, color: "rgba(255,255,255,0.4)", lineHeight: 1 }}>{b.label}</p>
          </div>
        </div>
      </div>
    ))}
  </div>
);

/* ─────────────────────── Split Text Reveal ─────────────────────── */
const SplitTextReveal = ({ text, className = "", delay = 0, tag = "span" }: {
  text: string; className?: string; delay?: number; tag?: "h1"|"h2"|"span"|"p";
}) => {
  const [vis, setVis] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current; if (!el) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setVis(true); obs.disconnect(); } }, { threshold: 0.3 });
    obs.observe(el); return () => obs.disconnect();
  }, []);
  return (
    <div ref={ref} className={className} style={{ perspective: 600, display: tag === "span" ? "inline" : "block" }}>
      {text.split("").map((ch, i) => (
        <span key={i} style={{ display: "inline-block", opacity: vis ? 1 : 0, transform: vis ? "translateY(0) rotateX(0)" : "translateY(28px) rotateX(-45deg)", transition: `opacity .5s ease ${delay + i * 28}ms, transform .5s cubic-bezier(.17,.67,.34,1.2) ${delay + i * 28}ms` }}>
          {ch === " " ? "\u00A0" : ch}
        </span>
      ))}
    </div>
  );
};

/* ─────────────────────── Text Scramble Hook ─────────────────────── */
const SCRAMBLE = "!@#$%^&*ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
const useScramble = (original: string) => {
  const [text, setText] = useState(original);
  const active = useRef(false);
  const trigger = () => {
    if (active.current) return;
    active.current = true;
    let iter = 0;
    const id = setInterval(() => {
      setText(original.split("").map((ch, i) => {
        if (ch === " ") return " ";
        if (i < iter) return ch;
        return SCRAMBLE[Math.floor(Math.random() * SCRAMBLE.length)];
      }).join(""));
      iter += 0.7;
      if (iter >= original.length) { clearInterval(id); setText(original); active.current = false; }
    }, 38);
  };
  return { text, trigger };
};

/* ─────────────────────── Scramble Card Title ─────────────────────── */
const ScrambleCardTitle = ({ title }: { title: string }) => {
  const { text, trigger } = useScramble(title);
  return (
    <h3 className="text-base font-bold text-white mb-2 cursor-default" onMouseEnter={trigger}>{text}</h3>
  );
};

/* ─────────────────────── Sparkle CTA Button ─────────────────────── */
const STAR_ANGLES = [0, 45, 90, 135, 180, 225, 270, 315];
const SparkleBtn = ({ children, to, className = "", style: st = {} }: { children: React.ReactNode; to: string; className?: string; style?: React.CSSProperties }) => {
  const ref = useRef<HTMLDivElement>(null);
  const burst = () => {
    const container = ref.current; if (!container) return;
    STAR_ANGLES.forEach((angle, i) => {
      const star = document.createElement("div");
      const rad = (angle * Math.PI) / 180;
      const dist = 28 + Math.random() * 20;
      const sx = Math.cos(rad) * dist;
      const sy = Math.sin(rad) * dist;
      const colors = ["#6366f1","#f472b6","#fbbf24","#4ade80","#60a5fa"];
      const color = colors[i % colors.length];
      const size = 5 + Math.random() * 5;
      Object.assign(star.style, {
        position: "absolute",
        width: `${size}px`, height: `${size}px`,
        borderRadius: "50%",
        background: color,
        top: "50%", left: "50%",
        transform: "translate(-50%,-50%)",
        pointerEvents: "none",
        zIndex: "10",
        animation: `star-burst 0.6s ${i * 0.04}s ease-out both`,
        boxShadow: `0 0 ${size * 2}px ${color}`,
      });
      star.style.setProperty("--sx", `${sx}px`);
      star.style.setProperty("--sy", `${sy}px`);
      container.appendChild(star);
      setTimeout(() => star.remove(), 700);
    });
  };
  return (
    <Link to={to}>
      <div ref={ref} className={`relative overflow-visible ${className}`}>
        <button onMouseEnter={burst} className="shimmer-btn group flex items-center justify-center gap-2 rounded-2xl px-7 py-3.5 text-base font-semibold text-white transition-all hover:scale-105 w-full sm:w-auto" style={st}>
          {children}
        </button>
      </div>
    </Link>
  );
};

/* ─────────────────────── Cursor Trail ─────────────────────── */
const TRAIL_COLORS = ["#6366f1","#8b5cf6","#ec4899","#4ade80","#f472b6","#60a5fa","#fb923c","#34d399"];
const CursorTrail = () => {
  useEffect(() => {
    let throttle = false;
    let count = 0;
    const onMove = (e: MouseEvent) => {
      if (throttle) return;
      throttle = true;
      setTimeout(() => { throttle = false; }, 35);
      count++;
      const color = TRAIL_COLORS[count % TRAIL_COLORS.length];
      const size = Math.random() * 7 + 4;
      const dot = document.createElement("div");
      Object.assign(dot.style, {
        position: "fixed",
        left: `${e.clientX}px`, top: `${e.clientY}px`,
        width: `${size}px`, height: `${size}px`,
        borderRadius: "50%",
        background: color,
        transform: "translate(-50%,-50%)",
        pointerEvents: "none",
        zIndex: "9990",
        boxShadow: `0 0 ${size * 2}px ${color}, 0 0 ${size * 4}px ${color}50`,
        animation: "cursor-trail 0.75s ease-out both",
      });
      document.body.appendChild(dot);
      setTimeout(() => dot.remove(), 750);
    };
    window.addEventListener("mousemove", onMove, { passive: true });
    return () => window.removeEventListener("mousemove", onMove);
  }, []);
  return null;
};

/* ─────────────────────── Global Ambient Glow Cursor ─────────────────────── */
const GlowCursor = () => {
  const [pos, setPos] = useState({ x: -9999, y: -9999 });
  useEffect(() => {
    const move = (e: MouseEvent) => setPos({ x: e.clientX, y: e.clientY });
    window.addEventListener("mousemove", move, { passive: true });
    return () => window.removeEventListener("mousemove", move);
  }, []);
  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden" style={{ mixBlendMode: "screen" }}>
      <div style={{ position: "absolute", left: pos.x - 280, top: pos.y - 280, width: 560, height: 560, borderRadius: "50%", background: "radial-gradient(circle, rgba(var(--t-a1-rgb),0.07) 0%, rgba(var(--t-a2-rgb),0.04) 40%, transparent 70%)", transition: "left 0.12s ease, top 0.12s ease", filter: "blur(8px)" }} />
    </div>
  );
};

/* ─────────────────────── Constellation Canvas ─────────────────────── */
const ConstellationCanvas = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return;
    const ctx = canvas.getContext("2d"); if (!ctx) return;
    const setSize = () => { canvas.width = canvas.offsetWidth; canvas.height = canvas.offsetHeight; };
    setSize();
    const w = () => canvas.width, h = () => canvas.height;
    const N = 55;
    const dots = Array.from({ length: N }, () => ({
      x: Math.random() * w(), y: Math.random() * h(),
      vx: (Math.random() - 0.5) * 0.35, vy: (Math.random() - 0.5) * 0.35,
      r: Math.random() * 1.6 + 0.5,
      hue: Math.floor(Math.random() * 60) + 220,
    }));
    let raf: number;
    const draw = () => {
      ctx.clearRect(0, 0, w(), h());
      for (let i = 0; i < N; i++) {
        for (let j = i + 1; j < N; j++) {
          const dx = dots[i].x - dots[j].x, dy = dots[i].y - dots[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 130) {
            ctx.beginPath();
            ctx.moveTo(dots[i].x, dots[i].y);
            ctx.lineTo(dots[j].x, dots[j].y);
            ctx.strokeStyle = `rgba(99,102,241,${0.18 * (1 - dist / 130)})`;
            ctx.lineWidth = 0.6;
            ctx.stroke();
          }
        }
      }
      dots.forEach(d => {
        const grd = ctx.createRadialGradient(d.x, d.y, 0, d.x, d.y, d.r * 2.5);
        grd.addColorStop(0, `hsla(${d.hue},80%,70%,0.9)`);
        grd.addColorStop(1, "transparent");
        ctx.beginPath(); ctx.arc(d.x, d.y, d.r * 2.5, 0, Math.PI * 2);
        ctx.fillStyle = grd; ctx.fill();
        d.x += d.vx; d.y += d.vy;
        if (d.x < 0 || d.x > w()) d.vx *= -1;
        if (d.y < 0 || d.y > h()) d.vy *= -1;
      });
      raf = requestAnimationFrame(draw);
    };
    draw();
    window.addEventListener("resize", setSize);
    return () => { cancelAnimationFrame(raf); window.removeEventListener("resize", setSize); };
  }, []);
  return (
    <canvas ref={canvasRef} className="constellation-canvas" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none" }} />
  );
};

/* ─────────────────────── Floating Skill Tags ─────────────────────── */
const SKILL_TAGS = [
  { label: "React.js",    color: "#61dafb" },
  { label: "Figma",       color: "#f24e1e" },
  { label: "Python",      color: "#4ade80" },
  { label: "WordPress",   color: "#21759b" },
  { label: "Node.js",     color: "#6ead4e" },
  { label: "Flutter",     color: "#54c5f8" },
  { label: "Photoshop",   color: "#31a8ff" },
  { label: "SEO",         color: "#fbbf24" },
  { label: "Vue.js",      color: "#42b883" },
  { label: "UI/UX",       color: "#c4b5fd" },
  { label: "Tailwind",    color: "#38bdf8" },
  { label: "Android",     color: "#a4c639" },
];
const FloatingSkillTags = () => (
  <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 200, pointerEvents: "none", overflow: "hidden" }}>
    {SKILL_TAGS.map((tag, i) => (
      <div key={tag.label} style={{
        position: "absolute",
        bottom: 0,
        left: `${5 + (i * 8.1) % 90}%`,
        display: "flex", alignItems: "center", gap: 5,
        padding: "4px 11px", borderRadius: 100,
        background: `${tag.color}15`,
        border: `1px solid ${tag.color}40`,
        fontSize: 10.5, fontWeight: 700,
        color: tag.color,
        whiteSpace: "nowrap",
        animation: `float-tag ${3.2 + (i * 0.53) % 2.8}s ease-in ${(i * 0.38) % 4}s both infinite`,
      }}>
        <span style={{ width: 5, height: 5, borderRadius: "50%", background: tag.color, flexShrink: 0 }} />
        {tag.label}
      </div>
    ))}
  </div>
);

/* ─────────────────────── Aurora Background ─────────────────────── */
const AURORA_BLOBS = [
  { w: 700, h: 700, top: "5%",  left: "-8%",  color: "rgba(99,102,241,0.07)",  dur: 9,  delay: 0 },
  { w: 550, h: 550, top: "60%", right: "-6%", color: "rgba(139,92,246,0.06)",  dur: 11, delay: 2 },
  { w: 400, h: 400, top: "35%", left: "35%",  color: "rgba(52,211,153,0.045)", dur: 13, delay: 4 },
  { w: 350, h: 350, top: "80%", left: "15%",  color: "rgba(236,72,153,0.04)",  dur: 15, delay: 1 },
  { w: 300, h: 300, top: "20%", right: "20%", color: "rgba(59,130,246,0.05)",  dur: 10, delay: 3 },
];
const AuroraBackground = () => (
  <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0, overflow: "hidden" }}>
    {AURORA_BLOBS.map((b, i) => (
      <div key={i} style={{
        position: "absolute",
        width: b.w, height: b.h,
        top: b.top, left: (b as any).left, right: (b as any).right,
        borderRadius: "50%",
        background: `radial-gradient(circle, ${b.color} 0%, transparent 70%)`,
        animation: `aurora-drift ${b.dur}s ease-in-out ${b.delay}s infinite`,
        filter: "blur(40px)",
      }} />
    ))}
  </div>
);

/* ─────────────────────── Scroll Progress Bar ─────────────────────── */
const ScrollProgressBar = () => {
  const [pct, setPct] = useState(0);
  useEffect(() => {
    const update = () => {
      const el = document.documentElement;
      setPct((el.scrollTop / (el.scrollHeight - el.clientHeight)) * 100);
    };
    window.addEventListener("scroll", update, { passive: true });
    return () => window.removeEventListener("scroll", update);
  }, []);
  return (
    <div style={{ position: "fixed", top: 0, left: 0, right: 0, height: 3, zIndex: 9999, background: "rgba(255,255,255,0.05)" }}>
      <div style={{ height: "100%", width: `${pct}%`, background: "linear-gradient(90deg, var(--t-a1), var(--t-a2), #4ade80)", transition: "width .1s linear", boxShadow: "0 0 10px var(--t-a1)" }} />
    </div>
  );
};

/* ─────────────────────── Floating Activity Notifications ─────────────────────── */
const NOTIF_ITEMS = [
  { icon: "💰", text: "Priya S. received ₹18,500", sub: "UI Design Project", color: "#4ade80" },
  { icon: "🚀", text: "New job posted: React Dev", sub: "₹45,000 · Remote", color: "#a5b4fc" },
  { icon: "⭐", text: "Ravi Kumar rated 5 stars", sub: "\"Excellent work!\"", color: "#fbbf24" },
  { icon: "✅", text: "Contract signed successfully", sub: "Backend API · ₹32,000", color: "#34d399" },
  { icon: "👤", text: "Arjun M. joined the platform", sub: "Full-Stack Developer", color: "#c4b5fd" },
];
const FloatingNotifications = () => {
  const [visible, setVisible] = useState(0);
  const [show, setShow] = useState(true);
  useEffect(() => {
    const cycle = () => {
      setShow(false);
      setTimeout(() => { setVisible(v => (v + 1) % NOTIF_ITEMS.length); setShow(true); }, 400);
    };
    const id = setInterval(cycle, 3200);
    return () => clearInterval(id);
  }, []);
  const n = NOTIF_ITEMS[visible];
  return (
    <div style={{ position: "absolute", bottom: 32, right: 0, zIndex: 10, pointerEvents: "none" }}>
      <div style={{ animation: show ? "toast-in 0.4s cubic-bezier(.17,.67,.34,1.2) both" : "toast-out 0.4s ease both", display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", borderRadius: 14, background: "rgba(15,15,35,0.92)", border: `1px solid ${n.color}35`, backdropFilter: "blur(20px)", boxShadow: `0 8px 32px rgba(0,0,0,0.4), 0 0 20px ${n.color}18`, minWidth: 220 }}>
        <div style={{ fontSize: 22, lineHeight: 1 }}>{n.icon}</div>
        <div>
          <p style={{ fontSize: 12, fontWeight: 700, color: n.color, margin: 0, lineHeight: 1.2 }}>{n.text}</p>
          <p style={{ fontSize: 10.5, color: "rgba(255,255,255,0.45)", margin: "2px 0 0" }}>{n.sub}</p>
        </div>
        <div style={{ width: 6, height: 6, borderRadius: "50%", background: n.color, flexShrink: 0, boxShadow: `0 0 6px ${n.color}` }} />
      </div>
    </div>
  );
};

/* ─────────────────────── Avatar Stack ─────────────────────── */
const AVATAR_COLORS = ["#6366f1","#8b5cf6","#ec4899","#f59e0b","#10b981","#3b82f6"];
const AVATAR_INITIALS = ["RK","PS","AM","DV","NK","SP"];
const AvatarStack = () => (
  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
    <div style={{ display: "flex" }}>
      {AVATAR_COLORS.map((c, i) => (
        <div key={i} style={{ width: 32, height: 32, borderRadius: "50%", background: `linear-gradient(135deg,${c},${AVATAR_COLORS[(i+1)%6]})`, border: "2px solid rgba(7,7,20,0.9)", marginLeft: i === 0 ? 0 : -10, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9.5, fontWeight: 800, color: "white", zIndex: 6 - i, position: "relative" }}>
          {AVATAR_INITIALS[i]}
        </div>
      ))}
    </div>
    <div>
      <p style={{ fontSize: 11.5, fontWeight: 700, color: "rgba(255,255,255,0.8)", margin: 0 }}>500+ Freelancers Active</p>
      <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
        {[1,2,3,4,5].map(s => <span key={s} style={{ fontSize: 9, color: "#fbbf24" }}>★</span>)}
        <span style={{ fontSize: 10, color: "rgba(255,255,255,0.4)" }}>4.9 avg rating</span>
      </div>
    </div>
  </div>
);

/* ─────────────────────── Live Job Feed Strip ─────────────────────── */
const JOB_PILLS = [
  { label: "React Developer",      pay: "₹40K",  color: "#a5b4fc" },
  { label: "Logo Design",          pay: "₹8K",   color: "#f9a8d4" },
  { label: "Python Backend",       pay: "₹55K",  color: "#6ee7b7" },
  { label: "Video Editing",        pay: "₹12K",  color: "#fde68a" },
  { label: "SEO Specialist",       pay: "₹18K",  color: "#c4b5fd" },
  { label: "UI/UX Designer",       pay: "₹35K",  color: "#67e8f9" },
  { label: "Content Writer",       pay: "₹10K",  color: "#fca5a5" },
  { label: "Mobile App Dev",       pay: "₹65K",  color: "#86efac" },
  { label: "Data Analyst",         pay: "₹45K",  color: "#fdba74" },
  { label: "WordPress Developer",  pay: "₹22K",  color: "#a5b4fc" },
];
const LiveJobFeed = () => (
  <section style={{ position: "relative", overflow: "hidden", padding: "16px 0", borderTop: "1px solid rgba(255,255,255,0.05)", borderBottom: "1px solid rgba(255,255,255,0.05)", background: "rgba(255,255,255,0.015)" }}>
    <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 80, background: "linear-gradient(to right, var(--t-bg), transparent)", zIndex: 2 }} />
    <div style={{ position: "absolute", right: 0, top: 0, bottom: 0, width: 80, background: "linear-gradient(to left, var(--t-bg), transparent)", zIndex: 2 }} />
    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8, paddingLeft: 24 }}>
      <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#4ade80", boxShadow: "0 0 6px #4ade80" }} />
      <span style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: "0.1em" }}>Live Jobs</span>
    </div>
    <div className="flex marquee-right" style={{ width: "max-content", gap: 12 }}>
      {[...JOB_PILLS, ...JOB_PILLS].map((p, i) => (
        <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 14px", borderRadius: 100, background: `${p.color}12`, border: `1px solid ${p.color}30`, flexShrink: 0 }}>
          <div style={{ width: 6, height: 6, borderRadius: "50%", background: p.color }} />
          <span style={{ fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.75)", whiteSpace: "nowrap" }}>{p.label}</span>
          <span style={{ fontSize: 11, fontWeight: 800, color: p.color }}>{p.pay}</span>
        </div>
      ))}
    </div>
  </section>
);

/* ─────────────────────── Mouse 3D Tilt Wrapper ─────────────────────── */
const MouseTiltCard = ({ children, className = "", intensity = 12 }: { children: React.ReactNode; className?: string; intensity?: number }) => {
  const ref = useRef<HTMLDivElement>(null);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [hovered, setHovered] = useState(false);
  const onMove = (e: React.MouseEvent) => {
    const el = ref.current; if (!el) return;
    const { left, top, width, height } = el.getBoundingClientRect();
    const x = ((e.clientX - left) / width - 0.5) * intensity;
    const y = -((e.clientY - top) / height - 0.5) * intensity;
    setTilt({ x, y });
  };
  return (
    <div ref={ref} className={className}
      onMouseMove={onMove}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => { setHovered(false); setTilt({ x: 0, y: 0 }); }}
      style={{ transform: hovered ? `perspective(1000px) rotateX(${tilt.y}deg) rotateY(${tilt.x}deg) scale(1.02)` : "perspective(1000px) rotateX(0deg) rotateY(0deg) scale(1)", transition: hovered ? "transform 0.1s linear" : "transform 0.5s cubic-bezier(.17,.67,.34,1.2)" }}>
      {children}
    </div>
  );
};

/* ─────────────────────── Ripple Button ─────────────────────── */
const RippleBtn = ({ children, onClick, className = "", style = {} }: { children: React.ReactNode; onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void; className?: string; style?: React.CSSProperties }) => {
  const ref = useRef<HTMLButtonElement>(null);
  const createRipple = (e: React.MouseEvent<HTMLButtonElement>) => {
    const btn = ref.current; if (!btn) return;
    const rect = btn.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height) * 0.7;
    const x = e.clientX - rect.left - size / 2;
    const y = e.clientY - rect.top  - size / 2;
    const wave = document.createElement("span");
    wave.className = "ripple-wave";
    Object.assign(wave.style, { width: `${size}px`, height: `${size}px`, left: `${x}px`, top: `${y}px` });
    btn.appendChild(wave);
    setTimeout(() => wave.remove(), 700);
    onClick?.(e);
  };
  return (
    <button ref={ref} className={`ripple-container ${className}`} style={style} onClick={createRipple}>
      {children}
    </button>
  );
};

/* ─────────────────────── Spotlight Card ─────────────────────── */
const SpotlightCard = ({ children, className = "", style = {}, onMouseEnter }: { children: React.ReactNode; className?: string; style?: React.CSSProperties; onMouseEnter?: (e: React.MouseEvent<HTMLDivElement>) => void }) => {
  const ref = useRef<HTMLDivElement>(null);
  const onMove = (e: React.MouseEvent) => {
    const el = ref.current; if (!el) return;
    const rect = el.getBoundingClientRect();
    el.style.setProperty("--mx", `${e.clientX - rect.left}px`);
    el.style.setProperty("--my", `${e.clientY - rect.top}px`);
  };
  return (
    <div ref={ref} className={`spotlight-card ${className}`} style={style} onMouseMove={onMove} onMouseEnter={onMouseEnter}>
      {children}
    </div>
  );
};

/* ─────────────────────── Typewriter Text ─────────────────────── */
const TYPEWRITER_WORDS = ["Freelancers", "Designers", "Developers", "Marketers", "Creators"];
const TypewriterText = () => {
  const [wordIdx, setWordIdx] = useState(0);
  const [displayed, setDisplayed] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [pause, setPause] = useState(false);
  useEffect(() => {
    if (pause) { const t = setTimeout(() => setPause(false), 1200); return () => clearTimeout(t); }
    const word = TYPEWRITER_WORDS[wordIdx];
    if (!deleting && displayed.length < word.length) {
      const t = setTimeout(() => setDisplayed(word.slice(0, displayed.length + 1)), 80);
      return () => clearTimeout(t);
    }
    if (!deleting && displayed.length === word.length) {
      setPause(true); setDeleting(true); return;
    }
    if (deleting && displayed.length > 0) {
      const t = setTimeout(() => setDisplayed(displayed.slice(0, -1)), 45);
      return () => clearTimeout(t);
    }
    if (deleting && displayed.length === 0) {
      setDeleting(false); setWordIdx(i => (i + 1) % TYPEWRITER_WORDS.length);
    }
  }, [displayed, deleting, pause, wordIdx]);
  return (
    <span className="gradient-text" style={{ display: "inline-block", minWidth: 180 }}>
      {displayed}<span className="blink-cursor" style={{ marginLeft: 2, fontWeight: 300, opacity: 1 }}>|</span>
    </span>
  );
};

/* ─────────────────────── Particle Field ─────────────────────── */
const PARTICLES = Array.from({ length: 36 }, (_, i) => ({
  id: i,
  x: Math.random() * 100,
  y: Math.random() * 100,
  size: 1.5 + Math.random() * 2.5,
  delay: Math.random() * 8,
  dur: 5 + Math.random() * 8,
  driftX: (Math.random() - 0.5) * 60,
  opacity: 0.2 + Math.random() * 0.5,
}));
const ParticleField = () => (
  <div className="pointer-events-none absolute inset-0 overflow-hidden">
    {PARTICLES.map(p => (
      <div key={p.id} style={{
        position: "absolute", left: `${p.x}%`, top: `${p.y}%`,
        width: p.size, height: p.size, borderRadius: "50%",
        background: "rgba(var(--t-a1-rgb), 0.8)",
        boxShadow: `0 0 ${p.size * 3}px rgba(var(--t-a1-rgb), 0.6)`,
        animation: `particle-drift ${p.dur}s ease-in-out ${p.delay}s infinite`,
        "--drift-x": `${p.driftX}px`,
      } as React.CSSProperties} />
    ))}
  </div>
);

/* ─────────────────────── Mouse Glow Effect ─────────────────────── */
const MouseGlowEffect = () => {
  const [pos, setPos] = useState({ x: -999, y: -999 });
  const [visible, setVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const section = ref.current?.parentElement;
    if (!section) return;
    const move = (e: MouseEvent) => {
      const rect = section.getBoundingClientRect();
      setPos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
      setVisible(true);
    };
    const leave = () => setVisible(false);
    section.addEventListener("mousemove", move);
    section.addEventListener("mouseleave", leave);
    return () => { section.removeEventListener("mousemove", move); section.removeEventListener("mouseleave", leave); };
  }, []);
  return (
    <div ref={ref} className="pointer-events-none absolute inset-0 overflow-hidden">
      <div style={{
        position: "absolute", left: pos.x - 150, top: pos.y - 150,
        width: 300, height: 300, borderRadius: "50%",
        background: "radial-gradient(circle, rgba(var(--t-a1-rgb),0.12) 0%, transparent 70%)",
        filter: "blur(20px)",
        transition: "opacity .3s ease",
        opacity: visible ? 1 : 0,
        pointerEvents: "none",
      }} />
    </div>
  );
};

/* ─────────────────────── Orb decorations ─────────────────────── */
const Orbs = () => (
  <>
    <div className="pointer-events-none absolute -top-40 -left-40 h-96 w-96 rounded-full pulse-glow" style={{ background: "radial-gradient(circle, rgba(var(--t-a2-rgb),0.35) 0%, transparent 70%)", filter: "blur(40px)" }} />
    <div className="pointer-events-none absolute top-1/3 -right-32 h-80 w-80 rounded-full pulse-glow" style={{ background: "radial-gradient(circle, rgba(var(--t-a1-rgb),0.3) 0%, transparent 70%)", filter: "blur(40px)", animationDelay: "1.5s" }} />
    <div className="pointer-events-none absolute -bottom-20 left-1/4 h-72 w-72 rounded-full pulse-glow" style={{ background: "radial-gradient(circle, rgba(52,211,153,0.2) 0%, transparent 70%)", filter: "blur(40px)", animationDelay: "3s" }} />
    {/* Morphing blob */}
    <div className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-64 w-64 morph-blob opacity-[0.07]" style={{ background: "linear-gradient(135deg, var(--t-a1), var(--t-a2))" }} />
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
  const parallaxUp = useParallax(0.14);
  const parallaxDown = useParallax(-0.06);
  const { t } = useLang();
  return (
  <section className="relative overflow-hidden py-20 md:py-28 lg:py-36 px-4 sm:px-6">
    <Orbs />
    <ParticleField />
    <ConstellationCanvas />
    <MouseGlowEffect />
    <FloatingSkillTags />

    {/* Grid lines */}
    <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: "linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px)", backgroundSize: "60px 60px" }} />

    <div className="mx-auto max-w-7xl">
      <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
        <div className="text-center lg:text-left" style={{ animation: "slide-up 0.7s ease both", transform: `translateY(${parallaxUp}px)`, willChange: "transform" }}>

          {/* Trust badge with glow ping */}
          <div className="mb-5 inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-semibold text-white/80" style={{ background: "rgba(var(--t-a1-rgb),0.15)", border: "1px solid rgba(var(--t-a1-rgb),0.3)", position: "relative" }}>
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" style={{ animation: "glow-ping 1.5s ease-out infinite" }} />
              <span className="relative h-2 w-2 rounded-full bg-emerald-400 live-dot-pulse" />
            </span>
            {t.hero.trustBadge}
          </div>

          {/* Headline */}
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black leading-[1.05] tracking-tight mb-4" style={{ animation: "slide-up 0.7s ease 0.1s both" }}>
            <span className="animated-headline">{t.hero.line1}</span>
            <br />
            <span className="animated-headline">{t.hero.line2}</span>
            <br />
            <span className="animated-headline gradient-text">{t.hero.line3}</span>
          </h1>

          {/* Typewriter for professions */}
          <div className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-6" style={{ animation: "slide-up 0.7s ease 0.15s both" }}>
            <TypewriterText />
          </div>

          <p className="text-base sm:text-lg text-white/60 leading-relaxed mb-8 max-w-lg mx-auto lg:mx-0" style={{ animation: "slide-up 0.7s ease 0.2s both" }}>
            {t.hero.subtitle}
          </p>

          {/* CTA buttons — magnetic pull + confetti + sparkle + shimmer */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start mb-10" style={{ animation: "slide-up 0.7s ease 0.3s both" }}>
            <MagneticWrapper>
              <div onClick={fireConfetti}>
                <SparkleBtn to="/register/employee" style={{ background: "linear-gradient(135deg, var(--t-a1), var(--t-a2))", boxShadow: "0 0 30px rgba(var(--t-a1-rgb),0.4), inset 0 1px 0 rgba(255,255,255,0.1)" }}>
                  <Briefcase className="h-5 w-5" />
                  {t.hero.joinFreelancer}
                  <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </SparkleBtn>
              </div>
            </MagneticWrapper>
            <MagneticWrapper>
              <Link to="/register/client">
                <button className="flex items-center justify-center gap-2 rounded-2xl px-7 py-3.5 text-base font-semibold text-white/80 hover:text-white transition-all w-full sm:w-auto" style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.15)" }}>
                  <Users className="h-5 w-5" />
                  {t.hero.joinEmployer}
                </button>
              </Link>
            </MagneticWrapper>
          </div>

          {/* Avatar stack social proof */}
          <div className="mb-6" style={{ animation: "slide-up 0.7s ease 0.35s both" }}>
            <AvatarStack />
          </div>

          {/* Mini stats — wave stagger */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-lg mx-auto lg:mx-0">
            {heroStats.map((s, i) => (
              <div key={s.label} className="text-center lg:text-left" style={{ animation: `wave-up 0.6s ease ${0.5 + i * 0.1}s both` }}>
                <div className="text-2xl font-black" style={{ color: "var(--t-a1)" }}>
                  <AnimatedCounter value={s.value} prefix={s.prefix} suffix={s.suffix} />
                </div>
                <div className="text-xs text-white/40 mt-0.5">{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: 3D Dashboard — rainbow border + mouse-tilt + floating notifications */}
        <div className="lg:flex lg:justify-end relative" style={{ animation: "slide-up 0.9s ease 0.2s both" }}>
          <MouseTiltCard className="w-full max-w-lg">
            <HeroDashboard />
          </MouseTiltCard>
          <FloatingNotifications />
        </div>
      </div>
    </div>

    <FloatingMoneyBadges />
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
      {/* Drifting ambient dots */}
      {[
        { x:"12%", y:"18%", s:6,  c:"var(--t-a1)", d:"8s",  dl:"0s"   },
        { x:"88%", y:"25%", s:4,  c:"var(--t-a2)", d:"11s", dl:"1.5s" },
        { x:"25%", y:"75%", s:8,  c:"#34d399",     d:"9s",  dl:"0.7s" },
        { x:"72%", y:"65%", s:5,  c:"var(--t-a1)", d:"13s", dl:"2.2s" },
        { x:"50%", y:"10%", s:3,  c:"var(--t-a2)", d:"7s",  dl:"3s"   },
        { x:"90%", y:"80%", s:7,  c:"#818cf8",     d:"10s", dl:"0.3s" },
      ].map((dot, i) => (
        <div key={i} className="pointer-events-none absolute rounded-full" style={{ left:dot.x, top:dot.y, width:dot.s, height:dot.s, background:dot.c, filter:"blur(1px)", animation:`dot-drift ${dot.d} ease-in-out infinite`, animationDelay:dot.dl, opacity:0.5 }} />
      ))}
      <div className="mx-auto max-w-7xl">
        <Reveal className="text-center mb-14">
          <div className="badge-pulse mb-3 inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-semibold text-indigo-300" style={{ background: "rgba(var(--t-a1-rgb),0.12)", border: "1px solid rgba(var(--t-a1-rgb),0.25)" }}>
            <Zap className="h-3.5 w-3.5" /> Platform Features
          </div>
          <SplitTextReveal text={t.features.heading} tag="h2" className="text-4xl sm:text-5xl font-black mb-4 gradient-text underline-glow" />
          <p className="text-white/50 max-w-md mx-auto">{t.features.subheading}</p>
        </Reveal>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {featureMeta.map((f, i) => (
            <Reveal key={i} delay={i * 80} direction={i % 2 === 0 ? "up" : i % 4 < 2 ? "left" : "right"}>
              <SpotlightCard className="feature-card-3d card-shimmer neon-card group relative h-full rounded-2xl p-5 cursor-pointer" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", animationDelay: `${i * 0.7}s` }}>
                <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-br ${f.color} rounded-2xl`} style={{ opacity: 0 }} />
                <div className="relative z-10">
                  <div className={`mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${f.color} float-${(i % 3) + 1}`} style={{ boxShadow: "0 8px 20px rgba(0,0,0,0.3)" }}>
                    <f.icon className="h-5 w-5 text-white" />
                  </div>
                  <ScrambleCardTitle title={t.features.items[i]?.title ?? ""} />
                  <p className="text-sm text-white/50 leading-relaxed">{t.features.items[i]?.desc}</p>
                </div>
                <div className={`absolute -bottom-6 -right-6 h-20 w-20 rounded-full bg-gradient-to-br ${f.color} opacity-10 group-hover:opacity-20 transition-opacity blur-xl`} />
              </SpotlightCard>
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
          <div className="badge-pulse mb-3 inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-semibold text-emerald-300" style={{ background: "rgba(52,211,153,0.1)", border: "1px solid rgba(52,211,153,0.2)" }}>
            <CheckCircle className="h-3.5 w-3.5" /> Simple Process
          </div>
          <h2 className="text-4xl sm:text-5xl font-black text-white mb-4">
            <WordReveal text={t.howItWorks.heading} />
          </h2>
          <p className="text-white/50 max-w-md mx-auto">{t.howItWorks.sub}</p>
        </Reveal>
        <div className="relative">
          <div className="hidden lg:block absolute top-16 left-[12.5%] right-[12.5%] h-px" style={{ background: "linear-gradient(to right, transparent, rgba(var(--t-a1-rgb),0.4), rgba(var(--t-a2-rgb),0.4), rgba(52,211,153,0.4), transparent)" }} />
          <TravelingBeam />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {stepMeta.map((s, i) => (
              <Reveal key={s.step} delay={i * 120}>
                <SpotlightCard className="step-3d card-shimmer group relative rounded-2xl p-6 text-center cursor-pointer" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
                  <div className="relative mx-auto mb-5 flex h-14 w-14 items-center justify-center">
                    <RadarRings />
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
                </SpotlightCard>
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
          <div className="badge-pulse mb-3 inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-semibold text-cyan-300" style={{ background: "rgba(34,211,238,0.1)", border: "1px solid rgba(34,211,238,0.2)" }}>
            <Layers className="h-3.5 w-3.5" /> 2,700+ Categories
          </div>
          <h2 className="text-4xl sm:text-5xl font-black text-white mb-4">Top <span className="gradient-text">Service</span> Categories</h2>
          <p className="text-white/50 max-w-md mx-auto">Whatever your project needs, we have the right talent for you.</p>
        </Reveal>

        {/* Featured 8 cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {services.map((s, i) => (
            <Reveal key={s.label} delay={i * 70}>
              <MouseTiltCard intensity={10}>
                <div className={`service-3d service-scan group relative rounded-2xl p-5 cursor-pointer overflow-hidden bg-gradient-to-br ${s.gradient}`} style={{ border: "1px solid rgba(255,255,255,0.08)" }}>
                  <div className={`service-icon-wrap mb-3 flex h-11 w-11 items-center justify-center rounded-xl float-${(i % 5) + 1}`} style={{ background: "rgba(255,255,255,0.08)" }}>
                    <s.icon className={`h-5 w-5 ${s.iconColor}`} />
                  </div>
                  <div className="text-sm font-bold text-white mb-0.5">{s.label}</div>
                  <div className="text-xs text-white/40">{s.count} services</div>
                  <div className="absolute -bottom-4 -right-4 h-16 w-16 rounded-full opacity-20 blur-xl" style={{ background: s.iconColor.replace("text-", "bg-") }} />
                </div>
              </MouseTiltCard>
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
          <h2 className="text-4xl sm:text-5xl font-black text-white mb-4">
            <WordReveal text={t.stats.heading} />
          </h2>
          <p className="text-white/50">{t.stats.sub}</p>
        </Reveal>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
          {statItems.map((s, i) => (
            <Reveal key={i} delay={i * 100}>
              <div className="accent-spin-border">
              <div className="accent-spin-border-inner">
              <HoloCard className="card-3d group relative rounded-2xl p-6 text-center cursor-default" style={{ background: "rgba(255,255,255,0.04)" }}>
                <LiveBadge />
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" style={{ background: "linear-gradient(135deg, rgba(var(--t-a1-rgb),0.1), rgba(var(--t-a2-rgb),0.1))", borderRadius: "inherit" }} />
                <div className="relative z-10">
                  <div className="text-4xl sm:text-5xl font-black mb-2" style={{ background: "linear-gradient(135deg, #a78bfa, #60a5fa)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                    <AnimatedCounter value={s.value} prefix={s.prefix} suffix={s.suffix} />
                  </div>
                  <p className="text-sm text-white/50 font-medium">{s.label}</p>
                </div>
                <div className="absolute -bottom-6 -right-6 h-24 w-24 rounded-full blur-2xl opacity-20 group-hover:opacity-40 transition-opacity" style={{ background: "linear-gradient(135deg,var(--t-a1),var(--t-a2))" }} />
              </HoloCard>
              </div>
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
          <div className="badge-pulse mb-3 inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-semibold text-amber-300" style={{ background: "rgba(251,191,36,0.1)", border: "1px solid rgba(251,191,36,0.2)" }}>
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
                  <MouseTiltCard intensity={8} className="h-full">
                  <div className="card-3d group h-full rounded-2xl p-5 cursor-pointer overflow-hidden" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
                    <Quote className="mb-3 h-8 w-8 text-indigo-400/30 group-hover:text-indigo-400/60 transition-colors" style={{ animation: "quote-bob 3.5s ease-in-out infinite" }} />
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
                      <AnimatedStars rating={t.rating} />
                    </div>
                  </div>
                  </MouseTiltCard>
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
          {/* Ripple rings */}
          {[0, 1, 2].map(i => (
            <div key={i} className="ripple-ring" style={{ width: 120 + i * 80, height: 120 + i * 80, border: `1px solid rgba(var(--t-a1-rgb),${0.25 - i * 0.07})`, animationDuration: `${2.5 + i * 0.8}s`, animationDelay: `${i * 0.7}s` }} />
          ))}
          <div className="relative z-10">
            <CTAUrgencyCounter />
            <h2 className="text-4xl sm:text-5xl font-black text-white mb-4">
              <GlitchText text={t.cta.heading} />
            </h2>
            <p className="text-white/60 mb-6 max-w-md mx-auto">{t.cta.sub}</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/register/employee">
                <RippleBtn onClick={fireConfetti as any} className="group shimmer-btn magnetic-btn flex items-center justify-center gap-2 rounded-2xl px-8 py-3.5 text-base font-semibold text-white w-full sm:w-auto" style={{ background: "linear-gradient(135deg,var(--t-a1),var(--t-a2))", boxShadow: "0 0 30px rgba(var(--t-a1-rgb),0.4)" }}>
                  <Briefcase className="h-4 w-4" /> {t.cta.joinFreelancer} <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </RippleBtn>
              </Link>
              <Link to="/register/client">
                <RippleBtn className="magnetic-btn flex items-center justify-center gap-2 rounded-2xl px-8 py-3.5 text-base font-semibold text-white/80 hover:text-white w-full sm:w-auto" style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.15)" }}>
                  <Users className="h-4 w-4" /> {t.cta.joinEmployer}
                </RippleBtn>
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
          <div className="badge-pulse mb-3 inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-semibold text-emerald-300" style={{ background: "rgba(52,211,153,0.1)", border: "1px solid rgba(52,211,153,0.2)" }}>
            <MessageCircle className="h-3.5 w-3.5" /> FAQ
          </div>
          <h2 className="text-4xl sm:text-5xl font-black text-white mb-4">{t.faq.heading}</h2>
          <p className="text-white/50">{t.faq.sub}</p>
        </Reveal>
        <div className="space-y-3">
          {t.faq.items.map((faq, i) => (
            <Reveal key={i} delay={i * 60}>
              <div className="relative rounded-2xl overflow-hidden transition-all duration-300" style={{ background: open === i ? "rgba(var(--t-a1-rgb),0.08)" : "rgba(255,255,255,0.03)", border: open === i ? "1px solid rgba(var(--t-a1-rgb),0.25)" : "1px solid rgba(255,255,255,0.07)" }}>
                <FAQSweep active={open === i} />
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
                <div key={i} className="social-icon flex h-8 w-8 items-center justify-center rounded-lg cursor-pointer" style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)" }}>
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

/* ─────────────────────── Payment Safety Section ─────────────────────── */
const PAYMENT_TRUST = [
  { icon: Lock,          title: "Escrow Protection",     desc: "Payment is held securely until you approve the work. Never lose money." },
  { icon: Shield,        title: "100% Refund Guarantee", desc: "If work isn't delivered, full refund is processed within 24 hours." },
  { icon: CheckCircle,   title: "SSL Encrypted",         desc: "All transactions use bank-grade 256-bit SSL encryption end-to-end." },
  { icon: CreditCard,    title: "Dispute Resolution",    desc: "Our team mediates every dispute fairly and resolves it within 48 hrs." },
];

const PaymentSafetySection = () => (
  <section className="relative py-20 md:py-28 px-4 sm:px-6 overflow-hidden">
    <div className="pointer-events-none absolute inset-0" style={{ background: "radial-gradient(ellipse 70% 60% at 80% 50%, rgba(var(--t-a1-rgb),0.07) 0%, transparent 70%)" }} />
    <div className="mx-auto max-w-7xl">
      <div className="grid lg:grid-cols-2 gap-14 items-center">

        {/* Left: text + trust list */}
        <div>
          <Reveal>
            <div className="mb-4 inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-semibold text-emerald-300" style={{ background: "rgba(52,211,153,0.1)", border: "1px solid rgba(52,211,153,0.25)" }}>
              <Shield className="h-3.5 w-3.5" /> Payment Security
            </div>
            <h2 className="text-4xl sm:text-5xl font-black text-white mb-4 leading-tight">
              Your Money is <span className="gradient-text">100% Safe</span>
            </h2>
            <p className="text-white/55 text-base leading-relaxed mb-8 max-w-md">
              Every rupee on Freelancer India is protected by our escrow system. Pay only when you're satisfied — guaranteed.
            </p>
          </Reveal>

          <div className="space-y-4">
            {PAYMENT_TRUST.map((item, i) => (
              <Reveal key={item.title} delay={i * 80}>
                <div className="flex items-start gap-4 rounded-2xl p-4" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl" style={{ background: "linear-gradient(135deg, rgba(52,211,153,0.2), rgba(var(--t-a1-rgb),0.2))" }}>
                    <item.icon className="h-5 w-5 text-emerald-400" />
                  </div>
                  <div>
                    <div className="font-bold text-white text-sm mb-0.5">{item.title}</div>
                    <div className="text-white/50 text-xs leading-relaxed">{item.desc}</div>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>

        {/* Right: payment methods + stat */}
        <Reveal direction="right">
          <div className="rounded-3xl p-8" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", backdropFilter: "blur(20px)" }}>

            <p className="text-xs font-semibold uppercase tracking-widest text-white/35 mb-5">Accepted Payment Methods</p>

            {/* Payment logos */}
            <div className="grid grid-cols-3 gap-3 mb-8">
              {[
                { label: "UPI",       bg: "#f97316", text: "#fff",    letter: "₹" },
                { label: "Razorpay",  bg: "#3b82f6", text: "#fff",    letter: "R" },
                { label: "RuPay",     bg: "#16a34a", text: "#fff",    letter: "RP" },
                { label: "Visa",      bg: "#1d4ed8", text: "#fff",    letter: "V" },
                { label: "Mastercard",bg: "#dc2626", text: "#fff",    letter: "MC" },
                { label: "Net Banking",bg:"#6366f1", text: "#fff",    letter: "NB" },
              ].map(p => (
                <div key={p.label} className="flex flex-col items-center gap-2 rounded-2xl p-3 cursor-pointer hover:scale-105 transition-transform" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}>
                  <div className="h-10 w-10 rounded-xl flex items-center justify-center text-sm font-black" style={{ background: p.bg, color: p.text }}>
                    {p.letter}
                  </div>
                  <span className="text-[10px] text-white/50 font-medium text-center leading-tight">{p.label}</span>
                </div>
              ))}
            </div>

            {/* Big stat */}
            <div className="rounded-2xl p-5 text-center" style={{ background: "linear-gradient(135deg, rgba(52,211,153,0.12), rgba(var(--t-a1-rgb),0.12))", border: "1px solid rgba(52,211,153,0.2)" }}>
              <div className="text-4xl font-black text-white mb-1">₹500 Cr+</div>
              <div className="text-emerald-400 text-sm font-semibold">Safely Transacted on Platform</div>
              <div className="text-white/40 text-xs mt-1">Across 50,000+ completed projects</div>
            </div>

            {/* Badges row */}
            <div className="mt-4 flex flex-wrap gap-2 justify-center">
              {["PCI DSS Compliant","RBI Registered","ISO 27001"].map(b => (
                <span key={b} className="inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold text-emerald-300" style={{ background: "rgba(52,211,153,0.1)", border: "1px solid rgba(52,211,153,0.2)" }}>
                  <CheckCircle className="h-3 w-3" /> {b}
                </span>
              ))}
            </div>
          </div>
        </Reveal>
      </div>
    </div>
  </section>
);

/* ─────────────────────── App Download Section ─────────────────────── */
const APP_FEATURES = [
  { icon: Briefcase,     text: "Track all your projects in real-time" },
  { icon: MessageCircle, text: "Live chat with clients & freelancers" },
  { icon: CreditCard,    text: "Instant payment notifications & wallet" },
  { icon: Zap,           text: "Smart job alerts tailored to your skills" },
];

const AppDownloadSection = () => (
  <section className="relative py-20 md:py-28 px-4 sm:px-6 overflow-hidden">
    <div className="pointer-events-none absolute inset-0" style={{ background: "radial-gradient(ellipse 60% 80% at 20% 50%, rgba(var(--t-a2-rgb),0.08) 0%, transparent 70%)" }} />
    <div className="mx-auto max-w-7xl">
      <div className="grid lg:grid-cols-2 gap-14 items-center">

        {/* Left: phone mockup */}
        <Reveal direction="left">
          <div className="flex justify-center lg:justify-start">
            <div className="relative">
              {/* Phone frame */}
              <div className="relative w-56 rounded-[44px] p-2 shadow-2xl" style={{ background: "linear-gradient(145deg,#1e1e2e,#0f0f1a)", border: "2px solid rgba(255,255,255,0.12)" }}>
                {/* Notch */}
                <div className="absolute top-3 left-1/2 -translate-x-1/2 h-4 w-20 rounded-full z-10" style={{ background: "#0f0f1a" }} />
                {/* Screen */}
                <div className="rounded-[38px] overflow-hidden" style={{ background: "linear-gradient(145deg, #1a1a2e, #16213e)", minHeight: "440px", padding: "40px 12px 20px" }}>
                  {/* Status bar */}
                  <div className="flex justify-between items-center mb-6 px-1">
                    <span className="text-[9px] text-white/60 font-semibold">9:41</span>
                    <div className="flex gap-1 items-center">
                      <div className="w-3 h-1.5 rounded-sm bg-white/50" />
                      <div className="w-1 h-1 rounded-full bg-white/50" />
                    </div>
                  </div>
                  {/* App content */}
                  <div className="text-center mb-5">
                    <div className="mx-auto mb-2 h-10 w-10 rounded-2xl flex items-center justify-center" style={{ background: "linear-gradient(135deg,var(--t-a1),var(--t-a2))" }}>
                      <Briefcase className="h-5 w-5 text-white" />
                    </div>
                    <div className="text-white text-xs font-bold">Freelancer India</div>
                    <div className="text-white/40 text-[9px]">Good morning, Rahul 👋</div>
                  </div>
                  {/* Earnings card */}
                  <div className="rounded-2xl p-3 mb-3" style={{ background: "linear-gradient(135deg,rgba(var(--t-a1-rgb),0.3),rgba(var(--t-a2-rgb),0.3))", border: "1px solid rgba(255,255,255,0.1)" }}>
                    <div className="text-[9px] text-white/50 mb-1">This Month</div>
                    <div className="text-white text-lg font-black">₹42,500</div>
                    <div className="text-emerald-400 text-[9px]">↑ +18% from last month</div>
                  </div>
                  {/* Mini job cards */}
                  {[
                    { title:"React App", budget:"₹25,000", tag:"New Bid" },
                    { title:"Logo Design", budget:"₹6,000",  tag:"Active" },
                  ].map(j => (
                    <div key={j.title} className="rounded-xl p-2.5 mb-2 flex items-center justify-between" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.07)" }}>
                      <div>
                        <div className="text-[9px] font-bold text-white">{j.title}</div>
                        <div className="text-[8px] text-white/40">{j.budget}</div>
                      </div>
                      <span className="rounded-full px-2 py-0.5 text-[8px] font-bold" style={{ background: j.tag === "New Bid" ? "rgba(var(--t-a1-rgb),0.25)" : "rgba(52,211,153,0.2)", color: j.tag === "New Bid" ? "var(--t-a1)" : "#34d399" }}>
                        {j.tag}
                      </span>
                    </div>
                  ))}
                  {/* Bottom nav */}
                  <div className="mt-4 flex justify-around pt-3" style={{ borderTop: "1px solid rgba(255,255,255,0.07)" }}>
                    {[Briefcase, MessageCircle, CreditCard, Users].map((Icon, i) => (
                      <Icon key={i} className={`h-4 w-4 ${i === 0 ? "text-indigo-400" : "text-white/30"}`} />
                    ))}
                  </div>
                </div>
              </div>
              {/* Glow */}
              <div className="absolute inset-0 -z-10 rounded-[44px] blur-3xl opacity-30" style={{ background: "linear-gradient(135deg,var(--t-a1),var(--t-a2))" }} />
            </div>
          </div>
        </Reveal>

        {/* Right: text + features + buttons */}
        <div>
          <Reveal>
            <div className="mb-4 inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-semibold text-indigo-300" style={{ background: "rgba(var(--t-a1-rgb),0.12)", border: "1px solid rgba(var(--t-a1-rgb),0.25)" }}>
              <Smartphone className="h-3.5 w-3.5" /> Mobile App
            </div>
            <h2 className="text-4xl sm:text-5xl font-black text-white mb-4 leading-tight">
              Manage Work <span className="gradient-text">On The Go</span>
            </h2>
            <p className="text-white/55 text-base leading-relaxed mb-8 max-w-md">
              Download the Freelancer India app and stay on top of your projects, bids, chats, and payments — anywhere, anytime.
            </p>
          </Reveal>

          {/* Feature list */}
          <div className="space-y-3 mb-10">
            {APP_FEATURES.map((f, i) => (
              <Reveal key={i} delay={i * 70}>
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl" style={{ background: "rgba(var(--t-a1-rgb),0.15)" }}>
                    <f.icon className="h-4 w-4" style={{ color: "var(--t-a1)" }} />
                  </div>
                  <span className="text-white/75 text-sm">{f.text}</span>
                </div>
              </Reveal>
            ))}
          </div>

          {/* Download buttons */}
          <Reveal delay={300}>
            <div className="flex flex-col sm:flex-row gap-3">
              {/* App Store */}
              <a href="#" className="flex items-center gap-3 rounded-2xl px-5 py-3.5 transition-all hover:scale-105 hover:shadow-lg" style={{ background: "#000", border: "1px solid rgba(255,255,255,0.15)" }}>
                <svg viewBox="0 0 24 24" className="h-7 w-7 fill-white shrink-0"><path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/></svg>
                <div>
                  <div className="text-white/50 text-[10px] leading-none mb-0.5">Download on the</div>
                  <div className="text-white font-bold text-sm leading-none">App Store</div>
                </div>
              </a>
              {/* Google Play */}
              <a href="#" className="flex items-center gap-3 rounded-2xl px-5 py-3.5 transition-all hover:scale-105 hover:shadow-lg" style={{ background: "#000", border: "1px solid rgba(255,255,255,0.15)" }}>
                <svg viewBox="0 0 24 24" className="h-7 w-7 shrink-0"><path fill="#4CAF50" d="M1.22 0c-.03.08-.06.16-.06.26v23.48c0 .1.03.18.06.26l12.04-12L1.22 0z"/><path fill="#FFC107" d="M17.28 8.93L4.88.18l9.96 9.96 2.44-1.21z"/><path fill="#F44336" d="M4.88 23.82l12.4-8.75-2.44-1.21L4.88 23.82z"/><path fill="#2196F3" d="M22.5 11.24l-3.1-1.73-2.74 1.36 2.74 2.74 3.1-1.37z"/></svg>
                <div>
                  <div className="text-white/50 text-[10px] leading-none mb-0.5">Get it on</div>
                  <div className="text-white font-bold text-sm leading-none">Google Play</div>
                </div>
              </a>
            </div>
            <p className="mt-3 text-white/30 text-xs">Coming soon — notify me when available</p>
          </Reveal>
        </div>
      </div>
    </div>
  </section>
);

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
      <AuroraBackground />
      <ScrollProgressBar />
      <CursorTrail />
      <GlowCursor />

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
        <NeonDivider />
        <FeaturesSection />
        <NeonDivider />
        <LiveJobFeed />
        <NeonDivider />
        <HowItWorksSection />
        <NeonDivider />
        <ServicesSection />
        <NeonDivider />
        <StatsSection />
        <NeonDivider />
        <PaymentSafetySection />
        <NeonDivider />
        <TestimonialsSection testimonials={testimonials} />
        <NeonDivider />
        <AppDownloadSection />
        <NeonDivider />
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
