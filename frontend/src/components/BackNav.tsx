import { Link } from 'react-router'

interface BackNavProps {
  to: string
  label: string
}

export function BackNav({ to, label }: BackNavProps) {
  return (
    <Link to={to} className="inline-flex items-center gap-1 text-sm text-text-muted hover:text-text-primary transition-colors mb-4">
      <span aria-hidden="true">&#8592;</span>
      <span>{label}</span>
    </Link>
  )
}
