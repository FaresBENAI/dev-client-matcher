'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { ArrowLeft, MessageCircle, Send, User, Star, CheckCircle, Settings, Clock, Play, XCircle } from 'lucide-react'
import { useRouter } from 'next/navigation'
import RatingModal from '@/components/rating/RatingModal'
import { useLanguage } from '@/contexts/LanguageContext'

const supabase = createClient()

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
  const [profiles, setProfiles] = useState<any>({})
  const [sendingMessage, setSendingMessage] = useState(false)
  const [showRatingModal, setShowRatingModal] = useState(false)
  const [otherParticipant, setOtherParticipant] = useState<any>(null)
  const [applicationData, setApplicationData] = useState<any>(null)
  const [developerRating, setDeveloperRating] = useState<any>(null)
  const [projectData, setProjectData] = useState<any>(null)
  const [showStatusModal, setShowStatusModal] = useState(false)
  const [newStatus, setNewStatus] = useState('')
  
  const router = useRouter()
  const { t } = useLanguage()

  useEffect(() => {
    checkUser()
  }, [])

  // Écouteur en temps réel pour les messages
  useEffect(() => {
    if (!user) return;

    const messagesSubscription = supabase
      .channel('messages_page_changes')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages'
      }, (payload) => {
        console.log('🆕 Nouveau message reçu:', payload);
        if (payload.new.sender_id !== user.id) {
          loadConversations(user.id);
        }
      })
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'messages'
      }, (payload) => {
        console.log('📝 Message mis à jour:', payload);
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
    const { data: profile } = await supabase
      .from('profiles')
      .select('id, user_type, full_name, email')
      .eq('id', user.id)
      .single()
    setUserProfile(profile)
    loadConversations(user.id)
    setLoading(false)
  }

  const loadProfile = async (userId: string) => {
    if (profiles[userId]) return profiles[userId]

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
      const { data: conversations, error } = await supabase
        .from('conversations')
        .select(`
          *,
          projects (
            id,
            title,
            client_id,
            status,
            created_at,
            budget_min,
            budget_max
          ),
          messages (
            id,
            content,
            created_at,
            sender_id,
            is_read
          )
        `)
        .or(`client_id.eq.${userId},developer_id.eq.${userId}`)
        .order('updated_at', { ascending: false })

      if (error) throw error

      const sortedConversations = (conversations || [])
        .filter(conv => conv.messages && conv.messages.length > 0)
        .sort((a, b) => {
          const lastMessageA = a.messages[a.messages.length - 1]
          const lastMessageB = b.messages[b.messages.length - 1]
          return new Date(lastMessageB.created_at).getTime() - new Date(lastMessageA.created_at).getTime()
        })

      setConversations(sortedConversations)

      const userIds = new Set<string>()
      sortedConversations.forEach(conv => {
        userIds.add(conv.client_id)
        userIds.add(conv.developer_id)
        conv.messages?.forEach((msg: any) => userIds.add(msg.sender_id))
      })

      await Promise.all(
        Array.from(userIds).map(id => loadProfile(id))
      )
    } catch (error) {
      console.error('Erreur lors du chargement des conversations:', error)
    }
  }

  const loadMessages = async (conversationId: string) => {
    try {
      const { data: messages, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true })

      if (error) throw error

      if (messages && messages.length > 0) {
        for (const message of messages) {
          await loadProfile(message.sender_id)
        }
      }

      setMessages(messages || [])
      await markMessagesAsRead(conversationId)
    } catch (error) {
      console.error('Erreur lors du chargement des messages:', error)
      setMessages([])
    }
  }

  const getOtherParticipant = (conversation: any) => {
    if (!conversation || !user) {
      return {
        id: '',
        name: t('messages.anonymous.user'),
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
        name: isClient ? t('messages.anonymous.developer') : t('messages.anonymous.client'),
        avatar: null,
        email: 'utilisateur@exemple.com',
        type: isClient ? 'developer' : 'client'
      }
    }
    
    return {
      id: otherUserId,
      name: otherUserProfile.full_name || otherUserProfile.email?.split('@')[0] || t('messages.anonymous.user'),
      avatar: otherUserProfile.avatar_url,
      email: otherUserProfile.email,
      type: otherUserProfile.user_type
    }
  }

  const selectConversation = async (conversation: any) => {
    setSelectedConversation(conversation)
    setOtherParticipant(getOtherParticipant(conversation))
    await loadMessages(conversation.id)
    await markMessagesAsRead(conversation.id)
    
    // Charger les données du projet si disponible
    if (conversation.project_id) {
      await loadProjectData(conversation.project_id)
      await loadApplicationData(conversation.project_id, conversation.developer_id)
    } else {
      setProjectData(null)
      setApplicationData(null)
    }
    
    // Charger les ratings du développeur si c'est une conversation avec un développeur
    const otherUser = getOtherParticipant(conversation)
    if (otherUser?.type === 'developer') {
      await loadDeveloperRating(otherUser.id)
    } else {
      setDeveloperRating(null)
    }
  }

  const loadProjectData = async (projectId: string) => {
    try {
      const { data: project, error } = await supabase
        .from('projects')
        .select('*')
        .eq('id', projectId)
        .single()

      if (!error && project) {
        setProjectData(project)
        setNewStatus(project.status)
      } else {
        setProjectData(null)
      }
    } catch (error) {
      console.error('Erreur lors du chargement du projet:', error)
      setProjectData(null)
    }
  }

  const markMessagesAsRead = async (conversationId: string) => {
    if (!user) return;

    try {
      // Marquer tous les messages non lus comme lus
      const { error } = await supabase
        .from('messages')
        .update({ is_read: true })
        .eq('conversation_id', conversationId)
        .neq('sender_id', user.id) // Messages reçus par l'utilisateur actuel
        .is('is_read', false);

      if (error) {
        console.error('Erreur marquage messages comme lus:', error);
        return;
      }

      // Mettre à jour la liste des conversations pour refléter les changements
      await loadConversations(user.id);
      
      // Déclencher une mise à jour du compteur de notifications dans la navbar
      // En utilisant un événement personnalisé
      window.dispatchEvent(new CustomEvent('messagesRead', { 
        detail: { conversationId, userId: user.id } 
      }));

    } catch (error) {
      console.error('Erreur générale marquage messages:', error);
    }
  };

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
        setApplicationData(null)
      } else {
        setApplicationData(application)
      }
    } catch (error) {
      setApplicationData(null)
    }
  }

  const loadDeveloperRating = async (developerId: string) => {
    try {
      const { data: devProfile, error } = await supabase
        .from('developer_profiles')
        .select('average_rating, total_ratings')
        .eq('id', developerId)
        .single()

      if (error) {
        setDeveloperRating({ average_rating: 0, total_ratings: 0 })
      } else {
        setDeveloperRating(devProfile || { average_rating: 0, total_ratings: 0 })
      }
    } catch (error) {
      setDeveloperRating({ average_rating: 0, total_ratings: 0 })
    }
  }

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
      await markMessagesAsRead(selectedConversation.id)
      loadMessages(selectedConversation.id)
      loadConversations(user.id)
    } catch (error) {
      console.error('Erreur lors de l\'envoi du message:', error)
    } finally {
      setSendingMessage(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const acceptApplication = async (applicationId: string) => {
    if (!user || !selectedConversation) return;

    try {
      const { error } = await supabase
        .from('project_applications')
        .update({ status: 'accepted', updated_at: new Date().toISOString() })
        .eq('id', applicationId);

      if (error) {
        console.error('Erreur mise à jour statut application:', error);
        alert(t('msg.error'));
        return;
      }

      const statusMessage = `✅ **${t('messages.application.accepted')}** ${t('messages.application.accepted.desc')}`;
      await supabase
        .from('messages')
        .insert({
          conversation_id: selectedConversation.id,
          sender_id: user.id,
          content: statusMessage,
          created_at: new Date().toISOString()
        });

      alert(t('messages.application.accepted.success'));
      loadMessages(selectedConversation.id);
      loadConversations(user.id);
      if (selectedConversation.project_id) {
        await loadApplicationData(selectedConversation.project_id, selectedConversation.developer_id);
      }
    } catch (error) {
      console.error('Erreur générale:', error);
    }
  };

  const rejectApplication = async (applicationId: string) => {
    if (!user || !selectedConversation) return;

    try {
      const { error } = await supabase
        .from('project_applications')
        .update({ status: 'rejected', updated_at: new Date().toISOString() })
        .eq('id', applicationId);

      if (error) {
        console.error('Erreur mise à jour statut application:', error);
        alert(t('msg.error'));
        return;
      }

      const statusMessage = `❌ **${t('messages.application.rejected')}** ${t('messages.application.rejected.desc')}`;
      await supabase
        .from('messages')
        .insert({
          conversation_id: selectedConversation.id,
          sender_id: user.id,
          content: statusMessage,
          created_at: new Date().toISOString()
        });

      alert(t('messages.application.rejected.success'));
      loadMessages(selectedConversation.id);
      loadConversations(user.id);
      if (selectedConversation.project_id) {
        await loadApplicationData(selectedConversation.project_id, selectedConversation.developer_id);
      }
    } catch (error) {
      console.error('Erreur générale:', error);
    }
  };

  const updateProjectStatus = async () => {
    if (!projectData || !user || user.id !== projectData.client_id) return;
    
    try {
      const { error } = await supabase
        .from('projects')
        .update({ 
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', projectData.id)
        .eq('client_id', user.id);

      if (error) {
        console.error('Erreur mise à jour statut projet:', error);
        alert('Erreur lors de la mise à jour du statut');
        return;
      }

      // Envoyer un message de notification
      const statusMessage = `📋 **Statut du projet mis à jour** : ${getStatusLabel(newStatus)}`;
      await supabase
        .from('messages')
        .insert({
          conversation_id: selectedConversation.id,
          sender_id: user.id,
          content: statusMessage,
          created_at: new Date().toISOString()
        });

      setProjectData({ ...projectData, status: newStatus });
      setShowStatusModal(false);
      loadMessages(selectedConversation.id);
      loadConversations(user.id);
    } catch (error) {
      console.error('Erreur générale:', error);
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'open': return t('status.open');
      case 'in_progress': return t('status.in_progress');
      case 'completed': return t('status.completed');
      case 'cancelled': return t('status.cancelled');
      case 'paused': return t('status.paused');
      default: return status;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'bg-green-100 text-green-800 border-green-200';
      case 'in_progress': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'completed': return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'cancelled': return 'bg-red-100 text-red-800 border-red-200';
      case 'paused': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'open': return Play;
      case 'in_progress': return Clock;
      case 'completed': return CheckCircle;
      case 'cancelled': return XCircle;
      case 'paused': return Clock;
      default: return Clock;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto mb-4"></div>
          <p className="text-gray-600">{t('messages.loading')}</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{t('messages.login.required')}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto h-screen flex">
        {/* Header mobile uniquement */}
        <div className="md:hidden absolute top-0 left-0 right-0 bg-white border-b border-gray-200 z-10 p-4">
          <div className="flex items-center justify-between">
          <div className="flex items-center">
            <button 
              onClick={() => router.back()}
              className="flex items-center text-gray-600 hover:text-black transition-colors mr-4"
            >
              <ArrowLeft className="h-5 w-5 mr-2" />
                {t('messages.back')}
            </button>
              <h1 className="text-xl font-black text-black">{t('nav.messages')}</h1>
            </div>
          </div>
        </div>

        {/* Header desktop uniquement */}
        <div className="hidden md:block w-full absolute top-0 left-0 right-0 bg-gray-50 z-10 p-8">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <button 
                  onClick={() => router.back()}
                  className="flex items-center text-gray-600 hover:text-black transition-colors mr-4"
                >
                  <ArrowLeft className="h-5 w-5 mr-2" />
                  {t('messages.back')}
                </button>
                <h1 className="text-2xl font-black text-black">{t('nav.messages')}</h1>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar - Liste des conversations */}
        <div className="w-full md:w-1/3 bg-white border-r border-gray-200 flex flex-col mt-16 md:mt-24">
          <div className="p-4 md:p-6 border-b border-gray-200">
            <h2 className="text-lg md:text-xl font-bold text-black flex items-center">
                <MessageCircle className="h-5 w-5 mr-2" />
              {t('messages.conversations')} ({conversations.length})
              </h2>
            </div>
            
            <div className="overflow-y-auto h-full">
              {conversations.length === 0 ? (
              <div className="p-4 md:p-6 text-center text-gray-500">
                <MessageCircle className="h-8 md:h-12 w-8 md:w-12 mx-auto mb-4 text-gray-300" />
                <p className="text-sm md:text-base">{t('messages.no.conversations')}</p>
                </div>
              ) : (
                conversations.map((conversation) => {
                  const lastMessage = conversation.messages?.[conversation.messages.length - 1]
                  const otherParticipant = getOtherParticipant(conversation)
                  const isSelected = selectedConversation?.id === conversation.id
                  
                  // Compter les messages non lus pour cet utilisateur
                  const unreadCount = conversation.messages?.filter(msg => 
                    !msg.is_read && msg.sender_id !== user?.id
                  ).length || 0
                  
                  // Déterminer le contenu à afficher (dernier message ou message de candidature)
                  let displayContent = ''
                  let displayTime = ''
                  
                  if (lastMessage) {
                    displayContent = lastMessage.content
                    displayTime = new Date(lastMessage.created_at).toLocaleString()
                  }
                  
                  return (
                    <div
                      key={conversation.id}
                      onClick={() => selectConversation(conversation)}
                      className={`p-3 md:p-4 border-b border-gray-100 cursor-pointer transition-colors ${
                        isSelected ? 'bg-blue-50 border-blue-200' : 'hover:bg-gray-50'
                      } ${unreadCount > 0 ? 'border-l-4 border-l-black bg-gray-50' : ''}`}
                    >
                      <div className="flex items-start space-x-3">
                        <div className="w-8 h-8 md:w-10 md:h-10 rounded-full overflow-hidden bg-gray-200 flex-shrink-0">
                          {otherParticipant?.avatar ? (
                            <img
                              src={otherParticipant.avatar}
                              alt={otherParticipant.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full bg-gray-400 flex items-center justify-center text-white font-bold text-xs md:text-sm">
                              {(otherParticipant?.name || 'U').charAt(0).toUpperCase()}
                            </div>
                          )}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <h3 className="font-bold text-sm md:text-base text-black truncate">
                              {otherParticipant?.name || t('messages.anonymous.user')}
                            </h3>
                            {unreadCount > 0 && (
                              <span className="bg-black text-white text-xs font-bold px-2 py-1 rounded-full min-w-[20px] text-center">
                                {unreadCount}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-gray-500 mb-1">
                            {conversation.projects?.title || t('messages.general.conversation')}
                          </p>
                          {displayContent && (
                            <p className={`text-xs md:text-sm truncate ${unreadCount > 0 ? 'font-bold text-black' : 'text-gray-600'}`}>
                              {displayContent}
                            </p>
                          )}
                          {displayTime && (
                            <p className="text-xs text-gray-400 mt-1">
                              {displayTime}
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

        {/* Zone des messages - cachée sur mobile si aucune conversation sélectionnée */}
        <div className={`flex-1 flex-col mt-16 md:mt-24 ${selectedConversation ? 'flex' : 'hidden md:flex'}`}>
            {selectedConversation ? (
              <>
              {/* Header de la conversation enrichi */}
              <div className="bg-white border-b border-gray-200">
                {/* Header principal */}
                <div className="p-4 md:p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      {/* Bouton retour mobile */}
                      <button
                        onClick={() => setSelectedConversation(null)}
                        className="md:hidden text-gray-400 hover:text-black p-1 rounded"
                      >
                        ←
                      </button>
                      <div className="w-8 h-8 md:w-10 md:h-10 rounded-full overflow-hidden bg-gray-200">
                        {otherParticipant?.avatar ? (
                          <img
                            src={otherParticipant.avatar}
                            alt={otherParticipant.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-gray-400 flex items-center justify-center text-white font-bold text-xs md:text-sm">
                            {(otherParticipant?.name || 'U').charAt(0).toUpperCase()}
                        </div>
                        )}
                      </div>
                      <div>
                        <h3 className="font-bold text-sm md:text-base text-black">
                          {otherParticipant?.name || t('messages.anonymous.user')}
                          </h3>
                        <p className="text-xs md:text-sm text-gray-500">
                          {projectData?.title || selectedConversation.projects?.title || t('messages.general.conversation')}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-col items-end space-y-2">
                      {/* Actions pour les clients */}
                      {userProfile?.user_type === 'client' && applicationData && applicationData.status === 'pending' && (
                        <div className="flex space-x-2">
                          <button
                            onClick={() => acceptApplication(applicationData.id)}
                            className="bg-green-600 text-white px-3 py-1 rounded-lg font-bold hover:bg-green-700 transition-colors text-sm flex items-center"
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            {t('messages.accept')}
                          </button>
                          <button
                            onClick={() => rejectApplication(applicationData.id)}
                            className="bg-red-600 text-white px-3 py-1 rounded-lg font-bold hover:bg-red-700 transition-colors text-sm"
                          >
                            {t('messages.reject')}
                          </button>
                        </div>
                      )}

                      {/* Bouton de notation pour les clients */}
                      {userProfile?.user_type === 'client' && otherParticipant?.type === 'developer' && (
                        <div>
                          {/* Affichage de la note existante */}
                          {developerRating && developerRating.average_rating > 0 && (
                            <div className="text-right mb-2">
                              <div className="flex items-center justify-end space-x-1">
                                <Star className="h-4 w-4 text-yellow-400 fill-current" />
                                <span className="text-sm font-bold">
                                  {developerRating.average_rating.toFixed(1)}
                                </span>
                                <span className="text-xs text-gray-500">
                                  ({developerRating.total_ratings} {t('messages.ratings')})
                              </span>
                            </div>
                        </div>
                          )}
                          
                          {/* Bouton pour noter */}
                          {applicationData && applicationData.status === 'accepted' && (
                            <button
                              onClick={() => setShowRatingModal(true)}
                              className="bg-yellow-500 text-white px-4 py-2 rounded-lg font-bold hover:bg-yellow-600 transition-colors text-sm flex items-center"
                            >
                              <Star className="h-4 w-4 mr-2" />
                              {t('messages.rate')}
                            </button>
                        )}
                      </div>
                      )}
                    </div>
                          </div>
                        </div>
                        
                {/* Barre de statut du projet */}
                {projectData && (
                  <div className="px-4 md:px-6 pb-4">
                    <div className="bg-gray-50 rounded-lg p-3 border-2 border-gray-200">
                      {/* Header compact avec statut et bouton */}
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          {(() => {
                            const StatusIcon = getStatusIcon(projectData.status);
                            return <StatusIcon className="h-4 w-4 text-gray-600" />;
                          })()}
                          <span className="font-bold text-gray-800 text-sm">Statut du Projet</span>
                          <span className={`px-2 py-1 text-xs font-bold border rounded ${getStatusColor(projectData.status)}`}>
                            {getStatusLabel(projectData.status)}
                          </span>
                        </div>
                        {userProfile?.user_type === 'client' && user?.id === projectData.client_id && (
                          <button 
                            onClick={() => setShowStatusModal(true)}
                            className="bg-gray-600 text-white px-2 py-1 rounded font-bold hover:bg-gray-700 transition-colors text-xs flex items-center"
                          >
                            <Settings className="h-3 w-3 mr-1" />
                            Modifier
                          </button>
                        )}
                      </div>

                      {/* Progression compacte */}
                      <div className="mb-2">
                        <div className="flex justify-between text-xs text-gray-600 mb-1">
                          <span>Progression</span>
                          <span className="font-medium">
                            {projectData.status === 'completed' ? '100%' : 
                             projectData.status === 'in_progress' ? '50%' : 
                             projectData.status === 'open' ? '10%' : '0%'}
                          </span>
                  </div>
                        <div className="w-full bg-gray-200 rounded-full h-1.5">
                          <div 
                            className={`h-1.5 rounded-full transition-all duration-300 ${
                              projectData.status === 'completed' ? 'bg-green-500 w-full' :
                              projectData.status === 'in_progress' ? 'bg-blue-500 w-1/2' :
                              projectData.status === 'open' ? 'bg-yellow-500 w-1/12' :
                              'bg-gray-400 w-0'
                            }`}
                          ></div>
                        </div>
                      </div>
                        
                      {/* Informations compactes en ligne */}
                      <div className="flex justify-between text-xs text-gray-600">
                        <div className="flex items-center space-x-3">
                          <div>
                            <span className="font-medium">💼 Budget:</span>
                            <span className="ml-1">
                              {projectData.budget_min && projectData.budget_max 
                                ? `${projectData.budget_min}€ - ${projectData.budget_max}€`
                                : 'À négocier'
                              }
                            </span>
                          </div>
                        </div>
                        <div>
                          <span className="font-medium">📅 Créé:</span>
                          <span className="ml-1">
                            {new Date(projectData.created_at).toLocaleDateString('fr-FR', {
                              day: '2-digit',
                              month: '2-digit',
                              year: '2-digit'
                            })}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                </div>

                {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-3 md:space-y-4">
                  {messages.length === 0 ? (
                    <div className="text-center text-gray-500 py-8">
                    <MessageCircle className="h-8 md:h-12 w-8 md:w-12 mx-auto mb-4 text-gray-300" />
                    <p className="text-sm md:text-base">{t('messages.no.messages')}</p>
                    <p className="text-xs md:text-sm mt-2">{t('messages.start.conversation')}</p>
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
                        <div className={`flex items-end space-x-2 max-w-[85%] md:max-w-xs lg:max-w-md ${
                            isOwnMessage ? 'flex-row-reverse space-x-reverse' : ''
                          }`}>
                            {/* Avatar dans les messages */}
                            {!isOwnMessage && (
                              <div className="w-6 h-6 rounded-full overflow-hidden bg-gray-200 flex-shrink-0">
                                {senderProfile?.avatar_url ? (
                                  <img
                                    src={senderProfile.avatar_url}
                                  alt={senderProfile.full_name || t('messages.user')}
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
                            
                          {/* Message */}
                          <div className={`px-3 py-2 rounded-lg max-w-full ${
                                isOwnMessage
                                  ? 'bg-black text-white'
                              : 'bg-gray-200 text-gray-900'
                          }`}>
                            <p className="text-xs md:text-sm break-words whitespace-pre-wrap">
                              {message.content}
                            </p>
                            <p className={`text-xs mt-1 ${
                                  isOwnMessage ? 'text-gray-300' : 'text-gray-500'
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

              {/* Zone de saisie */}
              <div className="p-3 md:p-6 border-t border-gray-200 bg-white">
                <div className="flex space-x-2 md:space-x-4">
                    <textarea
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyPress={handleKeyPress}
                    placeholder={t('messages.type.message')}
                    className="flex-1 p-2 md:p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent resize-none text-sm md:text-base"
                      rows={2}
                    />
                    <button
                      onClick={sendMessage}
                      disabled={sendingMessage || !newMessage.trim()}
                    className="bg-black text-white px-3 md:px-6 py-2 rounded-lg font-bold hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
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
            <div className="flex-1 flex items-center justify-center text-gray-500 bg-white">
                <div className="text-center">
                <MessageCircle className="h-12 md:h-16 w-12 md:w-16 mx-auto mb-4 text-gray-300" />
                <p className="text-base md:text-lg font-semibold mb-2">{t('messages.select.conversation')}</p>
                <p className="text-sm md:text-base">{t('messages.select.conversation.desc')}</p>
                </div>
              </div>
            )}
          </div>

        {/* Modal de changement de statut */}
        {showStatusModal && projectData && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-md w-full">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-lg font-bold text-black">Modifier le statut du projet</h3>
        </div>
              
              <div className="p-6">
                <div className="mb-4">
                  <label className="block text-sm font-bold text-black mb-2">
                    Nouveau statut
                  </label>
                  <select
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                  >
                    <option value="open">Ouvert</option>
                    <option value="in_progress">En cours</option>
                    <option value="completed">Terminé</option>
                    <option value="paused">En pause</option>
                    <option value="cancelled">Annulé</option>
                  </select>
      </div>

                <div className="flex space-x-3">
                  <button
                    onClick={() => setShowStatusModal(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-bold hover:bg-gray-50 transition-colors"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={updateProjectStatus}
                    className="flex-1 px-4 py-2 bg-black text-white rounded-lg font-bold hover:bg-gray-800 transition-colors"
                  >
                    Mettre à jour
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal de notation */}
      {showRatingModal && selectedConversation && otherParticipant && userProfile && (
        <RatingModal
          isOpen={showRatingModal}
          onClose={() => setShowRatingModal(false)}
          developerId={otherParticipant.id}
          developerName={otherParticipant.name}
            projectTitle={projectData?.title || selectedConversation.projects?.title}
          currentUser={userProfile}
          onRatingSubmitted={() => {
            console.log('Note soumise avec succès')
            if (user) {
              loadConversations(user.id)
            }
          }}
        />
      )}
      </div>
    </div>
  )
}