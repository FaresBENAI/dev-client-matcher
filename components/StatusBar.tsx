'use client';

import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Clock, Play, CheckCircle, XCircle, AlertCircle, MessageSquare, Star } from 'lucide-react';

interface StatusBarProps {
  applicationId: string;
  currentStatus: string;
  projectClientId: string;
  developerId: string;
  conversationId?: string;
  isCreator: boolean;
  onStatusUpdate?: (newStatus: string) => void;
  showRatingButton?: boolean;
  onRatingClick?: () => void;
}

type StatusType = 'pending' | 'accepted' | 'rejected';

const statusConfig = {
  pending: {
    label: 'En attente',
    color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    icon: Clock,
    description: 'Candidature en cours d\'examen'
  },
  accepted: {
    label: 'Acceptée',
    color: 'bg-green-100 text-green-800 border-green-200',
    icon: CheckCircle,
    description: 'Candidature acceptée'
  },
  rejected: {
    label: 'Refusée',
    color: 'bg-red-100 text-red-800 border-red-200',
    icon: XCircle,
    description: 'Candidature non retenue'
  }
};

export default function StatusBar({ 
  applicationId, 
  currentStatus, 
  projectClientId, 
  developerId,
  conversationId,
  isCreator,
  onStatusUpdate,
  showRatingButton = false,
  onRatingClick
}: StatusBarProps) {
  const [status, setStatus] = useState<StatusType>(currentStatus as StatusType);
  const [isUpdating, setIsUpdating] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const supabase = createClientComponentClient();

  const config = statusConfig[status] || statusConfig.pending;
  const StatusIcon = config.icon;

  const sendStatusNotification = async (newStatus: StatusType, oldStatus: StatusType) => {
    if (!conversationId) return;

    try {
      let notificationMessage = '';
      
      switch (newStatus) {
        case 'accepted':
          notificationMessage = '🎉 **Candidature acceptée !**\n\nFélicitations ! Votre candidature a été acceptée. Le projet peut maintenant commencer.';
          break;
        case 'rejected':
          notificationMessage = '❌ **Candidature refusée**\n\nMalheureusement, votre candidature n\'a pas été retenue pour ce projet.';
          break;
        default:
          return;
      }

      // Envoyer une notification automatique dans la conversation
      const { error } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversationId,
          sender_id: projectClientId, // Le client envoie la notification
          content: notificationMessage,
          is_read: false,
          created_at: new Date().toISOString()
        });

      if (!error) {
        // Mettre à jour la conversation
        await supabase
          .from('conversations')
          .update({ 
            last_message_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('id', conversationId);
      }
    } catch (error) {
      console.error('Erreur lors de l\'envoi de la notification:', error);
    }
  };

  const handleStatusChange = async (newStatus: StatusType) => {
    if (!isCreator || isUpdating) return;

    const oldStatus = status;
    setIsUpdating(true);
    
    try {
      // Mettre à jour le statut dans project_applications
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

      // Envoyer une notification dans la conversation
      await sendStatusNotification(newStatus, oldStatus);
      
      console.log(`✅ Statut mis à jour: ${oldStatus} → ${newStatus}`);
      
    } catch (error) {
      console.error('Erreur:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  const getStatusProgress = (status: StatusType): number => {
    switch (status) {
      case 'pending': return 25;
      case 'accepted': return 75;
      case 'rejected': return 0;
      default: return 0;
    }
  };

  const getProgressColor = (status: StatusType): string => {
    switch (status) {
      case 'pending': return 'bg-yellow-500';
      case 'accepted': return 'bg-green-500';
      case 'rejected': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getNextStatus = (currentStatus: StatusType): StatusType | null => {
    switch (currentStatus) {
      case 'pending':
        return 'accepted';
      default:
        return null;
    }
  };

  return (
    <div className="bg-white border-b border-gray-200 p-4 sticky top-0 z-10">
      <div className="flex items-center justify-between">
        {/* Nom du développeur et barre de progression */}
        <div className="flex items-center space-x-4 flex-1">
          {/* Barre de progression */}
          <div className="flex items-center space-x-2 flex-1 max-w-xs">
            <div className="flex-1 bg-gray-200 rounded-full h-2">
              <div 
                className={`h-2 rounded-full transition-all duration-300 ${getProgressColor(status)}`}
                style={{ width: `${getStatusProgress(status)}%` }}
              ></div>
            </div>
            <span className="text-xs text-gray-500 font-medium">{getStatusProgress(status)}%</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center space-x-3">
          {/* Bouton Noter - uniquement pour clients qui parlent à des développeurs */}
          {showRatingButton && onRatingClick && (
            <button 
              onClick={onRatingClick}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Star className="h-4 w-4 mr-2" />
              Noter
            </button>
          )}

          {/* Actions pour le créateur (client) */}
          {isCreator && (
            <div className="relative">
              <button
                onClick={() => setShowDropdown(!showDropdown)}
                disabled={isUpdating}
                className="bg-gray-100 text-gray-700 px-3 py-2 rounded-lg text-sm font-medium hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                {isUpdating ? (
                  <>
                    <div className="w-4 h-4 border-2 border-gray-600 border-t-transparent rounded-full animate-spin"></div>
                    <span>Mise à jour...</span>
                  </>
                ) : (
                  <>
                    <StatusIcon className="w-4 h-4" />
                    <span>{config.label}</span>
                  </>
                )}
              </button>

              {/* Dropdown des statuts */}
              {showDropdown && !isUpdating && (
                <div className="absolute right-0 mt-2 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-20">
                  <div className="py-2">
                    <div className="px-4 py-2 text-xs text-gray-500 font-medium border-b border-gray-100">
                      Changer le statut de la candidature
                    </div>
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
                  <div className="px-4 py-2 text-xs text-gray-500 border-t border-gray-100">
                    💡 Le développeur sera automatiquement notifié du changement
                  </div>
                </div>
              )}
            </div>
          )}
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
