import { createContext, useContext, useState, useEffect, type ReactNode } from "react";

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
}

export interface UpdateProfilePayload {
  username: string;
  email: string;
  gender: string;
  phoneNumber: string;
}

interface StoredUser extends AuthUser {
  password: string;
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

const USERS_KEY = "jojo_users";
const SESSION_KEY = "jojo_session_user";

// Small typed wrapper so JSON.parse's `any` never leaks past this point.
// Small typed wrapper so JSON.parse's `any` never leaks past this point.
function safeJsonParse(raw: string | null): unknown {
  if (!raw) return null;
  return JSON.parse(raw) as unknown;
}

function toSafeUser(stored: StoredUser): AuthUser {
  return {
    username: stored.username,
    email: stored.email,
    gender: stored.gender,
    phoneNumber: stored.phoneNumber,
  };
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
}, []);

  const signup = async (payload: SignupPayload) => {
    // No real async work yet (localStorage is synchronous) — this will
    // become a real API call later, so we keep the async signature.
    await Promise.resolve();

    const users = getStoredUsers();

    if (users.some((u) => u.username.toLowerCase() === payload.username.toLowerCase())) {
      throw new Error("Username is already taken.");
    }
    if (users.some((u) => u.email.toLowerCase() === payload.email.toLowerCase())) {
      throw new Error("An account with this email already exists.");
    }

    users.push({ ...payload });
    saveStoredUsers(users);
    // Signup does not auto-login — user is sent to the login page.
  };

  const login = async (payload: LoginPayload) => {
    await Promise.resolve();

    const users = getStoredUsers();
    const match = users.find(
      (u) =>
        u.email.toLowerCase() === payload.email.toLowerCase() &&
        u.password === payload.password
    );

    if (!match) {
      throw new Error("Invalid email or password.");
    }

    const safeUser = toSafeUser(match);
    localStorage.setItem(SESSION_KEY, JSON.stringify(safeUser));
    setUser(safeUser);
  };

  const logout = () => {
    localStorage.removeItem(SESSION_KEY);
    setUser(null);
  };

  const updateProfile = async (payload: UpdateProfilePayload) => {
    await Promise.resolve();

    if (!user) throw new Error("You must be logged in to update your profile.");

    const users = getStoredUsers();
    const currentIndex = users.findIndex(
      (u) => u.email.toLowerCase() === user.email.toLowerCase()
    );
    if (currentIndex === -1) throw new Error("Account not found.");

    // Block switching to a username/email already used by a different account.
    const usernameTaken = users.some(
      (u, i) =>
        i !== currentIndex && u.username.toLowerCase() === payload.username.toLowerCase()
    );
    if (usernameTaken) throw new Error("Username is already taken.");

    const emailTaken = users.some(
      (u, i) => i !== currentIndex && u.email.toLowerCase() === payload.email.toLowerCase()
    );
    if (emailTaken) throw new Error("An account with this email already exists.");

    const updated: StoredUser = { ...users[currentIndex], ...payload };
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
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}