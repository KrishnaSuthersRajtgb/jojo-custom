import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { UserPlus, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

// ── Design tokens (same family as Home.jsx) ────────────────────────────────
const serif = { fontFamily: "'Fraunces', Georgia, 'Times New Roman', serif" };
const serifItalic = { ...serif, fontStyle: 'italic' as const };

export default function SignupPage() {
  const navigate = useNavigate();
  const { signup } = useAuth();

  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [gender, setGender] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');

    if (!username || !email || !gender || !phoneNumber || !password) {
      setError('Please fill in all fields.');
      return;
    }
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      setError('Please enter a valid email address.');
      return;
    }
    if (!/^\d{10}$/.test(phoneNumber)) {
      setError('Please enter a valid 10-digit phone number.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setSubmitting(true);
    try {
      await signup({ username, email, gender, phoneNumber, password });
      void navigate('/login', { replace: true, state: { justSignedUp: true } });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Signup failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="w-full bg-[#FAF7F2] min-h-[calc(100vh-7rem)] flex flex-col justify-center py-16 px-6">
      <div className="max-w-lg w-full mx-auto">
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-full border border-[#B8935A]/60 bg-white flex items-center justify-center mx-auto mb-4 shadow-sm">
            <UserPlus className="h-5 w-5 text-[#5C1A32]" />
          </div>
          <span className="text-[10px] font-semibold tracking-[0.28em] text-[#5C1A32] uppercase block mb-1">
            BESPOKE REGISTRATION · JOJO FLORA
          </span>
          <h1 className="text-3xl sm:text-4xl text-[#1B1512] font-normal" style={serif}>
            Begin Your{' '}
            <span style={serifItalic} className="text-[#B8935A]">
              Journey
            </span>
          </h1>
          <p className="text-xs text-[#544B45] mt-1.5 font-light">
            Create an atelier account to save custom body profiles and orders
          </p>
        </div>

        <div className="bg-white border border-[#5C1A32]/15 p-8 sm:p-10 shadow-[0_20px_45px_-15px_rgba(27,21,18,0.15)]">
          {error && (
            <div className="mb-5 border border-[#5C1A32]/30 bg-[#5C1A32]/5 text-[#5C1A32] text-xs px-4 py-2.5">
              {error}
            </div>
          )}

          <form
            onSubmit={(e) => {
              void handleSubmit(e);
            }}
            className="space-y-4"
          >
            <div>
              <label className="block text-[11px] font-semibold tracking-wider text-[#1B1512] uppercase mb-1.5">
                Full Name / Username
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => {
                  setUsername(e.target.value);
                }}
                placeholder="e.g. Priya Sundaram"
                className="w-full px-4 py-2.5 bg-[#FAF7F2] border border-[#5C1A32]/20 text-sm text-[#1B1512] focus:outline-none focus:border-[#5C1A32] focus:bg-white transition-colors"
              />
            </div>

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
                className="w-full px-4 py-2.5 bg-[#FAF7F2] border border-[#5C1A32]/20 text-sm text-[#1B1512] focus:outline-none focus:border-[#5C1A32] focus:bg-white transition-colors"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold tracking-wider text-[#1B1512] uppercase mb-1.5">
                Gender Profile
              </label>
              <div className="flex gap-2">
                {['Female', 'Male', 'Other'].map((g) => (
                  <button
                    key={g}
                    type="button"
                    onClick={() => {
                      setGender(g);
                    }}
                    className={`flex-1 py-2 text-xs font-semibold uppercase tracking-wider border transition-colors ${
                      gender === g
                        ? 'bg-[#1B1512] border-[#1B1512] text-[#FAF7F2]'
                        : 'border-[#5C1A32]/20 text-[#544B45] hover:border-[#5C1A32]'
                    }`}
                  >
                    {g}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold tracking-wider text-[#1B1512] uppercase mb-1.5">
                10-Digit Mobile Number
              </label>
              <input
                type="tel"
                value={phoneNumber}
                onChange={(e) => {
                  setPhoneNumber(e.target.value.replace(/\D/g, '').slice(0, 10));
                }}
                placeholder="9876543210"
                className="w-full px-4 py-2.5 bg-[#FAF7F2] border border-[#5C1A32]/20 text-sm text-[#1B1512] focus:outline-none focus:border-[#5C1A32] focus:bg-white transition-colors"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                    className="w-full px-4 py-2.5 bg-[#FAF7F2] border border-[#5C1A32]/20 text-sm text-[#1B1512] focus:outline-none focus:border-[#5C1A32] focus:bg-white transition-colors pr-9"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setShowPassword((s) => !s);
                    }}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#544B45] hover:text-[#1B1512] p-1"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold tracking-wider text-[#1B1512] uppercase mb-1.5">
                  Confirm Password
                </label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                  }}
                  placeholder="••••••••"
                  className="w-full px-4 py-2.5 bg-[#FAF7F2] border border-[#5C1A32]/20 text-sm text-[#1B1512] focus:outline-none focus:border-[#5C1A32] focus:bg-white transition-colors"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-[#5C1A32] text-[#FAF7F2] text-xs font-semibold tracking-[0.2em] uppercase py-3.5 shadow-md hover:bg-[#451325] transition-all disabled:opacity-50 mt-3"
            >
              {submitting ? 'Creating Atelier Profile...' : 'Create Bespoke Account'}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-[#5C1A32]/10 text-center">
            <span className="text-xs text-[#544B45]">Already registered? </span>
            <Link
              to="/login"
              className="text-xs font-semibold text-[#5C1A32] hover:text-[#B8935A] uppercase tracking-wider ml-1"
            >
              Sign In to Account
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
