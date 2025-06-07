'use client'

import { useState } from 'react'
import { createClient } from '@supabase/supabase-js'
import { Button } from '../ui/button'
import { Input } from '../ui/input'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

interface ContactDeveloperModalProps {
  developer: {
    id: string
    profiles: { full_name: string }
    title: string
  }
  isOpen: boolean
  onClose: () => void
  projectId?: string
}

export default function ContactDeveloperModal({ 
  developer, 
  isOpen, 
  onClose, 
  projectId 
}: ContactDeveloperModalProps) {
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setError('Vous devez être connecté')
        return
      }

      // Créer ou récupérer la conversation
      const { data: existingConversation } = await supabase
        .from('conversations')
        .select('id')
        .eq('client_id', user.id)
        .eq('developer_id', developer.id)
        .eq('project_id', projectId || null)
        .single()

      let conversationId = existingConversation?.id

      if (!conversationId) {
        // Créer nouvelle conversation
        const { data: newConversation, error: convError } = await supabase
          .from('conversations')
          .insert({
            client_id: user.id,
            developer_id: developer.id,
            project_id: projectId || null,
            subject: subject || `Contact concernant ${developer.profiles.full_name}`
          })
          .select('id')
          .single()

        if (convError) {
          setError('Erreur lors de la création de la conversation')
          return
        }
        conversationId = newConversation.id
      }

      // Envoyer le message
      const { error: messageError } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversationId,
          sender_id: user.id,
          content: message
        })

      if (messageError) {
        setError('Erreur lors de l\'envoi du message')
        return
      }

      // Succès
      alert('Message envoyé avec succès!')
      onClose()
      setSubject('')
      setMessage('')
    } catch (err) {
      setError('Une erreur est survenue')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 rounded-2xl p-6 max-w-md w-full border border-slate-700">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold text-white">
            Contacter {developer.profiles.full_name}
          </h3>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors"
          >
            ✕
          </button>
        </div>

        <div className="mb-4 p-3 bg-slate-700/50 rounded-lg border border-slate-600">
          <p className="text-slate-300 text-sm">
            <strong>Développeur :</strong> {developer.profiles.full_name}
          </p>
          <p className="text-slate-400 text-sm">{developer.title}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Sujet (optionnel)
            </label>
            <Input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Sujet de votre message"
              className="bg-slate-700/50 border-slate-600 text-white placeholder-slate-400"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Message *
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Bonjour, je suis intéressé par vos services pour..."
              required
              rows={4}
              className="w-full bg-slate-700/50 border border-slate-600 rounded-md px-3 py-2 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500"
            />
          </div>

          {error && (
            <div className="bg-red-500/20 border border-red-500/50 text-red-400 px-4 py-3 rounded-md text-sm">
              {error}
            </div>
          )}

          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1 border-slate-600 text-slate-300 hover:border-slate-500"
            >
              Annuler
            </Button>
            <Button
              type="submit"
              disabled={loading || !message.trim()}
              className="flex-1 bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-600 hover:to-purple-600"
            >
              {loading ? 'Envoi...' : 'Envoyer'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
