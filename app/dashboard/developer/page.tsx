import DeveloperProtected from '@/components/auth/developer-protected'
import DeveloperDashboardContent from '@/components/dashboard/developer-dashboard-content'

export default function DeveloperDashboard() {
  return (
    <DeveloperProtected>
      <DeveloperDashboardContent />
    </DeveloperProtected>
  )
}
