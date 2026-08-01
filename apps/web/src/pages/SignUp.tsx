import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { UserPlus, Eye, EyeOff } from "lucide-react";
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

export default function SignupPage() {
  const navigate = useNavigate();
  const { signup } = useAuth();

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [gender, setGender] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");

    if (!username || !email || !gender || !phoneNumber || !password) {
      setError("Please fill in all fields.");
      return;
    }
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      setError("Please enter a valid email address.");
      return;
    }
    if (!/^\d{10}$/.test(phoneNumber)) {
      setError("Please enter a valid 10-digit phone number.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setSubmitting(true);
try {
  await signup({ username, email, gender, phoneNumber, password });
  void navigate("/login", { replace: true, state: { justSignedUp: true } });
} catch (err) {
  setError(err instanceof Error ? err.message : "Signup failed. Please try again.");
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
            <UserPlus className="h-5 w-5 text-[#F6F1E7]" />
          </div>
          <span className="inline-block text-[11px] font-semibold tracking-[0.25em] text-[#5C1A32] uppercase mb-4">
            Join the Atelier
          </span>
          <h1
            className="text-4xl md:text-5xl text-[#1B1512] font-medium leading-[1.1] mb-3"
            style={serif}
          >
            Create your <span style={serifItalic} className="text-[#5C1A32]">account</span>
          </h1>
          <p className="text-[#4A413B] text-sm">
            Sign up to save your measurements and orders
          </p>
        </div>
      </section>

      <TapeRule tone="wine" />

      {/* ---------------- SIGNUP CARD ---------------- */}
      <section className="w-full px-6 py-16">
        <div className="max-w-md mx-auto bg-[#F6F1E7] border border-[#5C1A32]/15 p-8">
          {error && (
            <div className="mb-5 border border-[#5C1A32]/30 bg-[#5C1A32]/5 text-[#5C1A32] text-sm px-3 py-2 rounded-sm">
              {error}
            </div>
          )}

          <form onSubmit={(e) => { void handleSubmit(e); }} className="space-y-5">
            <div>
              <label className="block text-[11px] font-semibold tracking-[0.2em] text-[#1B1512] uppercase mb-2">
                Username
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => { setUsername(e.target.value); }}
                className="w-full rounded-sm border border-[#5C1A32]/20 bg-[#F6F1E7] px-3 py-2.5 text-sm text-[#1B1512] focus:outline-none focus:ring-1 focus:ring-[#5C1A32] focus:border-[#5C1A32]"
                placeholder="e.g. priya_s"
              />
            </div>

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
                Gender
              </label>
              <div className="flex gap-2">
                {["Female", "Male", "Other"].map((g) => (
                  <button
                    key={g}
                    type="button"
                    onClick={() => { setGender(g); }}
                    className={`flex-1 px-3 py-2.5 rounded-sm text-xs font-medium border transition-colors ${
                      gender === g
                        ? "bg-[#1B1512] border-[#1B1512] text-[#F6F1E7]"
                        : "border-[#5C1A32]/20 text-[#4A413B] hover:border-[#5C1A32]"
                    }`}
                  >
                    {g}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold tracking-[0.2em] text-[#1B1512] uppercase mb-2">
                Phone Number
              </label>
              <input
                type="tel"
                value={phoneNumber}
                onChange={(e) => { setPhoneNumber(e.target.value.replace(/\D/g, "").slice(0, 10)); }}
                className="w-full rounded-sm border border-[#5C1A32]/20 bg-[#F6F1E7] px-3 py-2.5 text-sm text-[#1B1512] focus:outline-none focus:ring-1 focus:ring-[#5C1A32] focus:border-[#5C1A32]"
                placeholder="10-digit mobile number"
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
                  placeholder="At least 6 characters"
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

            <div>
              <label className="block text-[11px] font-semibold tracking-[0.2em] text-[#1B1512] uppercase mb-2">
                Confirm Password
              </label>
              <input
                type={showPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => { setConfirmPassword(e.target.value); }}
                className="w-full rounded-sm border border-[#5C1A32]/20 bg-[#F6F1E7] px-3 py-2.5 text-sm text-[#1B1512] focus:outline-none focus:ring-1 focus:ring-[#5C1A32] focus:border-[#5C1A32]"
                placeholder="Re-enter your password"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full inline-flex items-center justify-center gap-2 rounded-sm bg-[#1B1512] text-[#F6F1E7] font-medium text-sm py-3 hover:bg-[#5C1A32] transition-colors disabled:opacity-60"
            >
              {submitting ? "Creating account..." : "Sign Up"}
            </button>
          </form>

          <p className="text-center text-sm text-[#4A413B] mt-8">
            Already have an account?{" "}
            <Link to="/login" className="text-[#5C1A32] font-semibold hover:opacity-70 transition-opacity">
              Log in
            </Link>
          </p>
        </div>
      </section>
    </div>
  );
}