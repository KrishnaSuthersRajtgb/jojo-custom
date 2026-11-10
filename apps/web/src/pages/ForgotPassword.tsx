import { useState, useEffect, type SyntheticEvent } from 'react';
import { Link } from 'react-router-dom';
import { Eye, EyeOff, MailCheck, KeyRound, CheckCircle2, ArrowLeft } from 'lucide-react';
import SEOMeta from '../components/SEOMeta';
import { authApi } from '../services/api';

const serif = { fontFamily: "'Fraunces', Georgia, 'Times New Roman', serif" };

export default function ForgotPassword() {
  const [step, setStep] = useState<'request' | 'reset' | 'done'>('request');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPass, setShowPass] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [infoMessage, setInfoMessage] = useState('');
  const [devOtpHint, setDevOtpHint] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setInterval(() => {
      setCooldown((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(t);
  }, [cooldown]);

  const handleRequestOtp = async (e: SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setInfoMessage('');
    setLoading(true);
    try {
      const res = await authApi.forgotPassword(email.trim());
      setInfoMessage(res.data.message);
      setDevOtpHint(res.data.devOtp ?? null);
      setCooldown(30);
      setStep('reset');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Unable to send password reset code.');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (cooldown > 0) return;
    setError('');
    setLoading(true);
    try {
      const res = await authApi.resendOtp({ email: email.trim(), type: 'forget-password' });
      setInfoMessage(res.data.message);
      setDevOtpHint(res.data.devOtp ?? null);
      setCooldown(30);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to resend verification code.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');

    if (otp.trim().length !== 6) {
      setError('Please enter the 6-digit verification code.');
      return;
    }
    if (newPassword.length < 6) {
      setError('New password must be at least 6 characters long.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      await authApi.resetPassword({
        email: email.trim(),
        otp: otp.trim(),
        newPassword,
      });
      setStep('done');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Unable to reset password.');
    } finally {
      setLoading(false);
    }
  };

  const fieldCls =
    'w-full rounded-sm border border-[#5C1A32]/20 bg-white px-3.5 py-2.5 text-sm text-[#1B1512] placeholder-[#4A413B]/45 focus:outline-none focus:ring-2 focus:ring-[#5C1A32]/40 focus:border-[#5C1A32]';

  return (
    <div className="min-h-[82vh] bg-[#FAF7F2] px-6 py-14 flex items-center justify-center">
      <SEOMeta
        title="Forgot Password | Customization Couture Atelier"
        description="Reset your Customization patron account password securely with Email OTP."
      />
      <div className="max-w-md w-full mx-auto">
        <div className="bg-white rounded-sm border border-[#5C1A32]/12 p-8 sm:p-10 shadow-sm">
          <Link
            to="/login"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-[#5C1A32] hover:underline mb-5"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Back to Sign In</span>
          </Link>

          <span className="text-[11px] font-semibold tracking-[0.22em] text-[#B8935A] uppercase block mb-2">
            ACCOUNT RECOVERY · CUSTOMIZATION
          </span>
          <h1 className="text-3xl text-[#1B1512] font-normal mb-1.5" style={serif}>
            {step === 'request'
              ? 'Forgot Password'
              : step === 'reset'
                ? 'Verify & Reset'
                : 'Password Updated'}
          </h1>
          <p className="text-sm text-[#4A413B] mb-6">
            {step === 'request'
              ? 'Enter your registered email address to receive a 6-digit verification code.'
              : step === 'reset'
                ? `Enter the 6-digit OTP sent to ${email} and choose a new password.`
                : 'Your Customization account password has been reset securely.'}
          </p>

          {error && (
            <div className="mb-5 rounded-sm bg-rose-50 border border-rose-200 px-3.5 py-2.5 text-xs text-rose-800">
              {error}
            </div>
          )}

          {infoMessage && step !== 'done' && (
            <div className="mb-5 rounded-sm bg-emerald-50 border border-emerald-200 px-3.5 py-2.5 text-xs text-emerald-800 space-y-1">
              <p className="font-medium flex items-center gap-1.5">
                <MailCheck className="h-4 w-4 text-emerald-600 shrink-0" />
                <span>{infoMessage}</span>
              </p>
              {devOtpHint && (
                <p className="text-[11px] text-emerald-900 bg-white/80 border border-emerald-200 rounded px-2 py-1 mt-1 font-mono">
                  SMTP preview code (configure SMTP in .env to send via Gmail):{' '}
                  <strong>{devOtpHint}</strong>
                </p>
              )}
            </div>
          )}

          {step === 'request' && (
            <form onSubmit={(e) => void handleRequestOtp(e)} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#2A211D] uppercase tracking-wider mb-1.5">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={fieldCls}
                  placeholder="patron@example.com"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-sm bg-[#1B1512] hover:bg-[#5C1A32] text-[#F6F1E7] font-semibold py-3 px-6 transition-colors cursor-pointer disabled:opacity-60"
              >
                {loading ? 'Sending Verification Code...' : 'Send Reset OTP'}
              </button>
            </form>
          )}

          {step === 'reset' && (
            <form onSubmit={(e) => void handleResetPassword(e)} className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-[#2A211D] uppercase tracking-wider">
                    6-Digit Email OTP
                  </label>
                  <button
                    type="button"
                    onClick={() => void handleResend()}
                    disabled={cooldown > 0 || loading}
                    className="text-xs font-semibold text-[#5C1A32] hover:underline disabled:opacity-50 cursor-pointer"
                  >
                    {cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend Code'}
                  </button>
                </div>
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  required
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  className={`${fieldCls} text-center tracking-[0.4em] font-mono text-base font-bold`}
                  placeholder="000000"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#2A211D] uppercase tracking-wider mb-1.5">
                  New Password
                </label>
                <div className="relative">
                  <input
                    type={showPass ? 'text' : 'password'}
                    required
                    minLength={6}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className={`${fieldCls} pr-10`}
                    placeholder="At least 6 characters"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass((v) => !v)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-[#4A413B]/60 hover:text-[#1B1512]"
                    aria-label={showPass ? 'Hide password' : 'Show password'}
                  >
                    {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#2A211D] uppercase tracking-wider mb-1.5">
                  Confirm New Password
                </label>
                <input
                  type={showPass ? 'text' : 'password'}
                  required
                  minLength={6}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className={fieldCls}
                  placeholder="Re-enter new password"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 rounded-sm bg-[#5C1A32] hover:bg-[#431224] text-white font-semibold py-3 px-6 transition-colors cursor-pointer disabled:opacity-60"
              >
                <KeyRound className="h-4 w-4" />
                <span>{loading ? 'Updating Password...' : 'Reset Password'}</span>
              </button>
            </form>
          )}

          {step === 'done' && (
            <div className="text-center space-y-5 py-2">
              <div className="w-14 h-14 bg-emerald-50 border border-emerald-200 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle2 className="h-8 w-8 text-emerald-600" />
              </div>
              <p className="text-sm text-[#4A413B]">
                Your password has been updated. Sign in now with your new credentials.
              </p>
              <Link
                to="/login"
                className="block w-full rounded-sm bg-[#1B1512] hover:bg-[#5C1A32] text-[#F6F1E7] font-semibold py-3 px-6 transition-colors text-sm"
              >
                Continue to Sign In
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
