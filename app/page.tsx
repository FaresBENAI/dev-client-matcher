'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Button } from '../components/ui/button'
import { createClient } from '@supabase/supabase-js'
import { useRouter } from 'next/navigation'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function HomePage() {
  const [user, setUser] = useState<any>(null)
  const [userProfile, setUserProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    totalDevelopers: 0,
    totalProjects: 0,
    completedProjects: 0
  })
  const router = useRouter()

  useEffect(() => {
    checkUser()
    fetchStats()
  }, [])

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      setUser(user)
      const { data: profile } = await supabase
        .from('profiles')
        .select('user_type, full_name')
        .eq('id', user.id)
        .single()
      setUserProfile(profile)
      
      // Redirection vers le dashboard approprié
      if (profile?.user_type === 'client') {
        router.push('/dashboard/client')
      } else if (profile?.user_type === 'developer') {
        router.push('/dashboard/developer')
      }
    }
    setLoading(false)
  }

  const fetchStats = async () => {
    try {
      const [devsResult, projectsResult, completedResult] = await Promise.all([
        supabase.from('developer_profiles').select('id', { count: 'exact' }),
        supabase.from('projects').select('id', { count: 'exact' }),
        supabase.from('projects').select('id', { count: 'exact' }).eq('status', 'completed')
      ])

      setStats({
        totalDevelopers: devsResult.count || 0,
        totalProjects: projectsResult.count || 0,
        completedProjects: completedResult.count || 0
      })
    } catch (error) {
      console.error('Erreur lors du chargement des stats:', error)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-white text-xl">Chargement...</div>
      </div>
    )
  }

  // Si utilisateur connecté, on redirige (le return ci-dessus gère ça)
  if (user && userProfile) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-white text-xl">Redirection vers votre dashboard...</div>
      </div>
    )
  }

  // Page pour visiteurs non connectés
  return (
    <div className="min-h-screen bg-slate-900">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        {/* Background effects */}
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-900 via-purple-900 to-slate-900"></div>
        <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-indigo-500/10 to-cyan-500/10"></div>
        
        {/* Floating elements */}
        <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-purple-500/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyan-500/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-32">
          <div className="text-center">
            <h1 className="text-6xl md:text-7xl font-bold mb-8">
              <span className="text-white">L'avenir de </span>
              <span className="bg-gradient-to-r from-cyan-400 via-purple-400 to-indigo-400 bg-clip-text text-transparent">
                l'automatisation
              </span>
              <br />
              <span className="text-white">commence </span>
              <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent">
                ici
              </span>
            </h1>
            
            <p className="text-xl text-slate-300 mb-12 max-w-4xl mx-auto leading-relaxed">
              Connectez-vous avec les meilleurs développeurs spécialisés en IA et automatisation. 
              <br />Transformez vos idées en solutions intelligentes qui révolutionnent votre business.
            </p>
            
            {/* Stats en temps réel */}
            <div className="grid md:grid-cols-3 gap-6 max-w-2xl mx-auto mb-12">
              <div className="bg-slate-800/30 backdrop-blur-sm rounded-xl p-4 border border-slate-700/50">
                <div className="text-3xl font-bold text-cyan-400">{stats.totalDevelopers}+</div>
                <div className="text-slate-300 text-sm">Développeurs experts</div>
              </div>
              <div className="bg-slate-800/30 backdrop-blur-sm rounded-xl p-4 border border-slate-700/50">
                <div className="text-3xl font-bold text-purple-400">{stats.totalProjects}+</div>
                <div className="text-slate-300 text-sm">Projets créés</div>
              </div>
              <div className="bg-slate-800/30 backdrop-blur-sm rounded-xl p-4 border border-slate-700/50">
                <div className="text-3xl font-bold text-green-400">{stats.completedProjects}+</div>
                <div className="text-slate-300 text-sm">Projets réalisés</div>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
              <Link href="/auth/signup">
                <Button className="bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-600 hover:to-purple-600 text-white font-semibold px-8 py-4 rounded-xl shadow-2xl hover:shadow-cyan-500/25 transition-all duration-300 transform hover:scale-105 text-lg">
                  🚀 Commencer gratuitement
                </Button>
              </Link>
              <Link href="#features">
                <Button 
                  variant="outline" 
                  className="border-2 border-slate-600 text-slate-300 hover:text-white hover:border-cyan-400 hover:bg-slate-800/50 px-8 py-4 rounded-xl backdrop-blur-sm transition-all duration-300 text-lg"
                >
                  Découvrir la plateforme
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Social Proof Section */}
      <div className="bg-slate-800/30 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-2xl font-bold text-white mb-4">
              Ils nous font confiance
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-slate-700/30 rounded-xl p-6 border border-slate-600/50">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
                  M
                </div>
                <div className="ml-4">
                  <div className="font-semibold text-white">Marie Dubois</div>
                  <div className="text-slate-400 text-sm">CEO, TechStartup</div>
                </div>
              </div>
              <p className="text-slate-300 italic">
                "Grâce à Dev-Client Matcher, j'ai trouvé le développeur parfait pour automatiser notre CRM. ROI de 300% en 3 mois !"
              </p>
              <div className="flex text-yellow-400 mt-3">
                ⭐⭐⭐⭐⭐
              </div>
            </div>

            <div className="bg-slate-700/30 rounded-xl p-6 border border-slate-600/50">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-indigo-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
                  J
                </div>
                <div className="ml-4">
                  <div className="font-semibold text-white">Jean Martin</div>
                  <div className="text-slate-400 text-sm">Développeur IA</div>
                </div>
              </div>
              <p className="text-slate-300 italic">
                "Une plateforme qui comprend vraiment les besoins en IA. Des clients qualifiés et des projets passionnants !"
              </p>
              <div className="flex text-yellow-400 mt-3">
                ⭐⭐⭐⭐⭐
              </div>
            </div>

            <div className="bg-slate-700/30 rounded-xl p-6 border border-slate-600/50">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
                  L
                </div>
                <div className="ml-4">
                  <div className="font-semibold text-white">Lucas Chen</div>
                  <div className="text-slate-400 text-sm">Directeur Innovation</div>
                </div>
              </div>
              <p className="text-slate-300 italic">
                "Interface intuitive, développeurs de qualité. Notre chatbot IA a été livré en avance et dépasse nos attentes !"
              </p>
              <div className="flex text-yellow-400 mt-3">
                ⭐⭐⭐⭐⭐
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div id="features" className="relative bg-slate-50 py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-6">
              Pourquoi nous choisir ?
            </h2>
            <div className="w-24 h-1 bg-gradient-to-r from-cyan-500 to-purple-500 mx-auto mb-6"></div>
            <p className="text-xl text-slate-600 max-w-3xl mx-auto">
              La première plateforme pensée spécifiquement pour l'écosystème IA et automatisation
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Pour les clients */}
            <div className="group relative bg-white rounded-3xl p-8 shadow-xl hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 border border-slate-200">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-cyan-500/5 rounded-3xl"></div>
              <div className="relative">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                  <span className="text-2xl">👔</span>
                </div>
                <h3 className="text-2xl font-bold text-slate-900 mb-4">Pour les Entreprises</h3>
                <div className="space-y-3">
                  <div className="flex items-center text-slate-600">
                    <div className="w-2 h-2 bg-cyan-500 rounded-full mr-3"></div>
                    <span>Développeurs pré-qualifiés et spécialisés</span>
                  </div>
                  <div className="flex items-center text-slate-600">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
                    <span>Solutions sur-mesure pour votre secteur</span>
                  </div>
                  <div className="flex items-center text-slate-600">
                    <div className="w-2 h-2 bg-purple-500 rounded-full mr-3"></div>
                    <span>ROI mesurable et garanties qualité</span>
                  </div>
                  <div className="flex items-center text-slate-600">
                    <div className="w-2 h-2 bg-indigo-500 rounded-full mr-3"></div>
                    <span>Support dédié et suivi de projet</span>
                  </div>
                </div>
                <div className="mt-6">
                  <Link href="/developers">
                    <Button className="w-full bg-gradient-to-r from-blue-500 to-cyan-500">
                      Voir les développeurs
                    </Button>
                  </Link>
                </div>
              </div>
            </div>

            {/* Pour les développeurs */}
            <div className="group relative bg-white rounded-3xl p-8 shadow-xl hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 border border-slate-200">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-pink-500/5 rounded-3xl"></div>
              <div className="relative">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                  <span className="text-2xl">💻</span>
                </div>
                <h3 className="text-2xl font-bold text-slate-900 mb-4">Pour les Développeurs</h3>
                <div className="space-y-3">
                  <div className="flex items-center text-slate-600">
                    <div className="w-2 h-2 bg-purple-500 rounded-full mr-3"></div>
                    <span>Projets exclusifs et bien rémunérés</span>
                  </div>
                  <div className="flex items-center text-slate-600">
                    <div className="w-2 h-2 bg-pink-500 rounded-full mr-3"></div>
                    <span>Clients sérieux avec budgets définis</span>
                  </div>
                  <div className="flex items-center text-slate-600">
                    <div className="w-2 h-2 bg-indigo-500 rounded-full mr-3"></div>
                    <span>Paiements sécurisés et rapides</span>
                  </div>
                  <div className="flex items-center text-slate-600">
                    <div className="w-2 h-2 bg-cyan-500 rounded-full mr-3"></div>
                    <span>Portfolio valorisé et recommandations</span>
                  </div>
                </div>
                <div className="mt-6">
                  <Link href="/projects">
                    <Button className="w-full bg-gradient-to-r from-purple-500 to-pink-500">
                      Voir les projets
                    </Button>
                  </Link>
                </div>
              </div>
            </div>

            {/* Technologies */}
            <div className="group relative bg-white rounded-3xl p-8 shadow-xl hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 border border-slate-200">
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-cyan-500/5 rounded-3xl"></div>
              <div className="relative">
                <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-cyan-500 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                  <span className="text-2xl">🤖</span>
                </div>
                <h3 className="text-2xl font-bold text-slate-900 mb-4">Technologies Avancées</h3>
                <div className="space-y-3">
                  <div className="flex items-center text-slate-600">
                    <div className="w-2 h-2 bg-indigo-500 rounded-full mr-3"></div>
                    <span>Intelligence Artificielle & ML</span>
                  </div>
                  <div className="flex items-center text-slate-600">
                    <div className="w-2 h-2 bg-cyan-500 rounded-full mr-3"></div>
                    <span>Automatisation RPA & Workflows</span>
                  </div>
                  <div className="flex items-center text-slate-600">
                    <div className="w-2 h-2 bg-purple-500 rounded-full mr-3"></div>
                    <span>Chatbots & IA Conversationnelle</span>
                  </div>
                  <div className="flex items-center text-slate-600">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
                    <span>Data Science & Analytics</span>
                  </div>
                </div>
                <div className="mt-6">
                  <Link href="/auth/signup">
                    <Button className="w-full bg-gradient-to-r from-indigo-500 to-cyan-500">
                      Commencer maintenant
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Final */}
      <div className="relative bg-slate-900 py-24 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-900/50 to-purple-900/50"></div>
        <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-full h-full">
          <div className="w-full h-full bg-gradient-to-b from-transparent via-cyan-500/5 to-transparent"></div>
        </div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="bg-slate-800/50 backdrop-blur-xl rounded-3xl p-12 border border-slate-700/50">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              <span className="text-white">Prêt à transformer </span>
              <span className="bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
                votre business
              </span>
              <span className="text-white"> ?</span>
            </h2>
            <p className="text-xl text-slate-300 mb-10 max-w-3xl mx-auto">
              Rejoignez la communauté des entreprises qui ont choisi l'excellence en IA et automatisation
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/auth/signup">
                <Button className="bg-gradient-to-r from-cyan-500 via-purple-500 to-indigo-500 hover:from-cyan-600 hover:via-purple-600 hover:to-indigo-600 text-white font-bold px-12 py-4 rounded-2xl shadow-2xl hover:shadow-purple-500/25 transition-all duration-300 transform hover:scale-105">
                  🎯 Créer mon compte gratuitement
                </Button>
              </Link>
              <Link href="/developers">
                <Button variant="outline" className="border-2 border-slate-600 text-slate-300 hover:border-cyan-400 hover:bg-slate-800/50 px-12 py-4 rounded-2xl">
                  Explorer les talents
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
