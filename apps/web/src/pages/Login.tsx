import { useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { LogIn, Eye, EyeOff } from "lucide-react";
import { useAuth } from "../context/AuthContext";

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
    <div className="w-full">
      <section className="w-full px-6 py-14 bg-rose-50/40">
        <div className="max-w-md mx-auto text-center">
          <div className="h-12 w-12 rounded-full bg-gradient-to-r from-fuchsia-800 to-pink-600 flex items-center justify-center mx-auto mb-4">
            <LogIn className="h-6 w-6 text-white" />
          </div>
          <h1 className="text-4xl font-serif font-bold text-gray-900 mb-2">
            Welcome back
          </h1>
          <p className="text-gray-500">
            Log in to continue to your measurements
          </p>
        </div>
      </section>

      <section className="w-full px-6 py-10">
        <div className="max-w-md mx-auto bg-white rounded-2xl border border-gray-100 shadow-sm p-8">
          {justSignedUp && !error && (
            <div className="mb-4 rounded-xl bg-green-50 border border-green-200 text-green-700 text-sm px-3 py-2">
              Account created! Please log in.
            </div>
          )}

          {error && (
            <div className="mb-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm px-3 py-2">
              {error}
            </div>
          )}

          <form onSubmit={(e) => { void handleSubmit(e); }} className="space-y-4">
            <div>
              <label className="block text-xs font-bold tracking-wide text-gray-800 mb-2">
                EMAIL
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => { setEmail(e.target.value); }}
                className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-fuchsia-800 focus:border-fuchsia-800"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label className="block text-xs font-bold tracking-wide text-gray-800 mb-2">
                PASSWORD
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); }}
                  className="w-full rounded-xl border border-gray-200 px-3 py-2 pr-10 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-fuchsia-800 focus:border-fuchsia-800"
                  placeholder="Your password"
                />
                <button
                  type="button"
                  onClick={() => { setShowPassword((s) => !s); }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-fuchsia-800 to-pink-600 text-white font-semibold py-3 hover:opacity-95 transition-opacity disabled:opacity-60"
            >
              {submitting ? "Logging in..." : "Log In"}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-6">
            Don't have an account?{" "}
            <Link to="/signup" className="text-fuchsia-800 font-semibold hover:underline">
              Sign up
            </Link>
          </p>
        </div>
      </section>
    </div>
  );
}