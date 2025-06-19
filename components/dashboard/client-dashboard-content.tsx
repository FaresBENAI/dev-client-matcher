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
          <div className="text-center">
            <h1 className="text-3xl font-black text-white mb-2">
              DASHBOARD CLIENT
            </h1>
            <p className="text-gray-300 font-medium">
              👋 Bonjour, {profile?.full_name || user?.email}
            </p>
            <p className="text-gray-400 text-sm mt-1">
              Gérez vos projets d'automatisation et d'IA
            </p>
          </div>
        </div>
      </div>

      {/* Main Content - FOND BLANC */}
      <div className="bg-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Stats rapides - FOND GRIS */}
          <div className="bg-gray-50 rounded-2xl p-8 border-2 border-gray-200 mb-8">
            <h2 className="text-2xl font-black text-black mb-6 text-center">
              VOS STATISTIQUES
            </h2>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="bg-white rounded-xl p-6 border-2 border-gray-200 hover:border-black transition-all duration-300 text-center group">
                <h3 className="text-gray-600 text-sm font-bold mb-2 uppercase tracking-wider">PROJETS ACTIFS</h3>
                <p className="text-4xl font-black text-black group-hover:text-gray-700 transition-colors">
                  {projects.filter(p => p.status === 'open').length}
                </p>
              </div>
              <div className="bg-white rounded-xl p-6 border-2 border-gray-200 hover:border-black transition-all duration-300 text-center group">
                <h3 className="text-gray-600 text-sm font-bold mb-2 uppercase tracking-wider">PROJETS TERMINÉS</h3>
                <p className="text-4xl font-black text-black group-hover:text-gray-700 transition-colors">
                  {projects.filter(p => p.status === 'completed').length}
                </p>
              </div>
              <div className="bg-white rounded-xl p-6 border-2 border-gray-200 hover:border-black transition-all duration-300 text-center group">
                <h3 className="text-gray-600 text-sm font-bold mb-2 uppercase tracking-wider">TOTAL PROJETS</h3>
                <p className="text-4xl font-black text-black group-hover:text-gray-700 transition-colors">
                  {projects.length}
                </p>
              </div>
            </div>
          </div>

          {/* Actions rapides */}
          <div className="bg-white rounded-2xl p-8 border-2 border-gray-200 mb-8">
            <h2 className="text-2xl font-black text-black mb-6">ACTIONS RAPIDES</h2>
            <div className="grid sm:grid-cols-3 gap-4">
              <Link href="/dashboard/client/create-project" className="group">
                <Button className="w-full bg-black text-white hover:bg-gray-800 border-2 border-black py-4 text-lg font-black rounded-xl transform hover:scale-105 transition-all duration-300">
                  <span className="flex items-center justify-center">
                    ✨ Créer un projet
                    <span className="ml-2 transition-transform duration-300 group-hover:translate-x-1">→</span>
                  </span>
                </Button>
              </Link>
              <Link href="/dashboard/client/projects" className="group">
                <Button className="w-full border-2 border-black text-black hover:bg-black hover:text-white py-4 text-lg font-black rounded-xl bg-transparent transform hover:scale-105 transition-all duration-300">
                  <span className="flex items-center justify-center">
                    📋 Mes projets
                    <span className="ml-2 transition-transform duration-300 group-hover:translate-x-1">→</span>
                  </span>
                </Button>
              </Link>
              <Link href="/dashboard/client/profile" className="group">
                <Button className="w-full border-2 border-black text-black hover:bg-black hover:text-white py-4 text-lg font-black rounded-xl bg-transparent transform hover:scale-105 transition-all duration-300">
                  <span className="flex items-center justify-center">
                    ⚙️ Mon profil
                    <span className="ml-2 transition-transform duration-300 group-hover:translate-x-1">→</span>
                  </span>
                </Button>
              </Link>
            </div>
          </div>

          {/* Projets récents - FOND GRIS */}
          <div className="bg-gray-50 rounded-2xl p-8 border-2 border-gray-200">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-black text-black">PROJETS RÉCENTS</h2>
              <Link href="/dashboard/client/projects">
                <Button className="border-2 border-black text-black hover:bg-black hover:text-white font-black px-4 py-2 rounded-lg transform hover:scale-105 transition-all duration-300">
                  Voir tout →
                </Button>
              </Link>
            </div>

            {projects.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-24 h-24 bg-white rounded-3xl flex items-center justify-center mx-auto mb-6 border-2 border-gray-200">
                  <span className="text-4xl">🚀</span>
                </div>
                <h3 className="text-2xl font-black text-black mb-3">
                  Aucun projet pour le moment
                </h3>
                <p className="text-gray-600 font-medium mb-8 max-w-md mx-auto leading-relaxed">
                  Créez votre premier projet pour commencer à collaborer avec nos développeurs experts.
                </p>
                <Link href="/dashboard/client/create-project">
                  <Button className="bg-black text-white hover:bg-gray-800 border-2 border-black font-black px-8 py-4 text-lg rounded-xl transform hover:scale-105 transition-all duration-300">
                    Créer mon premier projet
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {projects.slice(0, 3).map((project) => (
                  <div key={project.id} className="bg-white rounded-xl p-6 border-2 border-gray-200 hover:border-black transition-all duration-300 hover:shadow-lg group">
                    <div className="flex justify-between items-start mb-3">
                      <h3 className="font-black text-black text-lg group-hover:text-gray-700 transition-colors">
                        {project.title}
                      </h3>
                      <span className={`px-3 py-1 rounded-full text-xs font-bold border-2 ${
                        project.status === 'open' ? 'bg-white text-black border-black' :
                        project.status === 'in_progress' ? 'bg-white text-black border-gray-400' :
                        project.status === 'completed' ? 'bg-black text-white border-black' :
                        'bg-gray-200 text-gray-600 border-gray-300'
                      }`}>
                        {project.status === 'open' ? '● OUVERT' :
                         project.status === 'in_progress' ? '● EN COURS' :
                         project.status === 'completed' ? '● TERMINÉ' : '● ANNULÉ'}
                      </span>
                    </div>
                    <p className="text-gray-600 font-medium mb-4 leading-relaxed">
                      {project.description.length > 120 ? 
                        project.description.substring(0, 120) + '...' : 
                        project.description
                      }
                    </p>
                    <div className="flex justify-between items-center">
                      <div className="text-black font-bold">
                        {project.budget_min && project.budget_max ? 
                          `${project.budget_min}€ - ${project.budget_max}€` : 
                          'Budget à définir'
                        }
                      </div>
                      <div className="text-gray-400 text-sm font-medium">
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
    </div>
  )
}

