import { useAuth } from '../context/AuthContext';

// ---------------------------------------------------------------------------
// AuthGate
// ---------------------------------------------------------------------------

interface AuthGateProps {
  children: React.ReactNode;
  /** Verb describing the write action, e.g. "reply" or "start a thread" */
  action?: string;
}

/**
 * Wraps write-gated UI.
 *
 * - loading       → disabled placeholder (skeleton)
 * - inform        → disabled form with sign-in prompt (NOT hidden)
 * - connected_no_compass → renders children (calibration is NOT a write gate)
 * - connected     → renders children
 *
 * Suspension is detected at API call time, not here.
 * Use <SuspendedNotice /> when apiFetch returns 403 with reason === 'suspended'.
 */
export function AuthGate({ children, action = 'post' }: AuthGateProps) {
  const { auth, signIn } = useAuth();

  if (auth.state === 'loading') {
    return (
      <div
        aria-busy="true"
        aria-label="Loading…"
        style={{
          background: '#f0f0f0',
          borderRadius: 4,
          height: 96,
          opacity: 0.5,
        }}
      />
    );
  }

  if (auth.state === 'inform') {
    return (
      <div className="auth-gate auth-gate--inform">
        {/* Disabled form — visually present but non-interactive */}
        <textarea
          disabled
          placeholder={`Connect your account to ${action}`}
          style={{ width: '100%', resize: 'none', minHeight: 64 }}
        />
        <div className="auth-gate__prompt">
          <span>Connect your account to {action}. </span>
          <button
            type="button"
            onClick={() => signIn(window.location.href)}
            className="auth-gate__sign-in"
          >
            Sign in
          </button>
        </div>
        <button type="button" disabled style={{ marginTop: 8 }}>
          {action.charAt(0).toUpperCase() + action.slice(1)}
        </button>
      </div>
    );
  }

  // connected_no_compass and connected — both can write
  return <>{children}</>;
}

// ---------------------------------------------------------------------------
// SuspendedNotice
// ---------------------------------------------------------------------------

/**
 * Inline suspension notice — displayed when apiFetch returns 403 with
 * reason === 'suspended'. No redirect, no modal.
 * Suspension reason is intentionally NOT exposed.
 */
export function SuspendedNotice() {
  return (
    <p className="suspended-notice" role="alert">
      Your account is currently suspended and cannot post.
    </p>
  );
}
