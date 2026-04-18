import Skeleton from 'react-loading-skeleton'

export function CommunityCardSkeleton() {
  return (
    <div className="p-4 border-b border-border-light">
      <Skeleton height={22} width="60%" className="mb-2" />
      <Skeleton count={2} height={16} />
    </div>
  )
}

export function StanceCardSkeleton() {
  return (
    <div className="border border-border-light rounded-lg p-4">
      <Skeleton height={20} width="80%" className="mb-3" />
      <Skeleton count={3} height={14} />
    </div>
  )
}

export function ThreadListItemSkeleton() {
  return (
    <div className="p-4 border-b border-border-light">
      <Skeleton height={20} width="70%" className="mb-2" />
      <Skeleton count={2} height={14} className="mb-2" />
      <Skeleton height={12} width="40%" />
    </div>
  )
}
