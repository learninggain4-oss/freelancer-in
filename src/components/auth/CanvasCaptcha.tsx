import { useCallback, useEffect, useRef, useState } from "react";
import { RefreshCw, Check } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

const CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no confusing 0/O/1/I
const CAPTCHA_WIDTH = 260;
const CAPTCHA_HEIGHT = 78;

const getRandomIndex = (max: number) => {
  if (typeof crypto !== "undefined" && crypto.getRandomValues) {
    const value = new Uint32Array(1);
    crypto.getRandomValues(value);
    return value[0] % max;
  }

  return Math.floor(Math.random() * max);
};

const generateCode = (len = 6) => {
  let s = "";
  for (let i = 0; i < len; i++) s += CHARS[getRandomIndex(CHARS.length)];
  return s;
};

const generateFreshCode = (previousCode?: string, len = 6) => {
  let nextCode = generateCode(len);

  while (nextCode === previousCode) {
    nextCode = generateCode(len);
  }

  return nextCode;
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

    const pixelRatio = canvas.ownerDocument.defaultView?.devicePixelRatio ?? 1;

    // Reset the bitmap on every draw so the previous CAPTCHA is fully removed.
    canvas.width = CAPTCHA_WIDTH * pixelRatio;
    canvas.height = CAPTCHA_HEIGHT * pixelRatio;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    const W = CAPTCHA_WIDTH, H = CAPTCHA_HEIGHT;

    const drawRoundedRect = (x: number, y: number, width: number, height: number, radius: number) => {
      ctx.beginPath();
      ctx.moveTo(x + radius, y);
      ctx.lineTo(x + width - radius, y);
      ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
      ctx.lineTo(x + width, y + height - radius);
      ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
      ctx.lineTo(x + radius, y + height);
      ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
      ctx.lineTo(x, y + radius);
      ctx.quadraticCurveTo(x, y, x + radius, y);
      ctx.closePath();
    };

    drawRoundedRect(0, 0, W, H, 16);
    ctx.clip();

    // Premium glass-style background
    const grad = ctx.createLinearGradient(0, 0, W, H);
    grad.addColorStop(0, "#172554");
    grad.addColorStop(0.42, accent);
    grad.addColorStop(1, "#ec4899");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);

    const glow = ctx.createRadialGradient(W * 0.2, H * 0.2, 8, W * 0.2, H * 0.2, W * 0.8);
    glow.addColorStop(0, "rgba(255,255,255,0.32)");
    glow.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, W, H);

    // Subtle diagonal texture
    ctx.strokeStyle = "rgba(255,255,255,0.08)";
    ctx.lineWidth = 1;
    for (let x = -W; x < W * 1.5; x += 18) {
      ctx.beginPath();
      ctx.moveTo(x, H + 8);
      ctx.lineTo(x + W * 0.45, -8);
      ctx.stroke();
    }

    // Soft bubbles
    for (let i = 0; i < 18; i++) {
      const x = Math.random() * W;
      const y = Math.random() * H;
      const radius = 2 + Math.random() * 6;
      ctx.fillStyle = `rgba(255,255,255,${0.06 + Math.random() * 0.14})`;
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fill();
    }

    // Neon wave distortion lines
    for (let i = 0; i < 4; i++) {
      ctx.strokeStyle = i % 2 === 0 ? "rgba(255,255,255,0.34)" : "rgba(34,211,238,0.34)";
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      const y = 16 + i * 14 + Math.random() * 8;
      ctx.moveTo(-10, y);
      ctx.bezierCurveTo(
        W * 0.28, y - 26 + Math.random() * 24,
        W * 0.65, y + 26 - Math.random() * 24,
        W + 10, y + Math.random() * 10
      );
      ctx.stroke();
    }

    // Characters with bright fill and dark outline
    const chars = text.split("");
    const slot = W / (chars.length + 1);
    chars.forEach((ch, i) => {
      ctx.save();
      const x = slot * (i + 1);
      const y = H / 2 + (Math.random() * 10 - 5);
      const angle = (Math.random() - 0.5) * 0.55;
      ctx.translate(x, y);
      ctx.rotate(angle);

      const size = 31 + Math.random() * 7;
      ctx.font = `900 ${size}px Georgia, serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.lineWidth = 4;
      ctx.strokeStyle = "rgba(15,23,42,0.5)";
      ctx.shadowColor = "rgba(255,255,255,0.45)";
      ctx.shadowBlur = 8;
      ctx.strokeText(ch, 0, 0);

      const letterGrad = ctx.createLinearGradient(-14, -18, 14, 18);
      letterGrad.addColorStop(0, "#ffffff");
      letterGrad.addColorStop(0.55, "#bae6fd");
      letterGrad.addColorStop(1, "#fbcfe8");
      ctx.fillStyle = letterGrad;
      ctx.fillText(ch, 0, 0);
      ctx.restore();
    });

    // Fine sparkle layer on top
    for (let i = 0; i < 36; i++) {
      ctx.fillStyle = `rgba(255,255,255,${0.2 + Math.random() * 0.35})`;
      ctx.fillRect(Math.random() * W, Math.random() * H, 1.2, 1.2);
    }
  }, [accent]);

  useEffect(() => { draw(code); }, [code, draw]);

  const regenerate = () => {
    setCode((previousCode) => generateFreshCode(previousCode));
    setAnswer("");
    onVerifiedChange(false);
  };

  const verify = () => {
    if (answer.trim().toUpperCase() === code) {
      onVerifiedChange(true);
      toast({ title: "CAPTCHA verified!" });
    } else {
      toast({ title: "Wrong code", description: "Please try again.", variant: "destructive" });
      setCode((previousCode) => generateFreshCode(previousCode));
      setAnswer("");
    }
  };

  return (
    <div style={{ borderRadius: 18, border: `1px solid ${accent}55`, background: "linear-gradient(145deg, rgba(15,23,42,.86), rgba(30,41,59,.58))", padding: 14, boxShadow: `0 16px 40px ${accent}22`, backdropFilter: "blur(14px)" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
        <span style={{ color: "rgba(255,255,255,.76)", fontSize: 11, fontWeight: 800, letterSpacing: 1.6, textTransform: "uppercase" }}>Security Check</span>
        <span style={{ color: "rgba(255,255,255,.38)", fontSize: 11 }}>Enter the glowing code</span>
      </div>
      <div style={{ display: "flex", alignItems: "stretch", gap: 10, marginBottom: 12 }}>
        <canvas
          ref={canvasRef}
          width={CAPTCHA_WIDTH}
          height={CAPTCHA_HEIGHT}
          style={{ borderRadius: 16, flex: 1, width: "100%", minWidth: 0, height: CAPTCHA_HEIGHT, userSelect: "none", boxShadow: "inset 0 0 0 1px rgba(255,255,255,.16), 0 12px 30px rgba(0,0,0,.26)" }}
          aria-label="CAPTCHA image"
        />
        <button
          type="button"
          onClick={regenerate}
          style={{ color: "white", background: `linear-gradient(135deg, ${accent}, #ec4899)`, border: "1px solid rgba(255,255,255,.18)", borderRadius: 14, cursor: "pointer", padding: "0 12px", boxShadow: `0 10px 24px ${accent}44`, display: "flex", alignItems: "center", justifyContent: "center" }}
          aria-label="New captcha"
        >
          <RefreshCw size={16} />
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
