import { useQuery } from '@tanstack/react-query'
import { apiFetch } from '../lib/apiFetch'
import type { ThreadEdit, PostEdit } from '../types'

export function useThreadEdits(threadId: string | null) {
  return useQuery({
    queryKey: ['threadEdits', threadId],
    queryFn: async () => {
      const result = await apiFetch<{ data: ThreadEdit[] }>(`/api/threads/${threadId}/edits`)
      if (!result.ok) {
        throw new Error(result.error)
      }
      return result.data.data
    },
    enabled: !!threadId,
  })
}

export function usePostEdits(postId: string | null) {
  return useQuery({
    queryKey: ['postEdits', postId],
    queryFn: async () => {
      const result = await apiFetch<{ data: PostEdit[] }>(`/api/posts/${postId}/edits`)
      if (!result.ok) {
        throw new Error(result.error)
      }
      return result.data.data
    },
    enabled: !!postId,
  })
}
