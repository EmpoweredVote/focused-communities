import { Link } from 'react-router'

interface BackNavProps {
  to: string
  label: string
}

// Styled as the app's other text links (the link colour, text-sm, medium
// weight) and with the same arrow as the directory's "Back to all topics".
export function BackNav({ to, label }: BackNavProps) {
  return (
    <Link
      to={to}
      className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-link transition-colors hover:text-link-hover focus:outline-none focus-visible:underline"
    >
      <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4" aria-hidden="true">
        <path
          fillRule="evenodd"
          d="M17 10a.75.75 0 0 1-.75.75H5.612l4.158 3.96a.75.75 0 1 1-1.04 1.08l-5.5-5.25a.75.75 0 0 1 0-1.08l5.5-5.25a.75.75 0 1 1 1.04 1.08L5.612 9.25H16.25A.75.75 0 0 1 17 10Z"
          clipRule="evenodd"
        />
      </svg>
      <span>{label}</span>
    </Link>
  )
}
