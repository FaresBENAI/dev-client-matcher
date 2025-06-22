'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

export default function DeveloperDashboardContent() {
  const router = useRouter();
  const supabase = createClientComponentClient();
  const [sessionStatus, setSessionStatus] = useState<string>('Vérification...');
  const [debugInfo, setDebugInfo] = useState<any>(null);

  const fixAndTestSession = async () => {
    try {
      setSessionStatus('🔧 Correction de la session...');
      
      // Étape 1: Nettoyer le localStorage
      console.log('🧹 Nettoyage localStorage...');
      Object.keys(localStorage).forEach(key => {
        if (key.includes('supabase')) {
          localStorage.removeItem(key);
          console.log('🗑️ Supprimé:', key);
        }
      });

      // Étape 2: Rafraîchir la session
      console.log('🔄 Rafraîchissement session...');
      const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
      console.log('🔄 Refresh result:', refreshData, refreshError);

      // Étape 3: Nouvelle tentative getSession
      console.log('🔍 Nouvelle vérification...');
      const { data: { session }, error } = await supabase.auth.getSession();
      console.log('🔑 Session après fix:', session, error);

      if (session && session.user) {
        setSessionStatus('✅ Session restaurée !');
        setDebugInfo({
          success: true,
          userId: session.user.id,
          email: session.user.email,
          sessionInfo: {
            access_token: session.access_token?.substring(0, 50) + '...',
            refresh_token: session.refresh_token?.substring(0, 50) + '...',
            expires_at: session.expires_at
          }
        });
      } else {
        setSessionStatus('❌ Session non récupérable - reconnexion nécessaire');
        setDebugInfo({
          success: false,
          refreshData,
          refreshError,
          sessionData: session,
          sessionError: error
        });
      }

    } catch (error) {
      console.error('💥 Erreur fix session:', error);
      setSessionStatus('💥 Erreur lors de la correction');
      setDebugInfo({ error: error.message });
    }
  };

  // Test immédiat au chargement
  useEffect(() => {
    fixAndTestSession();
  }, []);

  return (
    <div className="min-h-screen bg-white p-8">
      <h1 className="text-4xl font-black mb-8">🔧 FIX SESSION SUPABASE</h1>
      
      <div className="bg-blue-50 border-2 border-blue-200 p-6 mb-8">
        <h2 className="font-black text-xl mb-4">📊 STATUT SESSION</h2>
        <p className="text-lg font-bold">{sessionStatus}</p>
      </div>

      <div className="bg-red-50 border-2 border-red-200 p-6 mb-8">
        <h2 className="font-black text-xl mb-4">🐛 DEBUG DÉTAILLÉ</h2>
        <pre className="text-xs bg-white p-4 rounded border overflow-auto max-h-96">
          {debugInfo ? JSON.stringify(debugInfo, null, 2) : 'Chargement...'}
        </pre>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <button
          onClick={fixAndTestSession}
          className="bg-black text-white p-4 font-black hover:bg-gray-800"
        >
          🔄 Retester la Session
        </button>
        
        <button
          onClick={() => {
            localStorage.clear();
            window.location.href = '/auth/login';
          }}
          className="bg-red-600 text-white p-4 font-black hover:bg-red-700"
        >
          🚨 Reset Complet + Login
        </button>
        
        <button
          onClick={() => window.location.href = '/dashboard/developer/applications'}
          className="bg-green-600 text-white p-4 font-black hover:bg-green-700"
        >
          ✅ Aller aux Applications (qui marche)
        </button>
        
        <button
          onClick={() => {
            if (debugInfo?.success) {
              // Si la session est fixée, charger le vrai dashboard
              window.location.reload();
            }
          }}
          className={`p-4 font-black ${
            debugInfo?.success 
              ? 'bg-green-500 text-white hover:bg-green-600' 
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
          disabled={!debugInfo?.success}
        >
          🎯 Charger Dashboard (si fixé)
        </button>
      </div>

      {debugInfo?.success && (
        <div className="bg-green-50 border-2 border-green-200 p-6 mt-8">
          <h3 className="font-black text-green-800 mb-4">🎉 SESSION RÉPARÉE !</h3>
          <p className="text-green-700">
            Utilisateur: <strong>{debugInfo.email}</strong><br/>
            ID: <strong>{debugInfo.userId}</strong>
          </p>
          <button
            onClick={() => router.push('/dashboard/developer')}
            className="bg-green-600 text-white px-6 py-3 font-black mt-4 hover:bg-green-700"
          >
            ➡️ Retourner au Dashboard
          </button>
        </div>
      )}
    </div>
  );
}
