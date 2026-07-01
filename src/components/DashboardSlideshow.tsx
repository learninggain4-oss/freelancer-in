import { useEffect, useState, useRef, useCallback } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

export type SlideTarget = "all" | "freelancer" | "employer";

interface Slide {
  id: string;
  image_url: string;
  link_url?: string;
  target: SlideTarget;
  sort_order: number;
  active: boolean;
}

interface Props {
  target: "freelancer" | "employer";
  autoPlayMs?: number;
}

const DashboardSlideshow = ({ target, autoPlayMs = 3500 }: Props) => {
  const [slides, setSlides] = useState<Slide[]>([]);
  const [current, setCurrent] = useState(0);
  const [loading, setLoading] = useState(true);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const touchStartX = useRef<number | null>(null);

  useEffect(() => {
    const fetchSlides = async () => {
      try {
        const res = await fetch("/functions/v1/slideshow-settings");
        const json = await res.json();
        const all: Slide[] = json.slides ?? [];
        const filtered = all.filter(
          (s) => s.active && (s.target === "all" || s.target === target)
        ).sort((a, b) => a.sort_order - b.sort_order);
        setSlides(filtered);
      } catch { }
      setLoading(false);
    };
    fetchSlides();
  }, [target]);

  const next = useCallback(() => {
    setCurrent((p) => (p + 1) % slides.length);
  }, [slides.length]);

  const prev = useCallback(() => {
    setCurrent((p) => (p - 1 + slides.length) % slides.length);
  }, [slides.length]);

  useEffect(() => {
    if (slides.length <= 1) return;
    timerRef.current = setInterval(next, autoPlayMs);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [slides.length, next, autoPlayMs]);

  const resetTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (slides.length > 1) timerRef.current = setInterval(next, autoPlayMs);
  };

  if (loading || slides.length === 0) return null;

  const slide = slides[current];

  const handleClick = () => {
    if (slide.link_url) {
      if (slide.link_url.startsWith("http")) window.open(slide.link_url, "_blank");
      else window.location.href = slide.link_url;
    }
  };

  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        borderRadius: 16,
        overflow: "hidden",
        aspectRatio: "16/5",
        userSelect: "none",
        cursor: slide.link_url ? "pointer" : "default",
        boxShadow: "0 4px 20px rgba(0,0,0,.15)",
      }}
      onClick={handleClick}
      onTouchStart={(e) => { touchStartX.current = e.touches[0].clientX; }}
      onTouchEnd={(e) => {
        if (touchStartX.current === null) return;
        const dx = e.changedTouches[0].clientX - touchStartX.current;
        if (Math.abs(dx) > 40) { dx < 0 ? next() : prev(); resetTimer(); }
        touchStartX.current = null;
      }}
    >
      {slides.map((s, i) => (
        <img
          key={s.id}
          src={s.image_url}
          alt={`slide-${i}`}
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
            transition: "opacity 0.5s ease",
            opacity: i === current ? 1 : 0,
            pointerEvents: "none",
          }}
        />
      ))}

      {slides.length > 1 && (
        <>
          <button
            onClick={(e) => { e.stopPropagation(); prev(); resetTimer(); }}
            style={{
              position: "absolute", left: 8, top: "50%", transform: "translateY(-50%)",
              background: "rgba(0,0,0,.35)", border: "none", borderRadius: "50%",
              width: 28, height: 28, cursor: "pointer", display: "flex",
              alignItems: "center", justifyContent: "center", color: "white", zIndex: 2,
            }}
          >
            <ChevronLeft size={16} />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); next(); resetTimer(); }}
            style={{
              position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)",
              background: "rgba(0,0,0,.35)", border: "none", borderRadius: "50%",
              width: 28, height: 28, cursor: "pointer", display: "flex",
              alignItems: "center", justifyContent: "center", color: "white", zIndex: 2,
            }}
          >
            <ChevronRight size={16} />
          </button>

          <div style={{
            position: "absolute", bottom: 8, left: "50%", transform: "translateX(-50%)",
            display: "flex", gap: 5, zIndex: 2,
          }}>
            {slides.map((_, i) => (
              <button
                key={i}
                onClick={(e) => { e.stopPropagation(); setCurrent(i); resetTimer(); }}
                style={{
                  width: i === current ? 18 : 6, height: 6,
                  borderRadius: 3, border: "none", cursor: "pointer",
                  background: i === current ? "white" : "rgba(255,255,255,.45)",
                  transition: "all 0.3s ease", padding: 0,
                }}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default DashboardSlideshow;
