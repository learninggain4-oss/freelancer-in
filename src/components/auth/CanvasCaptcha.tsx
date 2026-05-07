import { useCallback, useEffect, useRef, useState } from "react";
import { RefreshCw, Check } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

const CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no confusing 0/O/1/I

const generateCode = (len = 6) => {
  let s = "";
  for (let i = 0; i < len; i++) s += CHARS[Math.floor(Math.random() * CHARS.length)];
  return s;
};

interface Props {
  verified: boolean;
  onVerifiedChange: (v: boolean) => void;
  accent?: string;
}

const CanvasCaptcha = ({ verified, onVerifiedChange, accent = "#6366f1" }: Props) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [code, setCode] = useState(() => generateCode());
  const [answer, setAnswer] = useState("");
  const { toast } = useToast();

  const draw = useCallback((text: string) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const W = canvas.width, H = canvas.height;

    // background
    const grad = ctx.createLinearGradient(0, 0, W, H);
    grad.addColorStop(0, "rgba(99,102,241,0.18)");
    grad.addColorStop(1, "rgba(168,85,247,0.18)");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);

    // noise dots
    for (let i = 0; i < 80; i++) {
      ctx.fillStyle = `rgba(255,255,255,${Math.random() * 0.3})`;
      ctx.beginPath();
      ctx.arc(Math.random() * W, Math.random() * H, Math.random() * 1.5, 0, Math.PI * 2);
      ctx.fill();
    }

    // distortion lines
    for (let i = 0; i < 5; i++) {
      ctx.strokeStyle = `rgba(255,255,255,${0.15 + Math.random() * 0.25})`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(Math.random() * W, Math.random() * H);
      ctx.bezierCurveTo(
        Math.random() * W, Math.random() * H,
        Math.random() * W, Math.random() * H,
        Math.random() * W, Math.random() * H
      );
      ctx.stroke();
    }

    // characters
    const chars = text.split("");
    const slot = W / (chars.length + 1);
    chars.forEach((ch, i) => {
      ctx.save();
      const x = slot * (i + 1);
      const y = H / 2 + (Math.random() * 8 - 4);
      const angle = (Math.random() - 0.5) * 0.7;
      ctx.translate(x, y);
      ctx.rotate(angle);
      const size = 26 + Math.random() * 6;
      ctx.font = `bold ${size}px Georgia, serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      const hue = 200 + Math.random() * 90;
      ctx.fillStyle = `hsl(${hue}, 80%, 75%)`;
      ctx.shadowColor = "rgba(0,0,0,0.5)";
      ctx.shadowBlur = 2;
      ctx.fillText(ch, 0, 0);
      ctx.restore();
    });
  }, []);

  useEffect(() => { draw(code); }, [code, draw]);

  const regenerate = () => {
    setCode(generateCode());
    setAnswer("");
    onVerifiedChange(false);
  };

  const verify = () => {
    if (answer.trim().toUpperCase() === code) {
      onVerifiedChange(true);
      toast({ title: "CAPTCHA verified!" });
    } else {
      toast({ title: "Wrong code", description: "Please try again.", variant: "destructive" });
      setCode(generateCode());
      setAnswer("");
    }
  };

  return (
    <div style={{ borderRadius: 12, border: "1px solid rgba(255,255,255,.1)", background: "rgba(255,255,255,.04)", padding: 14 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
        <canvas
          ref={canvasRef}
          width={200}
          height={60}
          style={{ borderRadius: 8, flex: 1, maxWidth: "100%", userSelect: "none" }}
          aria-label="CAPTCHA image"
        />
        <button
          type="button"
          onClick={regenerate}
          style={{ color: "rgba(255,255,255,.5)", background: "rgba(255,255,255,.06)", border: "1px solid rgba(255,255,255,.1)", borderRadius: 8, cursor: "pointer", padding: 8 }}
          aria-label="New captcha"
        >
          <RefreshCw size={14} />
        </button>
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        <Input
          value={answer}
          onChange={(e) => { setAnswer(e.target.value.toUpperCase()); onVerifiedChange(false); }}
          placeholder="Enter the code above"
          disabled={verified}
          maxLength={code.length}
          autoComplete="off"
          style={{ flex: 1, background: "rgba(255,255,255,.07)", border: "1px solid rgba(255,255,255,.12)", borderRadius: 10, color: "white", height: 38, fontSize: 14, letterSpacing: 2, textTransform: "uppercase", fontWeight: 600 }}
        />
        {!verified ? (
          <button
            type="button"
            onClick={verify}
            disabled={answer.length !== code.length}
            style={{ padding: "0 16px", borderRadius: 10, border: `1px solid ${accent}66`, background: `${accent}1f`, color: accent, fontSize: 12, fontWeight: 700, cursor: answer.length === code.length ? "pointer" : "not-allowed", opacity: answer.length === code.length ? 1 : .5 }}
          >
            Verify
          </button>
        ) : (
          <span style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "0 12px", borderRadius: 10, background: "rgba(34,197,94,.15)", color: "#22c55e", fontSize: 12, fontWeight: 700 }}>
            <Check size={14} /> Verified
          </span>
        )}
      </div>
    </div>
  );
};

export default CanvasCaptcha;
