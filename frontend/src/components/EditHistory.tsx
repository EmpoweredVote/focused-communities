import type { ThreadEdit, PostEdit } from '../types'
import { formatRelativeTime } from '../lib/formatTime'

interface EditHistoryProps {
  edits: (ThreadEdit | PostEdit)[]
  isLoading: boolean
  onToggle: () => void
  isOpen: boolean
}

export function EditHistory({ edits, isLoading, onToggle, isOpen }: EditHistoryProps) {
  return (
    <div className="mt-2">
      <button
        type="button"
        onClick={onToggle}
        className="text-xs text-text-muted hover:text-text-primary underline-offset-2 hover:underline transition-colors"
      >
        {/* Edits are fetched when this opens, so before the first click `edits` is empty
            and there is no count to give. The brackets go with the number: `(${n || ''})`
            kept them and rendered "View edit history ()". */}
        {isOpen
          ? 'Hide edit history'
          : `View edit history${edits.length ? ` (${edits.length})` : ''}`}
      </button>
      {isOpen && (
        <div className="mt-2 space-y-2">
          {isLoading && (
            <>
              <div className="h-12 bg-surface-hover rounded animate-pulse" />
              <div className="h-12 bg-surface-hover rounded animate-pulse" />
            </>
          )}
          {!isLoading &&
            edits.map((edit, i) => (
              <div key={i} className="bg-surface-hover rounded p-3 text-sm text-text-secondary">
                <div className="text-xs text-text-muted mb-1">
                  {formatRelativeTime(edit.editedAt)}
                </div>
                {'oldTitle' in edit && edit.oldTitle && (
                  <div className="font-medium mb-1">{edit.oldTitle}</div>
                )}
                <div className="whitespace-pre-wrap">{edit.oldBody}</div>
              </div>
            ))}
        </div>
      )}
    </div>
  )
}
