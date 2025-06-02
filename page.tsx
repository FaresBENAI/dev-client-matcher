import { supabase } from '@/lib/supabase'

export default function Home() {
  // Test des variables d'environnement
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24 space-y-4">
      <h1 className="text-4xl font-bold text-center">
        🚀 Dev-Client Matcher
      </h1>
      
      <div className="bg-gray-100 p-6 rounded-lg max-w-2xl">
        <h2 className="text-xl font-semibold mb-4">Configuration Status</h2>
        
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            {supabaseUrl ? (
              <span className="text-green-600">✅</span>
            ) : (
              <span className="text-red-600">❌</span>
            )}
            <span>Supabase URL: {supabaseUrl ? 'Configured' : 'Missing'}</span>
          </div>
          
          <div className="flex items-center gap-2">
            {supabaseKey ? (
              <span className="text-green-600">✅</span>
            ) : (
              <span className="text-red-600">❌</span>
            )}
            <span>Supabase Key: {supabaseKey ? 'Configured' : 'Missing'}</span>
          </div>
        </div>

        {supabaseUrl && supabaseKey && (
          <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded">
            <p className="text-green-800 font-medium">
              🎉 Supabase is ready to use!
            </p>
          </div>
        )}
      </div>

      <TestSupabaseConnection />
    </main>
  )
}

// Composant pour tester la connexion Supabase
function TestSupabaseConnection() {
  return (
    <div className="bg-blue-50 p-4 rounded-lg">
      <h3 className="font-semibold mb-2">Next Step:</h3>
      <p className="text-sm text-gray-600">
        Run the app to test the Supabase connection
      </p>
    </div>
  )
}
