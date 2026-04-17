import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { apiFetch } from '../lib/apiFetch'
import type { Post } from '../types'

export function useCreateReply(threadId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (body: string) => {
      const res = await apiFetch<{ data: Post }>(`/api/threads/${threadId}/posts`, {
        method: 'POST',
        body: JSON.stringify({ body }),
      })
      if (!res.ok) {
        const err = Object.assign(new Error(res.error), { status: res.status, reason: (res as { reason?: string }).reason })
        throw err
      }
      return res.data.data
    },
    onMutate: async (body: string) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['posts', threadId] })

      // Snapshot previous value — usePosts stores Post[] directly
      const previous = queryClient.getQueryData<Post[]>(['posts', threadId])

      // Optimistically add the new post
      const optimisticPost: Post = {
        id: `optimistic-${Date.now()}`,
        body,
        authorPseudonym: '...',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        isEdited: false,
      }

      queryClient.setQueryData<Post[]>(['posts', threadId], (old) => [
        ...(old ?? []),
        optimisticPost,
      ])

      return { previous }
    },
    onError: (err: Error & { status?: number; reason?: string }, _body, context) => {
      // Roll back on error
      if (context?.previous) {
        queryClient.setQueryData(['posts', threadId], context.previous)
      }

      if (err.status === 429) {
        toast.error('Too many posts. Please wait a few minutes.')
      } else if (err.status === 403 && err.reason === 'suspended') {
        toast.error('Your account is suspended and cannot post.')
      } else {
        toast.error("Couldn't post. Try again.")
      }
    },
    onSettled: () => {
      // Always refetch to get real data
      queryClient.invalidateQueries({ queryKey: ['posts', threadId] })
      queryClient.invalidateQueries({ queryKey: ['thread', threadId] })
    },
  })
}
