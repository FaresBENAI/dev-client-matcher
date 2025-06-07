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
  client: {
    full_name: string
    company: string
  }
}

interface Application {
  id: string
  status: string
  created_at: string
  project: Project
}

export default function DeveloperDashboardContent() {
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [applications, setApplications] = useState<Application[]>([])
  const [availableProjects, setAvailableProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const getProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)

      // Récupérer le profil développeur
      const { data: profile } = await supabase
        .from('profiles')
        .select('*, developer_profiles(*)')
        .eq('id', user.id)
        .single()

      setProfile(profile)

      // Récupérer les candidatures du développeur
      const { data: userApplications } = await supabase
        .from('project_applications')
        .select(`
          *,
          project:projects(
            *,
            client:profiles(full_name, company)
          )
        `)
        .eq('developer_id', user.id)
        .order('created_at', { ascending: false })

      setApplications(userApplications || [])

      // Récupérer les projets disponibles (pas encore postulé)
      const appliedProjectIds = userApplications?.map(app => app.project.id) || []
      const { data: projects } = await supabase
        .from('projects')
        .select(`
          *,
          client:profiles(full_name, company)
        `)
        .eq('status', 'open')
        .not('id', 'in', `(${appliedProjectIds.length > 0 ? appliedProjectIds.join(',') : '0'})`)
        .limit(5)

      setAvailableProjects(projects || [])
      setLoading(false)
    }

    getProfile()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-white text-xl">Chargement...</div>
      </div>
    )
  }

  const stats = {
    activeApplications: applications.filter(app => app.status === 'pending').length,
    acceptedProjects: applications.filter(app => app.status === 'accepted').length,
    completedProjects: applications.filter(app => app.status === 'completed').length,
    totalEarnings: 0 // À calculer depuis la DB
  }

  return (
    <div className="min-h-screen bg-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl p-6 border border-slate-700/50">
            <h1 className="text-3xl font-bold text-white mb-2">
              💻 Bonjour, {profile?.full_name || user?.email}
            </h1>
            <p className="text-slate-300">
              Bienvenue sur votre espace développeur. Découvrez de nouveaux projets passionnants.
            </p>
            <div className="mt-2 text-sm text-purple-400">
              🔧 Espace Développeur - Automatisation & IA
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <div className="bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-2xl p-6 border border-blue-500/30">
            <h3 className="text-blue-400 text-sm font-medium mb-2">CANDIDATURES ACTIVES</h3>
            <p className="text-3xl font-bold text-white">{stats.activeApplications}</p>
          </div>
          <div className="bg-gradient-to-br from-green-500/20 to-emerald-500/20 rounded-2xl p-6 border border-green-500/30">
            <h3 className="text-green-400 text-sm font-medium mb-2">PROJETS ACCEPTÉS</h3>
            <p className="text-3xl font-bold text-white">{stats.acceptedProjects}</p>
          </div>
          <div className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-2xl p-6 border border-purple-500/30">
            <h3 className="text-purple-400 text-sm font-medium mb-2">PROJETS TERMINÉS</h3>
            <p className="text-3xl font-bold text-white">{stats.completedProjects}</p>
          </div>
          <div className="bg-gradient-to-br from-yellow-500/20 to-orange-500/20 rounded-2xl p-6 border border-yellow-500/30">
            <h3 className="text-yellow-400 text-sm font-medium mb-2">REVENUS TOTAUX</h3>
            <p className="text-3xl font-bold text-white">€{stats.totalEarnings}</p>
          </div>
        </div>

        {/* Actions rapides */}
        <div className="mb-8">
          <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl p-6 border border-slate-700/50">
            <h2 className="text-xl font-bold text-white mb-4">Actions rapides</h2>
            <div className="flex flex-wrap gap-4">
              <Link href="/dashboard/developer/projects">
                <Button className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600">
                  🔍 Parcourir les projets
                </Button>
              </Link>
              <Link href="/dashboard/developer/applications">
                <Button variant="outline" className="border-slate-600 text-slate-300 hover:border-purple-400">
                  📋 Mes candidatures
                </Button>
              </Link>
              <Link href="/dashboard/developer/profile">
                <Button variant="outline" className="border-slate-600 text-slate-300 hover:border-purple-400">
                  👤 Mon profil
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Projets disponibles */}
        <div className="mb-8">
          <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl p-6 border border-slate-700/50">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-white">Nouveaux projets disponibles</h2>
              <Link href="/dashboard/developer/projects">
                <Button variant="outline" className="border-slate-600 text-slate-300 hover:border-purple-400 text-sm">
                  Voir tout
                </Button>
              </Link>
            </div>

            {availableProjects.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">🔍</div>
                <h3 className="text-xl font-semibold text-white mb-2">
                  Aucun nouveau projet
                </h3>
                <p className="text-slate-400 mb-6">
                  Revenez plus tard pour découvrir de nouveaux projets passionnants.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {availableProjects.map((project) => (
                  <div key={project.id} className="bg-slate-700/50 rounded-xl p-4 border border-slate-600/50 hover:border-purple-500/50 transition-colors">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-semibold text-white">{project.title}</h3>
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-500/20 text-green-400">
                        {project.project_type}
                      </span>
                    </div>
                    <p className="text-slate-300 text-sm mb-3 line-clamp-2">
                      {project.description}
                    </p>
                    <div className="flex justify-between items-center">
                      <div className="text-slate-400 text-sm">
                        {project.budget_min && project.budget_max ? 
                          `${project.budget_min}€ - ${project.budget_max}€` : 
                          'Budget à négocier'
                        }
                      </div>
                      <div className="text-slate-400 text-xs">
                        Client: {project.client?.full_name || 'Anonyme'}
                      </div>
                    </div>
                    <div className="mt-3 flex justify-end">
                      <Button size="sm" className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600">
                        Postuler
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Candidatures récentes */}
        <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl p-6 border border-slate-700/50">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-white">Mes candidatures récentes</h2>
            <Link href="/dashboard/developer/applications">
              <Button variant="outline" className="border-slate-600 text-slate-300 hover:border-purple-400 text-sm">
                Voir tout
              </Button>
            </Link>
          </div>

          {applications.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">📋</div>
              <h3 className="text-xl font-semibold text-white mb-2">
                Aucune candidature
              </h3>
              <p className="text-slate-400 mb-6">
                Commencez à postuler sur des projets qui vous intéressent.
              </p>
              <Link href="/dashboard/developer/projects">
                <Button className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600">
                  Découvrir les projets
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {applications.slice(0, 3).map((application) => (
                <div key={application.id} className="bg-slate-700/50 rounded-xl p-4 border border-slate-600/50">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-semibold text-white">{application.project.title}</h3>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      application.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400' :
                      application.status === 'accepted' ? 'bg-green-500/20 text-green-400' :
                      application.status === 'rejected' ? 'bg-red-500/20 text-red-400' :
                      'bg-gray-500/20 text-gray-400'
                    }`}>
                      {application.status === 'pending' ? 'En attente' :
                       application.status === 'accepted' ? 'Acceptée' :
                       application.status === 'rejected' ? 'Refusée' : application.status}
                    </span>
                  </div>
                  <p className="text-slate-300 text-sm mb-3 line-clamp-2">
                    {application.project.description}
                  </p>
                  <div className="flex justify-between items-center">
                    <div className="text-slate-400 text-sm">
                      Client: {application.project.client?.full_name || 'Anonyme'}
                    </div>
                    <div className="text-slate-400 text-xs">
                      {new Date(application.created_at).toLocaleDateString('fr-FR')}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
