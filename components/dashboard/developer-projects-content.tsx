'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Button } from '../ui/button'
import Link from 'next/link'

export default function DeveloperProjectsContent() {
  const [projects, setProjects] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [debugInfo, setDebugInfo] = useState('')

  useEffect(() => {
    const loadProjects = async () => {
      try {
        const { data, error } = await supabase
          .from('projects')
          .select('*')

        if (error) {
          setDebugInfo(`Erreur: ${error.message}`)
        } else {
          setDebugInfo(`✅ ${data?.length || 0} projets chargés`)
          setProjects(data || [])
        }
      } catch (err) {
        setDebugInfo(`❌ Erreur: ${err}`)
      }
      setLoading(false)
    }

    loadProjects()
  }, [])

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
            <h1 className="text-3xl font-bold text-white mb-2">
              🔍 Projets disponibles
            </h1>
            <div className="bg-yellow-500/10 p-3 rounded mt-3">
              <p className="text-yellow-400 text-sm">Debug: {debugInfo}</p>
            </div>
            <Link href="/dashboard/developer">
              <Button variant="outline" className="border-slate-600 text-slate-300 hover:border-purple-400 mt-4">
                ← Retour au dashboard
              </Button>
            </Link>
          </div>
        </div>

        {/* Liste des projets */}
        <div className="space-y-6">
          {projects.length === 0 ? (
            <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl p-12 border border-slate-700/50 text-center">
              <h3 className="text-xl font-semibold text-white mb-2">Aucun projet trouvé</h3>
              <p className="text-slate-400">La liste est vide.</p>
            </div>
          ) : (
            projects.map((project, index) => (
              <div key={project.id || index} className="bg-slate-800/50 backdrop-blur-xl rounded-2xl p-6 border border-slate-700/50">
                <div className="mb-4">
                  <h3 className="text-xl font-semibold text-white mb-2">
                    {project.title || 'Sans titre'}
                  </h3>
                  <p className="text-slate-300 mb-3">
                    {project.description || 'Pas de description'}
                  </p>
                  <div className="grid grid-cols-2 gap-4 text-sm text-slate-400">
                    <div>ID: {project.id}</div>
                    <div>Status: {project.status}</div>
                    <div>Type: {project.project_type}</div>
                    <div>Client: {project.client_id}</div>
                    <div>Budget: {project.budget_min}-{project.budget_max}€</div>
                    <div>Créé: {new Date(project.created_at).toLocaleDateString()}</div>
                  </div>
                </div>
                <Button className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600">
                  Postuler
                </Button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
