import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../hooks/useTheme';

/**
 * The site header, laid out the way Civic Spaces lays out its own
 * (civicspaces.empowered.vote): the Empowered Vote logo on the left, the
 * product's mark and two-tone wordmark in the centre, and the theme toggle and
 * profile button on the right. The toggle and profile icons are the same
 * Feather-style strokes Civic Spaces uses, so the suite reads as one product.
 */
export function Header() {
  const { isDark, toggle } = useTheme();

  return (
    <header className="sticky top-0 z-40 flex md:grid md:grid-cols-[1fr_auto_1fr] items-center justify-between gap-3 md:gap-6 h-16 md:h-20 px-4 md:px-8 border-b border-border-light bg-surface-primary">
      {/* Left: Empowered Vote */}
      <div className="flex items-center gap-2 sm:gap-4 min-w-0">
        <a href="https://empowered.vote" className="hidden sm:flex flex-shrink-0 items-center">
          <img
            src={isDark ? '/images/ev-logo-dark-bg.png' : '/images/ev-logo.png'}
            alt="Empowered Vote"
            className="h-9 w-auto"
          />
        </a>
      </div>

      {/* Centre: Focused Communities */}
      <Link
        to="/"
        className="flex flex-1 md:flex-none items-center gap-2 min-w-0 md:justify-center text-lg md:text-xl font-extrabold tracking-tight whitespace-nowrap"
      >
        <FocusedCommunitiesMark className="h-10 w-10 md:h-12 md:w-12 flex-shrink-0" />
        <span className="sr-only min-[430px]:not-sr-only">
          <span className="text-ev-teal dark:text-ev-teal-light">Focused</span>{' '}
          <span className="text-ev-coral-text dark:text-ev-coral">Communities</span>
        </span>
      </Link>

      {/* Right: theme toggle, profile */}
      <div className="flex items-center justify-end gap-0.5 sm:gap-2 flex-shrink-0">
        <ThemeToggle isDark={isDark} onToggle={toggle} />
        <ProfileMenu />
      </div>
    </header>
  );
}

/**
 * The Focused Communities mark: an arrow that has landed in a target. It is
 * the product in one picture: a community that narrows one issue down to the
 * shared facts at its centre, rather than spreading across everything.
 *
 * Drawn on a 32×32 grid, framed by a viewBox whose vertical middle is the
 * target's centre (y 18.5), so the target lines up with the wordmark beside
 * it instead of sitting low under the arrow's tail. Every colour
 * is a theme token, so it follows light and dark mode: the target is brand
 * teal (sky blue in dark) and the whole arrow is plain brand yellow, with no
 * outline. The gap ring uses the header's own surface colour so it reads as a
 * cut-out on either background.
 */
function FocusedCommunitiesMark({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="-1.5 1 35 35" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" className={className}>
      <circle cx="13.5" cy="18.5" r="12" className="fill-ev-teal dark:fill-ev-teal-light" />
      <circle cx="13.5" cy="18.5" r="8.5" className="fill-surface-primary" />
      <circle cx="13.5" cy="18.5" r="5.5" className="fill-ev-teal dark:fill-ev-teal-light" />
      <path d="M14 18 L28 4" strokeWidth="2" strokeLinecap="round" className="stroke-ev-yellow" />
      <path d="M23.5 5 V8.5 H27" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="stroke-ev-yellow" />
      <path d="M26.5 2 V5.5 H30" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="stroke-ev-yellow" />
    </svg>
  );
}

function ThemeToggle({ isDark, onToggle }: { isDark: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      className="w-9 h-9 flex items-center justify-center rounded-full text-text-secondary hover:text-text-body hover:bg-surface-hover transition-colors"
    >
      {isDark ? (
        <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true">
          <circle cx="12" cy="12" r="5" />
          <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
        </svg>
      ) : (
        <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true">
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
        </svg>
      )}
    </button>
  );
}

function ProfileMenu() {
  const { auth, signIn, signOut } = useAuth();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const signedIn = auth.state === 'connected' || auth.state === 'connected_no_compass';

  useEffect(() => {
    if (!open) return;
    function onDown(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const itemClass =
    'w-full flex items-center gap-3 px-4 py-3 text-sm text-text-body hover:bg-surface-hover transition-colors text-left';

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label={signedIn ? 'Profile menu' : 'Account'}
        aria-expanded={open}
        className="w-9 h-9 flex items-center justify-center rounded-full border-2 border-ev-teal dark:border-ev-teal-light text-ev-teal dark:text-ev-teal-light hover:bg-surface-hover transition-colors"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} aria-hidden="true">
          <circle cx="12" cy="8" r="4" />
          <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
        </svg>
      </button>

      {open && auth.state !== 'loading' && (
        <div className="absolute right-0 top-12 z-50 w-56 rounded-xl border border-border-light bg-surface-card shadow-lg py-1">
          {signedIn ? (
            <>
              <div className="px-4 py-2 text-xs text-text-muted truncate">{auth.user.display_name}</div>
              <a
                href="https://accounts.empowered.vote/profile"
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setOpen(false)}
                className={itemClass}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <span>Account Settings</span>
              </a>
              <button
                type="button"
                onClick={() => {
                  setOpen(false);
                  signOut();
                }}
                className={itemClass}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" />
                </svg>
                <span>Sign out</span>
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                signIn();
              }}
              className={itemClass}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 3h4a2 2 0 012 2v14a2 2 0 01-2 2h-4M10 17l5-5-5-5M15 12H3" />
              </svg>
              <span>Log in</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
}
