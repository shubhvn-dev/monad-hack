import { NextRequest, NextResponse } from 'next/server'
import { store } from '@/lib/store'

export async function GET(req: NextRequest) {
  try {
  const wallet = req.nextUrl.searchParams.get('wallet')
  if (wallet) {
    const org = store.orgs.get(wallet.toLowerCase())
    if (!org) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    const projects = Array.from(store.showcase.values()).filter(
      p => p.orgWallet.toLowerCase() === wallet.toLowerCase()
    )
    return NextResponse.json({ ...org, projects })
  }
  const orgs = Array.from(store.orgs.values()).map(org => ({
    ...org,
    projects: Array.from(store.showcase.values()).filter(
      p => p.orgWallet.toLowerCase() === org.wallet.toLowerCase()
    ),
  }))
  return NextResponse.json(orgs)
  } catch (e: any) {
    console.error('[/api/orgs] ERROR:', e?.message, e?.stack)
    return NextResponse.json({ error: e?.message ?? 'unknown' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { wallet, name, tagline, description, category, founded, location, teamSize, sector, website } = body
  if (!wallet || !name) return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
  store.orgs.set(wallet.toLowerCase(), {
    wallet, name,
    tagline: tagline ?? '',
    description: description ?? '',
    category: category ?? 'Research',
    founded: founded ?? new Date().getFullYear().toString(),
    location: location ?? 'Remote',
    teamSize: teamSize ?? 1,
    sector: sector ?? 'AI Research',
    website,
  })
  return NextResponse.json({ ok: true })
}
