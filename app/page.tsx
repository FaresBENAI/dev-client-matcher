// app/page.tsx
'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Button } from '../components/ui/button'
import { useRouter, usePathname } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useLanguage } from '@/contexts/LanguageContext'

// 🔧 AJOUT: Langues disponibles avec leurs drapeaux
const LANGUAGES = {
  'fr': { name: 'Français', flag: '🇫🇷' },
  'en': { name: 'English', flag: '🇬🇧' },
  'es': { name: 'Español', flag: '🇪🇸' },
  'de': { name: 'Deutsch', flag: '🇩🇪' },
  'it': { name: 'Italiano', flag: '🇮🇹' },
  'pt': { name: 'Português', flag: '🇵🇹' },
  'ar': { name: 'العربية', flag: '🇸🇦' },
  'zh': { name: '中文', flag: '🇨🇳' },
  'ja': { name: '日本語', flag: '🇯🇵' },
  'ko': { name: '한국어', flag: '🇰🇷' },
  'ru': { name: 'Русский', flag: '🇷🇺' },
  'hi': { name: 'हिन्दी', flag: '🇮🇳' }
};

// 🔧 AJOUT: Composant d'affichage des étoiles
const StarRating = ({ rating, totalRatings }: { rating: number; totalRatings?: number }) => {
  if (!rating) return null;
  
  return (
    <div className="flex items-center space-x-1">
      <div className="flex">
        {[1, 2, 3, 4, 5].map((star) => (
          <span
            key={star}
            className={`text-sm ${star <= Math.round(rating) ? 'text-yellow-400' : 'text-gray-300'}`}
          >
            ⭐
          </span>
        ))}
      </div>
      <span className="text-xs text-gray-600 font-medium">
        {rating.toFixed(1)} {totalRatings ? `(${totalRatings})` : ''}
      </span>
    </div>
  );
};

export default function HomePage() {
  const [user, setUser] = useState<any>(null)
  const [userProfile, setUserProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [isVisible, setIsVisible] = useState(false)
  const [stats, setStats] = useState({
    totalDevelopers: 0,
    totalProjects: 0,
    completedProjects: 0
  })
  const [animatedStats, setAnimatedStats] = useState({
    totalDevelopers: 0,
    totalProjects: 0,
    completedProjects: 0
  })
  const [realProjects, setRealProjects] = useState<any[]>([])
  const [realDevelopers, setRealDevelopers] = useState<any[]>([])
  const router = useRouter()
  const pathname = usePathname()
  const { t } = useLanguage()

  const testimonials = [
    {
      name: "Marie Dubois",
      role: "CEO, TechStartup", 
      content: t('home.testimonial.1.content') || "Grâce à LinkerAI, j'ai trouvé le développeur parfait. ROI de 300% en 3 mois !",
      avatar: "M",
      rating: 5
    },
    {
      name: "Jean Martin",
      role: "Développeur IA",
      content: t('home.testimonial.2.content') || "Une plateforme qui comprend vraiment les besoins en IA. Des clients qualifiés !",
      avatar: "J",
      rating: 5
    },
    {
      name: "Lucas Chen",
      role: "Directeur Innovation",
      content: t('home.testimonial.3.content') || "Interface intuitive, développeurs de qualité. Notre chatbot IA dépasse nos attentes !",
      avatar: "L",
      rating: 5
    }
  ]

  // Fonction pour obtenir l'icône du type de projet
  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'web': return '🌐';
      case 'mobile': return '📱';
      case 'automation': return '🤖';
      case 'ai': return '🧠';
      default: return '💻';
    }
  };

  // Fonction pour formater le temps écoulé
  const getTimeAgo = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInMs = now.getTime() - date.getTime();
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
    
    if (diffInDays === 0) return t('time.today');
    if (diffInDays === 1) return `1${t('time.day')}`;
    if (diffInDays < 7) return `${diffInDays}${t('time.day')}`;
    const diffInWeeks = Math.floor(diffInDays / 7);
    if (diffInWeeks === 1) return `1${t('time.week')}`;
    return `${diffInWeeks}${t('time.week')}`;
  };

  // 🔧 AJOUT: Fonction pour vérifier l'état de connexion
  const checkAuthState = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (user) {
        setUser(user)
        const { data: profile } = await supabase
          .from('profiles')
          .select('user_type, full_name')
          .eq('id', user.id)
          .single()
        setUserProfile(profile)
        console.log('🔄 Page d\'accueil - Utilisateur connecté:', user.email, 'Type:', profile?.user_type)
      } else {
        setUser(null)
        setUserProfile(null)
        console.log('🔄 Page d\'accueil - Aucun utilisateur connecté')
      }
    } catch (error) {
      console.error('Erreur lors de la vérification de l\'état de connexion:', error)
      setUser(null)
      setUserProfile(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    checkAuthState()
    fetchStats()
    loadRealData()
    handleUrlParams()
    setIsVisible(true)

    // 🔧 AJOUT: Écouter les changements d'authentification
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('🔄 Page d\'accueil - Changement d\'état auth:', event, session?.user?.email)
        
        if (event === 'SIGNED_IN' && session?.user) {
          setUser(session.user)
          const { data: profile } = await supabase
            .from('profiles')
            .select('user_type, full_name')
            .eq('id', session.user.id)
            .single()
          setUserProfile(profile)
        } else if (event === 'SIGNED_OUT') {
          setUser(null)
          setUserProfile(null)
        }
      }
    )

    return () => {
      subscription?.unsubscribe()
    }
  }, [])

  // 🔧 AJOUT: Re-vérifier l'état quand on revient sur la page
  useEffect(() => {
    checkAuthState()
  }, [pathname])

  // 🔧 MODIFICATION: Charger les vraies données avec profils complets et notes
  const loadRealData = async () => {
    try {
      console.log('=== CHARGEMENT DONNÉES RÉELLES ===');
      
      // Charger les projets récents
      const { data: projects, error: projectsError } = await supabase
        .from('projects')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(3);

      console.log('Projets chargés:', projects);
      if (projects && projects.length > 0) {
        setRealProjects(projects);
      }

      // 🔧 MODIFICATION: Charger les développeurs avec leurs profils ET leurs notes
      const { data: developers, error: developersError } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_type', 'developer')
        .limit(3);

      console.log('Développeurs de base chargés:', developers);

      if (developers && developers.length > 0) {
        // 🔧 AJOUT: Charger les profils détaillés avec les notes pour chaque développeur
        const developersWithDetails = await Promise.all(
          developers.map(async (dev) => {
            const { data: devProfile } = await supabase
              .from('developer_profiles')
              .select('*')
              .eq('id', dev.id)
              .single();

            return {
              ...dev,
              ...devProfile, // Fusionner les données détaillées (inclut average_rating et total_ratings)
              // S'assurer que les données de base ne sont pas écrasées
              id: dev.id,
              full_name: dev.full_name,
              email: dev.email,
              avatar_url: dev.avatar_url
            };
          })
        );

        console.log('Développeurs avec détails et notes chargés:', developersWithDetails);
        setRealDevelopers(developersWithDetails);
      }

      if (projectsError) console.error('Erreur projets:', projectsError);
      if (developersError) console.error('Erreur développeurs:', developersError);

    } catch (error) {
      console.error('Erreur:', error);
    }
  };

  // Animation des statistiques
  useEffect(() => {
    if (stats.totalDevelopers > 0) {
      const duration = 2000
      const steps = 60
      const increment = {
        totalDevelopers: stats.totalDevelopers / steps,
        totalProjects: stats.totalProjects / steps,
        completedProjects: stats.completedProjects / steps
      }
      
      let step = 0
      const timer = setInterval(() => {
        step++
        setAnimatedStats({
          totalDevelopers: Math.floor(increment.totalDevelopers * step),
          totalProjects: Math.floor(increment.totalProjects * step),
          completedProjects: Math.floor(increment.completedProjects * step)
        })
        
        if (step >= steps) {
          clearInterval(timer)
          setAnimatedStats(stats)
        }
      }, duration / steps)
    }
  }, [stats])

  const handleUrlParams = () => {
    if (typeof window === 'undefined') return
    
    const urlParams = new URLSearchParams(window.location.search)
    
    if (urlParams.get('confirmed') === 'true') {
      alert('Email confirmé avec succès !')
      window.history.replaceState({}, document.title, window.location.pathname)
    }
    
    if (urlParams.get('welcome') === 'true') {
      alert('Bienvenue ! Votre compte a été créé avec succès.')
      window.history.replaceState({}, document.title, window.location.pathname)
    }

    if (urlParams.get('error') === 'auth_callback_error') {
      alert('Erreur lors de la confirmation.')
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
    }
    setLoading(false)
  }

  const fetchStats = async () => {
    try {
      const [devsResult, projectsResult, clientsResult] = await Promise.all([
        supabase
          .from('profiles')
          .select('id', { count: 'exact' })
          .eq('user_type', 'developer'),
        
        supabase
          .from('projects')
          .select('id', { count: 'exact' }),
        
        supabase
          .from('profiles')
          .select('id', { count: 'exact' })
          .eq('user_type', 'client')
      ])

      setStats({
        totalDevelopers: devsResult.count || 0,
        totalProjects: projectsResult.count || 0,
        completedProjects: clientsResult.count || 0
      })
    } catch (error) {
      console.error('Erreur stats:', error)
    }
  }

  // Fonction pour adapter le CTA selon l'état de connexion
  const getCallToActionButton = () => {
    if (user && userProfile) {
      // Utilisateur connecté : rediriger vers dashboard approprié
      const dashboardPath = userProfile.user_type === 'client' ? '/dashboard/client' : '/dashboard/developer'
      return (
        <Link href={dashboardPath}>
          <Button className="group relative bg-white text-black hover:bg-gray-100 border-4 border-white px-6 py-3 text-sm font-black rounded-lg transition-all duration-500 hover:scale-105 shadow-2xl">
            <span className="relative z-10 flex items-center text-black font-black">
              {t('nav.dashboard')}
              <span className="ml-2 transition-transform duration-300 group-hover:translate-x-1 text-black">→</span>
            </span>
          </Button>
        </Link>
      )
    } else {
      // Visiteur non connecté : inscription
      return (
        <Link href="/auth/signup">
          <Button className="group relative bg-white text-black hover:bg-gray-100 border-4 border-white px-6 py-3 text-sm font-black rounded-lg transition-all duration-500 hover:scale-105 shadow-2xl">
            <span className="relative z-10 flex items-center text-black font-black">
              {t('home.cta.start.free')}
              <span className="ml-2 transition-transform duration-300 group-hover:translate-x-1 text-black">→</span>
            </span>
          </Button>
        </Link>
      )
    }
  }

  const getFinalCTAButtons = () => {
    if (user && userProfile) {
      // Utilisateur connecté
      const dashboardPath = userProfile.user_type === 'client' ? '/dashboard/client' : '/dashboard/developer'
      const exploreLink = userProfile.user_type === 'client' ? '/developers' : '/projects'
      const exploreText = userProfile.user_type === 'client' ? t('home.cta.explore.talents') : t('home.cta.see.projects')
      
      return (
        <div className="flex flex-col sm:flex-row gap-6 justify-center">
          <Link href={dashboardPath}>
            <Button className="group relative bg-white text-black hover:bg-gray-100 font-black px-10 py-4 text-lg rounded-2xl border-4 border-white overflow-hidden transition-all duration-500 hover:scale-110 shadow-2xl">
              <span className="relative z-10 flex items-center justify-center text-black">
                {t('nav.dashboard')}
                <span className="ml-3 transition-transform duration-300 group-hover:translate-x-2 text-black">→</span>
              </span>
            </Button>
          </Link>
          
          <Link href={exploreLink}>
            <Button className="group relative border-4 border-white text-white hover:bg-white hover:text-black px-10 py-4 text-lg rounded-2xl bg-transparent font-black overflow-hidden transition-all duration-500 hover:scale-110 shadow-2xl">
              <span className="relative z-10 flex items-center justify-center">
                {exploreText}
                <span className="ml-3 transition-transform duration-300 group-hover:translate-x-2">→</span>
              </span>
            </Button>
          </Link>
        </div>
      )
    } else {
      // Visiteur non connecté
      return (
        <div className="flex flex-col sm:flex-row gap-6 justify-center">
          <Link href="/auth/signup">
            <Button className="group relative bg-white text-black hover:bg-gray-100 font-black px-10 py-4 text-lg rounded-2xl border-4 border-white overflow-hidden transition-all duration-500 hover:scale-110 shadow-2xl">
              <span className="relative z-10 flex items-center justify-center text-black">
                {t('home.cta.create.account.free')}
                <span className="ml-3 transition-transform duration-300 group-hover:translate-x-2 text-black">→</span>
              </span>
            </Button>
          </Link>
          
          <Link href="/developers">
            <Button className="group relative border-4 border-white text-white hover:bg-white hover:text-black px-10 py-4 text-lg rounded-2xl bg-transparent font-black overflow-hidden transition-all duration-500 hover:scale-110 shadow-2xl">
              <span className="relative z-10 flex items-center justify-center">
                {t('home.cta.explore.talents')}
                <span className="ml-3 transition-transform duration-300 group-hover:translate-x-2">→</span>
              </span>
            </Button>
          </Link>
        </div>
      )
    }
  }

  // 🔧 AJOUT: Fonction pour le CTA "Comment ça marche"
  const getHowItWorksCTA = () => {
    if (user && userProfile) {
      // Utilisateur connecté : rediriger selon son type
      if (userProfile.user_type === 'client') {
        return (
          <Link href="/developers">
            <Button className="bg-white text-black hover:bg-gray-100 font-black px-8 py-4 text-lg rounded-2xl border-2 border-white transform hover:scale-105 transition-all duration-300 shadow-2xl">
              <span className="text-black font-black">{t('home.cta.explore.developers')}</span>
            </Button>
          </Link>
        )
      } else {
        return (
          <Link href="/projects">
            <Button className="bg-white text-black hover:bg-gray-100 font-black px-8 py-4 text-lg rounded-2xl border-2 border-white transform hover:scale-105 transition-all duration-300 shadow-2xl">
              <span className="text-black font-black">{t('home.cta.see.projects')}</span>
            </Button>
          </Link>
        )
      }
    } else {
      // Visiteur non connecté : inscription
      return (
        <Link href="/auth/signup">
          <Button className="bg-white text-black hover:bg-gray-100 font-black px-8 py-4 text-lg rounded-2xl border-2 border-white transform hover:scale-105 transition-all duration-300 shadow-2xl">
            <span className="text-black font-black">{t('home.cta.start.now')}</span>
          </Button>
        </Link>
      )
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center px-4">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
          <div className="absolute inset-0 w-16 h-16 border-4 border-gray-600 border-b-transparent rounded-full animate-spin opacity-50"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black overflow-hidden relative">
      {/* Hero Section */}
      <div className="relative h-[50vh] flex items-center justify-center overflow-hidden">
        {/* Particules flottantes */}
        <div className="absolute inset-0 overflow-hidden">
          {[...Array(10)].map((_, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 bg-white rounded-full opacity-20 animate-pulse"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 3}s`,
                animationDuration: `${2 + Math.random() * 2}s`
              }}
            />
          ))}
        </div>

        {/* Orbe géant */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-48 h-48 bg-white opacity-3 rounded-full blur-3xl animate-pulse"></div>
        </div>

        <div className={`max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          {/* Titre très compact */}
          <div className="mb-4">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-black mb-2 text-white leading-tight tracking-tight">
              <span className="block text-white">
                {t('home.title.1')}
              </span>
              <span className="block text-gray-300">
                {t('home.title.2')}
              </span>
            </h1>
            
            <p className="text-xs sm:text-sm text-gray-300 max-w-lg mx-auto font-light leading-relaxed">
              {t('home.subtitle')}
            </p>
          </div>
          
          {/* Stats mini */}
          <div className="grid grid-cols-3 gap-2 max-w-sm mx-auto mb-4">
            {[
              { value: animatedStats.totalDevelopers, label: t('home.stats.devs') },
              { value: animatedStats.totalProjects, label: t('home.stats.projects') },
              { value: animatedStats.completedProjects, label: t('home.stats.clients') }
            ].map((stat, index) => (
              <div key={index} className="group relative">
                <div className="bg-white bg-opacity-10 backdrop-blur rounded p-3 border border-white border-opacity-20 hover:border-opacity-40 transition-all duration-500 hover:scale-105">
                  <div className="text-sm font-black text-white mb-1">
                    {stat.value}+
                  </div>
                  <div className="text-gray-300 text-xs font-medium uppercase tracking-wider text-center">
                    {stat.label}
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          {/* CTA adaptatif */}
          <div>
            {getCallToActionButton()}
          </div>
        </div>
      </div>

      {/* Transition mini */}
      <div className="h-8 bg-gradient-to-b from-black via-gray-900 to-white relative">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white via-transparent animate-pulse opacity-20"></div>
      </div>

      {/* Projects & Developers Section */}
      <div className="bg-white py-20 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 relative">
            
            {/* Délimitation design minimaliste */}
            <div className="hidden lg:block absolute left-1/2 top-8 bottom-8 transform -translate-x-1/2">
              <div className="w-px bg-gradient-to-b from-transparent via-gray-300 to-transparent h-full"></div>
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-3 h-3 bg-black rounded-full"></div>
              <div className="absolute top-1/4 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-1 h-1 bg-gray-400 rounded-full"></div>
              <div className="absolute top-3/4 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-1 h-1 bg-gray-400 rounded-full"></div>
            </div>
            
            {/* Projects Column */}
            <div className="space-y-6">
              <div className="text-center">
                <h2 className="text-2xl sm:text-3xl font-black text-black mb-3 relative">
                  {t('home.featured.projects')}
                  <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-16 h-0.5 bg-black"></div>
                </h2>
                <p className="text-gray-600 font-medium">
                  {t('home.featured.projects.desc')}
                </p>
              </div>

              <div className="space-y-4">
                {realProjects.length > 0 ? realProjects.map((project, index) => (
                  <Link key={index} href={`/projects/${project.id}`} className="block">
                    <div className="group bg-gray-50 rounded-2xl p-4 border-2 border-gray-200 hover:border-black transition-all duration-300 hover:shadow-lg hover:-translate-y-1 cursor-pointer">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="px-3 py-1 bg-black text-white text-xs font-bold rounded-full">
                          {getTypeIcon(project.project_type)} {project.project_type || 'Projet'}
                        </span>
                        <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs font-medium rounded-full border border-green-200">
                          ● {project.status || t('status.open')}
                        </span>
                      </div>
                      
                      <h3 className="text-lg font-black text-black mb-2 group-hover:text-gray-700 transition-colors">
                        {project.title}
                      </h3>
                      
                      <div className="mb-3">
                        <p className="text-gray-600 text-sm">{project.description}</p>
                      </div>
                      
                      <div className="flex justify-between items-center text-xs">
                        <div className="text-black font-bold">
                          {project.budget_min && project.budget_max ? 
                            `${project.budget_min}€ - ${project.budget_max}€` : 
                            t('home.budget.negotiate')
                          }
                        </div>
                        <div className="text-gray-400">{t('time.ago')} {getTimeAgo(project.created_at)}</div>
                      </div>
                    </div>
                  </Link>
                )) : (
                  // Fallback si pas de projets
                  [
                    { title: t('home.example.project.1.title'), desc: t('home.example.project.1.desc'), budget: "3 000€ - 5 000€", tag: "Chatbot IA", time: "2j" },
                    { title: t('home.example.project.2.title'), desc: t('home.example.project.2.desc'), budget: "2 500€ - 4 000€", tag: "Automatisation", time: "1s" },
                    { title: t('home.example.project.3.title'), desc: t('home.example.project.3.desc'), budget: "5 000€ - 8 000€", tag: "Data Science", time: "5j" }
                  ].map((project, index) => (
                    <Link key={index} href="/projects" className="block">
                      <div className="group bg-gray-50 rounded-2xl p-4 border-2 border-gray-200 hover:border-black transition-all duration-300 hover:shadow-lg hover:-translate-y-1 cursor-pointer">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="px-3 py-1 bg-black text-white text-xs font-bold rounded-full">
                            {project.tag}
                          </span>
                          <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs font-medium rounded-full border border-green-200">
                            ● {t('status.open')}
                          </span>
                        </div>
                        
                        <h3 className="text-lg font-black text-black mb-2 group-hover:text-gray-700 transition-colors">
                          {project.title}
                        </h3>
                        
                        <div className="mb-3">
                          <p className="text-gray-600 text-sm flex-1">{project.desc}</p>
                        </div>
                        
                        <div className="flex justify-between items-center text-xs">
                          <div className="text-black font-bold">{project.budget}</div>
                          <div className="text-gray-400">{t('time.ago')} {project.time}</div>
                        </div>
                      </div>
                    </Link>
                  ))
                )}
              </div>

              <div className="text-center pt-4">
                <Link href="/projects">
                  <Button className="bg-black text-white hover:bg-gray-800 font-black px-6 py-3 rounded-xl border-2 border-black transform hover:scale-105 transition-all duration-300">
                    {t('home.see.all.projects')}
                  </Button>
                </Link>
              </div>
            </div>

            {/* Developers Column avec notes */}
            <div className="space-y-6">
              <div className="text-center">
                <h2 className="text-2xl sm:text-3xl font-black text-black mb-3 relative">
                  {t('home.expert.developers')}
                  <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-16 h-0.5 bg-black"></div>
                </h2>
                <p className="text-gray-600 font-medium">
                  {t('home.expert.developers.desc')}
                </p>
              </div>

              <div className="space-y-4">
                {realDevelopers.length > 0 ? realDevelopers.map((dev, index) => (
                  <Link key={index} href={`/developer/${dev.id}`} className="block">
                    <div className="group bg-gray-50 rounded-2xl p-4 border-2 border-gray-200 hover:border-black transition-all duration-300 hover:shadow-lg hover:-translate-y-1 cursor-pointer">
                      <div className="flex items-start space-x-3">
                        {/* Photo de profil avec fallback */}
                        <div className="w-12 h-12 rounded-xl overflow-hidden border-2 border-gray-300 flex-shrink-0 group-hover:scale-110 transition-transform duration-300">
                          {dev.avatar_url ? (
                            <img 
                              src={dev.avatar_url} 
                              alt={dev.full_name || 'Développeur'} 
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full bg-black flex items-center justify-center text-white font-black text-lg">
                              {dev.full_name?.charAt(0).toUpperCase() || 'D'}
                            </div>
                          )}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          {/* Nom avec drapeaux des langues */}
                          <div className="flex items-center gap-2 mb-0.5">
                            <h3 className="text-lg font-black text-black">{dev.full_name || t('home.developer')}</h3>
                            {/* Drapeaux des langues parlées */}
                            {dev.languages && dev.languages.length > 0 && (
                              <div className="flex gap-1">
                                {dev.languages.slice(0, 2).map((langCode: string, langIndex: number) => (
                                  <span key={langIndex} className="text-sm" title={LANGUAGES[langCode as keyof typeof LANGUAGES]?.name}>
                                    {LANGUAGES[langCode as keyof typeof LANGUAGES]?.flag || '🌐'}
                                  </span>
                                ))}
                                {dev.languages.length > 2 && (
                                  <span className="text-xs text-gray-500" title={`+${dev.languages.length - 2} ${t('home.other.languages')}`}>
                                    +{dev.languages.length - 2}
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                          
                          {/* Affichage de la note */}
                          <div className="flex items-center justify-between mb-2">
                            <p className="text-gray-600 text-xs font-medium">
                              {dev.experience_years ? `${dev.experience_years}+ ${t('home.years.experience')}` : t('developers.expert')}
                            </p>
                            <StarRating rating={dev.average_rating} totalRatings={dev.total_ratings} />
                          </div>
                          
                          <div className="mb-3">
                            <p className="text-gray-600 text-sm flex-1 truncate">{dev.bio || t('home.developer.specialized')}</p>
                          </div>
                          
                          <div className="flex gap-1 flex-wrap">
                            {dev.skills && dev.skills.length > 0 ? dev.skills.slice(0, 2).map((skill: string, skillIndex: number) => (
                              <span key={skillIndex} className="px-2 py-0.5 bg-gradient-to-r from-purple-600 to-blue-600 text-white text-xs font-medium rounded hover:scale-105 transition-all duration-300">
                                {skill}
                              </span>
                            )) : (
                              <>
                                <span className="px-2 py-0.5 bg-gradient-to-r from-purple-600 to-blue-600 text-white text-xs font-medium rounded hover:scale-105 transition-all duration-300">
                                  React
                                </span>
                                <span className="px-2 py-0.5 bg-gradient-to-r from-purple-600 to-blue-600 text-white text-xs font-medium rounded hover:scale-105 transition-all duration-300">
                                  IA
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </Link>
                )) : (
                  // Fallback si pas de développeurs
                  [
                    { name: "Alexandre Dubois", exp: "5+ ans", desc: t('home.example.dev.1.desc'), avatar: "A", skills: ["Python", "IA"], rating: 4.8, reviews: 12 },
                    { name: "Sophie Martin", exp: "7+ ans", desc: t('home.example.dev.2.desc'), avatar: "S", skills: ["TensorFlow", "ML"], rating: 4.9, reviews: 18 },
                    { name: "Lisa Chen", exp: "6+ ans", desc: t('home.example.dev.3.desc'), avatar: "L", skills: ["PyTorch", "Vision"], rating: 4.7, reviews: 9 }
                  ].map((dev, index) => (
                    <Link key={index} href="/developers" className="block">
                      <div className="group bg-gray-50 rounded-2xl p-4 border-2 border-gray-200 hover:border-black transition-all duration-300 hover:shadow-lg hover:-translate-y-1 cursor-pointer">
                        <div className="flex items-start space-x-3">
                          <div className="w-12 h-12 bg-black rounded-xl flex items-center justify-center text-white font-black text-lg flex-shrink-0 group-hover:scale-110 transition-transform duration-300">
                            {dev.avatar}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="text-lg font-black text-black mb-0.5">{dev.name}</h3>
                            
                            <div className="flex items-center justify-between mb-2">
                              <p className="text-gray-600 text-xs font-medium">{dev.exp} {t('home.experience')}</p>
                              <StarRating rating={dev.rating} totalRatings={dev.reviews} />
                            </div>
                            
                            <div className="mb-3">
                              <p className="text-gray-600 text-sm flex-1 truncate">{dev.desc}</p>
                            </div>
                            
                            <div className="flex gap-1 flex-wrap">
                              {dev.skills.map((skill, skillIndex) => (
                                <span key={skillIndex} className="px-2 py-0.5 bg-gradient-to-r from-purple-600 to-blue-600 text-white text-xs font-medium rounded hover:scale-105 transition-all duration-300">
                                  {skill}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))
                )}
              </div>

              <div className="text-center pt-4">
                <Link href="/developers">
                  <Button className="bg-black text-white hover:bg-gray-800 font-black px-6 py-3 rounded-xl border-2 border-black transform hover:scale-105 transition-all duration-300">
                    {t('home.see.all.developers')}
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Comment ça marche Section */}
      <div className="bg-black py-20 relative overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-white opacity-5 rounded-full blur-2xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-48 h-48 bg-white opacity-3 rounded-full blur-2xl animate-pulse"></div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-black text-white mb-4 relative">
              {t('home.how.it.works')}
              <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-24 h-1 bg-white rounded-full"></div>
            </h2>
            <p className="text-lg text-gray-300 max-w-2xl mx-auto font-medium">
              {t('home.how.it.works.desc')}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 max-w-5xl mx-auto">
            {[
              {
                number: "1",
                title: t('home.step.1.title'),
                description: t('home.step.1.desc')
              },
              {
                number: "2", 
                title: t('home.step.2.title'),
                description: t('home.step.2.desc')
              },
              {
                number: "3",
                title: t('home.step.3.title'),
                description: t('home.step.3.desc')
              }
            ].map((step, index) => (
              <div key={index} className="text-center group">
                <div className="bg-white text-black w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-black mx-auto mb-6 group-hover:scale-110 transition-all duration-300">
                  {step.number}
                </div>
                <h3 className="text-xl font-black text-white mb-4">{step.title}</h3>
                <p className="text-gray-300 font-medium leading-relaxed">{step.description}</p>
              </div>
            ))}
          </div>

          {/* Bouton adaptatif */}
          <div className="text-center mt-12">
            {getHowItWorksCTA()}
          </div>
        </div>
      </div>

      {/* Testimonials */}
      <div className="bg-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-black text-black mb-4 relative">
              {t('home.testimonials.title')}
              <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-24 h-1 bg-black rounded-full"></div>
            </h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto font-medium">
              {t('home.testimonials.desc')}
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="bg-gray-50 rounded-2xl p-6 border-2 border-gray-200 hover:border-black transition-all duration-300 hover:shadow-lg hover:-translate-y-1 relative overflow-hidden">
                <div className="relative z-10 text-center">
                  <div className="flex items-center justify-center mb-4">
                    <div className="w-12 h-12 bg-black rounded-xl flex items-center justify-center text-white font-black text-lg">
                      {testimonial.avatar}
                    </div>
                  </div>
                  
                  <div className="mb-4">
                    <div className="flex justify-center mb-3">
                      {[...Array(testimonial.rating)].map((_, i) => (
                        <span key={i} className="text-sm text-yellow-500">⭐</span>
                      ))}
                    </div>
                    <p className="text-sm text-gray-700 italic font-medium leading-relaxed mb-4">
                      "{testimonial.content}"
                    </p>
                  </div>
                  
                  <div>
                    <div className="font-black text-black text-sm mb-1">{testimonial.name}</div>
                    <div className="text-gray-600 font-medium text-xs">{testimonial.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA Final */}
      <div className="bg-black py-20 relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-0 left-0 w-full h-full opacity-10">
            {[...Array(15)].map((_, i) => (
              <div
                key={i}
                className="absolute w-1 h-1 bg-white rounded-full animate-pulse"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                  animationDelay: `${Math.random() * 3}s`
                }}
              />
            ))}
          </div>
        </div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black mb-8 text-white leading-tight relative">
              {t('home.final.cta.title')}
            </h2>
            
            <p className="text-lg text-gray-300 mb-10 max-w-3xl mx-auto font-light leading-relaxed">
              {t('home.final.cta.desc')}
            </p>
            
            {getFinalCTAButtons()}
          </div>
        </div>
      </div>
    </div>
  )
}
