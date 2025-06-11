'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@supabase/supabase-js'
import { Button } from '../ui/button'
import { Input } from '../ui/input'

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
}

interface Message {
  id: string
  sender_id: string
  content: string
  is_read: boolean
  created_at: string
  sender_name?: string
}

export default function MessagesContent() {
  const [user, setUser] = useState<any>(null)
  const [userProfile, setUserProfile] = useState<any>(null)
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [debugInfo, setDebugInfo] = useState<string[]>([])
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const addDebug = (message: string) => {
    setDebugInfo(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`])
  }

  useEffect(() => {
    checkUser()
  }, [])

  useEffect(() => {
    if (user) {
      fetchConversations()
    }
  }, [user])

  useEffect(() => {
    if (selectedConversation) {
      fetchMessages(selectedConversation.id)
      markConversationAsRead(selectedConversation.id)
    }
  }, [selectedConversation])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      setUser(user)
      addDebug(`Utilisateur connecté: ${user.id}`)
      
      const { data: profile } = await supabase
        .from('profiles')
        .select('user_type, full_name')
        .eq('id', user.id)
        .single()
      setUserProfile(profile)
      addDebug(`Profil: ${profile?.user_type} - ${profile?.full_name}`)
    } else {
      addDebug('Aucun utilisateur connecté')
    }
    setLoading(false)
  }

  const fetchConversations = async () => {
    try {
      addDebug(`Recherche conversations pour user: ${user.id}`)
      
      // Étape 1: Récupérer TOUTES les conversations pour debug
      const { data: allConversations } = await supabase
        .from('conversations')
        .select('*')
      
      addDebug(`Total conversations dans la DB: ${allConversations?.length || 0}`)
      
      // Étape 2: Récupérer les conversations de l'utilisateur
      const { data: conversationsData, error: convError } = await supabase
        .from('conversations')
        .select('*')
        .or(`client_id.eq.${user.id},developer_id.eq.${user.id}`)
        .order('last_message_at', { ascending: false })

      addDebug(`Conversations pour cet utilisateur: ${conversationsData?.length || 0}`)
      
      if (convError) {
        addDebug(`Erreur conversations: ${convError.message}`)
        return
      }

      if (!conversationsData || conversationsData.length === 0) {
        addDebug('Aucune conversation trouvée')
        setConversations([])
        return
      }

      // Debug: afficher les conversations trouvées
      conversationsData.forEach((conv, index) => {
        addDebug(`Conv ${index}: client=${conv.client_id}, dev=${conv.developer_id}, subject=${conv.subject}`)
      })

      // Étape 3: Récupérer tous les profils nécessaires
     // ✅ Version corrigée
const clientIds = conversationsData.map(c => c.client_id)
const developerIds = conversationsData.map(c => c.developer_id)
const allIds = [...clientIds, ...developerIds]
const userIds = Array.from(new Set(allIds))

      addDebug(`IDs des profils à récupérer: ${userIds.join(', ')}`)

      const { data: profilesData } = await supabase
        .from('profiles')
        .select('id, full_name')
        .in('id', userIds)

      addDebug(`Profils récupérés: ${profilesData?.length || 0}`)

      // Étape 4: Compter les messages non lus pour chaque conversation
      const conversationsWithData = await Promise.all(
        conversationsData.map(async (conv) => {
          const { count } = await supabase
            .from('messages')
            .select('*', { count: 'exact', head: true })
            .eq('conversation_id', conv.id)
            .eq('is_read', false)
            .neq('sender_id', user.id)

          // Trouver les noms des participants
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

      addDebug(`Conversations finales avec noms: ${conversationsWithData.length}`)
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

      // ✅ Alternative simple
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
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-white text-xl">Chargement...</div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">🔒</div>
          <h3 className="text-xl font-semibold text-white mb-2">Connexion requise</h3>
          <p className="text-slate-400">Connectez-vous pour accéder à vos messages</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-900">
      <div className="max-w-7xl mx-auto h-screen flex">
        {/* DEBUG PANEL */}
        <div className="w-1/4 bg-yellow-500/10 border-r border-yellow-500/30 p-4 overflow-y-auto">
          <h3 className="text-yellow-400 font-bold mb-2">🔍 DEBUG</h3>
          <div className="space-y-1 text-yellow-300 text-xs">
            {debugInfo.map((info, index) => (
              <div key={index}>{info}</div>
            ))}
          </div>
        </div>

        {/* Sidebar - Liste des conversations */}
        <div className="w-1/3 bg-slate-800/50 border-r border-slate-700">
          <div className="p-6 border-b border-slate-700">
            <h1 className="text-2xl font-bold text-white mb-2">💬 Messages</h1>
            <p className="text-slate-400 text-sm">
              {userProfile?.user_type === 'client' ? 
                'Vos conversations avec les développeurs' : 
                'Messages reçus de vos clients'
              }
            </p>
          </div>

          <div className="overflow-y-auto h-full">
            {conversations.length === 0 ? (
              <div className="p-6 text-center">
                <div className="text-4xl mb-4">📭</div>
                <h3 className="text-white font-medium mb-2">Aucune conversation</h3>
                <p className="text-slate-400 text-sm">
                  {userProfile?.user_type === 'client' ? 
                    'Contactez des développeurs pour commencer' : 
                    'Vous recevrez ici les messages des clients'
                  }
                </p>
              </div>
            ) : (
              conversations.map((conversation) => (
                <div
                  key={conversation.id}
                  onClick={() => setSelectedConversation(conversation)}
                  className={`p-4 border-b border-slate-700/50 cursor-pointer hover:bg-slate-700/30 transition-colors ${
                    selectedConversation?.id === conversation.id ? 'bg-slate-700/50' : ''
                  }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-medium text-white text-sm">
                      {userProfile?.user_type === 'client' ? 
                        conversation.developer_name : 
                        conversation.client_name
                      }
                    </h3>
                    <div className="flex items-center gap-2">
                      {conversation.unread_count > 0 && (
                        <span className="bg-cyan-500 text-white text-xs px-2 py-1 rounded-full">
                          {conversation.unread_count}
                        </span>
                      )}
                      <span className="text-slate-400 text-xs">
                        {formatTime(conversation.last_message_at)}
                      </span>
                    </div>
                  </div>
                  <p className="text-slate-300 text-sm truncate">
                    {conversation.subject}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Zone de chat */}
        <div className="flex-1 flex flex-col">
          {selectedConversation ? (
            <>
              <div className="p-6 border-b border-slate-700 bg-slate-800/30">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-bold text-white">
                      {userProfile?.user_type === 'client' ? 
                        selectedConversation.developer_name : 
                        selectedConversation.client_name
                      }
                    </h2>
                    <p className="text-slate-400 text-sm">{selectedConversation.subject}</p>
                  </div>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.sender_id === user.id ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-xs lg:max-w-md px-4 py-3 rounded-2xl ${
                        message.sender_id === user.id
                          ? 'bg-gradient-to-r from-cyan-500 to-purple-500 text-white'
                          : 'bg-slate-700 text-white'
                      }`}
                    >
                      <p className="text-sm">{message.content}</p>
                      <p className={`text-xs mt-2 ${
                        message.sender_id === user.id ? 'text-cyan-100' : 'text-slate-400'
                      }`}>
                        {formatTime(message.created_at)}
                      </p>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              <div className="p-6 border-t border-slate-700 bg-slate-800/30">
                <form onSubmit={sendMessage} className="flex gap-3">
                  <Input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Tapez votre message..."
                    className="flex-1 bg-slate-700/50 border-slate-600 text-white"
                    disabled={sending}
                  />
                  <Button
                    type="submit"
                    disabled={sending || !newMessage.trim()}
                    className="bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-600 hover:to-purple-600"
                  >
                    {sending ? '...' : '📤'}
                  </Button>
                </form>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <div className="text-6xl mb-4">💬</div>
                <h3 className="text-xl font-semibold text-white mb-2">
                  Sélectionnez une conversation
                </h3>
                <p className="text-slate-400">
                  Choisissez une conversation pour commencer à échanger
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
