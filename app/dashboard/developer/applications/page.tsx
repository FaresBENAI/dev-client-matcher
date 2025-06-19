'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

export default function DeveloperApplications() {
  const [user, setUser] = useState<any>(null)
  const [applications, setApplications] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [viewMode, setViewMode] = useState<'cards' | 'timeline'>('cards')

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        window.location.href = '/auth/login'
        return
      }
      setUser(user)

      // Récupérer toutes les candidatures avec les détails du projet
      const { data: userApplications } = await supabase
        .from('project_applications')
        .select(`
          *,
          projects (
            id,
            title,
            description,
            project_type,
            budget_min,
            budget_max,
            status,
            client_id
          )
        `)
        .eq('developer_id', user.id)
        .order('created_at', { ascending: false })

      console.log('Applications récupérées:', userApplications)
      setApplications(userApplications || [])
      setLoading(false)
    }

    init()
  }, [])

  const filteredApplications = applications.filter(app => {
    if (filter === 'pending') return app.status === 'pending'
    if (filter === 'accepted') return app.status === 'accepted'
    if (filter === 'rejected') return app.status === 'rejected'
    return true
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-white text-black border-black'
      case 'accepted': return 'bg-black text-white border-black'
      case 'rejected': return 'bg-gray-300 text-gray-600 border-gray-300'
      default: return 'bg-gray-300 text-gray-600 border-gray-300'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return '⏳ EN ATTENTE'
      case 'accepted': return '✅ ACCEPTÉE'
      case 'rejected': return '❌ REFUSÉE'
      default: return status.toUpperCase()
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return '⏳'
      case 'accepted': return '✅'
      case 'rejected': return '❌'
      default: return '📄'
    }
  }

  const getCounts = () => {
    return {
      all: applications.length,
      pending: applications.filter(app => app.status === 'pending').length,
      accepted: applications.filter(app => app.status === 'accepted').length,
      rejected: applications.filter(app => app.status === 'rejected').length
    }
  }

  const getSuccessRate = () => {
    const total = applications.length
    const accepted = applications.filter(app => app.status === 'accepted').length
    return total > 0 ? Math.round((accepted / total) * 100) : 0
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

  const counts = getCounts()
  const successRate = getSuccessRate()

  return (
    <div className="min-h-screen bg-white">
      {/* Header Section - FOND NOIR avec metrics animées NOUVEAUTÉ */}
      <div className="bg-black py-12 relative overflow-hidden">
        {/* Animation de particules flottantes */}
        <div className="absolute inset-0 opacity-20">
          {[...Array(15)].map((_, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 bg-white rounded-full animate-pulse"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 3}s`,
                animationDuration: `${2 + Math.random() * 2}s`
              }}
            />
          ))}
        </div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-black text-white mb-4">
              MES CANDIDATURES
            </h1>
            <p className="text-xl text-gray-300 font-medium">
              Suivez l'état de toutes vos candidatures
            </p>
          </div>

          {/* Dashboard metrics avec animations NOUVEAUTÉ */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="bg-white bg-opacity-10 backdrop-blur rounded-xl p-4 border border-white border-opacity-20 text-center">
              <div className="text-3xl font-black text-white mb-1">{counts.all}</div>
              <div className="text-gray-300 text-sm font-medium">TOTAL</div>
            </div>
            <div className="bg-white bg-opacity-10 backdrop-blur rounded-xl p-4 border border-white border-opacity-20 text-center">
              <div className="text-3xl font-black text-white mb-1">{counts.pending}</div>
              <div className="text-gray-300 text-sm font-medium">EN ATTENTE</div>
            </div>
            <div className="bg-white bg-opacity-10 backdrop-blur rounded-xl p-4 border border-white border-opacity-20 text-center">
              <div className="text-3xl font-black text-white mb-1">{counts.accepted}</div>
              <div className="text-gray-300 text-sm font-medium">ACCEPTÉES</div>
            </div>
            <div className="bg-white bg-opacity-10 backdrop-blur rounded-xl p-4 border border-white border-opacity-20 text-center">
              <div className="text-3xl font-black text-white mb-1">{counts.rejected}</div>
              <div className="text-gray-300 text-sm font-medium">REFUSÉES</div>
            </div>
            <div className="bg-white bg-opacity-10 backdrop-blur rounded-xl p-4 border border-white border-opacity-20 text-center">
              <div className="text-3xl font-black text-white mb-1">{successRate}%</div>
              <div className="text-gray-300 text-sm font-medium">SUCCÈS</div>
            </div>
          </div>
        </div>
      </div>

      {/* Controls Section - FOND GRIS */}
      <div className="bg-gray-50 border-b-2 border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col lg:flex-row justify-between items-center gap-4">
            
            {/* Filtres avec compteurs */}
            <div className="flex gap-2 overflow-x-auto">
              {[
                { key: 'all', label: 'Toutes', count: counts.all, color: 'bg-black text-white' },
                { key: 'pending', label: 'En attente', count: counts.pending, color: 'bg-white text-black border-black' },
                { key: 'accepted', label: 'Acceptées', count: counts.accepted, color: 'bg-black text-white' },
                { key: 'rejected', label: 'Refusées', count: counts.rejected, color: 'bg-gray-400 text-gray-600' }
              ].map((filterOption) => (
                <button
                  key={filterOption.key}
                  onClick={() => setFilter(filterOption.key)}
                  className={`px-4 py-2 rounded-xl font-black text-sm transition-all duration-300 transform hover:scale-105 border-2 ${
                    filter === filterOption.key
                      ? filterOption.color + ' border-current'
                      : 'bg-white text-black border-gray-300 hover:border-black'
                  }`}
                >
                  {filterOption.label} ({filterOption.count})
                </button>
              ))}
            </div>

            {/* Mode d'affichage + actions */}
            <div className="flex items-center gap-3">
              <div className="flex bg-white rounded-lg border-2 border-gray-300 p-1">
                <button
                  onClick={() => setViewMode('cards')}
                  className={`px-3 py-1 rounded font-black text-sm transition-all ${
                    viewMode === 'cards' 
                      ? 'bg-black text-white' 
                      : 'text-black hover:bg-gray-100'
                  }`}
                >
                  ⚏ Cards
                </button>
                <button
                  onClick={() => setViewMode('timeline')}
                  className={`px-3 py-1 rounded font-black text-sm transition-all ${
                    viewMode === 'timeline' 
                      ? 'bg-black text-white' 
                      : 'text-black hover:bg-gray-100'
                  }`}
                >
                  📅 Timeline
                </button>
              </div>

              <div className="flex gap-2">
                <Link href="/dashboard/developer/projects">
                  <button className="bg-black text-white hover:bg-gray-800 border-2 border-black font-black px-4 py-2 rounded-lg transform hover:scale-105 transition-all duration-300">
                    Voir projets
                  </button>
                </Link>
                <Link href="/dashboard/developer">
                  <button className="border-2 border-black text-black hover:bg-black hover:text-white font-black px-4 py-2 rounded-lg bg-transparent transform hover:scale-105 transition-all duration-300">
                    ← Dashboard
                  </button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content - FOND BLANC */}
      <div className="bg-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {filteredApplications.length === 0 ? (
            <div className="text-center py-16 bg-gray-50 rounded-2xl border-2 border-gray-200">
              <div className="w-24 h-24 bg-white rounded-3xl flex items-center justify-center mx-auto mb-6 border-2 border-gray-200">
                <span className="text-4xl">📝</span>
              </div>
              <h3 className="text-2xl font-black text-black mb-3">
                Aucune candidature trouvée
              </h3>
              <p className="text-gray-600 font-medium mb-6">
                {filter === 'all' 
                  ? 'Vous n\'avez encore postulé à aucun projet.' 
                  : `Aucune candidature ${filter === 'pending' ? 'en attente' : filter === 'accepted' ? 'acceptée' : 'refusée'}.`
                }
              </p>
              <Link href="/dashboard/developer/projects">
                <button className="bg-black text-white hover:bg-gray-800 border-2 border-black font-black px-6 py-3 rounded-xl transform hover:scale-105 transition-all duration-300">
                  Découvrir les projets
                </button>
              </Link>
            </div>
          ) : viewMode === 'cards' ? (
            // Mode Cards
            <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredApplications.map((application) => (
                <div key={application.id} className="bg-gray-50 rounded-2xl p-6 border-2 border-gray-200 hover:border-black transition-all duration-300 hover:shadow-lg hover:-translate-y-1 group">
                  <div className="flex justify-between items-start mb-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold border-2 ${getStatusColor(application.status)}`}>
                      {getStatusText(application.status)}
                    </span>
                    <span className="text-2xl">{getStatusIcon(application.status)}</span>
                  </div>
                  
                  <h3 className="text-lg font-black text-black mb-2 group-hover:text-gray-700 transition-colors line-clamp-2">
                    {application.projects?.title || 'Projet supprimé'}
                  </h3>
                  
                  {application.projects?.project_type && (
                    <span className="inline-block px-2 py-1 bg-black text-white rounded text-xs font-bold mb-3">
                      {application.projects.project_type === 'automation' ? '🤖 AUTO' :
                       application.projects.project_type === 'ai' ? '🧠 IA' :
                       application.projects.project_type === 'chatbot' ? '💬 BOT' :
                       application.projects.project_type === 'data_analysis' ? '📊 DATA' : '🔧 AUTRE'}
                    </span>
                  )}
                  
                  {application.projects?.description && (
                    <p className="text-gray-600 text-sm mb-4 line-clamp-3 font-medium leading-relaxed">
                      {application.projects.description}
                    </p>
                  )}

                  {application.message && (
                    <div className="bg-white rounded-lg p-3 mb-4 border-2 border-gray-200">
                      <p className="text-gray-700 text-sm font-medium">
                        <span className="text-black font-black">Client:</span> {application.message}
                      </p>
                    </div>
                  )}

                  <div className="space-y-2 text-sm">
                    {application.projects?.budget_min && application.projects?.budget_max && (
                      <div className="flex items-center gap-2 text-black font-medium">
                        <span>💰</span>
                        <span>{application.projects.budget_min}€ - {application.projects.budget_max}€</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-gray-500 font-medium">
                      <span>📅</span>
                      <span>{new Date(application.created_at).toLocaleDateString('fr-FR')}</span>
                    </div>
                  </div>
                  
                  {application.status === 'accepted' && (
                    <button className="w-full mt-4 bg-black text-white hover:bg-gray-800 border-2 border-black font-black py-2 rounded-lg transform hover:scale-105 transition-all duration-300">
                      💬 Contacter le client
                    </button>
                  )}
                </div>
              ))}
            </div>
          ) : (
            // Mode Timeline - NOUVEAUTÉ
            <div className="max-w-4xl mx-auto">
              <div className="relative">
                {/* Ligne centrale */}
                <div className="absolute left-8 top-0 bottom-0 w-1 bg-gray-300"></div>
                
                <div className="space-y-8">
                  {filteredApplications.map((application, index) => (
                    <div key={application.id} className="relative flex items-start">
                      {/* Point sur la timeline */}
                      <div className={`w-16 h-16 rounded-full border-4 border-white shadow-lg flex items-center justify-center text-2xl z-10 ${
                        application.status === 'pending' ? 'bg-white border-black' :
                        application.status === 'accepted' ? 'bg-black border-black' :
                        'bg-gray-400 border-gray-400'
                      }`}>
                        {getStatusIcon(application.status)}
                      </div>
                      
                      {/* Contenu */}
                      <div className="ml-8 flex-1 bg-gray-50 rounded-2xl p-6 border-2 border-gray-200 hover:border-black transition-all duration-300">
                        <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className="text-xl font-black text-black">
                                {application.projects?.title || 'Projet supprimé'}
                              </h3>
                              {application.projects?.project_type && (
                                <span className="px-3 py-1 bg-black text-white rounded-full text-xs font-bold">
                                  {application.projects.project_type === 'automation' ? '🤖 AUTO' :
                                   application.projects.project_type === 'ai' ? '🧠 IA' :
                                   application.projects.project_type === 'chatbot' ? '💬 BOT' :
                                   application.projects.project_type === 'data_analysis' ? '📊 DATA' : '🔧 AUTRE'}
                                </span>
                              )}
                            </div>
                            
                            {application.projects?.description && (
                              <p className="text-gray-600 mb-4 font-medium leading-relaxed">
                                {application.projects.description}
                              </p>
                            )}

                            {application.message && (
                              <div className="bg-white rounded-lg p-4 mb-4 border-2 border-gray-200">
                                <p className="text-gray-700 font-medium">
                                  <span className="text-black font-black">Message du client:</span> {application.message}
                                </p>
                              </div>
                            )}

                            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                              {application.projects?.budget_min && application.projects?.budget_max && (
                                <div className="flex items-center gap-2 font-medium">
                                  <span>💰</span>
                                  <span>{application.projects.budget_min}€ - {application.projects.budget_max}€</span>
                                </div>
                              )}
                              <div className="flex items-center gap-2 font-medium">
                                <span>📅</span>
                                <span>Candidature: {new Date(application.created_at).toLocaleDateString('fr-FR')}</span>
                              </div>
                            </div>
                          </div>
                          
                          <div className="lg:w-48 flex flex-col items-center gap-3">
                            <span className={`px-4 py-2 rounded-xl text-sm font-black border-2 ${getStatusColor(application.status)}`}>
                              {getStatusText(application.status)}
                            </span>
                            
                            {application.status === 'accepted' && (
                              <button className="bg-black text-white hover:bg-gray-800 border-2 border-black font-black px-4 py-2 rounded-lg transform hover:scale-105 transition-all duration-300">
                                💬 Contacter
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
