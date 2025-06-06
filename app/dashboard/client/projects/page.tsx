'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'
import { Button } from '../../../../components/ui/button'
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
  required_skills: string[]
}

export default function AllProjects() {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const getProjects = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        window.location.href = '/auth/login'
        return
      }

      const { data } = await supabase
        .from('projects')
        .select('*')
        .eq('client_id', user.id)
        .order('created_at', { ascending: false })

      setProjects(data || [])
      setLoading(false)
    }

    getProjects()
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
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-white">📋 Tous mes projets</h1>
          <Link href="/dashboard/client/create-project">
            <Button className="bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-600 hover:to-purple-600">
              ✨ Nouveau projet
            </Button>
          </Link>
        </div>

        {projects.length === 0 ? (
          <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl p-12 border border-slate-700/50 text-center">
            <div className="text-6xl mb-4">📋</div>
            <h3 className="text-xl font-semibold text-white mb-2">
              Aucun projet créé
            </h3>
            <p className="text-slate-400 mb-6">
              Commencez par créer votre premier projet pour recevoir des propositions.
            </p>
            <Link href="/dashboard/client/create-project">
              <Button className="bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-600 hover:to-purple-600">
                Créer mon premier projet
              </Button>
            </Link>
          </div>
        ) : (
          <div className="grid gap-6">
            {projects.map((project) => (
              <div key={project.id} className="bg-slate-800/50 backdrop-blur-xl rounded-2xl p-6 border border-slate-700/50">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-xl font-semibold text-white mb-2">{project.title}</h3>
                    <p className="text-slate-300 mb-4">{project.description}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
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

                <div className="grid md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <span className="text-slate-400 text-sm">Budget:</span>
                    <p className="text-white">
                      {project.budget_min && project.budget_max ? 
                        `${project.budget_min}€ - ${project.budget_max}€` : 
                        'À définir'
                      }
                    </p>
                  </div>
                  <div>
                    <span className="text-slate-400 text-sm">Type:</span>
                    <p className="text-white capitalize">{project.project_type}</p>
                  </div>
                </div>

                {project.required_skills && project.required_skills.length > 0 && (
                  <div className="mb-4">
                    <span className="text-slate-400 text-sm">Compétences:</span>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {project.required_skills.map((skill, index) => (
                        <span key={index} className="px-2 py-1 bg-cyan-500/20 text-cyan-400 rounded-md text-xs">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex justify-between items-center">
                  <span className="text-slate-400 text-sm">
                    Créé le {new Date(project.created_at).toLocaleDateString('fr-FR')}
                  </span>
                  <div className="flex space-x-2">
                    <Button variant="outline" className="border-slate-600 text-slate-300 hover:border-cyan-400 text-sm">
                      Voir les propositions
                    </Button>
                    <Button variant="outline" className="border-slate-600 text-slate-300 hover:border-cyan-400 text-sm">
                      Modifier
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-8 text-center">
          <Link href="/dashboard/client">
            <Button variant="outline" className="border-slate-600 text-slate-300 hover:border-cyan-400">
              ← Retour au dashboard
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
