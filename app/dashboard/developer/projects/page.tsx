import DeveloperProtected from '@/components/auth/developer-protected'
import DeveloperProjectsContent from '@/components/dashboard/developer-projects-content'

export default function DeveloperProjects() {
  return (
    <DeveloperProtected>
      <DeveloperProjectsContent />
    </DeveloperProtected>
  )
}
