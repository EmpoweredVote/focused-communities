import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { apiFetch } from '../lib/apiFetch'
import type { Post } from '../types'

export function useEditPost(postId: string, threadId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (body: string) => {
      const result = await apiFetch<{ data: Post }>(`/api/posts/${postId}`, {
        method: 'PATCH',
        body: JSON.stringify({ body }),
      })
      if (!result.ok) {
        throw Object.assign(new Error(result.error), { status: result.status })
      }
      return result.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts', threadId] })
    },
    onError: () => {
      toast.error("Couldn't save edit. Try again.")
    },
  })
}
