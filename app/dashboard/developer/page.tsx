'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { User, Briefcase, CheckCircle, Clock, TrendingUp, AlertCircle, XCircle, Send, Hourglass, DollarSign, BarChart3, Play, Trophy } from 'lucide-react'
import { supabase } from '../../../lib/supabase'

export default function AlignedDeveloperDashboard() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    totalApplications: 0,
    pendingApplications: 0,
    inDevelopmentProjects: 0,
    completedProjects: 0
  })

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setUser(user)
        await loadStats(user.id)
      }
    } catch (error) {
      console.error('Erreur auth:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadStats = async (userId: string) => {
    try {
      console.log('=== CHARGEMENT STATS ALIGNÉES ===')
      console.log('User ID:', userId)

      // Compter le total des candidatures
      const { count: totalCount, error: totalError } = await supabase
        .from('project_applications')
        .select('*', { count: 'exact', head: true })
        .eq('developer_id', userId)

      // Compter les candidatures en attente (support dual system)
      const { count: pendingCount, error: pendingError } = await supabase
        .from('project_applications')
        .select('*', { count: 'exact', head: true })
        .eq('developer_id', userId)
        .in('status', ['pending', 'en_attente'])

      // Compter les projets en développement (support dual system)
      const { count: inDevelopmentCount, error: inDevelopmentError } = await supabase
        .from('project_applications')
        .select('*', { count: 'exact', head: true })
        .eq('developer_id', userId)
        .in('status', ['accepted', 'en_developpement'])

      // Compter les projets terminés/réalisés
      const { count: completedCount, error: completedError } = await supabase
        .from('project_applications')
        .select('*', { count: 'exact', head: true })
        .eq('developer_id', userId)
        .eq('status', 'projet_termine')

      console.log('Stats calculées:', {
        total: totalCount,
        pending: pendingCount,
        inDevelopment: inDevelopmentCount,
        completed: completedCount
      })

      setStats({
        totalApplications: totalCount || 0,
        pendingApplications: pendingCount || 0,
        inDevelopmentProjects: inDevelopmentCount || 0,
        completedProjects: completedCount || 0
      })

      if (totalError) console.error('Erreur total:', totalError)
      if (pendingError) console.error('Erreur pending:', pendingError)
      if (inDevelopmentError) console.error('Erreur inDevelopment:', inDevelopmentError)
      if (completedError) console.error('Erreur completed:', completedError)

    } catch (error) {
      console.error('Erreur chargement stats:', error)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-gray-200 border-t-black rounded-full animate-spin"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-gray-900">Dashboard Développeur</h1>
              <p className="text-gray-600 mt-1 text-sm sm:text-base">Aperçu de vos candidatures et activités</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
              <Link href="/dashboard/developer/applications">
                <button className="w-full sm:w-auto border-2 border-black text-black px-4 py-2 rounded-lg font-bold hover:bg-black hover:text-white transition-colors text-sm">
                  Mes candidatures
                </button>
              </Link>
              <Link href="/projects">
                <button className="w-full sm:w-auto bg-black text-white px-4 py-2 rounded-lg font-bold hover:bg-gray-800 transition-colors text-sm">
                  Parcourir les projets
                </button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        
        {/* KPIs - Responsive Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
          
          {/* Total des candidatures */}
          <div className="group bg-white p-4 sm:p-6 rounded-2xl shadow-sm border-2 border-gray-200 hover:border-black transition-all duration-300">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-100 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Send className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
                </div>
              </div>
              <div className="ml-3 sm:ml-4 min-w-0">
                <p className="text-xs sm:text-sm font-medium text-gray-600">Total candidatures</p>
                <p className="text-xl sm:text-2xl font-black text-gray-900">{stats.totalApplications}</p>
              </div>
            </div>
          </div>

          {/* Candidatures en attente */}
          <div className="group bg-white p-4 sm:p-6 rounded-2xl shadow-sm border-2 border-gray-200 hover:border-black transition-all duration-300">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-yellow-100 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Hourglass className="h-5 w-5 sm:h-6 sm:w-6 text-yellow-600" />
                </div>
              </div>
              <div className="ml-3 sm:ml-4 min-w-0">
                <p className="text-xs sm:text-sm font-medium text-gray-600">En attente</p>
                <p className="text-xl sm:text-2xl font-black text-gray-900">{stats.pendingApplications}</p>
              </div>
            </div>
          </div>

          {/* Projets en développement */}
          <div className="group bg-white p-4 sm:p-6 rounded-2xl shadow-sm border-2 border-gray-200 hover:border-black transition-all duration-300">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-100 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Play className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
                </div>
              </div>
              <div className="ml-3 sm:ml-4 min-w-0">
                <p className="text-xs sm:text-sm font-medium text-gray-600">En développement</p>
                <p className="text-xl sm:text-2xl font-black text-gray-900">{stats.inDevelopmentProjects}</p>
              </div>
            </div>
          </div>

          {/* Projets réalisés */}
          <div className="group bg-white p-4 sm:p-6 rounded-2xl shadow-sm border-2 border-gray-200 hover:border-black transition-all duration-300">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-green-100 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Trophy className="h-5 w-5 sm:h-6 sm:w-6 text-green-600" />
                </div>
              </div>
              <div className="ml-3 sm:ml-4 min-w-0">
                <p className="text-xs sm:text-sm font-medium text-gray-600">Projets réalisés</p>
                <p className="text-xl sm:text-2xl font-black text-gray-900">{stats.completedProjects}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Statistiques de performance - Responsive */}
        {stats.totalApplications > 0 && (
          <div className="bg-white rounded-2xl shadow-sm border-2 border-gray-200 p-4 sm:p-6 mb-6 sm:mb-8">
            <h2 className="text-lg sm:text-xl font-black text-gray-900 mb-4 flex items-center">
              <BarChart3 className="h-5 w-5 sm:h-6 sm:w-6 mr-2" />
              Statistiques de performance
            </h2>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
              {/* Taux de réalisation */}
              <div className="text-center">
                <div className="text-2xl sm:text-3xl font-black text-green-600 mb-2">
                  {Math.round((stats.completedProjects / stats.totalApplications) * 100)}%
                </div>
                <p className="text-sm text-gray-600 font-medium">Taux de réalisation</p>
              </div>
              
              {/* Projets actifs */}
              <div className="text-center">
                <div className="text-2xl sm:text-3xl font-black text-blue-600 mb-2">
                  {Math.round((stats.inDevelopmentProjects / stats.totalApplications) * 100)}%
                </div>
                <p className="text-sm text-gray-600 font-medium">Projets en cours</p>
              </div>
              
              {/* En attente */}
              <div className="text-center">
                <div className="text-2xl sm:text-3xl font-black text-yellow-600 mb-2">
                  {Math.round((stats.pendingApplications / stats.totalApplications) * 100)}%
                </div>
                <p className="text-sm text-gray-600 font-medium">En attente</p>
              </div>
            </div>
          </div>
        )}

        {/* Actions rapides - Responsive Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          
          {/* Navigation vers candidatures */}
          <div className="group bg-white rounded-2xl shadow-sm border-2 border-gray-200 hover:border-black transition-all duration-300 p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-black text-gray-900 mb-2">Mes candidatures</h3>
                <p className="text-gray-600 text-sm mb-4">
                  Consultez le statut détaillé de toutes vos candidatures
                </p>
                <Link href="/dashboard/developer/applications">
                  <button className="w-full sm:w-auto bg-black text-white px-4 py-2 rounded-lg font-bold hover:bg-gray-800 transition-colors text-sm">
                    Voir toutes mes candidatures
                  </button>
                </Link>
              </div>
              <div className="text-3xl sm:text-4xl group-hover:scale-110 transition-transform ml-4 flex-shrink-0">
                📋
              </div>
            </div>
          </div>

          {/* Navigation vers projets */}
          <div className="group bg-white rounded-2xl shadow-sm border-2 border-gray-200 hover:border-black transition-all duration-300 p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-black text-gray-900 mb-2">Nouveaux projets</h3>
                <p className="text-gray-600 text-sm mb-4">
                  Découvrez les derniers projets disponibles
                </p>
                <Link href="/projects">
                  <button className="w-full sm:w-auto border-2 border-black text-black px-4 py-2 rounded-lg font-bold hover:bg-black hover:text-white transition-colors text-sm">
                    Parcourir les projets
                  </button>
                </Link>
              </div>
              <div className="text-3xl sm:text-4xl group-hover:scale-110 transition-transform ml-4 flex-shrink-0">
                🚀
              </div>
            </div>
          </div>
        </div>

        {/* Message d'encouragement si pas de candidatures */}
        {stats.totalApplications === 0 && (
          <div className="bg-white rounded-2xl shadow-sm border-2 border-gray-200 p-6 sm:p-8 text-center mt-6 sm:mt-8">
            <div className="text-4xl sm:text-6xl mb-4">🎯</div>
            <h3 className="text-xl font-black text-gray-900 mb-2">
              Prêt à décrocher votre premier projet ?
            </h3>
            <p className="text-gray-600 mb-6 max-w-md mx-auto text-sm sm:text-base">
              Explorez les projets disponibles et postulez à ceux qui correspondent à vos compétences !
            </p>
            <Link href="/projects">
              <button className="w-full sm:w-auto bg-black text-white px-6 py-3 rounded-lg font-black hover:bg-gray-800 transition-colors">
                Découvrir les projets
              </button>
            </Link>
          </div>
        )}

        {/* Section motivationnelle pour projets actifs */}
        {stats.inDevelopmentProjects > 0 && (
          <div className="bg-gradient-to-r from-blue-50 to-green-50 rounded-2xl shadow-sm border-2 border-blue-200 p-6 sm:p-8 text-center mt-6 sm:mt-8">
            <div className="text-3xl sm:text-4xl mb-4">🚀</div>
            <h3 className="text-xl font-black text-gray-900 mb-2">
              {stats.inDevelopmentProjects} projet{stats.inDevelopmentProjects > 1 ? 's' : ''} en cours !
            </h3>
            <p className="text-gray-600 mb-4 text-sm sm:text-base">
              Continuez sur cette lancée ! Vos clients comptent sur vous.
            </p>
            <Link href="/messages">
              <button className="w-full sm:w-auto bg-blue-600 text-white px-6 py-3 rounded-lg font-bold hover:bg-blue-700 transition-colors">
                Accéder aux messages
              </button>
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
