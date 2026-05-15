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
... (file truncated)