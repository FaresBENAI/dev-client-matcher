import ClientProtected from '../../../../components/auth/client-protected'
import CreateProjectContent from '../../../../components/dashboard/create-project-content'

export default function CreateProject() {
  return (
    <ClientProtected>
      <CreateProjectContent />
    </ClientProtected>
  )
}
