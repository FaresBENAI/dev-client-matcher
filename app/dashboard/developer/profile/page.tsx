'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

export default function DeveloperProfile() {
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [activeSection, setActiveSection] = useState('profile')
  const [message, setMessage] = useState('')
  const [formData, setFormData] = useState({
    // Données pour table profiles
    full_name: '',
    bio: '',
    // Données pour table developer_profiles
    title: '',
    skills: '',
    specializations: '',
    experience_years: '',
    hourly_rate: '',
    github_url: '',
    linkedin_url: '',
    portfolio_url: '',
    availability: ''
  })

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        window.location.href = '/auth/login'
        return
      }
      setUser(user)

      // Récupérer le profil de base
      const { data: baseProfile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      // Récupérer le profil développeur
      const { data: devProfile } = await supabase
        .from('developer_profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (baseProfile) {
        setProfile(baseProfile)
        setFormData({
          // Données de profiles
          full_name: baseProfile.full_name || '',
          bio: baseProfile.bio || '',
          // Données de developer_profiles
          title: devProfile?.title || '',
          skills: Array.isArray(devProfile?.skills) ? devProfile.skills.join(', ') : (devProfile?.skills || ''),
          specializations: Array.isArray(devProfile?.specializations) ? devProfile.specializations.join(', ') : (devProfile?.specializations || ''),
          experience_years: devProfile?.experience_years || '',
          hourly_rate: devProfile?.hourly_rate || '',
          github_url: devProfile?.github_url || '',
          linkedin_url: devProfile?.linkedin_url || '',
          portfolio_url: devProfile?.portfolio_url || '',
          availability: devProfile?.availability || 'available'
        })
      }
      setLoading(false)
    }

    init()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setMessage('')

    try {
      // 1. Mettre à jour la table profiles
      const profileData = {
        full_name: formData.full_name,
        bio: formData.bio
      }

      const { error: profileError } = await supabase
        .from('profiles')
        .update(profileData)
        .eq('id', user.id)

      if (profileError) {
        setMessage('Erreur lors de la sauvegarde du profil: ' + profileError.message)
        return
      }

      // 2. Préparer les données pour developer_profiles
      const developerData = {
        title: formData.title,
        skills: formData.skills ? formData.skills.split(',').map(s => s.trim()) : [],
        specializations: formData.specializations ? formData.specializations.split(',').map(s => s.trim()) : [],
        experience_years: formData.experience_years ? parseInt(formData.experience_years) : null,
        hourly_rate: formData.hourly_rate ? parseInt(formData.hourly_rate) : null,
        github_url: formData.github_url,
        linkedin_url: formData.linkedin_url,
        portfolio_url: formData.portfolio_url,
        availability: formData.availability
      }

      // 3. Vérifier si le profil développeur existe
      const { data: existingDevProfile } = await supabase
        .from('developer_profiles')
        .select('id')
        .eq('id', user.id)
        .single()

      let devError;
      if (existingDevProfile) {
        // Mettre à jour
        const { error } = await supabase
          .from('developer_profiles')
          .update(developerData)
          .eq('id', user.id)
        devError = error
      } else {
        // Créer
        const { error } = await supabase
          .from('developer_profiles')
          .insert({ id: user.id, ...developerData })
        devError = error
      }

      if (devError) {
        setMessage('Erreur lors de la sauvegarde du profil développeur: ' + devError.message)
        return
      }

      setMessage('✅ Profil mis à jour avec succès !')
      setTimeout(() => setMessage(''), 3000)
    } catch (err) {
      console.error('Erreur:', err)
      setMessage('Erreur lors de la sauvegarde')
    } finally {
      setSaving(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const getCompletionPercentage = () => {
    const fields = [formData.full_name, formData.title, formData.bio, formData.skills, formData.experience_years, formData.hourly_rate]
    const filledFields = fields.filter(field => field && field.toString().trim() !== '').length
    return Math.round((filledFields / fields.length) * 100)
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

  const completion = getCompletionPercentage()

  return (
    <div className="min-h-screen bg-white">
      {/* Header Section - FOND NOIR avec gradient diagonal NOUVEAUTÉ */}
      <div className="bg-gradient-to-br from-black via-gray-900 to-black py-12 relative overflow-hidden">
        {/* Pattern géométrique subtil en arrière-plan */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-0 left-0 w-full h-full" 
               style={{backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`}} />
        </div>
        
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="flex flex-col lg:flex-row items-center gap-8">
            {/* Avatar avec effet lumineux */}
            <div className="text-center lg:text-left">
              <div className="relative">
                <div className="w-24 h-24 bg-white rounded-3xl flex items-center justify-center mx-auto lg:mx-0 mb-4 shadow-2xl transform transition-transform duration-300 hover:scale-110">
                  <span className="text-4xl font-black text-black">
                    {formData.full_name?.charAt(0).toUpperCase() || 'D'}
                  </span>
                </div>
                {/* Barre de progression circulaire NOUVEAUTÉ */}
                <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 lg:translate-x-0 lg:left-auto lg:right-0">
                  <div className="relative w-16 h-16">
                    <svg className="transform -rotate-90 w-16 h-16">
                      <circle
                        cx="32"
                        cy="32"
                        r="28"
                        stroke="rgba(255,255,255,0.1)"
                        strokeWidth="4"
                        fill="transparent"
                      />
                      <circle
                        cx="32"
                        cy="32"
                        r="28"
                        stroke="white"
                        strokeWidth="4"
                        fill="transparent"
                        strokeDasharray={`${2 * Math.PI * 28}`}
                        strokeDashoffset={`${2 * Math.PI * 28 * (1 - completion / 100)}`}
                        className="transition-all duration-1000"
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-white text-xs font-black">{completion}%</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Infos principales avec design moderne */}
            <div className="flex-1 text-center lg:text-left">
              <h1 className="text-4xl font-black text-white mb-3">
                {formData.full_name || 'Votre Nom'}
              </h1>
              <p className="text-xl text-gray-300 font-medium mb-6">
                {formData.title || 'Votre titre professionnel'}
              </p>
              
              {/* Stats grid moderne */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                <div className="bg-white bg-opacity-10 backdrop-blur rounded-xl p-3 border border-white border-opacity-20">
                  <div className="text-2xl font-black text-white">{formData.experience_years || '0'}</div>
                  <div className="text-gray-300 font-medium">années</div>
                </div>
                <div className="bg-white bg-opacity-10 backdrop-blur rounded-xl p-3 border border-white border-opacity-20">
                  <div className="text-2xl font-black text-white">{formData.hourly_rate || '0'}€</div>
                  <div className="text-gray-300 font-medium">par heure</div>
                </div>
                <div className="bg-white bg-opacity-10 backdrop-blur rounded-xl p-3 border border-white border-opacity-20">
                  <div className="text-2xl font-black text-white">{formData.skills.split(',').filter(s => s.trim()).length}</div>
                  <div className="text-gray-300 font-medium">compétences</div>
                </div>
                <div className="bg-white bg-opacity-10 backdrop-blur rounded-xl p-3 border border-white border-opacity-20">
                  <div className={`px-3 py-1 rounded-full text-xs font-bold ${
                    formData.availability === 'available' ? 'bg-white text-black' : 'bg-gray-600 text-gray-300'
                  }`}>
                    {formData.availability === 'available' ? '● DISPONIBLE' : '● OCCUPÉ'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation par sections - NOUVEAUTÉ */}
      <div className="bg-gray-50 border-b-2 border-gray-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex overflow-x-auto space-x-1 py-4">
            {[
              { id: 'profile', label: 'Profil', icon: '👤', desc: 'Infos de base' },
              { id: 'skills', label: 'Compétences', icon: '🎯', desc: 'Skills & spé' },
              { id: 'rates', label: 'Tarifs', icon: '💰', desc: 'Prix & dispo' },
              { id: 'links', label: 'Portfolio', icon: '🔗', desc: 'Liens pro' }
            ].map((section) => (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                className={`flex-shrink-0 px-4 py-3 rounded-xl font-black text-sm transition-all duration-300 transform hover:scale-105 group ${
                  activeSection === section.id
                    ? 'bg-black text-white border-2 border-black shadow-lg'
                    : 'bg-white text-black border-2 border-gray-300 hover:border-black'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <span className="text-lg">{section.icon}</span>
                  <div className="hidden sm:block text-left">
                    <div>{section.label}</div>
                    <div className="text-xs opacity-70">{section.desc}</div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content - FOND BLANC */}
      <div className="bg-white py-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Barre de progression et message de succès */}
          <div className="mb-8">
            {message && (
              <div className={`p-4 rounded-xl border-2 mb-4 ${
                message.includes('✅') 
                  ? 'bg-white border-black text-black' 
                  : 'bg-white border-red-300 text-red-700'
              }`}>
                <div className="flex items-center">
                  <span className="mr-2 text-xl">{message.includes('✅') ? '✅' : '⚠️'}</span>
                  <span className="font-medium">{message}</span>
                </div>
              </div>
            )}
            
            <div className="bg-gray-50 rounded-xl p-6 border-2 border-gray-200">
              <div className="flex justify-between items-center mb-3">
                <h3 className="font-black text-black">Complétude du profil</h3>
                <span className="text-2xl font-black text-black">{completion}%</span>
              </div>
              <div className="w-full bg-gray-300 rounded-full h-3">
                <div 
                  className="bg-black h-3 rounded-full transition-all duration-1000"
                  style={{ width: `${completion}%` }}
                />
              </div>
              <p className="text-gray-600 text-sm mt-2 font-medium">
                {completion < 70 ? 'Complétez votre profil pour attirer plus de clients' : 'Excellent ! Votre profil est très complet'}
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            
            {/* Section Profil */}
            {activeSection === 'profile' && (
              <div className="bg-gray-50 rounded-2xl p-8 border-2 border-gray-200">
                <h2 className="text-2xl font-black text-black mb-6 uppercase tracking-wider">
                  👤 INFORMATIONS PERSONNELLES
                </h2>
                
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-bold text-black mb-2">
                      Nom complet <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="full_name"
                      value={formData.full_name}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 bg-white border-2 border-gray-300 rounded-lg text-black placeholder-gray-400 focus:border-black focus:outline-none font-medium"
                      placeholder="John Doe"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-black mb-2">
                      Titre professionnel
                    </label>
                    <input
                      type="text"
                      name="title"
                      value={formData.title}
                      onChange={handleChange}
                      className="w-full px-4 py-3 bg-white border-2 border-gray-300 rounded-lg text-black placeholder-gray-400 focus:border-black focus:outline-none font-medium"
                      placeholder="Développeur Full-Stack spécialisé IA"
                    />
                  </div>
                </div>

                <div className="mt-6">
                  <label className="block text-sm font-bold text-black mb-2">
                    Bio / Présentation
                  </label>
                  <textarea
                    name="bio"
                    value={formData.bio}
                    onChange={handleChange}
                    rows={4}
                    className="w-full px-4 py-3 bg-white border-2 border-gray-300 rounded-lg text-black placeholder-gray-400 focus:border-black focus:outline-none font-medium"
                    placeholder="Parlez-nous de vous, votre expérience, vos passions..."
                  />
                </div>
              </div>
            )}

            {/* Section Compétences */}
            {activeSection === 'skills' && (
              <div className="bg-gray-50 rounded-2xl p-8 border-2 border-gray-200">
                <h2 className="text-2xl font-black text-black mb-6 uppercase tracking-wider">
                  🎯 COMPÉTENCES & SPÉCIALISATIONS
                </h2>
                
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-bold text-black mb-2">
                      Compétences principales (séparées par des virgules)
                    </label>
                    <input
                      type="text"
                      name="skills"
                      value={formData.skills}
                      onChange={handleChange}
                      className="w-full px-4 py-3 bg-white border-2 border-gray-300 rounded-lg text-black placeholder-gray-400 focus:border-black focus:outline-none font-medium"
                      placeholder="Python, React, Node.js, Machine Learning, PostgreSQL"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-black mb-2">
                      Spécialisations (séparées par des virgules)
                    </label>
                    <input
                      type="text"
                      name="specializations"
                      value={formData.specializations}
                      onChange={handleChange}
                      className="w-full px-4 py-3 bg-white border-2 border-gray-300 rounded-lg text-black placeholder-gray-400 focus:border-black focus:outline-none font-medium"
                      placeholder="Intelligence Artificielle, Automatisation, Data Science"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Section Tarifs */}
            {activeSection === 'rates' && (
              <div className="bg-gray-50 rounded-2xl p-8 border-2 border-gray-200">
                <h2 className="text-2xl font-black text-black mb-6 uppercase tracking-wider">
                  💰 TARIFS & DISPONIBILITÉ
                </h2>
                
                <div className="grid md:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-sm font-bold text-black mb-2">
                      Années d'expérience
                    </label>
                    <input
                      type="number"
                      name="experience_years"
                      value={formData.experience_years}
                      onChange={handleChange}
                      min="0"
                      max="50"
                      className="w-full px-4 py-3 bg-white border-2 border-gray-300 rounded-lg text-black placeholder-gray-400 focus:border-black focus:outline-none font-medium"
                      placeholder="5"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-black mb-2">
                      Tarif horaire (€)
                    </label>
                    <input
                      type="number"
                      name="hourly_rate"
                      value={formData.hourly_rate}
                      onChange={handleChange}
                      min="0"
                      className="w-full px-4 py-3 bg-white border-2 border-gray-300 rounded-lg text-black placeholder-gray-400 focus:border-black focus:outline-none font-medium"
                      placeholder="50"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-black mb-2">
                      Disponibilité
                    </label>
                    <select
                      name="availability"
                      value={formData.availability}
                      onChange={handleChange}
                      className="w-full px-4 py-3 bg-white border-2 border-gray-300 rounded-lg text-black focus:border-black focus:outline-none font-medium"
                    >
                      <option value="available">🟢 Disponible</option>
                      <option value="busy">🟡 Occupé</option>
                      <option value="unavailable">🔴 Non disponible</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* Section Portfolio */}
            {activeSection === 'links' && (
              <div className="bg-gray-50 rounded-2xl p-8 border-2 border-gray-200">
                <h2 className="text-2xl font-black text-black mb-6 uppercase tracking-wider">
                  🔗 PORTFOLIO & RÉSEAUX
                </h2>
                
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-bold text-black mb-2">
                      🐙 GitHub
                    </label>
                    <input
                      type="url"
                      name="github_url"
                      value={formData.github_url}
                      onChange={handleChange}
                      className="w-full px-4 py-3 bg-white border-2 border-gray-300 rounded-lg text-black placeholder-gray-400 focus:border-black focus:outline-none font-medium"
                      placeholder="https://github.com/username"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-black mb-2">
                      💼 LinkedIn
                    </label>
                    <input
                      type="url"
                      name="linkedin_url"
                      value={formData.linkedin_url}
                      onChange={handleChange}
                      className="w-full px-4 py-3 bg-white border-2 border-gray-300 rounded-lg text-black placeholder-gray-400 focus:border-black focus:outline-none font-medium"
                      placeholder="https://linkedin.com/in/username"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-black mb-2">
                      🌐 Portfolio
                    </label>
                    <input
                      type="url"
                      name="portfolio_url"
                      value={formData.portfolio_url}
                      onChange={handleChange}
                      className="w-full px-4 py-3 bg-white border-2 border-gray-300 rounded-lg text-black placeholder-gray-400 focus:border-black focus:outline-none font-medium"
                      placeholder="https://monportfolio.com"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-between">
              <Link href="/dashboard/developer">
                <button
                  type="button"
                  className="border-2 border-black text-black hover:bg-black hover:text-white px-6 py-3 rounded-xl font-black bg-transparent transform hover:scale-105 transition-all duration-300"
                >
                  ← Retour au dashboard
                </button>
              </Link>
              
              <button
                type="submit"
                disabled={saving}
                className="bg-black text-white hover:bg-gray-800 px-8 py-3 rounded-xl font-black border-2 border-black transform hover:scale-105 transition-all duration-300 disabled:bg-gray-400 disabled:border-gray-400 disabled:transform-none"
              >
                {saving ? (
                  <span className="flex items-center justify-center">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-3"></div>
                    Sauvegarde...
                  </span>
                ) : (
                  <span className="flex items-center justify-center">
                    ✅ Sauvegarder le profil
                    <span className="ml-2">→</span>
                  </span>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
