import { useEffect, useRef, useState } from "react";

interface Props {
  value: number;
  max?: number;
  size?: number;
  stroke?: number;
  color?: string;
  trackColor?: string;
  label?: string;
  suffix?: string;
  animated?: boolean;
}

export default function AdminProgressRing({
  value, max = 100, size = 72, stroke = 6,
  color = "#6366f1", trackColor = "rgba(99,102,241,0.12)",
  label, suffix = "%", animated = true,
}: Props) {
  const [displayed, setDisplayed] = useState(0);
  const ref = useRef<SVGCircleElement>(null);
  const started = useRef(false);
  const containerRef = useRef<SVGSVGElement>(null);

  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const pct = Math.min((displayed / max) * 100, 100);
  const dashOffset = circumference - (pct / 100) * circumference;

  useEffect(() => {
    if (!animated) { setDisplayed(value); return; }
    const el = containerRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started.current) {
          started.current = true;
          const start = performance.now();
          const dur = 1200;
          const tick = (now: number) => {
            const t = Math.min((now - start) / dur, 1);
            const ease = 1 - Math.pow(1 - t, 3);
            setDisplayed(Math.round(ease * value));
            if (t < 1) requestAnimationFrame(tick);
          };
          requestAnimationFrame(tick);
        }
      },
      { threshold: 0.4 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [value, animated]);

  return (
    <div style={{ display: "inline-flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
      <svg ref={containerRef} width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle
          cx={size / 2} cy={size / 2} r={radius}
          fill="none" stroke={trackColor} strokeWidth={stroke}
        />
        <circle
          ref={ref}
          cx={size / 2} cy={size / 2} r={radius}
          fill="none" stroke={color} strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          style={{ transition: "stroke-dashoffset 0.05s linear", filter: `drop-shadow(0 0 4px ${color}60)` }}
        />
      </svg>
      <div style={{ textAlign: "center", marginTop: -size * 0.1 }}>
        <p style={{ fontSize: size * 0.18, fontWeight: 800, color, margin: 0, lineHeight: 1 }}>
          {displayed}{suffix}
        </p>
        {label && <p style={{ fontSize: 10, color: "rgba(0,0,0,.45)", margin: "2px 0 0", fontWeight: 500 }}>{label}</p>}
      </div>
    </div>
  );
}
