import type { Milestone } from '@/lib/store'

const NODE_R = 7
const SPACING = 120
const HEIGHT = 56
const LABEL_Y = HEIGHT - 6
const CY = 20

function fmt(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export function MilestoneGraph({ milestones }: { milestones: Milestone[] }) {
  if (!milestones.length) return (
    <p className="text-sm text-muted-foreground">No milestones defined.</p>
  )

  const total = milestones.length
  const done = milestones.filter(m => m.completedAt).length
  const pct = total > 0 ? Math.round((done / total) * 100) : 0
  const W = (total - 1) * SPACING + NODE_R * 2 + 40
  const PAD = 20

  return (
    <div className="space-y-3">
      {/* Header row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-1.5 rounded-full overflow-hidden bg-border" style={{ width: 120 }}>
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{ width: `${pct}%`, background: 'var(--primary)' }}
            />
          </div>
          <span className="text-xs font-mono text-muted-foreground">{done}/{total}</span>
        </div>
        <span className="text-xs font-mono font-medium" style={{ color: done === total ? 'var(--primary)' : 'var(--muted-foreground)' }}>
          {done === total ? '✓ Complete' : `${pct}%`}
        </span>
      </div>

      {/* SVG timeline */}
      <div className="overflow-x-auto -mx-1 px-1 pb-1">
        <svg
          width={Math.max(W + PAD * 2, 300)}
          height={HEIGHT + 20}
          className="block"
          style={{ minWidth: Math.max(W + PAD * 2, 300) }}
        >
          {/* Connecting lines */}
          {milestones.slice(0, -1).map((m, i) => {
            const x1 = PAD + i * SPACING + NODE_R
            const x2 = PAD + (i + 1) * SPACING - NODE_R
            const bothDone = m.completedAt && milestones[i + 1].completedAt
            return (
              <line
                key={`line-${i}`}
                x1={x1} y1={CY} x2={x2} y2={CY}
                strokeWidth={2}
                stroke={bothDone ? 'var(--primary)' : 'var(--border)'}
                strokeDasharray={!bothDone && m.completedAt ? '4 3' : undefined}
              />
            )
          })}

          {/* Nodes + labels */}
          {milestones.map((m, i) => {
            const cx = PAD + i * SPACING
            const done = !!m.completedAt
            const isLast = i === total - 1
            const anchor = i === 0 ? 'start' : isLast ? 'end' : 'middle'
            const labelX = anchor === 'start' ? cx - NODE_R : anchor === 'end' ? cx + NODE_R : cx

            return (
              <g key={m.id}>
                {/* Outer ring */}
                <circle
                  cx={cx} cy={CY} r={NODE_R + 3}
                  fill={done ? 'oklch(0.60 0.20 145 / 0.12)' : 'transparent'}
                />
                {/* Main node */}
                <circle
                  cx={cx} cy={CY} r={NODE_R}
                  fill={done ? 'var(--primary)' : 'var(--background)'}
                  stroke={done ? 'var(--primary)' : 'var(--border)'}
                  strokeWidth={2}
                />
                {/* Checkmark for done */}
                {done && (
                  <text x={cx} y={CY + 4} textAnchor="middle" fontSize={9} fill="white" fontWeight="700">✓</text>
                )}
                {/* Step number for pending */}
                {!done && (
                  <text x={cx} y={CY + 4} textAnchor="middle" fontSize={9} fill="var(--muted-foreground)" fontWeight="600">
                    {i + 1}
                  </text>
                )}
                {/* Date below done nodes */}
                {m.completedAt && (
                  <text x={labelX} y={CY + NODE_R + 14} textAnchor={anchor} fontSize={9} fill="var(--primary)" fontFamily="var(--font-geist-mono)">
                    {fmt(m.completedAt)}
                  </text>
                )}
                {/* Title tooltip line */}
                <title>{m.title}</title>
              </g>
            )
          })}
        </svg>
      </div>

      {/* Milestone list */}
      <ol className="space-y-1.5">
        {milestones.map((m, i) => (
          <li key={m.id} className="flex items-start gap-2.5 text-sm">
            <span className={`mt-0.5 text-xs font-mono w-4 shrink-0 ${m.completedAt ? 'text-primary' : 'text-muted-foreground'}`}>
              {m.completedAt ? '✓' : `${i + 1}.`}
            </span>
            <span className={m.completedAt ? 'text-foreground' : 'text-muted-foreground'}>{m.title}</span>
            {m.completedAt && (
              <span className="ml-auto text-xs font-mono text-muted-foreground shrink-0">{fmt(m.completedAt)}</span>
            )}
          </li>
        ))}
      </ol>
    </div>
  )
}

// Compact version for cards
export function MilestoneBar({ milestones }: { milestones: Milestone[] }) {
  if (!milestones.length) return null
  const done = milestones.filter(m => m.completedAt).length
  const total = milestones.length
  const pct = Math.round((done / total) * 100)

  return (
    <div className="flex items-center gap-2">
      <div className="flex gap-0.5">
        {milestones.map(m => (
          <div
            key={m.id}
            className="h-1.5 w-4 rounded-full"
            style={{ background: m.completedAt ? 'var(--primary)' : 'var(--border)' }}
          />
        ))}
      </div>
      <span className="text-xs font-mono text-muted-foreground">{done}/{total}</span>
    </div>
  )
}
