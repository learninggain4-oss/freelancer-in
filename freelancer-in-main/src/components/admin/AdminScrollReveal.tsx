import { useEffect, useRef } from "react";

interface Props {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  delay?: number;
  direction?: "up" | "left" | "right" | "scale";
}

const directionClass: Record<string, string> = {
  up:    "admin-scroll-up",
  left:  "admin-scroll-left",
  right: "admin-scroll-right",
  scale: "admin-scroll-scale",
};

export default function AdminScrollReveal({
  children, className = "", style, delay = 0, direction = "up"
}: Props) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.classList.add("admin-scroll-hidden");

    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setTimeout(() => {
            el.classList.remove("admin-scroll-hidden");
            el.classList.add(directionClass[direction], "admin-scroll-visible");
          }, delay);
          obs.unobserve(el);
        }
      },
      { threshold: 0.12, rootMargin: "0px 0px -30px 0px" }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [delay, direction]);

  return (
    <div ref={ref} className={className} style={style}>
      {children}
    </div>
  );
}
