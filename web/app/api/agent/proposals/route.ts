import { NextResponse } from 'next/server'
import { getAllProposals } from '@/lib/chainData'

export async function GET() {
  try {
    const proposals = await getAllProposals()
    return NextResponse.json(proposals)
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? 'unknown' }, { status: 500 })
  }
}
