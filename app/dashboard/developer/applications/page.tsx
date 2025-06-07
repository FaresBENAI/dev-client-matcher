import DeveloperProtected from '@/components/auth/developer-protected'
import DeveloperApplicationsContent from '@/components/dashboard/developer-applications-content'

export default function DeveloperApplications() {
  return (
    <DeveloperProtected>
      <DeveloperApplicationsContent />
    </DeveloperProtected>
  )
}
