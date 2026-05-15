export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      businesses: {
        Row: {
          id: string
          name: string
          slug: string
          domain: string | null
          custom_domain: string | null
          logo_url: string | null
          brand_color: string
          currency: string
          timezone: string
          country: string | null
          industry: string | null
          team_size: number | null
          phone: string | null
          metadata: Json
          created_at: string
          updated_at: string
          created_by: string
        }
        Insert: {
          id?: string
          name: string
          slug: string
          domain?: string | null
          custom_domain?: string | null
          logo_url?: string | null
          brand_color?: string
          currency?: string
          timezone?: string
          country?: string | null
          industry?: string | null
          team_size?: number | null
          phone?: string | null
          metadata?: Json
          created_at?: string
          updated_at?: string
          created_by: string
        }
        Update: {
          id?: string
          name?: string
          slug?: string
          domain?: string | null
          custom_domain?: string | null
          logo_url?: string | null
          brand_color?: string
          currency?: string
          timezone?: string
          country?: string | null
          industry?: string | null
          team_size?: number | null
          phone?: string | null
          metadata?: Json
          created_at?: string
          updated_at?: string
          created_by?: string
        }
      }
      business_users: {
        Row: {
          id: string
          business_id: string
          user_id: string
          role: string
          invited_at: string
          joined_at: string | null
          invited_by: string | null
          status: string
          metadata: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          business_id: string
          user_id: string
          role?: string
          invited_at?: string
          joined_at?: string | null
          invited_by?: string | null
          status?: string
          metadata?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          business_id?: string
          user_id?: string
          role?: string
          invited_at?: string
          joined_at?: string | null
          invited_by?: string | null
          status?: string
          metadata?: Json
          created_at?: string
          updated_at?: string
        }
      }
      contacts: {
        Row: {
          id: string
          business_id: string
          email: string | null
          phone: string | null
          first_name: string | null
          last_name: string | null
          company_name: string | null
          job_title: string | null
          lead_score: number
          status: string
          source: string | null
          last_contact_at: string | null
          next_followup_at: string | null
          tags: string[]
          metadata: Json
          created_at: string
          updated_at: string
          created_by: string | null
          updated_by: string | null
        }
        Insert: {
          id?: string
          business_id: string
          email?: string | null
          phone?: string | null
          first_name?: string | null
          last_name?: string | null
          company_name?: string | null
          job_title?: string | null
          lead_score?: number
          status?: string
          source?: string | null
          last_contact_at?: string | null
          next_followup_at?: string | null
          tags?: string[]
          metadata?: Json
          created_at?: string
          updated_at?: string
          created_by?: string | null
          updated_by?: string | null
        }
        Update: {
          id?: string
          business_id?: string
          email?: string | null
          phone?: string | null
          first_name?: string | null
          last_name?: string | null
          company_name?: string | null
          job_title?: string | null
          lead_score?: number
          status?: string
          source?: string | null
          last_contact_at?: string | null
          next_followup_at?: string | null
          tags?: string[]
          metadata?: Json
          created_at?: string
          updated_at?: string
          created_by?: string | null
          updated_by?: string | null
        }
      }
      deals: {
        Row: {
          id: string
          business_id: string
          contact_id: string
          title: string
          description: string | null
          value: number
          currency: string
          status: string
          stage: string
          probability: number
          expected_close_date: string | null
          closed_at: string | null
          metadata: Json
          created_at: string
          updated_at: string
          created_by: string | null
          updated_by: string | null
        }
        Insert: {
          id?: string
          business_id: string
          contact_id: string
          title: string
          description?: string | null
          value: number
          currency?: string
          status?: string
          stage?: string
          probability?: number
          expected_close_date?: string | null
          closed_at?: string | null
          metadata?: Json
          created_at?: string
          updated_at?: string
          created_by?: string | null
          updated_by?: string | null
        }
        Update: {
          id?: string
          business_id?: string
          contact_id?: string
          title?: string
          description?: string | null
          value?: number
          currency?: string
          status?: string
          stage?: string
          probability?: number
          expected_close_date?: string | null
          closed_at?: string | null
          metadata?: Json
          created_at?: string
          updated_at?: string
          created_by?: string | null
          updated_by?: string | null
        }
      }
      subscriptions: {
        Row: {
          id: string
          business_id: string
          plan_id: string
          status: string
          currency: string
          amount: number
          billing_period: string
          current_period_start: string
          current_period_end: string
          cancel_at: string | null
          cancelled_at: string | null
          payment_method: string | null
          reference_id: string | null
          metadata: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          business_id: string
          plan_id: string
          status?: string
          currency?: string
          amount: number
          billing_period?: string
          current_period_start: string
          current_period_end: string
          cancel_at?: string | null
          cancelled_at?: string | null
          payment_method?: string | null
          reference_id?: string | null
          metadata?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          business_id?: string
          plan_id?: string
          status?: string
          currency?: string
          amount?: number
          billing_period?: string
          current_period_start?: string
          current_period_end?: string
          cancel_at?: string | null
          cancelled_at?: string | null
          payment_method?: string | null
          reference_id?: string | null
          metadata?: Json
          created_at?: string
          updated_at?: string
        }
      }
      transactions: {
        Row: {
          id: string
          business_id: string
          subscription_id: string | null
          type: string
          amount: number
          currency: string
          status: string
          payment_provider: string | null
          provider_reference: string | null
          invoice_number: string | null
          invoice_url: string | null
          receipt_url: string | null
          metadata: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          business_id: string
          subscription_id?: string | null
          type?: string
          amount: number
          currency?: string
          status?: string
          payment_provider?: string | null
          provider_reference?: string | null
          invoice_number?: string | null
          invoice_url?: string | null
          receipt_url?: string | null
          metadata?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          business_id?: string
          subscription_id?: string | null
          type?: string
          amount?: number
          currency?: string
          status?: string
          payment_provider?: string | null
          provider_reference?: string | null
          invoice_number?: string | null
          invoice_url?: string | null
          receipt_url?: string | null
          metadata?: Json
          created_at?: string
          updated_at?: string
        }
      }
      invoices: {
        Row: {
          id: string
          business_id: string
          invoice_number: string
          status: string
          contact_id: string | null
          total_amount: number
          paid_amount: number
          due_date: string
          sent_at: string | null
          paid_at: string | null
          created_at: string
          updated_at: string
          metadata: Json
        }
        Insert: {
          id?: string
          business_id: string
          invoice_number?: string
          status?: string
          contact_id?: string | null
          total_amount?: number
          paid_amount?: number
          due_date?: string
          sent_at?: string | null
          paid_at?: string | null
          created_at?: string
          updated_at?: string
          metadata?: Json
        }
        Update: {
          id?: string
          business_id?: string
          invoice_number?: string
          status?: string
          contact_id?: string | null
          total_amount?: number
          paid_amount?: number
          due_date?: string
          sent_at?: string | null
          paid_at?: string | null
          created_at?: string
          updated_at?: string
          metadata?: Json
        }
      }
      invoice_line_items: {
        Row: {
          id: string
          invoice_id: string
          business_id: string
          description: string
          quantity: number
          amount: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          invoice_id: string
          business_id: string
          description: string
          quantity: number
          amount: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          invoice_id?: string
          business_id?: string
          description?: string
          quantity?: number
          amount?: number
          created_at?: string
          updated_at?: string
        }
      }
      invoice_payments: {
        Row: {
          id: string
          invoice_id: string
          business_id: string
          amount: number
          payment_date: string
          payment_method: string
          reference_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          invoice_id: string
          business_id: string
          amount: number
          payment_date: string
          payment_method: string
          reference_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          invoice_id?: string
          business_id?: string
          amount?: number
          payment_date?: string
          payment_method?: string
          reference_id?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      invoice_templates: {
        Row: {
          id: string
          business_id: string
          name: string
          html_template: string
          metadata: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          business_id: string
          name: string
          html_template: string
          metadata?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          business_id?: string
          name?: string
          html_template?: string
          metadata?: Json
          created_at?: string
          updated_at?: string
        }
      }
      audit_logs: {
        Row: {
          id: string
          business_id: string
          user_id: string | null
          action: string
          resource_type: string
          resource_id: string | null
          changes: Json | null
          ip_address: string | null
          user_agent: string | null
          status: string
          error_message: string | null
          created_at: string
        }
        Insert: {
          id?: string
          business_id: string
          user_id?: string | null
          action?: string
          resource_type?: string
          resource_id?: string | null
          changes?: Json | null
          ip_address?: string | null
          user_agent?: string | null
          status?: string
          error_message?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          business_id?: string
          user_id?: string | null
          action?: string
          resource_type?: string
          resource_id?: string | null
          changes?: Json | null
          ip_address?: string | null
          user_agent?: string | null
          status?: string
          error_message?: string | null
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}