export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  public: {
    Tables: {
      businesses: {
        Row: { id: string; name: string; slug: string; created_by: string; created_at: string | null; updated_at: string | null }
        Insert: { id?: string; name: string; slug: string; created_by: string; created_at?: string | null; updated_at?: string | null }
        Update: { id?: string; name?: string; slug?: string; created_by?: string; created_at?: string | null; updated_at?: string | null }
        Relationships: []
      }
    }
    Views: { [_ in never]: never }
    Functions: { [_ in never]: never }
    Enums: { [_ in never]: never }
    CompositeTypes: { [_ in never]: never }
  }
}
