import Link from 'next/link'
import { WalletButton } from '@/components/WalletButton'
import { SubmitProposal } from '@/components/SubmitProposal'
import { ProposalsList } from '@/components/ProposalsList'

export default function ResearcherPage() {
  return (
    <main className="container mx-auto max-w-3xl py-8 px-4 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">TrackFund — Researcher</h1>
        <div className="flex items-center gap-4">
          <Link href="/" className="text-sm text-muted-foreground hover:underline">
            ← Investor
          </Link>
          <WalletButton />
        </div>
      </div>

      <SubmitProposal />
      <ProposalsList />
    </main>
  )
}
