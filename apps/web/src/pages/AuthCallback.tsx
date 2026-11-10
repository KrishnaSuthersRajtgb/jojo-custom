import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const serif = { fontFamily: "'Fraunces', Georgia, 'Times New Roman', serif" };

export default function AuthCallback() {
  const { user, loginWithGoogleSession } = useAuth();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [errorMsg, setErrorMsg] = useState('');
  const initiatedRef = useRef(false);

  useEffect(() => {
    if (user) {
      void navigate('/', { replace: true });
    }
  }, [user, navigate]);

  useEffect(() => {
    if (initiatedRef.current || user) return;
    initiatedRef.current = true;

    void loginWithGoogleSession()
      .then(() => {
        setStatus('success');
        setTimeout(() => {
          void navigate('/', { replace: true });
        }, 350);
      })
      .catch((err: unknown) => {
        setStatus('error');
        setErrorMsg(err instanceof Error ? err.message : 'Google authentication failed.');
      });
  }, [loginWithGoogleSession, navigate, user]);

  return (
    <div className="min-h-[75vh] bg-[#FAF7F2] flex items-center justify-center px-6">
      <div className="max-w-md w-full bg-white rounded-sm border border-[#5C1A32]/15 p-8 shadow-sm text-center space-y-4">
        {status === 'loading' && (
          <>
            <div className="w-10 h-10 border-2 border-[#5C1A32] border-t-transparent rounded-full animate-spin mx-auto" />
            <h1 className="text-xl text-[#1B1512]" style={serif}>
              Completing Sign-In
            </h1>
            <p className="text-xs text-[#4A413B]">
              Verifying your Google credentials with Customization Atelier...
            </p>
          </>
        )}

        {status === 'success' && (
          <>
            <CheckCircle2 className="h-10 w-10 text-emerald-600 mx-auto" />
            <h1 className="text-xl text-[#1B1512]" style={serif}>
              Welcome to Customization
            </h1>
            <p className="text-xs text-[#4A413B]">
              Signed in successfully. Redirecting to the atelier...
            </p>
          </>
        )}

        {status === 'error' && (
          <>
            <AlertCircle className="h-10 w-10 text-rose-600 mx-auto" />
            <h1 className="text-xl text-[#1B1512]" style={serif}>
              Sign-In Could Not Complete
            </h1>
            <p className="text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded p-3">
              {errorMsg}
            </p>
            <button
              type="button"
              onClick={() => void navigate('/login')}
              className="w-full py-2.5 bg-[#1B1512] hover:bg-[#5C1A32] text-[#F6F1E7] text-xs font-semibold uppercase tracking-wider rounded-sm transition-colors cursor-pointer"
            >
              Return to Login
            </button>
          </>
        )}
      </div>
    </div>
  );
}
