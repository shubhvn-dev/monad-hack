import { AppShell } from '@/components/AppShell'
import { OrgDashboard } from '@/components/OrgDashboard'

export default function OrgPage() {
  return (
    <AppShell>
      <div className="max-w-2xl mx-auto px-6 py-10">
        <OrgDashboard />
      </div>
    </AppShell>
  )
}
