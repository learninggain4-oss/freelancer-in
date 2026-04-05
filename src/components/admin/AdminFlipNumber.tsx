import { useEffect, useRef, useState } from "react";

interface Props {
  value: number;
  prefix?: string;
  suffix?: string;
  style?: React.CSSProperties;
  digitStyle?: React.CSSProperties;
}

function FlipDigit({ digit, prev }: { digit: string; prev: string }) {
  const [flipping, setFlipping] = useState(false);
  const [displayed, setDisplayed] = useState(digit);
  const [incoming, setIncoming] = useState(digit);

  useEffect(() => {
    if (digit === displayed) return;
    setIncoming(digit);
    setFlipping(true);
    const t = setTimeout(() => {
      setDisplayed(digit);
      setFlipping(false);
    }, 300);
    return () => clearTimeout(t);
  }, [digit]);

  return (
    <span style={{ position: "relative", display: "inline-block", overflow: "hidden", lineHeight: 1 }}>
      <span
        style={{
          display: "inline-block",
          transform: flipping ? "translateY(-100%)" : "translateY(0)",
          opacity: flipping ? 0 : 1,
          transition: flipping ? "transform 0.28s cubic-bezier(0.4,0,0.2,1), opacity 0.28s ease" : "none",
        }}
      >
        {displayed}
      </span>
      {flipping && (
        <span
          style={{
            position: "absolute",
            left: 0, top: "100%",
            transform: flipping ? "translateY(-100%)" : "translateY(0)",
            opacity: flipping ? 1 : 0,
            transition: "transform 0.28s cubic-bezier(0.4,0,0.2,1), opacity 0.28s ease",
          }}
        >
          {incoming}
        </span>
      )}
    </span>
  );
}

export default function AdminFlipNumber({ value, prefix = "", suffix = "", style, digitStyle }: Props) {
  const [displayed, setDisplayed] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const started = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !started.current) {
        started.current = true;
        const start = performance.now();
        const dur = 1600;
        const tick = (now: number) => {
          const t = Math.min((now - start) / dur, 1);
          const ease = 1 - Math.pow(1 - t, 4);
          setDisplayed(Math.round(ease * value));
          if (t < 1) requestAnimationFrame(tick);
          else setDisplayed(value);
        };
        requestAnimationFrame(tick);
      }
    }, { threshold: 0.3 });
    obs.observe(el);
    return () => obs.disconnect();
  }, [value]);

  const str = String(displayed);
  const prevStr = String(Math.max(0, displayed - 1));

  return (
    <span ref={ref} style={{ display: "inline-flex", alignItems: "baseline", ...style }}>
      {prefix && <span style={{ marginRight: 1 }}>{prefix}</span>}
      {str.split("").map((d, i) => (
        <FlipDigit key={i} digit={d} prev={prevStr[i] ?? "0"} />
      ))}
      {suffix && <span style={{ marginLeft: 1 }}>{suffix}</span>}
    </span>
  );
}
