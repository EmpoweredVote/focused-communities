import { useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { AuthContext, type AccessState, type AccountUser } from './auth';

// This file exports <AuthProvider> and nothing else on purpose. The context,
// its types and useAuth live in ./auth, because a module that exports a
// component alongside anything else loses fast refresh and reloads the whole
// page on every edit (react-refresh/only-export-components).

const ACCOUNTS_API_BASE = import.meta.env.VITE_ACCOUNTS_API_URL ?? 'https://accounts-api.empowered.vote';

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

// Must be mounted inside a QueryClientProvider, as it is in main.tsx: signing
// out has to be able to drop what the previous reader's requests brought back.
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [auth, setAuth] = useState<AccessState>({ state: 'loading' });
  const queryClient = useQueryClient();
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
    // Everything in the cache was fetched as the reader who is leaving, and
    // some of it — any claim body — carries their own ratings. The viewer key
    // already stops it being served back, so this is the second lock rather
    // than the only one: clear() drops the bodies themselves rather than
    // leaving them in memory under a key nobody asks for any more.
    queryClient.clear();
    setAuth({ state: 'inform' });
  }
  return (
    <AuthContext.Provider value={{ auth, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}
