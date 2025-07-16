// utils/markMessagesAsRead.ts
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function markConversationAsRead(conversationId: string) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Marquer tous les messages de cette conversation comme lus
    // sauf ceux envoyés par l'utilisateur actuel
    const { error } = await supabase
      .from('messages')
      .update({ is_read: true })
      .eq('conversation_id', conversationId)
      .neq('sender_id', user.id)
      .eq('is_read', false);

    if (error) {
      console.error('Erreur lors du marquage des messages comme lus:', error);
    }
  } catch (error) {
    console.error('Erreur lors du marquage des messages comme lus:', error);
  }
}

export async function markAllMessagesAsRead() {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Récupérer toutes les conversations de l'utilisateur
    const { data: conversations } = await supabase
      .from('conversations')
      .select('id')
      .or(`client_id.eq.${user.id},developer_id.eq.${user.id}`);

    if (!conversations || conversations.length === 0) return;

    const conversationIds = conversations.map(conv => conv.id);

    // Marquer tous les messages non lus comme lus
    const { error } = await supabase
      .from('messages')
      .update({ is_read: true })
      .in('conversation_id', conversationIds)
      .neq('sender_id', user.id)
      .eq('is_read', false);

    if (error) {
      console.error('Erreur lors du marquage de tous les messages comme lus:', error);
    }
  } catch (error) {
    console.error('Erreur lors du marquage de tous les messages comme lus:', error);
  }
}
