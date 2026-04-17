import { useState } from 'react'
import { AuthGate, SuspendedNotice } from './AuthGate'
import { CharCounter } from './CharCounter'
import { useCreateReply } from '../hooks/useCreateReply'

interface ReplyFormProps {
  threadId: string
}

export function ReplyForm({ threadId }: ReplyFormProps) {
  const [body, setBody] = useState('')
  const [suspended, setSuspended] = useState(false)

  const { mutate: createReply, isPending } = useCreateReply(threadId)

  const canSubmit = body.trim().length >= 10 && !isPending

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!canSubmit) return
    createReply(body.trim(), {
      onSuccess: () => {
        setBody('')
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
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
        />
        <CharCounter value={body} max={2000} />

        {suspended && <SuspendedNotice />}

        <div className="mt-2 flex justify-end">
          <button
            type="submit"
            disabled={!canSubmit}
            className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
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
