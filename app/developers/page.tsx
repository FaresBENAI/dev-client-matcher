'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Button } from '../../components/ui/button'
import { createClient } from '@/lib/supabase'
import DeveloperRateDisplay from '../../components/DeveloperRateDisplay' // 🆕 NOUVEAU
import { X } from 'lucide-react' // Added for the new filter clear buttons
import { Search } from 'lucide-react' // Added for the new search icon
import { useLanguage } from '@/contexts/LanguageContext'
import { ensureDeveloperProfile } from '@/utils/developer-profile-helper'

const supabase = createClient()

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

// Composant étoiles pour les notes
function StarRating({ rating, totalRatings }: { rating: number, totalRatings: number }) {
  const stars = [];
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 !== 0;

  for (let i = 0; i < 5; i++) {
    if (i < fullStars) {
      stars.push(<span key={i} className="text-yellow-400">★</span>);
    } else if (i === fullStars && hasHalfStar) {
      stars.push(<span key={i} className="text-yellow-400">☆</span>);
    } else {
      stars.push(<span key={i} className="text-gray-300">☆</span>);
    }
  }

  return (
    <div className="flex items-center space-x-1">
      <div className="flex">{stars}</div>
      <span className="text-xs text-gray-600">
        {rating ? `${rating.toFixed(1)} (${totalRatings || 0})` : 'Nouveau'}
      </span>
    </div>
  );
}

export default function DevelopersPage() {
  const [developers, setDevelopers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedSkills, setSelectedSkills] = useState<string[]>([])
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>([])
  const [sortBy, setSortBy] = useState('rating')
  const [allSkills, setAllSkills] = useState<string[]>([])
  const [allLanguages, setAllLanguages] = useState<string[]>([])
  const { t } = useLanguage()

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

            // Si le profil développeur n'existe pas, essayer de le créer
            if (!devProfile) {
              console.log(`⚠️ Profil développeur manquant pour ${profile.full_name}, création...`)
              await ensureDeveloperProfile(profile.id)
              
              // Recharger après création
              const { data: newDevProfile } = await supabase
                .from('developer_profiles')
                .select('*')
                .eq('id', profile.id)
                .single()
              
              return {
                ...profile,
                ...newDevProfile,
                // S'assurer que les données de base ne sont pas écrasées
                id: profile.id,
                full_name: profile.full_name,
                email: profile.email,
                avatar_url: profile.avatar_url,
                user_type: profile.user_type
              }
            }

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

        // Extraire toutes les langues uniques
        const languages = new Set<string>()
        developersWithDetails.forEach(dev => {
          if (dev.languages && Array.isArray(dev.languages)) {
            dev.languages.forEach((langCode: string) => languages.add(langCode))
          }
        })
        setAllLanguages(Array.from(languages))
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

      const matchesLanguages = selectedLanguages.length === 0 || 
        selectedLanguages.every(lang => dev.languages?.includes(lang))

      return matchesSearch && matchesSkills && matchesLanguages
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
        case 'tjm': // 🆕 NOUVEAU: Tri par TJM
          const tjmA = a.daily_rate_defined === false ? 0 : (a.daily_rate || 0)
          const tjmB = b.daily_rate_defined === false ? 0 : (b.daily_rate || 0)
          return tjmB - tjmA
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

  const toggleLanguage = (lang: string) => {
    setSelectedLanguages(prev => 
      prev.includes(lang) 
        ? prev.filter(l => l !== lang)
        : [...prev, lang]
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
            <span className="block">{t('developers.title.1')}</span>
            <span className="block text-gray-300">{t('developers.title.2')}</span>
          </h1>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto mb-8 font-medium">
            {t('developers.subtitle')}
          </p>
          <div className="text-lg text-gray-400">
            ⭐ {filteredAndSortedDevelopers.length} {t('home.developers.count')}{filteredAndSortedDevelopers.length > 1 ? 's' : ''} {t('home.developers.available')}{filteredAndSortedDevelopers.length > 1 ? 's' : ''}
          </div>
        </div>
      </div>

      {/* Transition */}
      <div className="h-4 bg-gradient-to-b from-black to-white"></div>

      {/* Ancien design des filtres - Interface simple */}
      <div className="bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Barre de recherche */}
          <div className="mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder={t('developers.search')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
              />
            </div>
          </div>

          {/* Filtres */}
          <div className="flex flex-wrap gap-8 mb-6">
            {/* Filtre Tri */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">{t('developers.sort')}</label>
              <div className="relative">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="appearance-none w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent bg-white pr-10 cursor-pointer hover:border-gray-400 transition-colors"
                >
                  <option value="rating">Note</option>
                  <option value="experience">Expérience</option>
                  <option value="name">Nom</option>
                  <option value="recent">Plus récent</option>
                  <option value="tjm">TJM</option>
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">{t('developers.skills')}</label>
              <div className="flex flex-wrap gap-2 max-w-xs">
                {allSkills.slice(0, 6).map(skill => (
                  <button
                    key={skill}
                    onClick={() => toggleSkill(skill)}
                    className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                      selectedSkills.includes(skill)
                        ? 'bg-purple-600 text-white shadow-md'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    {skill}
                  </button>
                ))}
              </div>
            </div>

            {/* Filtre Langues */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">{t('developers.languages')}</label>
              <div className="flex flex-wrap gap-2 max-w-xs">
                {allLanguages.slice(0, 6).map(lang => (
                  <button
                    key={lang}
                    onClick={() => toggleLanguage(lang)}
                    className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                      selectedLanguages.includes(lang)
                        ? 'bg-green-600 text-white shadow-md'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    {LANGUAGES[lang as keyof typeof LANGUAGES]?.flag || '🌐'} {LANGUAGES[lang as keyof typeof LANGUAGES]?.name || lang}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Filtres actifs */}
          {(searchTerm || selectedSkills.length > 0 || selectedLanguages.length > 0) && (
            <div className="mb-6">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm text-gray-600">Filtres actifs:</span>
                {searchTerm && (
                  <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm">
                    Recherche: "{searchTerm}"
                    <button
                      onClick={() => setSearchTerm('')}
                      className="ml-1 hover:bg-blue-200 rounded"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                )}
                {selectedSkills.map(skill => (
                  <span key={skill} className="bg-purple-100 text-purple-800 px-2 py-1 rounded text-sm">
                    {skill}
                    <button
                      onClick={() => toggleSkill(skill)}
                      className="ml-1 hover:bg-purple-200 rounded"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
                {selectedLanguages.map(lang => (
                  <span key={lang} className="bg-green-100 text-green-800 px-2 py-1 rounded text-sm">
                    {LANGUAGES[lang as keyof typeof LANGUAGES]?.flag || '🌐'} {LANGUAGES[lang as keyof typeof LANGUAGES]?.name || lang}
                    <button
                      onClick={() => toggleLanguage(lang)}
                      className="ml-1 hover:bg-green-200 rounded"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
                <button
                  onClick={() => {
                    setSearchTerm('')
                    setSelectedSkills([])
                    setSelectedLanguages([])
                  }}
                  className="text-sm text-gray-600 hover:text-gray-800 underline"
                >
                  Effacer tous les filtres
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Résultats */}
      <div className="py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-6">
            <p className="text-sm text-gray-600">
              {filteredAndSortedDevelopers.length} {t('home.developers.count')}{filteredAndSortedDevelopers.length > 1 ? 's' : ''} trouvé{filteredAndSortedDevelopers.length > 1 ? 's' : ''}
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
                          {developer.experience_years ? `${developer.experience_years}+ ${t('developers.experience')}` : t('developers.expert')}
                        </span>
                      </div>
                      {/* 🆕 NOUVEAU: Remplacement du TJMDisplay par DeveloperRateDisplay */}
                      <DeveloperRateDisplay 
                        dailyRate={developer.daily_rate} 
                        dailyRateDefined={developer.daily_rate_defined} 
                        size="small"
                      />
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
                        {developer.availability === 'available' ? t('developers.available') : 
                         developer.availability === 'busy' ? t('developers.busy') : t('developers.unavailable')}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex space-x-2">
                    <Link href={`/developer/${developer.id}`} className="flex-1">
                      <Button className="w-full bg-black text-white hover:bg-gray-800 font-bold py-2 rounded-lg text-sm transition-all duration-300 hover:scale-105">
                        {t('developers.see.profile')} →
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
