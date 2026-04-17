import { Link } from 'react-router'

export function NotFoundPage() {
  return (
    <main className="p-6 text-center">
      <h1 className="text-2xl font-semibold text-gray-800">Page not found</h1>
      <p className="text-gray-500 mt-2 mb-4">The page you were looking for doesn't exist.</p>
      <Link to="/communities" className="text-blue-600 hover:text-blue-800 underline">
        Back to Communities
      </Link>
    </main>
  )
}
