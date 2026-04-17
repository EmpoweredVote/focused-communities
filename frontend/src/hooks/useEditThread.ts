import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { apiFetch } from '../lib/apiFetch'
import type { Thread } from '../types'

export function useEditThread(threadId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ title, body }: { title?: string; body?: string }) => {
      const result = await apiFetch<{ data: Thread }>(`/api/threads/${threadId}`, {
        method: 'PATCH',
        body: JSON.stringify({ title, body }),
      })
      if (!result.ok) {
        throw Object.assign(new Error(result.error), { status: result.status })
      }
      return result.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['thread', threadId] })
    },
    onError: () => {
      toast.error("Couldn't save edit. Try again.")
    },
  })
}
