'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'
import { Button } from '../ui/button'
import Link from 'next/link'

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
  status: string
  created_at: string
}

export default function ClientDashboardContent() {
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const getProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)

      // Récupérer le profil client
      const { data: profile } = await supabase
        .from('profiles')
        .select('*, client_profiles(*)')
        .eq('id', user.id)
        .single()

      setProfile(profile)

      // Récupérer les projets du client
      const { data: userProjects } = await supabase
        .from('projects')
        .select('*')
        .eq('client_id', user.id)
        .order('created_at', { ascending: false })

      setProjects(userProjects || [])
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

  return (
    <div className="min-h-screen bg-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl p-6 border border-slate-700/50">
            <h1 className="text-3xl font-bold text-white mb-2">
              👋 Bonjour, {profile?.full_name || user?.email}
            </h1>
            <p className="text-slate-300">
              Bienvenue sur votre espace client. Gérez vos projets d'automatisation et d'IA.
            </p>
            <div className="mt-2 text-sm text-cyan-400">
              🏢 Espace Client - Accès autorisé
            </div>
          </div>
        </div>

        {/* Stats rapides */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <div className="bg-gradient-to-br from-cyan-500/20 to-blue-500/20 rounded-2xl p-6 border border-cyan-500/30">
            <h3 className="text-cyan-400 text-sm font-medium mb-2">PROJETS ACTIFS</h3>
            <p className="text-3xl font-bold text-white">
              {projects.filter(p => p.status === 'open').length}
            </p>
          </div>
          <div className="bg-gradient-to-br from-purple-500/20 to-indigo-500/20 rounded-2xl p-6 border border-purple-500/30">
            <h3 className="text-purple-400 text-sm font-medium mb-2">PROJETS TERMINÉS</h3>
            <p className="text-3xl font-bold text-white">
              {projects.filter(p => p.status === 'completed').length}
            </p>
          </div>
          <div className="bg-gradient-to-br from-emerald-500/20 to-teal-500/20 rounded-2xl p-6 border border-emerald-500/30">
            <h3 className="text-emerald-400 text-sm font-medium mb-2">TOTAL PROJETS</h3>
            <p className="text-3xl font-bold text-white">{projects.length}</p>
          </div>
        </div>

        {/* Actions rapides */}
        <div className="mb-8">
          <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl p-6 border border-slate-700/50">
            <h2 className="text-xl font-bold text-white mb-4">Actions rapides</h2>
            <div className="flex flex-wrap gap-4">
              <Link href="/dashboard/client/create-project">
                <Button className="bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-600 hover:to-purple-600">
                  ✨ Créer un nouveau projet
                </Button>
              </Link>
              <Link href="/dashboard/client/projects">
                <Button variant="outline" className="border-slate-600 text-slate-300 hover:border-cyan-400">
                  📋 Voir tous mes projets
                </Button>
              </Link>
              <Link href="/dashboard/client/profile">
                <Button variant="outline" className="border-slate-600 text-slate-300 hover:border-cyan-400">
                  ⚙️ Modifier mon profil
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Projets récents */}
        <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl p-6 border border-slate-700/50">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-white">Projets récents</h2>
            <Link href="/dashboard/client/projects">
              <Button variant="outline" className="border-slate-600 text-slate-300 hover:border-cyan-400 text-sm">
                Voir tout
              </Button>
            </Link>
          </div>

          {projects.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🚀</div>
              <h3 className="text-xl font-semibold text-white mb-2">
                Aucun projet pour le moment
              </h3>
              <p className="text-slate-400 mb-6">
                Créez votre premier projet pour commencer à collaborer avec nos développeurs experts.
              </p>
              <Link href="/dashboard/client/create-project">
                <Button className="bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-600 hover:to-purple-600">
                  Créer mon premier projet
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {projects.slice(0, 3).map((project) => (
                <div key={project.id} className="bg-slate-700/50 rounded-xl p-4 border border-slate-600/50 hover:border-cyan-500/50 transition-colors">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-semibold text-white">{project.title}</h3>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      project.status === 'open' ? 'bg-green-500/20 text-green-400' :
                      project.status === 'in_progress' ? 'bg-yellow-500/20 text-yellow-400' :
                      project.status === 'completed' ? 'bg-blue-500/20 text-blue-400' :
                      'bg-gray-500/20 text-gray-400'
                    }`}>
                      {project.status === 'open' ? 'Ouvert' :
                       project.status === 'in_progress' ? 'En cours' :
                       project.status === 'completed' ? 'Terminé' : 'Annulé'}
                    </span>
                  </div>
                  <p className="text-slate-300 text-sm mb-3 line-clamp-2">
                    {project.description}
                  </p>
                  <div className="flex justify-between items-center">
                    <div className="text-slate-400 text-sm">
                      {project.budget_min && project.budget_max ? 
                        `${project.budget_min}€ - ${project.budget_max}€` : 
                        'Budget à définir'
                      }
                    </div>
                    <div className="text-slate-400 text-xs">
                      {new Date(project.created_at).toLocaleDateString('fr-FR')}
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
