'use client';

import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Clock, Play, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

interface StatusBarProps {
  applicationId: string;
  currentStatus: string;
  projectClientId: string;
  isCreator: boolean;
  onStatusUpdate?: (newStatus: string) => void;
}

type StatusType = 'en_attente' | 'en_developpement' | 'rejete' | 'projet_termine';

const statusConfig = {
  en_attente: {
    label: 'En attente',
    color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    icon: Clock,
    description: 'Candidature en cours d\'examen'
  },
  en_developpement: {
    label: 'En développement',
    color: 'bg-blue-100 text-blue-800 border-blue-200',
    icon: Play,
    description: 'Projet en cours de développement'
  },
  rejete: {
    label: 'Rejeté',
    color: 'bg-red-100 text-red-800 border-red-200',
    icon: XCircle,
    description: 'Candidature non retenue'
  },
  projet_termine: {
    label: 'Projet terminé',
    color: 'bg-green-100 text-green-800 border-green-200',
    icon: CheckCircle,
    description: 'Projet livré avec succès'
  }
};

export default function StatusBar({ 
  applicationId, 
  currentStatus, 
  projectClientId, 
  isCreator,
  onStatusUpdate 
}: StatusBarProps) {
  const [status, setStatus] = useState<StatusType>(currentStatus as StatusType);
  const [isUpdating, setIsUpdating] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const supabase = createClientComponentClient();

  const config = statusConfig[status] || statusConfig.en_attente;
  const StatusIcon = config.icon;

  const handleStatusChange = async (newStatus: StatusType) => {
    if (!isCreator || isUpdating) return;

    setIsUpdating(true);
    try {
      const { error } = await supabase
        .from('project_applications')
        .update({ 
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', applicationId);

      if (error) {
        console.error('Erreur lors de la mise à jour du statut:', error);
        alert('Erreur lors de la mise à jour du statut');
        return;
      }

      setStatus(newStatus);
      setShowDropdown(false);
      onStatusUpdate?.(newStatus);
      
    } catch (error) {
      console.error('Erreur:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  const getNextStatus = (currentStatus: StatusType): StatusType | null => {
    switch (currentStatus) {
      case 'en_attente':
        return 'en_developpement';
      case 'en_developpement':
        return 'projet_termine';
      default:
        return null;
    }
  };

  const getStatusProgress = (status: StatusType): number => {
    switch (status) {
      case 'en_attente': return 25;
      case 'en_developpement': return 75;
      case 'rejete': return 0;
      case 'projet_termine': return 100;
      default: return 0;
    }
  };

  const getProgressColor = (status: StatusType): string => {
    switch (status) {
      case 'en_attente': return 'bg-yellow-500';
      case 'en_developpement': return 'bg-blue-500';
      case 'rejete': return 'bg-red-500';
      case 'projet_termine': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className="bg-white border-b border-gray-200 p-4 sticky top-0 z-10">
      <div className="flex items-center justify-between">
        {/* Statut actuel */}
        <div className="flex items-center space-x-3">
          <div className={`flex items-center space-x-2 px-3 py-1.5 rounded-full border ${config.color}`}>
            <StatusIcon className="w-4 h-4" />
            <span className="font-medium text-sm">{config.label}</span>
          </div>
          <p className="text-sm text-gray-600">{config.description}</p>
        </div>

        {/* Actions pour le créateur */}
        {isCreator && (
          <div className="relative">
            <button
              onClick={() => setShowDropdown(!showDropdown)}
              disabled={isUpdating}
              className="bg-black text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              {isUpdating ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Mise à jour...</span>
                </>
              ) : (
                <span>Modifier le statut</span>
              )}
            </button>

            {/* Dropdown des statuts */}
            {showDropdown && !isUpdating && (
              <div className="absolute right-0 mt-2 w-56 bg-white border border-gray-200 rounded-lg shadow-lg z-20">
                <div className="py-2">
                  {Object.entries(statusConfig).map(([key, config]) => {
                    const StatusIcon = config.icon;
                    const isCurrentStatus = key === status;
                    
                    return (
                      <button
                        key={key}
                        onClick={() => handleStatusChange(key as StatusType)}
                        disabled={isCurrentStatus}
                        className={`w-full text-left px-4 py-3 hover:bg-gray-50 flex items-center space-x-3 ${
                          isCurrentStatus ? 'bg-gray-50 cursor-not-allowed' : ''
                        }`}
                      >
                        <StatusIcon className={`w-4 h-4 ${
                          isCurrentStatus ? 'text-gray-400' : 'text-gray-600'
                        }`} />
                        <div>
                          <div className={`font-medium text-sm ${
                            isCurrentStatus ? 'text-gray-400' : 'text-gray-900'
                          }`}>
                            {config.label}
                            {isCurrentStatus && <span className="ml-2 text-xs">(Actuel)</span>}
                          </div>
                          <div className="text-xs text-gray-500">{config.description}</div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Barre de progression */}
      <div className="mt-3">
        <div className="flex justify-between text-xs text-gray-500 mb-1">
          <span>Progression du projet</span>
          <span>{getStatusProgress(status)}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className={`h-2 rounded-full transition-all duration-300 ${getProgressColor(status)}`}
            style={{ width: `${getStatusProgress(status)}%` }}
          ></div>
        </div>
      </div>

      {/* Fermeture du dropdown en cliquant à l'extérieur */}
      {showDropdown && (
        <div 
          className="fixed inset-0 z-10" 
          onClick={() => setShowDropdown(false)}
        ></div>
      )}
    </div>
  );
}
