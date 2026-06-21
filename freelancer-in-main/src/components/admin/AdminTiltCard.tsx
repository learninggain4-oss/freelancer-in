import { useRef } from "react";

interface Props {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  intensity?: number;
  glare?: boolean;
  onClick?: (e: React.MouseEvent<HTMLDivElement>) => void;
}

export default function AdminTiltCard({
  children, className, style, intensity = 10, glare = true, onClick
}: Props) {
  const cardRef = useRef<HTMLDivElement>(null);
  const glareRef = useRef<HTMLDivElement>(null);

  const handleMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = cardRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    const rotX = (y - 0.5) * -intensity;
    const rotY = (x - 0.5) * intensity;
    el.style.transform = `perspective(700px) rotateX(${rotX}deg) rotateY(${rotY}deg) scale(1.025)`;
    if (glareRef.current && glare) {
      const angle = Math.atan2(y - 0.5, x - 0.5) * (180 / Math.PI);
      glareRef.current.style.background = `linear-gradient(${angle}deg, rgba(255,255,255,0.18) 0%, rgba(255,255,255,0) 60%)`;
      glareRef.current.style.opacity = "1";
    }
  };

  const handleLeave = () => {
    const el = cardRef.current;
    if (!el) return;
    el.style.transform = "perspective(700px) rotateX(0deg) rotateY(0deg) scale(1)";
    el.style.transition = "transform 0.4s cubic-bezier(0.22,1,0.36,1)";
    if (glareRef.current) glareRef.current.style.opacity = "0";
    setTimeout(() => { if (el) el.style.transition = ""; }, 400);
  };

  const handleEnter = () => {
    const el = cardRef.current;
    if (el) el.style.transition = "none";
  };

  return (
    <div
      ref={cardRef}
      className={className}
      style={{ position: "relative", overflow: "hidden", willChange: "transform", ...style }}
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
      onMouseEnter={handleEnter}
      onClick={onClick}
    >
      {glare && (
        <div
          ref={glareRef}
          style={{
            position: "absolute", inset: 0, borderRadius: "inherit",
            opacity: 0, pointerEvents: "none", zIndex: 10,
            transition: "opacity 0.2s ease",
          }}
        />
      )}
      {children}
    </div>
  );
}
