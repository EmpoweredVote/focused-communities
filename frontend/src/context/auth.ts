import { createContext, useContext } from 'react';

// The context, its types and the hook live apart from <AuthProvider> because a
// module that exports a component must export nothing else, or Vite's fast
// refresh falls back to a full page reload on every edit
// (react-refresh/only-export-components). AuthContext.tsx holds the component;
// this file holds everything else.
//
// Deliberately not named authContext.ts: Windows resolves paths without regard
// to case, so `./authContext` would also match AuthContext.tsx.

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

export interface AuthContextValue {
  auth: AccessState;
  signIn: (redirectBack?: string) => void;
  signOut: () => void;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
