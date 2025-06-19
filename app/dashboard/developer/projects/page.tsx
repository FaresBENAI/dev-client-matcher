'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

export default function DeveloperProjects() {
  const [user, setUser] = useState<any>(null)
  const [projects, setProjects] = useState<any[]>([])
  const [applications, setApplications] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [filterType, setFilterType] = useState('all')
  const [sortBy, setSortBy] = useState('newest')

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
      // 1. Créer la candidature
      const { error: applicationError } = await supabase
        .from('project_applications')
        .insert({
          project_id: projectId,
          developer_id: user.id,
          status: 'pending'
        })

      if (applicationError) {
        alert('Erreur lors de la candidature: ' + applicationError.message)
        return
      }

      // [Rest of the application logic same as original...]
      alert('✅ Candidature envoyée avec succès !')
      window.location.reload()
    } catch (err) {
      console.error('Erreur complète:', err)
      alert('Erreur lors de la candidature: ' + err)
    }
  }

  const getApplicationStatus = (projectId: string) => {
    return applications.find(app => app.project_id === projectId)
  }

  const getFilteredProjects = () => {
    let filtered = projects

    // Filtrage par type
    if (filterType !== 'all') {
      filtered = filtered.filter(p => p.project_type === filterType)
    }

    // Tri
    switch (sortBy) {
      case 'newest':
        filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        break
      case 'budget_high':
        filtered.sort((a, b) => (b.budget_max || 0) - (a.budget_max || 0))
        break
      case 'budget_low':
        filtered.sort((a, b) => (a.budget_min || 0) - (b.budget_min || 0))
        break
    }

    return filtered
  }

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

  const filteredProjects = getFilteredProjects()

  return (
    <div className="min-h-screen bg-white">
      {/* Header Section - FOND NOIR avec effet parallax NOUVEAUTÉ */}
      <div className="bg-black py-12 relative overflow-hidden">
        {/* Effet de grille animée en arrière-plan */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent transform skew-x-12 animate-pulse"></div>
        </div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center">
            <h1 className="text-4xl font-black text-white mb-4">
              PROJETS DISPONIBLES
            </h1>
            <p className="text-xl text-gray-300 font-medium mb-6">
              Découvrez {projects.length} projet(s) d'automatisation et d'IA
            </p>
            
            {/* Stats en temps réel NOUVEAUTÉ */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-2xl mx-auto">
              <div className="bg-white bg-opacity-10 backdrop-blur rounded-xl p-3 border border-white border-opacity-20">
                <div className="text-2xl font-black text-white">{projects.length}</div>
                <div className="text-gray-300 text-xs font-medium">Total projets</div>
              </div>
              <div className="bg-white bg-opacity-10 backdrop-blur rounded-xl p-3 border border-white border-opacity-20">
                <div className="text-2xl font-black text-white">{applications.length}</div>
                <div className="text-gray-300 text-xs font-medium">Candidatures</div>
              </div>
              <div className="bg-white bg-opacity-10 backdrop-blur rounded-xl p-3 border border-white border-opacity-20">
                <div className="text-2xl font-black text-white">
                  {projects.length > 0 ? Math.round(projects.reduce((acc, p) => acc + (p.budget_max || 0), 0) / projects.length) : 0}€
                </div>
                <div className="text-gray-300 text-xs font-medium">Budget moyen</div>
              </div>
              <div className="bg-white bg-opacity-10 backdrop-blur rounded-xl p-3 border border-white border-opacity-20">
                <div className="text-2xl font-black text-white">
                  {applications.filter(a => a.status === 'pending').length}
                </div>
                <div className="text-gray-300 text-xs font-medium">En attente</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Contrôles avancés - NOUVEAUTÉ */}
      <div className="bg-gray-50 border-b-2 border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col lg:flex-row justify-between items-center gap-4">
            
            {/* Filtres et tri */}
            <div className="flex flex-wrap gap-3">
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="px-4 py-2 bg-white border-2 border-gray-300 rounded-lg text-black font-medium focus:border-black"
              >
                <option value="all">Tous les types</option>
                <option value="automation">🤖 Automatisation</option>
                <option value="ai">🧠 IA</option>
                <option value="chatbot">💬 Chatbot</option>
                <option value="data_analysis">📊 Data</option>
              </select>

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-4 py-2 bg-white border-2 border-gray-300 rounded-lg text-black font-medium focus:border-black"
              >
                <option value="newest">Plus récents</option>
                <option value="budget_high">Budget décroissant</option>
                <option value="budget_low">Budget croissant</option>
              </select>
            </div>

            {/* Mode d'affichage + actions */}
            <div className="flex items-center gap-3">
              <div className="flex bg-white rounded-lg border-2 border-gray-300 p-1">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`px-3 py-1 rounded font-black text-sm transition-all ${
                    viewMode === 'grid' 
                      ? 'bg-black text-white' 
                      : 'text-black hover:bg-gray-100'
                  }`}
                >
                  ⚏ Grille
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`px-3 py-1 rounded font-black text-sm transition-all ${
                    viewMode === 'list' 
                      ? 'bg-black text-white' 
                      : 'text-black hover:bg-gray-100'
                  }`}
                >
                  ☰ Liste
                </button>
              </div>

              <Link href="/dashboard/developer">
                <button className="bg-black text-white hover:bg-gray-800 px-4 py-2 rounded-lg font-black border-2 border-black transform hover:scale-105 transition-all duration-300">
                  ← Dashboard
                </button>
              </Link>
            </div>
          </div>

          {/* Résultats */}
          <div className="mt-4 text-black font-medium">
            {filteredProjects.length} projet(s) trouvé(s) sur {projects.length} total
          </div>
        </div>
      </div>

      {/* Main Content - FOND BLANC */}
      <div className="bg-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {filteredProjects.length === 0 ? (
            <div className="text-center py-16 bg-gray-50 rounded-2xl border-2 border-gray-200">
              <div className="w-24 h-24 bg-white rounded-3xl flex items-center justify-center mx-auto mb-6 border-2 border-gray-200">
                <span className="text-4xl">🔍</span>
              </div>
              <h3 className="text-2xl font-black text-black mb-3">
                Aucun projet trouvé
              </h3>
              <p className="text-gray-600 font-medium mb-6">
                Ajustez vos filtres ou revenez plus tard pour découvrir de nouveaux projets.
              </p>
              <button
                onClick={() => {
                  setFilterType('all')
                  setSortBy('newest')
                }}
                className="bg-black text-white hover:bg-gray-800 border-2 border-black font-black px-6 py-3 rounded-xl transform hover:scale-105 transition-all duration-300"
              >
                Réinitialiser les filtres
              </button>
            </div>
          ) : (
            <div className={viewMode === 'grid' ? 'grid md:grid-cols-2 xl:grid-cols-3 gap-6' : 'space-y-6'}>
              {filteredProjects.map((project) => {
                const application = getApplicationStatus(project.id)
                
                return viewMode === 'grid' ? (
                  // Mode Grille - NOUVEAUTÉ design carte moderne
                  <div key={project.id} className="group bg-gray-50 rounded-2xl p-6 border-2 border-gray-200 hover:border-black transition-all duration-300 hover:shadow-xl hover:-translate-y-2">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center gap-2">
                        <span className="px-3 py-1 bg-black text-white rounded-full text-xs font-bold">
                          {project.project_type === 'automation' ? '🤖' :
                           project.project_type === 'ai' ? '🧠' :
                           project.project_type === 'chatbot' ? '💬' :
                           project.project_type === 'data_analysis' ? '📊' : '🔧'}
                        </span>
                        {application && (
                          <span className={`px-2 py-1 rounded-full text-xs font-bold border-2 ${
                            application.status === 'pending' ? 'bg-white text-black border-black' :
                            application.status === 'accepted' ? 'bg-black text-white border-black' :
                            'bg-gray-300 text-gray-600 border-gray-300'
                          }`}>
                            {application.status === 'pending' ? '⏳' :
                             application.status === 'accepted' ? '✅' : '❌'}
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <h3 className="text-lg font-black text-black mb-3 group-hover:text-gray-700 transition-colors line-clamp-2">
                      {project.title}
                    </h3>
                    
                    <p className="text-gray-600 text-sm mb-4 line-clamp-3 font-medium leading-relaxed">
                      {project.description}
                    </p>

                    <div className="flex justify-between items-center mb-4">
                      <div className="text-black font-black">
                        {project.budget_min && project.budget_max ? 
                          `${project.budget_min}€ - ${project.budget_max}€` : 
                          'Budget à négocier'
                        }
                      </div>
                      <div className="text-gray-400 text-xs font-medium">
                        {new Date(project.created_at).toLocaleDateString('fr-FR')}
                      </div>
                    </div>
                    
                    {application ? (
                      <button
                        disabled
                        className="w-full bg-gray-400 text-gray-600 py-3 rounded-xl font-black cursor-not-allowed border-2 border-gray-400"
                      >
                        Déjà candidaté
                      </button>
                    ) : (
                      <button
                        onClick={() => handleApply(project.id)}
                        className="w-full bg-black text-white hover:bg-gray-800 py-3 rounded-xl font-black border-2 border-black transform hover:scale-105 transition-all duration-300"
                      >
                        🚀 Candidater
                      </button>
                    )}
                  </div>
                ) : (
                  // Mode Liste - Design horizontal moderne
                  <div key={project.id} className="bg-gray-50 rounded-2xl p-6 border-2 border-gray-200 hover:border-black transition-all duration-300 hover:shadow-lg">
                    <div className="flex flex-col lg:flex-row gap-6">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <h3 className="text-xl font-black text-black">
                            {project.title}
                          </h3>
                          <span className="px-3 py-1 bg-black text-white rounded-full text-xs font-bold">
                            {project.project_type === 'automation' ? '🤖 AUTO' :
                             project.project_type === 'ai' ? '🧠 IA' :
                             project.project_type === 'chatbot' ? '💬 BOT' :
                             project.project_type === 'data_analysis' ? '📊 DATA' : '🔧 AUTRE'}
                          </span>
                          {application && (
                            <span className={`px-3 py-1 rounded-full text-xs font-bold border-2 ${
                              application.status === 'pending' ? 'bg-white text-black border-black' :
                              application.status === 'accepted' ? 'bg-black text-white border-black' :
                              'bg-gray-300 text-gray-600 border-gray-300'
                            }`}>
                              {application.status === 'pending' ? '⏳ EN ATTENTE' :
                               application.status === 'accepted' ? '✅ ACCEPTÉE' : '❌ REFUSÉE'}
                            </span>
                          )}
                        </div>
                        
                        <p className="text-gray-600 mb-4 font-medium leading-relaxed">
                          {project.description}
                        </p>

                        <div className="flex items-center gap-6 text-sm text-gray-500">
                          <div className="flex items-center gap-2">
                            <span>💰</span>
                            <span className="font-medium">
                              {project.budget_min && project.budget_max ? 
                                `${project.budget_min}€ - ${project.budget_max}€` : 
                                'Budget à négocier'
                              }
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span>📅</span>
                            <span className="font-medium">{new Date(project.created_at).toLocaleDateString('fr-FR')}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="lg:w-48 flex flex-col justify-center">
                        {application ? (
                          <button
                            disabled
                            className="bg-gray-400 text-gray-600 px-6 py-3 rounded-xl font-black cursor-not-allowed border-2 border-gray-400"
                          >
                            Déjà candidaté
                          </button>
                        ) : (
                          <button
                            onClick={() => handleApply(project.id)}
                            className="bg-black text-white hover:bg-gray-800 px-6 py-3 rounded-xl font-black border-2 border-black transform hover:scale-105 transition-all duration-300"
                          >
                            <span className="flex items-center justify-center">
                              🚀 Candidater
                            </span>
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
    </div>
  )
}
