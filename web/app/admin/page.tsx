import { WalletButton } from '@/components/WalletButton'
import { AdminPanel } from '@/components/AdminPanel'
import Link from 'next/link'

export default function AdminPage() {
  return (
    <main className="container mx-auto max-w-3xl py-8 px-4 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Admin Panel</h1>
        <div className="flex items-center gap-4">
          <Link href="/" className="text-sm text-muted-foreground hover:underline">← Investor</Link>
          <WalletButton />
        </div>
      </div>
      <AdminPanel />
    </main>
  )
}
