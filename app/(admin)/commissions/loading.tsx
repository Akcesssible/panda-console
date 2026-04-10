import { SkeletonStandardPage } from '@/components/ui/Skeleton'

export default function CommissionsLoading() {
  return <SkeletonStandardPage statCards={4} tableRows={8} />
}
