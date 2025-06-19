'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Button } from '../ui/button'
import Link from 'next/link'

export default function DeveloperDashboardContent() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [testResult, setTestResult] = useState<string>('')

  useEffect(() => {
    const getProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      
      // TEST: Essayer de récupérer les projets ici
      try {
        const { data: projects, error } = await supabase
          .from('projects')
          .select('*')
        
        if (error) {
          setTestResult(`Erreur: ${error.message}`)
        } else {
          setTestResult(`✅ ${projects?.length || 0} projets trouvés`)
        }
      } catch (err) {
        setTestResult(`❌ Erreur catch: ${err}`)
      }
      
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
              DASHBOARD DÉVELOPPEUR
            </h1>
            <p className="text-gray-300 font-medium">
              💻 Bonjour, {user?.email}
            </p>
            <p className="text-gray-400 text-sm mt-1">
              Découvrez de nouveaux projets passionnants en IA et automatisation
            </p>
          </div>
        </div>
      </div>

      {/* Main Content - FOND BLANC */}
      <div className="bg-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Test Result - Section de debug temporaire */}
          <div className="bg-gray-50 rounded-xl p-4 border-2 border-gray-200 mb-8">
            <h3 className="text-black font-black mb-2">🔧 TEST CONNEXION</h3>
            <p className="text-gray-700 font-medium text-sm">
              {testResult || 'Test en cours...'}
            </p>
          </div>

          {/* Stats - FOND GRIS */}
          <div className="bg-gray-50 rounded-2xl p-8 border-2 border-gray-200 mb-8">
            <h2 className="text-2xl font-black text-black mb-6 text-center">
              VOS STATISTIQUES
            </h2>
            <div className="grid md:grid-cols-4 gap-6">
              <div className="bg-white rounded-xl p-6 border-2 border-gray-200 hover:border-black transition-all duration-300 text-center group">
                <h3 className="text-gray-600 text-sm font-bold mb-2 uppercase tracking-wider">CANDIDATURES ACTIVES</h3>
                <p className="text-4xl font-black text-black group-hover:text-gray-700 transition-colors">
                  0
                </p>
              </div>
              <div className="bg-white rounded-xl p-6 border-2 border-gray-200 hover:border-black transition-all duration-300 text-center group">
                <h3 className="text-gray-600 text-sm font-bold mb-2 uppercase tracking-wider">PROJETS ACCEPTÉS</h3>
                <p className="text-4xl font-black text-black group-hover:text-gray-700 transition-colors">
                  0
                </p>
              </div>
              <div className="bg-white rounded-xl p-6 border-2 border-gray-200 hover:border-black transition-all duration-300 text-center group">
                <h3 className="text-gray-600 text-sm font-bold mb-2 uppercase tracking-wider">PROJETS TERMINÉS</h3>
                <p className="text-4xl font-black text-black group-hover:text-gray-700 transition-colors">
                  0
                </p>
              </div>
              <div className="bg-white rounded-xl p-6 border-2 border-gray-200 hover:border-black transition-all duration-300 text-center group">
                <h3 className="text-gray-600 text-sm font-bold mb-2 uppercase tracking-wider">REVENUS TOTAUX</h3>
                <p className="text-4xl font-black text-black group-hover:text-gray-700 transition-colors">
                  €0
                </p>
              </div>
            </div>
          </div>

          {/* Actions rapides */}
          <div className="bg-white rounded-2xl p-8 border-2 border-gray-200 mb-8">
            <h2 className="text-2xl font-black text-black mb-6">ACTIONS RAPIDES</h2>
            <div className="grid sm:grid-cols-3 gap-4">
              <Link href="/dashboard/developer/projects" className="group">
                <Button className="w-full bg-black text-white hover:bg-gray-800 border-2 border-black py-4 text-lg font-black rounded-xl transform hover:scale-105 transition-all duration-300">
                  <span className="flex items-center justify-center">
                    🔍 Parcourir les projets
                    <span className="ml-2 transition-transform duration-300 group-hover:translate-x-1">→</span>
                  </span>
                </Button>
              </Link>
              <Link href="/dashboard/developer/applications" className="group">
                <Button className="w-full border-2 border-black text-black hover:bg-black hover:text-white py-4 text-lg font-black rounded-xl bg-transparent transform hover:scale-105 transition-all duration-300">
                  <span className="flex items-center justify-center">
                    📋 Mes candidatures
                    <span className="ml-2 transition-transform duration-300 group-hover:translate-x-1">→</span>
                  </span>
                </Button>
              </Link>
              <Link href="/dashboard/developer/profile" className="group">
                <Button className="w-full border-2 border-black text-black hover:bg-black hover:text-white py-4 text-lg font-black rounded-xl bg-transparent transform hover:scale-105 transition-all duration-300">
                  <span className="flex items-center justify-center">
                    👤 Mon profil
                    <span className="ml-2 transition-transform duration-300 group-hover:translate-x-1">→</span>
                  </span>
                </Button>
              </Link>
            </div>
          </div>

          {/* Message d'accueil principal - FOND GRIS */}
          <div className="bg-gray-50 rounded-2xl p-8 border-2 border-gray-200">
            <div className="text-center py-16">
              <div className="w-24 h-24 bg-white rounded-3xl flex items-center justify-center mx-auto mb-6 border-2 border-gray-200">
                <span className="text-4xl">🚀</span>
              </div>
              <h3 className="text-2xl font-black text-black mb-3">
                Prêt pour de nouveaux défis ?
              </h3>
              <p className="text-gray-600 font-medium mb-8 max-w-md mx-auto leading-relaxed">
                Explorez les projets disponibles et candidatez sur ceux qui correspondent à vos compétences.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/dashboard/developer/projects">
                  <Button className="bg-black text-white hover:bg-gray-800 border-2 border-black font-black px-8 py-4 text-lg rounded-xl transform hover:scale-105 transition-all duration-300">
                    Voir les projets disponibles
                  </Button>
                </Link>
                <Link href="/dashboard/developer/profile">
                  <Button className="border-2 border-black text-black hover:bg-black hover:text-white font-black px-8 py-4 text-lg rounded-xl bg-transparent transform hover:scale-105 transition-all duration-300">
                    Compléter mon profil
                  </Button>
                </Link>
              </div>
            </div>
          </div>

          {/* Section conseils - BONUS */}
          <div className="mt-8 bg-white rounded-2xl p-8 border-2 border-gray-200">
            <h2 className="text-2xl font-black text-black mb-6">CONSEILS POUR RÉUSSIR</h2>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="text-center group">
                <div className="w-16 h-16 bg-black rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-all duration-300">
                  <span className="text-2xl text-white">💡</span>
                </div>
                <h3 className="font-black text-black mb-2">Optimisez votre profil</h3>
                <p className="text-gray-600 text-sm font-medium">
                  Complétez votre profil avec vos compétences et votre portfolio
                </p>
              </div>
              <div className="text-center group">
                <div className="w-16 h-16 bg-black rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-all duration-300">
                  <span className="text-2xl text-white">⚡</span>
                </div>
                <h3 className="font-black text-black mb-2">Répondez rapidement</h3>
                <p className="text-gray-600 text-sm font-medium">
                  Les clients apprécient les développeurs réactifs
                </p>
              </div>
              <div className="text-center group">
                <div className="w-16 h-16 bg-black rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-all duration-300">
                  <span className="text-2xl text-white">🎯</span>
                </div>
                <h3 className="font-black text-black mb-2">Propositions ciblées</h3>
                <p className="text-gray-600 text-sm font-medium">
                  Personnalisez vos candidatures selon chaque projet
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
