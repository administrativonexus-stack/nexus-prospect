// Auto-generate this file after running Supabase locally:
//   npx supabase gen types typescript --local > types/database.ts
//
// Until then, this hand-written version mirrors the schema exactly.

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type LeadStatus =
  | "lead_found"
  | "message_sent"
  | "replied"
  | "meeting_scheduled"
  | "proposal"
  | "closed"
  | "lost"

export type MessageSender = "lead" | "agent" | "ai"

export type MeetingStatus = "scheduled" | "completed" | "cancelled" | "no_show"

export type CampaignStatus = "draft" | "scheduled" | "sending" | "completed" | "paused" | "cancelled"

export type RecipientStatus =
  | "pending"
  | "sending"
  | "sent"
  | "delivered"
  | "read"
  | "replied"
  | "failed"
  | "skipped"

export type CampaignEventType = "sent" | "delivered" | "read" | "replied" | "failed" | "meeting_booked"

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          name: string
          email: string
          avatar_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          name: string
          email: string
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          name?: string
          email?: string
          avatar_url?: string | null
          updated_at?: string
        }
      }
      leads: {
        Row: {
          id: string
          company_name: string
          phone: string | null
          city: string | null
          website: string | null
          address: string | null
          rating: number | null
          review_count: number
          score: number
          status: LeadStatus
          notes: string | null
          niche: string | null
          imported_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          company_name: string
          phone?: string | null
          city?: string | null
          website?: string | null
          address?: string | null
          rating?: number | null
          review_count?: number
          score?: number
          status?: LeadStatus
          notes?: string | null
          niche?: string | null
          imported_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          company_name?: string
          phone?: string | null
          city?: string | null
          website?: string | null
          address?: string | null
          rating?: number | null
          review_count?: number
          score?: number
          status?: LeadStatus
          notes?: string | null
          niche?: string | null
          imported_by?: string | null
          updated_at?: string
        }
      }
      conversations: {
        Row: {
          id: string
          lead_id: string
          message: string
          sender: MessageSender
          whatsapp_message_id: string | null
          read: boolean
          created_at: string
        }
        Insert: {
          id?: string
          lead_id: string
          message: string
          sender: MessageSender
          whatsapp_message_id?: string | null
          read?: boolean
          created_at?: string
        }
        Update: {
          read?: boolean
        }
      }
      meetings: {
        Row: {
          id: string
          lead_id: string
          meeting_date: string
          meeting_link: string | null
          google_event_id: string | null
          status: MeetingStatus
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          lead_id: string
          meeting_date: string
          meeting_link?: string | null
          google_event_id?: string | null
          status?: MeetingStatus
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          meeting_date?: string
          meeting_link?: string | null
          google_event_id?: string | null
          status?: MeetingStatus
          notes?: string | null
          updated_at?: string
        }
      }
      audits: {
        Row: {
          id: string
          lead_id: string
          score: number
          has_website: boolean
          is_responsive: boolean
          has_form: boolean
          has_cta: boolean
          has_chatbot: boolean
          has_lead_capture: boolean
          problems: Json
          opportunities: Json
          sales_arguments: Json
          raw_response: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          lead_id: string
          score: number
          has_website?: boolean
          is_responsive?: boolean
          has_form?: boolean
          has_cta?: boolean
          has_chatbot?: boolean
          has_lead_capture?: boolean
          problems?: Json
          opportunities?: Json
          sales_arguments?: Json
          raw_response?: Json | null
          created_at?: string
        }
        Update: never
      }
      settings: {
        Row: {
          key: string
          value: string | null
          updated_at: string
        }
        Insert: {
          key: string
          value?: string | null
          updated_at?: string
        }
        Update: {
          value?: string | null
          updated_at?: string
        }
      }
      lead_history: {
        Row: {
          id: string
          lead_id: string
          action: string
          description: string
          metadata: Json | null
          performed_by: string | null
          created_at: string
        }
        Insert: {
          id?: string
          lead_id: string
          action: string
          description: string
          metadata?: Json | null
          performed_by?: string | null
          created_at?: string
        }
        Update: never
      }
      tags: {
        Row: {
          id: string
          name: string
          color: string | null
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          color?: string | null
          created_at?: string
        }
        Update: {
          name?: string
          color?: string | null
        }
      }
      lead_tags: {
        Row: {
          lead_id: string
          tag_id: string
          created_at: string
        }
        Insert: {
          lead_id: string
          tag_id: string
          created_at?: string
        }
        Update: never
      }
      campaigns: {
        Row: {
          id: string
          name: string
          status: CampaignStatus
          template_name: string
          template_language: string
          template_components: Json | null
          segment_filters: Json
          scheduled_at: string | null
          started_at: string | null
          completed_at: string | null
          total_recipients: number
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          status?: CampaignStatus
          template_name: string
          template_language?: string
          template_components?: Json | null
          segment_filters?: Json
          scheduled_at?: string | null
          started_at?: string | null
          completed_at?: string | null
          total_recipients?: number
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          name?: string
          status?: CampaignStatus
          template_name?: string
          template_language?: string
          template_components?: Json | null
          segment_filters?: Json
          scheduled_at?: string | null
          started_at?: string | null
          completed_at?: string | null
          total_recipients?: number
          updated_at?: string
        }
      }
      campaign_recipients: {
        Row: {
          id: string
          campaign_id: string
          lead_id: string
          status: RecipientStatus
          whatsapp_message_id: string | null
          error_message: string | null
          sent_at: string | null
          delivered_at: string | null
          read_at: string | null
          replied_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          campaign_id: string
          lead_id: string
          status?: RecipientStatus
          whatsapp_message_id?: string | null
          error_message?: string | null
          sent_at?: string | null
          delivered_at?: string | null
          read_at?: string | null
          replied_at?: string | null
          created_at?: string
        }
        Update: {
          status?: RecipientStatus
          whatsapp_message_id?: string | null
          error_message?: string | null
          sent_at?: string | null
          delivered_at?: string | null
          read_at?: string | null
          replied_at?: string | null
        }
      }
      campaign_events: {
        Row: {
          id: string
          campaign_id: string
          recipient_id: string
          event_type: CampaignEventType
          raw_payload: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          campaign_id: string
          recipient_id: string
          event_type: CampaignEventType
          raw_payload?: Json | null
          created_at?: string
        }
        Update: never
      }
    }
    Views: Record<string, never>
    Functions: {
      get_dashboard_metrics: {
        Args: Record<string, never>
        Returns: Json
      }
      get_campaign_metrics: {
        Args: { p_campaign_id: string }
        Returns: Json
      }
      get_campaigns_overview_metrics: {
        Args: Record<string, never>
        Returns: Json
      }
    }
    Enums: {
      lead_status: LeadStatus
      message_sender: MessageSender
      meeting_status: MeetingStatus
      campaign_status: CampaignStatus
      recipient_status: RecipientStatus
      campaign_event_type: CampaignEventType
    }
  }
}
