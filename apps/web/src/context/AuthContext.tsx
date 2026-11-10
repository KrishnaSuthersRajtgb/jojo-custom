import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { authApi } from '../services';
import { authClient } from '../lib/authClient';

export interface SignupPayload {
  username: string;
  email: string;
  gender: string;
  phoneNumber: string;
  password: string;
  referralCode?: string | undefined;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface AuthUser {
  username: string;
  email: string;
  gender: string;
  phoneNumber: string;
  role?: string | undefined;
  emailVerified?: boolean | undefined;
  authProvider?: 'local' | 'google' | undefined;
  avatarUrl?: string | undefined;
  referralCode?: string | undefined;
  referredBy?: string | undefined;
  referralCount?: number | undefined;
  loyaltyCredits?: number | undefined;
}

export interface UpdateProfilePayload {
  username: string;
  email: string;
  gender: string;
  phoneNumber: string;
}

export interface SignupResult {
  requiresOtp: boolean;
  email: string;
  emailSent?: boolean | undefined;
  devOtp?: string | undefined;
  message?: string | undefined;
}

interface StoredUser extends AuthUser {
  password?: string;
}

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  signup: (payload: SignupPayload) => Promise<SignupResult>;
  verifySignupOtp: (email: string, otp: string) => Promise<void>;
  resendOtp: (
    email: string,
    type?: 'email-verification' | 'forget-password',
  ) => Promise<{ emailSent?: boolean | undefined; devOtp?: string | undefined; message: string }>;
  loginWithGoogleSession: () => Promise<void>;
  changePassword: (currentPassword: string | undefined, newPassword: string) => Promise<string>;
  login: (payload: LoginPayload) => Promise<void>;
  logout: () => void;
  updateProfile: (payload: UpdateProfilePayload) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const USERS_KEY = 'jojo_users';
const SESSION_KEY = 'jojo_session_user';

function safeJsonParse(raw: string | null): unknown {
  if (!raw) return null;
  return JSON.parse(raw) as unknown;
}

function toSafeUser(stored: StoredUser): AuthUser {
  const safe: AuthUser = {
    username: stored.username,
    email: stored.email,
    gender: stored.gender,
    phoneNumber: stored.phoneNumber,
  };
  if (stored.role) {
    safe.role = stored.role;
  }
  if (typeof stored.emailVerified === 'boolean') {
    safe.emailVerified = stored.emailVerified;
  }
  if (stored.authProvider) {
    safe.authProvider = stored.authProvider;
  }
  if (stored.avatarUrl) {
    safe.avatarUrl = stored.avatarUrl;
  }
  if (stored.referralCode) {
    safe.referralCode = stored.referralCode;
  }
  if (stored.referredBy) {
    safe.referredBy = stored.referredBy;
  }
  if (typeof stored.referralCount === 'number') {
    safe.referralCount = stored.referralCount;
  }
  if (typeof stored.loyaltyCredits === 'number') {
    safe.loyaltyCredits = stored.loyaltyCredits;
  }
  return safe;
}

function getStoredUsers(): StoredUser[] {
  return (safeJsonParse(localStorage.getItem(USERS_KEY)) as StoredUser[] | null) ?? [];
}

function saveStoredUsers(users: StoredUser[]) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedUser = safeJsonParse(localStorage.getItem(SESSION_KEY)) as AuthUser | null;
    if (storedUser) setUser(storedUser);
    setLoading(false);

    // Refresh profile from backend if session exists
    if (storedUser) {
      void authApi
        .getMe()
        .then((res) => {
          const freshUser: AuthUser = {
            username: res.data.username,
            email: res.data.email,
            gender: res.data.gender,
            phoneNumber: res.data.phoneNumber,
          };
          if (res.data.role) {
            freshUser.role = res.data.role;
          }
          if (typeof res.data.emailVerified === 'boolean') {
            freshUser.emailVerified = res.data.emailVerified;
          }
          if (res.data.authProvider) {
            freshUser.authProvider = res.data.authProvider;
          }
          if (res.data.avatarUrl) {
            freshUser.avatarUrl = res.data.avatarUrl;
          }
          const rawData = res.data as unknown as Record<string, unknown>;
          if (typeof rawData['referralCode'] === 'string') {
            freshUser.referralCode = rawData['referralCode'];
          }
          if (typeof rawData['referredBy'] === 'string') {
            freshUser.referredBy = rawData['referredBy'];
          }
          if (typeof rawData['referralCount'] === 'number') {
            freshUser.referralCount = rawData['referralCount'];
          }
          if (typeof rawData['loyaltyCredits'] === 'number') {
            freshUser.loyaltyCredits = rawData['loyaltyCredits'];
          }
          setUser(freshUser);
          localStorage.setItem(SESSION_KEY, JSON.stringify(freshUser));
        })
        .catch((err: unknown) => {
          const msg = err instanceof Error ? err.message.toLowerCase() : String(err).toLowerCase();
          // If the account was deleted or unauthorized on the server, clear the stale local session
          if (
            msg.includes('not found') ||
            msg.includes('unauthorized') ||
            msg.includes('authentication required')
          ) {
            authApi.logout();
            localStorage.removeItem(SESSION_KEY);
            setUser(null);
            void authClient.signOut().catch(() => {
              /* ignore */
            });
          }
        });
    }
  }, []);

  const signup = async (payload: SignupPayload): Promise<SignupResult> => {
    try {
      // 1. Call backend API (registers account & dispatches 6-digit Email OTP)
      const res = await authApi.signup(payload);
      // Also cache locally for offline support
      const users = getStoredUsers();
      if (!users.some((u) => u.username.toLowerCase() === payload.username.toLowerCase())) {
        users.push({ ...payload });
        saveStoredUsers(users);
      }
      return {
        requiresOtp: res.data.requiresOtp ?? true,
        email: res.data.email ?? payload.email.toLowerCase(),
        emailSent: res.data.emailSent,
        devOtp: res.data.devOtp,
        message: res.data.message,
      };
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      // If error is a validation or conflict error from backend, rethrow it directly
      if (
        !errorMsg.toLowerCase().includes('failed to fetch') &&
        !errorMsg.toLowerCase().includes('network')
      ) {
        throw new Error(errorMsg);
      }
    }

    // 2. Offline / local fallback
    const users = getStoredUsers();
    if (users.some((u) => u.username.toLowerCase() === payload.username.toLowerCase())) {
      throw new Error('Username is already taken.');
    }
    if (users.some((u) => u.email.toLowerCase() === payload.email.toLowerCase())) {
      throw new Error('An account with this email already exists.');
    }

    users.push({ ...payload });
    saveStoredUsers(users);
    return {
      requiresOtp: false,
      email: payload.email.toLowerCase(),
    };
  };

  const verifySignupOtp = async (email: string, otp: string) => {
    const res = await authApi.verifyOtp({ email, otp });
    const safeUser = toSafeUser(res.data.user);
    localStorage.setItem(SESSION_KEY, JSON.stringify(safeUser));
    setUser(safeUser);
  };

  const resendOtp = async (
    email: string,
    type: 'email-verification' | 'forget-password' = 'email-verification',
  ) => {
    const res = await authApi.resendOtp({ email, type });
    return res.data;
  };

  const loginWithGoogleSession = useCallback(async () => {
    const res = await authApi.getBetterSession();
    const safeUser = toSafeUser(res.data.user);
    localStorage.setItem(SESSION_KEY, JSON.stringify(safeUser));
    setUser(safeUser);
  }, []);

  const changePassword = async (currentPassword: string | undefined, newPassword: string) => {
    const payload = currentPassword ? { currentPassword, newPassword } : { newPassword };
    const res = await authApi.changePassword(payload);
    return res.data.message;
  };

  const login = async (payload: LoginPayload) => {
    try {
      // 1. Call backend API
      const res = await authApi.login(payload);
      const safeUser = toSafeUser(res.data.user);
      localStorage.setItem(SESSION_KEY, JSON.stringify(safeUser));
      setUser(safeUser);
      return;
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      // If server responded with 401 or invalid credentials, rethrow
      if (
        !errorMsg.toLowerCase().includes('failed to fetch') &&
        !errorMsg.toLowerCase().includes('network')
      ) {
        throw new Error(errorMsg);
      }
    }

    // 2. Offline / local fallback (with 5-attempt / 30-min lockout)
    const lockKey = `jojo_login_lock_${payload.email.trim().toLowerCase()}`;
    const lockRaw = localStorage.getItem(lockKey);
    let lockState: { attempts: number; lockUntil?: number } = { attempts: 0 };
    if (lockRaw) {
      try {
        lockState = JSON.parse(lockRaw) as { attempts: number; lockUntil?: number };
      } catch {
        lockState = { attempts: 0 };
      }
    }

    if (lockState.lockUntil && lockState.lockUntil > Date.now()) {
      const minsLeft = Math.max(1, Math.ceil((lockState.lockUntil - Date.now()) / 60000));
      throw new Error(
        `Account is locked after 5 failed login attempts. Please try again after ${String(minsLeft)} minute${minsLeft === 1 ? '' : 's'}.`,
      );
    }
    if (lockState.lockUntil && lockState.lockUntil <= Date.now()) {
      lockState = { attempts: 0 };
    }

    const users = getStoredUsers();
    const match = users.find(
      (u) =>
        u.email.toLowerCase() === payload.email.toLowerCase() && u.password === payload.password,
    );

    if (!match) {
      lockState.attempts += 1;
      if (lockState.attempts >= 5) {
        lockState.lockUntil = Date.now() + 30 * 60 * 1000;
        localStorage.setItem(lockKey, JSON.stringify(lockState));
        throw new Error(
          'Maximum 5 failed login attempts reached. Your account is locked for 30 minutes.',
        );
      }
      localStorage.setItem(lockKey, JSON.stringify(lockState));
      const remaining = 5 - lockState.attempts;
      throw new Error(
        `Invalid email or password. ${String(remaining)} attempt${remaining === 1 ? '' : 's'} remaining before 30-minute lockout.`,
      );
    }

    localStorage.removeItem(lockKey);
    const safeUser = toSafeUser(match);
    localStorage.setItem(SESSION_KEY, JSON.stringify(safeUser));
    setUser(safeUser);
  };

  const logout = () => {
    authApi.logout();
    localStorage.removeItem(SESSION_KEY);
    setUser(null);
    void authClient.signOut().catch(() => {
      /* ignore */
    });
  };

  const updateProfile = async (payload: UpdateProfilePayload) => {
    if (!user) throw new Error('You must be logged in to update your profile.');

    try {
      // 1. Call backend API
      const res = await authApi.updateProfile(payload);
      const safeUser = toSafeUser(res.data);
      localStorage.setItem(SESSION_KEY, JSON.stringify(safeUser));
      setUser(safeUser);
      return;
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      if (
        !errorMsg.toLowerCase().includes('failed to fetch') &&
        !errorMsg.toLowerCase().includes('network')
      ) {
        throw new Error(errorMsg);
      }
    }

    // 2. Offline / local fallback
    const users = getStoredUsers();
    const currentIndex = users.findIndex((u) => u.email.toLowerCase() === user.email.toLowerCase());
    const currentUser = users[currentIndex];
    if (currentIndex === -1 || !currentUser) throw new Error('Account not found.');

    const usernameTaken = users.some(
      (u, i) => i !== currentIndex && u.username.toLowerCase() === payload.username.toLowerCase(),
    );
    if (usernameTaken) throw new Error('Username is already taken.');

    const emailTaken = users.some(
      (u, i) => i !== currentIndex && u.email.toLowerCase() === payload.email.toLowerCase(),
    );
    if (emailTaken) throw new Error('An account with this email already exists.');

    const updated: StoredUser = { ...currentUser, ...payload };
    users[currentIndex] = updated;
    saveStoredUsers(users);

    const safeUser = toSafeUser(updated);
    localStorage.setItem(SESSION_KEY, JSON.stringify(safeUser));
    setUser(safeUser);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        signup,
        verifySignupOtp,
        resendOtp,
        loginWithGoogleSession,
        changePassword,
        login,
        logout,
        updateProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
