'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Button } from '../../components/ui/button'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// Langues disponibles avec leurs drapeaux
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

// Composant d'affichage des étoiles
const StarRating = ({ rating, totalRatings }: { rating: number; totalRatings?: number }) => {
  if (!rating) return (
    <div className="flex items-center space-x-1">
      <div className="flex">
        {[1, 2, 3, 4, 5].map((star) => (
          <span key={star} className="text-sm text-gray-300">⭐</span>
        ))}
      </div>
      <span className="text-xs text-gray-500">Pas encore noté</span>
    </div>
  );
  
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

export default function DevelopersPage() {
  const [developers, setDevelopers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedSkills, setSelectedSkills] = useState<string[]>([])
  const [sortBy, setSortBy] = useState('rating')
  const [allSkills, setAllSkills] = useState<string[]>([])

  useEffect(() => {
    loadDevelopers()
  }, [])

  const loadDevelopers = async () => {
    try {
      console.log('🔄 Chargement des développeurs...')
      
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_type', 'developer')

      if (profilesError) throw profilesError

      if (profiles && profiles.length > 0) {
        // Charger les détails et notes pour chaque développeur
        const developersWithDetails = await Promise.all(
          profiles.map(async (profile) => {
            const { data: devProfile } = await supabase
              .from('developer_profiles')
              .select('*')
              .eq('id', profile.id)
              .single()

            return {
              ...profile,
              ...devProfile,
              // S'assurer que les données de base ne sont pas écrasées
              id: profile.id,
              full_name: profile.full_name,
              email: profile.email,
              avatar_url: profile.avatar_url,
              user_type: profile.user_type
            }
          })
        )

        console.log('✅ Développeurs chargés avec notes:', developersWithDetails)

        // Trier par note par défaut (du mieux noté au moins bien noté)
        const sortedDevelopers = developersWithDetails.sort((a, b) => {
          const ratingA = a.average_rating || 0
          const ratingB = b.average_rating || 0
          return ratingB - ratingA // Tri décroissant
        })

        setDevelopers(sortedDevelopers)

        // Extraire toutes les compétences uniques
        const skills = new Set<string>()
        developersWithDetails.forEach(dev => {
          if (dev.skills && Array.isArray(dev.skills)) {
            dev.skills.forEach((skill: string) => skills.add(skill))
          }
        })
        setAllSkills(Array.from(skills))
      }
    } catch (error) {
      console.error('Erreur lors du chargement des développeurs:', error)
    } finally {
      setLoading(false)
    }
  }

  // Filtrer et trier les développeurs
  const filteredAndSortedDevelopers = developers
    .filter(dev => {
      const matchesSearch = !searchTerm || 
        dev.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        dev.bio?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        dev.skills?.some((skill: string) => skill.toLowerCase().includes(searchTerm.toLowerCase()))

      const matchesSkills = selectedSkills.length === 0 || 
        selectedSkills.every(skill => dev.skills?.includes(skill))

      return matchesSearch && matchesSkills
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'rating':
          return (b.average_rating || 0) - (a.average_rating || 0)
        case 'experience':
          return (b.experience_years || 0) - (a.experience_years || 0)
        case 'name':
          return (a.full_name || '').localeCompare(b.full_name || '')
        case 'recent':
          return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
        default:
          return 0
      }
    })

  const toggleSkill = (skill: string) => {
    setSelectedSkills(prev => 
      prev.includes(skill) 
        ? prev.filter(s => s !== skill)
        : [...prev, skill]
    )
  }

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
      
      {/* Header avec fond noir et étoiles */}
      <div className="relative bg-black text-white py-20 overflow-hidden">
        {/* Particules flottantes */}
        <div className="absolute inset-0 overflow-hidden">
          {[...Array(15)].map((_, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 bg-white rounded-full opacity-30 animate-pulse"
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
          <div className="w-64 h-64 bg-white opacity-5 rounded-full blur-3xl animate-pulse"></div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-black mb-6 text-white leading-tight">
            <span className="block">NOS DÉVELOPPEURS</span>
            <span className="block text-gray-300">EXPERTS EN IA</span>
          </h1>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto mb-8 font-medium">
            Découvrez les meilleurs talents spécialisés en intelligence artificielle et automatisation
          </p>
          <div className="text-lg text-gray-400">
            ⭐ {filteredAndSortedDevelopers.length} développeur{filteredAndSortedDevelopers.length > 1 ? 's' : ''} disponible{filteredAndSortedDevelopers.length > 1 ? 's' : ''}
          </div>
        </div>
      </div>

      {/* Transition */}
      <div className="h-4 bg-gradient-to-b from-black to-white"></div>

      {/* Contenu principal */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Filtres et tri */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 mb-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Recherche */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Rechercher
              </label>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Nom, compétences, description..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
              />
            </div>

            {/* Tri */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Trier par
              </label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
              >
                <option value="rating">⭐ Mieux notés</option>
                <option value="experience">📈 Plus d'expérience</option>
                <option value="recent">🆕 Plus récents</option>
                <option value="name">📝 Ordre alphabétique</option>
              </select>
            </div>

            {/* Compétences */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Compétences
              </label>
              <div className="flex flex-wrap gap-2 max-h-20 overflow-y-auto">
                {allSkills.slice(0, 8).map(skill => (
                  <button
                    key={skill}
                    onClick={() => toggleSkill(skill)}
                    className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                      selectedSkills.includes(skill)
                        ? 'bg-black text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {skill}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Filtres actifs */}
          {(searchTerm || selectedSkills.length > 0) && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-500">Filtres actifs:</span>
                {searchTerm && (
                  <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">
                    "{searchTerm}"
                  </span>
                )}
                {selectedSkills.map(skill => (
                  <span key={skill} className="px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs">
                    {skill}
                  </span>
                ))}
                <button
                  onClick={() => {
                    setSearchTerm('')
                    setSelectedSkills([])
                  }}
                  className="text-xs text-gray-500 hover:text-gray-700"
                >
                  Effacer tout
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Résultats */}
        <div className="mb-4">
          <p className="text-sm text-gray-600">
            {filteredAndSortedDevelopers.length} développeur{filteredAndSortedDevelopers.length > 1 ? 's' : ''} trouvé{filteredAndSortedDevelopers.length > 1 ? 's' : ''}
          </p>
        </div>

        {/* Liste des développeurs */}
        {filteredAndSortedDevelopers.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">🔍</span>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Aucun développeur trouvé
            </h3>
            <p className="text-gray-600">
              Essayez de modifier vos critères de recherche
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredAndSortedDevelopers.map((developer) => (
              <div key={developer.id} className="group bg-gray-50 rounded-2xl p-4 border-2 border-gray-200 hover:border-black transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
                
                {/* Header avec avatar et note */}
                <div className="flex items-start space-x-3 mb-4">
                  <div className="w-12 h-12 rounded-xl overflow-hidden bg-gray-200 flex-shrink-0 group-hover:scale-110 transition-transform duration-300">
                    {developer.avatar_url ? (
                      <img
                        src={developer.avatar_url}
                        alt={developer.full_name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-black flex items-center justify-center text-white font-black text-lg">
                        {developer.full_name?.charAt(0).toUpperCase() || 'D'}
                      </div>
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    {/* Nom avec drapeaux des langues */}
                    <div className="flex items-center gap-2 mb-0.5">
                      <h3 className="text-lg font-black text-black group-hover:text-gray-700 transition-colors">
                        {developer.full_name || 'Développeur'}
                      </h3>
                      {/* Drapeaux des langues parlées */}
                      {developer.languages && developer.languages.length > 0 && (
                        <div className="flex gap-1">
                          {developer.languages.slice(0, 2).map((langCode: string, langIndex: number) => (
                            <span key={langIndex} className="text-sm" title={LANGUAGES[langCode as keyof typeof LANGUAGES]?.name}>
                              {LANGUAGES[langCode as keyof typeof LANGUAGES]?.flag || '🌐'}
                            </span>
                          ))}
                          {developer.languages.length > 2 && (
                            <span className="text-xs text-gray-500" title={`+${developer.languages.length - 2} autres langues`}>
                              +{developer.languages.length - 2}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                    
                    {/* Affichage de la note */}
                    <StarRating rating={developer.average_rating} totalRatings={developer.total_ratings} />
                  </div>
                </div>

                {/* Info développeur */}
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center text-sm text-gray-600">
                      <span className="font-medium">
                        {developer.experience_years ? `${developer.experience_years}+ ans` : 'Expert'} d'expérience
                      </span>
                    </div>
                    {developer.hourly_rate && (
                      <span className="font-medium text-green-600 text-sm">
                        {developer.hourly_rate}€/h
                      </span>
                    )}
                  </div>
                  
                  <p className="text-gray-600 text-sm line-clamp-2">
                    {developer.bio || 'Développeur spécialisé en IA et automatisation'}
                  </p>
                </div>

                {/* Compétences */}
                <div className="mb-4">
                  <div className="flex flex-wrap gap-1">
                    {developer.skills && developer.skills.length > 0 ? 
                      developer.skills.slice(0, 2).map((skill: string, index: number) => (
                        <span
                          key={index}
                          className="px-2 py-1 bg-gradient-to-r from-purple-600 to-blue-600 text-white text-xs font-medium rounded hover:scale-105 transition-all duration-300"
                        >
                          {skill}
                        </span>
                      )) : (
                        <>
                          <span className="px-2 py-1 bg-gradient-to-r from-purple-600 to-blue-600 text-white text-xs font-medium rounded">
                            React
                          </span>
                          <span className="px-2 py-1 bg-gradient-to-r from-purple-600 to-blue-600 text-white text-xs font-medium rounded">
                            IA
                          </span>
                        </>
                      )
                    }
                    {developer.skills && developer.skills.length > 2 && (
                      <span className="px-2 py-1 bg-gray-200 text-gray-600 text-xs font-medium rounded">
                        +{developer.skills.length - 2}
                      </span>
                    )}
                  </div>
                </div>

                {/* Disponibilité */}
                <div className="mb-4">
                  <div className="flex items-center space-x-2">
                    <div className={`w-2 h-2 rounded-full ${
                      developer.availability === 'available' ? 'bg-green-500' : 
                      developer.availability === 'busy' ? 'bg-yellow-500' : 'bg-red-500'
                    }`}></div>
                    <span className="text-xs text-gray-600">
                      {developer.availability === 'available' ? 'Disponible' : 
                       developer.availability === 'busy' ? 'Occupé' : 'Non disponible'}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex space-x-2">
                  <Link href={`/developer/${developer.id}`} className="flex-1">
                    <Button className="w-full bg-black text-white hover:bg-gray-800 font-bold py-2 rounded-lg text-sm transition-all duration-300 hover:scale-105">
                      Voir le profil →
                    </Button>
                  </Link>
                  <Button className="border border-gray-300 text-gray-700 hover:bg-gray-50 font-medium px-4 py-2 rounded-lg text-sm">
                    💬
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination - Pour plus tard */}
        {filteredAndSortedDevelopers.length > 12 && (
          <div className="mt-12 flex justify-center">
            <div className="flex space-x-2">
              <Button className="border border-gray-300 text-gray-700 hover:bg-gray-50 font-medium px-4 py-2 rounded-lg text-sm">
                Précédent
              </Button>
              <Button className="bg-black text-white font-medium px-4 py-2 rounded-lg text-sm">
                1
              </Button>
              <Button className="border border-gray-300 text-gray-700 hover:bg-gray-50 font-medium px-4 py-2 rounded-lg text-sm">
                2
              </Button>
              <Button className="border border-gray-300 text-gray-700 hover:bg-gray-50 font-medium px-4 py-2 rounded-lg text-sm">
                Suivant
              </Button>
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
    </div>
  )
}
