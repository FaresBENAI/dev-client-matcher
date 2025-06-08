'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

export default function DeveloperProjects() {
  const [user, setUser] = useState<any>(null)
  const [projects, setProjects] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const init = async () => {
      // Auth check
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        window.location.href = '/auth/login'
        return
      }
      setUser(user)

      // Load projects
      const { data } = await supabase
        .from('projects')
        .select('*')
        .eq('status', 'open')

      setProjects(data || [])
      setLoading(false)
    }

    init()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-white">Chargement...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-900 p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-slate-800 rounded-lg p-6 mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-white text-2xl font-bold">Projets disponibles</h1>
              <p className="text-slate-300">{projects.length} projet(s) trouvé(s)</p>
            </div>
            <Link href="/dashboard/developer">
              <button className="bg-purple-500 text-white px-4 py-2 rounded hover:bg-purple-600">
                ← Retour
              </button>
            </Link>
          </div>
        </div>

        {/* Projects list */}
        {projects.length === 0 ? (
          <div className="bg-slate-800 rounded-lg p-8 text-center">
            <p className="text-slate-400">Aucun projet disponible pour le moment</p>
          </div>
        ) : (
          <div className="space-y-4">
            {projects.map((project) => (
              <div key={project.id} className="bg-slate-800 rounded-lg p-6">
                <h3 className="text-white text-lg font-semibold mb-2">
                  {project.title}
                </h3>
                <p className="text-slate-300 mb-4">{project.description}</p>
                
                <div className="flex justify-between items-center">
                  <div className="text-sm text-slate-400">
                    <span>Type: {project.project_type}</span>
                    {project.budget_min && (
                      <span className="ml-4">
                        Budget: {project.budget_min}€ - {project.budget_max}€
                      </span>
                    )}
                  </div>
                  <button className="bg-purple-500 text-white px-4 py-2 rounded hover:bg-purple-600">
                    Postuler
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
