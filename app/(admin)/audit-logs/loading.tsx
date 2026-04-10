import { SkeletonStandardPage } from '@/components/ui/Skeleton'

export default function AuditLogsLoading() {
  return <SkeletonStandardPage statCards={3} tableRows={10} />
}
