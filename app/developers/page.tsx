'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import ContactDeveloperModal from '../../components/messaging/contact-developer-modal'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

interface Developer {
  id: string
  profiles: {
    full_name: string
    email: string
  }
  title: string
  bio: string
  skills: string[]
  specializations: string[]
  experience_years: number
  hourly_rate: number
  github_url: string
  linkedin_url: string
  portfolio_url: string
  availability: string
}

export default function DevelopersPage() {
  const [developers, setDevelopers] = useState<Developer[]>([])
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const [userProfile, setUserProfile] = useState<any>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedSpecialization, setSelectedSpecialization] = useState('')
  const [maxBudget, setMaxBudget] = useState('')
  const [selectedDeveloper, setSelectedDeveloper] = useState<Developer | null>(null)
  const [showContactModal, setShowContactModal] = useState(false)
  const router = useRouter()

  const specializationOptions = [
    'Machine Learning', 'Deep Learning', 'Computer Vision', 'NLP',
    'TensorFlow', 'PyTorch', 'OpenAI API', 'Automatisation RPA',
    'Web Scraping', 'Data Analysis', 'Chatbots', 'IA Conversationnelle'
  ]

  useEffect(() => {
    fetchDevelopers()
    checkUser()
  }, [])

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      setUser(user)
      const { data: profile } = await supabase
        .from('profiles')
        .select('user_type')
        .eq('id', user.id)
        .single()
      setUserProfile(profile)
    }
  }

  const fetchDevelopers = async () => {
    try {
      // Récupérer tous les developer_profiles
      const { data: devProfiles, error: devError } = await supabase
        .from('developer_profiles')
        .select('*')

      if (devError || !devProfiles || devProfiles.length === 0) {
        setLoading(false)
        return
      }

      // Récupérer les profils correspondants
      const devIds = devProfiles.map(dev => dev.id)
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, full_name, email')
        .in('id', devIds)

      // Combiner les données manuellement
      const combinedData = devProfiles.map(dev => {
        const profile = profiles?.find(p => p.id === dev.id)
        return {
          ...dev,
          profiles: profile || { full_name: 'Nom manquant', email: 'Email manquant' }
        }
      })

      if (combinedData) {
        setDevelopers(combinedData as any)
      }

    } catch (error) {
      console.error('Erreur:', error)
    }
    
    setLoading(false)
  }

  const handleContactDeveloper = (developer: Developer) => {
    if (!user) {
      router.push('/auth/login')
      return
    }
    
    if (userProfile?.user_type !== 'client') {
      alert('Seuls les clients peuvent contacter les développeurs')
      return
    }
    
    setSelectedDeveloper(developer)
    setShowContactModal(true)
  }

  const filteredDevelopers = developers.filter(dev => {
    const matchesSearch = !searchTerm || 
      dev.profiles?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      dev.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      dev.skills?.some(skill => skill.toLowerCase().includes(searchTerm.toLowerCase()))

    const matchesSpecialization = !selectedSpecialization ||
      dev.specializations?.includes(selectedSpecialization)

    const matchesBudget = !maxBudget || 
      dev.hourly_rate <= parseInt(maxBudget)

    return matchesSearch && matchesSpecialization && matchesBudget
  })

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-black text-xl">Chargement des développeurs...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header avec filtres - Fond Noir */}
      <div className="bg-black py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Titre */}
          <div className="mb-8">
            <h1 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              Trouvez votre développeur expert
            </h1>
            <p className="text-xl text-gray-300">
              Découvrez nos développeurs spécialisés en IA et automatisation
            </p>
          </div>

          {/* Filtres intégrés */}
          <div className="bg-gray-50 rounded-lg p-6 border-2 border-gray-200">
            <h2 className="text-lg font-semibold text-black mb-4">Filtres de recherche</h2>
            <div className="grid md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-black mb-2">
                  Recherche
                </label>
                <Input
                  type="text"
                  placeholder="Nom, compétence..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="bg-white border-2 border-gray-300 text-black placeholder-gray-400 focus:border-black"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-black mb-2">
                  Spécialisation
                </label>
                <select
                  value={selectedSpecialization}
                  onChange={(e) => setSelectedSpecialization(e.target.value)}
                  className="w-full bg-white border-2 border-gray-300 rounded-lg px-3 py-2 text-black focus:outline-none focus:border-black"
                >
                  <option value="">Toutes</option>
                  {specializationOptions.map(spec => (
                    <option key={spec} value={spec}>{spec}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-black mb-2">
                  Budget max (€/h)
                </label>
                <Input
                  type="number"
                  placeholder="100"
                  value={maxBudget}
                  onChange={(e) => setMaxBudget(e.target.value)}
                  className="bg-white border-2 border-gray-300 text-black placeholder-gray-400 focus:border-black"
                />
              </div>

              <div className="flex items-end">
                <Button
                  onClick={() => {
                    setSearchTerm('')
                    setSelectedSpecialization('')
                    setMaxBudget('')
                  }}
                  className="w-full bg-black border-2 border-black text-white hover:bg-gray-800"
                >
                  Réinitialiser
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Statistiques - Fond Blanc */}
      <div className="bg-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-6 mb-8">
            <div className="bg-gray-50 rounded-lg p-6 border-2 border-gray-200 hover:border-black transition-colors">
              <div className="text-3xl font-bold text-black">{developers.length}</div>
              <div className="text-gray-600 text-sm">Développeurs disponibles</div>
            </div>
            <div className="bg-gray-50 rounded-lg p-6 border-2 border-gray-200 hover:border-black transition-colors">
              <div className="text-3xl font-bold text-black">
                {developers.filter(d => d.specializations?.some(s => s.includes('Machine Learning') || s.includes('Deep Learning'))).length}
              </div>
              <div className="text-gray-600 text-sm">Experts IA</div>
            </div>
            <div className="bg-gray-50 rounded-lg p-6 border-2 border-gray-200 hover:border-black transition-colors">
              <div className="text-3xl font-bold text-black">
                {developers.filter(d => d.specializations?.some(s => s.includes('Automatisation') || s.includes('RPA'))).length}
              </div>
              <div className="text-gray-600 text-sm">Experts Automatisation</div>
            </div>
            <div className="bg-gray-50 rounded-lg p-6 border-2 border-gray-200 hover:border-black transition-colors">
              <div className="text-3xl font-bold text-black">
                {developers.length > 0 ? Math.round(developers.reduce((acc, d) => acc + (d.hourly_rate || 0), 0) / developers.length) : 0}€
              </div>
              <div className="text-gray-600 text-sm">Tarif moyen/h</div>
            </div>
          </div>

          {/* Résultats */}
          <div className="mb-6">
            <p className="text-gray-600">
              {filteredDevelopers.length} développeur(s) trouvé(s) sur {developers.length} total
            </p>
          </div>

          {/* Liste des développeurs */}
          <div className="grid gap-6">
            {filteredDevelopers.map((developer) => (
              <div key={developer.id} className="bg-gray-50 rounded-lg p-6 border-2 border-gray-200 hover:border-black transition-colors">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-bold text-black">
                        {developer.profiles?.full_name || 'Nom manquant'}
                      </h3>
                      <span className={`text-xs px-2 py-1 rounded-lg border-2 ${
                        developer.availability === 'available' ? 
                        'bg-green-100 text-green-700 border-green-200' : 
                        'bg-gray-100 text-gray-600 border-gray-200'
                      }`}>
                        {developer.availability === 'available' ? 'Disponible' : 'Occupé'}
                      </span>
                      <div className="flex items-center gap-2">
                        {developer.github_url && (
                          <a href={developer.github_url} target="_blank" rel="noopener noreferrer" 
                             className="text-gray-600 hover:text-black transition-colors text-sm underline">
                            GitHub
                          </a>
                        )}
                        {developer.linkedin_url && (
                          <a href={developer.linkedin_url} target="_blank" rel="noopener noreferrer"
                             className="text-gray-600 hover:text-black transition-colors text-sm underline">
                            LinkedIn
                          </a>
                        )}
                        {developer.portfolio_url && (
                          <a href={developer.portfolio_url} target="_blank" rel="noopener noreferrer"
                             className="text-gray-600 hover:text-black transition-colors text-sm underline">
                            Portfolio
                          </a>
                        )}
                      </div>
                    </div>
                    <p className="text-black font-medium mb-2">{developer.title || 'Titre manquant'}</p>
                    <p className="text-gray-600 mb-4">{developer.bio || 'Bio manquante'}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-black mb-1">
                      {developer.hourly_rate || 0}€/h
                    </div>
                    <div className="text-gray-600 text-sm">
                      {developer.experience_years || 0} ans d'exp.
                    </div>
                  </div>
                </div>

                {/* Compétences techniques */}
                {developer.skills && developer.skills.length > 0 && (
                  <div className="mb-4">
                    <h4 className="text-black text-sm font-medium mb-2">Compétences techniques:</h4>
                    <div className="flex flex-wrap gap-2">
                      {developer.skills.slice(0, 8).map((skill, index) => (
                        <span key={index} className="px-2 py-1 bg-white text-black border border-gray-300 rounded-lg text-xs">
                          {skill}
                        </span>
                      ))}
                      {developer.skills.length > 8 && (
                        <span className="px-2 py-1 bg-gray-100 text-gray-600 border border-gray-300 rounded-lg text-xs">
                          +{developer.skills.length - 8} autres
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* Spécialisations IA */}
                {developer.specializations && developer.specializations.length > 0 && (
                  <div className="mb-4">
                    <h4 className="text-black text-sm font-medium mb-2">Spécialisations IA & Automatisation:</h4>
                    <div className="flex flex-wrap gap-2">
                      {developer.specializations.map((spec, index) => (
                        <span key={index} className="px-2 py-1 bg-black text-white rounded-lg text-xs">
                          {spec}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Actions conditionnelles */}
                <div className="flex gap-3">
                  <Button className="bg-black border-2 border-black text-white hover:bg-gray-800">
                    Voir le profil complet
                  </Button>
                  
                  {/* Bouton Contact conditionnel */}
                  {!user ? (
                    <Link href="/auth/signup">
                      <Button className="bg-black text-white hover:bg-gray-800 border-2 border-black">
                        S'inscrire pour contacter
                      </Button>
                    </Link>
                  ) : userProfile?.user_type === 'client' ? (
                    <Button 
                      onClick={() => handleContactDeveloper(developer)}
                      className="bg-black text-white hover:bg-gray-800 border-2 border-black"
                    >
                      Envoyer un message
                    </Button>
                  ) : (
                    <Button 
                      disabled
                      className="bg-gray-400 text-gray-600 cursor-not-allowed border-2 border-gray-400"
                    >
                      Réservé aux clients
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {filteredDevelopers.length === 0 && (
            <div className="text-center py-12">
              <h3 className="text-xl font-semibold text-black mb-2">
                {developers.length === 0 ? 'Aucun développeur disponible' : 'Aucun développeur trouvé'}
              </h3>
              <p className="text-gray-600 mb-6">
                {developers.length === 0 
                  ? 'Soyez les premiers à vous inscrire comme développeur !' 
                  : 'Essayez d\'ajuster vos critères de recherche'}
              </p>
              <div className="flex gap-3 justify-center">
                {!user ? (
                  <>
                    <Link href="/auth/signup">
                      <Button className="bg-black text-white hover:bg-gray-800 border-2 border-black">
                        Créer un compte client
                      </Button>
                    </Link>
                    <Link href="/auth/login">
                      <Button className="border-2 border-black text-black hover:bg-black hover:text-white bg-white">
                        Se connecter
                      </Button>
                    </Link>
                  </>
                ) : userProfile?.user_type === 'developer' ? (
                  <Link href="/dashboard/developer/profile">
                    <Button className="bg-black text-white hover:bg-gray-800 border-2 border-black">
                      Compléter votre profil
                    </Button>
                  </Link>
                ) : null}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal de contact */}
      {selectedDeveloper && (
        <ContactDeveloperModal
          developer={selectedDeveloper}
          isOpen={showContactModal}
          onClose={() => {
            setShowContactModal(false)
            setSelectedDeveloper(null)
          }}
        />
      )}
    </div>
  )
}
