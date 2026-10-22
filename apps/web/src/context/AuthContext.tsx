import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { authApi } from '../services';

export interface SignupPayload {
  username: string;
  email: string;
  gender: string;
  phoneNumber: string;
  password: string;
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
  role?: string;
}

export interface UpdateProfilePayload {
  username: string;
  email: string;
  gender: string;
  phoneNumber: string;
}

interface StoredUser extends AuthUser {
  password?: string;
}

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  signup: (payload: SignupPayload) => Promise<void>;
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
          setUser(freshUser);
          localStorage.setItem(SESSION_KEY, JSON.stringify(freshUser));
        })
        .catch(() => {
          // If network error, retain local session user
        });
    }
  }, []);

  const signup = async (payload: SignupPayload) => {
    try {
      // 1. Call backend API
      await authApi.signup(payload);
      // Also cache locally for offline support
      const users = getStoredUsers();
      if (!users.some((u) => u.username.toLowerCase() === payload.username.toLowerCase())) {
        users.push({ ...payload });
        saveStoredUsers(users);
      }
      return;
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

    // 2. Offline / local fallback
    const users = getStoredUsers();
    const match = users.find(
      (u) =>
        u.email.toLowerCase() === payload.email.toLowerCase() && u.password === payload.password,
    );

    if (!match) {
      throw new Error('Invalid email or password.');
    }

    const safeUser = toSafeUser(match);
    localStorage.setItem(SESSION_KEY, JSON.stringify(safeUser));
    setUser(safeUser);
  };

  const logout = () => {
    authApi.logout();
    localStorage.removeItem(SESSION_KEY);
    setUser(null);
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
    <AuthContext.Provider value={{ user, loading, signup, login, logout, updateProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
