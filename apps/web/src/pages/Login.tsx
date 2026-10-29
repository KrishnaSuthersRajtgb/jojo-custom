import { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { LogIn, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

// ── Design tokens (same family as Home.jsx) ────────────────────────────────
const serif = { fontFamily: "'Fraunces', Georgia, 'Times New Roman', serif" };
const serifItalic = { ...serif, fontStyle: 'italic' as const };

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  const justSignedUp = Boolean((location.state as { justSignedUp?: boolean } | null)?.justSignedUp);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Please enter your email and password.');
      return;
    }

    setSubmitting(true);
    try {
      await login({ email, password });
      void navigate('/measurements', { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid email or password.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="w-full bg-[#FAF7F2] min-h-[calc(100vh-7rem)] flex flex-col justify-center py-16 px-6">
      <div className="max-w-md w-full mx-auto">
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-full border border-[#B8935A]/60 bg-white flex items-center justify-center mx-auto mb-4 shadow-sm">
            <LogIn className="h-5 w-5 text-[#5C1A32]" />
          </div>
          <span className="text-[10px] font-semibold tracking-[0.28em] text-[#5C1A32] uppercase block mb-1">
            CLIENT PORTAL · JOJO FLORA
          </span>
          <h1 className="text-3xl sm:text-4xl text-[#1B1512] font-normal" style={serif}>
            Welcome{' '}
            <span style={serifItalic} className="text-[#B8935A]">
              Back
            </span>
          </h1>
          <p className="text-xs text-[#544B45] mt-1.5 font-light">
            Sign in to access your bespoke measures, custom designs &amp; orders
          </p>
        </div>

        <div className="bg-white border border-[#5C1A32]/15 p-8 sm:p-10 shadow-[0_20px_45px_-15px_rgba(27,21,18,0.15)]">
          {justSignedUp && !error && (
            <div className="mb-5 border border-[#B8935A]/50 bg-[#FAF7F2] text-[#5C1A32] text-xs px-4 py-2.5">
              Account created successfully! Please sign in.
            </div>
          )}

          {error && (
            <div className="mb-5 border border-[#5C1A32]/30 bg-[#5C1A32]/5 text-[#5C1A32] text-xs px-4 py-2.5">
              {error}
            </div>
          )}

          <form
            onSubmit={(e) => {
              void handleSubmit(e);
            }}
            className="space-y-5"
          >
            <div>
              <label className="block text-[11px] font-semibold tracking-wider text-[#1B1512] uppercase mb-1.5">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                }}
                placeholder="client@atelier.com"
                className="w-full px-4 py-3 bg-[#FAF7F2] border border-[#5C1A32]/20 text-sm text-[#1B1512] focus:outline-none focus:border-[#5C1A32] focus:bg-white transition-colors"
                autoComplete="email"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold tracking-wider text-[#1B1512] uppercase mb-1.5">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                  }}
                  placeholder="••••••••"
                  className="w-full px-4 py-3 bg-[#FAF7F2] border border-[#5C1A32]/20 text-sm text-[#1B1512] focus:outline-none focus:border-[#5C1A32] focus:bg-white transition-colors pr-10"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => {
                    setShowPassword((s) => !s);
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#544B45] hover:text-[#1B1512] p-1"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-[#5C1A32] text-[#FAF7F2] text-xs font-semibold tracking-[0.2em] uppercase py-3.5 shadow-md hover:bg-[#451325] transition-all disabled:opacity-50 mt-2"
            >
              {submitting ? 'Authenticating...' : 'Sign In to Atelier'}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-[#5C1A32]/10 text-center">
            <span className="text-xs text-[#544B45]">New to JoJo Flora? </span>
            <Link
              to="/signup"
              className="text-xs font-semibold text-[#5C1A32] hover:text-[#B8935A] uppercase tracking-wider ml-1"
            >
              Create Bespoke Account
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
