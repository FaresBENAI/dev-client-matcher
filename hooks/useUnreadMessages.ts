// hooks/useUnreadMessages.ts
import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export function useUnreadMessages() {
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    let mounted = true;

    const fetchUnreadCount = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user || !mounted) return;

        // Récupérer les conversations de l'utilisateur
        const { data: conversations } = await supabase
          .from('conversations')
          .select('id')
          .or(`client_id.eq.${user.id},developer_id.eq.${user.id}`);

        if (!conversations || conversations.length === 0) {
          if (mounted) {
            setUnreadCount(0);
            setLoading(false);
          }
          return;
        }

        const conversationIds = conversations.map(conv => conv.id);

        // Compter les messages non lus dans ces conversations
        const { count } = await supabase
          .from('messages')
          .select('*', { count: 'exact', head: true })
          .in('conversation_id', conversationIds)
          .neq('sender_id', user.id) // Messages pas envoyés par l'utilisateur
          .eq('is_read', false); // Messages non lus

        if (mounted) {
          setUnreadCount(count || 0);
          setLoading(false);
        }
      } catch (error) {
        console.error('Erreur lors du comptage des messages non lus:', error);
        if (mounted) {
          setUnreadCount(0);
          setLoading(false);
        }
      }
    };

    fetchUnreadCount();

    // Écouter les changements en temps réel
    const channel = supabase
      .channel('unread-messages')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'messages'
        },
        () => {
          fetchUnreadCount();
        }
      )
      .subscribe();

    return () => {
      mounted = false;
      supabase.removeChannel(channel);
    };
  }, []);

  return { unreadCount, loading };
}
