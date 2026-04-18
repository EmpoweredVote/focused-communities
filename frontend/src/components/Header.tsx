import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

export function Header() {
  const { auth, signIn, signOut } = useAuth();

  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window === 'undefined') return false
    return localStorage.getItem('fc-theme') === 'dark' ||
      (!localStorage.getItem('fc-theme') && window.matchMedia('(prefers-color-scheme: dark)').matches)
  })

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode)
    localStorage.setItem('fc-theme', darkMode ? 'dark' : 'light')
  }, [darkMode])

  return (
    <header className="border-b border-border-light bg-surface-primary">
      <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
        <a href="/communities" className="font-bold text-ev-teal text-sm">
          Focused Communities
        </a>
        <div className="flex items-center gap-3">
          {/* Dark mode toggle */}
          <button
            type="button"
            onClick={() => setDarkMode(d => !d)}
            className="p-1.5 rounded-md text-text-muted hover:text-text-primary hover:bg-surface-hover transition-colors"
            aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {darkMode ? (
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                <path d="M10 2a.75.75 0 0 1 .75.75v1.5a.75.75 0 0 1-1.5 0v-1.5A.75.75 0 0 1 10 2ZM10 15a.75.75 0 0 1 .75.75v1.5a.75.75 0 0 1-1.5 0v-1.5A.75.75 0 0 1 10 15ZM10 7a3 3 0 1 0 0 6 3 3 0 0 0 0-6ZM15.657 5.404a.75.75 0 1 0-1.06-1.06l-1.061 1.06a.75.75 0 0 0 1.06 1.06l1.061-1.06ZM6.464 14.596a.75.75 0 1 0-1.06-1.06l-1.061 1.06a.75.75 0 0 0 1.06 1.06l1.06-1.06ZM18 10a.75.75 0 0 1-.75.75h-1.5a.75.75 0 0 1 0-1.5h1.5A.75.75 0 0 1 18 10ZM5 10a.75.75 0 0 1-.75.75h-1.5a.75.75 0 0 1 0-1.5h1.5A.75.75 0 0 1 5 10ZM14.596 15.657a.75.75 0 0 0 1.06-1.06l-1.06-1.061a.75.75 0 1 0-1.06 1.06l1.06 1.061ZM5.404 6.464a.75.75 0 0 0 1.06-1.06l-1.06-1.061a.75.75 0 1 0-1.06 1.06l1.06 1.061Z" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                <path fillRule="evenodd" d="M7.455 2.004a.75.75 0 0 1 .26.77 7 7 0 0 0 9.958 7.967.75.75 0 0 1 1.067.853A8.5 8.5 0 1 1 6.647 1.921a.75.75 0 0 1 .808.083Z" clipRule="evenodd" />
              </svg>
            )}
          </button>

          {/* Auth controls */}
          {auth.state === 'loading' && <></>}
          {auth.state === 'inform' && (
            <button
              type="button"
              onClick={() => signIn()}
              className="text-sm text-text-muted hover:text-text-primary transition-colors"
            >
              Sign in
            </button>
          )}
          {(auth.state === 'connected' || auth.state === 'connected_no_compass') && (
            <div className="flex items-center gap-4 text-sm">
              <span className="text-text-muted">{auth.user.display_name}</span>
              <a
                href="https://app.empowered.vote/profile"
                className="text-ev-teal-light hover:text-ev-teal transition-colors"
              >
                Your activity
              </a>
              <button
                type="button"
                onClick={signOut}
                className="text-text-muted hover:text-text-primary transition-colors"
              >
                Sign out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
