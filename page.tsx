import Link from 'next/link'

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16">
          <div className="text-center">
            <div className="bg-black text-white w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-2xl">
              <span className="text-3xl font-black">L</span>
            </div>
            
            <h1 className="text-6xl font-black text-white mb-6">
              LinkerAI
            </h1>
            
            <p className="text-xl text-gray-300 mb-8 max-w-3xl mx-auto leading-relaxed">
              La plateforme qui connecte les clients avec les meilleurs développeurs freelance. 
              Trouvez le talent parfait pour votre projet en quelques clics.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/projects">
                <button className="bg-white text-black px-8 py-4 rounded-lg font-bold text-lg hover:bg-gray-100 transition-colors">
                  Voir les projets
                </button>
              </Link>
              <Link href="/developers">
                <button className="border-2 border-white text-white px-8 py-4 rounded-lg font-bold text-lg hover:bg-white hover:text-black transition-colors">
                  Trouver un développeur
                </button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="bg-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-black text-black mb-4">
              Pourquoi choisir LinkerAI ?
            </h2>
            <p className="text-xl text-gray-600">
              Une plateforme moderne pour des collaborations réussies
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center p-6">
              <div className="bg-black text-white w-16 h-16 rounded-xl flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🚀</span>
              </div>
              <h3 className="text-xl font-bold mb-3">Projets variés</h3>
              <p className="text-gray-600">
                De l'automatisation à l'IA, trouvez des projets passionnants qui correspondent à vos compétences.
              </p>
            </div>
            
            <div className="text-center p-6">
              <div className="bg-black text-white w-16 h-16 rounded-xl flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">👥</span>
              </div>
              <h3 className="text-xl font-bold mb-3">Communauté experte</h3>
              <p className="text-gray-600">
                Rejoignez une communauté de développeurs talentueux et de clients ambitieux.
              </p>
            </div>
            
            <div className="text-center p-6">
              <div className="bg-black text-white w-16 h-16 rounded-xl flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">💼</span>
              </div>
              <h3 className="text-xl font-bold mb-3">Interface moderne</h3>
              <p className="text-gray-600">
                Une plateforme intuitive avec système de messagerie intégré et gestion de projets simplifiée.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-black py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-black text-white mb-6">
            Prêt à commencer ?
          </h2>
          <p className="text-xl text-gray-300 mb-8">
            Créez votre compte et rejoignez la communauté LinkerAI dès aujourd'hui
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/auth/signup">
              <button className="bg-white text-black px-8 py-4 rounded-lg font-bold text-lg hover:bg-gray-100 transition-colors">
                S'inscrire gratuitement
              </button>
            </Link>
            <Link href="/auth/login">
              <button className="border-2 border-white text-white px-8 py-4 rounded-lg font-bold text-lg hover:bg-white hover:text-black transition-colors">
                Se connecter
              </button>
            </Link>
          </div>
        </div>
      </div>
    </main>
  )
}
