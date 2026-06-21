import { useLocation } from "react-router-dom";
import { useRef, useEffect, useState } from "react";

interface Props { children: React.ReactNode; }

export default function AdminPageTransition({ children }: Props) {
  const location = useLocation();
  const [key, setKey] = useState(location.pathname);
  const [visible, setVisible] = useState(true);
  const prevPath = useRef(location.pathname);

  useEffect(() => {
    if (location.pathname === prevPath.current) return;
    prevPath.current = location.pathname;
    setVisible(false);
    const t = setTimeout(() => {
      setKey(location.pathname);
      setVisible(true);
    }, 60);
    return () => clearTimeout(t);
  }, [location.pathname]);

  return (
    <div
      key={key}
      className="admin-page-transition"
      style={{
        opacity: visible ? undefined : 0,
        minHeight: "100%",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {children}
    </div>
  );
}
