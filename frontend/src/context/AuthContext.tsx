import { createContext, useContext, useEffect, useState } from 'react';

const ACCOUNTS_API_BASE = import.meta.env.VITE_ACCOUNTS_API_URL ?? 'https://accounts-api.empowered.vote';

export interface AccountUser {
  id: string;
  tier: 'inform' | 'connected' | 'empowered';
  account_standing: 'active' | 'suspended';
  completed_onboarding: boolean;
  display_name: string;
}

export type AccessState =
  | { state: 'loading' }
  | { state: 'inform' }
  | { state: 'connected_no_compass'; user: AccountUser }
  | { state: 'connected'; user: AccountUser };

async function detectUserState(): Promise<AccessState> {
  const token = localStorage.getItem('ev_token');
  if (!token) return { state: 'inform' };
  try {
    const response = await fetch(`${ACCOUNTS_API_BASE}/api/account/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (response.status === 401) {
      localStorage.removeItem('ev_token');
      return { state: 'inform' };
    }
    const user: AccountUser = await response.json();
    if (user.tier === 'inform') return { state: 'inform' };
    if (!user.completed_onboarding) return { state: 'connected_no_compass', user };
    return { state: 'connected', user };
  } catch {
    return { state: 'inform' };
  }
}

interface AuthContextValue {
  auth: AccessState;
  signIn: (redirectBack?: string) => void;
  signOut: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [auth, setAuth] = useState<AccessState>({ state: 'loading' });
  useEffect(() => {
    const hashParams = new URLSearchParams(window.location.hash.slice(1));
    const token = hashParams.get('access_token');
    if (token) {
      localStorage.setItem('ev_token', token);
      window.history.replaceState({}, '', window.location.pathname + window.location.search);
    }
    detectUserState().then(setAuth);

    // When sign-in completes in a new tab, it writes ev_token to localStorage.
    // Listen for that change so this tab re-authenticates automatically.
    function handleStorage(e: StorageEvent) {
      if (e.key === 'ev_token') {
        detectUserState().then(setAuth);
      }
    }
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);
  function signIn(redirectBack?: string) {
    const redirect = encodeURIComponent(redirectBack ?? window.location.href);
    window.location.href = `https://accounts.empowered.vote/login?redirect=${redirect}`;
  }
  function signOut() {
    localStorage.removeItem('ev_token');
    setAuth({ state: 'inform' });
  }
  return (
    <AuthContext.Provider value={{ auth, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
