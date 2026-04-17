import { useParams } from 'react-router'

export function CommunityHubPage() {
  const { slug } = useParams<{ slug: string }>()
  return (
    <main className="p-6">
      <h1 className="text-2xl font-semibold">{slug}</h1>
      <p className="text-gray-500 mt-2">Community hub page — coming in plan 05-03</p>
    </main>
  )
}
