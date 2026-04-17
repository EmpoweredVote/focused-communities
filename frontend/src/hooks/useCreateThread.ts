import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router'
import { toast } from 'sonner'
import { apiFetch } from '../lib/apiFetch'
import type { Thread } from '../types'

interface CreateThreadParams {
  title: string
  body: string
}

export function useCreateThread(communityId: string, communitySlug: string) {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [suspended, setSuspended] = useState(false)

  const mutation = useMutation({
    mutationFn: async ({ title, body }: CreateThreadParams) => {
      const res = await apiFetch<{ data: Thread }>(`/api/communities/${communityId}/threads`, {
        method: 'POST',
        body: JSON.stringify({ title, body }),
      })
      if (!res.ok) {
        const err = Object.assign(new Error(res.error), { status: res.status, reason: (res as { reason?: string }).reason })
        throw err
      }
      return res.data.data
    },
    onSuccess: (thread) => {
      queryClient.invalidateQueries({ queryKey: ['threads', communityId] })
      navigate(`/communities/${communitySlug}/threads/${thread.id}`)
    },
    onError: (err: Error & { status?: number; reason?: string }) => {
      if (err.status === 429) {
        toast.error('Too many posts. Please wait a few minutes.')
      } else if (err.status === 403 && err.reason === 'suspended') {
        setSuspended(true)
      } else if (err.status === 422) {
        toast.error('Please check your input and try again.')
      } else {
        toast.error("Couldn't create thread. Try again.")
      }
    },
  })

  return { ...mutation, suspended }
}
