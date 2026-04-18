import { useState } from 'react'
import { CharCounter } from './CharCounter'

interface EditFormProps {
  initialValue: string
  onSave: (value: string) => void
  onCancel: () => void
  isPending: boolean
  maxLength?: number
  multiline?: boolean
}

export function EditForm({
  initialValue,
  onSave,
  onCancel,
  isPending,
  maxLength = 2000,
  multiline = true,
}: EditFormProps) {
  const [value, setValue] = useState(initialValue)
  const canSave =
    value.trim().length > 0 && value.trim() !== initialValue.trim() && !isPending

  return (
    <div className="mt-1">
      {multiline ? (
        <textarea
          value={value}
          onChange={e => setValue(e.target.value)}
          maxLength={maxLength}
          rows={4}
          className="w-full px-3 py-2 border border-border-medium rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ev-teal resize-none"
          autoFocus
        />
      ) : (
        <input
          type="text"
          value={value}
          onChange={e => setValue(e.target.value)}
          maxLength={maxLength}
          className="w-full px-3 py-2 border border-border-medium rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ev-teal"
          autoFocus
        />
      )}
      <CharCounter value={value} max={maxLength} />
      <div className="mt-2 flex justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          disabled={isPending}
          className="px-3 py-1.5 text-sm border border-border-medium rounded-lg hover:bg-surface-hover disabled:opacity-50 transition-colors"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={() => onSave(value.trim())}
          disabled={!canSave}
          className="px-3 py-1.5 bg-ev-coral text-white text-sm font-medium rounded-lg hover:bg-ev-coral-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
        >
          {isPending ? (
            <>
              <span className="inline-block w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Saving...
            </>
          ) : (
            'Save'
          )}
        </button>
      </div>
    </div>
  )
}
