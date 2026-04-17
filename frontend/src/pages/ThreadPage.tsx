import { useParams } from 'react-router'

export function ThreadPage() {
  const { slug, id } = useParams<{ slug: string; id: string }>()
  return (
    <main className="p-6">
      <h1 className="text-2xl font-semibold">Thread {id}</h1>
      <p className="text-gray-500 mt-2">Community: {slug} — Thread page coming in plan 05-04</p>
    </main>
  )
}
