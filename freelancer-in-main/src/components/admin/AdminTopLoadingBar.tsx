import { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";

export default function AdminTopLoadingBar() {
  const location = useLocation();
  const [width, setWidth] = useState(0);
  const [visible, setVisible] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const prevPath = useRef(location.pathname);
  const rafRef = useRef<number>(0);

  const startLoad = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    cancelAnimationFrame(rafRef.current);
    setVisible(true);
    setWidth(0);

    let current = 0;
    const tick = () => {
      current += (85 - current) * 0.08 + 0.3;
      setWidth(Math.min(current, 85));
      if (current < 85) rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
  };

  const finishLoad = () => {
    cancelAnimationFrame(rafRef.current);
    setWidth(100);
    timerRef.current = setTimeout(() => {
      setVisible(false);
      setWidth(0);
    }, 400);
  };

  useEffect(() => {
    if (location.pathname === prevPath.current) return;
    prevPath.current = location.pathname;
    startLoad();
    const t = setTimeout(finishLoad, 380);
    return () => clearTimeout(t);
  }, [location.pathname]);

  if (!visible && width === 0) return null;

  return (
    <div
      style={{
        position: "fixed",
        top: 0, left: 0,
        width: `${width}%`,
        height: 2.5,
        background: "linear-gradient(90deg, #6366f1, #8b5cf6, #ec4899)",
        zIndex: 9999,
        transition: width === 100 ? "width 0.2s ease, opacity 0.3s ease" : "none",
        opacity: visible ? 1 : 0,
        boxShadow: "0 0 8px rgba(99,102,241,0.7), 0 0 20px rgba(139,92,246,0.4)",
        borderRadius: "0 2px 2px 0",
        pointerEvents: "none",
      }}
    >
      {/* Glowing tip */}
      <div style={{
        position: "absolute",
        right: 0, top: "50%",
        transform: "translateY(-50%)",
        width: 6, height: 6,
        borderRadius: "50%",
        background: "#a855f7",
        boxShadow: "0 0 12px 4px rgba(168,85,247,0.8)",
      }} />
    </div>
  );
}
