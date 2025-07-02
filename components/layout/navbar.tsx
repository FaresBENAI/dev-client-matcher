import Link from 'next/link'

export default function Navbar() {
  return (
    <nav className="bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center">
                <span className="text-white font-black text-sm">L</span>
              </div>
              <span className="text-xl font-black text-black">LinkerAI</span>
            </Link>
          </div>

          {/* Menu principal */}
          <div className="hidden md:flex items-center space-x-8">
            <Link href="/" className="text-gray-600 hover:text-black font-medium">
              Accueil
            </Link>
            <Link href="/projects" className="text-gray-600 hover:text-black font-medium">
              Projets
            </Link>
            <Link href="/developers" className="text-gray-600 hover:text-black font-medium">
              Développeurs
            </Link>
          </div>

          {/* Boutons d'action */}
          <div className="flex items-center space-x-4">
            <Link href="/auth/login" className="text-gray-600 hover:text-black font-medium">
              Connexion
            </Link>
            <Link href="/auth/signup" className="bg-black text-white px-4 py-2 rounded-lg font-bold hover:bg-gray-800">
              S'inscrire
            </Link>
          </div>
        </div>
      </div>
    </nav>
  )
}
