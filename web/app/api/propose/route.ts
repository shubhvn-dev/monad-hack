import { NextRequest, NextResponse } from 'next/server'
import { keccak256, encodeAbiParameters, parseAbiParameters } from 'viem'
import { store } from '@/lib/store'

export async function POST(req: NextRequest) {
  const { title, description, requestedAmount, orgWallet, proposalId } = await req.json()
  if (!title || !description || !requestedAmount) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
  }
  const encoded = encodeAbiParameters(
    parseAbiParameters('string title, string description'),
    [title, description]
  )
  const metadataHash = keccak256(encoded)
  store.proposals.set(metadataHash, { title, description, requestedAmount, orgWallet, proposalId })

  // Link to project meta if we have org + proposalId
  if (orgWallet && proposalId !== undefined) {
    const existing = store.projects.get(proposalId)
    if (!existing) {
      store.projects.set(proposalId, {
        proposalId,
        orgWallet,
        title,
        description,
        milestones: [],
      })
    }
  }

  return NextResponse.json({ metadataHash })
}

export async function GET(req: NextRequest) {
  const hash = req.nextUrl.searchParams.get('hash')
  if (!hash) return NextResponse.json({ error: 'Missing hash' }, { status: 400 })
  const proposal = store.proposals.get(hash)
  if (!proposal) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(proposal)
}
