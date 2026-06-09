import { NextResponse } from 'next/server'
import { store } from '@/lib/store'

export async function GET() {
  try {
    const orgs = Array.from(store.discoverOrgs.values()).map(org => ({
      ...org,
      projects: Array.from(store.discoverShowcase.values()).filter(
        p => p.orgWallet.toLowerCase() === org.wallet.toLowerCase()
      ),
    }))
    return NextResponse.json(orgs)
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? 'unknown' }, { status: 500 })
  }
}
