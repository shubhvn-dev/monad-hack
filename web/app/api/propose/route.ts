import { NextRequest, NextResponse } from 'next/server'
import { keccak256, toBytes, encodeAbiParameters, parseAbiParameters } from 'viem'

// In-memory store for MVP — maps hash → proposal text
const proposals = new Map<string, { title: string; description: string; requestedAmount: string }>()

export async function POST(req: NextRequest) {
  const { title, description, requestedAmount } = await req.json()
  if (!title || !description || !requestedAmount) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
  }
  const encoded = encodeAbiParameters(
    parseAbiParameters('string title, string description'),
    [title, description]
  )
  const metadataHash = keccak256(encoded)
  proposals.set(metadataHash, { title, description, requestedAmount })
  return NextResponse.json({ metadataHash })
}

export async function GET(req: NextRequest) {
  const hash = req.nextUrl.searchParams.get('hash')
  if (!hash) return NextResponse.json({ error: 'Missing hash' }, { status: 400 })
  const proposal = proposals.get(hash)
  if (!proposal) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(proposal)
}
