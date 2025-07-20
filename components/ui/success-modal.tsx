import React from 'react'
import { X, CheckCircle, Mail } from 'lucide-react'

interface SuccessModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  message: string
  emailConfirmed?: boolean
}

const SuccessModal: React.FC<SuccessModalProps> = ({
  isOpen,
  onClose,
  title,
  message,
  emailConfirmed = false
}) => {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Overlay */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-white rounded-lg shadow-2xl max-w-md w-full mx-4 border-2 border-gray-200">
        {/* Header avec fond noir LinkerAI */}
        <div className="bg-black text-white px-6 py-4 rounded-t-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <CheckCircle className="w-6 h-6 text-green-400" />
              <h3 className="text-lg font-bold">{title}</h3>
            </div>
            <button
              onClick={onClose}
              className="text-gray-300 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Contenu */}
        <div className="px-6 py-6">
          <div className="text-center">
            {/* Icône de succès */}
            <div className="mx-auto flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>

            {/* Message principal */}
            <p className="text-gray-700 text-base mb-4 leading-relaxed">
              {message}
            </p>

            {/* Section email si pas confirmé */}
            {!emailConfirmed && (
              <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4 mb-4">
                <div className="flex items-center justify-center space-x-2 mb-2">
                  <Mail className="w-5 h-5 text-blue-600" />
                  <span className="text-blue-800 font-medium">Email de confirmation envoyé</span>
                </div>
                <p className="text-blue-700 text-sm">
                  Vérifiez votre boîte de réception et cliquez sur le lien de confirmation 
                  pour activer votre compte.
                </p>
              </div>
            )}

            {/* Informations supplémentaires */}
            <div className="bg-gray-50 border-2 border-gray-200 rounded-lg p-4 mb-6">
              <h4 className="font-bold text-gray-800 mb-2">Prochaines étapes :</h4>
              <ul className="text-sm text-gray-600 text-left space-y-1">
                {!emailConfirmed && (
                  <li>• Confirmez votre email via le lien reçu</li>
                )}
                <li>• Connectez-vous à votre compte</li>
                <li>• Complétez votre profil si nécessaire</li>
                <li>• Commencez à utiliser LinkerAI !</li>
              </ul>
            </div>

            {/* Boutons d'action */}
            <div className="flex space-x-3">
              <button
                onClick={onClose}
                className="flex-1 bg-white border-2 border-black text-black font-bold py-3 px-4 rounded-lg hover:bg-black hover:text-white transition-colors"
              >
                Fermer
              </button>
              <button
                onClick={() => {
                  onClose()
                  window.location.href = '/auth/login'
                }}
                className="flex-1 bg-black text-white font-bold py-3 px-4 rounded-lg hover:bg-gray-800 transition-colors"
              >
                Se connecter
              </button>
            </div>
          </div>
        </div>

        {/* Footer avec branding LinkerAI */}
        <div className="bg-gray-100 px-6 py-3 rounded-b-lg border-t-2 border-gray-200">
          <p className="text-center text-xs text-gray-500">
            <span className="font-bold text-black">LinkerAI</span> - Connectons vos projets aux meilleurs développeurs
          </p>
        </div>
      </div>
    </div>
  )
}

export default SuccessModal 