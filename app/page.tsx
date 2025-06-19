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
  const router = useRouter()

  const testimonials = [
    {
      name: "Marie Dubois",
      role: "CEO, TechStartup", 
      content: "Grâce à LinkerAI, j'ai trouvé le développeur parfait. ROI de 300% en 3 mois !",
      avatar: "M",
      rating: 5
    },
    {
      name: "Jean Martin",
      role: "Développeur IA",
      content: "Une plateforme qui comprend vraiment les besoins en IA. Des clients qualifiés !",
      avatar: "J",
      rating: 5
    },
    {
      name: "Lucas Chen",
      role: "Directeur Innovation",
      content: "Interface intuitive, développeurs de qualité. Notre chatbot IA dépasse nos attentes !",
      avatar: "L",
      rating: 5
    }
  ]

  const projects = [
    { title: "Assistant IA pour e-commerce", desc: "Développer un chatbot intelligent", budget: "3 000€ - 5 000€", tag: "Chatbot IA", time: "2j" },
    { title: "Automatisation workflow RH", desc: "Automatiser les processus", budget: "2 500€ - 4 000€", tag: "Automatisation", time: "1s" },
    { title: "Analyse prédictive marketing", desc: "Créer des modèles d'analyse", budget: "5 000€ - 8 000€", tag: "Data Science", time: "5j" }
  ]

  const developers = [
    { name: "Alexandre Dubois", exp: "5+ ans", desc: "Spécialiste IA conversationnelle", avatar: "A", skills: ["Python", "IA"] },
    { name: "Sophie Martin", exp: "7+ ans", desc: "Experte Machine Learning", avatar: "S", skills: ["TensorFlow", "ML"] },
    { name: "Lisa Chen", exp: "6+ ans", desc: "Experte Computer Vision", avatar: "L", skills: ["PyTorch", "Vision"] }
  ]

  useEffect(() => {
    checkUser()
    fetchStats()
    handleUrlParams()
    setIsVisible(true)
  }, [])

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
      
      // SUPPRIMÉ : Plus de redirection automatique
      // Les utilisateurs connectés voient la même homepage
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
              Mon Dashboard
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
              Commencer gratuitement
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
      const exploreText = userProfile.user_type === 'client' ? 'Explorer les talents' : 'Voir les projets'
      
      return (
        <div className="flex flex-col sm:flex-row gap-6 justify-center">
          <Link href={dashboardPath}>
            <Button className="group relative bg-white text-black hover:bg-gray-100 font-black px-10 py-4 text-lg rounded-2xl border-4 border-white overflow-hidden transition-all duration-500 hover:scale-110 shadow-2xl">
              <span className="relative z-10 flex items-center justify-center text-black">
                Mon Dashboard
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
                Créer mon compte gratuitement
                <span className="ml-3 transition-transform duration-300 group-hover:translate-x-2 text-black">→</span>
              </span>
            </Button>
          </Link>
          
          <Link href="/developers">
            <Button className="group relative border-4 border-white text-white hover:bg-white hover:text-black px-10 py-4 text-lg rounded-2xl bg-transparent font-black overflow-hidden transition-all duration-500 hover:scale-110 shadow-2xl">
              <span className="relative z-10 flex items-center justify-center">
                Explorer les talents
                <span className="ml-3 transition-transform duration-300 group-hover:translate-x-2">→</span>
              </span>
            </Button>
          </Link>
        </div>
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
      {/* Hero Section - Encore plus réduit */}
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
                L'AUTOMATISATION
              </span>
              <span className="block text-gray-300">
                COMMENCE ICI
              </span>
            </h1>
            
            <p className="text-xs sm:text-sm text-gray-300 max-w-lg mx-auto font-light leading-relaxed">
              Connectez-vous avec les meilleurs développeurs spécialisés en IA et automatisation
            </p>
          </div>
          
          {/* Stats mini */}
          <div className="grid grid-cols-3 gap-2 max-w-sm mx-auto mb-4">
            {[
              { value: animatedStats.totalDevelopers, label: 'Devs' },
              { value: animatedStats.totalProjects, label: 'Projets' },
              { value: animatedStats.completedProjects, label: 'Clients' }
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

      {/* Projects & Developers Section - Comme avant (centrés) */}
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
            
            {/* Projects Column - Centré comme avant */}
            <div className="space-y-6">
              <div className="text-center">
                <h2 className="text-2xl sm:text-3xl font-black text-black mb-3 relative">
                  Projets en vedette
                  <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-16 h-0.5 bg-black"></div>
                </h2>
                <p className="text-gray-600 font-medium">
                  Découvrez les projets innovants disponibles
                </p>
              </div>

              <div className="space-y-4">
                {projects.map((project, index) => (
                  <div key={index} className="group bg-gray-50 rounded-2xl p-4 border-2 border-gray-200 hover:border-black transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="px-3 py-1 bg-black text-white text-xs font-bold rounded-full">
                        {project.tag}
                      </span>
                      <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs font-medium rounded-full border border-green-200">
                        ● Ouvert
                      </span>
                    </div>
                    
                    <h3 className="text-lg font-black text-black mb-2 group-hover:text-gray-700 transition-colors">
                      {project.title}
                    </h3>
                    
                    <div className="flex justify-between items-center mb-3">
                      <p className="text-gray-600 text-sm flex-1">{project.desc}</p>
                      <Button className="bg-black text-white hover:bg-gray-800 font-bold px-4 py-1 rounded-lg ml-3 text-xs transform hover:scale-105 transition-all">
                        Voir →
                      </Button>
                    </div>
                    
                    <div className="flex justify-between items-center text-xs">
                      <div className="text-black font-bold">{project.budget}</div>
                      <div className="text-gray-400">il y a {project.time}</div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="text-center pt-4">
                <Link href="/projects">
                  <Button className="bg-black text-white hover:bg-gray-800 font-black px-6 py-3 rounded-xl border-2 border-black transform hover:scale-105 transition-all duration-300">
                    Voir tous les projets
                  </Button>
                </Link>
              </div>
            </div>

            {/* Developers Column - Centré comme avant */}
            <div className="space-y-6">
              <div className="text-center">
                <h2 className="text-2xl sm:text-3xl font-black text-black mb-3 relative">
                  Nos développeurs experts
                  <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-16 h-0.5 bg-black"></div>
                </h2>
                <p className="text-gray-600 font-medium">
                  Rencontrez les talents qui transforment les idées
                </p>
              </div>

              <div className="space-y-4">
                {developers.map((dev, index) => (
                  <div key={index} className="group bg-gray-50 rounded-2xl p-4 border-2 border-gray-200 hover:border-black transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
                    <div className="flex items-start space-x-3">
                      <div className="w-12 h-12 bg-black rounded-xl flex items-center justify-center text-white font-black text-lg flex-shrink-0 group-hover:scale-110 transition-transform duration-300">
                        {dev.avatar}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-black text-black mb-0.5">{dev.name}</h3>
                        <p className="text-gray-600 text-xs mb-2 font-medium">{dev.exp} d'expérience</p>
                        
                        <div className="flex justify-between items-center mb-3">
                          <p className="text-gray-600 text-sm flex-1 truncate">{dev.desc}</p>
                          <Button className="bg-black text-white hover:bg-gray-800 font-bold px-4 py-1 rounded-lg ml-3 text-xs transform hover:scale-105 transition-all">
                            Profil →
                          </Button>
                        </div>
                        
                        <div className="flex gap-1 flex-wrap">
                          {dev.skills.map((skill, skillIndex) => (
                            <span key={skillIndex} className="px-2 py-0.5 bg-white text-black border border-gray-300 rounded text-xs font-medium hover:border-black transition-all duration-300">
                              {skill}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="text-center pt-4">
                <Link href="/developers">
                  <Button className="bg-black text-white hover:bg-gray-800 font-black px-6 py-3 rounded-xl border-2 border-black transform hover:scale-105 transition-all duration-300">
                    Voir tous les développeurs
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Comment ça marche Section - FOND NOIR */}
      <div className="bg-black py-20 relative overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-white opacity-5 rounded-full blur-2xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-48 h-48 bg-white opacity-3 rounded-full blur-2xl animate-pulse"></div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-black text-white mb-4 relative">
              Comment ça marche ?
              <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-24 h-1 bg-white rounded-full"></div>
            </h2>
            <p className="text-lg text-gray-300 max-w-2xl mx-auto font-medium">
              Connectez-vous avec les meilleurs talents en 3 étapes simples
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 max-w-5xl mx-auto">
            {[
              {
                number: "1",
                title: "Créez votre profil",
                description: "Inscrivez-vous en tant que client ou développeur et complétez votre profil"
              },
              {
                number: "2", 
                title: "Trouvez votre match",
                description: "Parcourez les projets ou développeurs qui correspondent à vos besoins"
              },
              {
                number: "3",
                title: "Collaborez",
                description: "Communiquez directement et réalisez vos projets en toute sécurité"
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

          <div className="text-center mt-12">
            <Link href="/auth/signup">
              <Button className="bg-white text-black hover:bg-gray-100 font-black px-8 py-4 text-lg rounded-2xl border-2 border-white transform hover:scale-105 transition-all duration-300 shadow-2xl">
                <span className="text-black font-black">Commencer maintenant</span>
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Testimonials - 3 AVIS ALIGNÉS */}
      <div className="bg-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-black text-black mb-4 relative">
              CE QUE DISENT NOS UTILISATEURS
              <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-24 h-1 bg-black rounded-full"></div>
            </h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto font-medium">
              Découvrez les témoignages de nos utilisateurs
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

      {/* CTA Final - RÉDUIT */}
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
              PRÊT À TRANSFORMER VOTRE BUSINESS ?
            </h2>
            
            <p className="text-lg text-gray-300 mb-10 max-w-3xl mx-auto font-light leading-relaxed">
              Rejoignez la communauté des entreprises qui ont choisi l'excellence en IA
            </p>
            
            {getFinalCTAButtons()}
          </div>
        </div>
      </div>
    </div>
  )
}
