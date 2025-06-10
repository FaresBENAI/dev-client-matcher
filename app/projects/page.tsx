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
      // Récupérer les projets ET les profils séparément (solution qui marche)
      const { data: projectsData } = await supabase
        .from('projects')
        .select('*')
        .eq('status', 'open')
        .order('created_at', { ascending: false })

      const { data: profilesData } = await supabase
        .from('profiles')
        .select('id, full_name')

      // Joindre manuellement
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
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-white text-xl">Chargement des projets...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-4">
            🚀 Projets d'automatisation et IA
          </h1>
          <p className="text-xl text-slate-300 mb-4">
            Découvrez les projets innovants proposés par nos clients
          </p>
          
          {/* CTA selon l'état utilisateur */}
          {!user ? (
            <div className="bg-gradient-to-r from-purple-500/10 to-indigo-500/10 border border-purple-500/30 rounded-xl p-4">
              <p className="text-slate-300 mb-3">
                💡 <strong>Développeurs :</strong> Inscrivez-vous pour candidater aux projets qui vous intéressent
              </p>
              <div className="flex gap-3">
                <Link href="/auth/signup">
                  <Button className="bg-gradient-to-r from-purple-500 to-cyan-500">
                    Créer un compte développeur
                  </Button>
                </Link>
                <Link href="/auth/login">
                  <Button variant="outline" className="border-slate-600 text-slate-300">
                    Se connecter
                  </Button>
                </Link>
              </div>
            </div>
          ) : userProfile?.user_type === 'client' ? (
            <div className="bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border border-cyan-500/30 rounded-xl p-4">
              <p className="text-slate-300">
                👋 <strong>Client connecté :</strong> Inspirez-vous des autres projets ! 
                <Link href="/dashboard/client/create-project" className="text-cyan-400 hover:underline ml-2">
                  Créer votre projet →
                </Link>
              </p>
            </div>
          ) : (
            <div className="bg-gradient-to-r from-green-500/10 to-purple-500/10 border border-green-500/30 rounded-xl p-4">
              <p className="text-slate-300">
                ✨ <strong>Développeur connecté :</strong> Candidatez aux projets qui correspondent à vos compétences !
              </p>
            </div>
          )}
        </div>

        {/* Filtres */}
        <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl p-6 border border-slate-700/50 mb-8">
          <h2 className="text-lg font-semibold text-white mb-4">🔍 Filtres de recherche</h2>
          <div className="grid md:grid-cols-5 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Recherche</label>
              <Input
                type="text"
                placeholder="Titre, description, compétences..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-slate-700/50 border-slate-600 text-white placeholder-slate-400"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Type de projet</label>
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="w-full bg-slate-700/50 border border-slate-600 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="">Tous les types</option>
                {projectTypes.map(type => (
                  <option key={type.value} value={type.value}>{type.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Complexité</label>
              <select
                value={selectedComplexity}
                onChange={(e) => setSelectedComplexity(e.target.value)}
                className="w-full bg-slate-700/50 border border-slate-600 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="">Toutes complexités</option>
                {complexityLevels.map(level => (
                  <option key={level.value} value={level.value}>{level.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Budget min (€)</label>
              <Input
                type="number"
                placeholder="Ex: 1000"
                value={minBudget}
                onChange={(e) => setMinBudget(e.target.value)}
                className="bg-slate-700/50 border-slate-600 text-white placeholder-slate-400"
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
                variant="outline"
                className="w-full border-slate-600 text-slate-300 hover:border-purple-400"
              >
                Réinitialiser
              </Button>
            </div>
          </div>
        </div>

        {/* Statistiques */}
        <div className="grid md:grid-cols-4 gap-4 mb-8">
          <div className="bg-gradient-to-br from-purple-500/20 to-indigo-500/20 rounded-xl p-4 border border-purple-500/30">
            <div className="text-2xl font-bold text-white">{projects.length}</div>
            <div className="text-purple-400 text-sm">Projets disponibles</div>
          </div>
          <div className="bg-gradient-to-br from-cyan-500/20 to-blue-500/20 rounded-xl p-4 border border-cyan-500/30">
            <div className="text-2xl font-bold text-white">{projects.filter(p => p.project_type === 'ai').length}</div>
            <div className="text-cyan-400 text-sm">Projets IA</div>
          </div>
          <div className="bg-gradient-to-br from-green-500/20 to-emerald-500/20 rounded-xl p-4 border border-green-500/30">
            <div className="text-2xl font-bold text-white">{projects.filter(p => p.project_type === 'automation').length}</div>
            <div className="text-emerald-400 text-sm">Automatisation</div>
          </div>
          <div className="bg-gradient-to-br from-orange-500/20 to-red-500/20 rounded-xl p-4 border border-orange-500/30">
            <div className="text-2xl font-bold text-white">
              {projects.length > 0 ? Math.round(projects.reduce((acc, p) => acc + (p.budget_max || 0), 0) / projects.length) : 0}€
            </div>
            <div className="text-orange-400 text-sm">Budget moyen</div>
          </div>
        </div>

        {/* Résultats */}
        <div className="mb-6">
          <p className="text-slate-400">{filteredProjects.length} projet(s) trouvé(s) sur {projects.length} total</p>
        </div>

        {/* Liste des projets */}
        <div className="grid gap-6">
          {filteredProjects.map((project) => (
            <div key={project.id} className="bg-slate-800/50 backdrop-blur-xl rounded-2xl p-6 border border-slate-700/50 hover:border-purple-500/50 transition-all duration-300">
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-xl font-bold text-white">{project.title}</h3>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      project.complexity === 'simple' ? 'bg-green-500/20 text-green-400' :
                      project.complexity === 'medium' ? 'bg-yellow-500/20 text-yellow-400' :
                      'bg-red-500/20 text-red-400'
                    }`}>
                      {project.complexity === 'simple' ? 'Simple' :
                       project.complexity === 'medium' ? 'Moyen' : 'Complexe'}
                    </span>
                    <span className="px-2 py-1 bg-purple-500/20 text-purple-400 rounded-full text-xs">
                      {projectTypes.find(t => t.value === project.project_type)?.label}
                    </span>
                  </div>
                  <p className="text-slate-300 text-sm mb-1">
                    Par <span className="text-cyan-400">{project.client_name}</span>
                  </p>
                  <p className="text-slate-300 mb-4">{project.description}</p>
                </div>
                <div className="text-right ml-4">
                  <div className="text-2xl font-bold text-white mb-1">
                    {project.budget_min && project.budget_max ? 
                      `${project.budget_min}€ - ${project.budget_max}€` : 
                      'Budget à définir'}
                  </div>
                  {project.timeline && (
                    <div className="text-slate-400 text-sm">Délai: {project.timeline}</div>
                  )}
                </div>
              </div>

              {/* Compétences requises */}
              {project.required_skills && project.required_skills.length > 0 && (
                <div className="mb-4">
                  <h4 className="text-slate-300 text-sm font-medium mb-2">Compétences requises:</h4>
                  <div className="flex flex-wrap gap-2">
                    {project.required_skills.map((skill, index) => (
                      <span key={index} className="px-2 py-1 bg-gradient-to-r from-purple-500/20 to-indigo-500/20 text-purple-400 rounded-md text-xs border border-purple-500/30">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Meta info */}
              <div className="flex justify-between items-center mb-4">
                <div className="text-slate-400 text-sm">
                  Publié le {new Date(project.created_at).toLocaleDateString('fr-FR')}
                </div>
                <div className="text-green-400 text-sm font-medium">📈 Projet ouvert</div>
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <Button variant="outline" className="border-slate-600 text-slate-300 hover:border-purple-400">
                  Voir les détails
                </Button>
                
                {!user ? (
                  <Link href="/auth/signup">
                    <Button className="bg-gradient-to-r from-purple-500 to-cyan-500 hover:from-purple-600 hover:to-cyan-600">
                      S'inscrire pour candidater
                    </Button>
                  </Link>
                ) : userProfile?.user_type === 'developer' ? (
                  <Button 
                    onClick={() => handleApplyToProject(project.id)}
                    className="bg-gradient-to-r from-purple-500 to-cyan-500 hover:from-purple-600 hover:to-cyan-600"
                  >
                    Candidater à ce projet
                  </Button>
                ) : userProfile?.user_type === 'client' ? (
                  <Button 
                    disabled
                    className="bg-slate-600 text-slate-400 cursor-not-allowed"
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
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-xl font-semibold text-white mb-2">
              {projects.length === 0 ? 'Aucun projet disponible' : 'Aucun projet trouvé'}
            </h3>
            <p className="text-slate-400 mb-6">
              {projects.length === 0 
                ? 'Soyez les premiers à publier un projet !' 
                : 'Essayez d\'ajuster vos critères de recherche'}
            </p>
            <div className="flex gap-3 justify-center">
              {!user ? (
                <>
                  <Link href="/auth/signup">
                    <Button className="bg-gradient-to-r from-purple-500 to-cyan-500">
                      Créer un compte développeur
                    </Button>
                  </Link>
                  <Link href="/auth/login">
                    <Button variant="outline" className="border-slate-600 text-slate-300">
                      Se connecter
                    </Button>
                  </Link>
                </>
              ) : userProfile?.user_type === 'client' ? (
                <Link href="/dashboard/client/create-project">
                  <Button className="bg-gradient-to-r from-cyan-500 to-blue-500">
                    Créer le premier projet
                  </Button>
                </Link>
              ) : null}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
