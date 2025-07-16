'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { MessageCircle, User, LogOut, Menu, X } from 'lucide-react';
import dynamic from 'next/dynamic';

// Composant navbar qui ne s'affiche que côté client
function NavbarContent() {
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const router = useRouter();

  // S'assurer qu'on est côté client
  useEffect(() => {
    setMounted(true);
  }, []);

  // Fonction pour charger les messages non lus
  const loadUnreadCount = async (userId) => {
    try {
      console.log('🔄 Chargement des messages non lus pour:', userId);
      
      // Récupérer les conversations de l'utilisateur
      const { data: conversations } = await supabase
        .from('conversations')
        .select('id')
        .or(`client_id.eq.${userId},developer_id.eq.${userId}`);

      if (!conversations || conversations.length === 0) {
        console.log('📭 Aucune conversation trouvée');
        setUnreadCount(0);
        return;
      }

      const conversationIds = conversations.map(conv => conv.id);
      console.log('💬 Conversations trouvées:', conversationIds);

      // Compter les messages non lus dans ces conversations, en excluant les messages système
      const { data: unreadMessages, error } = await supabase
        .from('messages')
        .select('id, content, sender_id, conversation_id, is_read')
        .in('conversation_id', conversationIds)
        .neq('sender_id', userId) // Messages pas envoyés par l'utilisateur
        .eq('is_read', false);

      if (error) {
        console.error('Erreur comptage messages non lus:', error);
        setUnreadCount(0);
        return;
      }

      console.log('📬 Messages non lus trouvés (avant filtrage):', unreadMessages?.length || 0);
      
      if (unreadMessages && unreadMessages.length > 0) {
        console.log('📝 Détails des messages non lus:', unreadMessages.map(msg => ({
          id: msg.id,
          content: msg.content?.substring(0, 50) + '...',
          sender_id: msg.sender_id,
          conversation_id: msg.conversation_id,
          is_read: msg.is_read
        })));
      }

      // Filtrer les messages système et de mise à jour de statut
      const filteredMessages = unreadMessages?.filter(message => {
        const content = message.content?.toLowerCase() || '';
        
        // Exclure les messages système et de mise à jour de statut
        const systemKeywords = [
          'candidature acceptée',
          'candidature refusée',
          'candidature en attente',
          'statut mis à jour',
          'progression du projet',
          '✨**candidature acceptée !**✨',
          '✨**candidature refusée !**✨',
          '✨**candidature en attente !**✨',
          'félicitations',
          'votre candidature a été acceptée',
          'votre candidature n\'a pas été retenue',
          'le projet peut maintenant commencer',
          '🎉 **candidature acceptée !**',
          '❌ **candidature refusée**',
          'malheureusement, votre candidature n\'a pas été retenue'
        ];
        
        // Vérifier si le message contient des mots-clés système
        const isSystemMessage = systemKeywords.some(keyword => content.includes(keyword.toLowerCase()));
        
        // Vérifier aussi si c'est un message avec des étoiles ou des emojis (format système)
        const hasSystemFormat = (content.includes('**') || content.includes('🎉') || content.includes('❌')) && 
                               (content.includes('candidature') || content.includes('félicitations') || content.includes('malheureusement'));
        
        // Vérifier si c'est un message de notification automatique
        const isAutoNotification = content.includes('félicitations') && content.includes('candidature') && content.includes('acceptée');
        
        const shouldExclude = isSystemMessage || hasSystemFormat || isAutoNotification;
        
        if (shouldExclude) {
          console.log('🚫 Message système exclu:', content.substring(0, 50) + '...');
        }
        
        return !shouldExclude;
      }) || [];

      console.log('📬 Messages non lus (après filtrage):', filteredMessages.length);
      setUnreadCount(filteredMessages.length);
    } catch (error) {
      console.error('Erreur lors du comptage des messages non lus:', error);
      setUnreadCount(0);
    }
  };

  useEffect(() => {
    if (!mounted) return;
    
    const initAuth = async () => {
      try {
        // Récupérer la session actuelle
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          setUser(null);
          setUserProfile(null);
          setLoading(false);
          return;
        }

        if (session?.user) {
          setUser(session.user);
          
          // Charger le profil
          try {
            const { data: profile } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', session.user.id)
              .single();
            
            if (profile) {
              setUserProfile(profile);
            }
          } catch (profileError) {
            console.warn('Erreur profil:', profileError.message);
          }

          // Charger les messages non lus
          await loadUnreadCount(session.user.id);
        } else {
          setUser(null);
          setUserProfile(null);
          setUnreadCount(0);
        }
      } catch (error) {
        console.error('Erreur auth:', error.message);
      } finally {
        setLoading(false);
      }
    };

    initAuth();

    // Écouter les changements d'auth
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        setUser(session.user);
        initAuth();
      } else {
        setUser(null);
        setUserProfile(null);
        setUnreadCount(0);
      }
    });

    return () => subscription.unsubscribe();
  }, [mounted]);

  // Écouteur en temps réel pour les messages
  useEffect(() => {
    if (!user) return;

    // Écouter les changements de messages
    const messagesSubscription = supabase
      .channel('navbar_messages_changes')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages'
      }, (payload) => {
        console.log('🆕 Nouveau message reçu (navbar):', payload);
        // Rafraîchir le comptage si le message n'est pas de l'utilisateur actuel
        if (payload.new.sender_id !== user.id) {
          loadUnreadCount(user.id);
        }
      })
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'messages'
      }, (payload) => {
        console.log('📝 Message mis à jour (navbar):', payload);
        // Rafraîchir si le statut de lecture a changé
        if (payload.new.is_read !== payload.old.is_read) {
          console.log('👁️ Statut de lecture changé, rafraîchissement du comptage');
          loadUnreadCount(user.id);
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(messagesSubscription);
    };
  }, [user]);

  // Fonction de déconnexion
  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Erreur déconnexion:', error.message);
      } else {
        setUser(null);
        setUserProfile(null);
        setUnreadCount(0);
        router.push('/');
      }
    } catch (error) {
      console.error('Erreur déconnexion générale:', error.message);
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
              Accueil
            </Link>
            <Link 
              href="/projects" 
              className="text-gray-700 hover:text-black font-medium transition-colors"
            >
              Projets
            </Link>
            <Link 
              href="/developers" 
              className="text-gray-700 hover:text-black font-medium transition-colors"
            >
              Développeurs
            </Link>
            
            {/* Messages - seulement si connecté */}
            {user && (
              <button
                onClick={handleMessagesClick}
                className="relative text-gray-700 hover:text-black font-medium transition-colors flex items-center space-x-1"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Messages</span>
                {unreadCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-black text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
              </button>
            )}
          </div>

          {/* Actions utilisateur */}
          <div className="flex items-center space-x-4">
            {loading ? (
              <div className="w-6 h-6 border-2 border-gray-300 border-t-black rounded-full animate-spin"></div>
            ) : user ? (
              /* Utilisateur connecté */
              <div className="flex items-center space-x-4">
                {/* Bouton Dashboard */}
                <button
                  onClick={handleDashboardClick}
                  className="bg-black text-white px-6 py-2 font-black rounded-lg hover:bg-gray-800 transition-all duration-300 flex items-center space-x-2"
                >
                  <span>Dashboard</span>
                  <span className="text-xs opacity-75">→</span>
                </button>

                {/* Menu utilisateur */}
                <div className="relative group">
                  <button className="flex items-center space-x-2 text-gray-700 hover:text-black">
                    <div className="bg-black text-white w-8 h-8 rounded-lg flex items-center justify-center">
                      <span className="text-sm font-black">
                        {userProfile?.full_name?.charAt(0)?.toUpperCase() || 
                         user.email?.charAt(0)?.toUpperCase() || 'U'}
                      </span>
                    </div>
                    <span className="hidden sm:block font-medium">
                      {userProfile?.full_name || user.email?.split('@')[0]}
                    </span>
                  </button>

                  {/* Dropdown menu */}
                  <div className="absolute right-0 mt-2 w-48 bg-white border-2 border-gray-200 rounded-xl shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                    <div className="p-2">
                      <Link
                        href="/profile"
                        className="flex items-center space-x-2 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                      >
                        <User className="w-4 h-4" />
                        <span>Mon profil</span>
                      </Link>
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center space-x-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>Se déconnecter</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              /* Utilisateur non connecté */
              <div className="flex items-center space-x-4">
                <Link
                  href="/auth/login"
                  className="text-gray-700 hover:text-black font-medium transition-colors"
                >
                  Connexion
                </Link>
                <Link
                  href="/auth/signup"
                  className="bg-black text-white px-6 py-2 font-black rounded-lg hover:bg-gray-800 hover:scale-105 transition-all duration-300"
                >
                  S'inscrire →
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Menu mobile */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-gray-200 py-4">
            <div className="space-y-2">
              <Link href="/" className="block px-4 py-2 text-gray-700 hover:bg-gray-100 rounded">
                Accueil
              </Link>
              <Link href="/projects" className="block px-4 py-2 text-gray-700 hover:bg-gray-100 rounded">
                Projets
              </Link>
              <Link href="/developers" className="block px-4 py-2 text-gray-700 hover:bg-gray-100 rounded">
                Développeurs
              </Link>
              {user && (
                <button
                  onClick={handleMessagesClick}
                  className="block w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100 rounded relative"
                >
                  <div className="flex items-center space-x-2">
                    <span>Messages</span>
                    {unreadCount > 0 && (
                      <span className="bg-black text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                        {unreadCount > 99 ? '99+' : unreadCount}
                      </span>
                    )}
                  </div>
                </button>
              )}
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
