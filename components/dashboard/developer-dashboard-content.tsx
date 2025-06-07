'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Button } from '../ui/button'
import Link from 'next/link'

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

export default function DeveloperDashboardContent() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const getProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
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
              💻 Bonjour, {user?.email}
            </h1>
            <p className="text-slate-300">
              Bienvenue sur votre espace développeur. Découvrez de nouveaux projets passionnants.
            </p>
            <div className="mt-2 text-sm text-purple-400">
              🔧 Espace Développeur - Automatisation & IA
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <div className="bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-2xl p-6 border border-blue-500/30">
            <h3 className="text-blue-400 text-sm font-medium mb-2">CANDIDATURES ACTIVES</h3>
            <p className="text-3xl font-bold text-white">0</p>
          </div>
          <div className="bg-gradient-to-br from-green-500/20 to-emerald-500/20 rounded-2xl p-6 border border-green-500/30">
            <h3 className="text-green-400 text-sm font-medium mb-2">PROJETS ACCEPTÉS</h3>
            <p className="text-3xl font-bold text-white">0</p>
          </div>
          <div className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-2xl p-6 border border-purple-500/30">
            <h3 className="text-purple-400 text-sm font-medium mb-2">PROJETS TERMINÉS</h3>
            <p className="text-3xl font-bold text-white">0</p>
          </div>
          <div className="bg-gradient-to-br from-yellow-500/20 to-orange-500/20 rounded-2xl p-6 border border-yellow-500/30">
            <h3 className="text-yellow-400 text-sm font-medium mb-2">REVENUS TOTAUX</h3>
            <p className="text-3xl font-bold text-white">€0</p>
          </div>
        </div>

        {/* Actions rapides */}
        <div className="mb-8">
          <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl p-6 border border-slate-700/50">
            <h2 className="text-xl font-bold text-white mb-4">Actions rapides</h2>
            <div className="flex flex-wrap gap-4">
              <Link href="/dashboard/developer/projects">
                <Button className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600">
                  🔍 Parcourir les projets
                </Button>
              </Link>
              <Link href="/dashboard/developer/applications">
                <Button variant="outline" className="border-slate-600 text-slate-300 hover:border-purple-400">
                  📋 Mes candidatures
                </Button>
              </Link>
              <Link href="/dashboard/developer/profile">
                <Button variant="outline" className="border-slate-600 text-slate-300 hover:border-purple-400">
                  👤 Mon profil
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Message d'accueil */}
        <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl p-6 border border-slate-700/50">
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🚀</div>
            <h3 className="text-xl font-semibold text-white mb-2">
              Dashboard développeur en cours de construction
            </h3>
            <p className="text-slate-400 mb-6">
              Bientôt vous pourrez voir tous vos projets et candidatures ici.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
