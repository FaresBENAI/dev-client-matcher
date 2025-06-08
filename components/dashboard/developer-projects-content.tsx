'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Button } from '../ui/button'
import Link from 'next/link'

export default function DeveloperProjectsContent() {
  const [debugInfo, setDebugInfo] = useState('Chargement...')
  const [rawData, setRawData] = useState<any>(null)

  useEffect(() => {
    const testConnection = async () => {
      try {
        // Test 1: Connection Supabase
        setDebugInfo('Test 1: Connexion Supabase...')
        
        // Test 2: Récupérer l'utilisateur
        const { data: { user }, error: userError } = await supabase.auth.getUser()
        if (userError) {
          setDebugInfo(`Erreur user: ${userError.message}`)
          return
        }
        setDebugInfo(`User OK: ${user?.email}`)

        // Test 3: Test une requête simple
        const { data, error, count } = await supabase
          .from('projects')
          .select('*', { count: 'exact' })

        if (error) {
          setDebugInfo(`Erreur projects: ${error.message}`)
          return
        }

        setDebugInfo(`Succès! ${count} projets trouvés`)
        setRawData(data)

      } catch (err) {
        setDebugInfo(`Erreur catch: ${JSON.stringify(err)}`)
      }
    }

    testConnection()
  }, [])

  return (
    <div className="min-h-screen bg-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl p-6 border border-slate-700/50">
          <h1 className="text-3xl font-bold text-white mb-4">🔧 Test Debug</h1>
          
          <div className="bg-yellow-500/10 p-4 rounded mb-4">
cat > components/dashboard/developer-projects-content.tsx << 'EOF'
'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Button } from '../ui/button'
import Link from 'next/link'

export default function DeveloperProjectsContent() {
  const [debugInfo, setDebugInfo] = useState('Chargement...')
  const [rawData, setRawData] = useState<any>(null)

  useEffect(() => {
    const testConnection = async () => {
      try {
        // Test 1: Connection Supabase
        setDebugInfo('Test 1: Connexion Supabase...')
        
        // Test 2: Récupérer l'utilisateur
        const { data: { user }, error: userError } = await supabase.auth.getUser()
        if (userError) {
          setDebugInfo(`Erreur user: ${userError.message}`)
          return
        }
        setDebugInfo(`User OK: ${user?.email}`)

        // Test 3: Test une requête simple
        const { data, error, count } = await supabase
          .from('projects')
          .select('*', { count: 'exact' })

        if (error) {
          setDebugInfo(`Erreur projects: ${error.message}`)
          return
        }

        setDebugInfo(`Succès! ${count} projets trouvés`)
        setRawData(data)

      } catch (err) {
        setDebugInfo(`Erreur catch: ${JSON.stringify(err)}`)
      }
    }

    testConnection()
  }, [])

  return (
    <div className="min-h-screen bg-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl p-6 border border-slate-700/50">
          <h1 className="text-3xl font-bold text-white mb-4">🔧 Test Debug</h1>
          
          <div className="bg-yellow-500/10 p-4 rounded mb-4">
            <p className="text-yellow-400 font-mono text-sm">{debugInfo}</p>
          </div>

          {rawData && (
            <div className="bg-blue-500/10 p-4 rounded">
              <h3 className="text-blue-400 font-semibold mb-2">Données brutes:</h3>
              <pre className="text-blue-300 text-xs overflow-auto">
                {JSON.stringify(rawData, null, 2)}
              </pre>
            </div>
          )}

          <Link href="/dashboard/developer">
            <Button className="mt-4">← Retour</Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
