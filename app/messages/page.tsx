'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@supabase/supabase-js'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import StatusBar from '@/components/StatusBar'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

interface Conversation {
  id: string
  subject: string
  status: string
  last_message_at: string
  created_at: string
  client_id: string
  developer_id: string
  client_name?: string
  developer_name?: string
  unread_count: number
  project_id?: string
  application_id?: string
}

interface Message {
  id: string
  sender_id: string
  content: string
  is_read: boolean
  created_at: string
  sender_name?: string
}

interface ApplicationData {
  id: string
  status: string
  project: {
    client_id: string
    title: string
  }
}

export default function MessagesPage() {
  const [user, setUser] = useState<any>(null)
  const [userProfile, setUserProfile] = useState<any>(null)
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [showSidebar, setShowSidebar] = useState(false)
  const [debugInfo, setDebugInfo] = useState<string[]>([])
  const [autoFixCompleted, setAutoFixCompleted] = useState(false)
  const [isFixing, setIsFixing] = useState(false)
  const [applicationData, setApplicationData] = useState<ApplicationData | null>(null)
  const [isCreator, setIsCreator] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const addDebug = (message: string) => {
    setDebugInfo(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`])
    console.log(message)
  }

  // 🆕 FONCTION POUR RÉCUPÉRER LES DONNÉES DE CANDIDATURE
  const loadApplicationData = async (conversationId: string) => {
    try {
      addDebug(`🔍 Chargement données candidature pour conversation: ${conversationId}`)
      
      // D'abord, récupérer la conversation avec application_id
      const { data: convData, error: convError } = await supabase
        .from('conversations')
        .select('application_id, project_id')
        .eq('id', conversationId)
        .single()

      addDebug(`📋 Conversation data: application_id=${convData?.application_id}, project_id=${convData?.project_id}`)

      if (convError || !convData?.application_id) {
        addDebug('❌ Pas de données de candidature pour cette conversation')
        setApplicationData(null)
        return
      }

      // Récupérer les données de la candidature
      const { data: appData, error: appError } = await supabase
        .from('project_applications')
        .select(`
          id,
          status,
          project:projects(
            client_id,
            title
          )
        `)
        .eq('id', convData.application_id)
        .single()

      addDebug(`📊 Application data: ${JSON.stringify(appData)}`)

      if (appError || !appData) {
        addDebug(`❌ Erreur récupération candidature: ${appError?.message}`)
        setApplicationData(null)
        return
      }

      // 🔧 CORRECTION: S'assurer que project est un objet, pas un tableau
      const projectData = Array.isArray(appData.project) ? appData.project[0] : appData.project

      if (!projectData) {
        addDebug('❌ Données projet manquantes')
        setApplicationData(null)
        return
      }

      const applicationData: ApplicationData = {
        id: appData.id,
        status: appData.status || 'en_attente', // 🔧 AJOUT: valeur par défaut
        project: {
          client_id: projectData.client_id,
          title: projectData.title
        }
      }

      setApplicationData(applicationData)
      setIsCreator(projectData.client_id === user.id)
      addDebug(`✅ Données candidature chargées: status=${applicationData.status}, isCreator=${projectData.client_id === user.id}`)

    } catch (error) {
      addDebug(`💥 Erreur loadApplicationData: ${error}`)
      console.error('Erreur loadApplicationData:', error)
      setApplicationData(null)
    }
  }

  // 🆕 FONCTION POUR METTRE À JOUR LE STATUT
  const handleStatusUpdate = (newStatus: string) => {
    addDebug(`📊 Mise à jour statut: ${newStatus}`)
    
    if (applicationData) {
      setApplicationData({
        ...applicationData,
        status: newStatus
      })
    }

    // Mettre à jour la conversation dans la liste si elle a un statut visible
    setConversations(prev => prev.map(conv => 
      conv.id === selectedConversation?.id 
        ? { ...conv, status: newStatus }
        : conv
    ))
  }

  // 🔧 FONCTION AUTOMATIQUE AMÉLIORÉE AVEC INTÉGRATION DU SYSTÈME DE STATUT
  const autoCreateMissingConversations = async (userId: string) => {
    try {
      addDebug('🤖 Vérification automatique complète...')

      // 1. Récupérer toutes les candidatures de l'utilisateur
      const { data: applications, error: appError } = await supabase
        .from('project_applications')
        .select(`
          id,
          project_id,
          developer_id,
          message,
          status,
          created_at,
          projects (
            id,
            title,
            client_id
          )
        `)
        .eq('developer_id', userId)

      if (appError || !applications) {
        addDebug(`❌ Erreur récupération candidatures: ${appError?.message}`)
        return
      }

      addDebug(`📋 ${applications.length} candidatures trouvées`)

      if (applications.length === 0) {
        addDebug('ℹ️ Aucune candidature trouvée')
        setAutoFixCompleted(true)
        return
      }

      let conversationsCreated = 0
      let messagesCreated = 0

      // 2. Pour chaque candidature, vérifier conversation ET message
      for (const app of applications) {
        const project = app.projects as any
        if (!project) {
          addDebug(`⚠️ Projet non trouvé pour candidature ${app.id}`)
          continue
        }

        addDebug(`🔍 Vérification: ${project.title}`)

        // Vérifier si conversation existe
        const { data: existingConversation } = await supabase
          .from('conversations')
          .select('id')
          .eq('client_id', project.client_id)
          .eq('developer_id', app.developer_id)
          .single()

        let conversationId = existingConversation?.id

        // Créer conversation si elle n'existe pas
        if (!existingConversation) {
          addDebug(`➕ Création conversation: ${project.title}`)

          const { data: newConversation, error: convError } = await supabase
            .from('conversations')
            .insert([{
              client_id: project.client_id,
              developer_id: app.developer_id,
              project_id: app.project_id,
              application_id: app.id, // 🆕 AJOUT: lien vers la candidature
              subject: `Candidature pour : ${project.title}`,
              status: 'active',
              created_at: app.created_at,
              last_message_at: app.created_at
            }])
            .select()
            .single()

          if (convError) {
            addDebug(`❌ Erreur création conversation: ${convError.message}`)
            continue
          }

          conversationId = newConversation.id
          conversationsCreated++
          addDebug(`✅ Conversation créée: ${conversationId}`)
        } else {
          // 🆕 Mettre à jour la conversation existante avec application_id si manquant
          await supabase
            .from('conversations')
            .update({ 
              application_id: app.id,
              project_id: app.project_id 
            })
            .eq('id', existingConversation.id)
        }

        // Vérifier si le message de candidature existe
        if (conversationId) {
          const { data: existingMessages } = await supabase
            .from('messages')
            .select('id, content')
            .eq('conversation_id', conversationId)
            .eq('sender_id', app.developer_id)

          const hasCandidatureMessage = existingMessages?.some(msg => 
            msg.content.includes(project.title) && msg.content.includes('candidater')
          )

          if (!hasCandidatureMessage) {
            addDebug(`📝 Création message candidature pour: ${project.title}`)

            const { data: userProfile } = await supabase
              .from('profiles')
              .select('full_name')
              .eq('id', app.developer_id)
              .single()

            const messageContent = `Bonjour ! Je souhaiterais candidater pour votre projet "${project.title}".

${app.message}

Cordialement,
${userProfile?.full_name || 'Un développeur'}`

            const { error: msgError } = await supabase
              .from('messages')
              .insert([{
                conversation_id: conversationId,
                sender_id: app.developer_id,
                content: messageContent,
                created_at: app.created_at,
                is_read: false
              }])

            if (msgError) {
              addDebug(`❌ Erreur création message: ${msgError.message}`)
            } else {
              messagesCreated++
              addDebug(`✅ Message candidature créé`)
            }
          } else {
            addDebug(`ℹ️ Message candidature existe déjà pour: ${project.title}`)
          }
        }
      }

      addDebug(`🎉 Auto-fix terminé:`)
      addDebug(`   - ${conversationsCreated} conversations créées`)
      addDebug(`   - ${messagesCreated} messages créés`)
      
      setAutoFixCompleted(true)
      return { conversationsCreated, messagesCreated }

    } catch (error: any) {
      addDebug(`💥 Erreur auto-fix: ${error.message}`)
      console.error('Erreur auto-fix:', error)
      setAutoFixCompleted(true)
      return { conversationsCreated: 0, messagesCreated: 0 }
    }
  }

  useEffect(() => {
    checkUser()
  }, [])

  useEffect(() => {
    if (user && !autoFixCompleted) {
      const runAutoFix = async () => {
        const result = await autoCreateMissingConversations(user.id)
        setTimeout(() => {
          fetchConversations()
        }, (result?.conversationsCreated || 0) > 0 || (result?.messagesCreated || 0) > 0 ? 1500 : 500)
      }
      runAutoFix()
    } else if (user && autoFixCompleted) {
      fetchConversations()
    }
  }, [user, autoFixCompleted])

  useEffect(() => {
    if (selectedConversation) {
      fetchMessages(selectedConversation.id)
      markConversationAsRead(selectedConversation.id)
      loadApplicationData(selectedConversation.id) // 🆕 CHARGEMENT DES DONNÉES DE CANDIDATURE
      setShowSidebar(false)
    }
  }, [selectedConversation])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const checkUser = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        window.location.href = '/auth/login'
        return
      }

      setUser(user)
      addDebug(`Utilisateur connecté: ${user.id}`)
      
      const { data: profile } = await supabase
        .from('profiles')
        .select('user_type, full_name')
        .eq('id', user.id)
        .single()
      setUserProfile(profile)
      addDebug(`Profil: ${profile?.user_type} - ${profile?.full_name}`)
    } catch (error) {
      addDebug(`Erreur auth: ${error}`)
    } finally {
      setLoading(false)
    }
  }

  const fetchConversations = async () => {
    try {
      addDebug(`Chargement conversations pour: ${user.id}`)
      
      const { data: conversationsData, error: convError } = await supabase
        .from('conversations')
        .select('*')
        .or(`client_id.eq.${user.id},developer_id.eq.${user.id}`)
        .order('last_message_at', { ascending: false })

      addDebug(`Conversations trouvées: ${conversationsData?.length || 0}`)
      
      if (convError) {
        addDebug(`Erreur conversations: ${convError.message}`)
        return
      }

      if (!conversationsData || conversationsData.length === 0) {
        addDebug('Aucune conversation trouvée')
        setConversations([])
        return
      }

      const clientIds = conversationsData.map(c => c.client_id)
      const developerIds = conversationsData.map(c => c.developer_id)
      const allIds = [...clientIds, ...developerIds]
      const userIds = Array.from(new Set(allIds))

      const { data: profilesData } = await supabase
        .from('profiles')
        .select('id, full_name')
        .in('id', userIds)

      const conversationsWithData = await Promise.all(
        conversationsData.map(async (conv) => {
          const { count } = await supabase
            .from('messages')
            .select('*', { count: 'exact', head: true })
            .eq('conversation_id', conv.id)
            .eq('is_read', false)
            .neq('sender_id', user.id)

          const clientProfile = profilesData?.find(p => p.id === conv.client_id)
          const developerProfile = profilesData?.find(p => p.id === conv.developer_id)

          return {
            ...conv,
            client_name: clientProfile?.full_name || 'Client inconnu',
            developer_name: developerProfile?.full_name || 'Développeur inconnu',
            unread_count: count || 0
          }
        })
      )

      addDebug(`Conversations finales: ${conversationsWithData.length}`)
      setConversations(conversationsWithData)
    } catch (error) {
      addDebug(`Exception: ${error}`)
      console.error('Erreur fetchConversations:', error)
    }
  }

  const fetchMessages = async (conversationId: string) => {
    try {
      const { data: messagesData, error: msgError } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true })

      if (msgError || !messagesData) {
        console.error('Erreur messages:', msgError)
        return
      }

      const senderIds: string[] = []
      messagesData.forEach(m => {
        if (!senderIds.includes(m.sender_id)) {
          senderIds.push(m.sender_id)
        }
      })

      const { data: profilesData } = await supabase
        .from('profiles')
        .select('id, full_name')
        .in('id', senderIds)

      const messagesWithNames = messagesData.map(msg => ({
        ...msg,
        sender_name: profilesData?.find(p => p.id === msg.sender_id)?.full_name || 'Utilisateur inconnu'
      }))

      setMessages(messagesWithNames)
    } catch (error) {
      console.error('Erreur fetchMessages:', error)
    }
  }

  const markConversationAsRead = async (conversationId: string) => {
    await supabase
      .from('messages')
      .update({ is_read: true })
      .eq('conversation_id', conversationId)
      .neq('sender_id', user.id)
  }

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim() || !selectedConversation || sending) return

    setSending(true)
    try {
      const { error } = await supabase
        .from('messages')
        .insert({
          conversation_id: selectedConversation.id,
          sender_id: user.id,
          content: newMessage.trim()
        })

      if (!error) {
        await supabase
          .from('conversations')
          .update({ last_message_at: new Date().toISOString() })
          .eq('id', selectedConversation.id)

        setNewMessage('')
        fetchMessages(selectedConversation.id)
        fetchConversations()
      }
    } catch (err) {
      console.error('Erreur lors de l\'envoi:', err)
    } finally {
      setSending(false)
    }
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))

    if (days === 0) {
      return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
    } else if (days === 1) {
      return 'Hier'
    } else if (days < 7) {
      return `${days} jours`
    } else {
      return date.toLocaleDateString('fr-FR')
    }
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

  return (
    <div className="min-h-screen bg-white">
      {/* Header avec fond étoilé */}
      <div className="relative bg-black text-white py-24 overflow-hidden">
        <div className="absolute inset-0">
          <div className="stars"></div>
          <div className="twinkling"></div>
        </div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-5xl font-black mb-6 bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
            Messagerie
          </h1>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            {userProfile?.user_type === 'client' ? 
              'Vos conversations avec les développeurs' : 
              'Messages reçus de vos clients'
            }
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="bg-white py-8">
        <div className="max-w-7xl mx-auto h-[calc(100vh-280px)] flex relative">

          {/* Sidebar - Liste des conversations */}
          <div className={`
            ${showSidebar ? 'translate-x-0' : '-translate-x-full'}
            lg:translate-x-0 lg:static absolute inset-y-0 left-0 z-50
            w-full sm:w-80 lg:w-1/3
            bg-gray-50 border-r-2 border-gray-200
            transition-transform duration-300 ease-in-out
          `}>
            <div className="p-4 lg:p-6 border-b-2 border-gray-200 flex items-center justify-between bg-white">
              <div>
                <h2 className="text-xl lg:text-2xl font-black text-black mb-1 lg:mb-2">💬 Conversations</h2>
                <p className="text-gray-600 text-xs lg:text-sm font-medium">
                  {conversations.length} conversation{conversations.length !== 1 ? 's' : ''}
                </p>
              </div>
              <button
                onClick={() => setShowSidebar(false)}
                className="lg:hidden w-8 h-8 bg-black text-white rounded-lg flex items-center justify-center hover:bg-gray-800 transition-colors font-black"
              >
                ✕
              </button>
            </div>

            <div className="overflow-y-auto h-full pb-20 lg:pb-0">
              {conversations.length === 0 && autoFixCompleted ? (
                <div className="p-4 lg:p-6 text-center">
                  <div className="w-20 h-20 bg-gray-200 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <span className="text-3xl">📭</span>
                  </div>
                  <h3 className="text-black font-black mb-2 text-lg">Aucune conversation</h3>
                  <p className="text-gray-600 text-sm font-medium">
                    {userProfile?.user_type === 'client' ? 
                      'Contactez des développeurs pour commencer' : 
                      'Candidatez à des projets pour voir vos conversations ici'}
                  </p>
                </div>
              ) : conversations.length === 0 && !autoFixCompleted ? (
                <div className="p-4 lg:p-6 text-center">
                  <div className="w-20 h-20 bg-blue-200 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <span className="text-3xl">🔄</span>
                  </div>
                  <h3 className="text-black font-black mb-2 text-lg">Vérification en cours...</h3>
                  <p className="text-gray-600 text-sm font-medium">
                    Création automatique des conversations et messages manquants
                  </p>
                </div>
              ) : (
                conversations.map((conversation) => (
                  <div
                    key={conversation.id}
                    onClick={() => setSelectedConversation(conversation)}
                    className={`group p-4 border-b-2 border-gray-200 cursor-pointer hover:bg-white transition-all duration-300 hover:border-black ${
                      selectedConversation?.id === conversation.id ? 'bg-white border-black shadow-lg' : 'bg-gray-50'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-black text-black text-base group-hover:text-gray-700 transition-colors">
                        {userProfile?.user_type === 'client' ? 
                          conversation.developer_name : 
                          conversation.client_name
                        }
                      </h3>
                      <div className="flex items-center gap-2">
                        {conversation.unread_count > 0 && (
                          <span className="bg-black text-white text-xs px-2 py-1 rounded-full min-w-[20px] text-center font-bold">
                            {conversation.unread_count}
                          </span>
                        )}
                        <span className="text-gray-400 text-xs font-medium">
                          {formatTime(conversation.last_message_at)}
                        </span>
                      </div>
                    </div>
                    <p className="text-gray-600 text-sm truncate font-medium">
                      {conversation.subject}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Overlay pour mobile */}
          {showSidebar && (
            <div
              className="lg:hidden fixed inset-0 bg-black/50 z-40"
              onClick={() => setShowSidebar(false)}
            />
          )}

          {/* Zone de chat */}
          <div className="flex-1 flex flex-col bg-white">
            {selectedConversation ? (
              <>
                {/* Header de la conversation */}
                <div className="p-4 lg:p-6 border-b-2 border-gray-200 bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => setShowSidebar(true)}
                        className="lg:hidden w-10 h-10 bg-black text-white rounded-lg flex items-center justify-center hover:bg-gray-800 transition-colors font-black"
                      >
                        ☰
                      </button>
                      <div>
                        <h2 className="text-lg lg:text-xl font-black text-black">
                          {userProfile?.user_type === 'client' ? 
                            selectedConversation.developer_name : 
                            selectedConversation.client_name
                          }
                        </h2>
                        <p className="text-gray-600 text-xs lg:text-sm truncate max-w-xs lg:max-w-none font-medium">
                          {selectedConversation.subject}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold border-2 ${
                        selectedConversation.status === 'active' ? 
                          'bg-white text-black border-black' : 
                          'bg-gray-200 text-gray-600 border-gray-300'
                      }`}>
                        {selectedConversation.status === 'active' ? 'Active' : 'Fermée'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* 🆕 AJOUT: Barre de statut avec debug */}
                {applicationData ? (
                  <div>
                    <div className="bg-blue-50 p-2 text-xs text-blue-800">
                      🔧 DEBUG: Status={applicationData.status}, IsCreator={isCreator}, AppId={applicationData.id}
                    </div>
                    <StatusBar
                      applicationId={applicationData.id}
                      currentStatus={applicationData.status || 'en_attente'}
                      projectClientId={applicationData.project.client_id}
                      isCreator={isCreator}
                      onStatusUpdate={handleStatusUpdate}
                    />
                  </div>
                ) : (
                  <div className="bg-yellow-50 p-2 text-xs text-yellow-800">
                    🔧 DEBUG: Pas de données de candidature pour cette conversation
                  </div>
                )}

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 lg:p-6 space-y-3 lg:space-y-4 bg-white">
                  {messages.length === 0 ? (
                    <div className="text-center py-8">
                      <div className="text-4xl mb-4">💭</div>
                      <p className="text-gray-500">Aucun message dans cette conversation</p>
                    </div>
                  ) : (
                    messages.map((message) => (
                      <div
                        key={message.id}
                        className={`flex ${message.sender_id === user.id ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[85%] sm:max-w-xs lg:max-w-md px-4 py-3 rounded-2xl border-2 ${
                            message.sender_id === user.id
                              ? 'bg-black text-white border-black'
                              : 'bg-gray-50 text-black border-gray-200 hover:border-black transition-colors'
                          }`}
                        >
                          <p className="text-sm lg:text-base break-words font-medium whitespace-pre-wrap">{message.content}</p>
                          <p className={`text-xs mt-2 font-medium ${
                            message.sender_id === user.id ? 'text-gray-300' : 'text-gray-500'
                          }`}>
                            {formatTime(message.created_at)}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Zone de saisie */}
                <div className="p-4 lg:p-6 border-t-2 border-gray-200 bg-gray-50">
                  <form onSubmit={sendMessage} className="flex gap-3">
                    <Input
                      type="text"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder="Tapez votre message..."
                      className="flex-1 bg-white border-2 border-gray-300 text-black text-sm lg:text-base focus:border-black font-medium"
                      disabled={sending}
                    />
                    <Button
                      type="submit"
                      disabled={sending || !newMessage.trim()}
                      className="bg-black text-white hover:bg-gray-800 border-2 border-black px-4 py-2 font-black disabled:bg-gray-400 disabled:border-gray-400 transform hover:scale-105 transition-all duration-300"
                    >
                      {sending ? '...' : '📤'}
                    </Button>
                  </form>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center p-4 bg-white">
                <div className="text-center">
                  <button
                    onClick={() => setShowSidebar(true)}
                    className="lg:hidden mb-6 bg-black text-white px-6 py-3 rounded-lg hover:bg-gray-800 transition-colors font-black border-2 border-black transform hover:scale-105"
                  >
                    ☰ Voir les conversations
                  </button>
                  <div className="w-24 h-24 bg-gray-200 rounded-3xl flex items-center justify-center mx-auto mb-6">
                    <span className="text-4xl">💬</span>
                  </div>
                  <h3 className="text-2xl font-black text-black mb-3">
                    Sélectionnez une conversation
                  </h3>
                  <p className="text-gray-600 text-lg font-medium">
                    Choisissez une conversation pour commencer à échanger
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Styles pour les étoiles */}
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
          from {
            transform: scale(1);
          }
          to {
            transform: scale(1.1);
          }
        }

        @keyframes sparkle {
          from {
            opacity: 0.7;
          }
          to {
            opacity: 1;
          }
        }
      `}</style>
    </div>
  )
}