import { NextRequest, NextResponse } from 'next/server'
import { store } from '@/lib/store'

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  // Try showcase first (string id like 'oml-1')
  const showcase = store.showcase.get(id)
  if (showcase) {
    const org = store.orgs.get(showcase.orgWallet.toLowerCase()) ?? null
    return NextResponse.json({ ...showcase, org, type: 'showcase' })
  }
  // Try on-chain project meta (numeric id)
  const project = store.projects.get(Number(id))
  if (project) {
    const org = store.orgs.get(project.orgWallet.toLowerCase()) ?? null
    return NextResponse.json({ ...project, org, type: 'onchain' })
  }
  return NextResponse.json({ error: 'Not found' }, { status: 404 })
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const proposalId = Number(id)
  const { title } = await req.json()
  if (!title) return NextResponse.json({ error: 'Missing title' }, { status: 400 })

  let project = store.projects.get(proposalId)
  if (!project) return NextResponse.json({ error: 'Project not found' }, { status: 404 })

  const milestoneId = project.milestones.length
  project.milestones.push({ id: milestoneId, title })
  return NextResponse.json({ ok: true, milestoneId })
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { milestoneId } = await req.json()
  const project = store.projects.get(Number(id))
  if (!project) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const m = project.milestones.find(m => m.id === milestoneId)
  if (!m) return NextResponse.json({ error: 'Milestone not found' }, { status: 404 })
  m.completedAt = new Date().toISOString()
  return NextResponse.json({ ok: true })
}
