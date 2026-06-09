import Link from 'next/link'
import { WalletButton } from '@/components/WalletButton'
import { TrackInfo } from '@/components/TrackInfo'
import { DepositForm } from '@/components/DepositForm'
import { WithdrawForm } from '@/components/WithdrawForm'
import { ProposalsList } from '@/components/ProposalsList'

export default function InvestorPage() {
  return (
    <main className="container mx-auto max-w-3xl py-8 px-4 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">TrackFund</h1>
        <div className="flex items-center gap-4">
          <Link href="/researcher" className="text-sm text-muted-foreground hover:underline">
            Researcher →
          </Link>
          <WalletButton />
        </div>
      </div>

      <TrackInfo />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <DepositForm />
        <WithdrawForm />
      </div>

      <ProposalsList />
    </main>
  )
}
