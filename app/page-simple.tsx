import Link from 'next/link'

export default function HomePage() {
  return (
    <main className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 py-16">
        <div className="text-center">
          <h1 className="text-5xl font-bold mb-4">LinkerAI</h1>
          <p className="text-xl text-gray-600 mb-8">
            Connectez-vous avec les meilleurs développeurs
          </p>
          
          <div className="flex justify-center gap-4">
            <Link href="/auth/login">
              <button className="bg-black text-white px-6 py-3 rounded-lg hover:bg-gray-800">
                Connexion
              </button>
            </Link>
            <Link href="/auth/signup">
              <button className="border-2 border-black text-black px-6 py-3 rounded-lg hover:bg-black hover:text-white">
                Inscription
              </button>
            </Link>
          </div>
          
          <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link href="/projects" className="p-6 border rounded-lg hover:shadow-lg">
              <h2 className="text-xl font-bold mb-2">Projets</h2>
              <p className="text-gray-600">Découvrez les projets disponibles</p>
            </Link>
            
            <Link href="/developers" className="p-6 border rounded-lg hover:shadow-lg">
              <h2 className="text-xl font-bold mb-2">Développeurs</h2>
              <p className="text-gray-600">Trouvez le développeur idéal</p>
            </Link>
            
            <Link href="/test" className="p-6 border rounded-lg hover:shadow-lg">
              <h2 className="text-xl font-bold mb-2">Test</h2>
              <p className="text-gray-600">Page de test</p>
            </Link>
          </div>
        </div>
      </div>
    </main>
  )
}
