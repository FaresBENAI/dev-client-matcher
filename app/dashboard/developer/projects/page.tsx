'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

export default function DeveloperProjects() {
  const [user, setUser] = useState<any>(null)
  const [projects, setProjects] = useState<any[]>([])
  const [applications, setApplications] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        window.location.href = '/auth/login'
        return
      }
      setUser(user)

      // Récupérer les candidatures existantes
      const { data: userApplications } = await supabase
        .from('project_applications')
        .select('project_id, status')
        .eq('developer_id', user.id)

      setApplications(userApplications || [])

      // Load projects - seulement les projets ouverts des AUTRES clients
      const { data } = await supabase
        .from('projects')
        .select('*')
        .eq('status', 'open')
        .neq('client_id', user.id)

      setProjects(data || [])
      setLoading(false)
    }

    init()
  }, [])

  const handleApply = async (projectId: string) => {
    try {
      const { error } = await supabase
        .from('project_applications')
        .insert({
          project_id: projectId,
          developer_id: user.id,
          status: 'pending'
        })

      if (error) {
        alert('Erreur lors de la candidature: ' + error.message)
        return
      }

      alert('Candidature envoyée avec succès !')
      // Recharger pour mettre à jour l'état
      window.location.reload()
    } catch (err) {
      alert('Erreur lors de la candidature')
    }
  }

  const getApplicationStatus = (projectId: string) => {
    return applications.find(app => app.project_id === projectId)
  }

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
                  Découvrez {projects.length} projet(s) d'automatisation et d'IA
                </p>
              </div>
              <Link href="/dashboard/developer">
                <button className="bg-purple-500 text-white px-4 py-2 rounded-lg hover:bg-purple-600 transition-colors">
                  ← Retour au dashboard
                </button>
              </Link>
            </div>
          </div>
        </div>

        {/* Projects list */}
        {projects.length === 0 ? (
          <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl p-12 border border-slate-700/50 text-center">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-xl font-semibold text-white mb-2">
              Aucun projet disponible
            </h3>
            <p className="text-slate-400">
              Revenez plus tard pour découvrir de nouveaux projets passionnants.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {projects.map((project) => {
              const application = getApplicationStatus(project.id)
              
              return (
                <div key={project.id} className="bg-slate-800/50 backdrop-blur-xl rounded-2xl p-6 border border-slate-700/50 hover:border-purple-500/50 transition-colors">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <h3 className="text-xl font-semibold text-white">
                          {project.title}
                        </h3>
                        <span className="px-3 py-1 rounded-full text-xs font-medium bg-purple-500/20 text-purple-400">
                          {project.project_type}
                        </span>
                        {application && (
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                            application.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400' :
                            application.status === 'accepted' ? 'bg-green-500/20 text-green-400' :
                            application.status === 'rejected' ? 'bg-red-500/20 text-red-400' :
                            'bg-gray-500/20 text-gray-400'
                          }`}>
                            {application.status === 'pending' ? '⏳ En attente' :
                             application.status === 'accepted' ? '✅ Acceptée' :
                             application.status === 'rejected' ? '❌ Refusée' :
                             application.status}
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
                          <span>📅</span>
                          <span>{new Date(project.created_at).toLocaleDateString('fr-FR')}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="ml-6">
                      {application ? (
                        <button
                          disabled
                          className="bg-slate-600 text-slate-400 px-6 py-2 rounded-lg font-medium cursor-not-allowed"
                        >
                          Déjà candidaté
                        </button>
                      ) : (
                        <button
                          onClick={() => handleApply(project.id)}
                          className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white px-6 py-2 rounded-lg font-medium transition-all"
                        >
                          Postuler
                        </button>
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
