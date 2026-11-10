import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { UserPlus, Eye, EyeOff, MailCheck, ShieldCheck } from 'lucide-react';
import SEOMeta from '../components/SEOMeta';
import GoogleSignInButton from '../components/GoogleSignInButton';
import { useAuth, type SignupPayload } from '../context/AuthContext';

// ── Design tokens (same family as Home.jsx) ────────────────────────────────
const serif = { fontFamily: "'Fraunces', Georgia, 'Times New Roman', serif" };
const serifItalic = { ...serif, fontStyle: 'italic' as const };

export default function SignupPage() {
  const navigate = useNavigate();
  const { signup, verifySignupOtp, resendOtp } = useAuth();

  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [gender, setGender] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [referralCode, setReferralCode] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Email OTP Verification Step State
  const [otpStep, setOtpStep] = useState(false);
  const [pendingEmail, setPendingEmail] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [otpMessage, setOtpMessage] = useState('');
  const [devOtpHint, setDevOtpHint] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setInterval(() => {
      setCooldown((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(t);
  }, [cooldown]);

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
      const payload: SignupPayload = {
        username,
        email,
        gender,
        phoneNumber,
        password,
      };
      if (referralCode.trim()) {
        payload.referralCode = referralCode.trim().toUpperCase();
      }
      const result = await signup(payload);
      if (result.requiresOtp) {
        setPendingEmail(result.email || email.trim().toLowerCase());
        setOtpMessage(
          result.message || `A 6-digit verification code has been sent to ${email.trim()}.`,
        );
        setDevOtpHint(result.devOtp ?? null);
        setCooldown(30);
        setOtpStep(true);
      } else {
        void navigate('/login', { replace: true, state: { justSignedUp: true } });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Signup failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleVerifyOtp = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    if (otpCode.trim().length !== 6) {
      setError('Please enter the 6-digit OTP code sent to your email.');
      return;
    }
    setSubmitting(true);
    try {
      await verifySignupOtp(pendingEmail, otpCode.trim());
      void navigate('/', { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'OTP verification failed.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleResendOtp = async () => {
    if (cooldown > 0 || !pendingEmail) return;
    setError('');
    setSubmitting(true);
    try {
      const res = await resendOtp(pendingEmail, 'email-verification');
      setOtpMessage(res.message);
      setDevOtpHint(res.devOtp ?? null);
      setCooldown(30);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to resend verification OTP.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="w-full bg-[#FAF7F2] min-h-[calc(100vh-7rem)] flex flex-col justify-center py-16 px-6">
      <SEOMeta
        title="Create Account | Customization Couture"
        description="Join the Customization atelier to commission bespoke outfits, track master tailoring, and save your measurements."
      />
      <div className="max-w-lg w-full mx-auto">
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-full border border-[#B8935A]/60 bg-white flex items-center justify-center mx-auto mb-4 shadow-sm">
            <UserPlus className="h-5 w-5 text-[#5C1A32]" />
          </div>
          <span className="text-[10px] font-semibold tracking-[0.28em] text-[#5C1A32] uppercase block mb-1">
            BESPOKE REGISTRATION · CUSTOMIZATION
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

          {otpStep ? (
            <form
              onSubmit={(e) => {
                void handleVerifyOtp(e);
              }}
              className="space-y-5"
            >
              <div className="rounded-sm bg-emerald-50 border border-emerald-200 p-4 text-xs text-emerald-900 space-y-1.5">
                <div className="flex items-center gap-2 font-semibold text-emerald-800">
                  <MailCheck className="h-4 w-4 text-emerald-600 shrink-0" />
                  <span>Verify Your Email Address</span>
                </div>
                <p className="text-emerald-800/90 leading-relaxed">{otpMessage}</p>
                {devOtpHint && (
                  <p className="text-[11px] bg-white border border-emerald-200 rounded px-2.5 py-1.5 font-mono text-emerald-900">
                    SMTP preview code (configure SMTP in apps/api/.env for live Gmail):{' '}
                    <strong>{devOtpHint}</strong>
                  </p>
                )}
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-[11px] font-semibold tracking-wider text-[#1B1512] uppercase">
                    6-Digit Verification OTP
                  </label>
                  <button
                    type="button"
                    onClick={() => void handleResendOtp()}
                    disabled={cooldown > 0 || submitting}
                    className="text-xs font-semibold text-[#5C1A32] hover:underline disabled:opacity-50 cursor-pointer"
                  >
                    {cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend OTP'}
                  </button>
                </div>
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  required
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="000000"
                  className="w-full px-4 py-3 bg-[#FAF7F2] border border-[#5C1A32]/25 text-center tracking-[0.45em] font-mono text-lg font-bold text-[#1B1512] focus:outline-none focus:border-[#5C1A32] focus:bg-white transition-colors"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full flex items-center justify-center gap-2 bg-[#5C1A32] text-[#FAF7F2] text-xs font-semibold tracking-[0.2em] uppercase py-3.5 shadow-md hover:bg-[#451325] transition-all disabled:opacity-50 cursor-pointer"
              >
                <ShieldCheck className="h-4 w-4" />
                <span>{submitting ? 'Verifying...' : 'Verify & Complete Signup'}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setOtpStep(false);
                  setError('');
                }}
                className="w-full text-xs text-[#544B45] hover:text-[#1B1512] underline cursor-pointer"
              >
                Edit registration details
              </button>
            </form>
          ) : (
            <>
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
                        {showPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
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

                <div>
                  <label className="block text-[11px] font-semibold tracking-wider text-[#1B1512] uppercase mb-1.5">
                    Referral Code{' '}
                    <span className="text-[#8A7968] font-normal lowercase">
                      (optional — earn ₹200 on first order)
                    </span>
                  </label>
                  <input
                    type="text"
                    value={referralCode}
                    onChange={(e) => {
                      setReferralCode(e.target.value.toUpperCase());
                    }}
                    placeholder="e.g. JOJO-SARAH-4912"
                    className="w-full px-4 py-2.5 bg-[#FAF7F2] border border-[#5C1A32]/20 text-sm text-[#1B1512] focus:outline-none focus:border-[#5C1A32] focus:bg-white transition-colors uppercase tracking-wider"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full bg-[#5C1A32] text-[#FAF7F2] text-xs font-semibold tracking-[0.2em] uppercase py-3.5 shadow-md hover:bg-[#451325] transition-all disabled:opacity-50 mt-3 cursor-pointer"
                >
                  {submitting ? 'Sending Verification OTP...' : 'Create Bespoke Account'}
                </button>
              </form>

              <div className="my-6 flex items-center gap-3">
                <span className="flex-1 h-px bg-[#5C1A32]/15" />
                <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#8A7968]">
                  Or
                </span>
                <span className="flex-1 h-px bg-[#5C1A32]/15" />
              </div>

              <GoogleSignInButton label="Continue with Google" />
            </>
          )}

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
