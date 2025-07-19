'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { createClient } from '@/lib/supabase'

const supabase = createClient()

interface UserProfile {
  id: string
  email: string
  full_name: string
  user_type: string
  created_at: string
  avatar_url?: string
}

export default function UsersAdminPage() {
  const [users, setUsers] = useState<UserProfile[]>([])
  const [loading, setLoading] = useState(false)
  const [searchEmail, setSearchEmail] = useState('')
  const [updatingId, setUpdatingId] = useState<string | null>(null)

  const loadUsers = async () => {
    setLoading(true)
    try {
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Erreur chargement utilisateurs:', error)
        return
      }

      setUsers(profiles || [])
    } catch (error) {
      console.error('Erreur:', error)
    } finally {
      setLoading(false)
    }
  }

  const updateUserType = async (userId: string, newType: 'client' | 'developer') => {
    setUpdatingId(userId)
    try {
      // Mettre à jour le type utilisateur
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ 
          user_type: newType,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)

      if (updateError) {
        console.error('Erreur mise à jour:', updateError)
        return
      }

      // Si nouveau type est développeur, créer le profil développeur
      if (newType === 'developer') {
        const user = users.find(u => u.id === userId)
        if (user) {
          const profileData = {
            id: userId,
            title: user.full_name || 'Développeur',
            bio: '',
            location: '',
            phone: '',
            experience_years: 0,
            daily_rate: null,
            daily_rate_defined: true,
            availability: 'available',
            skills: [],
            specializations: [],
            languages: [],
            github_url: '',
            linkedin_url: '',
            portfolio_url: '',
            website: '',
            average_rating: 0,
            total_ratings: 0,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }

          const { error: createError } = await supabase
            .from('developer_profiles')
            .upsert(profileData) // utiliser upsert pour éviter les doublons

          if (createError) {
            console.error('Erreur création profil développeur:', createError)
          }
        }
      }

      // Recharger la liste
      await loadUsers()
      
    } catch (error) {
      console.error('Erreur:', error)
    } finally {
      setUpdatingId(null)
    }
  }

  const filteredUsers = users.filter(user => 
    !searchEmail || user.email.toLowerCase().includes(searchEmail.toLowerCase())
  )

  useEffect(() => {
    loadUsers()
  }, [])

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h1 className="text-2xl font-bold mb-6">👥 Gestion des Utilisateurs</h1>
          
          <div className="mb-6 flex gap-4">
            <Button 
              onClick={loadUsers}
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {loading ? '🔄 Chargement...' : '🔄 Actualiser'}
            </Button>
            
            <Input
              placeholder="Rechercher par email..."
              value={searchEmail}
              onChange={(e) => setSearchEmail(e.target.value)}
              className="max-w-xs"
            />
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredUsers.map((user) => (
                <div key={user.id} className="p-4 border rounded-lg bg-gray-50">
                  <div className="mb-3">
                    <h3 className="font-semibold text-lg">{user.full_name || 'Sans nom'}</h3>
                    <p className="text-gray-600 text-sm">{user.email}</p>
                    <p className="text-xs text-gray-500">ID: {user.id}</p>
                    <p className="text-xs text-gray-500">
                      Créé: {new Date(user.created_at).toLocaleDateString()}
                    </p>
                  </div>

                  <div className="mb-3">
                    <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                      user.user_type === 'client' 
                        ? 'bg-blue-100 text-blue-800' 
                        : user.user_type === 'developer'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {user.user_type === 'client' ? '👥 Client' : 
                       user.user_type === 'developer' ? '💻 Développeur' : '❓ ' + user.user_type}
                    </span>
                  </div>

                  <div className="space-y-2">
                    {user.user_type !== 'developer' && (
                      <Button
                        onClick={() => updateUserType(user.id, 'developer')}
                        disabled={updatingId === user.id}
                        className="w-full bg-green-600 hover:bg-green-700 text-sm"
                      >
                        {updatingId === user.id ? '🔄' : '💻'} Convertir en Développeur
                      </Button>
                    )}
                    
                    {user.user_type !== 'client' && (
                      <Button
                        onClick={() => updateUserType(user.id, 'client')}
                        disabled={updatingId === user.id}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-sm"
                      >
                        {updatingId === user.id ? '🔄' : '👥'} Convertir en Client
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {filteredUsers.length === 0 && !loading && (
              <div className="text-center py-8 text-gray-500">
                {searchEmail ? 'Aucun utilisateur trouvé pour cette recherche' : 'Aucun utilisateur trouvé'}
              </div>
            )}
          </div>

          <div className="mt-8 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <h3 className="font-semibold text-yellow-800 mb-2">💡 Instructions:</h3>
            <ul className="text-sm text-yellow-700 space-y-1">
              <li>• Utilisez cette page pour corriger le type d'utilisateur si quelqu'un s'est inscrit avec le mauvais type</li>
              <li>• La conversion en développeur crée automatiquement un profil développeur</li>
              <li>• Les changements sont immédiats et l'utilisateur les verra dès sa prochaine connexion</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
} 