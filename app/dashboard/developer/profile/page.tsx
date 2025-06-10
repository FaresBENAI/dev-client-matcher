'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

export default function DeveloperProfile() {
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
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
        alert('Erreur lors de la sauvegarde du profil: ' + profileError.message)
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
        alert('Erreur lors de la sauvegarde du profil développeur: ' + devError.message)
        return
      }

      alert('✅ Profil mis à jour avec succès !')
    } catch (err) {
      console.error('Erreur:', err)
      alert('Erreur lors de la sauvegarde')
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

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-white text-xl">Chargement du profil...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-900">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl p-6 border border-slate-700/50">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-bold text-white mb-2">
                  👤 Mon profil développeur
                </h1>
                <p className="text-slate-300">
                  Gérez vos informations et compétences
                </p>
              </div>
              <Link href="/dashboard/developer">
                <button className="bg-purple-500 text-white px-4 py-2 rounded-lg hover:bg-purple-600 transition-colors">
                  ← Retour au dashboard
                </button>
              </Link>
            </div>
          </div>
        </div>

        {/* Formulaire */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Informations personnelles */}
          <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl p-6 border border-slate-700/50">
            <h2 className="text-xl font-semibold text-white mb-4">Informations personnelles</h2>
            
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Nom complet *
                </label>
                <input
                  type="text"
                  name="full_name"
                  value={formData.full_name}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:border-purple-500 focus:outline-none"
                  placeholder="John Doe"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Titre professionnel
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:border-purple-500 focus:outline-none"
                  placeholder="Développeur Full-Stack"
                />
              </div>
            </div>

            <div className="mt-6">
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Bio / Présentation
              </label>
              <textarea
                name="bio"
                value={formData.bio}
                onChange={handleChange}
                rows={4}
                className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:border-purple-500 focus:outline-none"
                placeholder="Parlez-nous de vous, votre expérience, vos passions..."
              />
            </div>
          </div>

          {/* Compétences et expérience */}
          <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl p-6 border border-slate-700/50">
            <h2 className="text-xl font-semibold text-white mb-4">Compétences et expérience</h2>
            
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Années d'expérience
                </label>
                <input
                  type="number"
                  name="experience_years"
                  value={formData.experience_years}
                  onChange={handleChange}
                  min="0"
                  max="50"
                  className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:border-purple-500 focus:outline-none"
                  placeholder="5"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Tarif horaire (€)
                </label>
                <input
                  type="number"
                  name="hourly_rate"
                  value={formData.hourly_rate}
                  onChange={handleChange}
                  min="0"
                  className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:border-purple-500 focus:outline-none"
                  placeholder="50"
                />
              </div>
            </div>

            <div className="mt-6">
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Compétences principales (séparées par des virgules)
              </label>
              <input
                type="text"
                name="skills"
                value={formData.skills}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:border-purple-500 focus:outline-none"
                placeholder="Python, React, Node.js, Machine Learning, PostgreSQL"
              />
            </div>

            <div className="mt-6">
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Spécialisations (séparées par des virgules)
              </label>
              <input
                type="text"
                name="specializations"
                value={formData.specializations}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:border-purple-500 focus:outline-none"
                placeholder="Intelligence Artificielle, Automatisation, Data Science"
              />
            </div>

            <div className="mt-6">
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Disponibilité
              </label>
              <select
                name="availability"
                value={formData.availability}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white focus:border-purple-500 focus:outline-none"
              >
                <option value="available">Disponible</option>
                <option value="busy">Occupé</option>
                <option value="unavailable">Non disponible</option>
              </select>
            </div>
          </div>

          {/* Liens professionnels */}
          <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl p-6 border border-slate-700/50">
            <h2 className="text-xl font-semibold text-white mb-4">Liens professionnels</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  🐙 GitHub
                </label>
                <input
                  type="url"
                  name="github_url"
                  value={formData.github_url}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:border-purple-500 focus:outline-none"
                  placeholder="https://github.com/username"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  💼 LinkedIn
                </label>
                <input
                  type="url"
                  name="linkedin_url"
                  value={formData.linkedin_url}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:border-purple-500 focus:outline-none"
                  placeholder="https://linkedin.com/in/username"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  🌐 Portfolio
                </label>
                <input
                  type="url"
                  name="portfolio_url"
                  value={formData.portfolio_url}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:border-purple-500 focus:outline-none"
                  placeholder="https://monportfolio.com"
                />
              </div>
            </div>
          </div>

          {/* Bouton de sauvegarde */}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white px-8 py-3 rounded-lg font-medium transition-all disabled:opacity-50"
            >
              {saving ? 'Sauvegarde...' : '✅ Sauvegarder le profil'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
