'use client'

import { useState, useEffect } from 'react'
import { CheckCircle, X, User, Briefcase } from 'lucide-react'

interface LoginSuccessPopupProps {
  isVisible: boolean
  userInfo: {
    name: string
    email: string
    userType: 'client' | 'developer'
  }
  onClose: () => void
}

export default function LoginSuccessPopup({ isVisible, userInfo, onClose }: LoginSuccessPopupProps) {
  const [isAnimating, setIsAnimating] = useState(false)

  useEffect(() => {
    if (isVisible) {
      setIsAnimating(true)
      // Auto-fermeture après 4 secondes
      const timer = setTimeout(() => {
        handleClose()
      }, 4000)
      
      return () => clearTimeout(timer)
    }
  }, [isVisible])

  const handleClose = () => {
    setIsAnimating(false)
    setTimeout(() => {
      onClose()
    }, 300) // Délai pour l'animation de sortie
  }

  const getUserTypeInfo = () => {
    if (userInfo.userType === 'client') {
      return {
        icon: <Briefcase className="w-5 h-5" />,
        label: 'Client',
        bgColor: 'bg-black',
        textColor: 'text-black',
        badgeBg: 'bg-gray-100'
      }
    }
    return {
      icon: <User className="w-5 h-5" />,
      label: 'Développeur',
      bgColor: 'bg-black',
      textColor: 'text-black',
      badgeBg: 'bg-gray-100'
    }
  }

  if (!isVisible) return null

  const typeInfo = getUserTypeInfo()

  return (
    <>
      {/* Overlay */}
      <div 
        className={`fixed inset-0 bg-black/50 backdrop-blur-sm z-50 transition-opacity duration-300 ${
          isAnimating ? 'opacity-100' : 'opacity-0'
        }`}
        onClick={handleClose}
      />

      {/* Popup */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div 
          className={`relative bg-white rounded-2xl shadow-2xl border-2 border-gray-200 p-8 w-full max-w-md transform transition-all duration-300 ${
            isAnimating ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
          }`}
        >
          {/* Bouton fermer */}
          <button
            onClick={handleClose}
            className="absolute top-4 right-4 p-1 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-gray-400 hover:text-black" />
          </button>

          {/* Header avec icône de succès */}
          <div className="text-center mb-6">
            <div className="mx-auto w-16 h-16 bg-black rounded-2xl flex items-center justify-center mb-4 shadow-lg">
              <CheckCircle className="w-8 h-8 text-white" />
            </div>
            
            <h2 className="text-2xl font-black text-black mb-2">
              CONNEXION RÉUSSIE !
            </h2>
            
            <p className="text-gray-600 font-medium">
              Bienvenue sur LinkerAI
            </p>
          </div>

          {/* Informations utilisateur */}
          <div className="bg-gray-50 rounded-2xl p-6 mb-6 border-2 border-gray-200">
            <div className="flex items-center space-x-4 mb-4">
              <div className={`p-3 ${typeInfo.bgColor} rounded-2xl text-white`}>
                {typeInfo.icon}
              </div>
              <div>
                <h3 className="font-black text-black text-lg">{userInfo.name || 'Utilisateur'}</h3>
                <p className="text-gray-600 font-medium">{userInfo.email}</p>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-gray-600 font-medium">Type de compte :</span>
              <span className={`inline-flex items-center px-4 py-2 rounded-lg font-black ${typeInfo.badgeBg} ${typeInfo.textColor} border-2 border-gray-300`}>
                {typeInfo.label}
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="space-y-4">
            <button
              onClick={handleClose}
              className="w-full bg-black text-white py-3 px-4 rounded-xl font-black hover:bg-gray-800 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 border-2 border-black"
            >
              <span className="flex items-center justify-center">
                Accéder au tableau de bord
                <span className="ml-2">→</span>
              </span>
            </button>
            
            <p className="text-xs text-gray-500 text-center font-medium">
              Cette notification se fermera automatiquement dans quelques secondes
            </p>
          </div>

          {/* Barre de progression */}
          <div className="mt-6 bg-gray-200 rounded-full h-2 overflow-hidden border border-gray-300">
            <div 
              className="h-full bg-black rounded-full transition-all duration-[4000ms] ease-linear"
              style={{
                width: isAnimating ? '0%' : '100%',
                animation: isAnimating ? 'progress 4s linear forwards' : 'none'
              }}
            />
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes progress {
          from {
            width: 100%;
          }
          to {
            width: 0%;
          }
        }
      `}</style>
    </>
  )
}

// Hook pour utiliser le popup de connexion
export function useLoginSuccessPopup() {
  const [isVisible, setIsVisible] = useState(false)
  const [userInfo, setUserInfo] = useState({
    name: '',
    email: '',
    userType: 'developer' as 'client' | 'developer'
  })

  const showPopup = (userData: typeof userInfo) => {
    setUserInfo(userData)
    setIsVisible(true)
  }

  const hidePopup = () => {
    setIsVisible(false)
  }

  return {
    isVisible,
    userInfo,
    showPopup,
    hidePopup
  }
}
