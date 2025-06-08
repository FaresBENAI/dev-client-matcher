'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

export default function DeveloperApplications() {
  const [user, setUser] = useState<any>(null)
  const [applications, setApplications] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')

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
      case 'pending': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
      case 'accepted': return 'bg-green-500/20 text-green-400 border-green-500/30'
      case 'rejected': return 'bg-red-500/20 text-red-400 border-red-500/30'
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return '⏳ En attente'
      case 'accepted': return '✅ Acceptée'
      case 'rejected': return '❌ Refusée'
      default: return status
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

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-white text-xl">Chargement des candidatures...</div>
      </div>
    )
  }

  const counts = getCounts()

  return (
    <div className="min-h-screen bg-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl p-6 border border-slate-700/50">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-bold text-white mb-2">
                  📋 Mes candidatures
                </h1>
                <p className="text-slate-300">
                  Suivez l'état de toutes vos candidatures de projets
                </p>
              </div>
              <div className="flex gap-3">
                <Link href="/dashboard/developer/projects">
                  <button className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white px-4 py-2 rounded-lg">
                    Voir les projets
                  </button>
                </Link>
                <Link href="/dashboard/developer">
                  <button className="bg-slate-600 text-slate-300 hover:bg-slate-500 px-4 py-2 rounded-lg">
                    ← Dashboard
                  </button>
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <div className="bg-gradient-to-br from-slate-500/20 to-gray-500/20 rounded-2xl p-6 border border-slate-500/30">
            <h3 className="text-slate-400 text-sm font-medium mb-2">TOTAL</h3>
            <p className="text-3xl font-bold text-white">{counts.all}</p>
          </div>
          <div className="bg-gradient-to-br from-yellow-500/20 to-orange-500/20 rounded-2xl p-6 border border-yellow-500/30">
            <h3 className="text-yellow-400 text-sm font-medium mb-2">EN ATTENTE</h3>
            <p className="text-3xl font-bold text-white">{counts.pending}</p>
          </div>
          <div className="bg-gradient-to-br from-green-500/20 to-emerald-500/20 rounded-2xl p-6 border border-green-500/30">
            <h3 className="text-green-400 text-sm font-medium mb-2">ACCEPTÉES</h3>
            <p className="text-3xl font-bold text-white">{counts.accepted}</p>
          </div>
          <div className="bg-gradient-to-br from-red-500/20 to-pink-500/20 rounded-2xl p-6 border border-red-500/30">
            <h3 className="text-red-400 text-sm font-medium mb-2">REFUSÉES</h3>
            <p className="text-3xl font-bold text-white">{counts.rejected}</p>
          </div>
        </div>

        {/* Filtres */}
        <div className="mb-6">
          <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl p-4 border border-slate-700/50">
            <div className="flex gap-4">
              <button
                onClick={() => setFilter('all')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  filter === 'all' ? 
                  'bg-gradient-to-r from-purple-500 to-pink-500 text-white' : 
                  'bg-slate-700 hover:bg-slate-600 text-slate-300'
                }`}
              >
                Toutes ({counts.all})
              </button>
              <button
                onClick={() => setFilter('pending')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  filter === 'pending' ? 
                  'bg-gradient-to-r from-yellow-500 to-orange-500 text-white' : 
                  'bg-slate-700 hover:bg-slate-600 text-slate-300'
                }`}
              >
                En attente ({counts.pending})
              </button>
              <button
                onClick={() => setFilter('accepted')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  filter === 'accepted' ? 
                  'bg-gradient-to-r from-green-500 to-emerald-500 text-white' : 
                  'bg-slate-700 hover:bg-slate-600 text-slate-300'
                }`}
              >
                Acceptées ({counts.accepted})
              </button>
              <button
                onClick={() => setFilter('rejected')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  filter === 'rejected' ? 
                  'bg-gradient-to-r from-red-500 to-pink-500 text-white' : 
                  'bg-slate-700 hover:bg-slate-600 text-slate-300'
                }`}
              >
                Refusées ({counts.rejected})
              </button>
            </div>
          </div>
        </div>

        {/* Liste des candidatures */}
        <div className="space-y-6">
          {filteredApplications.length === 0 ? (
            <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl p-12 border border-slate-700/50 text-center">
              <div className="text-6xl mb-4">📝</div>
              <h3 className="text-xl font-semibold text-white mb-2">
                Aucune candidature trouvée
              </h3>
              <p className="text-slate-400 mb-6">
                {filter === 'all' 
                  ? 'Vous n\'avez encore postulé à aucun projet.' 
                  : `Aucune candidature ${filter === 'pending' ? 'en attente' : filter === 'accepted' ? 'acceptée' : 'refusée'}.`
                }
              </p>
              <Link href="/dashboard/developer/projects">
                <button className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white px-6 py-3 rounded-lg">
                  Découvrir les projets
                </button>
              </Link>
            </div>
          ) : (
            filteredApplications.map((application) => (
              <div key={application.id} className="bg-slate-800/50 backdrop-blur-xl rounded-2xl p-6 border border-slate-700/50">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <h3 className="text-xl font-semibold text-white">
                        {application.projects?.title || 'Projet supprimé'}
                      </h3>
                      {application.projects?.project_type && (
                        <span className="px-3 py-1 rounded-full text-xs font-medium bg-purple-500/20 text-purple-400">
                          {application.projects.project_type}
                        </span>
                      )}
                      <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(application.status)}`}>
                        {getStatusText(application.status)}
                      </span>
                    </div>
                    
                    {application.projects?.description && (
                      <p className="text-slate-300 mb-4 leading-relaxed">
                        {application.projects.description}
                      </p>
                    )}

                    {application.message && (
                      <div className="bg-slate-700/50 rounded-lg p-3 mb-4">
                        <p className="text-slate-300 text-sm">
                          <span className="text-slate-400">Message du client:</span> {application.message}
                        </p>
                      </div>
                    )}

                    <div className="flex items-center gap-6 text-sm text-slate-400">
                      {application.projects?.budget_min && application.projects?.budget_max && (
                        <div className="flex items-center gap-2">
                          <span>💰</span>
                          <span>{application.projects.budget_min}€ - {application.projects.budget_max}€</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                        <span>📅</span>
                        <span>Candidature: {new Date(application.created_at).toLocaleDateString('fr-FR')}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="ml-6 flex flex-col gap-2">
                    {application.status === 'accepted' && (
                      <button className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white px-4 py-2 rounded-lg">
                        💬 Contacter le client
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
