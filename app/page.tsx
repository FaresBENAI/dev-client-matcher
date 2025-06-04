import Link from 'next/link'
import { Button } from '../components/ui/button'

export default function Home() {
  return (
    <div className="min-h-screen bg-slate-900">
      {/* Hero Section avec gradient moderne */}
      <div className="relative overflow-hidden">
        {/* Background gradients */}
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-900 via-purple-900 to-slate-900"></div>
        <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-indigo-500/10 to-cyan-500/10"></div>
        
        {/* Floating elements */}
        <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-purple-500/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyan-500/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-32">
          <div className="text-center">
            <h1 className="text-6xl md:text-7xl font-bold mb-8">
              <span className="text-white">Connectez </span>
              <span className="bg-gradient-to-r from-cyan-400 via-purple-400 to-indigo-400 bg-clip-text text-transparent">
                Développeurs
              </span>
              <br />
              <span className="text-white">& </span>
              <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent">
                Clients
              </span>
            </h1>
            
            <p className="text-xl text-slate-300 mb-12 max-w-4xl mx-auto leading-relaxed">
              La plateforme nouvelle génération pour l'automatisation et l'IA. 
              <br />Trouvez les experts qui transformeront votre business.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
              <Link href="/auth/signup">
                <Button className="bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-600 hover:to-purple-600 text-white font-semibold px-8 py-4 rounded-xl shadow-2xl hover:shadow-cyan-500/25 transition-all duration-300 transform hover:scale-105">
                  🚀 Commencer maintenant
                </Button>
              </Link>
              <Link href="#features">
                <Button 
                  variant="outline" 
                  className="border-2 border-slate-600 text-slate-300 hover:text-white hover:border-cyan-400 hover:bg-slate-800/50 px-8 py-4 rounded-xl backdrop-blur-sm transition-all duration-300"
                >
                  Découvrir la plateforme
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section avec glassmorphism */}
      <div id="features" className="relative bg-slate-50 py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-6">
              Pourquoi nous choisir ?
            </h2>
            <div className="w-24 h-1 bg-gradient-to-r from-cyan-500 to-purple-500 mx-auto mb-6"></div>
            <p className="text-xl text-slate-600 max-w-3xl mx-auto">
              Une expérience révolutionnaire pour connecter talents et opportunités
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Card Client */}
            <div className="group relative bg-white rounded-3xl p-8 shadow-xl hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 border border-slate-200">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-cyan-500/5 rounded-3xl"></div>
              <div className="relative">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                  <span className="text-2xl">👔</span>
                </div>
                <h3 className="text-2xl font-bold text-slate-900 mb-4">Clients</h3>
                <div className="space-y-3">
                  <div className="flex items-center text-slate-600">
                    <div className="w-2 h-2 bg-cyan-500 rounded-full mr-3"></div>
                    <span>Experts IA certifiés</span>
                  </div>
                  <div className="flex items-center text-slate-600">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
                    <span>Automatisation sur mesure</span>
                  </div>
                  <div className="flex items-center text-slate-600">
                    <div className="w-2 h-2 bg-purple-500 rounded-full mr-3"></div>
                    <span>ROI garanti</span>
                  </div>
                  <div className="flex items-center text-slate-600">
                    <div className="w-2 h-2 bg-indigo-500 rounded-full mr-3"></div>
                    <span>Support 24/7</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Card Développeur */}
            <div className="group relative bg-white rounded-3xl p-8 shadow-xl hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 border border-slate-200">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-pink-500/5 rounded-3xl"></div>
              <div className="relative">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                  <span className="text-2xl">💻</span>
                </div>
                <h3 className="text-2xl font-bold text-slate-900 mb-4">Développeurs</h3>
                <div className="space-y-3">
                  <div className="flex items-center text-slate-600">
                    <div className="w-2 h-2 bg-purple-500 rounded-full mr-3"></div>
                    <span>Projets premium</span>
                  </div>
                  <div className="flex items-center text-slate-600">
                    <div className="w-2 h-2 bg-pink-500 rounded-full mr-3"></div>
                    <span>Clients qualifiés</span>
                  </div>
                  <div className="flex items-center text-slate-600">
                    <div className="w-2 h-2 bg-indigo-500 rounded-full mr-3"></div>
                    <span>Paiements sécurisés</span>
                  </div>
                  <div className="flex items-center text-slate-600">
                    <div className="w-2 h-2 bg-cyan-500 rounded-full mr-3"></div>
                    <span>Portfolio valorisé</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Card Technologies */}
            <div className="group relative bg-white rounded-3xl p-8 shadow-xl hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 border border-slate-200">
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-cyan-500/5 rounded-3xl"></div>
              <div className="relative">
                <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-cyan-500 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                  <span className="text-2xl">🤖</span>
                </div>
                <h3 className="text-2xl font-bold text-slate-900 mb-4">Technologies</h3>
                <div className="space-y-3">
                  <div className="flex items-center text-slate-600">
                    <div className="w-2 h-2 bg-indigo-500 rounded-full mr-3"></div>
                    <span>Machine Learning</span>
                  </div>
                  <div className="flex items-center text-slate-600">
                    <div className="w-2 h-2 bg-cyan-500 rounded-full mr-3"></div>
                    <span>RPA & Automatisation</span>
                  </div>
                  <div className="flex items-center text-slate-600">
                    <div className="w-2 h-2 bg-purple-500 rounded-full mr-3"></div>
                    <span>IA Conversationnelle</span>
                  </div>
                  <div className="flex items-center text-slate-600">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
                    <span>Data Science</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section avec design futuriste */}
      <div className="relative bg-slate-900 py-24 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-900/50 to-purple-900/50"></div>
        <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-full h-full">
          <div className="w-full h-full bg-gradient-to-b from-transparent via-cyan-500/5 to-transparent"></div>
        </div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="bg-slate-800/50 backdrop-blur-xl rounded-3xl p-12 border border-slate-700/50">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              <span className="text-white">Prêt à </span>
              <span className="bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
                révolutionner
              </span>
              <span className="text-white"> votre business ?</span>
            </h2>
            <p className="text-xl text-slate-300 mb-10 max-w-3xl mx-auto">
              Rejoignez l'écosystème le plus innovant de développeurs IA et d'entrepreneurs visionnaires
            </p>
            <Link href="/auth/signup">
              <Button className="bg-gradient-to-r from-cyan-500 via-purple-500 to-indigo-500 hover:from-cyan-600 hover:via-purple-600 hover:to-indigo-600 text-white font-bold px-12 py-4 rounded-2xl shadow-2xl hover:shadow-purple-500/25 transition-all duration-300 transform hover:scale-105">
                🎯 Démarrer gratuitement
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
