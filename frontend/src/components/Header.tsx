import { useAuth } from '../context/AuthContext';

export function Header() {
  const { auth, signIn, signOut } = useAuth();

  return (
    <header className="border-b border-[#e4e2dc] bg-white">
      <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
        <a href="/communities" className="font-bold text-gray-900 text-sm">
          Focused Communities
        </a>
        <div>
          {auth.state === 'loading' && <></>}
          {auth.state === 'inform' && (
            <button
              type="button"
              onClick={() => signIn()}
              className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
            >
              Sign in
            </button>
          )}
          {(auth.state === 'connected' || auth.state === 'connected_no_compass') && (
            <div className="flex items-center gap-4 text-sm">
              <span className="text-gray-500">{auth.user.display_name}</span>
              <a
                href="https://app.empowered.vote/profile"
                className="text-[#03b9d2] hover:underline"
              >
                Your activity
              </a>
              <button
                type="button"
                onClick={signOut}
                className="text-gray-500 hover:text-gray-900 transition-colors"
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
