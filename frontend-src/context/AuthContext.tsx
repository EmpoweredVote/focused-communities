import { createContext, useContext, useEffect, useState } from 'react';

const ACCOUNTS_API_BASE =
  (import.meta as unknown as { env: Record<string, string> }).env
    .VITE_ACCOUNTS_API_URL ?? 'https://accounts.empowered.vote';

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

async function detectUserState(): Promise<AccessState> {
  const token = localStorage.getItem('ev_token');

  if (!token) {
    return { state: 'inform' };
  }

  try {
    const response = await fetch(`${ACCOUNTS_API_BASE}/api/account/me`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (response.status === 401) {
      localStorage.removeItem('ev_token');
      return { state: 'inform' };
    }

    const user: AccountUser = await response.json();

    if (user.tier === 'inform') {
      return { state: 'inform' };
    }

    if (!user.completed_onboarding) {
      return { state: 'connected_no_compass', user };
    }

    return { state: 'connected', user };
  } catch {
    // Network error — treat as unauthenticated
    return { state: 'inform' };
  }
}

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

interface AuthContextValue {
  auth: AccessState;
  signIn: (redirectBack?: string) => void;
  signOut: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [auth, setAuth] = useState<AccessState>({ state: 'loading' });

  useEffect(() => {
    // Extract token from URL hash (Auth Hub redirect delivers it here)
    const hashParams = new URLSearchParams(window.location.hash.slice(1));
    const token = hashParams.get('access_token');

    if (token) {
      localStorage.setItem('ev_token', token);
      // Remove the hash without adding a history entry
      window.history.replaceState(
        {},
        '',
        window.location.pathname + window.location.search
      );
    }

    detectUserState().then(setAuth);
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

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used inside <AuthProvider>');
  }
  return ctx;
}
