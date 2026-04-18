import { useAuth } from '../context/AuthContext';

interface AuthGateProps {
  children: React.ReactNode;
  action?: string;
}

export function AuthGate({ children, action = 'post' }: AuthGateProps) {
  const { auth } = useAuth();

  if (auth.state === 'loading') {
    return (
      <div aria-busy="true" aria-label="Loading..." className="bg-surface-hover rounded h-24 opacity-50 animate-pulse" />
    );
  }

  if (auth.state === 'inform') {
    const signInUrl = `${import.meta.env.VITE_ACCOUNTS_API_URL ?? 'https://accounts.empowered.vote'}/login?redirect=${encodeURIComponent(window.location.href)}`;
    return (
      <div className="border border-border-light rounded-lg p-4">
        <textarea
          disabled
          placeholder={`Connect your account to ${action}`}
          className="w-full resize-none min-h-16 bg-surface-hover text-text-muted border border-border-light rounded p-2 cursor-not-allowed"
        />
        <div className="mt-2 text-sm text-text-muted">
          <span>Connect your account to {action}. </span>
          <button
            type="button"
            onClick={() => window.open(signInUrl, '_blank')}
            className="text-ev-teal-light hover:text-ev-teal underline cursor-pointer bg-transparent border-none p-0"
          >
            Sign in
          </button>
        </div>
        <button type="button" disabled className="mt-2 px-4 py-2 bg-surface-hover text-text-muted rounded cursor-not-allowed">
          {action.charAt(0).toUpperCase() + action.slice(1)}
        </button>
      </div>
    );
  }

  return <>{children}</>;
}

export function SuspendedNotice() {
  return (
    <p className="text-red-600 text-sm mt-2" role="alert">
      Your account is currently suspended and cannot post.
    </p>
  );
}
