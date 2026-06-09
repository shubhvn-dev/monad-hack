import Link from 'next/link'
import { WalletButton } from '@/components/WalletButton'
import { SubmitProposal } from '@/components/SubmitProposal'

export default function ResearcherPage() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b sticky top-0 bg-background/95 backdrop-blur z-10">
        <div className="container mx-auto max-w-3xl px-4 h-14 flex items-center justify-between">
          <Link href="/" className="text-sm text-muted-foreground hover:text-foreground transition-colors">← TrackFund</Link>
          <div className="flex items-center gap-3">
            <Link href="/admin" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Admin</Link>
            <WalletButton />
          </div>
        </div>
      </header>
      <main className="container mx-auto max-w-2xl px-4 py-8 space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Submit a Project</h1>
          <p className="text-muted-foreground mt-1">Apply for funding from the Agentic Research Track.</p>
        </div>
        <SubmitProposal />
      </main>
    </div>
  )
}
