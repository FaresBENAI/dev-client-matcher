'use client';

import { useState, useEffect } from 'react';
import { X, Clock, Info, CheckCircle2 } from 'lucide-react';

interface InfoPopupProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  message: string;
  type?: 'info' | 'processing' | 'success';
  autoCloseDelay?: number; // En millisecondes, 0 = pas d'auto-fermeture
}

export default function InfoPopup({ 
  isOpen, 
  onClose, 
  title, 
  message, 
  type = 'info',
  autoCloseDelay = 0 
}: InfoPopupProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
      
      // Auto-fermeture si configurée
      if (autoCloseDelay > 0) {
        const timer = setTimeout(() => {
          handleClose();
        }, autoCloseDelay);
        
        return () => clearTimeout(timer);
      }
    } else {
      setIsVisible(false);
    }
  }, [isOpen, autoCloseDelay]);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(() => {
      onClose();
    }, 200); // Délai pour l'animation de fermeture
  };

  if (!isOpen) return null;

  const getIcon = () => {
    switch (type) {
      case 'processing':
        return <Clock className="w-6 h-6" />;
      case 'success':
        return <CheckCircle2 className="w-6 h-6" />;
      default:
        return <Info className="w-6 h-6" />;
    }
  };

  const getIconColor = () => {
    switch (type) {
      case 'processing':
        return 'text-blue-600';
      case 'success':
        return 'text-green-600';
      default:
        return 'text-gray-600';
    }
  };

  const getHeaderColor = () => {
    switch (type) {
      case 'processing':
        return 'bg-blue-50 border-blue-200';
      case 'success':
        return 'bg-green-50 border-green-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div 
        className={`bg-white rounded-2xl max-w-md w-full shadow-2xl transform transition-all duration-200 ${
          isVisible ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
        }`}
      >
        {/* Header noir LinkerAI */}
        <div className="bg-black text-white p-6 rounded-t-2xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-white text-black w-10 h-10 rounded-xl flex items-center justify-center">
              <span className="text-lg font-black">L</span>
            </div>
            <div>
              <h3 className="text-lg font-black">{title}</h3>
              <p className="text-gray-300 text-sm">LinkerAI Platform</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-300 hover:text-white transition-colors p-1"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Contenu */}
        <div className="p-6">
          <div className={`flex items-start gap-4 p-4 rounded-lg ${getHeaderColor()}`}>
            <div className={`flex-shrink-0 ${getIconColor()}`}>
              {getIcon()}
            </div>
            <div className="flex-1">
              <p className="text-gray-800 leading-relaxed">
                {message}
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 mt-6">
            <button
              onClick={handleClose}
              className="px-6 py-3 border-2 border-gray-200 text-gray-700 font-bold rounded-lg hover:border-black hover:text-black transition-all duration-300"
            >
              Compris
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 