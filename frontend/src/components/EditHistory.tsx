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
        className="text-xs text-gray-400 hover:text-gray-600 underline-offset-2 hover:underline transition-colors"
      >
        {isOpen ? 'Hide edit history' : `View edit history (${edits.length || ''})`}
      </button>
      {isOpen && (
        <div className="mt-2 space-y-2">
          {isLoading && (
            <>
              <div className="h-12 bg-gray-100 rounded animate-pulse" />
              <div className="h-12 bg-gray-100 rounded animate-pulse" />
            </>
          )}
          {!isLoading &&
            edits.map((edit, i) => (
              <div key={i} className="bg-gray-50 rounded p-3 text-sm text-gray-600">
                <div className="text-xs text-gray-400 mb-1">
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
