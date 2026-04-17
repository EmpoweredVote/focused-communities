import { Link } from 'react-router'

interface BackNavProps {
  to: string
  label: string
}

export function BackNav({ to, label }: BackNavProps) {
  return (
    <Link to={to} className="inline-flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900 transition-colors mb-4">
      <span aria-hidden="true">&#8592;</span>
      <span>{label}</span>
    </Link>
  )
}
