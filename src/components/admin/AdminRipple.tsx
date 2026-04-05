import { useRef } from "react";

interface Props {
  children: React.ReactNode;
  color?: string;
  style?: React.CSSProperties;
  className?: string;
  onClick?: (e: React.MouseEvent<HTMLDivElement>) => void;
}

export default function AdminRipple({ children, color = "rgba(99,102,241,0.25)", style, className, onClick }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const size = Math.max(rect.width, rect.height) * 2.2;

    const ripple = document.createElement("span");
    ripple.style.cssText = `
      position:absolute;
      left:${x - size / 2}px;
      top:${y - size / 2}px;
      width:${size}px;
      height:${size}px;
      border-radius:50%;
      background:${color};
      transform:scale(0);
      animation:adminRippleEffect 0.55s cubic-bezier(0.4,0,0.2,1) forwards;
      pointer-events:none;
      z-index:9;
    `;
    el.appendChild(ripple);
    setTimeout(() => ripple.remove(), 600);
    onClick?.(e);
  };

  return (
    <div
      ref={ref}
      className={className}
      style={{ position: "relative", overflow: "hidden", ...style }}
      onClick={handleClick}
    >
      {children}
    </div>
  );
}
