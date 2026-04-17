export function AppCrashFallback() {
  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center p-8">
      <h1 className="text-2xl font-semibold text-gray-800 mb-3">Something went wrong</h1>
      <p className="text-gray-600 mb-6 text-center max-w-md">
        An unexpected error occurred. Please reload the page to try again.
      </p>
      <button
        type="button"
        onClick={() => window.location.reload()}
        className="px-4 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
      >
        Reload
      </button>
    </div>
  );
}
