import { useRef, useCallback } from "react";

interface Props {
  children: React.ReactNode;
  style?: React.CSSProperties;
  className?: string;
  color?: string;
}

export default function AdminTableSpotlight({
  children, style, className, color = "rgba(99,102,241,0.06)"
}: Props) {
  const ref = useRef<HTMLDivElement>(null);

  const onMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    el.style.setProperty("--sx", `${x}px`);
    el.style.setProperty("--sy", `${y}px`);
    el.style.setProperty("--so", "1");
  }, []);

  const onLeave = useCallback(() => {
    const el = ref.current;
    if (el) el.style.setProperty("--so", "0");
  }, []);

  return (
    <div
      ref={ref}
      className={`admin-table-spotlight ${className ?? ""}`}
      style={{
        position: "relative",
        "--sx": "50%",
        "--sy": "50%",
        "--so": "0",
        "--sc": color,
      } as React.CSSProperties & Record<string, string>}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
    >
      {children}
    </div>
  );
}
