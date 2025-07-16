'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function TestSupabase() {
  const [status, setStatus] = useState('Testing...')
  
  useEffect(() => {
    async function testConnection() {
      try {
        const { data, error } = await supabase.auth.getSession()
        if (error) throw error
        setStatus('✅ Supabase connecté! Session: ' + (data.session ? 'Active' : 'Aucune'))
      } catch (error: any) {
        setStatus('❌ Erreur: ' + error.message)
      }
    }
    testConnection()
  }, [])
  
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Test Supabase</h1>
      <p>{status}</p>
      <a href="/" className="text-blue-500 underline mt-4 block">Retour</a>
    </div>
  )
}
