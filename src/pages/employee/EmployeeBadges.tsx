import { useState } from "react";
import { useDashboardTheme } from "@/hooks/use-dashboard-theme";
import {
  ShieldCheck, Zap, Lock, CheckCircle, Clock, Star, Award,
  Code, Palette, BarChart3, Globe, Megaphone, PenTool, Cpu,
  ChevronRight, Trophy, Target,
} from "lucide-react";
import { toast } from "sonner";

const TH = {
  black: { bg: "#070714", card: "rgba(255,255,255,.05)", border: "rgba(255,255,255,.08)", text: "#e2e8f0", sub: "#94a3b8", muted: "rgba(255,255,255,.03)", input: "rgba(255,255,255,.07)" },
  white: { bg: "#f0f4ff", card: "#ffffff", border: "rgba(0,0,0,.08)", text: "#1e293b", sub: "#64748b", muted: "#f1f5f9", input: "#f8fafc" },
  wb:    { bg: "#f0f4ff", card: "#ffffff", border: "rgba(0,0,0,.08)", text: "#1e293b", sub: "#64748b", muted: "#f1f5f9", input: "#f8fafc" },
};

const SKILL_TESTS = [
  { id: "s1",  name: "React Developer",       icon: Code,      color: "#60a5fa", level: "Intermediate", questions: 20, duration: "25 min", earned: true,  score: 92 },
  { id: "s2",  name: "UI/UX Designer",        icon: Palette,   color: "#a78bfa", level: "Intermediate", questions: 18, duration: "22 min", earned: true,  score: 88 },
  { id: "s3",  name: "Data Analytics",        icon: BarChart3, color: "#34d399", level: "Advanced",     questions: 25, duration: "30 min", earned: false, score: null },
  { id: "s4",  name: "Web Developer",         icon: Globe,     color: "#fb923c", level: "Beginner",     questions: 15, duration: "18 min", earned: true,  score: 95 },
  { id: "s5",  name: "Digital Marketing",     icon: Megaphone, color: "#f472b6", level: "Intermediate", questions: 20, duration: "25 min", earned: false, score: null },
  { id: "s6",  name: "Content Writing",       icon: PenTool,   color: "#fbbf24", level: "Beginner",     questions: 15, duration: "18 min", earned: false, score: null },
  { id: "s7",  name: "Python Developer",      icon: Code,      color: "#4ade80", level: "Advanced",     questions: 30, duration: "35 min", earned: false, score: null },
  { id: "s8",  name: "Mobile App Dev",        icon: Cpu,       color: "#38bdf8", level: "Intermediate", questions: 22, duration: "28 min", earned: false, score: null },
];

const SAMPLE_QUESTIONS: Record<string, { q: string; options: string[]; correct: number }[]> = {
  "s3": [
    { q: "Which function is used to join DataFrames in Pandas?",                  options: ["merge()", "concat()", "append()", "join()"],                    correct: 0 },
    { q: "What does SQL GROUP BY clause do?",                                      options: ["Filters rows", "Groups rows", "Sorts results", "Joins tables"],  correct: 1 },
    { q: "In Tableau, what is a 'Measure'?",                                       options: ["A category", "A quantitative value", "A date", "A filter"],      correct: 1 },
    { q: "Which chart type best shows trend over time?",                           options: ["Pie chart", "Bar chart", "Line chart", "Scatter plot"],           correct: 2 },
    { q: "What is a pivot table used for?",                                        options: ["Sorting data", "Summarizing data", "Filtering rows", "Joining"],  correct: 1 },
  ],
  "default": [
    { q: "What is the primary purpose of version control?",                        options: ["Track changes", "Speed up code", "Debug errors", "Compile code"], correct: 0 },
    { q: "Which HTTP method is used to retrieve data?",                            options: ["POST", "PUT", "GET", "DELETE"],                                   correct: 2 },
    { q: "What does API stand for?",                                               options: ["Applied Program Interface", "Application Programming Interface", "Automated Process Interaction", "Application Protocol Interface"], correct: 1 },
    { q: "What is responsive design?",                                             options: ["Fast loading", "Adapts to screen size", "Dark mode support", "SEO optimization"], correct: 1 },
    { q: "Which language is used for styling web pages?",                          options: ["HTML", "JavaScript", "CSS", "Python"],                            correct: 2 },
  ],
};

export default function EmployeeBadges() {
  const { theme } = useDashboardTheme();
  const T = TH[theme];

  const [activeTest, setActiveTest]   = useState<string | null>(null);
  const [currentQ, setCurrentQ]       = useState(0);
  const [answers, setAnswers]         = useState<Record<number, number>>({});
  const [testDone, setTestDone]       = useState(false);
  const [score, setScore]             = useState(0);
  const [badges, setBadges]           = useState(() => new Set(SKILL_TESTS.filter(s => s.earned).map(s => s.id)));

  const earned = SKILL_TESTS.filter(s => badges.has(s.id));
  const available = SKILL_TESTS.filter(s => !badges.has(s.id));

  const startTest = (id: string) => {
    setActiveTest(id); setCurrentQ(0); setAnswers({}); setTestDone(false); setScore(0);
  };

  const handleAnswer = (qi: number, ai: number) => {
    setAnswers(prev => ({ ...prev, [qi]: ai }));
  };

  const submitTest = () => {
    const skill = SKILL_TESTS.find(s => s.id === activeTest);
    const questions = SAMPLE_QUESTIONS[activeTest!] ?? SAMPLE_QUESTIONS["default"];
    const correct = questions.filter((q, i) => answers[i] === q.correct).length;
    const pct = Math.round((correct / questions.length) * 100);
    setScore(pct);
    setTestDone(true);
    if (pct >= 60) {
      setBadges(prev => new Set([...prev, activeTest!]));
      toast.success(`🏆 Congratulations! You earned the "${skill?.name}" badge!`);
    } else {
      toast.error(`Score: ${pct}%. You need 60% to pass. Try again!`);
    }
  };

  const card: React.CSSProperties = { background: T.card, border: `1px solid ${T.border}`, borderRadius: 16 };

  if (activeTest) {
    const skill = SKILL_TESTS.find(s => s.id === activeTest)!;
    const questions = SAMPLE_QUESTIONS[activeTest] ?? SAMPLE_QUESTIONS["default"];
    const Icon = skill.icon;

    if (testDone) {
      const passed = score >= 60;
      return (
        <div className="min-h-screen flex items-center justify-center p-6" style={{ background: T.bg }}>
          <div className="max-w-sm w-full text-center rounded-3xl p-8" style={card}>
            <div className="h-20 w-20 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: passed ? "rgba(74,222,128,.15)" : "rgba(248,113,113,.15)" }}>
              {passed ? <Trophy className="h-10 w-10 text-emerald-400" /> : <Target className="h-10 w-10 text-red-400" />}
            </div>
            <h2 className="text-xl font-black mb-1" style={{ color: T.text }}>{passed ? "Badge Earned! 🎉" : "Better Luck Next Time"}</h2>
            <p className="text-3xl font-black my-3" style={{ color: passed ? "#4ade80" : "#f87171" }}>{score}%</p>
            <p className="text-sm mb-6" style={{ color: T.sub }}>{passed ? `You've earned the "${skill.name}" verified badge!` : `You need 60% to pass. Your score: ${score}%`}</p>
            {passed && (
              <div className="rounded-2xl p-4 mb-4" style={{ background: `${skill.color}12`, border: `1px solid ${skill.color}30` }}>
                <Icon className="h-8 w-8 mx-auto mb-2" style={{ color: skill.color }} />
                <p className="text-sm font-bold" style={{ color: skill.color }}>✓ Verified {skill.name}</p>
              </div>
            )}
            <div className="flex gap-3">
              <button onClick={() => setActiveTest(null)} className="flex-1 rounded-xl py-2.5 text-sm font-semibold" style={{ background: T.muted, color: T.sub, border: `1px solid ${T.border}` }}>Back</button>
              {!passed && <button onClick={() => startTest(activeTest)} className="flex-1 rounded-xl py-2.5 text-sm font-semibold text-white" style={{ background: "linear-gradient(135deg,#6366f1,#8b5cf6)" }}>Retry</button>}
            </div>
          </div>
        </div>
      );
    }

    const q = questions[currentQ];
    return (
      <div className="min-h-screen p-6" style={{ background: T.bg }}>
        <div className="max-w-lg mx-auto">
          <button onClick={() => setActiveTest(null)} className="text-xs mb-4 flex items-center gap-1" style={{ color: T.sub }}>← Back to Badges</button>
          <div className="rounded-2xl p-5 mb-4" style={card}>
            <div className="flex items-center gap-3 mb-4">
              <div className="h-10 w-10 rounded-xl flex items-center justify-center" style={{ background: `${skill.color}18` }}>
                <Icon className="h-5 w-5" style={{ color: skill.color }} />
              </div>
              <div>
                <h2 className="text-sm font-bold" style={{ color: T.text }}>{skill.name} Test</h2>
                <p className="text-[10px]" style={{ color: T.sub }}>Question {currentQ + 1} of {questions.length}</p>
              </div>
            </div>
            <div className="h-1.5 rounded-full overflow-hidden mb-5" style={{ background: T.muted }}>
              <div className="h-full rounded-full transition-all duration-300" style={{ width: `${((currentQ + 1) / questions.length) * 100}%`, background: skill.color }} />
            </div>
            <p className="text-sm font-semibold mb-4 leading-relaxed" style={{ color: T.text }}>{q.q}</p>
            <div className="space-y-2">
              {q.options.map((opt, i) => (
                <button key={i} onClick={() => handleAnswer(currentQ, i)}
                  className="w-full text-left rounded-xl px-4 py-3 text-xs font-medium transition-all"
                  style={{ background: answers[currentQ] === i ? `${skill.color}20` : T.muted, border: `1px solid ${answers[currentQ] === i ? skill.color + "60" : T.border}`, color: answers[currentQ] === i ? skill.color : T.text }}>
                  {opt}
                </button>
              ))}
            </div>
          </div>
          <div className="flex justify-between gap-3">
            <button onClick={() => setCurrentQ(q => Math.max(0, q - 1))} disabled={currentQ === 0} className="rounded-xl px-5 py-2.5 text-sm font-semibold" style={{ background: T.card, border: `1px solid ${T.border}`, color: T.sub, opacity: currentQ === 0 ? 0.4 : 1 }}>Previous</button>
            {currentQ < questions.length - 1 ? (
              <button onClick={() => setCurrentQ(q => q + 1)} disabled={answers[currentQ] === undefined} className="flex-1 rounded-xl py-2.5 text-sm font-semibold text-white" style={{ background: answers[currentQ] !== undefined ? `linear-gradient(135deg,${skill.color},${skill.color}cc)` : T.muted, opacity: answers[currentQ] === undefined ? 0.5 : 1 }}>Next</button>
            ) : (
              <button onClick={submitTest} disabled={answers[currentQ] === undefined} className="flex-1 rounded-xl py-2.5 text-sm font-semibold text-white" style={{ background: "linear-gradient(135deg,#6366f1,#8b5cf6)", opacity: answers[currentQ] === undefined ? 0.5 : 1 }}>Submit Test</button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-10" style={{ background: T.bg, color: T.text }}>
      <div className="px-4 sm:px-6 pt-6 pb-4">
        <h1 className="text-xl font-black" style={{ color: T.text }}>Skill Badges</h1>
        <p className="text-xs mt-0.5" style={{ color: T.sub }}>Take tests to earn verified skill badges</p>
      </div>

      {/* Stats */}
      <div className="px-4 sm:px-6 mb-5 grid grid-cols-3 gap-3">
        {[
          { label: "Earned",    value: earned.length,     color: "#4ade80", icon: Award },
          { label: "Available", value: available.length,  color: "#6366f1", icon: Zap },
          { label: "Total",     value: SKILL_TESTS.length,color: "#a78bfa", icon: Trophy },
        ].map(s => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="rounded-2xl p-3" style={card}>
              <Icon className="h-4 w-4 mb-1.5" style={{ color: s.color }} />
              <p className="text-xl font-black" style={{ color: s.color }}>{s.value}</p>
              <p className="text-[10px]" style={{ color: T.sub }}>{s.label}</p>
            </div>
          );
        })}
      </div>

      {/* Earned Badges */}
      {earned.length > 0 && (
        <div className="px-4 sm:px-6 mb-6">
          <h3 className="text-sm font-bold mb-3 flex items-center gap-2" style={{ color: T.text }}>
            <ShieldCheck className="h-4 w-4 text-emerald-400" /> Verified Badges
          </h3>
          <div className="flex flex-wrap gap-3">
            {earned.map(s => {
              const Icon = s.icon;
              return (
                <div key={s.id} className="flex items-center gap-2 rounded-2xl px-4 py-3" style={{ background: `${s.color}15`, border: `1px solid ${s.color}35` }}>
                  <div className="h-9 w-9 rounded-xl flex items-center justify-center" style={{ background: `${s.color}20` }}>
                    <Icon className="h-4 w-4" style={{ color: s.color }} />
                  </div>
                  <div>
                    <p className="text-xs font-bold" style={{ color: s.color }}>{s.name}</p>
                    <div className="flex items-center gap-1">
                      <CheckCircle className="h-2.5 w-2.5 text-emerald-400" />
                      <span className="text-[10px] text-emerald-400">Verified</span>
                      {s.score && <span className="text-[10px] ml-1" style={{ color: T.sub }}>· {s.score}%</span>}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Available Tests */}
      <div className="px-4 sm:px-6">
        <h3 className="text-sm font-bold mb-3 flex items-center gap-2" style={{ color: T.text }}>
          <Lock className="h-4 w-4" style={{ color: T.sub }} /> Take a Test
        </h3>
        <div className="space-y-3">
          {available.map((s, i) => {
            const Icon = s.icon;
            const levelColor = s.level === "Beginner" ? "#4ade80" : s.level === "Intermediate" ? "#fbbf24" : "#f87171";
            return (
              <div key={s.id} className="rounded-2xl p-4 flex items-center gap-4 transition-all duration-200 hover:scale-[1.005]" style={{ ...card, animationDelay: `${i * 50}ms` }}>
                <div className="h-11 w-11 rounded-xl flex items-center justify-center shrink-0" style={{ background: `${s.color}18` }}>
                  <Icon className="h-5 w-5" style={{ color: s.color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="text-sm font-bold" style={{ color: T.text }}>{s.name}</p>
                    <span className="text-[9px] rounded-md px-1.5 py-0.5 font-semibold" style={{ background: `${levelColor}15`, color: levelColor }}>{s.level}</span>
                  </div>
                  <div className="flex gap-3">
                    <span className="text-[10px]" style={{ color: T.sub }}>{s.questions} questions</span>
                    <span className="text-[10px]" style={{ color: T.sub }}><Clock className="h-2.5 w-2.5 inline mr-0.5" />{s.duration}</span>
                    <span className="text-[10px]" style={{ color: T.sub }}>Pass: 60%</span>
                  </div>
                </div>
                <button onClick={() => startTest(s.id)} className="flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-semibold text-white shrink-0 transition-all hover:scale-105" style={{ background: `linear-gradient(135deg,${s.color},${s.color}cc)` }}>
                  Start <ChevronRight className="h-3 w-3" />
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
