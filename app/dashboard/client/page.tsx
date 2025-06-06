import ClientProtected from '../../../components/auth/client-protected'
import ClientDashboardContent from '../../../components/dashboard/client-dashboard-content'

export default function ClientDashboard() {
  return (
    <ClientProtected>
      <ClientDashboardContent />
    </ClientProtected>
  )
}
