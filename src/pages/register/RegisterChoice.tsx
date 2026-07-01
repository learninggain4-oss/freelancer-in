import { useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Briefcase, Building2, ArrowRight } from "lucide-react";
import AuthPageShell, { AUTH_CSS, A1, A2 } from "@/components/layout/AuthPageShell";

const RegisterChoice = () => {
  const [searchParams] = useSearchParams();
  const ref = searchParams.get("ref");
  const qs = ref ? `?ref=${encodeURIComponent(ref)}` : "";

  useEffect(() => {
    document.title = "Register | Freelan Space";
    return () => { document.title = "Freelan Space"; };
  }, []);

  return (
    <AuthPageShell maxWidth={560}>
      <style>{AUTH_CSS}</style>
      <div className="auth-glass-card" style={{ borderRadius: 24, padding: 40 }}>
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: "white", marginBottom: 8 }}>
            Join Freelan Space
          </h1>
          <p style={{ color: "rgba(255,255,255,.5)", fontSize: 14 }}>
            {ref ? "You've been invited! Choose how you'd like to get started." : "Choose how you'd like to get started."}
          </p>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <Link
            to={`/register/freelancer${qs}`}
            style={{
              display: "flex", alignItems: "center", gap: 16, padding: 20,
              borderRadius: 16, textDecoration: "none",
              background: "rgba(99,102,241,.1)", border: "1px solid rgba(99,102,241,.25)",
              transition: "all .2s",
            }}
          >
            <div style={{
              width: 48, height: 48, borderRadius: 12, flexShrink: 0,
              background: `linear-gradient(135deg,${A1},${A2})`,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <Briefcase size={22} color="white" />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ color: "white", fontWeight: 700, fontSize: 16 }}>I'm a Freelancer</div>
              <div style={{ color: "rgba(255,255,255,.5)", fontSize: 13 }}>Find projects & get paid for your skills</div>
            </div>
            <ArrowRight size={18} color="rgba(255,255,255,.4)" />
          </Link>

          <Link
            to={`/register/employer${qs}`}
            style={{
              display: "flex", alignItems: "center", gap: 16, padding: 20,
              borderRadius: 16, textDecoration: "none",
              background: "rgba(52,211,153,.08)", border: "1px solid rgba(52,211,153,.2)",
              transition: "all .2s",
            }}
          >
            <div style={{
              width: 48, height: 48, borderRadius: 12, flexShrink: 0,
              background: "linear-gradient(135deg,#22c55e,#10b981)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <Building2 size={22} color="white" />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ color: "white", fontWeight: 700, fontSize: 16 }}>I'm an Employer</div>
              <div style={{ color: "rgba(255,255,255,.5)", fontSize: 13 }}>Post projects & hire skilled freelancers</div>
            </div>
            <ArrowRight size={18} color="rgba(255,255,255,.4)" />
          </Link>
        </div>

        <p style={{ textAlign: "center", marginTop: 24, color: "rgba(255,255,255,.4)", fontSize: 13 }}>
          Already have an account?{" "}
          <Link to="/login" style={{ color: A1, fontWeight: 600, textDecoration: "none" }}>Log in</Link>
        </p>
      </div>
    </AuthPageShell>
  );
};

export default RegisterChoice;
