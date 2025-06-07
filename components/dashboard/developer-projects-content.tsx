'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Button } from '../ui/button'
import Link from 'next/link'

interface Project {
  id: string
  title: string
  description: string
  project_type: string
  budget_min: number
  budget_max: number
  status: string
  created_at: string
  client_id: string
  profiles: {
    full_name: string
    company: string
  }
}

interface Application {
  project_id: string
  status: string
}

export default function DeveloperProjectsContent() {
  const [user, setUser] = useState<any>(null)
  const [projects, setProjects] = useState<Project[]>([])
  const [applications, setApplications] = useState<Application[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [applyingTo, setApplyingTo] = useState<string | null>(null)

  useEffect(() => {
    const loadData = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)

      // Récupérer toutes les candidatures du développeur
      const { data: userApplications } = await supabase
        .from('project_applications')
        .select('project_id, status')
        .eq('developer_id', user.id)

      setApplications(userApplications || [])

      // Récupérer tous les projets ouverts avec infos client
      const { data: allProjects } = await supabase
        .from('projects')
        .select(`
          *,
          profiles:client_id(full_name, company)
        `)
        .eq('status', 'open')
        .order('created_at', { ascending: false })

      setProjects(allProjects || [])
      setLoading(false)
    }

    loadData()
  }, [])

  const handleApply = async (projectId: string) => {
    if (!user) return

    setApplyingTo(projectId)

    try {
      const { error } = await supabase
        .from('project_applications')
        .insert({
          project_id: projectId,
          developer_id: user.id,
          status: 'pending'
        })

      if (error) {
        console.error('Erreur lors de la candidature:', error)
        alert('Erreur lors de la candidature')
        return
      }

      // Mettre à jour la liste des candidatures
      setApplications(prev => [...prev, { project_id: projectId, status: 'pending' }])
      alert('Candidature envoyée avec succès !')

    } catch (error) {
      console.error('Erreur:', error)
      alert('Erreur lors de la candidature')
    } finally {
      setApplyingTo(null)
    }
  }

  const getApplicationStatus = (projectId: string) => {
    return applications.find(app => app.project_id === projectId)
  }

  const filteredProjects = projects.filter(project => {
    if (filter === 'available') {
      return !getApplicationStatus(project.id)
    }
    if (filter === 'applied') {
      return getApplicationStatus(project.id)
    }
    return true
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
          <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl p-6 border border-slate-700/50">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-bold text-white mb-2">
                  🔍 Projets disponibles
                </h1>
                <p className="text-slate-300">
                  Découvrez des projets d'automatisation et d'IA passionnants
                </p>
              </div>
              <Link href="/dashboard/developer">
                <Button variant="outline" className="border-slate-600 text-slate-300 hover:border-purple-400">
                  ← Retour au dashboard
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Filtres */}
        <div className="mb-6">
          <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl p-4 border border-slate-700/50">
            <div className="flex gap-4">
              <Button
                onClick={() => setFilter('all')}
                className={filter === 'all' ? 
                  'bg-gradient-to-r from-purple-500 to-pink-500' : 
                  'bg-slate-700 hover:bg-slate-600'
                }
              >
                Tous ({projects.length})
              </Button>
              <Button
                onClick={() => setFilter('available')}
                className={filter === 'available' ? 
                  'bg-gradient-to-r from-green-500 to-emerald-500' : 
                  'bg-slate-700 hover:bg-slate-600'
                }
              >
                Disponibles ({projects.filter(p => !getApplicationStatus(p.id)).length})
              </Button>
              <Button
                onClick={() => setFilter('applied')}
                className={filter === 'applied' ? 
                  'bg-gradient-to-r from-blue-500 to-cyan-500' : 
                  'bg-slate-700 hover:bg-slate-600'
                }
              >
                Candidatés ({projects.filter(p => getApplicationStatus(p.id)).length})
              </Button>
            </div>
          </div>
        </div>

        {/* Message si pas de projets */}
        {filteredProjects.length === 0 ? (
          <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl p-12 border border-slate-700/50 text-center">
            <div className="text-6xl mb-4">📋</div>
            <h3 className="text-xl font-semibold text-white mb-2">
              Aucun projet trouvé
            </h3>
            <p className="text-slate-400">
              {filter === 'available' ? 'Tous les projets disponibles ont déjà une candidature de votre part.' :
               filter === 'applied' ? 'Vous n\'avez encore postulé à aucun projet.' :
               'Aucun projet ouvert pour le moment.'}
            </p>
          </div>
        ) : (
          /* Liste des projets */
          <div className="space-y-6">
            {filteredProjects.map((project) => {
              const applicationStatus = getApplicationStatus(project.id)
              
              return (
                <div key={project.id} className="bg-slate-800/50 backdrop-blur-xl rounded-2xl p-6 border border-slate-700/50 hover:border-purple-500/50 transition-colors">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-xl font-semibold text-white">{project.title}</h3>
                        <span className="px-3 py-1 rounded-full text-xs font-medium bg-purple-500/20 text-purple-400">
                          {project.project_type}
                        </span>
                        {applicationStatus && (
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                            applicationStatus.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400' :
                            applicationStatus.status === 'accepted' ? 'bg-green-500/20 text-green-400' :
                            applicationStatus.status === 'rejected' ? 'bg-red-500/20 text-red-400' :
                            'bg-gray-500/20 text-gray-400'
                          }`}>
                            {applicationStatus.status === 'pending' ? '⏳ En attente' :
                             applicationStatus.status === 'accepted' ? '✅ Acceptée' :
                             applicationStatus.status === 'rejected' ? '❌ Refusée' :
                             applicationStatus.status}
                          </span>
                        )}
                      </div>
                      <p className="text-slate-300 mb-4 leading-relaxed">
                        {project.description}
                      </p>
                      <div className="flex items-center gap-6 text-sm text-slate-400">
                        <div className="flex items-center gap-2">
                          <span>💰</span>
                          <span>
                            {project.budget_min && project.budget_max ? 
                              `${project.budget_min}€ - ${project.budget_max}€` : 
                              'Budget à négocier'
                            }
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span>🏢</span>
                          <span>{project.profiles?.company || project.profiles?.full_name || 'Client anonyme'}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span>📅</span>
                          <span>{new Date(project.created_at).toLocaleDateString('fr-FR')}</span>
                        </div>
                      </div>
                    </div>
                    <div className="ml-6 flex flex-col gap-2">
                      {!applicationStatus ? (
                        <Button
                          onClick={() => handleApply(project.id)}
                          disabled={applyingTo === project.id}
                          className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                        >
                          {applyingTo === project.id ? 'Candidature...' : 'Postuler'}
                        </Button>
                      ) : (
                        <Button disabled className="bg-slate-600 text-slate-400">
                          Déjà candidaté
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
