import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { UserPlus, Eye, EyeOff } from "lucide-react";
import { useAuth } from "../context/AuthContext";

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
    <div className="w-full">
      <section className="w-full px-6 py-14 bg-rose-50/40">
        <div className="max-w-md mx-auto text-center">
          <div className="h-12 w-12 rounded-full bg-gradient-to-r from-fuchsia-800 to-pink-600 flex items-center justify-center mx-auto mb-4">
            <UserPlus className="h-6 w-6 text-white" />
          </div>
          <h1 className="text-4xl font-serif font-bold text-gray-900 mb-2">
            Create your account
          </h1>
          <p className="text-gray-500">
            Sign up to save your measurements and orders
          </p>
        </div>
      </section>

      <section className="w-full px-6 py-10">
        <div className="max-w-md mx-auto bg-white rounded-2xl border border-gray-100 shadow-sm p-8">
          {error && (
            <div className="mb-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm px-3 py-2">
              {error}
            </div>
          )}

          <form onSubmit={(e) => { void handleSubmit(e); }} className="space-y-4">
            <div>
              <label className="block text-xs font-bold tracking-wide text-gray-800 mb-2">
                USERNAME
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => { setUsername(e.target.value); }}
                className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-fuchsia-800 focus:border-fuchsia-800"
                placeholder="e.g. priya_s"
              />
            </div>

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
                GENDER
              </label>
              <div className="flex gap-2">
                {["Female", "Male", "Other"].map((g) => (
                  <button
                    key={g}
                    type="button"
                    onClick={() => { setGender(g); }}
                    className={`flex-1 px-3 py-2 rounded-xl text-xs font-medium border transition-colors ${
                      gender === g
                        ? "bg-fuchsia-800 border-fuchsia-800 text-white"
                        : "border-gray-200 text-gray-600 hover:border-fuchsia-800"
                    }`}
                  >
                    {g}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold tracking-wide text-gray-800 mb-2">
                PHONE NUMBER
              </label>
              <input
                type="tel"
                value={phoneNumber}
                onChange={(e) => { setPhoneNumber(e.target.value.replace(/\D/g, "").slice(0, 10)); }}
                className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-fuchsia-800 focus:border-fuchsia-800"
                placeholder="10-digit mobile number"
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
                  placeholder="At least 6 characters"
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

            <div>
              <label className="block text-xs font-bold tracking-wide text-gray-800 mb-2">
                CONFIRM PASSWORD
              </label>
              <input
                type={showPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => { setConfirmPassword(e.target.value); }}
                className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-fuchsia-800 focus:border-fuchsia-800"
                placeholder="Re-enter your password"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-fuchsia-800 to-pink-600 text-white font-semibold py-3 hover:opacity-95 transition-opacity disabled:opacity-60"
            >
              {submitting ? "Creating account..." : "Sign Up"}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-6">
            Already have an account?{" "}
            <Link to="/login" className="text-fuchsia-800 font-semibold hover:underline">
              Log in
            </Link>
          </p>
        </div>
      </section>
    </div>
  );
}