'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { Button } from '../../../../components/ui/button'
import { Input } from '../../../../components/ui/input'
import Link from 'next/link'

const supabase = createClient()

export default function ClientProfile() {
  const [profile, setProfile] = useState({
    full_name: '',
    email: '',
    company_name: '',
    company_size: '',
    industry: '',
    website_url: ''
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    const getProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        window.location.href = '/auth/login'
        return
      }

      const { data } = await supabase
        .from('profiles')
        .select('*, client_profiles(*)')
        .eq('id', user.id)
        .single()

      if (data) {
        setProfile({
          full_name: data.full_name || '',
          email: data.email || '',
          company_name: data.client_profiles?.[0]?.company_name || '',
          company_size: data.client_profiles?.[0]?.company_size || '',
          industry: data.client_profiles?.[0]?.industry || '',
          website_url: data.client_profiles?.[0]?.website_url || ''
        })
      }
      setLoading(false)
    }

    getProfile()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setMessage('')

    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) return

      // Mettre à jour le profil principal
      await supabase
        .from('profiles')
        .update({ full_name: profile.full_name })
        .eq('id', user.id)

      // Mettre à jour le profil client
      await supabase
        .from('client_profiles')
        .upsert({
          id: user.id,
          company_name: profile.company_name,
          company_size: profile.company_size,
          industry: profile.industry,
          website_url: profile.website_url
        })

      setMessage('Profil mis à jour avec succès!')
    } catch (error) {
      setMessage('Erreur lors de la mise à jour')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-white text-xl">Chargement...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-900">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl p-8 border border-slate-700/50">
          <h1 className="text-3xl font-bold text-white mb-6">⚙️ Mon profil</h1>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Informations personnelles */}
            <div>
              <h3 className="text-lg font-semibold text-white mb-4">Informations personnelles</h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Nom complet
                  </label>
                  <Input
                    type="text"
                    value={profile.full_name}
                    onChange={(e) => setProfile(prev => ({...prev, full_name: e.target.value}))}
                    className="bg-slate-700/50 border-slate-600 text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Email
                  </label>
                  <Input
                    type="email"
                    value={profile.email}
                    disabled
                    className="bg-slate-700/30 border-slate-600 text-slate-400"
                  />
                </div>
              </div>
            </div>

            {/* Informations entreprise */}
            <div>
              <h3 className="text-lg font-semibold text-white mb-4">Informations entreprise</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Nom de l'entreprise
                  </label>
                  <Input
                    type="text"
                    value={profile.company_name}
                    onChange={(e) => setProfile(prev => ({...prev, company_name: e.target.value}))}
                    placeholder="Ex: Mon Entreprise SAS"
                    className="bg-slate-700/50 border-slate-600 text-white placeholder-slate-400"
                  />
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Taille de l'entreprise
                    </label>
                    <select
                      value={profile.company_size}
                      onChange={(e) => setProfile(prev => ({...prev, company_size: e.target.value}))}
                      className="w-full bg-slate-700/50 border border-slate-600 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    >
                      <option value="">Sélectionnez</option>
                      <option value="1-10">1-10 employés</option>
                      <option value="11-50">11-50 employés</option>
                      <option value="51-200">51-200 employés</option>
                      <option value="201-1000">201-1000 employés</option>
                      <option value="1000+">1000+ employés</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Secteur d'activité
                    </label>
                    <Input
                      type="text"
                      value={profile.industry}
                      onChange={(e) => setProfile(prev => ({...prev, industry: e.target.value}))}
                      placeholder="Ex: E-commerce, Finance, Santé"
                      className="bg-slate-700/50 border-slate-600 text-white placeholder-slate-400"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Site web
                  </label>
                  <Input
                    type="url"
                    value={profile.website_url}
                    onChange={(e) => setProfile(prev => ({...prev, website_url: e.target.value}))}
                    placeholder="https://monentreprise.com"
                    className="bg-slate-700/50 border-slate-600 text-white placeholder-slate-400"
                  />
                </div>
              </div>
            </div>

            {message && (
              <div className={`px-4 py-3 rounded-md ${
                message.includes('succès') ? 
                'bg-green-500/20 border border-green-500/50 text-green-400' :
                'bg-red-500/20 border border-red-500/50 text-red-400'
              }`}>
                {message}
              </div>
            )}

            <div className="flex space-x-4">
              <Button
                type="submit"
                disabled={saving}
                className="bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-600 hover:to-purple-600"
              >
                {saving ? 'Sauvegarde...' : 'Sauvegarder'}
              </Button>
              <Link href="/dashboard/client">
                <Button variant="outline" className="border-slate-600 text-slate-300 hover:border-cyan-400">
                  Retour au dashboard
                </Button>
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
