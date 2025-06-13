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
  const [sampleProjects, setSampleProjects] = useState<any[]>([])
  const [sampleDevelopers, setSampleDevelopers] = useState<any[]>([])
  const router = useRouter()

  useEffect(() => {
    checkUser()
    fetchStats()
    fetchSampleData()
    handleUrlParams()
  }, [])

  // ✅ Nouveau: Gestion des paramètres URL pour les confirmations
  const handleUrlParams = () => {
    if (typeof window === 'undefined') return
    
    const urlParams = new URLSearchParams(window.location.search)
    
    if (urlParams.get('confirmed') === 'true') {
      alert('✅ Email confirmé avec succès ! Vous pouvez maintenant vous connecter.')
      // Nettoyer l'URL
      window.history.replaceState({}, document.title, window.location.pathname)
    }
    
    if (urlParams.get('welcome') === 'true') {
      alert('🎉 Bienvenue ! Votre compte a été créé avec succès.')
      window.history.replaceState({}, document.title, window.location.pathname)
    }

    if (urlParams.get('error') === 'auth_callback_error') {
      alert('❌ Erreur lors de la confirmation. Veuillez réessayer ou contacter le support.')
      window.history.replaceState({}, document.title, window.location.pathname)
    }
  }

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
      console.error('Erreur stats:', error)
    }
  }

  const fetchSampleData = async () => {
    try {
      const { data: projects } = await supabase
        .from('projects')
        .select('id, title, description, project_type, budget_min, budget_max, created_at')
        .eq('status', 'open')
        .limit(3)
        .order('created_at', { ascending: false })

      setSampleProjects(projects || [])

      const { data: developers } = await supabase
        .from('profiles')
        .select('id, full_name, bio, skills, experience_years')
        .eq('user_type', 'developer')
        .not('full_name', 'is', null)
        .limit(3)

      setSampleDevelopers(developers || [])
    } catch (error) {
      console.error('Erreur données:', error)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center px-4">
        <div className="text-white text-lg lg:text-xl">Chargement...</div>
      </div>
    )
  }

  if (user && userProfile) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center px-4">
        <div className="text-white text-lg lg:text-xl text-center">Redirection vers votre dashboard...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-900">
      {/* 1. Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-900 via-purple-900 to-slate-900"></div>
        <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-indigo-500/10 to-cyan-500/10"></div>
        <div className="absolute top-1/4 left-1/4 w-32 h-32 lg:w-72 lg:h-72 bg-purple-500/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-48 h-48 lg:w-96 lg:h-96 bg-cyan-500/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 sm:pt-16 lg:pt-20 pb-16 sm:pb-24 lg:pb-32">
          <div className="text-center">
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold mb-6 sm:mb-8">
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
            
            <p className="text-base sm:text-lg lg:text-xl text-slate-300 mb-8 sm:mb-10 lg:mb-12 max-w-4xl mx-auto leading-relaxed px-4">
              Connectez-vous avec les meilleurs développeurs spécialisés en IA et automatisation. 
              <br className="hidden sm:block" />
              Transformez vos idées en solutions intelligentes qui révolutionnent votre business.
            </p>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 max-w-2xl mx-auto mb-8 sm:mb-10 lg:mb-12">
              <div className="bg-slate-800/30 backdrop-blur-sm rounded-xl p-3 sm:p-4 border border-slate-700/50">
                <div className="text-2xl sm:text-3xl font-bold text-cyan-400">{stats.totalDevelopers}+</div>
                <div className="text-slate-300 text-xs sm:text-sm">Développeurs experts</div>
              </div>
              <div className="bg-slate-800/30 backdrop-blur-sm rounded-xl p-3 sm:p-4 border border-slate-700/50">
                <div className="text-2xl sm:text-3xl font-bold text-purple-400">{stats.totalProjects}+</div>
                <div className="text-slate-300 text-xs sm:text-sm">Projets créés</div>
              </div>
              <div className="bg-slate-800/30 backdrop-blur-sm rounded-xl p-3 sm:p-4 border border-slate-700/50">
                <div className="text-2xl sm:text-3xl font-bold text-green-400">{stats.completedProjects}+</div>
                <div className="text-slate-300 text-xs sm:text-sm">Projets réalisés</div>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 justify-center items-center px-4">
              <Link href="/auth/signup">
                <Button className="w-full sm:w-auto bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-600 hover:to-purple-600 text-white font-semibold px-6 sm:px-8 py-3 sm:py-4 rounded-xl shadow-2xl hover:shadow-cyan-500/25 transition-all duration-300 transform hover:scale-105 text-base sm:text-lg">
                  🚀 Commencer gratuitement
                </Button>
              </Link>
              <Link href="#features">
                <Button variant="outline" className="w-full sm:w-auto border-2 border-slate-600 text-slate-300 hover:text-white hover:border-cyan-400 hover:bg-slate-800/50 px-6 sm:px-8 py-3 sm:py-4 rounded-xl backdrop-blur-sm transition-all duration-300 text-base sm:text-lg">
                  Découvrir la plateforme
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Pourquoi nous choisir */}
      <div id="features" className="relative bg-slate-50 py-16 sm:py-20 lg:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 sm:mb-16 lg:mb-20">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-slate-900 mb-4 sm:mb-6">
              Pourquoi nous choisir ?
            </h2>
            <div className="w-24 h-1 bg-gradient-to-r from-cyan-500 to-purple-500 mx-auto mb-4 sm:mb-6"></div>
            <p className="text-lg sm:text-xl text-slate-600 max-w-3xl mx-auto px-4">
              La première plateforme pensée spécifiquement pour l'écosystème IA et automatisation
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
            <div className="group relative bg-white rounded-3xl p-6 sm:p-8 shadow-xl hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 border border-slate-200">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-cyan-500/5 rounded-3xl"></div>
              <div className="relative">
                <div className="w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center mb-4 sm:mb-6 group-hover:scale-110 transition-transform duration-300">
                  <span className="text-xl sm:text-2xl">👔</span>
                </div>
                <h3 className="text-xl sm:text-2xl font-bold text-slate-900 mb-3 sm:mb-4">Pour les Entreprises</h3>
                <div className="space-y-2 sm:space-y-3">
                  <div className="flex items-center text-slate-600 text-sm sm:text-base">
                    <div className="w-2 h-2 bg-cyan-500 rounded-full mr-3 flex-shrink-0"></div>
                    <span>Développeurs pré-qualifiés et spécialisés</span>
                  </div>
                  <div className="flex items-center text-slate-600 text-sm sm:text-base">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mr-3 flex-shrink-0"></div>
                    <span>Solutions sur-mesure pour votre secteur</span>
                  </div>
                  <div className="flex items-center text-slate-600 text-sm sm:text-base">
                    <div className="w-2 h-2 bg-purple-500 rounded-full mr-3 flex-shrink-0"></div>
                    <span>ROI mesurable et garanties qualité</span>
                  </div>
                  <div className="flex items-center text-slate-600 text-sm sm:text-base">
                    <div className="w-2 h-2 bg-indigo-500 rounded-full mr-3 flex-shrink-0"></div>
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

            <div className="group relative bg-white rounded-3xl p-6 sm:p-8 shadow-xl hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 border border-slate-200">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-pink-500/5 rounded-3xl"></div>
              <div className="relative">
                <div className="w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center mb-4 sm:mb-6 group-hover:scale-110 transition-transform duration-300">
                  <span className="text-xl sm:text-2xl">💻</span>
                </div>
                <h3 className="text-xl sm:text-2xl font-bold text-slate-900 mb-3 sm:mb-4">Pour les Développeurs</h3>
                <div className="space-y-2 sm:space-y-3">
                  <div className="flex items-center text-slate-600 text-sm sm:text-base">
                    <div className="w-2 h-2 bg-purple-500 rounded-full mr-3 flex-shrink-0"></div>
                    <span>Projets exclusifs et bien rémunérés</span>
                  </div>
                  <div className="flex items-center text-slate-600 text-sm sm:text-base">
                    <div className="w-2 h-2 bg-pink-500 rounded-full mr-3 flex-shrink-0"></div>
                    <span>Clients sérieux avec budgets définis</span>
                  </div>
                  <div className="flex items-center text-slate-600 text-sm sm:text-base">
                    <div className="w-2 h-2 bg-indigo-500 rounded-full mr-3 flex-shrink-0"></div>
                    <span>Paiements sécurisés et rapides</span>
                  </div>
                  <div className="flex items-center text-slate-600 text-sm sm:text-base">
                    <div className="w-2 h-2 bg-cyan-500 rounded-full mr-3 flex-shrink-0"></div>
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

            <div className="group relative bg-white rounded-3xl p-6 sm:p-8 shadow-xl hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 border border-slate-200">
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-cyan-500/5 rounded-3xl"></div>
              <div className="relative">
                <div className="w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-br from-indigo-500 to-cyan-500 rounded-2xl flex items-center justify-center mb-4 sm:mb-6 group-hover:scale-110 transition-transform duration-300">
                  <span className="text-xl sm:text-2xl">🤖</span>
                </div>
                <h3 className="text-xl sm:text-2xl font-bold text-slate-900 mb-3 sm:mb-4">Technologies Avancées</h3>
                <div className="space-y-2 sm:space-y-3">
                  <div className="flex items-center text-slate-600 text-sm sm:text-base">
                    <div className="w-2 h-2 bg-indigo-500 rounded-full mr-3 flex-shrink-0"></div>
                    <span>Intelligence Artificielle & ML</span>
                  </div>
                  <div className="flex items-center text-slate-600 text-sm sm:text-base">
                    <div className="w-2 h-2 bg-cyan-500 rounded-full mr-3 flex-shrink-0"></div>
                    <span>Automatisation RPA & Workflows</span>
                  </div>
                  <div className="flex items-center text-slate-600 text-sm sm:text-base">
                    <div className="w-2 h-2 bg-purple-500 rounded-full mr-3 flex-shrink-0"></div>
                    <span>Chatbots & IA Conversationnelle</span>
                  </div>
                  <div className="flex items-center text-slate-600 text-sm sm:text-base">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mr-3 flex-shrink-0"></div>
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

      {/* 3. Projets en vedette */}
      <div className="bg-slate-900 py-16 sm:py-20 lg:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4 sm:mb-6">
              Projets en vedette
            </h2>
            <div className="w-24 h-1 bg-gradient-to-r from-cyan-500 to-purple-500 mx-auto mb-4 sm:mb-6"></div>
            <p className="text-lg sm:text-xl text-slate-300 max-w-3xl mx-auto px-4">
              Découvrez les projets innovants actuellement disponibles sur notre plateforme
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 mb-8 sm:mb-12">
            {sampleProjects.length > 0 ? sampleProjects.map((project) => (
              <div key={project.id} className="bg-slate-800/50 backdrop-blur-xl rounded-2xl p-6 border border-slate-700/50 hover:border-purple-500/50 transition-all duration-300 transform hover:-translate-y-2">
                <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-4">
                  <span className="px-2 sm:px-3 py-1 rounded-full text-xs font-medium bg-purple-500/20 text-purple-400">
                    {project.project_type || 'IA & Automatisation'}
                  </span>
                  <span className="px-2 sm:px-3 py-1 rounded-full text-xs font-medium bg-green-500/20 text-green-400">
                    Ouvert
                  </span>
                </div>
                
                <h3 className="text-lg sm:text-xl font-semibold text-white mb-3">
                  {project.title}
                </h3>
                
                <p className="text-slate-300 mb-4 line-clamp-3 text-sm sm:text-base">
                  {project.description || 'Projet passionnant en IA et automatisation...'}
                </p>
                
                <div className="flex justify-between items-center mb-4">
                  <div className="text-sm text-slate-400">
                    {project.budget_min && project.budget_max ? 
                      `${project.budget_min}€ - ${project.budget_max}€` : 
                      'Budget à négocier'
                    }
                  </div>
                  <div className="text-xs text-slate-500">
                    {new Date(project.created_at).toLocaleDateString('fr-FR')}
                  </div>
                </div>
                
                <Button className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600">
                  Voir le projet
                </Button>
              </div>
            )) : (
              <>
                <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl p-6 border border-slate-700/50">
                  <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-4">
                    <span className="px-2 sm:px-3 py-1 rounded-full text-xs font-medium bg-purple-500/20 text-purple-400">Chatbot IA</span>
                    <span className="px-2 sm:px-3 py-1 rounded-full text-xs font-medium bg-green-500/20 text-green-400">Ouvert</span>
                  </div>
                  <h3 className="text-lg sm:text-xl font-semibold text-white mb-3">Assistant IA pour e-commerce</h3>
                  <p className="text-slate-300 mb-4 text-sm sm:text-base">Développer un chatbot intelligent pour améliorer l'expérience client et augmenter les conversions.</p>
                  <div className="flex justify-between items-center mb-4">
                    <div className="text-sm text-slate-400">3 000€ - 5 000€</div>
                    <div className="text-xs text-slate-500">Il y a 2 jours</div>
                  </div>
                  <Button className="w-full bg-gradient-to-r from-purple-500 to-pink-500">Voir le projet</Button>
                </div>

                <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl p-6 border border-slate-700/50">
                  <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-4">
                    <span className="px-2 sm:px-3 py-1 rounded-full text-xs font-medium bg-blue-500/20 text-blue-400">Automatisation</span>
                    <span className="px-2 sm:px-3 py-1 rounded-full text-xs font-medium bg-green-500/20 text-green-400">Ouvert</span>
                  </div>
                  <h3 className="text-lg sm:text-xl font-semibold text-white mb-3">Automatisation workflow RH</h3>
                  <p className="text-slate-300 mb-4 text-sm sm:text-base">Automatiser les processus de recrutement, de la réception des CV à la planification des entretiens.</p>
                  <div className="flex justify-between items-center mb-4">
                    <div className="text-sm text-slate-400">2 500€ - 4 000€</div>
                    <div className="text-xs text-slate-500">Il y a 1 semaine</div>
                  </div>
                  <Button className="w-full bg-gradient-to-r from-blue-500 to-cyan-500">Voir le projet</Button>
                </div>

                <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl p-6 border border-slate-700/50">
                  <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-4">
                    <span className="px-2 sm:px-3 py-1 rounded-full text-xs font-medium bg-indigo-500/20 text-indigo-400">Machine Learning</span>
                    <span className="px-2 sm:px-3 py-1 rounded-full text-xs font-medium bg-green-500/20 text-green-400">Ouvert</span>
                  </div>
                  <h3 className="text-lg sm:text-xl font-semibold text-white mb-3">Prédiction de ventes par IA</h3>
                  <p className="text-slate-300 mb-4 text-sm sm:text-base">Créer un modèle de machine learning pour prédire les ventes et optimiser la gestion des stocks.</p>
                  <div className="flex justify-between items-center mb-4">
                    <div className="text-sm text-slate-400">4 000€ - 7 000€</div>
                    <div className="text-xs text-slate-500">Il y a 3 jours</div>
                  </div>
                  <Button className="w-full bg-gradient-to-r from-indigo-500 to-purple-500">Voir le projet</Button>
                </div>
              </>
            )}
          </div>

          <div className="text-center">
            <Link href="/projects">
              <Button className="bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-600 hover:to-purple-600 px-6 sm:px-8 py-3 text-base sm:text-lg">
                Voir tous les projets
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* 4. Développeurs experts */}
      <div className="bg-slate-50 py-16 sm:py-20 lg:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-slate-900 mb-4 sm:mb-6">
              Nos développeurs experts
            </h2>
            <div className="w-24 h-1 bg-gradient-to-r from-cyan-500 to-purple-500 mx-auto mb-4 sm:mb-6"></div>
            <p className="text-lg sm:text-xl text-slate-600 max-w-3xl mx-auto px-4">
              Rencontrez les talents qui transforment les idées en solutions intelligentes
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 mb-8 sm:mb-12">
            {sampleDevelopers.length > 0 ? sampleDevelopers.map((developer) => (
              <div key={developer.id} className="bg-white rounded-3xl p-6 sm:p-8 shadow-xl hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 border border-slate-200">
                <div className="text-center mb-6">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white font-bold text-xl sm:text-2xl mx-auto mb-4">
                    {developer.full_name?.charAt(0).toUpperCase() || 'D'}
                  </div>
                  <h3 className="text-lg sm:text-xl font-bold text-slate-900 mb-2">
                    {developer.full_name || 'Développeur Expert'}
                  </h3>
                  <p className="text-slate-600 text-sm mb-3">
                    {developer.experience_years ? `${developer.experience_years} ans d'expérience` : 'Expert IA & Automatisation'}
                  </p>
                </div>
                
                <p className="text-slate-600 text-sm mb-4 line-clamp-3">
                  {developer.bio || 'Spécialisé en intelligence artificielle et automatisation, je transforme vos idées en solutions innovantes.'}
                </p>
                
                <div className="mb-6">
                  <h4 className="text-sm font-semibold text-slate-900 mb-2">Compétences :</h4>
                  <div className="flex flex-wrap gap-2">
                    {developer.skills ? developer.skills.split(',').slice(0, 3).map((skill: string, idx: number) => (
                      <span key={idx} className="px-2 py-1 bg-purple-100 text-purple-700 rounded-full text-xs">
                        {skill.trim()}
                      </span>
                    )) : (
                      <>
                        <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded-full text-xs">Python</span>
                        <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs">IA</span>
                        <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs">ML</span>
                      </>
                    )}
                  </div>
                </div>
                
                <Button className="w-full bg-gradient-to-r from-purple-500 to-pink-500">
                  Voir le profil
                </Button>
              </div>
            )) : (
              <>
                <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-xl hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 border border-slate-200">
                  <div className="text-center mb-6">
                    <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white font-bold text-xl sm:text-2xl mx-auto mb-4">A</div>
                    <h3 className="text-lg sm:text-xl font-bold text-slate-900 mb-2">Alexandre Dubois</h3>
                    <p className="text-slate-600 text-sm mb-3">5+ ans d'expérience</p>
                  </div>
                  <p className="text-slate-600 text-sm mb-4">Spécialiste en IA conversationnelle et automatisation RPA. J'aide les entreprises à optimiser leurs processus.</p>
                  <div className="mb-6">
                    <h4 className="text-sm font-semibold text-slate-900 mb-2">Compétences :</h4>
                    <div className="flex flex-wrap gap-2">
                      <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded-full text-xs">Python</span>
                      <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs">ChatGPT API</span>
                      <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs">RPA</span>
                    </div>
                  </div>
                  <Button className="w-full bg-gradient-to-r from-purple-500 to-pink-500">Voir le profil</Button>
                </div>

                <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-xl hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 border border-slate-200">
                  <div className="text-center mb-6">
                    <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full flex items-center justify-center text-white font-bold text-xl sm:text-2xl mx-auto mb-4">S</div>
                    <h3 className="text-lg sm:text-xl font-bold text-slate-900 mb-2">Sophie Martin</h3>
                    <p className="text-slate-600 text-sm mb-3">7+ ans d'expérience</p>
                  </div>
                  <p className="text-slate-600 text-sm mb-4">Experte en Machine Learning et Data Science. Je conçois des modèles prédictifs qui transforment vos données.</p>
                  <div className="mb-6">
                    <h4 className="text-sm font-semibold text-slate-900 mb-2">Compétences :</h4>
                    <div className="flex flex-wrap gap-2">
                      <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs">TensorFlow</span>
                      <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded-full text-xs">Scikit-learn</span>
                      <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs">Data Science</span>
                    </div>
                  </div>
                  <Button className="w-full bg-gradient-to-r from-blue-500 to-cyan-500">Voir le profil</Button>
                </div>

                <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-xl hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 border border-slate-200">
                  <div className="text-center mb-6">
                    <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-xl sm:text-2xl mx-auto mb-4">M</div>
                    <h3 className="text-lg sm:text-xl font-bold text-slate-900 mb-2">Marc Lefebvre</h3>
                    <p className="text-slate-600 text-sm mb-3">8+ ans d'expérience</p>
                  </div>
                  <p className="text-slate-600 text-sm mb-4">Architecte en automatisation et intégration. Je connecte vos systèmes et automatise vos workflows.</p>
                  <div className="mb-6">
                    <h4 className="text-sm font-semibold text-slate-900 mb-2">Compétences :</h4>
                    <div className="flex flex-wrap gap-2">
                      <span className="px-2 py-1 bg-indigo-100 text-indigo-700 rounded-full text-xs">Zapier</span>
                      <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded-full text-xs">API</span>
                      <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs">Workflow</span>
                    </div>
                  </div>
                  <Button className="w-full bg-gradient-to-r from-indigo-500 to-purple-500">Voir le profil</Button>
                </div>
              </>
            )}
          </div>

          <div className="text-center">
            <Link href="/developers">
              <Button className="bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-600 hover:to-purple-600 px-6 sm:px-8 py-3 text-base sm:text-lg">
                Voir tous les développeurs
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* 5. Avis des utilisateurs */}
      <div className="bg-slate-800/30 py-12 sm:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8 sm:mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4 sm:mb-6">
              Ce que disent nos utilisateurs
            </h2>
            <div className="w-24 h-1 bg-gradient-to-r from-cyan-500 to-purple-500 mx-auto mb-4 sm:mb-6"></div>
            <p className="text-lg sm:text-xl text-slate-300 max-w-3xl mx-auto px-4">
              Découvrez les témoignages de ceux qui transforment leurs idées en succès
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            <div className="bg-slate-700/30 rounded-xl p-4 sm:p-6 border border-slate-600/50">
              <div className="flex items-center mb-4">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-full flex items-center justify-center text-white font-bold text-base sm:text-lg">
                  M
                </div>
                <div className="ml-3 sm:ml-4">
                  <div className="font-semibold text-white text-sm sm:text-base">Marie Dubois</div>
                  <div className="text-slate-400 text-xs sm:text-sm">CEO, TechStartup</div>
                </div>
              </div>
              <p className="text-slate-300 italic mb-4 text-sm sm:text-base">
                "Grâce à Dev-Client Matcher, j'ai trouvé le développeur parfait pour automatiser notre CRM. ROI de 300% en 3 mois !"
              </p>
              <div className="flex text-yellow-400">
                ⭐⭐⭐⭐⭐
              </div>
            </div>

            <div className="bg-slate-700/30 rounded-xl p-4 sm:p-6 border border-slate-600/50">
              <div className="flex items-center mb-4">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-purple-500 to-indigo-500 rounded-full flex items-center justify-center text-white font-bold text-base sm:text-lg">
                  J
                </div>
                <div className="ml-3 sm:ml-4">
                  <div className="font-semibold text-white text-sm sm:text-base">Jean Martin</div>
                  <div className="text-slate-400 text-xs sm:text-sm">Développeur IA</div>
                </div>
              </div>
              <p className="text-slate-300 italic mb-4 text-sm sm:text-base">
                "Une plateforme qui comprend vraiment les besoins en IA. Des clients qualifiés et des projets passionnants !"
              </p>
              <div className="flex text-yellow-400">
                ⭐⭐⭐⭐⭐
              </div>
            </div>

            <div className="bg-slate-700/30 rounded-xl p-4 sm:p-6 border border-slate-600/50 md:col-span-2 lg:col-span-1">
              <div className="flex items-center mb-4">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-green-500 to-emerald-500 rounded-full flex items-center justify-center text-white font-bold text-base sm:text-lg">
                  L
                </div>
                <div className="ml-3 sm:ml-4">
                  <div className="font-semibold text-white text-sm sm:text-base">Lucas Chen</div>
                  <div className="text-slate-400 text-xs sm:text-sm">Directeur Innovation</div>
                </div>
              </div>
              <p className="text-slate-300 italic mb-4 text-sm sm:text-base">
                "Interface intuitive, développeurs de qualité. Notre chatbot IA a été livré en avance et dépasse nos attentes !"
              </p>
              <div className="flex text-yellow-400">
                ⭐⭐⭐⭐⭐
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 6. CTA Final */}
      <div className="relative bg-slate-900 py-16 sm:py-20 lg:py-24 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-900/50 to-purple-900/50"></div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="bg-slate-800/50 backdrop-blur-xl rounded-3xl p-8 sm:p-12 border border-slate-700/50">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4 sm:mb-6">
              <span className="text-white">Prêt à transformer </span>
              <span className="bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
                votre business
              </span>
              <span className="text-white"> ?</span>
            </h2>
            <p className="text-lg sm:text-xl text-slate-300 mb-8 sm:mb-10 max-w-3xl mx-auto px-4">
              Rejoignez la communauté des entreprises qui ont choisi l'excellence en IA et automatisation
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/auth/signup">
                <Button className="w-full sm:w-auto bg-gradient-to-r from-cyan-500 via-purple-500 to-indigo-500 hover:from-cyan-600 hover:via-purple-600 hover:to-indigo-600 text-white font-bold px-8 sm:px-12 py-3 sm:py-4 rounded-2xl shadow-2xl hover:shadow-purple-500/25 transition-all duration-300 transform hover:scale-105 text-base sm:text-lg">
                  🎯 Créer mon compte gratuitement
                </Button>
              </Link>
              <Link href="/developers">
                <Button variant="outline" className="w-full sm:w-auto border-2 border-slate-600 text-slate-300 hover:border-cyan-400 hover:bg-slate-800/50 px-8 sm:px-12 py-3 sm:py-4 rounded-2xl text-base sm:text-lg">
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
