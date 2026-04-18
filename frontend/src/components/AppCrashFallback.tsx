export function AppCrashFallback() {
  return (
    <div className="min-h-screen bg-surface-primary flex flex-col items-center justify-center p-8">
      <h1 className="text-2xl font-semibold text-text-body mb-3">Something went wrong</h1>
      <p className="text-text-secondary mb-6 text-center max-w-md">
        An unexpected error occurred. Please reload the page to try again.
      </p>
      <button
        type="button"
        onClick={() => window.location.reload()}
        className="px-4 py-2 bg-surface-hover text-text-body rounded hover:bg-surface-secondary transition-colors"
      >
        Reload
      </button>
    </div>
  );
}
