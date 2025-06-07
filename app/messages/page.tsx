'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@supabase/supabase-js'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'

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
  client_profiles: { full_name: string }
  developer_profiles: { full_name: string }
  unread_count: number
}

interface Message {
  id: string
  sender_id: string
  content: string
  is_read: boolean
  created_at: string
  sender_profile: { full_name: string }
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
  const messagesEndRef = useRef<HTMLDivElement>(null)

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
    if (!user) {
      window.location.href = '/auth/login'
      return
    }

    setUser(user)
    const { data: profile } = await supabase
      .from('profiles')
      .select('user_type, full_name')
      .eq('id', user.id)
      .single()
    setUserProfile(profile)
    setLoading(false)
  }

  const fetchConversations = async () => {
    const { data, error } = await supabase
      .from('conversations')
      .select(`
        id,
        subject,
        status,
        last_message_at,
        created_at,
        client_id,
        developer_id,
        client_profiles:profiles!conversations_client_id_fkey(full_name),
        developer_profiles:profiles!conversations_developer_id_fkey(full_name)
      `)
      .or(`client_id.eq.${user.id},developer_id.eq.${user.id}`)
      .order('last_message_at', { ascending: false })

    if (data) {
      // Compter les messages non lus pour chaque conversation
      const conversationsWithUnread = await Promise.all(
        data.map(async (conv) => {
          const { count } = await supabase
            .from('messages')
            .select('*', { count: 'exact', head: true })
            .eq('conversation_id', conv.id)
            .eq('is_read', false)
            .neq('sender_id', user.id)

          return {
            ...conv,
            unread_count: count || 0
          }
        })
      )
      setConversations(conversationsWithUnread as any)
    }
  }

  const fetchMessages = async (conversationId: string) => {
    const { data, error } = await supabase
      .from('messages')
      .select(`
        id,
        sender_id,
        content,
        is_read,
        created_at,
        sender_profile:profiles!messages_sender_id_fkey(full_name)
      `)
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true })

    if (data) {
      setMessages(data as any)
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
        setNewMessage('')
        fetchMessages(selectedConversation.id)
        fetchConversations() // Refresh pour mettre à jour last_message_at
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

  return (
    <div className="min-h-screen bg-slate-900">
      <div className="max-w-7xl mx-auto h-screen flex">
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
                        conversation.developer_profiles?.full_name : 
                        conversation.client_profiles?.full_name
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
              {/* Header de la conversation */}
              <div className="p-6 border-b border-slate-700 bg-slate-800/30">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-bold text-white">
                      {userProfile?.user_type === 'client' ? 
                        selectedConversation.developer_profiles?.full_name : 
                        selectedConversation.client_profiles?.full_name
                      }
                    </h2>
                    <p className="text-slate-400 text-sm">{selectedConversation.subject}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-3 py-1 rounded-full text-xs ${
                      selectedConversation.status === 'active' ? 
                        'bg-green-500/20 text-green-400' : 
                        'bg-gray-500/20 text-gray-400'
                    }`}>
                      {selectedConversation.status === 'active' ? 'Active' : 'Fermée'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Messages */}
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

              {/* Zone de saisie */}
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
            /* État vide */
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
