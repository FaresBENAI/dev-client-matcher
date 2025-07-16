'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { ArrowLeft, MessageCircle, Send, User, Star, CheckCircle } from 'lucide-react'
import { useRouter } from 'next/navigation'
import RatingModal from '@/components/rating/RatingModal'

interface UserProfile {
  id: string
  full_name: string
  user_type: string
}

export default function MessagesPage() {
  const [user, setUser] = useState<any>(null)
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [conversations, setConversations] = useState<any[]>([])
  const [selectedConversation, setSelectedConversation] = useState<any>(null)
  const [messages, setMessages] = useState<any[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [profiles, setProfiles] = useState<any>({}) // Cache des profils comme dans l'original
  const [sendingMessage, setSendingMessage] = useState(false)
  const [showRatingModal, setShowRatingModal] = useState(false)
  const [otherParticipant, setOtherParticipant] = useState<any>(null)
  const [applicationData, setApplicationData] = useState<any>(null)
  const [developerRating, setDeveloperRating] = useState<any>(null) // 🆕 NOUVEAU: Données de notation
  
  const router = useRouter()

  useEffect(() => {
    checkUser()
  }, [])

  // Écouteur en temps réel pour les messages
  useEffect(() => {
    if (!user) return;

    // Écouter les changements de messages
    const messagesSubscription = supabase
      .channel('messages_page_changes')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages'
      }, (payload) => {
        console.log('🆕 Nouveau message reçu (messages page):', payload);
        // Rafraîchir les conversations si le message n'est pas de l'utilisateur actuel
        if (payload.new.sender_id !== user.id) {
          loadConversations(user.id);
        }
      })
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'messages'
      }, (payload) => {
        console.log('📝 Message mis à jour (messages page):', payload);
        // Rafraîchir si le statut de lecture a changé
        if (payload.new.is_read !== payload.old.is_read) {
          loadConversations(user.id);
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(messagesSubscription);
    };
  }, [user]);

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/auth/login')
      return
    }
    
    setUser(user)
    // Charger aussi le profil de l'utilisateur connecté
    const { data: profile } = await supabase
      .from('profiles')
      .select('id, user_type, full_name, email')
      .eq('id', user.id)
      .single()
    setUserProfile(profile)
    loadConversations(user.id)
    setLoading(false)
  }

  // 🔧 ORIGINAL: Charger les profils avec cache (comme dans votre fichier)
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
      
      // 🔧 ORIGINAL: Requête avec messages intégrés
      const { data: conversations, error } = await supabase
        .from('conversations')
        .select(`
          *,
          messages (
            content,
            created_at,
            sender_id
          )
        `)
        .or(`client_id.eq.${userId},developer_id.eq.${userId}`)
        .order('last_message_at', { ascending: false })

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
      
      // 🔧 ORIGINAL: Requête simple
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
      
      // 🆕 Marquer les messages comme lus après avoir chargé la conversation
      await markMessagesAsRead(conversationId)
    } catch (error) {
      console.error('Erreur lors du chargement des messages:', error)
      setMessages([])
    }
  }

  // 🔧 ORIGINAL: Fonction pour obtenir les informations de l'autre participant
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

  // Sélectionner une conversation
  const selectConversation = async (conversation: any) => {
    console.log('🔄 Sélection conversation:', conversation.id)
    setSelectedConversation(conversation)
    setOtherParticipant(getOtherParticipant(conversation))
    await loadMessages(conversation.id)
    
    // Marquer les messages comme lus quand on ouvre la conversation
    await markMessagesAsRead(conversation.id)
    
    // Charger les données de candidature si c'est une conversation de projet
    if (conversation.project_id) {
      await loadApplicationData(conversation.project_id, conversation.developer_id)
    } else {
      setApplicationData(null)
    }
    
    // 🆕 Charger les données de notation du développeur
    if (otherParticipant?.type === 'developer') {
      await loadDeveloperRating(otherParticipant.id)
    } else {
      setDeveloperRating(null)
    }
  }

  // Marquer les messages comme lus
  const markMessagesAsRead = async (conversationId: string) => {
    if (!user) return;
    
    try {
      console.log('📖 Marquage des messages comme lus pour conversation:', conversationId);
      
      // Marquer TOUS les messages de cette conversation comme lus (sauf nos propres messages)
      const { error } = await supabase
        .from('messages')
        .update({ is_read: true })
        .eq('conversation_id', conversationId)
        .neq('sender_id', user.id);

      if (error) {
        console.error('Erreur marquage messages lus:', error);
      } else {
        console.log('✅ Tous les messages marqués comme lus avec succès');
        
        // Vérifier que les messages ont bien été marqués
        const { data: verifyMessages, error: verifyError } = await supabase
          .from('messages')
          .select('id, content, is_read')
          .eq('conversation_id', conversationId)
          .neq('sender_id', user.id)
          .eq('is_read', false);

        if (verifyError) {
          console.error('Erreur vérification messages:', verifyError);
        } else {
          console.log('🔍 Messages encore non lus après marquage:', verifyMessages?.length || 0);
          if (verifyMessages && verifyMessages.length > 0) {
            console.log('⚠️ Messages encore non lus:', verifyMessages.map(msg => ({
              id: msg.id,
              content: msg.content?.substring(0, 30) + '...',
              is_read: msg.is_read
            })));
          }
        }
        
        // Rafraîchir les conversations pour mettre à jour le comptage
        await loadConversations(user.id);
      }
    } catch (error) {
      console.error('Erreur lors du marquage des messages:', error);
    }
  }

  // Charger les données de candidature
  const loadApplicationData = async (projectId: string, developerId: string) => {
    try {
      const { data: application, error } = await supabase
        .from('project_applications')
        .select(`
          *,
          projects (
            id,
            title,
            client_id
          )
        `)
        .eq('project_id', projectId)
        .eq('developer_id', developerId)
        .single()

      if (error) {
        console.error('Erreur chargement candidature:', error)
        setApplicationData(null)
      } else {
        setApplicationData(application)
      }
    } catch (error) {
      console.error('Erreur lors du chargement de la candidature:', error)
      setApplicationData(null)
    }
  }

  // 🆕 NOUVEAU: Charger les données de notation du développeur
  const loadDeveloperRating = async (developerId: string) => {
    try {
      // Charger le profil développeur avec les notes
      const { data: devProfile, error } = await supabase
        .from('developer_profiles')
        .select('average_rating, total_ratings')
        .eq('id', developerId)
        .single()

      if (error) {
        console.error('Erreur chargement notation développeur:', error)
        setDeveloperRating({ average_rating: 0, total_ratings: 0 })
      } else {
        setDeveloperRating(devProfile || { average_rating: 0, total_ratings: 0 })
      }
    } catch (error) {
      console.error('Erreur lors du chargement de la notation:', error)
      setDeveloperRating({ average_rating: 0, total_ratings: 0 })
    }
  }

  // Envoyer un message
  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation || !user || sendingMessage) return

    setSendingMessage(true)
    try {
      const { error } = await supabase
        .from('messages')
        .insert({
          conversation_id: selectedConversation.id,
          sender_id: user.id,
          content: newMessage.trim(),
          created_at: new Date().toISOString()
        })

      if (error) throw error

      setNewMessage('')
      
      // Marquer tous les messages comme lus après avoir envoyé un message
      await markMessagesAsRead(selectedConversation.id)
      
      loadMessages(selectedConversation.id)
      loadConversations(user.id)
    } catch (error) {
      console.error('Erreur lors de l\'envoi du message:', error)
    } finally {
      setSendingMessage(false)
    }
  }

  // Gérer la touche Entrée
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  // 🆕 Fonction pour changer le statut de candidature
  const updateApplicationStatus = async (status: string) => {
    if (!selectedConversation?.application_id) return

    try {
      const { error } = await supabase
        .from('project_applications')
        .update({ 
          status: status,
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedConversation.application_id)

      if (error) {
        console.error('Erreur mise à jour statut:', error)
        alert('Erreur lors de la mise à jour du statut')
        return
      }

      // Envoyer un message automatique de notification
      const statusMessage = status === 'accepted' 
        ? '✅ **Candidature acceptée !** Félicitations, votre candidature a été acceptée par le client.'
        : '❌ **Candidature refusée.** Votre candidature n\'a pas été retenue pour ce projet.'

      await supabase
        .from('messages')
        .insert({
          conversation_id: selectedConversation.id,
          sender_id: user.id,
          content: statusMessage,
          created_at: new Date().toISOString()
        })

      alert(`Candidature ${status === 'accepted' ? 'acceptée' : 'refusée'} avec succès !`)
      
      // Recharger les messages et conversations
      loadMessages(selectedConversation.id)
      loadConversations(user.id)
      
      // Recharger les données de candidature
      if (selectedConversation.project_id) {
        await loadApplicationData(selectedConversation.project_id, selectedConversation.developer_id)
      }
    } catch (error) {
      console.error('Erreur générale:', error)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement des messages...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">Vous devez être connecté</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center">
            <button 
              onClick={() => router.back()}
              className="flex items-center text-gray-600 hover:text-black transition-colors mr-4"
            >
              <ArrowLeft className="h-5 w-5 mr-2" />
              Retour
            </button>
            <h1 className="text-2xl font-black text-black">Messages</h1>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-200px)]">
          {/* Liste des conversations */}
          <div className="lg:col-span-1 bg-white rounded-2xl border-2 border-gray-200 overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-bold text-black flex items-center">
                <MessageCircle className="h-5 w-5 mr-2" />
                Conversations ({conversations.length})
              </h2>
            </div>
            
            <div className="overflow-y-auto h-full">
              {conversations.length === 0 ? (
                <div className="p-6 text-center text-gray-500">
                  <MessageCircle className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>Aucune conversation</p>
                </div>
              ) : (
                conversations.map((conversation) => {
                  const lastMessage = conversation.messages?.[conversation.messages.length - 1]
                  const otherParticipant = getOtherParticipant(conversation)
                  const isSelected = selectedConversation?.id === conversation.id
                  
                  return (
                    <div
                      key={conversation.id}
                      onClick={() => selectConversation(conversation)}
                      className={`p-4 border-b border-gray-100 cursor-pointer transition-colors ${
                        isSelected ? 'bg-blue-50 border-blue-200' : 'hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-start space-x-3">
                        {/* Avatar - Style original */}
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
                            <h3 className="font-semibold text-gray-900 truncate">
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
                          
                          {/* Titre du projet */}
                          {conversation.project_title && (
                            <p className="text-sm text-blue-600 truncate mt-1">
                              Projet: {conversation.project_title}
                            </p>
                          )}
                          {conversation.subject && (
                            <p className="text-sm text-gray-600 truncate mt-1">
                              {conversation.subject}
                            </p>
                          )}
                          
                          {/* Dernier message */}
                          {lastMessage && (
                            <p className="text-xs text-gray-500 truncate mt-1">
                              {lastMessage.content}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </div>

          {/* Zone de messages */}
          <div className="lg:col-span-2 bg-white rounded-2xl border-2 border-gray-200 overflow-hidden flex flex-col">
            {selectedConversation ? (
              <>
                {/* Header de la conversation */}
                <div className="p-6 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      {/* Avatar dans le header */}
                      <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-200 flex-shrink-0">
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
                        <div className={`w-full h-full bg-black flex items-center justify-center text-white font-bold text-sm ${otherParticipant?.avatar ? 'hidden' : ''}`}>
                          {otherParticipant?.name.charAt(0).toUpperCase() || 'U'}
                        </div>
                      </div>
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-2">
                          <h3 className="font-bold text-gray-900">
                            {otherParticipant?.name || 'Utilisateur'}
                          </h3>
                          
                          {/* 🆕 Étoiles du profil */}
                          {otherParticipant?.type === 'developer' && developerRating && (
                            <div className="flex items-center space-x-1">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <span
                                  key={star}
                                  className={`text-sm ${star <= Math.round(developerRating.average_rating || 0) ? 'text-yellow-400' : 'text-gray-300'}`}
                                >
                                  ⭐
                                </span>
                              ))}
                              <span className="text-xs text-gray-500 ml-1">
                                ({developerRating.average_rating ? developerRating.average_rating.toFixed(1) : '0.0'})
                                {developerRating.total_ratings > 0 && ` (${developerRating.total_ratings})`}
                              </span>
                            </div>
                          )}
                        </div>
                        
                        {selectedConversation.project_title && (
                          <p className="text-sm text-blue-600">
                            Projet: {selectedConversation.project_title}
                          </p>
                        )}
                      </div>
                    </div>
                    
                    {/* 🆕 Éléments de progression, statut et noter à droite */}
                    {applicationData && (
                      <div className="flex items-center space-x-3">
                        {/* Barre de progression */}
                        <div className="flex items-center space-x-2">
                          <div className="w-20 bg-gray-200 rounded-full h-2">
                            <div 
                              className="h-2 rounded-full transition-all duration-300 bg-green-500"
                              style={{ width: '75%' }}
                            ></div>
                          </div>
                          <span className="text-xs text-gray-500 font-medium">75%</span>
                        </div>
                        
                        {/* Statut */}
                        <div className="flex items-center space-x-2 px-3 py-1.5 rounded-full border bg-green-100 text-green-800 border-green-200">
                          <CheckCircle className="w-4 h-4" />
                          <span className="font-medium text-sm">Acceptée</span>
                        </div>
                        
                        {/* Bouton Noter - uniquement pour clients qui parlent à des développeurs */}
                        {userProfile?.user_type === 'client' && otherParticipant?.type === 'developer' && (
                          <button 
                            onClick={() => setShowRatingModal(true)}
                            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                          >
                            <Star className="h-4 w-4 mr-2" />
                            Noter
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-6 space-y-4">
                  {messages.length === 0 ? (
                    <div className="text-center text-gray-500 py-8">
                      <MessageCircle className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                      <p>Aucun message dans cette conversation</p>
                      <p className="text-sm mt-2">Commencez la discussion !</p>
                    </div>
                  ) : (
                    messages.map((message) => {
                      const isOwnMessage = message.sender_id === user?.id
                      const senderProfile = profiles[message.sender_id]
                      
                      return (
                        <div
                          key={message.id}
                          className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
                        >
                          <div className={`flex items-end space-x-2 max-w-xs lg:max-w-md ${
                            isOwnMessage ? 'flex-row-reverse space-x-reverse' : ''
                          }`}>
                            {/* Avatar dans les messages */}
                            {!isOwnMessage && (
                              <div className="w-6 h-6 rounded-full overflow-hidden bg-gray-200 flex-shrink-0">
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
                              className={`px-4 py-3 rounded-2xl ${
                                isOwnMessage
                                  ? 'bg-black text-white'
                                  : 'bg-gray-100 text-gray-900'
                              }`}
                            >
                              <p className="text-sm leading-relaxed">{message.content}</p>
                              <p
                                className={`text-xs mt-2 ${
                                  isOwnMessage ? 'text-gray-300' : 'text-gray-500'
                                }`}
                              >
                                {new Date(message.created_at).toLocaleString('fr-FR', {
                                  day: '2-digit',
                                  month: '2-digit',
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

                {/* Zone d'envoi de message */}
                <div className="p-6 border-t border-gray-200">
                  <div className="flex space-x-4">
                    <textarea
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="Tapez votre message..."
                      className="flex-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent resize-none"
                      rows={2}
                    />
                    <button
                      onClick={sendMessage}
                      disabled={sendingMessage || !newMessage.trim()}
                      className="bg-black text-white px-6 py-2 rounded-lg font-bold hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                    >
                      {sendingMessage ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      ) : (
                        <Send className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-gray-500">
                <div className="text-center">
                  <MessageCircle className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                  <p className="text-lg font-semibold mb-2">Sélectionnez une conversation</p>
                  <p>Choisissez une conversation pour commencer à échanger</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal de notation - 🔧 PROPS CORRIGÉES */}
      {showRatingModal && selectedConversation && otherParticipant && userProfile && (
        <RatingModal
          isOpen={showRatingModal}
          onClose={() => setShowRatingModal(false)}
          developerId={otherParticipant.id}
          developerName={otherParticipant.name}
          projectTitle={selectedConversation.project_title}
          currentUser={userProfile}
          onRatingSubmitted={() => {
            console.log('Note soumise avec succès')
            // Recharger les conversations pour mettre à jour
            if (user) {
              loadConversations(user.id)
            }
          }}
        />
      )}
    </div>
  )
}
