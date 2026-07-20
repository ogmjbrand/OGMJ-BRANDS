export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      ab_tests: {
        Row: {
          business_id: string
          confidence: number | null
          created_at: string | null
          description: string | null
          ended_at: string | null
          entity_id: string
          entity_type: string
          id: string
          name: string
          started_at: string | null
          status: string | null
          updated_at: string | null
          variants: Json | null
          winner_variant: string | null
        }
        Insert: {
          business_id: string
          confidence?: number | null
          created_at?: string | null
          description?: string | null
          ended_at?: string | null
          entity_id: string
          entity_type: string
          id?: string
          name: string
          started_at?: string | null
          status?: string | null
          updated_at?: string | null
          variants?: Json | null
          winner_variant?: string | null
        }
        Update: {
          business_id?: string
          confidence?: number | null
          created_at?: string | null
          description?: string | null
          ended_at?: string | null
          entity_id?: string
          entity_type?: string
          id?: string
          name?: string
          started_at?: string | null
          status?: string | null
          updated_at?: string | null
          variants?: Json | null
          winner_variant?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ab_tests_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ab_tests_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "my_businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      activity_logs: {
        Row: {
          action: string
          business_id: string
          created_at: string | null
          entity_id: string | null
          entity_name: string | null
          entity_type: string
          id: string
          ip_address: string | null
          metadata: Json | null
          user_id: string | null
        }
        Insert: {
          action: string
          business_id: string
          created_at?: string | null
          entity_id?: string | null
          entity_name?: string | null
          entity_type: string
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          user_id?: string | null
        }
        Update: {
          action?: string
          business_id?: string
          created_at?: string | null
          entity_id?: string | null
          entity_name?: string | null
          entity_type?: string
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "activity_logs_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activity_logs_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "my_businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_content: {
        Row: {
          business_id: string
          category: string
          created_at: string | null
          id: string
          is_published: boolean | null
          is_saved: boolean | null
          metadata: Json | null
          model: string | null
          output: string
          prompt: string
          rating: number | null
          tags: string[] | null
          title: string | null
          tokens_used: number | null
          tool: string
          user_id: string | null
        }
        Insert: {
          business_id: string
          category?: string
          created_at?: string | null
          id?: string
          is_published?: boolean | null
          is_saved?: boolean | null
          metadata?: Json | null
          model?: string | null
          output: string
          prompt: string
          rating?: number | null
          tags?: string[] | null
          title?: string | null
          tokens_used?: number | null
          tool: string
          user_id?: string | null
        }
        Update: {
          business_id?: string
          category?: string
          created_at?: string | null
          id?: string
          is_published?: boolean | null
          is_saved?: boolean | null
          metadata?: Json | null
          model?: string | null
          output?: string
          prompt?: string
          rating?: number | null
          tags?: string[] | null
          title?: string | null
          tokens_used?: number | null
          tool?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_content_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_content_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "my_businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_execution_logs: {
        Row: {
          agent_type: string
          approved: boolean | null
          approved_at: string | null
          approved_by: string | null
          business_id: string
          completion_tokens: number | null
          cost_usd: number | null
          created_at: string | null
          created_by: string | null
          error_message: string | null
          execution_time_ms: number | null
          id: string
          metadata: Json | null
          model: string | null
          output: string | null
          prompt: string | null
          prompt_tokens: number | null
          published: boolean | null
          published_at: string | null
          status: string | null
          system_prompt: string | null
          tokens_used: number | null
        }
        Insert: {
          agent_type: string
          approved?: boolean | null
          approved_at?: string | null
          approved_by?: string | null
          business_id: string
          completion_tokens?: number | null
          cost_usd?: number | null
          created_at?: string | null
          created_by?: string | null
          error_message?: string | null
          execution_time_ms?: number | null
          id?: string
          metadata?: Json | null
          model?: string | null
          output?: string | null
          prompt?: string | null
          prompt_tokens?: number | null
          published?: boolean | null
          published_at?: string | null
          status?: string | null
          system_prompt?: string | null
          tokens_used?: number | null
        }
        Update: {
          agent_type?: string
          approved?: boolean | null
          approved_at?: string | null
          approved_by?: string | null
          business_id?: string
          completion_tokens?: number | null
          cost_usd?: number | null
          created_at?: string | null
          created_by?: string | null
          error_message?: string | null
          execution_time_ms?: number | null
          id?: string
          metadata?: Json | null
          model?: string | null
          output?: string | null
          prompt?: string | null
          prompt_tokens?: number | null
          published?: boolean | null
          published_at?: string | null
          status?: string | null
          system_prompt?: string | null
          tokens_used?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_execution_logs_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_execution_logs_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "my_businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_logs: {
        Row: {
          business_id: string
          created_at: string | null
          feature: string
          id: string
          metadata: Json | null
          model: string | null
          prompt_tokens: number | null
          response_tokens: number | null
          result: string | null
          user_id: string | null
        }
        Insert: {
          business_id: string
          created_at?: string | null
          feature: string
          id?: string
          metadata?: Json | null
          model?: string | null
          prompt_tokens?: number | null
          response_tokens?: number | null
          result?: string | null
          user_id?: string | null
        }
        Update: {
          business_id?: string
          created_at?: string | null
          feature?: string
          id?: string
          metadata?: Json | null
          model?: string | null
          prompt_tokens?: number | null
          response_tokens?: number | null
          result?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_logs_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_logs_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "my_businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_memory: {
        Row: {
          business_id: string
          category: string
          created_at: string | null
          created_by: string | null
          expires_at: string | null
          id: string
          key: string
          last_used_at: string | null
          priority: number | null
          summary: string | null
          updated_at: string | null
          usage_count: number | null
          value: string
        }
        Insert: {
          business_id: string
          category: string
          created_at?: string | null
          created_by?: string | null
          expires_at?: string | null
          id?: string
          key: string
          last_used_at?: string | null
          priority?: number | null
          summary?: string | null
          updated_at?: string | null
          usage_count?: number | null
          value: string
        }
        Update: {
          business_id?: string
          category?: string
          created_at?: string | null
          created_by?: string | null
          expires_at?: string | null
          id?: string
          key?: string
          last_used_at?: string | null
          priority?: number | null
          summary?: string | null
          updated_at?: string | null
          usage_count?: number | null
          value?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_memory_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_memory_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "my_businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_tool_configs: {
        Row: {
          business_id: string
          config: Json
          created_at: string | null
          id: string
          is_enabled: boolean | null
          tool_key: string
          updated_at: string | null
        }
        Insert: {
          business_id: string
          config?: Json
          created_at?: string | null
          id?: string
          is_enabled?: boolean | null
          tool_key: string
          updated_at?: string | null
        }
        Update: {
          business_id?: string
          config?: Json
          created_at?: string | null
          id?: string
          is_enabled?: boolean | null
          tool_key?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_tool_configs_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_tool_configs_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "my_businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      analytics_daily: {
        Row: {
          ai_calls: number | null
          bounces: number | null
          business_id: string
          conversions: number | null
          created_at: string | null
          date: string
          deals_created: number | null
          deals_value: number | null
          deals_won: number | null
          emails_clicked: number | null
          emails_opened: number | null
          emails_sent: number | null
          entity_id: string | null
          entity_type: string
          id: string
          new_contacts: number | null
          page_views: number | null
          revenue: number | null
          sessions: number | null
          updated_at: string | null
          visitors: number | null
        }
        Insert: {
          ai_calls?: number | null
          bounces?: number | null
          business_id: string
          conversions?: number | null
          created_at?: string | null
          date: string
          deals_created?: number | null
          deals_value?: number | null
          deals_won?: number | null
          emails_clicked?: number | null
          emails_opened?: number | null
          emails_sent?: number | null
          entity_id?: string | null
          entity_type?: string
          id?: string
          new_contacts?: number | null
          page_views?: number | null
          revenue?: number | null
          sessions?: number | null
          updated_at?: string | null
          visitors?: number | null
        }
        Update: {
          ai_calls?: number | null
          bounces?: number | null
          business_id?: string
          conversions?: number | null
          created_at?: string | null
          date?: string
          deals_created?: number | null
          deals_value?: number | null
          deals_won?: number | null
          emails_clicked?: number | null
          emails_opened?: number | null
          emails_sent?: number | null
          entity_id?: string | null
          entity_type?: string
          id?: string
          new_contacts?: number | null
          page_views?: number | null
          revenue?: number | null
          sessions?: number | null
          updated_at?: string | null
          visitors?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "analytics_daily_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "analytics_daily_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "my_businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      analytics_events: {
        Row: {
          business_id: string
          created_at: string | null
          event_name: string
          event_type: string
          id: string
          metadata: Json | null
          value: number | null
        }
        Insert: {
          business_id: string
          created_at?: string | null
          event_name: string
          event_type: string
          id?: string
          metadata?: Json | null
          value?: number | null
        }
        Update: {
          business_id?: string
          created_at?: string | null
          event_name?: string
          event_type?: string
          id?: string
          metadata?: Json | null
          value?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "analytics_events_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "analytics_events_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "my_businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      api_keys: {
        Row: {
          business_id: string
          created_at: string | null
          expires_at: string | null
          id: string
          ip_whitelist: string[] | null
          is_active: boolean | null
          key_hash: string
          key_prefix: string
          last_used_at: string | null
          name: string
          request_count: number | null
          scopes: string[] | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          business_id: string
          created_at?: string | null
          expires_at?: string | null
          id?: string
          ip_whitelist?: string[] | null
          is_active?: boolean | null
          key_hash: string
          key_prefix: string
          last_used_at?: string | null
          name: string
          request_count?: number | null
          scopes?: string[] | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          business_id?: string
          created_at?: string | null
          expires_at?: string | null
          id?: string
          ip_whitelist?: string[] | null
          is_active?: boolean | null
          key_hash?: string
          key_prefix?: string
          last_used_at?: string | null
          name?: string
          request_count?: number | null
          scopes?: string[] | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "api_keys_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "api_keys_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "my_businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      api_rate_limits: {
        Row: {
          business_id: string
          created_at: string | null
          endpoint: string | null
          id: string
          request_count: number | null
          window_start: string
        }
        Insert: {
          business_id: string
          created_at?: string | null
          endpoint?: string | null
          id?: string
          request_count?: number | null
          window_start?: string
        }
        Update: {
          business_id?: string
          created_at?: string | null
          endpoint?: string | null
          id?: string
          request_count?: number | null
          window_start?: string
        }
        Relationships: [
          {
            foreignKeyName: "api_rate_limits_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "api_rate_limits_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "my_businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      appointments: {
        Row: {
          business_id: string
          contact_id: string | null
          created_at: string | null
          deal_id: string | null
          description: string | null
          end_time: string
          id: string
          lead_id: string | null
          location: string | null
          meeting_url: string | null
          metadata: Json | null
          notes: string | null
          owner_id: string
          reminder_sent: boolean | null
          start_time: string
          status: string | null
          timezone: string | null
          title: string
          type: string | null
          updated_at: string | null
        }
        Insert: {
          business_id: string
          contact_id?: string | null
          created_at?: string | null
          deal_id?: string | null
          description?: string | null
          end_time: string
          id?: string
          lead_id?: string | null
          location?: string | null
          meeting_url?: string | null
          metadata?: Json | null
          notes?: string | null
          owner_id: string
          reminder_sent?: boolean | null
          start_time: string
          status?: string | null
          timezone?: string | null
          title: string
          type?: string | null
          updated_at?: string | null
        }
        Update: {
          business_id?: string
          contact_id?: string | null
          created_at?: string | null
          deal_id?: string | null
          description?: string | null
          end_time?: string
          id?: string
          lead_id?: string | null
          location?: string | null
          meeting_url?: string | null
          metadata?: Json | null
          notes?: string | null
          owner_id?: string
          reminder_sent?: boolean | null
          start_time?: string
          status?: string | null
          timezone?: string | null
          title?: string
          type?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "appointments_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "my_businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: string
          business_id: string
          changes: Json | null
          created_at: string | null
          error_message: string | null
          id: string
          ip_address: unknown
          resource_id: string | null
          resource_type: string
          status: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          business_id: string
          changes?: Json | null
          created_at?: string | null
          error_message?: string | null
          id?: string
          ip_address?: unknown
          resource_id?: string | null
          resource_type: string
          status?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          business_id?: string
          changes?: Json | null
          created_at?: string | null
          error_message?: string | null
          id?: string
          ip_address?: unknown
          resource_id?: string | null
          resource_type?: string
          status?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "audit_logs_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "my_businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      business_addons: {
        Row: {
          addon_id: string
          business_id: string
          created_at: string | null
          expires_at: string | null
          id: string
          starts_at: string | null
          status: string | null
          transaction_id: string | null
          updated_at: string | null
        }
        Insert: {
          addon_id: string
          business_id: string
          created_at?: string | null
          expires_at?: string | null
          id?: string
          starts_at?: string | null
          status?: string | null
          transaction_id?: string | null
          updated_at?: string | null
        }
        Update: {
          addon_id?: string
          business_id?: string
          created_at?: string | null
          expires_at?: string | null
          id?: string
          starts_at?: string | null
          status?: string | null
          transaction_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "business_addons_addon_id_fkey"
            columns: ["addon_id"]
            isOneToOne: false
            referencedRelation: "plan_addons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "business_addons_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "business_addons_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "my_businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "business_addons_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "payment_transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      business_members: {
        Row: {
          business_id: string
          created_at: string
          id: string
          invited_by: string | null
          is_active: boolean
          role: Database["public"]["Enums"]["business_role"]
          updated_at: string
          user_id: string
        }
        Insert: {
          business_id: string
          created_at?: string
          id?: string
          invited_by?: string | null
          is_active?: boolean
          role?: Database["public"]["Enums"]["business_role"]
          updated_at?: string
          user_id: string
        }
        Update: {
          business_id?: string
          created_at?: string
          id?: string
          invited_by?: string | null
          is_active?: boolean
          role?: Database["public"]["Enums"]["business_role"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "business_members_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "business_members_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "my_businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      business_settings: {
        Row: {
          business_id: string
          created_at: string | null
          id: string
          key: string
          updated_at: string | null
          value: Json | null
        }
        Insert: {
          business_id: string
          created_at?: string | null
          id?: string
          key: string
          updated_at?: string | null
          value?: Json | null
        }
        Update: {
          business_id?: string
          created_at?: string | null
          id?: string
          key?: string
          updated_at?: string | null
          value?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "business_settings_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "business_settings_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "my_businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      business_users: {
        Row: {
          business_id: string
          created_at: string | null
          id: string
          invited_at: string | null
          invited_by: string | null
          joined_at: string | null
          metadata: Json | null
          role: string
          status: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          business_id: string
          created_at?: string | null
          id?: string
          invited_at?: string | null
          invited_by?: string | null
          joined_at?: string | null
          metadata?: Json | null
          role?: string
          status?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          business_id?: string
          created_at?: string | null
          id?: string
          invited_at?: string | null
          invited_by?: string | null
          joined_at?: string | null
          metadata?: Json | null
          role?: string
          status?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "business_users_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "business_users_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "my_businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      businesses: {
        Row: {
          address: Json | null
          brand_color: string | null
          business_name: string | null
          business_type: string | null
          city: string | null
          country: string | null
          created_at: string
          created_by: string | null
          currency: string | null
          custom_domain: string | null
          description: string | null
          domain: string | null
          email: string | null
          id: string
          industry: string
          is_active: boolean | null
          is_verified: boolean | null
          legal_name: string | null
          logo_url: string | null
          metadata: Json | null
          name: string
          onboarding_completed: boolean | null
          onboarding_step: number | null
          owner_id: string
          phone: string | null
          registration_number: string | null
          settings: Json | null
          slug: string
          state: string | null
          status: Database["public"]["Enums"]["business_status"]
          tax_id: string | null
          team_size: number | null
          timezone: string | null
          type: string
          updated_at: string
          user_id: string | null
          website: string | null
          website_url: string | null
        }
        Insert: {
          address?: Json | null
          brand_color?: string | null
          business_name?: string | null
          business_type?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          created_by?: string | null
          currency?: string | null
          custom_domain?: string | null
          description?: string | null
          domain?: string | null
          email?: string | null
          id?: string
          industry?: string
          is_active?: boolean | null
          is_verified?: boolean | null
          legal_name?: string | null
          logo_url?: string | null
          metadata?: Json | null
          name?: string
          onboarding_completed?: boolean | null
          onboarding_step?: number | null
          owner_id: string
          phone?: string | null
          registration_number?: string | null
          settings?: Json | null
          slug?: string
          state?: string | null
          status?: Database["public"]["Enums"]["business_status"]
          tax_id?: string | null
          team_size?: number | null
          timezone?: string | null
          type?: string
          updated_at?: string
          user_id?: string | null
          website?: string | null
          website_url?: string | null
        }
        Update: {
          address?: Json | null
          brand_color?: string | null
          business_name?: string | null
          business_type?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          created_by?: string | null
          currency?: string | null
          custom_domain?: string | null
          description?: string | null
          domain?: string | null
          email?: string | null
          id?: string
          industry?: string
          is_active?: boolean | null
          is_verified?: boolean | null
          legal_name?: string | null
          logo_url?: string | null
          metadata?: Json | null
          name?: string
          onboarding_completed?: boolean | null
          onboarding_step?: number | null
          owner_id?: string
          phone?: string | null
          registration_number?: string | null
          settings?: Json | null
          slug?: string
          state?: string | null
          status?: Database["public"]["Enums"]["business_status"]
          tax_id?: string | null
          team_size?: number | null
          timezone?: string | null
          type?: string
          updated_at?: string
          user_id?: string | null
          website?: string | null
          website_url?: string | null
        }
        Relationships: []
      }
      campaigns: {
        Row: {
          audience_filter: Json
          business_id: string
          content: Json
          created_at: string
          id: string
          name: string
          owner_id: string
          scheduled_at: string | null
          sent_at: string | null
          stats: Json
          status: string
          subject: string | null
          type: string
          updated_at: string
        }
        Insert: {
          audience_filter?: Json
          business_id: string
          content?: Json
          created_at?: string
          id?: string
          name: string
          owner_id: string
          scheduled_at?: string | null
          sent_at?: string | null
          stats?: Json
          status?: string
          subject?: string | null
          type?: string
          updated_at?: string
        }
        Update: {
          audience_filter?: Json
          business_id?: string
          content?: Json
          created_at?: string
          id?: string
          name?: string
          owner_id?: string
          scheduled_at?: string | null
          sent_at?: string | null
          stats?: Json
          status?: string
          subject?: string | null
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "campaigns_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "campaigns_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "my_businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      client_invoices: {
        Row: {
          business_id: string
          client_id: string | null
          created_at: string | null
          currency: string | null
          discount: number | null
          due_date: string | null
          id: string
          invoice_number: string
          metadata: Json | null
          notes: string | null
          paid_at: string | null
          project_id: string | null
          sent_at: string | null
          status: string | null
          subtotal: number | null
          tax_amount: number | null
          tax_rate: number | null
          terms: string | null
          title: string | null
          total: number | null
          updated_at: string | null
        }
        Insert: {
          business_id: string
          client_id?: string | null
          created_at?: string | null
          currency?: string | null
          discount?: number | null
          due_date?: string | null
          id?: string
          invoice_number: string
          metadata?: Json | null
          notes?: string | null
          paid_at?: string | null
          project_id?: string | null
          sent_at?: string | null
          status?: string | null
          subtotal?: number | null
          tax_amount?: number | null
          tax_rate?: number | null
          terms?: string | null
          title?: string | null
          total?: number | null
          updated_at?: string | null
        }
        Update: {
          business_id?: string
          client_id?: string | null
          created_at?: string | null
          currency?: string | null
          discount?: number | null
          due_date?: string | null
          id?: string
          invoice_number?: string
          metadata?: Json | null
          notes?: string | null
          paid_at?: string | null
          project_id?: string | null
          sent_at?: string | null
          status?: string | null
          subtotal?: number | null
          tax_amount?: number | null
          tax_rate?: number | null
          terms?: string | null
          title?: string | null
          total?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "client_invoices_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_invoices_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "my_businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_invoices_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_invoices_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      clients: {
        Row: {
          address: Json | null
          avatar_url: string | null
          business_id: string
          company: string | null
          created_at: string | null
          email: string | null
          id: string
          industry: string | null
          name: string
          notes: string | null
          phone: string | null
          source: string | null
          status: string | null
          tags: string[] | null
          total_revenue: number | null
          updated_at: string | null
          website: string | null
        }
        Insert: {
          address?: Json | null
          avatar_url?: string | null
          business_id: string
          company?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          industry?: string | null
          name: string
          notes?: string | null
          phone?: string | null
          source?: string | null
          status?: string | null
          tags?: string[] | null
          total_revenue?: number | null
          updated_at?: string | null
          website?: string | null
        }
        Update: {
          address?: Json | null
          avatar_url?: string | null
          business_id?: string
          company?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          industry?: string | null
          name?: string
          notes?: string | null
          phone?: string | null
          source?: string | null
          status?: string | null
          tags?: string[] | null
          total_revenue?: number | null
          updated_at?: string | null
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "clients_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clients_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "my_businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      clips: {
        Row: {
          created_at: string | null
          end_time: number | null
          file_path: string | null
          id: string
          score: number | null
          start_time: number | null
          title: string | null
          video_id: string
        }
        Insert: {
          created_at?: string | null
          end_time?: number | null
          file_path?: string | null
          id?: string
          score?: number | null
          start_time?: number | null
          title?: string | null
          video_id: string
        }
        Update: {
          created_at?: string | null
          end_time?: number | null
          file_path?: string | null
          id?: string
          score?: number | null
          start_time?: number | null
          title?: string | null
          video_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "clips_video_id_fkey"
            columns: ["video_id"]
            isOneToOne: false
            referencedRelation: "videos"
            referencedColumns: ["id"]
          },
        ]
      }
      components: {
        Row: {
          business_id: string
          category: string | null
          code: string | null
          created_at: string | null
          created_by: string | null
          id: string
          name: string
          preview_url: string | null
          props: Json
          status: string | null
          styles: Json
          thumbnail_url: string | null
          type: string
          updated_at: string | null
          usage_count: number | null
          visibility: string | null
        }
        Insert: {
          business_id: string
          category?: string | null
          code?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          name: string
          preview_url?: string | null
          props?: Json
          status?: string | null
          styles?: Json
          thumbnail_url?: string | null
          type: string
          updated_at?: string | null
          usage_count?: number | null
          visibility?: string | null
        }
        Update: {
          business_id?: string
          category?: string | null
          code?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          name?: string
          preview_url?: string | null
          props?: Json
          status?: string | null
          styles?: Json
          thumbnail_url?: string | null
          type?: string
          updated_at?: string | null
          usage_count?: number | null
          visibility?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "components_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "components_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "my_businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      contact_tags: {
        Row: {
          contact_id: string
          tag_id: string
        }
        Insert: {
          contact_id: string
          tag_id: string
        }
        Update: {
          contact_id?: string
          tag_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "contact_tags_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contact_tags_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "tags"
            referencedColumns: ["id"]
          },
        ]
      }
      contacts: {
        Row: {
          avatar_url: string | null
          business_id: string
          city: string | null
          company: string | null
          company_name: string | null
          country: string | null
          created_at: string
          created_by: string | null
          email: string | null
          first_name: string
          id: string
          job_title: string | null
          last_contact_at: string | null
          last_name: string | null
          lead_score: number | null
          lifecycle_stage: string
          metadata: Json
          next_followup_at: string | null
          owner_id: string
          phone: string | null
          source: string | null
          status: string
          tags: string[] | null
          timezone: string | null
          updated_at: string
          updated_by: string | null
          website: string | null
        }
        Insert: {
          avatar_url?: string | null
          business_id: string
          city?: string | null
          company?: string | null
          company_name?: string | null
          country?: string | null
          created_at?: string
          created_by?: string | null
          email?: string | null
          first_name: string
          id?: string
          job_title?: string | null
          last_contact_at?: string | null
          last_name?: string | null
          lead_score?: number | null
          lifecycle_stage?: string
          metadata?: Json
          next_followup_at?: string | null
          owner_id: string
          phone?: string | null
          source?: string | null
          status?: string
          tags?: string[] | null
          timezone?: string | null
          updated_at?: string
          updated_by?: string | null
          website?: string | null
        }
        Update: {
          avatar_url?: string | null
          business_id?: string
          city?: string | null
          company?: string | null
          company_name?: string | null
          country?: string | null
          created_at?: string
          created_by?: string | null
          email?: string | null
          first_name?: string
          id?: string
          job_title?: string | null
          last_contact_at?: string | null
          last_name?: string | null
          lead_score?: number | null
          lifecycle_stage?: string
          metadata?: Json
          next_followup_at?: string | null
          owner_id?: string
          phone?: string | null
          source?: string | null
          status?: string
          tags?: string[] | null
          timezone?: string | null
          updated_at?: string
          updated_by?: string | null
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contacts_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contacts_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "my_businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      content_calendar: {
        Row: {
          business_id: string
          campaign_id: string | null
          color: string | null
          content: string | null
          created_at: string | null
          created_by: string | null
          id: string
          metadata: Json | null
          platform: string | null
          post_id: string | null
          post_type: string | null
          scheduled_at: string
          status: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          business_id: string
          campaign_id?: string | null
          color?: string | null
          content?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          metadata?: Json | null
          platform?: string | null
          post_id?: string | null
          post_type?: string | null
          scheduled_at: string
          status?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          business_id?: string
          campaign_id?: string | null
          color?: string | null
          content?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          metadata?: Json | null
          platform?: string | null
          post_id?: string | null
          post_type?: string | null
          scheduled_at?: string
          status?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "content_calendar_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "content_calendar_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "my_businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "content_calendar_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "content_calendar_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "social_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      conversation_participants: {
        Row: {
          business_id: string
          conversation_id: string
          is_muted: boolean | null
          joined_at: string | null
          last_read_at: string | null
          role: string | null
          unread_count: number | null
          user_id: string
        }
        Insert: {
          business_id: string
          conversation_id: string
          is_muted?: boolean | null
          joined_at?: string | null
          last_read_at?: string | null
          role?: string | null
          unread_count?: number | null
          user_id: string
        }
        Update: {
          business_id?: string
          conversation_id?: string
          is_muted?: boolean | null
          joined_at?: string | null
          last_read_at?: string | null
          role?: string | null
          unread_count?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversation_participants_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversation_participants_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "my_businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversation_participants_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      conversations: {
        Row: {
          business_id: string
          context_id: string | null
          context_type: string | null
          created_at: string | null
          created_by: string | null
          id: string
          is_archived: boolean | null
          last_message_at: string | null
          metadata: Json | null
          title: string | null
          type: string | null
          updated_at: string | null
        }
        Insert: {
          business_id: string
          context_id?: string | null
          context_type?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_archived?: boolean | null
          last_message_at?: string | null
          metadata?: Json | null
          title?: string | null
          type?: string | null
          updated_at?: string | null
        }
        Update: {
          business_id?: string
          context_id?: string | null
          context_type?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_archived?: boolean | null
          last_message_at?: string | null
          metadata?: Json | null
          title?: string | null
          type?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "conversations_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversations_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "my_businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_activities: {
        Row: {
          body: string | null
          business_id: string
          completed_at: string | null
          contact_id: string | null
          created_at: string
          deal_id: string | null
          duration_min: number | null
          id: string
          metadata: Json
          outcome: string | null
          scheduled_at: string | null
          title: string
          type: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          body?: string | null
          business_id: string
          completed_at?: string | null
          contact_id?: string | null
          created_at?: string
          deal_id?: string | null
          duration_min?: number | null
          id?: string
          metadata?: Json
          outcome?: string | null
          scheduled_at?: string | null
          title: string
          type: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          body?: string | null
          business_id?: string
          completed_at?: string | null
          contact_id?: string | null
          created_at?: string
          deal_id?: string | null
          duration_min?: number | null
          id?: string
          metadata?: Json
          outcome?: string | null
          scheduled_at?: string | null
          title?: string
          type?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "crm_activities_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_activities_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "my_businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_activities_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_activities_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_notes: {
        Row: {
          business_id: string
          contact_id: string | null
          content: string
          created_at: string
          deal_id: string | null
          id: string
          pinned: boolean
          updated_at: string
          user_id: string | null
        }
        Insert: {
          business_id: string
          contact_id?: string | null
          content: string
          created_at?: string
          deal_id?: string | null
          id?: string
          pinned?: boolean
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          business_id?: string
          contact_id?: string | null
          content?: string
          created_at?: string
          deal_id?: string | null
          id?: string
          pinned?: boolean
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "crm_notes_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_notes_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "my_businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_notes_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_notes_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
        ]
      }
      cron_job_logs: {
        Row: {
          completed_at: string | null
          created_at: string | null
          duration_ms: number | null
          error: string | null
          id: string
          job_name: string
          metadata: Json | null
          records_processed: number | null
          started_at: string | null
          status: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          duration_ms?: number | null
          error?: string | null
          id?: string
          job_name: string
          metadata?: Json | null
          records_processed?: number | null
          started_at?: string | null
          status: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          duration_ms?: number | null
          error?: string | null
          id?: string
          job_name?: string
          metadata?: Json | null
          records_processed?: number | null
          started_at?: string | null
          status?: string
        }
        Relationships: []
      }
      custom_domains: {
        Row: {
          business_id: string
          created_at: string
          dns_verified: boolean
          domain: string
          funnel_id: string | null
          id: string
          metadata: Json
          ssl_status: string
          status: string
          subdomain: string | null
          updated_at: string
          verified_at: string | null
          website_id: string | null
        }
        Insert: {
          business_id: string
          created_at?: string
          dns_verified?: boolean
          domain: string
          funnel_id?: string | null
          id?: string
          metadata?: Json
          ssl_status?: string
          status?: string
          subdomain?: string | null
          updated_at?: string
          verified_at?: string | null
          website_id?: string | null
        }
        Update: {
          business_id?: string
          created_at?: string
          dns_verified?: boolean
          domain?: string
          funnel_id?: string | null
          id?: string
          metadata?: Json
          ssl_status?: string
          status?: string
          subdomain?: string | null
          updated_at?: string
          verified_at?: string | null
          website_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "custom_domains_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "custom_domains_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "my_businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "custom_domains_funnel_id_fkey"
            columns: ["funnel_id"]
            isOneToOne: false
            referencedRelation: "funnels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "custom_domains_website_id_fkey"
            columns: ["website_id"]
            isOneToOne: false
            referencedRelation: "websites"
            referencedColumns: ["id"]
          },
        ]
      }
      deal_tags: {
        Row: {
          deal_id: string
          tag_id: string
        }
        Insert: {
          deal_id: string
          tag_id: string
        }
        Update: {
          deal_id?: string
          tag_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "deal_tags_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deal_tags_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "tags"
            referencedColumns: ["id"]
          },
        ]
      }
      deals: {
        Row: {
          business_id: string
          close_date: string | null
          closed_at: string | null
          contact_id: string | null
          created_at: string
          created_by: string | null
          currency: string
          description: string | null
          expected_close_date: string | null
          id: string
          lost_reason: string | null
          metadata: Json
          owner_id: string | null
          pipeline_id: string
          probability: number | null
          stage: string | null
          stage_id: string
          status: string
          title: string
          updated_at: string
          updated_by: string | null
          value: number
        }
        Insert: {
          business_id: string
          close_date?: string | null
          closed_at?: string | null
          contact_id?: string | null
          created_at?: string
          created_by?: string | null
          currency?: string
          description?: string | null
          expected_close_date?: string | null
          id?: string
          lost_reason?: string | null
          metadata?: Json
          owner_id?: string | null
          pipeline_id: string
          probability?: number | null
          stage?: string | null
          stage_id: string
          status?: string
          title: string
          updated_at?: string
          updated_by?: string | null
          value?: number
        }
        Update: {
          business_id?: string
          close_date?: string | null
          closed_at?: string | null
          contact_id?: string | null
          created_at?: string
          created_by?: string | null
          currency?: string
          description?: string | null
          expected_close_date?: string | null
          id?: string
          lost_reason?: string | null
          metadata?: Json
          owner_id?: string | null
          pipeline_id?: string
          probability?: number | null
          stage?: string | null
          stage_id?: string
          status?: string
          title?: string
          updated_at?: string
          updated_by?: string | null
          value?: number
        }
        Relationships: [
          {
            foreignKeyName: "deals_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deals_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "my_businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deals_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deals_pipeline_id_fkey"
            columns: ["pipeline_id"]
            isOneToOne: false
            referencedRelation: "pipelines"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deals_stage_id_fkey"
            columns: ["stage_id"]
            isOneToOne: false
            referencedRelation: "pipeline_stages"
            referencedColumns: ["id"]
          },
        ]
      }
      discount_codes: {
        Row: {
          applies_to: string | null
          applies_to_ids: string[] | null
          business_id: string
          code: string
          created_at: string | null
          currency: string | null
          description: string | null
          expires_at: string | null
          id: string
          is_active: boolean | null
          maximum_discount: number | null
          metadata: Json | null
          minimum_order: number | null
          name: string | null
          starts_at: string | null
          times_used: number | null
          type: string
          updated_at: string | null
          usage_limit: number | null
          usage_limit_per_customer: number | null
          value: number
        }
        Insert: {
          applies_to?: string | null
          applies_to_ids?: string[] | null
          business_id: string
          code: string
          created_at?: string | null
          currency?: string | null
          description?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          maximum_discount?: number | null
          metadata?: Json | null
          minimum_order?: number | null
          name?: string | null
          starts_at?: string | null
          times_used?: number | null
          type?: string
          updated_at?: string | null
          usage_limit?: number | null
          usage_limit_per_customer?: number | null
          value?: number
        }
        Update: {
          applies_to?: string | null
          applies_to_ids?: string[] | null
          business_id?: string
          code?: string
          created_at?: string | null
          currency?: string | null
          description?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          maximum_discount?: number | null
          metadata?: Json | null
          minimum_order?: number | null
          name?: string | null
          starts_at?: string | null
          times_used?: number | null
          type?: string
          updated_at?: string | null
          usage_limit?: number | null
          usage_limit_per_customer?: number | null
          value?: number
        }
        Relationships: [
          {
            foreignKeyName: "discount_codes_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "discount_codes_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "my_businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      email_logs: {
        Row: {
          business_id: string
          created_at: string | null
          id: string
          metadata: Json | null
          provider_id: string | null
          status: string | null
          subject: string
          template: string | null
          to_email: string
          to_name: string | null
        }
        Insert: {
          business_id: string
          created_at?: string | null
          id?: string
          metadata?: Json | null
          provider_id?: string | null
          status?: string | null
          subject: string
          template?: string | null
          to_email: string
          to_name?: string | null
        }
        Update: {
          business_id?: string
          created_at?: string | null
          id?: string
          metadata?: Json | null
          provider_id?: string | null
          status?: string | null
          subject?: string
          template?: string | null
          to_email?: string
          to_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "email_logs_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_logs_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "my_businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      email_sequence_steps: {
        Row: {
          business_id: string
          created_at: string | null
          delay_days: number | null
          delay_hours: number | null
          html_body: string
          id: string
          name: string | null
          position: number
          preview_text: string | null
          send_time: string | null
          sequence_id: string
          stats: Json | null
          subject: string
          text_body: string | null
          updated_at: string | null
          variables: Json | null
        }
        Insert: {
          business_id: string
          created_at?: string | null
          delay_days?: number | null
          delay_hours?: number | null
          html_body: string
          id?: string
          name?: string | null
          position: number
          preview_text?: string | null
          send_time?: string | null
          sequence_id: string
          stats?: Json | null
          subject: string
          text_body?: string | null
          updated_at?: string | null
          variables?: Json | null
        }
        Update: {
          business_id?: string
          created_at?: string | null
          delay_days?: number | null
          delay_hours?: number | null
          html_body?: string
          id?: string
          name?: string | null
          position?: number
          preview_text?: string | null
          send_time?: string | null
          sequence_id?: string
          stats?: Json | null
          subject?: string
          text_body?: string | null
          updated_at?: string | null
          variables?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "email_sequence_steps_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_sequence_steps_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "my_businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_sequence_steps_sequence_id_fkey"
            columns: ["sequence_id"]
            isOneToOne: false
            referencedRelation: "email_sequences"
            referencedColumns: ["id"]
          },
        ]
      }
      email_sequences: {
        Row: {
          business_id: string
          created_at: string | null
          description: string | null
          id: string
          name: string
          owner_id: string | null
          settings: Json | null
          status: string | null
          total_completed: number | null
          total_enrolled: number | null
          total_unsubscribed: number | null
          trigger_config: Json | null
          trigger_type: string | null
          updated_at: string | null
        }
        Insert: {
          business_id: string
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
          owner_id?: string | null
          settings?: Json | null
          status?: string | null
          total_completed?: number | null
          total_enrolled?: number | null
          total_unsubscribed?: number | null
          trigger_config?: Json | null
          trigger_type?: string | null
          updated_at?: string | null
        }
        Update: {
          business_id?: string
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
          owner_id?: string | null
          settings?: Json | null
          status?: string | null
          total_completed?: number | null
          total_enrolled?: number | null
          total_unsubscribed?: number | null
          trigger_config?: Json | null
          trigger_type?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "email_sequences_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_sequences_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "my_businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      email_templates: {
        Row: {
          business_id: string
          category: string
          created_at: string
          html_body: string
          id: string
          name: string
          owner_id: string
          preview_text: string | null
          subject: string
          text_body: string | null
          updated_at: string
          variables: Json
        }
        Insert: {
          business_id: string
          category?: string
          created_at?: string
          html_body: string
          id?: string
          name: string
          owner_id: string
          preview_text?: string | null
          subject: string
          text_body?: string | null
          updated_at?: string
          variables?: Json
        }
        Update: {
          business_id?: string
          category?: string
          created_at?: string
          html_body?: string
          id?: string
          name?: string
          owner_id?: string
          preview_text?: string | null
          subject?: string
          text_body?: string | null
          updated_at?: string
          variables?: Json
        }
        Relationships: [
          {
            foreignKeyName: "email_templates_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_templates_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "my_businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      email_unsubscribes: {
        Row: {
          business_id: string
          email: string
          id: string
          metadata: Json | null
          reason: string | null
          unsubscribed_at: string | null
        }
        Insert: {
          business_id: string
          email: string
          id?: string
          metadata?: Json | null
          reason?: string | null
          unsubscribed_at?: string | null
        }
        Update: {
          business_id?: string
          email?: string
          id?: string
          metadata?: Json | null
          reason?: string | null
          unsubscribed_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "email_unsubscribes_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_unsubscribes_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "my_businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          browser: string | null
          business_id: string
          city: string | null
          country: string | null
          created_at: string | null
          device_type: string | null
          event_name: string | null
          event_type: string
          id: string
          ip_address: unknown
          latitude: number | null
          longitude: number | null
          os: string | null
          properties: Json | null
          referrer: string | null
          session_id: string | null
          url: string | null
          user_id: string | null
          utm_campaign: string | null
          utm_content: string | null
          utm_medium: string | null
          utm_source: string | null
          utm_term: string | null
          visitor_id: string | null
          website_id: string | null
        }
        Insert: {
          browser?: string | null
          business_id: string
          city?: string | null
          country?: string | null
          created_at?: string | null
          device_type?: string | null
          event_name?: string | null
          event_type: string
          id?: string
          ip_address?: unknown
          latitude?: number | null
          longitude?: number | null
          os?: string | null
          properties?: Json | null
          referrer?: string | null
          session_id?: string | null
          url?: string | null
          user_id?: string | null
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
          visitor_id?: string | null
          website_id?: string | null
        }
        Update: {
          browser?: string | null
          business_id?: string
          city?: string | null
          country?: string | null
          created_at?: string | null
          device_type?: string | null
          event_name?: string | null
          event_type?: string
          id?: string
          ip_address?: unknown
          latitude?: number | null
          longitude?: number | null
          os?: string | null
          properties?: Json | null
          referrer?: string | null
          session_id?: string | null
          url?: string | null
          user_id?: string | null
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
          visitor_id?: string | null
          website_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "events_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "events_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "my_businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "events_website_id_fkey"
            columns: ["website_id"]
            isOneToOne: false
            referencedRelation: "websites"
            referencedColumns: ["id"]
          },
        ]
      }
      feature_flags: {
        Row: {
          created_at: string | null
          description: string | null
          enabled_for_businesses: string[] | null
          enabled_for_plans: string[] | null
          id: string
          is_enabled: boolean | null
          key: string
          metadata: Json | null
          name: string
          rollout_percentage: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          enabled_for_businesses?: string[] | null
          enabled_for_plans?: string[] | null
          id?: string
          is_enabled?: boolean | null
          key: string
          metadata?: Json | null
          name: string
          rollout_percentage?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          enabled_for_businesses?: string[] | null
          enabled_for_plans?: string[] | null
          id?: string
          is_enabled?: boolean | null
          key?: string
          metadata?: Json | null
          name?: string
          rollout_percentage?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      form_responses: {
        Row: {
          business_id: string
          contact_id: string | null
          created_at: string | null
          data: Json
          form_id: string
          id: string
          ip_address: string | null
          referrer: string | null
          user_agent: string | null
        }
        Insert: {
          business_id: string
          contact_id?: string | null
          created_at?: string | null
          data?: Json
          form_id: string
          id?: string
          ip_address?: string | null
          referrer?: string | null
          user_agent?: string | null
        }
        Update: {
          business_id?: string
          contact_id?: string | null
          created_at?: string | null
          data?: Json
          form_id?: string
          id?: string
          ip_address?: string | null
          referrer?: string | null
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "form_responses_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "form_responses_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "my_businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "form_responses_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "form_responses_form_id_fkey"
            columns: ["form_id"]
            isOneToOne: false
            referencedRelation: "forms"
            referencedColumns: ["id"]
          },
        ]
      }
      forms: {
        Row: {
          business_id: string
          created_at: string | null
          description: string | null
          fields: Json
          id: string
          name: string
          redirect_url: string | null
          settings: Json | null
          status: string | null
          style: Json | null
          submissions: number | null
          updated_at: string | null
          webhook_url: string | null
        }
        Insert: {
          business_id: string
          created_at?: string | null
          description?: string | null
          fields?: Json
          id?: string
          name: string
          redirect_url?: string | null
          settings?: Json | null
          status?: string | null
          style?: Json | null
          submissions?: number | null
          updated_at?: string | null
          webhook_url?: string | null
        }
        Update: {
          business_id?: string
          created_at?: string | null
          description?: string | null
          fields?: Json
          id?: string
          name?: string
          redirect_url?: string | null
          settings?: Json | null
          status?: string | null
          style?: Json | null
          submissions?: number | null
          updated_at?: string | null
          webhook_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "forms_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "forms_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "my_businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      funnel_steps: {
        Row: {
          business_id: string
          content: Json
          created_at: string
          funnel_id: string
          id: string
          name: string
          position: number
          seo: Json
          settings: Json
          slug: string
          stats: Json
          type: string
          updated_at: string
        }
        Insert: {
          business_id: string
          content?: Json
          created_at?: string
          funnel_id: string
          id?: string
          name: string
          position?: number
          seo?: Json
          settings?: Json
          slug: string
          stats?: Json
          type?: string
          updated_at?: string
        }
        Update: {
          business_id?: string
          content?: Json
          created_at?: string
          funnel_id?: string
          id?: string
          name?: string
          position?: number
          seo?: Json
          settings?: Json
          slug?: string
          stats?: Json
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "funnel_steps_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "funnel_steps_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "my_businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "funnel_steps_funnel_id_fkey"
            columns: ["funnel_id"]
            isOneToOne: false
            referencedRelation: "funnels"
            referencedColumns: ["id"]
          },
        ]
      }
      funnel_submissions: {
        Row: {
          business_id: string
          city: string | null
          contact_id: string | null
          converted_at: string | null
          country: string | null
          created_at: string | null
          email: string | null
          form_data: Json
          full_name: string | null
          funnel_id: string
          id: string
          ip_address: string | null
          is_converted: boolean | null
          metadata: Json | null
          phone: string | null
          referrer_url: string | null
          source: string | null
          step_id: string | null
          user_agent: string | null
          utm_campaign: string | null
          utm_content: string | null
          utm_medium: string | null
          utm_source: string | null
          utm_term: string | null
        }
        Insert: {
          business_id: string
          city?: string | null
          contact_id?: string | null
          converted_at?: string | null
          country?: string | null
          created_at?: string | null
          email?: string | null
          form_data?: Json
          full_name?: string | null
          funnel_id: string
          id?: string
          ip_address?: string | null
          is_converted?: boolean | null
          metadata?: Json | null
          phone?: string | null
          referrer_url?: string | null
          source?: string | null
          step_id?: string | null
          user_agent?: string | null
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
        }
        Update: {
          business_id?: string
          city?: string | null
          contact_id?: string | null
          converted_at?: string | null
          country?: string | null
          created_at?: string | null
          email?: string | null
          form_data?: Json
          full_name?: string | null
          funnel_id?: string
          id?: string
          ip_address?: string | null
          is_converted?: boolean | null
          metadata?: Json | null
          phone?: string | null
          referrer_url?: string | null
          source?: string | null
          step_id?: string | null
          user_agent?: string | null
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "funnel_submissions_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "funnel_submissions_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "my_businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "funnel_submissions_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "funnel_submissions_funnel_id_fkey"
            columns: ["funnel_id"]
            isOneToOne: false
            referencedRelation: "funnels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "funnel_submissions_step_id_fkey"
            columns: ["step_id"]
            isOneToOne: false
            referencedRelation: "funnel_steps"
            referencedColumns: ["id"]
          },
        ]
      }
      funnels: {
        Row: {
          business_id: string
          created_at: string
          description: string | null
          id: string
          name: string
          owner_id: string
          published_at: string | null
          settings: Json
          slug: string | null
          stats: Json
          status: string
          thumbnail_url: string | null
          type: string
          updated_at: string
        }
        Insert: {
          business_id: string
          created_at?: string
          description?: string | null
          id?: string
          name: string
          owner_id: string
          published_at?: string | null
          settings?: Json
          slug?: string | null
          stats?: Json
          status?: string
          thumbnail_url?: string | null
          type?: string
          updated_at?: string
        }
        Update: {
          business_id?: string
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          owner_id?: string
          published_at?: string | null
          settings?: Json
          slug?: string | null
          stats?: Json
          status?: string
          thumbnail_url?: string | null
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "funnels_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "funnels_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "my_businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      integrations: {
        Row: {
          business_id: string
          config: Json | null
          created_at: string | null
          credentials: Json | null
          error_message: string | null
          id: string
          is_active: boolean | null
          last_synced_at: string | null
          metadata: Json | null
          name: string
          provider: string
          type: string
          updated_at: string | null
        }
        Insert: {
          business_id: string
          config?: Json | null
          created_at?: string | null
          credentials?: Json | null
          error_message?: string | null
          id?: string
          is_active?: boolean | null
          last_synced_at?: string | null
          metadata?: Json | null
          name: string
          provider: string
          type: string
          updated_at?: string | null
        }
        Update: {
          business_id?: string
          config?: Json | null
          created_at?: string | null
          credentials?: Json | null
          error_message?: string | null
          id?: string
          is_active?: boolean | null
          last_synced_at?: string | null
          metadata?: Json | null
          name?: string
          provider?: string
          type?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "integrations_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "integrations_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "my_businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      interactions: {
        Row: {
          body: string | null
          business_id: string
          completed_at: string | null
          contact_id: string
          created_at: string | null
          created_by: string | null
          deal_id: string | null
          direction: string | null
          duration_secs: number | null
          id: string
          metadata: Json | null
          outcome: string | null
          scheduled_at: string | null
          subject: string | null
          type: string
        }
        Insert: {
          body?: string | null
          business_id: string
          completed_at?: string | null
          contact_id: string
          created_at?: string | null
          created_by?: string | null
          deal_id?: string | null
          direction?: string | null
          duration_secs?: number | null
          id?: string
          metadata?: Json | null
          outcome?: string | null
          scheduled_at?: string | null
          subject?: string | null
          type: string
        }
        Update: {
          body?: string | null
          business_id?: string
          completed_at?: string | null
          contact_id?: string
          created_at?: string | null
          created_by?: string | null
          deal_id?: string | null
          direction?: string | null
          duration_secs?: number | null
          id?: string
          metadata?: Json | null
          outcome?: string | null
          scheduled_at?: string | null
          subject?: string | null
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "interactions_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "interactions_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "my_businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "interactions_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "interactions_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
        ]
      }
      invitations: {
        Row: {
          accepted_at: string | null
          business_id: string
          created_at: string | null
          created_by: string | null
          email: string
          expires_at: string | null
          id: string
          invited_by: string
          message: string | null
          metadata: Json | null
          redeemed_at: string | null
          redeemed_by: string | null
          role: string
          status: string
          token: string
        }
        Insert: {
          accepted_at?: string | null
          business_id: string
          created_at?: string | null
          created_by?: string | null
          email: string
          expires_at?: string | null
          id?: string
          invited_by: string
          message?: string | null
          metadata?: Json | null
          redeemed_at?: string | null
          redeemed_by?: string | null
          role?: string
          status?: string
          token?: string
        }
        Update: {
          accepted_at?: string | null
          business_id?: string
          created_at?: string | null
          created_by?: string | null
          email?: string
          expires_at?: string | null
          id?: string
          invited_by?: string
          message?: string | null
          metadata?: Json | null
          redeemed_at?: string | null
          redeemed_by?: string | null
          role?: string
          status?: string
          token?: string
        }
        Relationships: [
          {
            foreignKeyName: "invitations_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invitations_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "my_businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      invoice_items: {
        Row: {
          created_at: string | null
          description: string
          id: string
          invoice_id: string
          quantity: number | null
          total: number | null
          unit_price: number
        }
        Insert: {
          created_at?: string | null
          description: string
          id?: string
          invoice_id: string
          quantity?: number | null
          total?: number | null
          unit_price: number
        }
        Update: {
          created_at?: string | null
          description?: string
          id?: string
          invoice_id?: string
          quantity?: number | null
          total?: number | null
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "invoice_items_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "client_invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          amount: number
          business_id: string
          created_at: string | null
          currency: string
          id: string
          provider: string
          provider_reference: string | null
          status: string
          subscription_id: string | null
        }
        Insert: {
          amount: number
          business_id: string
          created_at?: string | null
          currency?: string
          id?: string
          provider: string
          provider_reference?: string | null
          status: string
          subscription_id?: string | null
        }
        Update: {
          amount?: number
          business_id?: string
          created_at?: string | null
          currency?: string
          id?: string
          provider?: string
          provider_reference?: string | null
          status?: string
          subscription_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "invoices_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "my_businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "subscriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      knowledge_base: {
        Row: {
          author_id: string | null
          category: string
          content: string
          created_at: string | null
          excerpt: string | null
          helpful: number | null
          id: string
          is_featured: boolean | null
          is_published: boolean | null
          not_helpful: number | null
          published_at: string | null
          slug: string
          subcategory: string | null
          tags: string[] | null
          title: string
          updated_at: string | null
          views: number | null
        }
        Insert: {
          author_id?: string | null
          category: string
          content: string
          created_at?: string | null
          excerpt?: string | null
          helpful?: number | null
          id?: string
          is_featured?: boolean | null
          is_published?: boolean | null
          not_helpful?: number | null
          published_at?: string | null
          slug: string
          subcategory?: string | null
          tags?: string[] | null
          title: string
          updated_at?: string | null
          views?: number | null
        }
        Update: {
          author_id?: string | null
          category?: string
          content?: string
          created_at?: string | null
          excerpt?: string | null
          helpful?: number | null
          id?: string
          is_featured?: boolean | null
          is_published?: boolean | null
          not_helpful?: number | null
          published_at?: string | null
          slug?: string
          subcategory?: string | null
          tags?: string[] | null
          title?: string
          updated_at?: string | null
          views?: number | null
        }
        Relationships: []
      }
      leads: {
        Row: {
          business_id: string
          city: string | null
          company: string | null
          contact_id: string | null
          converted_at: string | null
          country: string | null
          created_at: string | null
          email: string | null
          first_name: string | null
          form_id: string | null
          funnel_id: string | null
          id: string
          job_title: string | null
          last_name: string | null
          metadata: Json | null
          notes: string | null
          owner_id: string | null
          phone: string | null
          score: number | null
          source: string | null
          source_detail: string | null
          status: string
          tags: string[] | null
          temperature: string | null
          updated_at: string | null
          utm_campaign: string | null
          utm_medium: string | null
          utm_source: string | null
        }
        Insert: {
          business_id: string
          city?: string | null
          company?: string | null
          contact_id?: string | null
          converted_at?: string | null
          country?: string | null
          created_at?: string | null
          email?: string | null
          first_name?: string | null
          form_id?: string | null
          funnel_id?: string | null
          id?: string
          job_title?: string | null
          last_name?: string | null
          metadata?: Json | null
          notes?: string | null
          owner_id?: string | null
          phone?: string | null
          score?: number | null
          source?: string | null
          source_detail?: string | null
          status?: string
          tags?: string[] | null
          temperature?: string | null
          updated_at?: string | null
          utm_campaign?: string | null
          utm_medium?: string | null
          utm_source?: string | null
        }
        Update: {
          business_id?: string
          city?: string | null
          company?: string | null
          contact_id?: string | null
          converted_at?: string | null
          country?: string | null
          created_at?: string | null
          email?: string | null
          first_name?: string | null
          form_id?: string | null
          funnel_id?: string | null
          id?: string
          job_title?: string | null
          last_name?: string | null
          metadata?: Json | null
          notes?: string | null
          owner_id?: string | null
          phone?: string | null
          score?: number | null
          source?: string | null
          source_detail?: string | null
          status?: string
          tags?: string[] | null
          temperature?: string | null
          updated_at?: string | null
          utm_campaign?: string | null
          utm_medium?: string | null
          utm_source?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "leads_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "my_businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_form_id_fkey"
            columns: ["form_id"]
            isOneToOne: false
            referencedRelation: "forms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_funnel_id_fkey"
            columns: ["funnel_id"]
            isOneToOne: false
            referencedRelation: "funnels"
            referencedColumns: ["id"]
          },
        ]
      }
      list_contacts: {
        Row: {
          contact_id: string
          list_id: string
          metadata: Json | null
          source: string | null
          status: string | null
          subscribed_at: string | null
          unsubscribed_at: string | null
        }
        Insert: {
          contact_id: string
          list_id: string
          metadata?: Json | null
          source?: string | null
          status?: string | null
          subscribed_at?: string | null
          unsubscribed_at?: string | null
        }
        Update: {
          contact_id?: string
          list_id?: string
          metadata?: Json | null
          source?: string | null
          status?: string | null
          subscribed_at?: string | null
          unsubscribed_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "list_contacts_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "list_contacts_list_id_fkey"
            columns: ["list_id"]
            isOneToOne: false
            referencedRelation: "subscriber_lists"
            referencedColumns: ["id"]
          },
        ]
      }
      marketplace_listings: {
        Row: {
          category: string
          created_at: string | null
          currency: string
          delivery_days: number | null
          description: string | null
          faq: Json | null
          features: Json | null
          gallery: Json | null
          id: string
          is_featured: boolean | null
          is_platform: boolean | null
          metadata: Json | null
          price: number
          price_type: string
          revisions: number | null
          sale_price: number | null
          short_desc: string | null
          slug: string
          sort_order: number | null
          status: string
          subcategory: string | null
          tags: string[] | null
          thumbnail_url: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          category: string
          created_at?: string | null
          currency?: string
          delivery_days?: number | null
          description?: string | null
          faq?: Json | null
          features?: Json | null
          gallery?: Json | null
          id?: string
          is_featured?: boolean | null
          is_platform?: boolean | null
          metadata?: Json | null
          price?: number
          price_type?: string
          revisions?: number | null
          sale_price?: number | null
          short_desc?: string | null
          slug: string
          sort_order?: number | null
          status?: string
          subcategory?: string | null
          tags?: string[] | null
          thumbnail_url?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          category?: string
          created_at?: string | null
          currency?: string
          delivery_days?: number | null
          description?: string | null
          faq?: Json | null
          features?: Json | null
          gallery?: Json | null
          id?: string
          is_featured?: boolean | null
          is_platform?: boolean | null
          metadata?: Json | null
          price?: number
          price_type?: string
          revisions?: number | null
          sale_price?: number | null
          short_desc?: string | null
          slug?: string
          sort_order?: number | null
          status?: string
          subcategory?: string | null
          tags?: string[] | null
          thumbnail_url?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      marketplace_orders: {
        Row: {
          brief: Json | null
          business_id: string
          buyer_id: string
          cancel_reason: string | null
          cancelled_at: string | null
          completed_at: string | null
          created_at: string | null
          currency: string
          delivery_date: string | null
          delivery_files: Json | null
          id: string
          listing_id: string
          metadata: Json | null
          order_number: string
          quantity: number | null
          rating: number | null
          requirements: string | null
          review: string | null
          reviewed_at: string | null
          revisions_used: number | null
          status: string
          total_price: number
          unit_price: number
          updated_at: string | null
        }
        Insert: {
          brief?: Json | null
          business_id: string
          buyer_id: string
          cancel_reason?: string | null
          cancelled_at?: string | null
          completed_at?: string | null
          created_at?: string | null
          currency?: string
          delivery_date?: string | null
          delivery_files?: Json | null
          id?: string
          listing_id: string
          metadata?: Json | null
          order_number: string
          quantity?: number | null
          rating?: number | null
          requirements?: string | null
          review?: string | null
          reviewed_at?: string | null
          revisions_used?: number | null
          status?: string
          total_price: number
          unit_price: number
          updated_at?: string | null
        }
        Update: {
          brief?: Json | null
          business_id?: string
          buyer_id?: string
          cancel_reason?: string | null
          cancelled_at?: string | null
          completed_at?: string | null
          created_at?: string | null
          currency?: string
          delivery_date?: string | null
          delivery_files?: Json | null
          id?: string
          listing_id?: string
          metadata?: Json | null
          order_number?: string
          quantity?: number | null
          rating?: number | null
          requirements?: string | null
          review?: string | null
          reviewed_at?: string | null
          revisions_used?: number | null
          status?: string
          total_price?: number
          unit_price?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "marketplace_orders_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "marketplace_orders_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "my_businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "marketplace_orders_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "marketplace_listings"
            referencedColumns: ["id"]
          },
        ]
      }
      media: {
        Row: {
          alt_text: string | null
          business_id: string
          created_at: string | null
          file_path: string
          file_size: number | null
          file_type: string | null
          file_url: string
          folder: string | null
          id: string
          metadata: Json | null
          mime_type: string | null
          name: string
          uploaded_by: string | null
        }
        Insert: {
          alt_text?: string | null
          business_id: string
          created_at?: string | null
          file_path: string
          file_size?: number | null
          file_type?: string | null
          file_url: string
          folder?: string | null
          id?: string
          metadata?: Json | null
          mime_type?: string | null
          name: string
          uploaded_by?: string | null
        }
        Update: {
          alt_text?: string | null
          business_id?: string
          created_at?: string | null
          file_path?: string
          file_size?: number | null
          file_type?: string | null
          file_url?: string
          folder?: string | null
          id?: string
          metadata?: Json | null
          mime_type?: string | null
          name?: string
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "media_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "media_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "my_businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          attachments: Json | null
          business_id: string
          content: string
          conversation_id: string
          created_at: string | null
          deleted_at: string | null
          edited_at: string | null
          id: string
          is_deleted: boolean | null
          is_edited: boolean | null
          metadata: Json | null
          reactions: Json | null
          reply_to_id: string | null
          sender_id: string
          type: string | null
        }
        Insert: {
          attachments?: Json | null
          business_id: string
          content: string
          conversation_id: string
          created_at?: string | null
          deleted_at?: string | null
          edited_at?: string | null
          id?: string
          is_deleted?: boolean | null
          is_edited?: boolean | null
          metadata?: Json | null
          reactions?: Json | null
          reply_to_id?: string | null
          sender_id: string
          type?: string | null
        }
        Update: {
          attachments?: Json | null
          business_id?: string
          content?: string
          conversation_id?: string
          created_at?: string | null
          deleted_at?: string | null
          edited_at?: string | null
          id?: string
          is_deleted?: boolean | null
          is_edited?: boolean | null
          metadata?: Json | null
          reactions?: Json | null
          reply_to_id?: string | null
          sender_id?: string
          type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "messages_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "my_businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_reply_to_id_fkey"
            columns: ["reply_to_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          action_url: string | null
          business_id: string
          category: string
          created_at: string | null
          id: string
          is_read: boolean | null
          message: string
          metadata: Json | null
          title: string
          type: string
          user_id: string | null
        }
        Insert: {
          action_url?: string | null
          business_id: string
          category?: string
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          message: string
          metadata?: Json | null
          title: string
          type?: string
          user_id?: string | null
        }
        Update: {
          action_url?: string | null
          business_id?: string
          category?: string
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          message?: string
          metadata?: Json | null
          title?: string
          type?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notifications_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "my_businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      onboarding_progress: {
        Row: {
          business_id: string
          completed_at: string | null
          completed_steps: Json | null
          created_at: string | null
          current_step: number | null
          id: string
          is_complete: boolean | null
          metadata: Json | null
          skipped_steps: Json | null
          updated_at: string | null
        }
        Insert: {
          business_id: string
          completed_at?: string | null
          completed_steps?: Json | null
          created_at?: string | null
          current_step?: number | null
          id?: string
          is_complete?: boolean | null
          metadata?: Json | null
          skipped_steps?: Json | null
          updated_at?: string | null
        }
        Update: {
          business_id?: string
          completed_at?: string | null
          completed_steps?: Json | null
          created_at?: string | null
          current_step?: number | null
          id?: string
          is_complete?: boolean | null
          metadata?: Json | null
          skipped_steps?: Json | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "onboarding_progress_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: true
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "onboarding_progress_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: true
            referencedRelation: "my_businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      order_messages: {
        Row: {
          attachments: Json | null
          created_at: string | null
          id: string
          is_system: boolean | null
          message: string
          order_id: string
          sender_id: string
        }
        Insert: {
          attachments?: Json | null
          created_at?: string | null
          id?: string
          is_system?: boolean | null
          message: string
          order_id: string
          sender_id: string
        }
        Update: {
          attachments?: Json | null
          created_at?: string | null
          id?: string
          is_system?: boolean | null
          message?: string
          order_id?: string
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "order_messages_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "marketplace_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          address: string | null
          business_type: string | null
          city: string | null
          country: string
          created_at: string
          currency: string
          description: string | null
          email: string | null
          id: string
          industry: string | null
          is_verified: boolean
          legal_name: string | null
          logo_url: string | null
          metadata: Json
          name: string
          onboarding_completed: boolean
          onboarding_step: number
          owner_id: string
          phone: string | null
          registration_number: string | null
          slug: string
          state: string | null
          status: string
          tax_id: string | null
          timezone: string | null
          updated_at: string
          website_url: string | null
        }
        Insert: {
          address?: string | null
          business_type?: string | null
          city?: string | null
          country?: string
          created_at?: string
          currency?: string
          description?: string | null
          email?: string | null
          id?: string
          industry?: string | null
          is_verified?: boolean
          legal_name?: string | null
          logo_url?: string | null
          metadata?: Json
          name: string
          onboarding_completed?: boolean
          onboarding_step?: number
          owner_id: string
          phone?: string | null
          registration_number?: string | null
          slug: string
          state?: string | null
          status?: string
          tax_id?: string | null
          timezone?: string | null
          updated_at?: string
          website_url?: string | null
        }
        Update: {
          address?: string | null
          business_type?: string | null
          city?: string | null
          country?: string
          created_at?: string
          currency?: string
          description?: string | null
          email?: string | null
          id?: string
          industry?: string | null
          is_verified?: boolean
          legal_name?: string | null
          logo_url?: string | null
          metadata?: Json
          name?: string
          onboarding_completed?: boolean
          onboarding_step?: number
          owner_id?: string
          phone?: string | null
          registration_number?: string | null
          slug?: string
          state?: string | null
          status?: string
          tax_id?: string | null
          timezone?: string | null
          updated_at?: string
          website_url?: string | null
        }
        Relationships: []
      }
      page_versions: {
        Row: {
          business_id: string
          content: Json
          created_at: string
          id: string
          page_id: string
          saved_by: string | null
          version: number
        }
        Insert: {
          business_id: string
          content?: Json
          created_at?: string
          id?: string
          page_id: string
          saved_by?: string | null
          version: number
        }
        Update: {
          business_id?: string
          content?: Json
          created_at?: string
          id?: string
          page_id?: string
          saved_by?: string | null
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "page_versions_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "page_versions_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "my_businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "page_versions_page_id_fkey"
            columns: ["page_id"]
            isOneToOne: false
            referencedRelation: "web_pages"
            referencedColumns: ["id"]
          },
        ]
      }
      pages: {
        Row: {
          content: Json | null
          created_at: string | null
          id: string
          is_published: boolean | null
          meta: Json | null
          page_order: number | null
          seo_description: string | null
          seo_title: string | null
          site_id: string
          slug: string
          title: string
          updated_at: string | null
        }
        Insert: {
          content?: Json | null
          created_at?: string | null
          id?: string
          is_published?: boolean | null
          meta?: Json | null
          page_order?: number | null
          seo_description?: string | null
          seo_title?: string | null
          site_id: string
          slug: string
          title: string
          updated_at?: string | null
        }
        Update: {
          content?: Json | null
          created_at?: string | null
          id?: string
          is_published?: boolean | null
          meta?: Json | null
          page_order?: number | null
          seo_description?: string | null
          seo_title?: string | null
          site_id?: string
          slug?: string
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pages_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_transactions: {
        Row: {
          account_name: string | null
          account_number: string | null
          amount: number
          bank_name: string | null
          business_id: string
          created_at: string | null
          currency: string
          description: string | null
          entity_id: string | null
          entity_type: string | null
          failed_at: string | null
          fee: number | null
          id: string
          metadata: Json | null
          net_amount: number | null
          paid_at: string | null
          payment_method: string | null
          provider: string
          provider_customer_id: string | null
          provider_reference: string | null
          reference: string
          refund_reason: string | null
          refunded_at: string | null
          status: string
          type: string
          updated_at: string | null
          user_id: string | null
          webhook_data: Json | null
        }
        Insert: {
          account_name?: string | null
          account_number?: string | null
          amount: number
          bank_name?: string | null
          business_id: string
          created_at?: string | null
          currency?: string
          description?: string | null
          entity_id?: string | null
          entity_type?: string | null
          failed_at?: string | null
          fee?: number | null
          id?: string
          metadata?: Json | null
          net_amount?: number | null
          paid_at?: string | null
          payment_method?: string | null
          provider: string
          provider_customer_id?: string | null
          provider_reference?: string | null
          reference: string
          refund_reason?: string | null
          refunded_at?: string | null
          status?: string
          type: string
          updated_at?: string | null
          user_id?: string | null
          webhook_data?: Json | null
        }
        Update: {
          account_name?: string | null
          account_number?: string | null
          amount?: number
          bank_name?: string | null
          business_id?: string
          created_at?: string | null
          currency?: string
          description?: string | null
          entity_id?: string | null
          entity_type?: string | null
          failed_at?: string | null
          fee?: number | null
          id?: string
          metadata?: Json | null
          net_amount?: number | null
          paid_at?: string | null
          payment_method?: string | null
          provider?: string
          provider_customer_id?: string | null
          provider_reference?: string | null
          reference?: string
          refund_reason?: string | null
          refunded_at?: string | null
          status?: string
          type?: string
          updated_at?: string | null
          user_id?: string | null
          webhook_data?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "payment_transactions_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_transactions_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "my_businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      payout_requests: {
        Row: {
          account_name: string | null
          account_number: string | null
          amount: number
          bank_name: string | null
          created_at: string | null
          currency: string
          id: string
          metadata: Json | null
          notes: string | null
          processed_at: string | null
          processed_by: string | null
          status: string
          user_id: string
        }
        Insert: {
          account_name?: string | null
          account_number?: string | null
          amount: number
          bank_name?: string | null
          created_at?: string | null
          currency?: string
          id?: string
          metadata?: Json | null
          notes?: string | null
          processed_at?: string | null
          processed_by?: string | null
          status?: string
          user_id: string
        }
        Update: {
          account_name?: string | null
          account_number?: string | null
          amount?: number
          bank_name?: string | null
          created_at?: string | null
          currency?: string
          id?: string
          metadata?: Json | null
          notes?: string | null
          processed_at?: string | null
          processed_by?: string | null
          status?: string
          user_id?: string
        }
        Relationships: []
      }
      permission_roles: {
        Row: {
          business_id: string | null
          color: string | null
          created_at: string | null
          description: string | null
          id: string
          is_system: boolean | null
          name: string
          permissions: Json | null
          updated_at: string | null
        }
        Insert: {
          business_id?: string | null
          color?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_system?: boolean | null
          name: string
          permissions?: Json | null
          updated_at?: string | null
        }
        Update: {
          business_id?: string | null
          color?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_system?: boolean | null
          name?: string
          permissions?: Json | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "permission_roles_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "permission_roles_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "my_businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      pipeline_stages: {
        Row: {
          business_id: string
          color: string
          created_at: string
          id: string
          name: string
          pipeline_id: string
          position: number
          probability: number
        }
        Insert: {
          business_id: string
          color?: string
          created_at?: string
          id?: string
          name: string
          pipeline_id: string
          position?: number
          probability?: number
        }
        Update: {
          business_id?: string
          color?: string
          created_at?: string
          id?: string
          name?: string
          pipeline_id?: string
          position?: number
          probability?: number
        }
        Relationships: [
          {
            foreignKeyName: "pipeline_stages_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pipeline_stages_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "my_businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pipeline_stages_pipeline_id_fkey"
            columns: ["pipeline_id"]
            isOneToOne: false
            referencedRelation: "pipelines"
            referencedColumns: ["id"]
          },
        ]
      }
      pipelines: {
        Row: {
          business_id: string
          created_at: string
          description: string | null
          id: string
          is_default: boolean
          name: string
          updated_at: string
        }
        Insert: {
          business_id: string
          created_at?: string
          description?: string | null
          id?: string
          is_default?: boolean
          name: string
          updated_at?: string
        }
        Update: {
          business_id?: string
          created_at?: string
          description?: string | null
          id?: string
          is_default?: boolean
          name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "pipelines_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pipelines_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "my_businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      plan_addons: {
        Row: {
          created_at: string | null
          currency: string | null
          description: string | null
          feature_key: string
          feature_value: Json | null
          id: string
          interval: string | null
          is_active: boolean | null
          key: string
          name: string
          price: number
          sort_order: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          currency?: string | null
          description?: string | null
          feature_key: string
          feature_value?: Json | null
          id?: string
          interval?: string | null
          is_active?: boolean | null
          key: string
          name: string
          price?: number
          sort_order?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          currency?: string | null
          description?: string | null
          feature_key?: string
          feature_value?: Json | null
          id?: string
          interval?: string | null
          is_active?: boolean | null
          key?: string
          name?: string
          price?: number
          sort_order?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      plan_limits: {
        Row: {
          advanced_analytics: boolean | null
          ai_tokens_monthly: number | null
          api_calls_monthly: number | null
          campaigns_limit: number | null
          contacts_limit: number | null
          created_at: string | null
          custom_domains_limit: number | null
          email_sends_monthly: number | null
          funnels_limit: number | null
          id: string
          marketplace_orders: number | null
          plan_id: string
          priority_support: boolean | null
          remove_branding: boolean | null
          social_accounts_limit: number | null
          storage_gb: number | null
          team_members_limit: number | null
          websites_limit: number | null
          white_label: boolean | null
          workflows_limit: number | null
        }
        Insert: {
          advanced_analytics?: boolean | null
          ai_tokens_monthly?: number | null
          api_calls_monthly?: number | null
          campaigns_limit?: number | null
          contacts_limit?: number | null
          created_at?: string | null
          custom_domains_limit?: number | null
          email_sends_monthly?: number | null
          funnels_limit?: number | null
          id?: string
          marketplace_orders?: number | null
          plan_id: string
          priority_support?: boolean | null
          remove_branding?: boolean | null
          social_accounts_limit?: number | null
          storage_gb?: number | null
          team_members_limit?: number | null
          websites_limit?: number | null
          white_label?: boolean | null
          workflows_limit?: number | null
        }
        Update: {
          advanced_analytics?: boolean | null
          ai_tokens_monthly?: number | null
          api_calls_monthly?: number | null
          campaigns_limit?: number | null
          contacts_limit?: number | null
          created_at?: string | null
          custom_domains_limit?: number | null
          email_sends_monthly?: number | null
          funnels_limit?: number | null
          id?: string
          marketplace_orders?: number | null
          plan_id?: string
          priority_support?: boolean | null
          remove_branding?: boolean | null
          social_accounts_limit?: number | null
          storage_gb?: number | null
          team_members_limit?: number | null
          websites_limit?: number | null
          white_label?: boolean | null
          workflows_limit?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "plan_limits_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["id"]
          },
        ]
      }
      plans: {
        Row: {
          code: string
          created_at: string | null
          currency: string
          features: Json
          id: string
          interval: string
          is_active: boolean | null
          name: string
          price: number
        }
        Insert: {
          code: string
          created_at?: string | null
          currency?: string
          features?: Json
          id?: string
          interval: string
          is_active?: boolean | null
          name: string
          price?: number
        }
        Update: {
          code?: string
          created_at?: string | null
          currency?: string
          features?: Json
          id?: string
          interval?: string
          is_active?: boolean | null
          name?: string
          price?: number
        }
        Relationships: []
      }
      platform_admins: {
        Row: {
          created_at: string | null
          id: string
          is_active: boolean | null
          level: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          level?: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          level?: string
          user_id?: string
        }
        Relationships: []
      }
      platform_audit_log: {
        Row: {
          action: string
          admin_id: string | null
          created_at: string | null
          details: Json | null
          id: string
          ip_address: string | null
          target_email: string | null
          target_id: string | null
          target_type: string
        }
        Insert: {
          action: string
          admin_id?: string | null
          created_at?: string | null
          details?: Json | null
          id?: string
          ip_address?: string | null
          target_email?: string | null
          target_id?: string | null
          target_type: string
        }
        Update: {
          action?: string
          admin_id?: string | null
          created_at?: string | null
          details?: Json | null
          id?: string
          ip_address?: string | null
          target_email?: string | null
          target_id?: string | null
          target_type?: string
        }
        Relationships: []
      }
      platform_settings: {
        Row: {
          description: string | null
          id: string
          key: string
          updated_at: string | null
          updated_by: string | null
          value: Json
        }
        Insert: {
          description?: string | null
          id?: string
          key: string
          updated_at?: string | null
          updated_by?: string | null
          value: Json
        }
        Update: {
          description?: string | null
          id?: string
          key?: string
          updated_at?: string | null
          updated_by?: string | null
          value?: Json
        }
        Relationships: []
      }
      product_variants: {
        Row: {
          business_id: string
          compare_price: number | null
          cost_price: number | null
          created_at: string | null
          id: string
          image_url: string | null
          is_active: boolean | null
          is_default: boolean | null
          name: string
          options: Json | null
          price: number | null
          product_id: string
          sku: string | null
          stock_quantity: number | null
          updated_at: string | null
          weight: number | null
        }
        Insert: {
          business_id: string
          compare_price?: number | null
          cost_price?: number | null
          created_at?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          is_default?: boolean | null
          name: string
          options?: Json | null
          price?: number | null
          product_id: string
          sku?: string | null
          stock_quantity?: number | null
          updated_at?: string | null
          weight?: number | null
        }
        Update: {
          business_id?: string
          compare_price?: number | null
          cost_price?: number | null
          created_at?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          is_default?: boolean | null
          name?: string
          options?: Json | null
          price?: number | null
          product_id?: string
          sku?: string | null
          stock_quantity?: number | null
          updated_at?: string | null
          weight?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "product_variants_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_variants_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "my_businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_variants_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          business_id: string
          category: string | null
          compare_price: number | null
          cost_price: number | null
          created_at: string | null
          currency: string | null
          description: string | null
          digital_file_url: string | null
          dimensions: Json | null
          id: string
          images: string[] | null
          is_digital: boolean | null
          is_featured: boolean | null
          is_unlimited: boolean | null
          metadata: Json | null
          name: string
          price: number
          published_at: string | null
          seo: Json | null
          short_description: string | null
          sku: string | null
          slug: string
          status: string | null
          stock_quantity: number | null
          tags: string[] | null
          thumbnail_url: string | null
          track_stock: boolean | null
          type: string | null
          updated_at: string | null
          weight: number | null
        }
        Insert: {
          business_id: string
          category?: string | null
          compare_price?: number | null
          cost_price?: number | null
          created_at?: string | null
          currency?: string | null
          description?: string | null
          digital_file_url?: string | null
          dimensions?: Json | null
          id?: string
          images?: string[] | null
          is_digital?: boolean | null
          is_featured?: boolean | null
          is_unlimited?: boolean | null
          metadata?: Json | null
          name: string
          price?: number
          published_at?: string | null
          seo?: Json | null
          short_description?: string | null
          sku?: string | null
          slug: string
          status?: string | null
          stock_quantity?: number | null
          tags?: string[] | null
          thumbnail_url?: string | null
          track_stock?: boolean | null
          type?: string | null
          updated_at?: string | null
          weight?: number | null
        }
        Update: {
          business_id?: string
          category?: string | null
          compare_price?: number | null
          cost_price?: number | null
          created_at?: string | null
          currency?: string | null
          description?: string | null
          digital_file_url?: string | null
          dimensions?: Json | null
          id?: string
          images?: string[] | null
          is_digital?: boolean | null
          is_featured?: boolean | null
          is_unlimited?: boolean | null
          metadata?: Json | null
          name?: string
          price?: number
          published_at?: string | null
          seo?: Json | null
          short_description?: string | null
          sku?: string | null
          slug?: string
          status?: string | null
          stock_quantity?: number | null
          tags?: string[] | null
          thumbnail_url?: string | null
          track_stock?: boolean | null
          type?: string | null
          updated_at?: string | null
          weight?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "products_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "my_businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          business_id: string | null
          created_at: string | null
          email: string
          id: string
          name: string | null
          onboarding_completed: boolean | null
          phone: string | null
          role: string | null
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          business_id?: string | null
          created_at?: string | null
          email: string
          id: string
          name?: string | null
          onboarding_completed?: boolean | null
          phone?: string | null
          role?: string | null
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          business_id?: string | null
          created_at?: string | null
          email?: string
          id?: string
          name?: string | null
          onboarding_completed?: boolean | null
          phone?: string | null
          role?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      projects: {
        Row: {
          assigned_to: string | null
          budget: number | null
          business_id: string
          client_id: string | null
          color: string | null
          created_at: string | null
          description: string | null
          end_date: string | null
          id: string
          is_archived: boolean | null
          name: string
          priority: string | null
          progress: number | null
          start_date: string | null
          status: string | null
          tags: string[] | null
          updated_at: string | null
        }
        Insert: {
          assigned_to?: string | null
          budget?: number | null
          business_id: string
          client_id?: string | null
          color?: string | null
          created_at?: string | null
          description?: string | null
          end_date?: string | null
          id?: string
          is_archived?: boolean | null
          name: string
          priority?: string | null
          progress?: number | null
          start_date?: string | null
          status?: string | null
          tags?: string[] | null
          updated_at?: string | null
        }
        Update: {
          assigned_to?: string | null
          budget?: number | null
          business_id?: string
          client_id?: string | null
          color?: string | null
          created_at?: string | null
          description?: string | null
          end_date?: string | null
          id?: string
          is_archived?: boolean | null
          name?: string
          priority?: string | null
          progress?: number | null
          start_date?: string | null
          status?: string | null
          tags?: string[] | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "projects_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "my_businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      rate_limits: {
        Row: {
          business_id: string
          count: number | null
          created_at: string | null
          endpoint: string
          id: string
          identifier: string | null
          window_end: string | null
          window_start: string | null
        }
        Insert: {
          business_id: string
          count?: number | null
          created_at?: string | null
          endpoint: string
          id?: string
          identifier?: string | null
          window_end?: string | null
          window_start?: string | null
        }
        Update: {
          business_id?: string
          count?: number | null
          created_at?: string | null
          endpoint?: string
          id?: string
          identifier?: string | null
          window_end?: string | null
          window_start?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "rate_limits_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rate_limits_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "my_businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      referral_clicks: {
        Row: {
          converted: boolean | null
          created_at: string | null
          id: string
          ip_hash: string | null
          landing_url: string | null
          referral_id: string
          referrer_url: string | null
          user_agent: string | null
        }
        Insert: {
          converted?: boolean | null
          created_at?: string | null
          id?: string
          ip_hash?: string | null
          landing_url?: string | null
          referral_id: string
          referrer_url?: string | null
          user_agent?: string | null
        }
        Update: {
          converted?: boolean | null
          created_at?: string | null
          id?: string
          ip_hash?: string | null
          landing_url?: string | null
          referral_id?: string
          referrer_url?: string | null
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "referral_clicks_referral_id_fkey"
            columns: ["referral_id"]
            isOneToOne: false
            referencedRelation: "referrals"
            referencedColumns: ["id"]
          },
        ]
      }
      referral_commissions: {
        Row: {
          amount: number
          approved_at: string | null
          created_at: string | null
          currency: string
          id: string
          metadata: Json | null
          order_id: string | null
          paid_at: string | null
          payout_ref: string | null
          referral_id: string
          referrer_id: string
          status: string
          transaction_id: string | null
        }
        Insert: {
          amount: number
          approved_at?: string | null
          created_at?: string | null
          currency?: string
          id?: string
          metadata?: Json | null
          order_id?: string | null
          paid_at?: string | null
          payout_ref?: string | null
          referral_id: string
          referrer_id: string
          status?: string
          transaction_id?: string | null
        }
        Update: {
          amount?: number
          approved_at?: string | null
          created_at?: string | null
          currency?: string
          id?: string
          metadata?: Json | null
          order_id?: string | null
          paid_at?: string | null
          payout_ref?: string | null
          referral_id?: string
          referrer_id?: string
          status?: string
          transaction_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "referral_commissions_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "marketplace_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referral_commissions_referral_id_fkey"
            columns: ["referral_id"]
            isOneToOne: false
            referencedRelation: "referrals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referral_commissions_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "payment_transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      referral_programs: {
        Row: {
          commission_type: string
          commission_value: number
          cookie_days: number | null
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          min_payout: number | null
          name: string
          payout_currency: string | null
          rules: Json | null
          updated_at: string | null
        }
        Insert: {
          commission_type?: string
          commission_value?: number
          cookie_days?: number | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          min_payout?: number | null
          name: string
          payout_currency?: string | null
          rules?: Json | null
          updated_at?: string | null
        }
        Update: {
          commission_type?: string
          commission_value?: number
          cookie_days?: number | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          min_payout?: number | null
          name?: string
          payout_currency?: string | null
          rules?: Json | null
          updated_at?: string | null
        }
        Relationships: []
      }
      referrals: {
        Row: {
          business_id: string | null
          clicks: number | null
          code: string
          conversions: number | null
          created_at: string | null
          id: string
          link: string | null
          program_id: string
          referred_id: string | null
          referrer_id: string
          signups: number | null
          status: string
          total_earned: number | null
          updated_at: string | null
        }
        Insert: {
          business_id?: string | null
          clicks?: number | null
          code: string
          conversions?: number | null
          created_at?: string | null
          id?: string
          link?: string | null
          program_id: string
          referred_id?: string | null
          referrer_id: string
          signups?: number | null
          status?: string
          total_earned?: number | null
          updated_at?: string | null
        }
        Update: {
          business_id?: string | null
          clicks?: number | null
          code?: string
          conversions?: number | null
          created_at?: string | null
          id?: string
          link?: string | null
          program_id?: string
          referred_id?: string | null
          referrer_id?: string
          signups?: number | null
          status?: string
          total_earned?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "referrals_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referrals_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "my_businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referrals_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "referral_programs"
            referencedColumns: ["id"]
          },
        ]
      }
      sections: {
        Row: {
          content: Json
          created_at: string | null
          id: string
          page_id: string
          sort_order: number
          type: string
          updated_at: string | null
        }
        Insert: {
          content?: Json
          created_at?: string | null
          id?: string
          page_id: string
          sort_order?: number
          type: string
          updated_at?: string | null
        }
        Update: {
          content?: Json
          created_at?: string | null
          id?: string
          page_id?: string
          sort_order?: number
          type?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sections_page_id_fkey"
            columns: ["page_id"]
            isOneToOne: false
            referencedRelation: "pages"
            referencedColumns: ["id"]
          },
        ]
      }
      sequence_enrollments: {
        Row: {
          business_id: string
          completed_at: string | null
          contact_id: string
          current_step: number | null
          enrolled_at: string | null
          id: string
          metadata: Json | null
          next_send_at: string | null
          sequence_id: string
          status: string | null
          unsubscribed_at: string | null
        }
        Insert: {
          business_id: string
          completed_at?: string | null
          contact_id: string
          current_step?: number | null
          enrolled_at?: string | null
          id?: string
          metadata?: Json | null
          next_send_at?: string | null
          sequence_id: string
          status?: string | null
          unsubscribed_at?: string | null
        }
        Update: {
          business_id?: string
          completed_at?: string | null
          contact_id?: string
          current_step?: number | null
          enrolled_at?: string | null
          id?: string
          metadata?: Json | null
          next_send_at?: string | null
          sequence_id?: string
          status?: string | null
          unsubscribed_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sequence_enrollments_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sequence_enrollments_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "my_businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sequence_enrollments_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sequence_enrollments_sequence_id_fkey"
            columns: ["sequence_id"]
            isOneToOne: false
            referencedRelation: "email_sequences"
            referencedColumns: ["id"]
          },
        ]
      }
      services: {
        Row: {
          business_id: string
          category: string | null
          created_at: string | null
          currency: string | null
          description: string | null
          id: string
          is_active: boolean | null
          metadata: Json | null
          name: string
          price: number | null
          price_type: string | null
          tags: string[] | null
          updated_at: string | null
        }
        Insert: {
          business_id: string
          category?: string | null
          created_at?: string | null
          currency?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          metadata?: Json | null
          name: string
          price?: number | null
          price_type?: string | null
          tags?: string[] | null
          updated_at?: string | null
        }
        Update: {
          business_id?: string
          category?: string | null
          created_at?: string | null
          currency?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          metadata?: Json | null
          name?: string
          price?: number | null
          price_type?: string | null
          tags?: string[] | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "services_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "services_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "my_businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      sites: {
        Row: {
          business_id: string
          created_at: string | null
          domain: string | null
          id: string
          is_published: boolean | null
          name: string
          published_at: string | null
          settings: Json | null
          slug: string
          theme: Json | null
          updated_at: string | null
        }
        Insert: {
          business_id: string
          created_at?: string | null
          domain?: string | null
          id?: string
          is_published?: boolean | null
          name: string
          published_at?: string | null
          settings?: Json | null
          slug: string
          theme?: Json | null
          updated_at?: string | null
        }
        Update: {
          business_id?: string
          created_at?: string | null
          domain?: string | null
          id?: string
          is_published?: boolean | null
          name?: string
          published_at?: string | null
          settings?: Json | null
          slug?: string
          theme?: Json | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sites_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sites_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "my_businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      social_accounts: {
        Row: {
          access_token: string | null
          account_id: string | null
          account_name: string
          business_id: string
          created_at: string | null
          followers: number | null
          id: string
          is_active: boolean | null
          metadata: Json | null
          platform: string
          refresh_token: string | null
          token_expires_at: string | null
          updated_at: string | null
        }
        Insert: {
          access_token?: string | null
          account_id?: string | null
          account_name: string
          business_id: string
          created_at?: string | null
          followers?: number | null
          id?: string
          is_active?: boolean | null
          metadata?: Json | null
          platform: string
          refresh_token?: string | null
          token_expires_at?: string | null
          updated_at?: string | null
        }
        Update: {
          access_token?: string | null
          account_id?: string | null
          account_name?: string
          business_id?: string
          created_at?: string | null
          followers?: number | null
          id?: string
          is_active?: boolean | null
          metadata?: Json | null
          platform?: string
          refresh_token?: string | null
          token_expires_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "social_accounts_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "social_accounts_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "my_businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      social_posts: {
        Row: {
          account_id: string | null
          business_id: string
          content: string
          created_at: string | null
          created_by: string | null
          engagement: Json | null
          external_id: string | null
          id: string
          media_urls: string[] | null
          platforms: string[] | null
          published_at: string | null
          scheduled_at: string | null
          status: string | null
          title: string | null
          updated_at: string | null
        }
        Insert: {
          account_id?: string | null
          business_id: string
          content: string
          created_at?: string | null
          created_by?: string | null
          engagement?: Json | null
          external_id?: string | null
          id?: string
          media_urls?: string[] | null
          platforms?: string[] | null
          published_at?: string | null
          scheduled_at?: string | null
          status?: string | null
          title?: string | null
          updated_at?: string | null
        }
        Update: {
          account_id?: string | null
          business_id?: string
          content?: string
          created_at?: string | null
          created_by?: string | null
          engagement?: Json | null
          external_id?: string | null
          id?: string
          media_urls?: string[] | null
          platforms?: string[] | null
          published_at?: string | null
          scheduled_at?: string | null
          status?: string | null
          title?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "social_posts_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "social_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "social_posts_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "social_posts_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "my_businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      subscriber_lists: {
        Row: {
          business_id: string
          count: number | null
          created_at: string | null
          description: string | null
          double_optin: boolean | null
          filter_rules: Json | null
          id: string
          is_active: boolean | null
          name: string
          owner_id: string | null
          type: string | null
          updated_at: string | null
        }
        Insert: {
          business_id: string
          count?: number | null
          created_at?: string | null
          description?: string | null
          double_optin?: boolean | null
          filter_rules?: Json | null
          id?: string
          is_active?: boolean | null
          name: string
          owner_id?: string | null
          type?: string | null
          updated_at?: string | null
        }
        Update: {
          business_id?: string
          count?: number | null
          created_at?: string | null
          description?: string | null
          double_optin?: boolean | null
          filter_rules?: Json | null
          id?: string
          is_active?: boolean | null
          name?: string
          owner_id?: string | null
          type?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "subscriber_lists_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscriber_lists_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "my_businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      subscription_plans: {
        Row: {
          ai_tokens_monthly: number | null
          billing_period: string | null
          created_at: string | null
          currency: string | null
          description: string | null
          features: Json
          id: string
          is_enterprise: boolean | null
          is_popular: boolean | null
          limits: Json
          max_contacts: number | null
          max_storage_gb: number | null
          max_users: number | null
          max_websites: number | null
          name: string
          paystack_plan_code: string | null
          price_ngn: number
          price_usd: number
          slug: string
          sort_order: number | null
          status: string | null
          stripe_price_id: string | null
          tagline: string | null
          updated_at: string | null
        }
        Insert: {
          ai_tokens_monthly?: number | null
          billing_period?: string | null
          created_at?: string | null
          currency?: string | null
          description?: string | null
          features?: Json
          id?: string
          is_enterprise?: boolean | null
          is_popular?: boolean | null
          limits?: Json
          max_contacts?: number | null
          max_storage_gb?: number | null
          max_users?: number | null
          max_websites?: number | null
          name: string
          paystack_plan_code?: string | null
          price_ngn?: number
          price_usd?: number
          slug: string
          sort_order?: number | null
          status?: string | null
          stripe_price_id?: string | null
          tagline?: string | null
          updated_at?: string | null
        }
        Update: {
          ai_tokens_monthly?: number | null
          billing_period?: string | null
          created_at?: string | null
          currency?: string | null
          description?: string | null
          features?: Json
          id?: string
          is_enterprise?: boolean | null
          is_popular?: boolean | null
          limits?: Json
          max_contacts?: number | null
          max_storage_gb?: number | null
          max_users?: number | null
          max_websites?: number | null
          name?: string
          paystack_plan_code?: string | null
          price_ngn?: number
          price_usd?: number
          slug?: string
          sort_order?: number | null
          status?: string | null
          stripe_price_id?: string | null
          tagline?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          amount: number | null
          billing_period: string | null
          business_id: string
          cancel_at: string | null
          cancelled_at: string | null
          created_at: string | null
          currency: string | null
          current_period_end: string | null
          current_period_start: string | null
          ends_at: string | null
          id: string
          metadata: Json | null
          payment_method: string | null
          plan_id: string
          provider: string
          provider_customer_id: string | null
          provider_subscription_id: string | null
          reference_id: string | null
          starts_at: string | null
          status: string
          updated_at: string | null
        }
        Insert: {
          amount?: number | null
          billing_period?: string | null
          business_id: string
          cancel_at?: string | null
          cancelled_at?: string | null
          created_at?: string | null
          currency?: string | null
          current_period_end?: string | null
          current_period_start?: string | null
          ends_at?: string | null
          id?: string
          metadata?: Json | null
          payment_method?: string | null
          plan_id: string
          provider: string
          provider_customer_id?: string | null
          provider_subscription_id?: string | null
          reference_id?: string | null
          starts_at?: string | null
          status: string
          updated_at?: string | null
        }
        Update: {
          amount?: number | null
          billing_period?: string | null
          business_id?: string
          cancel_at?: string | null
          cancelled_at?: string | null
          created_at?: string | null
          currency?: string | null
          current_period_end?: string | null
          current_period_start?: string | null
          ends_at?: string | null
          id?: string
          metadata?: Json | null
          payment_method?: string | null
          plan_id?: string
          provider?: string
          provider_customer_id?: string | null
          provider_subscription_id?: string | null
          reference_id?: string | null
          starts_at?: string | null
          status?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscriptions_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "my_businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscriptions_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["id"]
          },
        ]
      }
      support_ticket_messages: {
        Row: {
          created_at: string | null
          id: string
          message: string
          sender_id: string
          ticket_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          message: string
          sender_id: string
          ticket_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          message?: string
          sender_id?: string
          ticket_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "support_ticket_messages_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "support_tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      support_tickets: {
        Row: {
          business_id: string
          created_at: string | null
          created_by: string
          description: string
          id: string
          priority: string
          status: string
          subject: string
          updated_at: string | null
        }
        Insert: {
          business_id: string
          created_at?: string | null
          created_by: string
          description: string
          id?: string
          priority?: string
          status?: string
          subject: string
          updated_at?: string | null
        }
        Update: {
          business_id?: string
          created_at?: string | null
          created_by?: string
          description?: string
          id?: string
          priority?: string
          status?: string
          subject?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "support_tickets_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "support_tickets_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "my_businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      tags: {
        Row: {
          business_id: string
          color: string
          created_at: string
          id: string
          name: string
        }
        Insert: {
          business_id: string
          color?: string
          created_at?: string
          id?: string
          name: string
        }
        Update: {
          business_id?: string
          color?: string
          created_at?: string
          id?: string
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "tags_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tags_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "my_businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      tasks: {
        Row: {
          actual_hours: number | null
          assigned_to: string | null
          business_id: string
          client_id: string | null
          completed_at: string | null
          created_at: string | null
          description: string | null
          due_date: string | null
          estimated_hours: number | null
          id: string
          metadata: Json | null
          priority: string
          project_id: string | null
          status: string
          tags: string[] | null
          title: string
          updated_at: string | null
        }
        Insert: {
          actual_hours?: number | null
          assigned_to?: string | null
          business_id: string
          client_id?: string | null
          completed_at?: string | null
          created_at?: string | null
          description?: string | null
          due_date?: string | null
          estimated_hours?: number | null
          id?: string
          metadata?: Json | null
          priority?: string
          project_id?: string | null
          status?: string
          tags?: string[] | null
          title: string
          updated_at?: string | null
        }
        Update: {
          actual_hours?: number | null
          assigned_to?: string | null
          business_id?: string
          client_id?: string | null
          completed_at?: string | null
          created_at?: string | null
          description?: string | null
          due_date?: string | null
          estimated_hours?: number | null
          id?: string
          metadata?: Json | null
          priority?: string
          project_id?: string | null
          status?: string
          tags?: string[] | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tasks_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "my_businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      team_members: {
        Row: {
          business_id: string
          created_at: string | null
          id: string
          invited_by: string | null
          is_active: boolean | null
          role: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          business_id: string
          created_at?: string | null
          id?: string
          invited_by?: string | null
          is_active?: boolean | null
          role?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          business_id?: string
          created_at?: string | null
          id?: string
          invited_by?: string | null
          is_active?: boolean | null
          role?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_members_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_members_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "my_businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      templates: {
        Row: {
          category: string | null
          created_at: string | null
          id: string
          is_active: boolean | null
          name: string
          preview_image: string | null
          schema: Json
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          preview_image?: string | null
          schema: Json
        }
        Update: {
          category?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          preview_image?: string | null
          schema?: Json
        }
        Relationships: []
      }
      transactions: {
        Row: {
          amount: number
          business_id: string
          created_at: string | null
          currency: string | null
          description: string | null
          id: string
          invoice_number: string | null
          invoice_url: string | null
          metadata: Json | null
          payment_provider: string | null
          provider_reference: string | null
          provider_response: Json | null
          receipt_url: string | null
          status: string | null
          subscription_id: string | null
          type: string
          updated_at: string | null
        }
        Insert: {
          amount: number
          business_id: string
          created_at?: string | null
          currency?: string | null
          description?: string | null
          id?: string
          invoice_number?: string | null
          invoice_url?: string | null
          metadata?: Json | null
          payment_provider?: string | null
          provider_reference?: string | null
          provider_response?: Json | null
          receipt_url?: string | null
          status?: string | null
          subscription_id?: string | null
          type: string
          updated_at?: string | null
        }
        Update: {
          amount?: number
          business_id?: string
          created_at?: string | null
          currency?: string | null
          description?: string | null
          id?: string
          invoice_number?: string | null
          invoice_url?: string | null
          metadata?: Json | null
          payment_provider?: string | null
          provider_reference?: string | null
          provider_response?: Json | null
          receipt_url?: string | null
          status?: string | null
          subscription_id?: string | null
          type?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "transactions_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "my_businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "subscriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      transcripts: {
        Row: {
          content: string | null
          created_at: string | null
          id: string
          language: string | null
          video_id: string
        }
        Insert: {
          content?: string | null
          created_at?: string | null
          id?: string
          language?: string | null
          video_id: string
        }
        Update: {
          content?: string | null
          created_at?: string | null
          id?: string
          language?: string | null
          video_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "transcripts_video_id_fkey"
            columns: ["video_id"]
            isOneToOne: false
            referencedRelation: "videos"
            referencedColumns: ["id"]
          },
        ]
      }
      usage_metrics: {
        Row: {
          business_id: string
          created_at: string | null
          id: string
          metadata: Json | null
          metric_type: string
          period_end: string
          period_start: string
          updated_at: string | null
          value: number | null
        }
        Insert: {
          business_id: string
          created_at?: string | null
          id?: string
          metadata?: Json | null
          metric_type: string
          period_end: string
          period_start: string
          updated_at?: string | null
          value?: number | null
        }
        Update: {
          business_id?: string
          created_at?: string | null
          id?: string
          metadata?: Json | null
          metric_type?: string
          period_end?: string
          period_start?: string
          updated_at?: string | null
          value?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "usage_metrics_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "usage_metrics_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "my_businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      usage_quotas: {
        Row: {
          ai_tokens_limit: number | null
          ai_tokens_used: number | null
          api_calls: number | null
          business_id: string
          contacts_count: number | null
          created_at: string | null
          emails_sent: number | null
          funnels_count: number | null
          id: string
          period_end: string
          period_start: string
          storage_bytes: number | null
          updated_at: string | null
          websites_count: number | null
        }
        Insert: {
          ai_tokens_limit?: number | null
          ai_tokens_used?: number | null
          api_calls?: number | null
          business_id: string
          contacts_count?: number | null
          created_at?: string | null
          emails_sent?: number | null
          funnels_count?: number | null
          id?: string
          period_end: string
          period_start: string
          storage_bytes?: number | null
          updated_at?: string | null
          websites_count?: number | null
        }
        Update: {
          ai_tokens_limit?: number | null
          ai_tokens_used?: number | null
          api_calls?: number | null
          business_id?: string
          contacts_count?: number | null
          created_at?: string | null
          emails_sent?: number | null
          funnels_count?: number | null
          id?: string
          period_end?: string
          period_start?: string
          storage_bytes?: number | null
          updated_at?: string | null
          websites_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "usage_quotas_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "usage_quotas_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "my_businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      user_profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          full_name: string | null
          id: string
          phone: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          full_name?: string | null
          id?: string
          phone?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          full_name?: string | null
          id?: string
          phone?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_role_assignments: {
        Row: {
          assigned_by: string | null
          business_id: string
          created_at: string | null
          id: string
          role_id: string
          user_id: string
        }
        Insert: {
          assigned_by?: string | null
          business_id: string
          created_at?: string | null
          id?: string
          role_id: string
          user_id: string
        }
        Update: {
          assigned_by?: string | null
          business_id?: string
          created_at?: string | null
          id?: string
          role_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_role_assignments_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_role_assignments_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "my_businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_role_assignments_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "permission_roles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_sessions: {
        Row: {
          browser: string | null
          business_id: string | null
          city: string | null
          country: string | null
          device_type: string | null
          ended_at: string | null
          id: string
          ip_address: unknown
          is_active: boolean | null
          last_seen_at: string | null
          metadata: Json | null
          os: string | null
          started_at: string | null
          user_agent: string | null
          user_id: string
        }
        Insert: {
          browser?: string | null
          business_id?: string | null
          city?: string | null
          country?: string | null
          device_type?: string | null
          ended_at?: string | null
          id?: string
          ip_address?: unknown
          is_active?: boolean | null
          last_seen_at?: string | null
          metadata?: Json | null
          os?: string | null
          started_at?: string | null
          user_agent?: string | null
          user_id: string
        }
        Update: {
          browser?: string | null
          business_id?: string | null
          city?: string | null
          country?: string | null
          device_type?: string | null
          ended_at?: string | null
          id?: string
          ip_address?: unknown
          is_active?: boolean | null
          last_seen_at?: string | null
          metadata?: Json | null
          os?: string | null
          started_at?: string | null
          user_agent?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_sessions_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_sessions_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "my_businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      video_clips: {
        Row: {
          aspect_ratio: string | null
          business_id: string
          caption_file_url: string | null
          created_at: string | null
          created_by: string | null
          description: string | null
          duration_seconds: number | null
          end_time_seconds: number
          export_formats: Json | null
          file_path: string | null
          file_url: string | null
          has_captions: boolean | null
          highlighted_keywords: string[] | null
          id: string
          platform_targets: string[] | null
          start_time_seconds: number
          status: string | null
          thumbnail_url: string | null
          title: string | null
          updated_at: string | null
          video_id: string
          viral_score: number | null
        }
        Insert: {
          aspect_ratio?: string | null
          business_id: string
          caption_file_url?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          duration_seconds?: number | null
          end_time_seconds: number
          export_formats?: Json | null
          file_path?: string | null
          file_url?: string | null
          has_captions?: boolean | null
          highlighted_keywords?: string[] | null
          id?: string
          platform_targets?: string[] | null
          start_time_seconds: number
          status?: string | null
          thumbnail_url?: string | null
          title?: string | null
          updated_at?: string | null
          video_id: string
          viral_score?: number | null
        }
        Update: {
          aspect_ratio?: string | null
          business_id?: string
          caption_file_url?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          duration_seconds?: number | null
          end_time_seconds?: number
          export_formats?: Json | null
          file_path?: string | null
          file_url?: string | null
          has_captions?: boolean | null
          highlighted_keywords?: string[] | null
          id?: string
          platform_targets?: string[] | null
          start_time_seconds?: number
          status?: string | null
          thumbnail_url?: string | null
          title?: string | null
          updated_at?: string | null
          video_id?: string
          viral_score?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "video_clips_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "video_clips_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "my_businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "video_clips_video_id_fkey"
            columns: ["video_id"]
            isOneToOne: false
            referencedRelation: "videos"
            referencedColumns: ["id"]
          },
        ]
      }
      videos: {
        Row: {
          business_id: string
          created_at: string | null
          description: string | null
          duration_seconds: number | null
          file_path: string
          file_size_bytes: number | null
          file_url: string | null
          id: string
          metadata: Json | null
          source_type: string | null
          source_url: string | null
          status: string
          thumbnail_url: string | null
          title: string
          transcript_status: string | null
          transcription: string | null
          updated_at: string | null
          uploaded_by: string
        }
        Insert: {
          business_id: string
          created_at?: string | null
          description?: string | null
          duration_seconds?: number | null
          file_path: string
          file_size_bytes?: number | null
          file_url?: string | null
          id?: string
          metadata?: Json | null
          source_type?: string | null
          source_url?: string | null
          status?: string
          thumbnail_url?: string | null
          title: string
          transcript_status?: string | null
          transcription?: string | null
          updated_at?: string | null
          uploaded_by: string
        }
        Update: {
          business_id?: string
          created_at?: string | null
          description?: string | null
          duration_seconds?: number | null
          file_path?: string
          file_size_bytes?: number | null
          file_url?: string | null
          id?: string
          metadata?: Json | null
          source_type?: string | null
          source_url?: string | null
          status?: string
          thumbnail_url?: string | null
          title?: string
          transcript_status?: string | null
          transcription?: string | null
          updated_at?: string | null
          uploaded_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "videos_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "videos_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "my_businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      web_pages: {
        Row: {
          business_id: string
          content: Json
          created_at: string
          id: string
          parent_id: string | null
          published_at: string | null
          seo: Json
          settings: Json
          slug: string
          status: string
          title: string
          type: string
          updated_at: string
          version: number
          website_id: string
        }
        Insert: {
          business_id: string
          content?: Json
          created_at?: string
          id?: string
          parent_id?: string | null
          published_at?: string | null
          seo?: Json
          settings?: Json
          slug: string
          status?: string
          title: string
          type?: string
          updated_at?: string
          version?: number
          website_id: string
        }
        Update: {
          business_id?: string
          content?: Json
          created_at?: string
          id?: string
          parent_id?: string | null
          published_at?: string | null
          seo?: Json
          settings?: Json
          slug?: string
          status?: string
          title?: string
          type?: string
          updated_at?: string
          version?: number
          website_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "web_pages_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "web_pages_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "my_businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "web_pages_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "web_pages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "web_pages_website_id_fkey"
            columns: ["website_id"]
            isOneToOne: false
            referencedRelation: "websites"
            referencedColumns: ["id"]
          },
        ]
      }
      webhook_logs: {
        Row: {
          attempt: number | null
          business_id: string
          duration_ms: number | null
          event: string
          fired_at: string | null
          http_status: number | null
          id: string
          payload: Json
          response: string | null
          status: string
          webhook_id: string
        }
        Insert: {
          attempt?: number | null
          business_id: string
          duration_ms?: number | null
          event: string
          fired_at?: string | null
          http_status?: number | null
          id?: string
          payload: Json
          response?: string | null
          status?: string
          webhook_id: string
        }
        Update: {
          attempt?: number | null
          business_id?: string
          duration_ms?: number | null
          event?: string
          fired_at?: string | null
          http_status?: number | null
          id?: string
          payload?: Json
          response?: string | null
          status?: string
          webhook_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "webhook_logs_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "webhook_logs_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "my_businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "webhook_logs_webhook_id_fkey"
            columns: ["webhook_id"]
            isOneToOne: false
            referencedRelation: "webhooks"
            referencedColumns: ["id"]
          },
        ]
      }
      webhooks: {
        Row: {
          business_id: string
          created_at: string | null
          events: string[]
          failure_count: number | null
          headers: Json | null
          id: string
          is_active: boolean | null
          last_fired_at: string | null
          metadata: Json | null
          name: string
          retry_count: number | null
          secret: string | null
          timeout_sec: number | null
          updated_at: string | null
          url: string
        }
        Insert: {
          business_id: string
          created_at?: string | null
          events?: string[]
          failure_count?: number | null
          headers?: Json | null
          id?: string
          is_active?: boolean | null
          last_fired_at?: string | null
          metadata?: Json | null
          name: string
          retry_count?: number | null
          secret?: string | null
          timeout_sec?: number | null
          updated_at?: string | null
          url: string
        }
        Update: {
          business_id?: string
          created_at?: string | null
          events?: string[]
          failure_count?: number | null
          headers?: Json | null
          id?: string
          is_active?: boolean | null
          last_fired_at?: string | null
          metadata?: Json | null
          name?: string
          retry_count?: number | null
          secret?: string | null
          timeout_sec?: number | null
          updated_at?: string | null
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "webhooks_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "webhooks_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "my_businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      website_analytics: {
        Row: {
          browser: string | null
          business_id: string
          city: string | null
          country: string | null
          created_at: string | null
          device_type: string | null
          duration_sec: number | null
          event_name: string | null
          event_type: string
          event_value: number | null
          funnel_id: string | null
          id: string
          is_bounce: boolean | null
          metadata: Json | null
          os: string | null
          page_url: string
          referrer: string | null
          session_id: string | null
          utm_campaign: string | null
          utm_medium: string | null
          utm_source: string | null
          visitor_id: string | null
          website_id: string | null
        }
        Insert: {
          browser?: string | null
          business_id: string
          city?: string | null
          country?: string | null
          created_at?: string | null
          device_type?: string | null
          duration_sec?: number | null
          event_name?: string | null
          event_type?: string
          event_value?: number | null
          funnel_id?: string | null
          id?: string
          is_bounce?: boolean | null
          metadata?: Json | null
          os?: string | null
          page_url: string
          referrer?: string | null
          session_id?: string | null
          utm_campaign?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          visitor_id?: string | null
          website_id?: string | null
        }
        Update: {
          browser?: string | null
          business_id?: string
          city?: string | null
          country?: string | null
          created_at?: string | null
          device_type?: string | null
          duration_sec?: number | null
          event_name?: string | null
          event_type?: string
          event_value?: number | null
          funnel_id?: string | null
          id?: string
          is_bounce?: boolean | null
          metadata?: Json | null
          os?: string | null
          page_url?: string
          referrer?: string | null
          session_id?: string | null
          utm_campaign?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          visitor_id?: string | null
          website_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "website_analytics_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "website_analytics_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "my_businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "website_analytics_funnel_id_fkey"
            columns: ["funnel_id"]
            isOneToOne: false
            referencedRelation: "funnels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "website_analytics_website_id_fkey"
            columns: ["website_id"]
            isOneToOne: false
            referencedRelation: "websites"
            referencedColumns: ["id"]
          },
        ]
      }
      websites: {
        Row: {
          analytics_id: string | null
          business_id: string
          created_at: string
          description: string | null
          favicon_url: string | null
          id: string
          metadata: Json | null
          name: string
          owner_id: string
          published_at: string | null
          seo: Json
          seo_description: string | null
          seo_title: string | null
          settings: Json
          ssl_certificate: string | null
          status: string
          template_id: string | null
          updated_at: string
        }
        Insert: {
          analytics_id?: string | null
          business_id: string
          created_at?: string
          description?: string | null
          favicon_url?: string | null
          id?: string
          metadata?: Json | null
          name: string
          owner_id: string
          published_at?: string | null
          seo?: Json
          seo_description?: string | null
          seo_title?: string | null
          settings?: Json
          ssl_certificate?: string | null
          status?: string
          template_id?: string | null
          updated_at?: string
        }
        Update: {
          analytics_id?: string | null
          business_id?: string
          created_at?: string
          description?: string | null
          favicon_url?: string | null
          id?: string
          metadata?: Json | null
          name?: string
          owner_id?: string
          published_at?: string | null
          seo?: Json
          seo_description?: string | null
          seo_title?: string | null
          settings?: Json
          ssl_certificate?: string | null
          status?: string
          template_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "websites_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "websites_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "my_businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      workflow_executions: {
        Row: {
          business_id: string
          completed_at: string | null
          contact_id: string | null
          context: Json
          deal_id: string | null
          error: string | null
          id: string
          started_at: string
          status: string
          workflow_id: string
        }
        Insert: {
          business_id: string
          completed_at?: string | null
          contact_id?: string | null
          context?: Json
          deal_id?: string | null
          error?: string | null
          id?: string
          started_at?: string
          status?: string
          workflow_id: string
        }
        Update: {
          business_id?: string
          completed_at?: string | null
          contact_id?: string | null
          context?: Json
          deal_id?: string | null
          error?: string | null
          id?: string
          started_at?: string
          status?: string
          workflow_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workflow_executions_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workflow_executions_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "my_businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workflow_executions_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workflow_executions_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workflow_executions_workflow_id_fkey"
            columns: ["workflow_id"]
            isOneToOne: false
            referencedRelation: "workflows"
            referencedColumns: ["id"]
          },
        ]
      }
      workflow_step_logs: {
        Row: {
          action_type: string
          error: string | null
          executed_at: string
          execution_id: string
          id: string
          input: Json
          output: Json
          status: string
          step_index: number
        }
        Insert: {
          action_type: string
          error?: string | null
          executed_at?: string
          execution_id: string
          id?: string
          input?: Json
          output?: Json
          status?: string
          step_index: number
        }
        Update: {
          action_type?: string
          error?: string | null
          executed_at?: string
          execution_id?: string
          id?: string
          input?: Json
          output?: Json
          status?: string
          step_index?: number
        }
        Relationships: [
          {
            foreignKeyName: "workflow_step_logs_execution_id_fkey"
            columns: ["execution_id"]
            isOneToOne: false
            referencedRelation: "workflow_executions"
            referencedColumns: ["id"]
          },
        ]
      }
      workflows: {
        Row: {
          actions: Json
          business_id: string
          created_at: string
          description: string | null
          id: string
          last_run_at: string | null
          name: string
          owner_id: string
          run_count: number
          settings: Json
          status: string
          trigger_config: Json
          trigger_type: string
          updated_at: string
        }
        Insert: {
          actions?: Json
          business_id: string
          created_at?: string
          description?: string | null
          id?: string
          last_run_at?: string | null
          name: string
          owner_id: string
          run_count?: number
          settings?: Json
          status?: string
          trigger_config?: Json
          trigger_type: string
          updated_at?: string
        }
        Update: {
          actions?: Json
          business_id?: string
          created_at?: string
          description?: string | null
          id?: string
          last_run_at?: string | null
          name?: string
          owner_id?: string
          run_count?: number
          settings?: Json
          status?: string
          trigger_config?: Json
          trigger_type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "workflows_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workflows_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "my_businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      workspace_members: {
        Row: {
          business_id: string
          created_at: string | null
          id: string
          is_active: boolean | null
          role: string
          user_id: string
          workspace_id: string
        }
        Insert: {
          business_id: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          role?: string
          user_id: string
          workspace_id: string
        }
        Update: {
          business_id?: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          role?: string
          user_id?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workspace_members_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workspace_members_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "my_businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workspace_members_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      workspaces: {
        Row: {
          business_id: string
          color: string | null
          created_at: string | null
          created_by: string | null
          description: string | null
          icon: string | null
          id: string
          is_default: boolean | null
          name: string
          settings: Json | null
          slug: string
          updated_at: string | null
        }
        Insert: {
          business_id: string
          color?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          is_default?: boolean | null
          name: string
          settings?: Json | null
          slug: string
          updated_at?: string | null
        }
        Update: {
          business_id?: string
          color?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          is_default?: boolean | null
          name?: string
          settings?: Json | null
          slug?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "workspaces_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workspaces_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "my_businesses"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      my_businesses: {
        Row: {
          address: Json | null
          business_name: string | null
          country: string | null
          created_at: string | null
          created_by: string | null
          currency: string | null
          description: string | null
          id: string | null
          industry: string | null
          is_active: boolean | null
          my_membership_active: boolean | null
          my_role: Database["public"]["Enums"]["business_role"] | null
          name: string | null
          owner_id: string | null
          settings: Json | null
          slug: string | null
          status: Database["public"]["Enums"]["business_status"] | null
          type: string | null
          updated_at: string | null
          user_id: string | null
          website: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      accept_invitation: { Args: { p_token: string }; Returns: Json }
      calculate_lead_score: { Args: { p_lead_id: string }; Returns: number }
      cleanup_expired_rate_limits: { Args: never; Returns: undefined }
      convert_lead_to_contact: { Args: { p_lead_id: string }; Returns: string }
      create_business: {
        Args: {
          p_country?: string
          p_currency?: string
          p_industry?: string
          p_name: string
        }
        Returns: {
          address: Json | null
          brand_color: string | null
          business_name: string | null
          business_type: string | null
          city: string | null
          country: string | null
          created_at: string
          created_by: string | null
          currency: string | null
          custom_domain: string | null
          description: string | null
          domain: string | null
          email: string | null
          id: string
          industry: string
          is_active: boolean | null
          is_verified: boolean | null
          legal_name: string | null
          logo_url: string | null
          metadata: Json | null
          name: string
          onboarding_completed: boolean | null
          onboarding_step: number | null
          owner_id: string
          phone: string | null
          registration_number: string | null
          settings: Json | null
          slug: string
          state: string | null
          status: Database["public"]["Enums"]["business_status"]
          tax_id: string | null
          team_size: number | null
          timezone: string | null
          type: string
          updated_at: string
          user_id: string | null
          website: string | null
          website_url: string | null
        }
        SetofOptions: {
          from: "*"
          to: "businesses"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      create_default_workspace: {
        Args: { p_business_id: string; p_owner_id: string }
        Returns: string
      }
      create_notification: {
        Args: {
          p_action_url?: string
          p_business_id: string
          p_category?: string
          p_message: string
          p_title: string
          p_type?: string
          p_user_id: string
        }
        Returns: string
      }
      enroll_contact_in_sequence: {
        Args: {
          p_business_id: string
          p_contact_id: string
          p_sequence_id: string
        }
        Returns: string
      }
      generate_slug: { Args: { "": string }; Returns: string }
      generate_unique_business_slug: {
        Args: { base_name: string }
        Returns: string
      }
      get_analytics_range: {
        Args: { p_business_id: string; p_end: string; p_start: string }
        Returns: {
          conversions: number
          date: string
          new_contacts: number
          page_views: number
          revenue: number
          visitors: number
        }[]
      }
      get_business_stats: { Args: { p_business_id: string }; Returns: Json }
      get_dashboard_stats: { Args: { p_business_id: string }; Returns: Json }
      get_lead_stats: {
        Args: { p_business_id: string; p_days?: number }
        Returns: Json
      }
      get_user_business_id: { Args: never; Returns: string }
      get_user_businesses: {
        Args: { p_user_id: string }
        Returns: {
          business_id: string
          business_name: string
          role: string
          slug: string
          status: string
        }[]
      }
      has_business_role: {
        Args: {
          _business_id: string
          _roles: Database["public"]["Enums"]["business_role"][]
          _user_id: string
        }
        Returns: boolean
      }
      has_team_role: {
        Args: { _business_id: string; _roles: string[] }
        Returns: boolean
      }
      increment_usage_metric: {
        Args: {
          p_business_id: string
          p_increment?: number
          p_metric_type: string
        }
        Returns: undefined
      }
      insert_or_update_business: {
        Args: { p_business_data: Json }
        Returns: {
          id: string
          message: string
          success: boolean
        }[]
      }
      is_biz_member: { Args: { bid: string }; Returns: boolean }
      is_business_member:
        | { Args: { _business_id: string; _user_id: string }; Returns: boolean }
        | { Args: { bid: string }; Returns: boolean }
      is_business_owner: { Args: { _business_id: string }; Returns: boolean }
      is_platform_admin: { Args: never; Returns: boolean }
      is_team_member: { Args: { _business_id: string }; Returns: boolean }
      log_activity: {
        Args: {
          p_action: string
          p_business_id: string
          p_entity_id?: string
          p_entity_name?: string
          p_entity_type: string
          p_metadata?: Json
        }
        Returns: undefined
      }
      log_ai_execution: {
        Args: {
          p_agent_type: string
          p_business_id: string
          p_cost_usd?: number
          p_created_by?: string
          p_execution_time_ms?: number
          p_metadata?: Json
          p_output: string
          p_prompt: string
          p_tokens_used?: number
        }
        Returns: string
      }
      log_audit: {
        Args: {
          p_action: string
          p_business_id: string
          p_changes?: Json
          p_error_message?: string
          p_ip_address?: unknown
          p_resource_id?: string
          p_resource_type: string
          p_status?: string
          p_user_agent?: string
          p_user_id: string
        }
        Returns: undefined
      }
      mark_notifications_read: {
        Args: { p_business_id: string }
        Returns: undefined
      }
      slugify: { Args: { input: string }; Returns: string }
      user_business_id: { Args: never; Returns: string }
      user_has_business_access: {
        Args: { p_business_id: string; p_min_role?: string; p_user_id: string }
        Returns: boolean
      }
      user_is_member: { Args: { bid: string }; Returns: boolean }
      validate_discount_code: {
        Args: { p_business_id: string; p_code: string; p_order_total?: number }
        Returns: Json
      }
    }
    Enums: {
      business_role: "owner" | "admin" | "manager" | "member"
      business_status: "active" | "inactive" | "suspended"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      business_role: ["owner", "admin", "manager", "member"],
      business_status: ["active", "inactive", "suspended"],
    },
  },
} as const
