export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24 space-y-4">
      <h1 className="text-4xl font-bold text-center">
        🚀 Dev-Client Matcher
      </h1>
      
      <div className="bg-gray-100 p-6 rounded-lg max-w-2xl">
        <h2 className="text-xl font-semibold mb-4">Configuration Status</h2>
        
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            {process.env.NEXT_PUBLIC_SUPABASE_URL ? (
              <span className="text-green-600">✅</span>
            ) : (
              <span className="text-red-600">❌</span>
            )}
            <span>
              Supabase URL: {process.env.NEXT_PUBLIC_SUPABASE_URL ? 'Configured' : 'Missing'}
            </span>
          </div>
          
          <div className="flex items-center gap-2">
            {process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? (
              <span className="text-green-600">✅</span>
            ) : (
              <span className="text-red-600">❌</span>
            )}
            <span>
              Supabase Key: {process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'Configured' : 'Missing'}
            </span>
          </div>
        </div>

        {process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY && (
          <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded">
            <p className="text-green-800 font-medium">
              🎉 Supabase is ready to use!
            </p>
          </div>
        )}
      </div>

      <div className="bg-blue-50 p-4 rounded-lg">
        <h3 className="font-semibold mb-2">Next Step:</h3>
        <p className="text-sm text-gray-600">
          Test your Supabase connection
        </p>
      </div>
    </main>
  )
}
