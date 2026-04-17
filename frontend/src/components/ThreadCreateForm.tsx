import { useState } from 'react'
import { AuthGate, SuspendedNotice } from './AuthGate'
import { CharCounter } from './CharCounter'
import { useCreateThread } from '../hooks/useCreateThread'

interface ThreadCreateFormProps {
  communityId: string
  communitySlug: string
}

export function ThreadCreateForm({ communityId, communitySlug }: ThreadCreateFormProps) {
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [titleTouched, setTitleTouched] = useState(false)
  const [bodyTouched, setBodyTouched] = useState(false)

  const { mutate: createThread, isPending, suspended } = useCreateThread(communityId, communitySlug)

  const titleError = titleTouched && (title.trim().length < 5 ? 'Title must be at least 5 characters' : '')
  const bodyError = bodyTouched && (body.trim().length < 10 ? 'Body must be at least 10 characters' : '')
  const canSubmit = title.trim().length >= 5 && body.trim().length >= 10 && !isPending

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setTitleTouched(true)
    setBodyTouched(true)
    if (canSubmit) {
      createThread({ title: title.trim(), body: body.trim() })
    }
  }

  return (
    <AuthGate action="start a thread">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
          <input
            type="text"
            value={title}
            onChange={e => setTitle(e.target.value)}
            onBlur={() => setTitleTouched(true)}
            maxLength={150}
            placeholder="What's your topic?"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <CharCounter value={title} max={150} />
          {titleError && <p className="text-red-500 text-xs mt-1">{titleError}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Body</label>
          <textarea
            value={body}
            onChange={e => setBody(e.target.value)}
            onBlur={() => setBodyTouched(true)}
            maxLength={2000}
            rows={5}
            placeholder="Share your perspective..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          />
          <CharCounter value={body} max={2000} />
          {bodyError && <p className="text-red-500 text-xs mt-1">{bodyError}</p>}
        </div>

        {suspended && <SuspendedNotice />}

        <button
          type="submit"
          disabled={!canSubmit}
          className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
        >
          {isPending ? (
            <>
              <span className="inline-block w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Creating...
            </>
          ) : (
            'Start Thread'
          )}
        </button>
      </form>
    </AuthGate>
  )
}
