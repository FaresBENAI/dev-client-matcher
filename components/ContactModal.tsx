// components/ContactModal.tsx - Version thème LinkerAI
'use client'

import { useState } from 'react'
import { X, Send, MessageCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase'
import { useAuth } from '@/components/layout/auth-context'

const supabase = createClient()

interface ContactModalProps {
  isOpen: boolean
  onClose: () => void
  developerId: string
  developerName: string
}

export default function ContactModal({ isOpen, onClose, developerId, developerName }: ContactModalProps) {
  const [message, setMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const { user } = useAuth()

  const handleSendMessage = async () => {
    // Validation initiale
    if (!message.trim()) {
      alert('Veuillez saisir un message')
      return
    }

    if (!user) {
      alert('Vous devez être connecté pour envoyer un message')
      return
    }

    setIsLoading(true)

    try {
      // 1. Vérifier si une conversation existe déjà
      const { data: existingConversation, error: searchError } = await supabase
        .from('conversations')
        .select('id')
        .or(`and(client_id.eq.${user.id},developer_id.eq.${developerId}),and(client_id.eq.${developerId},developer_id.eq.${user.id})`)
        .single()

      if (searchError && searchError.code !== 'PGRST116') {
        throw searchError
      }

      let conversationId: string

      if (existingConversation) {
        conversationId = existingConversation.id
      } else {
        // 2. Créer nouvelle conversation
        const { data: newConversation, error: conversationError } = await supabase
          .from('conversations')
          .insert({
            client_id: user.id,
            developer_id: developerId,
            subject: `Discussion avec ${developerName}`,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .select('id')
          .single()

        if (conversationError) {
          throw conversationError
        }

        conversationId = newConversation.id
      }

      // 3. Insérer le message
      const { data: messageData, error: messageError } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversationId,
          sender_id: user.id,
          content: message.trim(),
          created_at: new Date().toISOString()
        })
        .select('*')
        .single()

      if (messageError) {
        throw messageError
      }

      // 4. Mettre à jour timestamp conversation
      await supabase
        .from('conversations')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', conversationId)

      // 5. Succès
      alert('Message envoyé avec succès !')
      setMessage('')
      onClose()

    } catch (error: any) {
      console.error('Erreur lors de l\'envoi:', error)
      alert(`Erreur lors de l'envoi: ${error.message}`)
    } finally {
      setIsLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <>
      {/* Background avec fond étoilé comme le reste du site */}
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="absolute inset-0">
          <div className="stars"></div>
          <div className="twinkling"></div>
        </div>
        
        {/* Modal */}
        <div className="relative bg-white border-2 border-black max-w-md w-full">
          {/* Header */}
          <div className="flex justify-between items-center p-6 border-b-2 border-black">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-black rounded-lg flex items-center justify-center text-white">
                <MessageCircle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-xl font-black text-black">
                  Contacter {developerName}
                </h3>
                <p className="text-sm text-gray-600">
                  {user ? `Connecté: ${user.email}` : 'Non connecté'}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-black font-black text-xl transition-colors"
            >
              ×
            </button>
          </div>

          {/* Content */}
          <div className="p-6 space-y-4">
            {/* Info développeur */}
            <div className="bg-gray-50 border-2 border-gray-200 p-4">
              <h4 className="font-black text-black mb-2">💼 Développeur sélectionné</h4>
              <p className="text-gray-700 font-bold">{developerName}</p>
            </div>

            {/* Message */}
            <div>
              <label className="block text-sm font-black text-black mb-2">
                Votre message :
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Décrivez votre projet, vos besoins, votre budget..."
                rows={4}
                className="w-full p-3 border-2 border-gray-200 focus:border-black focus:outline-none resize-none font-medium"
              />
              <div className="flex justify-between items-center mt-2">
                <p className="text-xs text-gray-500">
                  Soyez précis pour obtenir une réponse adaptée
                </p>
                <span className="text-xs text-gray-500">
                  {message.length} caractères
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex space-x-3 pt-4">
              <button
                onClick={onClose}
                className="flex-1 border-2 border-black text-black px-4 py-3 font-black hover:bg-gray-50 transition-all duration-300"
              >
                Annuler
              </button>
              <button
                onClick={handleSendMessage}
                disabled={isLoading || !message.trim() || !user}
                className="flex-1 bg-black text-white px-4 py-3 font-black hover:bg-gray-800 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Envoi...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Envoyer</span>
                  </>
                )}
              </button>
            </div>

            {/* Status pour utilisateur non connecté */}
            {!user && (
              <div className="bg-red-50 border-2 border-red-200 p-3 text-center">
                <p className="text-red-700 text-sm font-bold">
                  ⚠️ Vous devez être connecté pour envoyer un message
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Styles pour les étoiles (identiques au reste du site) */}
      <style jsx>{`
        .stars, .twinkling {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 120%;
          pointer-events: none;
        }

        .stars {
          background-image: 
            radial-gradient(2px 2px at 20px 30px, #eee, transparent),
            radial-gradient(2px 2px at 40px 70px, #fff, transparent),
            radial-gradient(1px 1px at 90px 40px, #eee, transparent),
            radial-gradient(1px 1px at 130px 80px, #fff, transparent),
            radial-gradient(2px 2px at 160px 30px, #ddd, transparent);
          background-repeat: repeat;
          background-size: 200px 100px;
          animation: zoom 60s alternate infinite;
        }

        .twinkling {
          background-image: 
            radial-gradient(1px 1px at 25px 25px, white, transparent),
            radial-gradient(1px 1px at 50px 75px, white, transparent),
            radial-gradient(1px 1px at 125px 25px, white, transparent),
            radial-gradient(1px 1px at 75px 100px, white, transparent);
          background-repeat: repeat;
          background-size: 150px 100px;
          animation: sparkle 5s ease-in-out infinite alternate;
        }

        @keyframes zoom {
          from { transform: scale(1); }
          to { transform: scale(1.1); }
        }

        @keyframes sparkle {
          from { opacity: 0.7; }
          to { opacity: 1; }
        }
      `}</style>
    </>
  )
}
