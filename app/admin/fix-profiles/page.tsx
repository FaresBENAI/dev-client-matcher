'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase'
import { checkAllDeveloperProfiles, ensureDeveloperProfile } from '@/utils/developer-profile-helper'

const supabase = createClient()

interface ProfileIssue {
  id: string
  email: string
  full_name: string
  created_at: string
  hasProfile: boolean
  metadata: any
}

export default function FixProfilesPage() {
  const [loading, setLoading] = useState(false)
  const [issues, setIssues] = useState<ProfileIssue[]>([])
  const [fixingId, setFixingId] = useState<string | null>(null)

  const analyzeProfiles = async () => {
    setLoading(true)
    setIssues([])

    try {
      console.log('🔍 Analyse des profils développeurs...')

      // Récupérer tous les développeurs
      const { data: developers } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_type', 'developer')
        .order('created_at', { ascending: false })

      if (!developers) {
        console.log('❌ Erreur récupération développeurs')
        return
      }

      console.log(`📊 ${developers.length} développeur(s) trouvé(s)`)

      // Vérifier les profils développeurs existants
      const { data: existingProfiles } = await supabase
        .from('developer_profiles')
        .select('id')

      const existingIds = new Set(existingProfiles?.map(p => p.id) || [])

      // Créer les résultats d'analyse
      const analysisResults: ProfileIssue[] = developers.map(dev => ({
        id: dev.id,
        email: dev.email,
        full_name: dev.full_name,
        created_at: dev.created_at,
        hasProfile: existingIds.has(dev.id),
        metadata: {} // On ne peut pas récupérer les métadonnées côté client
      }))

      setIssues(analysisResults)
      console.log(`🔍 Analyse terminée: ${analysisResults.filter(r => !r.hasProfile).length} profil(s) manquant(s)`)

    } catch (error) {
      console.error('❌ Erreur analyse:', error)
    } finally {
      setLoading(false)
    }
  }

  const fixProfile = async (userId: string) => {
    setFixingId(userId)
    try {
      console.log(`🔧 Réparation du profil pour ${userId}...`)
      const success = await ensureDeveloperProfile(userId)
      
      if (success) {
        // Mettre à jour l'état local
        setIssues(prev => prev.map(issue => 
          issue.id === userId ? { ...issue, hasProfile: true } : issue
        ))
        console.log('✅ Profil réparé avec succès')
      } else {
        console.error('❌ Échec de la réparation')
      }
    } catch (error) {
      console.error('❌ Erreur réparation:', error)
    } finally {
      setFixingId(null)
    }
  }

  const fixAllProfiles = async () => {
    setLoading(true)
    try {
      await checkAllDeveloperProfiles()
      // Réanalyser après réparation
      await analyzeProfiles()
    } catch (error) {
      console.error('❌ Erreur réparation globale:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h1 className="text-2xl font-bold mb-6">🔧 Réparation des Profils Développeurs</h1>
          
          <div className="mb-6 space-x-4">
            <Button 
              onClick={analyzeProfiles}
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {loading ? '🔍 Analyse...' : '🔍 Analyser les Profils'}
            </Button>
            
            <Button 
              onClick={fixAllProfiles}
              disabled={loading || issues.length === 0}
              className="bg-green-600 hover:bg-green-700"
            >
              {loading ? '🔧 Réparation...' : '🔧 Réparer Tous'}
            </Button>
          </div>

          {issues.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold">
                📊 Résultats ({issues.filter(i => !i.hasProfile).length} profil(s) manquant(s) sur {issues.length})
              </h2>
              
              <div className="space-y-2">
                {issues.map((issue) => (
                  <div 
                    key={issue.id} 
                    className={`p-4 rounded-lg border-2 ${
                      issue.hasProfile 
                        ? 'bg-green-50 border-green-200' 
                        : 'bg-red-50 border-red-200'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <span className={`w-3 h-3 rounded-full ${
                            issue.hasProfile ? 'bg-green-500' : 'bg-red-500'
                          }`}></span>
                          <span className="font-medium">{issue.full_name}</span>
                          <span className="text-gray-500">({issue.email})</span>
                        </div>
                        
                        <div className="mt-2 text-sm text-gray-600">
                          <p>📅 Créé: {new Date(issue.created_at).toLocaleDateString()}</p>
                          <p>🆔 ID: {issue.id}</p>
                        </div>
                      </div>
                      
                      <div className="ml-4">
                        {issue.hasProfile ? (
                          <span className="text-green-600 font-medium">✅ Profil OK</span>
                        ) : (
                          <Button
                            onClick={() => fixProfile(issue.id)}
                            disabled={fixingId === issue.id}
                            className="bg-orange-500 hover:bg-orange-600 text-sm px-3 py-1"
                          >
                            {fixingId === issue.id ? '🔧 Réparation...' : '🔧 Réparer'}
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {issues.length === 0 && !loading && (
            <div className="text-center py-8 text-gray-500">
              Cliquez sur "Analyser les Profils" pour commencer le diagnostic
            </div>
          )}
        </div>
      </div>
    </div>
  )
} 