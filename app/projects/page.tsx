'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

interface Project {
  id: string
  title: string
  description: string
  project_type: string
  budget_min: number
  budget_max: number
  timeline: string
  required_skills: string[]
  complexity: string
  status: string
  created_at: string
  client_name: string
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const [userProfile, setUserProfile] = useState<any>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedType, setSelectedType] = useState('')
  const [selectedComplexity, setSelectedComplexity] = useState('')
  const [minBudget, setMinBudget] = useState('')
  const router = useRouter()

  const projectTypes = [
    { value: 'automation', label: 'Automatisation' },
    { value: 'ai', label: 'Intelligence Artificielle' },
    { value: 'chatbot', label: 'Chatbot' },
    { value: 'data_analysis', label: 'Analyse de données' },
    { value: 'other', label: 'Autre' }
  ]

  const complexityLevels = [
    { value: 'simple', label: 'Simple' },
    { value: 'medium', label: 'Moyen' },
    { value: 'complex', label: 'Complexe' }
  ]

  useEffect(() => {
    fetchProjects()
    checkUser()
  }, [])

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      setUser(user)
      const { data: profile } = await supabase
        .from('profiles')
        .select('user_type')
        .eq('id', user.id)
        .single()
      setUserProfile(profile)
    }
  }

  const fetchProjects = async () => {
    try {
      const { data: projectsData } = await supabase
        .from('projects')
        .select('*')
        .eq('status', 'open')
        .order('created_at', { ascending: false })

      const { data: profilesData } = await supabase
        .from('profiles')
        .select('id, full_name')

      if (projectsData && profilesData) {
        const projectsWithProfiles = projectsData.map(project => {
          const profile = profilesData.find(p => p.id === project.client_id)
          return {
            ...project,
            client_name: profile?.full_name || 'Client inconnu'
          }
        })
        setProjects(projectsWithProfiles as Project[])
      }
    } catch (error) {
      console.error('Erreur:', error)
    }
    setLoading(false)
  }

  const handleApplyToProject = (projectId: string) => {
    if (!user) {
      router.push('/auth/login')
      return
    }
    
    if (userProfile?.user_type !== 'developer') {
      alert('Seuls les développeurs peuvent candidater aux projets')
      return
    }
    
    router.push(`/dashboard/developer/applications`)
  }

  const filteredProjects = projects.filter(project => {
    const matchesSearch = !searchTerm || 
      project.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      project.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      project.required_skills?.some(skill => skill.toLowerCase().includes(searchTerm.toLowerCase()))

    const matchesType = !selectedType || project.project_type === selectedType
    const matchesComplexity = !selectedComplexity || project.complexity === selectedComplexity
    const matchesBudget = !minBudget || (project.budget_min && project.budget_min >= parseInt(minBudget))

    return matchesSearch && matchesType && matchesComplexity && matchesBudget
  })

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
          <div className="absolute inset-0 w-16 h-16 border-4 border-gray-600 border-b-transparent rounded-full animate-spin opacity-50"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header Section - FOND NOIR */}
      <div className="bg-black py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl sm:text-4xl font-black text-white mb-4">
              PROJETS DISPONIBLES
            </h1>
            <p className="text-xl text-gray-300 font-medium mb-6">
              Découvrez les projets innovants en IA et automatisation
            </p>
            
            {/* CTA selon l'état utilisateur */}
            {userProfile?.user_type === 'client' && (
              <div className="bg-white rounded-xl p-4 border-2 border-white max-w-2xl mx-auto">
                <p className="text-black font-medium">
                  <span className="font-black">Client connecté :</span> Inspirez-vous des autres projets ! 
                  <Link href="/dashboard/client/create-project" className="font-black text-black underline decoration-2 underline-offset-2 ml-2 hover:text-gray-700 transition-colors">
                    Créer votre projet →
                  </Link>
                </p>
              </div>
            )}
            {userProfile?.user_type === 'developer' && (
              <div className="bg-white rounded-xl p-4 border-2 border-white max-w-2xl mx-auto">
                <p className="text-black font-medium">
                  <span className="font-black">Développeur connecté :</span> Candidatez aux projets qui correspondent à vos compétences !
                </p>
              </div>
            )}
          </div>

          {/* Filtres intégrés */}
          <div className="bg-gray-50 rounded-2xl p-6 border-2 border-gray-200">
            <h2 className="text-lg font-black text-black mb-4">🔍 FILTRES DE RECHERCHE</h2>
            <div className="grid md:grid-cols-5 gap-4">
              <div>
                <label className="block text-sm font-bold text-black mb-2">Recherche</label>
                <Input
                  type="text"
                  placeholder="Titre, description, compétences..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="bg-white border-2 border-gray-300 text-black placeholder-gray-400 focus:border-black font-medium"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-black mb-2">Type de projet</label>
                <select
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value)}
                  className="w-full bg-white border-2 border-gray-300 rounded-lg px-3 py-2 text-black focus:outline-none focus:border-black font-medium"
                >
                  <option value="">Tous les types</option>
                  {projectTypes.map(type => (
                    <option key={type.value} value={type.value}>{type.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold text-black mb-2">Complexité</label>
                <select
                  value={selectedComplexity}
                  onChange={(e) => setSelectedComplexity(e.target.value)}
                  className="w-full bg-white border-2 border-gray-300 rounded-lg px-3 py-2 text-black focus:outline-none focus:border-black font-medium"
                >
                  <option value="">Toutes complexités</option>
                  {complexityLevels.map(level => (
                    <option key={level.value} value={level.value}>{level.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold text-black mb-2">Budget min (€)</label>
                <Input
                  type="number"
                  placeholder="Ex: 1000"
                  value={minBudget}
                  onChange={(e) => setMinBudget(e.target.value)}
                  className="bg-white border-2 border-gray-300 text-black placeholder-gray-400 focus:border-black font-medium"
                />
              </div>
              <div className="flex items-end">
                <Button
                  onClick={() => {
                    setSearchTerm('')
                    setSelectedType('')
                    setSelectedComplexity('')
                    setMinBudget('')
                  }}
                  className="w-full bg-black border-2 border-black text-white hover:bg-gray-800 font-black transform hover:scale-105 transition-all duration-300"
                >
                  Réinitialiser
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content - FOND BLANC */}
      <div className="bg-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Statistiques - FOND GRIS */}
          <div className="bg-gray-50 rounded-2xl p-8 border-2 border-gray-200 mb-8">
            <h2 className="text-2xl font-black text-black mb-6 text-center">STATISTIQUES</h2>
            <div className="grid md:grid-cols-4 gap-6">
              <div className="bg-white rounded-xl p-6 border-2 border-gray-200 hover:border-black transition-all duration-300 text-center group">
                <div className="text-4xl font-black text-black group-hover:text-gray-700 transition-colors">{projects.length}</div>
                <div className="text-gray-600 text-sm font-bold uppercase tracking-wider">Projets disponibles</div>
              </div>
              <div className="bg-white rounded-xl p-6 border-2 border-gray-200 hover:border-black transition-all duration-300 text-center group">
                <div className="text-4xl font-black text-black group-hover:text-gray-700 transition-colors">{projects.filter(p => p.project_type === 'ai').length}</div>
                <div className="text-gray-600 text-sm font-bold uppercase tracking-wider">Projets IA</div>
              </div>
              <div className="bg-white rounded-xl p-6 border-2 border-gray-200 hover:border-black transition-all duration-300 text-center group">
                <div className="text-4xl font-black text-black group-hover:text-gray-700 transition-colors">{projects.filter(p => p.project_type === 'automation').length}</div>
                <div className="text-gray-600 text-sm font-bold uppercase tracking-wider">Automatisation</div>
              </div>
              <div className="bg-white rounded-xl p-6 border-2 border-gray-200 hover:border-black transition-all duration-300 text-center group">
                <div className="text-4xl font-black text-black group-hover:text-gray-700 transition-colors">
                  {projects.length > 0 ? Math.round(projects.reduce((acc, p) => acc + (p.budget_max || 0), 0) / projects.length) : 0}€
                </div>
                <div className="text-gray-600 text-sm font-bold uppercase tracking-wider">Budget moyen</div>
              </div>
            </div>
          </div>

          {/* Résultats */}
          <div className="mb-6">
            <p className="text-black font-bold">
              <span className="text-2xl">{filteredProjects.length}</span> projet(s) trouvé(s) sur <span className="text-xl">{projects.length}</span> total
            </p>
          </div>

          {/* Liste des projets */}
          <div className="grid gap-6">
            {filteredProjects.map((project) => (
              <div key={project.id} className="bg-gray-50 rounded-2xl p-6 border-2 border-gray-200 hover:border-black transition-all duration-300 hover:shadow-lg group">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2 flex-wrap">
                      <h3 className="text-xl font-black text-black group-hover:text-gray-700 transition-colors">{project.title}</h3>
                      <span className={`px-3 py-1 rounded-full text-xs font-bold border-2 ${
                        project.complexity === 'simple' ? 'bg-white text-black border-black' :
                        project.complexity === 'medium' ? 'bg-white text-black border-gray-400' :
                        'bg-black text-white border-black'
                      }`}>
                        {project.complexity === 'simple' ? '● SIMPLE' :
                         project.complexity === 'medium' ? '● MOYEN' : '● COMPLEXE'}
                      </span>
                      <span className="px-3 py-1 bg-black text-white rounded-full text-xs font-bold">
                        {projectTypes.find(t => t.value === project.project_type)?.label}
                      </span>
                    </div>
                    <p className="text-gray-700 text-sm mb-1 font-medium">
                      Par <span className="text-black font-black">{project.client_name}</span>
                    </p>
                    <p className="text-gray-700 mb-4 font-medium leading-relaxed">{project.description}</p>
                  </div>
                  <div className="text-right ml-4">
                    <div className="text-2xl font-black text-black mb-1">
                      {project.budget_min && project.budget_max ? 
                        `${project.budget_min}€ - ${project.budget_max}€` : 
                        'Budget à définir'}
                    </div>
                    {project.timeline && (
                      <div className="text-gray-600 text-sm font-medium">Délai: {project.timeline}</div>
                    )}
                  </div>
                </div>

                {/* Compétences requises */}
                {project.required_skills && project.required_skills.length > 0 && (
                  <div className="mb-4">
                    <h4 className="text-black text-sm font-black mb-2 uppercase tracking-wider">Compétences requises:</h4>
                    <div className="flex flex-wrap gap-2">
                      {project.required_skills.map((skill, index) => (
                        <span key={index} className="px-3 py-1 bg-white text-black rounded-lg text-xs border-2 border-gray-300 hover:border-black transition-colors font-medium">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Meta info */}
                <div className="flex justify-between items-center mb-4">
                  <div className="text-gray-600 text-sm font-medium">
                    Publié le {new Date(project.created_at).toLocaleDateString('fr-FR')}
                  </div>
                  <div className="px-3 py-1 bg-white text-black border-2 border-black rounded-full text-sm font-bold">
                    ● OUVERT
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3 flex-wrap">
                  <Button className="bg-black border-2 border-black text-white hover:bg-gray-800 font-black transform hover:scale-105 transition-all duration-300">
                    Voir les détails
                  </Button>
                  
                  {!user ? (
                    <Link href="/auth/signup">
                      <Button className="border-2 border-black text-black hover:bg-black hover:text-white font-black transform hover:scale-105 transition-all duration-300 bg-transparent">
                        S'inscrire pour candidater
                      </Button>
                    </Link>
                  ) : userProfile?.user_type === 'developer' ? (
                    <Button 
                      onClick={() => handleApplyToProject(project.id)}
                      className="border-2 border-black text-black hover:bg-black hover:text-white font-black transform hover:scale-105 transition-all duration-300 bg-transparent"
                    >
                      Candidater à ce projet
                    </Button>
                  ) : userProfile?.user_type === 'client' ? (
                    <Button 
                      disabled
                      className="bg-gray-400 text-gray-600 cursor-not-allowed border-2 border-gray-400 font-bold"
                      title="Seuls les développeurs peuvent candidater"
                    >
                      Réservé aux développeurs
                    </Button>
                  ) : null}
                </div>
              </div>
            ))}
          </div>

          {/* État vide */}
          {filteredProjects.length === 0 && !loading && (
            <div className="text-center py-16 bg-gray-50 rounded-2xl border-2 border-gray-200">
              <div className="w-24 h-24 bg-white rounded-3xl flex items-center justify-center mx-auto mb-6 border-2 border-gray-200">
                <span className="text-4xl">📋</span>
              </div>
              <h3 className="text-2xl font-black text-black mb-3">
                {projects.length === 0 ? 'Aucun projet disponible' : 'Aucun projet trouvé'}
              </h3>
              <p className="text-gray-600 font-medium mb-8 max-w-md mx-auto leading-relaxed">
                {projects.length === 0 
                  ? 'Soyez les premiers à publier un projet !' 
                  : 'Essayez d\'ajuster vos critères de recherche'}
              </p>
              <div className="flex gap-4 justify-center flex-wrap">
                {!user ? (
                  <>
                    <Link href="/auth/signup">
                      <Button className="bg-black text-white hover:bg-gray-800 border-2 border-black font-black transform hover:scale-105 transition-all duration-300">
                        Créer un compte développeur
                      </Button>
                    </Link>
                    <Link href="/auth/login">
                      <Button className="border-2 border-black text-black hover:bg-black hover:text-white font-black transform hover:scale-105 transition-all duration-300 bg-transparent">
                        Se connecter
                      </Button>
                    </Link>
                  </>
                ) : userProfile?.user_type === 'client' ? (
                  <Link href="/dashboard/client/create-project">
                    <Button className="bg-black text-white hover:bg-gray-800 border-2 border-black font-black transform hover:scale-105 transition-all duration-300">
                      Créer le premier projet
                    </Button>
                  </Link>
                ) : null}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
