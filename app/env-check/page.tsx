'use client';

export default function EnvCheck() {
  return (
    <div className="min-h-screen bg-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Environment Variables Check</h1>
        
        <div className="grid gap-4">
          <div className="bg-gray-100 p-4 rounded">
            <h2 className="font-bold">NEXT_PUBLIC_SUPABASE_URL</h2>
            <p className={`font-mono ${process.env.NEXT_PUBLIC_SUPABASE_URL ? 'text-green-600' : 'text-red-600'}`}>
              {process.env.NEXT_PUBLIC_SUPABASE_URL ? 'Configured ✅' : 'Missing ❌'}
            </p>
            {process.env.NEXT_PUBLIC_SUPABASE_URL && (
              <p className="text-sm text-gray-600 truncate">
                {process.env.NEXT_PUBLIC_SUPABASE_URL}
              </p>
            )}
          </div>

          <div className="bg-gray-100 p-4 rounded">
            <h2 className="font-bold">NEXT_PUBLIC_SUPABASE_ANON_KEY</h2>
            <p className={`font-mono ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'text-green-600' : 'text-red-600'}`}>
              {process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'Configured ✅' : 'Missing ❌'}
            </p>
            {process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY && (
              <p className="text-sm text-gray-600 truncate">
                {process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.substring(0, 20)}...
              </p>
            )}
          </div>

          <div className="bg-gray-100 p-4 rounded">
            <h2 className="font-bold">NEXT_PUBLIC_SITE_URL</h2>
            <p className={`font-mono ${process.env.NEXT_PUBLIC_SITE_URL ? 'text-green-600' : 'text-red-600'}`}>
              {process.env.NEXT_PUBLIC_SITE_URL ? 'Configured ✅' : 'Missing ❌'}
            </p>
            {process.env.NEXT_PUBLIC_SITE_URL && (
              <p className="text-sm text-gray-600">
                {process.env.NEXT_PUBLIC_SITE_URL}
              </p>
            )}
          </div>

          <div className="bg-gray-100 p-4 rounded">
            <h2 className="font-bold">NEXT_PUBLIC_APP_URL</h2>
            <p className={`font-mono ${process.env.NEXT_PUBLIC_APP_URL ? 'text-green-600' : 'text-red-600'}`}>
              {process.env.NEXT_PUBLIC_APP_URL ? 'Configured ✅' : 'Missing ❌'}
            </p>
            {process.env.NEXT_PUBLIC_APP_URL && (
              <p className="text-sm text-gray-600">
                {process.env.NEXT_PUBLIC_APP_URL}
              </p>
            )}
          </div>
        </div>

        <div className="mt-8 p-4 bg-blue-100 rounded">
          <h2 className="font-bold">Status</h2>
          <p>
            {process.env.NEXT_PUBLIC_SUPABASE_URL && 
             process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY && 
             process.env.NEXT_PUBLIC_SITE_URL && 
             process.env.NEXT_PUBLIC_APP_URL
              ? '✅ All environment variables are configured!'
              : '❌ Some environment variables are missing. Please check Netlify configuration.'}
          </p>
        </div>
      </div>
    </div>
  );
} 