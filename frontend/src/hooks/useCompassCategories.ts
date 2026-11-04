import { useQuery } from '@tanstack/react-query'
import { apiFetch, COMPASS_PREFIX } from '../lib/apiFetch'

// GET /api/compass/categories on the accounts engine: the Compass's categories,
// each with its topics and the question each topic asks. A community's
// `topicId` is one of these topic ids, which is how the directory knows a
// community's category and its question. A topic can sit in more than one
// category.
export interface CompassTopic {
  id: string
  title: string
  short_title: string | null
  question_text: string | null
}

export interface CompassCategory {
  id: string
  title: string
  topics: CompassTopic[]
}

export function useCompassCategories() {
  return useQuery<CompassCategory[]>({
    queryKey: ['compass-categories'],
    queryFn: async () => {
      const res = await apiFetch<CompassCategory[]>(`${COMPASS_PREFIX}/compass/categories`)
      if (!res.ok) throw new Error(res.error)
      return res.data
    },
    staleTime: 10 * 60_000,
  })
}
