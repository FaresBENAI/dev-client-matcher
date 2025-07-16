// types/supabase.ts
// Définition des types pour Supabase

export type Json = string | number | boolean | null | { [key: string]: Json } | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string | null
          avatar_url: string | null
          user_type: 'client' | 'developer'
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          avatar_url?: string | null
          user_type: 'client' | 'developer'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          avatar_url?: string | null
          user_type?: 'client' | 'developer'
          created_at?: string
          updated_at?: string
        }
      }
      projects: {
        Row: {
          id: string
          title: string
          description: string
          budget_min: number | null
          budget_max: number | null
          project_type: string
          complexity: string | null
          status: string
          client_id: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          description: string
          budget_min?: number | null
          budget_max?: number | null
          project_type: string
          complexity?: string | null
          status?: string
          client_id: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          description?: string
          budget_min?: number | null
          budget_max?: number | null
          project_type?: string
          complexity?: string | null
          status?: string
          client_id?: string
          created_at?: string
          updated_at?: string
        }
      }
      developer_profiles: {
        Row: {
          id: string
          title: string | null
          bio: string | null
          skills: string[] | null
          experience_years: number | null
          hourly_rate: number | null
          daily_rate: number | null
          location: string | null
          average_rating: number | null
          total_ratings: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          title?: string | null
          bio?: string | null
          skills?: string[] | null
          experience_years?: number | null
          hourly_rate?: number | null
          daily_rate?: number | null
          location?: string | null
          average_rating?: number | null
          total_ratings?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string | null
          bio?: string | null
          skills?: string[] | null
          experience_years?: number | null
          hourly_rate?: number | null
          daily_rate?: number | null
          location?: string | null
          average_rating?: number | null
          total_ratings?: number | null
          created_at?: string
          updated_at?: string
        }
      }
      conversations: {
        Row: {
          id: string
          client_id: string
          developer_id: string
          project_id: string | null
          subject: string | null
          status: string
          last_message_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          client_id: string
          developer_id: string
          project_id?: string | null
          subject?: string | null
          status?: string
          last_message_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          client_id?: string
          developer_id?: string
          project_id?: string | null
          subject?: string | null
          status?: string
          last_message_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      messages: {
        Row: {
          id: string
          conversation_id: string
          sender_id: string
          content: string
          is_read: boolean
          created_at: string
        }
        Insert: {
          id?: string
          conversation_id: string
          sender_id: string
          content: string
          is_read?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          conversation_id?: string
          sender_id?: string
          content?: string
          is_read?: boolean
          created_at?: string
        }
      }
      project_applications: {
        Row: {
          id: string
          project_id: string
          developer_id: string
          status: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          project_id: string
          developer_id: string
          status?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          project_id?: string
          developer_id?: string
          status?: string
          created_at?: string
          updated_at?: string
        }
      }
    }
  }
}
