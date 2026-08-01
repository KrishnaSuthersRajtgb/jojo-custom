import { useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { LogIn, Eye, EyeOff } from "lucide-react";
import { useAuth } from "../context/AuthContext";

// ── Design tokens (same family as Home.jsx) ────────────────────────────────
const serif = { fontFamily: "'Fraunces', Georgia, 'Times New Roman', serif" };
const serifItalic = { ...serif, fontStyle: "italic" as const };

// Tape-tick divider, echoing TapeRule from Home.jsx
function TapeRule({ tone = "wine" }: { tone?: "wine" | "brass" }) {
  const ticks = Array.from({ length: 41 });
  const tickColor = tone === "wine" ? "bg-[#5C1A32]/25" : "bg-[#B8935A]/50";
  const majorColor = tone === "wine" ? "bg-[#5C1A32]/50" : "bg-[#B8935A]/80";
  return (
    <div className="w-full overflow-hidden" aria-hidden="true">
      <div className="max-w-5xl mx-auto px-6 flex items-end justify-between h-4">
        {ticks.map((_, i) => (
          <div
            key={i}
            className={`w-px ${i % 5 === 0 ? `h-3.5 ${majorColor}` : `h-1.5 ${tickColor}`}`}
          />
        ))}
      </div>
    </div>
  );
}

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  const justSignedUp = Boolean((location.state as { justSignedUp?: boolean } | null)?.justSignedUp);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

const handleSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");

    if (!email || !password) {
      setError("Please enter your email and password.");
      return;
    }

    setSubmitting(true);
try {
  await login({ email, password });
  void navigate("/measurements", { replace: true });
} catch (err) {
  setError(err instanceof Error ? err.message : "Invalid email or password.");
} finally {
  setSubmitting(false);
}
  };

  return (
    <div className="w-full bg-[#F6F1E7]">
      {/* ---------------- HERO ---------------- */}
      <section className="w-full px-6 pt-20 pb-14">
        <div className="max-w-md mx-auto text-center">
          <div className="h-12 w-12 rounded-sm bg-[#1B1512] flex items-center justify-center mx-auto mb-6">
            <LogIn className="h-5 w-5 text-[#F6F1E7]" />
          </div>
          <span className="inline-block text-[11px] font-semibold tracking-[0.25em] text-[#5C1A32] uppercase mb-4">
            Account Access
          </span>
          <h1
            className="text-4xl md:text-5xl text-[#1B1512] font-medium leading-[1.1] mb-3"
            style={serif}
          >
            Welcome <span style={serifItalic} className="text-[#5C1A32]">back</span>
          </h1>
          <p className="text-[#4A413B] text-sm">
            Log in to continue to your measurements
          </p>
        </div>
      </section>

      <TapeRule tone="wine" />

      {/* ---------------- LOGIN CARD ---------------- */}
      <section className="w-full px-6 py-16">
        <div className="max-w-md mx-auto bg-[#F6F1E7] border border-[#5C1A32]/15 p-8">
          {justSignedUp && !error && (
            <div className="mb-5 border border-[#5C1A32]/20 bg-[#5C1A32]/5 text-[#5C1A32] text-sm px-3 py-2 rounded-sm">
              Account created! Please log in.
            </div>
          )}

          {error && (
            <div className="mb-5 border border-[#5C1A32]/30 bg-[#5C1A32]/5 text-[#5C1A32] text-sm px-3 py-2 rounded-sm">
              {error}
            </div>
          )}

          <form onSubmit={(e) => { void handleSubmit(e); }} className="space-y-5">
            <div>
              <label className="block text-[11px] font-semibold tracking-[0.2em] text-[#1B1512] uppercase mb-2">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => { setEmail(e.target.value); }}
                className="w-full rounded-sm border border-[#5C1A32]/20 bg-[#F6F1E7] px-3 py-2.5 text-sm text-[#1B1512] focus:outline-none focus:ring-1 focus:ring-[#5C1A32] focus:border-[#5C1A32]"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold tracking-[0.2em] text-[#1B1512] uppercase mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); }}
                  className="w-full rounded-sm border border-[#5C1A32]/20 bg-[#F6F1E7] px-3 py-2.5 pr-10 text-sm text-[#1B1512] focus:outline-none focus:ring-1 focus:ring-[#5C1A32] focus:border-[#5C1A32]"
                  placeholder="Your password"
                />
                <button
                  type="button"
                  onClick={() => { setShowPassword((s) => !s); }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#4A413B]/60 hover:text-[#5C1A32] transition-colors"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full inline-flex items-center justify-center gap-2 rounded-sm bg-[#1B1512] text-[#F6F1E7] font-medium text-sm py-3 hover:bg-[#5C1A32] transition-colors disabled:opacity-60"
            >
              {submitting ? "Logging in..." : "Log In"}
            </button>
          </form>

          <p className="text-center text-sm text-[#4A413B] mt-8">
            Don't have an account?{" "}
            <Link to="/signup" className="text-[#5C1A32] font-semibold hover:opacity-70 transition-opacity">
              Sign up
            </Link>
          </p>
        </div>
      </section>
    </div>
  );
}