'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Button } from '../ui/button'
import Link from 'next/link'

interface Application {
  id: string
  status: string
  created_at: string
  updated_at: string
  message: string
  project: {
    id: string
    title: string
    description: string
    project_type: string
    budget_min: number
    budget_max: number
    status: string
    profiles: {
      full_name: string
      company: string
    }
  }
}

export default function DeveloperApplicationsContent() {
  const [user, setUser] = useState<any>(null)
  const [applications, setApplications] = useState<Application[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    const loadApplications = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)

      // Récupérer toutes les candidatures avec les détails du projet
      const { data: userApplications } = await supabase
        .from('project_applications')
        .select(`
          *,
          project:projects(
            *,
            profiles:client_id(full_name, company)
          )
        `)
        .eq('developer_id', user.id)
        .order('created_at', { ascending: false })

      setApplications(userApplications || [])
      setLoading(false)
    }

    loadApplications()
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

  const getStatusCounts = () => {
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

  const counts = getStatusCounts()

  return (
    <div className="min-h-screen bg-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl p-6 border border-slate-700/50">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-bold text-white mb-2">
                  �� Mes candidatures
                </h1>
                <p className="text-slate-300">
                  Suivez l'état de toutes vos candidatures de projets
                </p>
              </div>
              <div className="flex gap-3">
                <Link href="/dashboard/developer/projects">
                  <Button className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600">
                    Voir les projets
                  </Button>
                </Link>
                <Link href="/dashboard/developer">
                  <Button variant="outline" className="border-slate-600 text-slate-300 hover:border-purple-400">
                    ← Dashboard
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Stats rapides */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <div className="bg-gradient-to-br from-slate-500/20 to-gray-500/20 rounded-2xl p-6 border border-slate-500/30">
            <h3 className="text-slate-400 text-sm font-medium mb-2">TOTAL CANDIDATURES</h3>
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
              <Button
                onClick={() => setFilter('all')}
                className={filter === 'all' ? 
                  'bg-gradient-to-r from-purple-500 to-pink-500' : 
                  'bg-slate-700 hover:bg-slate-600'
                }
              >
                Toutes ({counts.all})
              </Button>
              <Button
                onClick={() => setFilter('pending')}
                className={filter === 'pending' ? 
                  'bg-gradient-to-r from-yellow-500 to-orange-500' : 
                  'bg-slate-700 hover:bg-slate-600'
                }
              >
                En attente ({counts.pending})
              </Button>
              <Button
                onClick={() => setFilter('accepted')}
                className={filter === 'accepted' ? 
                  'bg-gradient-to-r from-green-500 to-emerald-500' : 
                  'bg-slate-700 hover:bg-slate-600'
                }
              >
                Acceptées ({counts.accepted})
              </Button>
              <Button
                onClick={() => setFilter('rejected')}
                className={filter === 'rejected' ? 
                  'bg-gradient-to-r from-red-500 to-pink-500' : 
                  'bg-slate-700 hover:bg-slate-600'
                }
              >
                Refusées ({counts.rejected})
              </Button>
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
                <Button className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600">
                  Découvrir les projets
                </Button>
              </Link>
            </div>
          ) : (
            filteredApplications.map((application) => (
              <div key={application.id} className="bg-slate-800/50 backdrop-blur-xl rounded-2xl p-6 border border-slate-700/50">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <h3 className="text-xl font-semibold text-white">
                        {application.project.title}
                      </h3>
                      <span className="px-3 py-1 rounded-full text-xs font-medium bg-purple-500/20 text-purple-400">
                        {application.project.project_type}
                      </span>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(application.status)}`}>
                        {getStatusText(application.status)}
                      </span>
                    </div>
                    
                    <p className="text-slate-300 mb-4 leading-relaxed">
                      {application.project.description}
                    </p>

                    {application.message && (
                      <div className="bg-slate-700/50 rounded-lg p-3 mb-4">
                        <p className="text-slate-300 text-sm">
                          <span className="text-slate-400">Message du client:</span> {application.message}
                        </p>
                      </div>
                    )}

                    <div className="flex items-center gap-6 text-sm text-slate-400">
                      <div className="flex items-center gap-2">
                        <span>💰</span>
                        <span>
                          {application.project.budget_min && application.project.budget_max ? 
                            `${application.project.budget_min}€ - ${application.project.budget_max}€` : 
                            'Budget à négocier'
                          }
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span>🏢</span>
                        <span>
                          {application.project.profiles?.company || application.project.profiles?.full_name || 'Client anonyme'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span>📅</span>
                        <span>Candidature: {new Date(application.created_at).toLocaleDateString('fr-FR')}</span>
                      </div>
                      {application.updated_at !== application.created_at && (
                        <div className="flex items-center gap-2">
                          <span>🔄</span>
                          <span>Mise à jour: {new Date(application.updated_at).toLocaleDateString('fr-FR')}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="ml-6 flex flex-col gap-2">
                    {application.status === 'accepted' && (
                      <Button className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600">
                        💬 Contacter le client
                      </Button>
                    )}
                    {application.status === 'pending' && (
                      <Button variant="outline" className="border-slate-600 text-slate-400" disabled>
                        ⏳ En attente de réponse
                      </Button>
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
