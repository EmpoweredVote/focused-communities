import { useState } from 'react'
import { AuthGate, SuspendedNotice } from './AuthGate'
import { CharCounter } from './CharCounter'
import { useCreateReply } from '../hooks/useCreateReply'
import { useDraft } from '../hooks/useDraft'

interface ReplyFormProps {
  threadId: string
}

export function ReplyForm({ threadId }: ReplyFormProps) {
  const [body, setBody, clearDraft] = useDraft('draft-reply-' + threadId)
  const [suspended, setSuspended] = useState(false)

  const { mutate: createReply, isPending } = useCreateReply(threadId)

  const minLength = 5
  const canSubmit = body.trim().length >= minLength && !isPending

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!canSubmit) return
    createReply(body.trim(), {
      onSuccess: () => {
        clearDraft()
        setSuspended(false)
      },
      onError: (err: Error & { status?: number; reason?: string }) => {
        if (err.status === 403 && err.reason === 'suspended') {
          setSuspended(true)
        }
      },
    })
  }

  return (
    <AuthGate action="reply">
      <form onSubmit={handleSubmit}>
        <textarea
          value={body}
          onChange={e => setBody(e.target.value)}
          maxLength={2000}
          rows={4}
          placeholder="Write a reply..."
          className="w-full px-3 py-2 border border-border-medium rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ev-teal resize-none"
        />
        <CharCounter value={body} max={2000} />
        {body.trim().length > 0 && body.trim().length < minLength && (
          <p className="text-xs text-text-muted mt-1">At least {minLength} characters required</p>
        )}

        {suspended && <SuspendedNotice />}

        <div className="mt-2 flex justify-end">
          <button
            type="submit"
            disabled={!canSubmit}
            className="px-4 py-2 bg-ev-coral text-white text-sm font-medium rounded-lg hover:bg-ev-coral-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
          >
            {isPending ? (
              <>
                <span className="inline-block w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Posting...
              </>
            ) : (
              'Reply'
            )}
          </button>
        </div>
      </form>
    </AuthGate>
  )
}
