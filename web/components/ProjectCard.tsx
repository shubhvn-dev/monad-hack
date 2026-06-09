'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useReadContract } from 'wagmi'
import { formatUnits } from 'viem'
import { ChevronRight } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { OrgAvatar } from '@/components/OrgAvatar'
import { MilestoneDots } from '@/components/MilestoneTimeline'
import { ADDRESSES, TRACK_FUND_ABI, formatStatus } from '@/lib/contracts'
import { MONAD_TESTNET_ID } from '@/lib/useMonadGuard'
import type { ProjectMeta, Org } from '@/lib/store'

const STATUS_VARIANT: Record<string, 'default' | 'secondary' | 'outline'> = {
  PENDING: 'secondary', APPROVED: 'default', FUNDED: 'outline',
}

export function ProjectCard({ proposalId }: { proposalId: number }) {
  const [meta, setMeta] = useState<(ProjectMeta & { org: Org | null }) | null>(null)

  const { data } = useReadContract({
    address: ADDRESSES.trackFund, abi: TRACK_FUND_ABI,
    functionName: 'proposals', args: [BigInt(proposalId)], chainId: MONAD_TESTNET_ID,
  })

  useEffect(() => {
    fetch(`/api/projects/${proposalId}`)
      .then(r => r.ok ? r.json() : null)
      .then(d => d && setMeta(d))
      .catch(() => {})
  }, [proposalId])

  if (!data) return null

  const [, requestedAmount, , statusNum] = data
  const status = formatStatus(Number(statusNum))
  const org = meta?.org
  const title = meta?.title ?? `Proposal #${proposalId}`
  const milestones = meta?.milestones ?? []

  return (
    <Link href={`/project/${proposalId}`} className="flex items-center gap-4 px-5 py-4 hover:bg-muted/50 transition-colors group">
      <OrgAvatar name={org?.name ?? title} size="sm" />
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm leading-tight truncate">{org?.name ?? `Project #${proposalId}`}</p>
        <p className="text-xs text-muted-foreground truncate">{title}</p>
        {milestones.length > 0 && (
          <div className="mt-1.5">
            <MilestoneDots milestones={milestones} />
          </div>
        )}
      </div>
      <div className="text-right flex-shrink-0 space-y-1">
        <p className="text-sm font-semibold tabular-nums">
          {Number(formatUnits(requestedAmount, 18)).toLocaleString()}
          <span className="text-xs font-normal text-muted-foreground ml-1">MUSD</span>
        </p>
        <Badge variant={STATUS_VARIANT[status]} className="text-xs">{status}</Badge>
      </div>
      <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors ml-1" />
    </Link>
  )
}
