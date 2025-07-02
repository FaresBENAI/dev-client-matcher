'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'
import { Button } from '../../components/ui/button'
import RatingModal from '../../components/rating/RatingModal'
import StatusBar from '../../components/StatusBar'
import { markConversationAsRead } from '../../utils/markMessagesAsRead'
import { ArrowLeft, MessageCircle } from 'lucide-react'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function MessagesPage() {
  const [user, setUser] = useState<any>(null)
  const [userProfile, setUserProfile] = useState<any>(null)
  const [conversations, setConversations] = useState<any[]>([])
  const [selectedConversation, setSelectedConversation] = useState<any>(null)
  const [messages, setMessages] = useState<any[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [profiles, setProfiles] = useState<any>({}) // Cache des profils
  const [showRatingModal, setShowRatingModal] = useState(false)
  const [applicationData, setApplicationData] = useState<any>(null) // 🆕 NOUVEAU: Données de candidature
  
  // 🆕 NOUVEAU: État pour gérer l'affichage mobile
  const [showConversationList, setShowConversationList] = useState(true)

  useEffect(() => {
    checkUser()
  }, [])

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      setUser(user)
      // Charger aussi le profil de l'utilisateur connecté
      const { data: profile } = await supabase
        .from('profiles')
        .select('user_type, full_name, email')
        .eq('id', user.id)
        .single()
      setUserProfile(profile)
      loadConversations(user.id)
    }
    setLoading(false)
  }

  // 🔧 CORRECTION: Charger les profils séparément
  const loadProfile = async (userId: string) => {
    if (profiles[userId]) return profiles[userId] // Cache hit

    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('id, full_name, email, avatar_url, user_type')
        .eq('id', userId)
        .single()

      if (!error && profile) {
        setProfiles(prev => ({ ...prev, [userId]: profile }))
        return profile
      }
    } catch (error) {
      console.error('Erreur lors du chargement du profil:', error)
    }
    return null
  }

  const loadConversations = async (userId: string) => {
    try {
      console.log('🔄 Chargement des conversations pour:', userId)
      
      // 🔧 CORRECTION: Requête simplifiée sans jointures complexes
      const { data: conversations, error } = await supabase
        .from('conversations')
        .select(`
          *,
          messages (
            content,
            created_at,
            sender_id,
            is_read
          )
        `)
        .or(`client_id.eq.${userId},developer_id.eq.${userId}`)
        .order('updated_at', { ascending: false })

      if (error) {
        console.error('Erreur conversations:', error)
        throw error
      }
      
      console.log('✅ Conversations trouvées:', conversations?.length || 0)
      
      // Charger les profils pour chaque conversation
      if (conversations && conversations.length > 0) {
        for (const conv of conversations) {
          await loadProfile(conv.client_id)
          await loadProfile(conv.developer_id)
        }
      }
      
      setConversations(conversations || [])
    } catch (error) {
      console.error('Erreur lors du chargement des conversations:', error)
      setConversations([])
    }
  }

  const loadMessages = async (conversationId: string) => {
    try {
      console.log('🔄 Chargement des messages pour conversation:', conversationId)
      
      // 🔧 CORRECTION: Requête simplifiée sans jointures
      const { data: messages, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true })

      if (error) {
        console.error('Erreur messages:', error)
        throw error
      }

      console.log('✅ Messages trouvés:', messages?.length || 0)
      
      // Charger les profils des expéditeurs
      if (messages && messages.length > 0) {
        for (const message of messages) {
          await loadProfile(message.sender_id)
        }
      }

      setMessages(messages || [])
    } catch (error) {
      console.error('Erreur lors du chargement des messages:', error)
      setMessages([])
    }
  }

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation || !user) return

    try {
      const { error } = await supabase
        .from('messages')
        .insert({
          conversation_id: selectedConversation.id,
          sender_id: user.id,
          content: newMessage.trim()
        })

      if (error) throw error

      setNewMessage('')
      loadMessages(selectedConversation.id)
      loadConversations(user.id)
    } catch (error) {
      console.error('Erreur lors de l\'envoi du message:', error)
    }
  }

  // 🆕 NOUVEAU: Fonction mise à jour pour sélectionner une conversation et marquer comme lu
  const selectConversation = async (conversation: any) => {
    console.log('🔄 Sélection conversation:', conversation.id)
    setSelectedConversation(conversation)
    loadMessages(conversation.id)
    
    // 🆕 Sur mobile, masquer la liste des conversations quand on sélectionne une conversation
    setShowConversationList(false)
    
    // 🆕 Marquer les messages de cette conversation comme lus
    await markConversationAsRead(conversation.id)
    
    // 🆕 Si c'est une conversation de candidature, charger les données
    if (conversation.application_id) {
      try {
        const { data: appData } = await supabase
          .from('project_applications')
          .select(`
            *,
            projects (
              client_id,
              title
            )
          `)
          .eq('id', conversation.application_id)
          .single()
        
        setApplicationData(appData)
      } catch (error) {
        console.error('Erreur lors du chargement des données de candidature:', error)
        setApplicationData(null)
      }
    } else {
      setApplicationData(null)
    }
    
    // 🆕 Recharger les conversations pour mettre à jour les compteurs
    await loadConversations(user.id)
  }

  // 🆕 NOUVEAU: Fonction pour revenir à la liste des conversations (mobile)
  const backToConversationList = () => {
    setShowConversationList(true)
    setSelectedConversation(null)
  }

  // 🔧 CORRECTION: Fonction pour obtenir les informations de l'autre participant
  const getOtherParticipant = (conversation: any) => {
    if (!conversation || !user) {
      return {
        id: '',
        name: 'Utilisateur',
        avatar: null,
        email: 'utilisateur@exemple.com',
        type: 'client'
      }
    }

    const isClient = conversation.client_id === user.id
    const otherUserId = isClient ? conversation.developer_id : conversation.client_id
    const otherUserProfile = profiles[otherUserId]
    
    if (!otherUserProfile) {
      return {
        id: otherUserId,
        name: isClient ? 'Développeur' : 'Client',
        avatar: null,
        email: 'utilisateur@exemple.com',
        type: isClient ? 'developer' : 'client'
      }
    }
    
    return {
      id: otherUserId,
      name: otherUserProfile.full_name || otherUserProfile.email?.split('@')[0] || 'Utilisateur',
      avatar: otherUserProfile.avatar_url,
      email: otherUserProfile.email,
      type: otherUserProfile.user_type
    }
  }

  // 🔧 AJOUT: Fonction pour ouvrir le modal de notation
  const openRatingModal = () => {
    if (!selectedConversation || !userProfile) return
    
    // Seuls les clients peuvent noter les développeurs
    if (userProfile.user_type !== 'client') {
      alert('Seuls les clients peuvent noter les développeurs.')
      return
    }

    const otherParticipant = getOtherParticipant(selectedConversation)
    if (otherParticipant.type !== 'developer') {
      alert('Vous ne pouvez noter que des développeurs.')
      return
    }

    setShowRatingModal(true)
  }

  const handleRatingSubmitted = () => {
    // Recharger les conversations pour mettre à jour les données
    if (user) {
      loadConversations(user.id)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-gray-200 border-t-black rounded-full animate-spin"></div>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-4">
        <div className="text-center">
          <h1 className="text-xl sm:text-2xl font-bold mb-4">Accès refusé</h1>
          <p className="text-gray-600">Vous devez être connecté pour accéder aux messages.</p>
        </div>
      </div>
    )
  }

  const otherParticipant = selectedConversation ? getOtherParticipant(selectedConversation) : null

  return (
    <div className="h-screen flex">
      {/* Liste des conversations - Sidebar responsive */}
      <div className={`${
        showConversationList ? 'block' : 'hidden'
      } w-full sm:w-80 sm:block bg-gray-50 border-r border-gray-200 flex flex-col`}>
        {/* Header compact */}
        <div className="p-3 sm:p-3 border-b border-gray-200 bg-white">
          <h1 className="text-lg sm:text-lg font-bold text-gray-900">💬 Conversations</h1>
          <p className="text-xs text-gray-500">{conversations.length} conversation{conversations.length > 1 ? 's' : ''}</p>
        </div>

        {/* Liste des conversations */}
        <div className="flex-1 overflow-y-auto">
          {conversations.length === 0 ? (
            <div className="p-4 text-center text-gray-500">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                <MessageCircle className="w-6 h-6 sm:w-8 sm:h-8 text-gray-400" />
              </div>
              <p className="text-sm">Aucune conversation</p>
              <p className="text-xs mt-1">Démarrez une conversation depuis un projet</p>
            </div>
          ) : (
            <div className="space-y-1 p-2">
              {conversations.map((conversation) => {
                const lastMessage = conversation.messages?.[conversation.messages.length - 1]
                const otherParticipant = getOtherParticipant(conversation)
                
                // 🆕 NOUVEAU: Compter les messages non lus pour cette conversation
                const unreadInConversation = conversation.messages?.filter(
                  (msg: any) => msg.sender_id !== user?.id && !msg.is_read
                ).length || 0

                return (
                  <div
                    key={conversation.id}
                    onClick={() => selectConversation(conversation)}
                    className={`p-3 rounded-lg cursor-pointer transition-colors relative ${
                      selectedConversation?.id === conversation.id
                        ? 'bg-blue-50 border border-blue-200'
                        : 'bg-white hover:bg-gray-50 border border-gray-200'
                    }`}
                  >
                    {/* 🆕 NOUVEAU: Badge de messages non lus - NOIR */}
                    {unreadInConversation > 0 && (
                      <div className="absolute -top-1 -right-1 bg-black text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold z-10">
                        {unreadInConversation > 9 ? '9+' : unreadInConversation}
                      </div>
                    )}
                    
                    {/* Avatar + nom */}
                    <div className="flex items-center space-x-3 mb-2">
                      <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-200 flex-shrink-0">
                        {otherParticipant.avatar ? (
                          <img
                            src={otherParticipant.avatar}
                            alt={otherParticipant.name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              // Fallback si l'image ne charge pas
                              e.currentTarget.style.display = 'none'
                              e.currentTarget.nextElementSibling?.classList.remove('hidden')
                            }}
                          />
                        ) : null}
                        <div className={`w-full h-full bg-black flex items-center justify-center text-white font-bold text-sm ${otherParticipant.avatar ? 'hidden' : ''}`}>
                          {otherParticipant.name.charAt(0).toUpperCase()}
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h3 className={`font-medium text-sm text-gray-900 truncate ${unreadInConversation > 0 ? 'font-bold' : ''}`}>
                            {otherParticipant.name}
                          </h3>
                          {lastMessage && (
                            <span className="text-xs text-gray-500">
                              {new Date(lastMessage.created_at).toLocaleDateString('fr-FR', {
                                day: '2-digit',
                                month: '2-digit'
                              })}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-500">
                          {otherParticipant.type === 'developer' ? '⚡ Développeur' : '👤 Client'}
                        </p>
                      </div>
                    </div>
                    
                    <p className="text-xs text-gray-600 mb-1 font-medium">
                      {conversation.project_title || 'Projet'}
                    </p>
                    {lastMessage && (
                      <p className={`text-xs text-gray-500 truncate ${unreadInConversation > 0 ? 'font-medium text-gray-700' : ''}`}>
                        {lastMessage.content}
                      </p>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Zone de chat principale - responsive */}
      <div className={`${
        showConversationList ? 'hidden' : 'flex'
      } sm:flex flex-1 flex-col`}>
        {selectedConversation ? (
          <>
            {/* Header de conversation - Responsive avec bouton retour mobile */}
            <div className="p-3 border-b border-gray-200 bg-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  {/* Bouton retour sur mobile */}
                  <button
                    onClick={backToConversationList}
                    className="sm:hidden p-2 hover:bg-gray-100 rounded-full"
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </button>
                  
                  {/* Avatar dans le header */}
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full overflow-hidden bg-gray-200 flex-shrink-0">
                    {otherParticipant?.avatar ? (
                      <img
                        src={otherParticipant.avatar}
                        alt={otherParticipant.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none'
                          e.currentTarget.nextElementSibling?.classList.remove('hidden')
                        }}
                      />
                    ) : null}
                    <div className={`w-full h-full bg-black flex items-center justify-center text-white font-bold text-xs sm:text-sm ${otherParticipant?.avatar ? 'hidden' : ''}`}>
                      {otherParticipant?.name.charAt(0).toUpperCase() || 'U'}
                    </div>
                  </div>
                  <div className="min-w-0 flex-1">
                    <h2 className="font-bold text-gray-900 text-sm sm:text-base truncate">
                      {otherParticipant?.name || 'Utilisateur'}
                    </h2>
                    <p className="text-xs text-gray-500 truncate">
                      {selectedConversation.project_title || 'Projet'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2 flex-shrink-0">
                  <span className="hidden sm:inline-flex px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                    ● Active
                  </span>
                  {/* 🔧 AJOUT: Bouton Noter (seulement pour les clients notant des développeurs) */}
                  {userProfile?.user_type === 'client' && otherParticipant?.type === 'developer' && (
                    <Button
                      onClick={openRatingModal}
                      className="bg-yellow-500 text-white hover:bg-yellow-600 font-medium px-2 sm:px-3 py-1 rounded-lg text-xs flex items-center space-x-1"
                    >
                      <span>⭐</span>
                      <span className="hidden sm:inline">Noter</span>
                    </Button>
                  )}
                </div>
              </div>
              
              {/* 🆕 NOUVEAU: StatusBar intégrée si c'est une candidature */}
              {selectedConversation.application_id && applicationData && (
                <div className="mt-3">
                  <StatusBar 
                    applicationId={selectedConversation.application_id}
                    currentStatus={applicationData.status}
                    projectClientId={applicationData.projects?.client_id}
                    isCreator={user?.id === applicationData.projects?.client_id}
                  />
                </div>
              )}
            </div>

            {/* Messages - Responsive */}
            <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3">
              {messages.length === 0 ? (
                <div className="text-center text-gray-500 py-8">
                  <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                    <MessageCircle className="w-6 h-6 sm:w-8 sm:h-8 text-gray-400" />
                  </div>
                  <p className="text-sm">Aucun message dans cette conversation</p>
                  <p className="text-xs mt-1">Envoyez le premier message pour commencer !</p>
                </div>
              ) : (
                messages.map((message) => {
                  const senderProfile = profiles[message.sender_id]
                  
                  return (
                    <div
                      key={message.id}
                      className={`flex ${message.sender_id === user.id ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`flex items-end space-x-2 max-w-xs sm:max-w-sm lg:max-w-md ${
                        message.sender_id === user.id ? 'flex-row-reverse space-x-reverse' : ''
                      }`}>
                        {/* Avatar dans les messages - masqué sur mobile pour économiser l'espace */}
                        {message.sender_id !== user.id && (
                          <div className="hidden sm:block w-6 h-6 rounded-full overflow-hidden bg-gray-200 flex-shrink-0">
                            {senderProfile?.avatar_url ? (
                              <img
                                src={senderProfile.avatar_url}
                                alt={senderProfile.full_name || 'Utilisateur'}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  e.currentTarget.style.display = 'none'
                                  e.currentTarget.nextElementSibling?.classList.remove('hidden')
                                }}
                              />
                            ) : null}
                            <div className={`w-full h-full bg-gray-400 flex items-center justify-center text-white font-bold text-xs ${senderProfile?.avatar_url ? 'hidden' : ''}`}>
                              {(senderProfile?.full_name || 'U').charAt(0).toUpperCase()}
                            </div>
                          </div>
                        )}
                        
                        <div
                          className={`px-3 py-2 rounded-lg ${
                            message.sender_id === user.id
                              ? 'bg-black text-white rounded-br-sm'
                              : 'bg-gray-100 text-gray-900 rounded-bl-sm'
                          }`}
                        >
                          <p className="text-sm break-words">{message.content}</p>
                          <p className={`text-xs mt-1 ${
                            message.sender_id === user.id ? 'text-gray-300' : 'text-gray-500'
                          }`}>
                            {new Date(message.created_at).toLocaleTimeString('fr-FR', {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </p>
                        </div>
                      </div>
                    </div>
                  )
                })
              )}
            </div>

            {/* Zone de saisie - Responsive */}
            <div className="p-3 border-t border-gray-200 bg-white">
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                  placeholder="Tapez votre message..."
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                />
                <Button
                  onClick={sendMessage}
                  disabled={!newMessage.trim()}
                  className="bg-black text-white hover:bg-gray-800 px-3 sm:px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
                >
                  ✈️
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center bg-gray-50 p-4">
            <div className="text-center">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                <MessageCircle className="w-6 h-6 sm:w-8 sm:h-8 text-gray-400" />
              </div>
              <h3 className="text-lg sm:text-xl font-medium text-gray-900 mb-2">
                Sélectionnez une conversation
              </h3>
              <p className="text-sm text-gray-600">
                Choisissez une conversation dans la liste pour commencer à discuter
              </p>
              {/* Bouton pour afficher la liste sur mobile si aucune conversation sélectionnée */}
              <button
                onClick={() => setShowConversationList(true)}
                className="sm:hidden mt-4 bg-black text-white px-4 py-2 rounded-lg font-medium"
              >
                Voir les conversations
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 🔧 AJOUT: Modal de notation */}
      {showRatingModal && otherParticipant && (
        <RatingModal
          isOpen={showRatingModal}
          onClose={() => setShowRatingModal(false)}
          developerId={otherParticipant.id}
          developerName={otherParticipant.name}
          projectTitle={selectedConversation?.project_title || 'Projet'}
          currentUser={user}
          onRatingSubmitted={handleRatingSubmitted}
        />
      )}
    </div>
  )
}
