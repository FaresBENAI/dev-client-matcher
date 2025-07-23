'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { MessageCircle, User, LogOut, Menu, X } from 'lucide-react';
import dynamic from 'next/dynamic';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import { useLanguage } from '@/contexts/LanguageContext';

// Composant navbar qui ne s'affiche que côté client
function NavbarContent() {
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const router = useRouter();
  const { t } = useLanguage();

  // S'assurer qu'on est côté client
  useEffect(() => {
    setMounted(true);
  }, []);

  // Fonction pour charger les messages non lus
  const loadUnreadCount = async (userId) => {
    try {
      // 1. Récupérer toutes les conversations de l'utilisateur
      const { data: conversations, error: convError } = await supabase
        .from('conversations')
        .select('id')
        .or(`client_id.eq.${userId},developer_id.eq.${userId}`);

      if (convError) {
        console.error('Erreur chargement conversations:', convError);
        return;
      }

      if (!conversations || conversations.length === 0) {
        setUnreadCount(0);
        return;
      }

      // 2. Compter les messages non lus reçus par l'utilisateur
      const conversationIds = conversations.map(conv => conv.id);
      
      const { data: unreadMessages, error: msgError } = await supabase
        .from('messages')
        .select('id')
        .in('conversation_id', conversationIds)
        .neq('sender_id', userId) // Messages reçus (pas envoyés par l'utilisateur)
        .eq('is_read', false);

      if (msgError) {
        console.error('Erreur comptage messages non lus:', msgError);
        return;
      }

      setUnreadCount(unreadMessages?.length || 0);
    } catch (error) {
      console.error('Erreur:', error);
    }
  };

  // Fonction pour vérifier l'utilisateur
  const checkUser = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      
      if (user) {
        // Charger le profil
        const { data: profile } = await supabase
          .from('profiles')
          .select('user_type, full_name')
          .eq('id', user.id)
          .single();
        
        setUserProfile(profile);
        
        // Charger le count des messages non lus
        loadUnreadCount(user.id);
      }
    } catch (error) {
      console.error('Erreur auth:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkUser();
    
    // Écouter les changements d'auth
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        setUser(session.user);
        checkUser();
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        setUserProfile(null);
        setUnreadCount(0);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Écouter les changements de messages en temps réel
  useEffect(() => {
    if (!user) return;

    const subscription = supabase
      .channel('messages_changes')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'messages'
        }, 
        () => {
          loadUnreadCount(user.id);
        }
      )
      .on('postgres_changes', 
        { 
          event: 'UPDATE', 
          schema: 'public', 
          table: 'messages'
        }, 
        (payload) => {
          // Si un message est marqué comme lu, mettre à jour le compteur
          if (payload.new.is_read !== payload.old.is_read) {
            loadUnreadCount(user.id);
          }
        }
      )
      .subscribe();

    // Écouter les événements personnalisés de marquage de messages
    const handleMessagesRead = (event) => {
      if (event.detail.userId === user.id) {
        loadUnreadCount(user.id);
      }
    };

    window.addEventListener('messagesRead', handleMessagesRead);

    return () => {
      supabase.removeChannel(subscription);
      window.removeEventListener('messagesRead', handleMessagesRead);
    };
  }, [user]);

  // Fonction de déconnexion
  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
      setUserProfile(null);
      setMobileMenuOpen(false);
      router.push('/');
    } catch (error) {
      console.error('Erreur déconnexion:', error);
    }
  };

  // Navigation vers dashboard
  const handleDashboardClick = (e) => {
    e.preventDefault();
    
    if (!user) {
      router.push('/auth/login?redirectTo=/dashboard/developer');
      return;
    }

    // Déterminer la destination du dashboard
    let dashboardUrl = '/dashboard/developer'; // Par défaut
    
    if (userProfile?.user_type === 'client') {
      dashboardUrl = '/dashboard/client';
    } else if (userProfile?.user_type === 'developer') {
      dashboardUrl = '/dashboard/developer';
    }
    
    router.push(dashboardUrl);
  };

  // Navigation vers messages
  const handleMessagesClick = (e) => {
    e.preventDefault();
    
    if (!user) {
      router.push('/auth/login?redirectTo=/messages');
      return;
    }
    
    router.push('/messages');
  };

  // Ne rien afficher côté serveur pour éviter l'hydration mismatch
  if (!mounted) {
    return (
      <nav className="bg-white border-b-2 border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link href="/" className="flex items-center space-x-3">
                <div className="bg-black text-white w-10 h-10 rounded-xl flex items-center justify-center">
                  <span className="text-lg font-black">L</span>
                </div>
                <span className="text-xl font-black text-black">LinkerAI</span>
              </Link>
            </div>
            <div className="w-6 h-6 border-2 border-gray-300 border-t-black rounded-full animate-spin"></div>
          </div>
        </div>
      </nav>
    );
  }

  return (
    <nav className="bg-white border-b-2 border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          
          {/* Logo et titre */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-3">
              <div className="bg-black text-white w-10 h-10 rounded-xl flex items-center justify-center">
                <span className="text-lg font-black">L</span>
              </div>
              <span className="text-xl font-black text-black">LinkerAI</span>
            </Link>
          </div>

          {/* Navigation desktop */}
          <div className="hidden md:flex items-center space-x-8">
            <Link 
              href="/" 
              className="text-gray-700 hover:text-black font-medium transition-colors"
            >
              {t('nav.home')}
            </Link>
            <Link 
              href="/projects" 
              className="text-gray-700 hover:text-black font-medium transition-colors"
            >
              {t('nav.projects')}
            </Link>
            <Link 
              href="/developers" 
              className="text-gray-700 hover:text-black font-medium transition-colors"
            >
              {t('nav.developers')}
            </Link>
            
            {/* Messages - seulement si connecté */}
            {user && (
              <button
                onClick={handleMessagesClick}
                className="text-gray-700 hover:text-black font-medium transition-colors relative"
              >
                <div className="flex items-center space-x-1">
                  <MessageCircle className="h-4 w-4" />
                  <span>{t('nav.messages')}</span>
                  {unreadCount > 0 && (
                    <span className="absolute -top-2 -right-2 bg-black text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                  )}
                </div>
              </button>
            )}
          </div>

          {/* Actions utilisateur et langue */}
          <div className="flex items-center space-x-4">
            {/* Sélecteur de langue */}
            <LanguageSwitcher />

            {user ? (
              <div className="hidden md:flex items-center space-x-3">
                <button
                  onClick={handleDashboardClick}
                  className="bg-black text-white px-4 py-2 rounded-lg font-bold hover:bg-gray-800 transition-colors flex items-center space-x-2"
                >
                  <User className="h-4 w-4" />
                  <span>{t('nav.dashboard')}</span>
                </button>
                
                <div className="text-sm text-gray-600">
                  {userProfile?.full_name || user.email?.split('@')[0]}
                </div>
                
                <button
                  onClick={handleLogout}
                  className="border border-gray-300 text-gray-700 hover:bg-gray-50 px-4 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2"
                >
                  <LogOut className="h-4 w-4" />
                  <span>{t('nav.logout')}</span>
                </button>
              </div>
            ) : (
              <div className="hidden md:flex items-center space-x-3">
                <Link href="/auth/login">
                  <button className="border border-gray-300 text-gray-700 hover:bg-gray-50 px-4 py-2 rounded-lg font-medium transition-colors">
                    {t('nav.login')}
                  </button>
                </Link>
                <Link href="/auth/signup">
                  <button className="bg-black text-white px-4 py-2 rounded-lg font-bold hover:bg-gray-800 transition-colors">
                    {t('nav.signup')}
                  </button>
                </Link>
              </div>
            )}

            {/* Menu mobile */}
            <button
              className="md:hidden p-2 text-gray-700 hover:text-black"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {/* Menu mobile */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-gray-200 py-4">
            <div className="space-y-2">
              <Link href="/" className="block px-4 py-2 text-gray-700 hover:bg-gray-100 rounded">
                {t('nav.home')}
              </Link>
              <Link href="/projects" className="block px-4 py-2 text-gray-700 hover:bg-gray-100 rounded">
                {t('nav.projects')}
              </Link>
              <Link href="/developers" className="block px-4 py-2 text-gray-700 hover:bg-gray-100 rounded">
                {t('nav.developers')}
              </Link>
              {user && (
                <button
                  onClick={handleMessagesClick}
                  className="block w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100 rounded relative"
                >
                  <div className="flex items-center space-x-2">
                    <span>{t('nav.messages')}</span>
                    {unreadCount > 0 && (
                      <span className="bg-black text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                        {unreadCount > 99 ? '99+' : unreadCount}
                      </span>
                    )}
                  </div>
                </button>
              )}
              
              {/* Actions utilisateur mobile */}
              <div className="pt-4 border-t border-gray-200">
                {user ? (
                  <div className="space-y-2">
                    <button
                      onClick={(e) => {
                        handleDashboardClick(e);
                        setMobileMenuOpen(false);
                      }}
                      className="w-full bg-black text-white px-4 py-3 rounded-lg font-bold hover:bg-gray-800 transition-colors flex items-center justify-center space-x-2"
                    >
                      <User className="h-4 w-4" />
                      <span>{t('nav.dashboard')}</span>
                    </button>
                    
                    <div className="text-center text-sm text-gray-600 py-2">
                      {userProfile?.full_name || user.email?.split('@')[0]}
                    </div>
                    
                    <button
                      onClick={() => {
                        handleLogout();
                        setMobileMenuOpen(false);
                      }}
                      className="w-full border border-gray-300 text-gray-700 hover:bg-gray-50 px-4 py-3 rounded-lg font-medium transition-colors flex items-center justify-center space-x-2"
                    >
                      <LogOut className="h-4 w-4" />
                      <span>{t('nav.logout')}</span>
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Link href="/auth/login">
                      <button 
                        className="w-full border border-gray-300 text-gray-700 hover:bg-gray-50 px-4 py-3 rounded-lg font-medium transition-colors"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        {t('nav.login')}
                      </button>
                    </Link>
                    <Link href="/auth/signup">
                      <button 
                        className="w-full bg-black text-white px-4 py-3 rounded-lg font-bold hover:bg-gray-800 transition-colors"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        {t('nav.signup')}
                      </button>
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}

// Export avec dynamic import pour désactiver le SSR
const UnifiedNavbar = dynamic(() => Promise.resolve(NavbarContent), {
  ssr: false,
  loading: () => (
    <nav className="bg-white border-b-2 border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <div className="flex items-center space-x-3">
              <div className="bg-black text-white w-10 h-10 rounded-xl flex items-center justify-center">
                <span className="text-lg font-black">L</span>
              </div>
              <span className="text-xl font-black text-black">LinkerAI</span>
            </div>
          </div>
          <div className="w-6 h-6 border-2 border-gray-300 border-t-black rounded-full animate-spin"></div>
        </div>
      </div>
    </nav>
  )
});

export default UnifiedNavbar;
