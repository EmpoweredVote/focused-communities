import { Link } from 'react-router'

export function NotFoundPage() {
  return (
    <main className="p-6 text-center">
      <h1 className="text-2xl font-semibold text-text-body">Page not found</h1>
      <p className="text-text-muted mt-2 mb-4">The page you were looking for doesn't exist.</p>
      <Link to="/communities" className="text-ev-teal-light hover:text-ev-teal underline">
        Back to Communities
      </Link>
    </main>
  )
}
