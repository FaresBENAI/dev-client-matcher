'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase'

const supabase = createClient()

interface ContactDeveloperModalProps {
  developer: {
    id: string
    full_name: string
    speciality?: string
  }
  projectId?: string
  onClose: () => void
  onSuccess?: () => void
}

export default function ContactDeveloperModal({ 
  developer, 
  projectId, 
  onClose, 
  onSuccess 
}: ContactDeveloperModalProps) {
  const developerId = developer.id
  const [message, setMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      // Récupérer l'utilisateur actuel
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        console.error('Utilisateur non connecté')
        return
      }

      console.log('🔍 DEBUG - Début candidature:', {
        clientId: user.id,
        developerId,
        projectId,
        hasProjectId: !!projectId,
        message: message.substring(0, 50) + '...'
      })

      // 1. Vérifier si candidature existe déjà POUR CE PROJET SPÉCIFIQUE
      if (projectId) {
        console.log('🔍 DEBUG - Vérification candidature existante pour projet:', projectId)
        
        const { data: existingApplication, error: checkError } = await supabase
          .from('project_applications')
          .select('id, project_id, created_at')
          .eq('client_id', user.id)
          .eq('developer_id', developerId)
          .eq('project_id', projectId)
          .single()

        console.log('🔍 DEBUG - Résultat vérification:', {
          existingApplication,
          checkError,
          errorCode: checkError?.code
        })

        if (existingApplication) {
          console.log('❌ DEBUG - Candidature déjà existante pour ce projet:', {
            applicationId: existingApplication.id,
            projectId: existingApplication.project_id,
            createdAt: existingApplication.created_at
          })
          alert('Vous avez déjà postulé pour ce projet spécifique')
          return
        }

        if (checkError && checkError.code !== 'PGRST116') {
          console.error('❌ DEBUG - Erreur lors de la vérification:', checkError)
        } else {
          console.log('✅ DEBUG - Aucune candidature existante, on peut continuer')
        }
      } else {
        console.log('🔍 DEBUG - Pas de projectId, message direct sans vérification candidature')
      }

      // 2. Créer la candidature (seulement si projectId existe)
      let application = null
      if (projectId) {
        console.log('🔍 DEBUG - Création candidature pour projet:', projectId)
        
        const { data: newApplication, error: appError } = await supabase
          .from('project_applications')
          .insert({
            developer_id: developerId,
            project_id: projectId,
            status: 'pending'
          })
          .select()
          .single()

        if (appError) {
          console.error('❌ DEBUG - Erreur création candidature:', appError)
          throw appError
        }

        application = newApplication
        console.log('✅ DEBUG - Candidature créée:', {
          applicationId: application.id,
          projectId: application.project_id,
          status: application.status
        })
      } else {
        console.log('🔍 DEBUG - Pas de projectId, pas de candidature créée')
      }

      // 3. Vérifier/créer conversation
      let conversationId: string

      console.log('🔍 DEBUG - Recherche conversation existante:', {
        clientId: user.id,
        developerId,
        projectId: projectId || 'null'
      })

      const { data: existingConversation, error: convSearchError } = await supabase
        .from('conversations')
        .select('id')
        .eq('client_id', user.id)
        .eq('developer_id', developerId)
        .eq('project_id', projectId || null) // Gérer les conversations sans projet
        .single()

      console.log('🔍 DEBUG - Résultat recherche conversation:', {
        existingConversation,
        convSearchError,
        errorCode: convSearchError?.code
      })

      if (existingConversation) {
        conversationId = existingConversation.id
        console.log('📞 DEBUG - Conversation existante trouvée:', conversationId)
      } else {
        console.log('🔍 DEBUG - Création nouvelle conversation')
        
        const { data: newConversation, error: convError } = await supabase
          .from('conversations')
          .insert({
            client_id: user.id,
            developer_id: developerId,
            project_id: projectId || null
          })
          .select()
          .single()

        if (convError) {
          console.error('❌ DEBUG - Erreur création conversation:', convError)
          throw convError
        }

        conversationId = newConversation.id
        console.log('✅ DEBUG - Nouvelle conversation créée:', {
          conversationId,
          projectId: newConversation.project_id
        })
      }

      // 4. Créer le message
      console.log('🔍 DEBUG - Création message:', {
        conversationId,
        senderId: user.id,
        applicationId: application?.id || 'null',
        messageLength: message.length
      })

      const { data: messageData, error: msgError } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversationId,
          sender_id: user.id,
          content: message
        })
        .select()
        .single()

      if (msgError) {
        console.error('❌ DEBUG - Erreur création message:', msgError)
        throw msgError
      }

      console.log('✅ DEBUG - Message créé:', {
        messageId: messageData.id,
        conversationId: messageData.conversation_id
      })

      // 5. Succès
      const successMessage = projectId 
        ? 'Candidature envoyée avec succès!' 
        : 'Message envoyé avec succès!'
      
      console.log('🎉 DEBUG - Processus terminé avec succès!', { 
        projectId, 
        hasApplication: !!application,
        conversationId,
        messageId: messageData.id
      })
      alert(successMessage)
      
      if (onSuccess) {
        onSuccess()
      }
      
      onClose()

    } catch (error) {
      console.error('❌ DEBUG - Erreur globale:', {
        error,
        errorMessage: error.message,
        errorCode: error.code,
        projectId,
        developerId
      })
      alert('Erreur lors de l\'envoi de la candidature')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-6 w-full max-w-md border-2 border-gray-200 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-black text-black">
            {projectId ? 'Postuler au projet' : 'Contacter le développeur'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors duration-300"
          >
            <span className="text-gray-500 text-xl font-bold">×</span>
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="message" className="block text-sm font-black text-black mb-2">
              {projectId ? 'Message de candidature' : 'Votre message'}
            </label>
            <textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={
                projectId 
                  ? "Décrivez pourquoi vous êtes le bon développeur pour ce projet..."
                  : "Bonjour, je souhaiterais vous contacter concernant..."
              }
              className="w-full border-2 border-gray-200 rounded-lg p-3 h-32 resize-none focus:border-black focus:outline-none font-medium text-sm placeholder-gray-500"
              required
            />
          </div>
          
          <div className="flex justify-end space-x-2">
            <button
              type="button" 
              onClick={onClose}
              disabled={isLoading}
              className="px-4 py-2 border-2 border-gray-300 text-gray-700 font-bold rounded-lg hover:border-black hover:text-black transition-colors duration-300 disabled:opacity-50"
            >
              Annuler
            </button>
            <button
              type="submit" 
              disabled={isLoading || !message.trim()}
              className="px-4 py-2 bg-black text-white font-bold rounded-lg hover:bg-gray-800 transition-colors duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Envoi...' : (projectId ? 'Envoyer la candidature' : 'Envoyer le message')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
