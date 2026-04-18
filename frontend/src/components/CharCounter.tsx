interface CharCounterProps {
  value: string
  max: number
}

export function CharCounter({ value, max }: CharCounterProps) {
  if (value.length === 0) return null
  const nearLimit = value.length >= max * 0.9
  return (
    <div className={`text-right text-sm mt-1 ${nearLimit ? 'text-red-500 font-medium' : 'text-text-muted'}`}>
      {value.length}/{max}
    </div>
  )
}
