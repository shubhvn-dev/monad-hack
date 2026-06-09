import type { Milestone } from '@/lib/store'

export function MilestoneTimeline({ milestones }: { milestones: Milestone[] }) {
  if (milestones.length === 0) return (
    <p className="text-sm text-muted-foreground">No milestones yet.</p>
  )
  return (
    <ol className="relative border-l border-gray-200 space-y-6 ml-3">
      {milestones.map(m => {
        const done = !!m.completedAt
        return (
          <li key={m.id} className="ml-6">
            <span className={`absolute -left-3 flex h-6 w-6 items-center justify-center rounded-full ring-4 ring-white ${done ? 'bg-green-500' : 'bg-gray-200'}`}>
              {done
                ? <svg className="h-3 w-3 text-white" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                : <span className="h-2 w-2 rounded-full bg-gray-400" />
              }
            </span>
            <p className={`text-sm font-medium ${done ? 'text-foreground' : 'text-muted-foreground'}`}>{m.title}</p>
            {m.completedAt && (
              <p className="text-xs text-muted-foreground mt-0.5">
                {new Date(m.completedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </p>
            )}
          </li>
        )
      })}
    </ol>
  )
}

export function MilestoneDots({ milestones }: { milestones: Milestone[] }) {
  if (milestones.length === 0) return null
  const done = milestones.filter(m => m.completedAt).length
  return (
    <div className="flex items-center gap-1.5">
      {milestones.map(m => (
        <span key={m.id} className={`h-2 w-2 rounded-full ${m.completedAt ? 'bg-green-500' : 'bg-gray-200'}`} />
      ))}
      <span className="text-xs text-muted-foreground ml-1">{done}/{milestones.length}</span>
    </div>
  )
}
