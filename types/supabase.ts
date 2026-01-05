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
    PostgrestVersion: "12.2.12 (cd3cf9e)"
  }
  public: {
    Tables: {
      admin_roles: {
        Row: {
          created_at: string
          email: string
          full_name: string | null
          id: string
          is_active: boolean
          last_login: string | null
          role: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email: string
          full_name?: string | null
          id?: string
          is_active?: boolean
          last_login?: string | null
          role: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          email?: string
          full_name?: string | null
          id?: string
          is_active?: boolean
          last_login?: string | null
          role?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      admin_settings: {
        Row: {
          created_at: string
          id: string
          organization_id: string | null
          setting_key: string
          setting_value: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          organization_id?: string | null
          setting_key: string
          setting_value?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          organization_id?: string | null
          setting_key?: string
          setting_value?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "admin_settings_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "admin_settings_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "venue_roster"
            referencedColumns: ["performer_id"]
          },
          {
            foreignKeyName: "admin_settings_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "venue_roster"
            referencedColumns: ["venue_id"]
          },
        ]
      }
      admin_tasks: {
        Row: {
          assigned_to: string | null
          completed_at: string | null
          created_at: string | null
          id: string
          notes: string | null
          organization_id: string | null
          phone_number: string
          priority: string
          status: string
          task_type: string
          updated_at: string | null
        }
        Insert: {
          assigned_to?: string | null
          completed_at?: string | null
          created_at?: string | null
          id?: string
          notes?: string | null
          organization_id?: string | null
          phone_number: string
          priority?: string
          status?: string
          task_type: string
          updated_at?: string | null
        }
        Update: {
          assigned_to?: string | null
          completed_at?: string | null
          created_at?: string | null
          id?: string
          notes?: string | null
          organization_id?: string | null
          phone_number?: string
          priority?: string
          status?: string
          task_type?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "admin_tasks_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "admin_tasks_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "venue_roster"
            referencedColumns: ["performer_id"]
          },
          {
            foreignKeyName: "admin_tasks_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "venue_roster"
            referencedColumns: ["venue_id"]
          },
        ]
      }
      admin_users: {
        Row: {
          created_at: string | null
          email: string
          full_name: string | null
          id: string
          is_active: boolean | null
          last_login: string | null
          role: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          email: string
          full_name?: string | null
          id?: string
          is_active?: boolean | null
          last_login?: string | null
          role?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string
          full_name?: string | null
          id?: string
          is_active?: boolean | null
          last_login?: string | null
          role?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      api_keys: {
        Row: {
          created_at: string
          id: string
          twilio_auth_token: string | null
          twilio_sid: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          twilio_auth_token?: string | null
          twilio_sid?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          twilio_auth_token?: string | null
          twilio_sid?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      automation_log: {
        Row: {
          automation_type: string
          clicked_at: string | null
          contact_id: string | null
          created_at: string | null
          email_opened: boolean | null
          email_sent: boolean | null
          event_id: string | null
          id: string
          link_clicked: boolean | null
          opened_at: string | null
          organization_id: string | null
          review_completed: boolean | null
          sent_at: string | null
          template_used: string | null
        }
        Insert: {
          automation_type: string
          clicked_at?: string | null
          contact_id?: string | null
          created_at?: string | null
          email_opened?: boolean | null
          email_sent?: boolean | null
          event_id?: string | null
          id?: string
          link_clicked?: boolean | null
          opened_at?: string | null
          organization_id?: string | null
          review_completed?: boolean | null
          sent_at?: string | null
          template_used?: string | null
        }
        Update: {
          automation_type?: string
          clicked_at?: string | null
          contact_id?: string | null
          created_at?: string | null
          email_opened?: boolean | null
          email_sent?: boolean | null
          event_id?: string | null
          id?: string
          link_clicked?: boolean | null
          opened_at?: string | null
          organization_id?: string | null
          review_completed?: boolean | null
          sent_at?: string | null
          template_used?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "automation_log_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "client_payment_summary"
            referencedColumns: ["contact_id"]
          },
          {
            foreignKeyName: "automation_log_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "automation_log_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "hot_leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "automation_log_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "outstanding_balances"
            referencedColumns: ["contact_id"]
          },
          {
            foreignKeyName: "automation_log_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "automation_log_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "automation_log_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "venue_roster"
            referencedColumns: ["performer_id"]
          },
          {
            foreignKeyName: "automation_log_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "venue_roster"
            referencedColumns: ["venue_id"]
          },
        ]
      }
      automation_queue: {
        Row: {
          automation_type: string
          contact_id: string | null
          created_at: string | null
          email_body: string | null
          email_subject: string | null
          error_message: string | null
          event_id: string | null
          id: string
          metadata: Json | null
          organization_id: string | null
          priority: number | null
          scheduled_for: string
          sent_at: string | null
          status: string | null
        }
        Insert: {
          automation_type: string
          contact_id?: string | null
          created_at?: string | null
          email_body?: string | null
          email_subject?: string | null
          error_message?: string | null
          event_id?: string | null
          id?: string
          metadata?: Json | null
          organization_id?: string | null
          priority?: number | null
          scheduled_for: string
          sent_at?: string | null
          status?: string | null
        }
        Update: {
          automation_type?: string
          contact_id?: string | null
          created_at?: string | null
          email_body?: string | null
          email_subject?: string | null
          error_message?: string | null
          event_id?: string | null
          id?: string
          metadata?: Json | null
          organization_id?: string | null
          priority?: number | null
          scheduled_for?: string
          sent_at?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "automation_queue_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "client_payment_summary"
            referencedColumns: ["contact_id"]
          },
          {
            foreignKeyName: "automation_queue_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "automation_queue_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "hot_leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "automation_queue_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "outstanding_balances"
            referencedColumns: ["contact_id"]
          },
          {
            foreignKeyName: "automation_queue_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "automation_queue_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "automation_queue_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "venue_roster"
            referencedColumns: ["performer_id"]
          },
          {
            foreignKeyName: "automation_queue_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "venue_roster"
            referencedColumns: ["venue_id"]
          },
        ]
      }
      automation_templates: {
        Row: {
          body_template: string
          created_at: string | null
          delay_hours: number | null
          id: string
          is_active: boolean | null
          organization_id: string | null
          send_order: number | null
          subject_template: string
          template_name: string
          template_type: string
          updated_at: string | null
          variables: Json | null
        }
        Insert: {
          body_template: string
          created_at?: string | null
          delay_hours?: number | null
          id?: string
          is_active?: boolean | null
          organization_id?: string | null
          send_order?: number | null
          subject_template: string
          template_name: string
          template_type: string
          updated_at?: string | null
          variables?: Json | null
        }
        Update: {
          body_template?: string
          created_at?: string | null
          delay_hours?: number | null
          id?: string
          is_active?: boolean | null
          organization_id?: string | null
          send_order?: number | null
          subject_template?: string
          template_name?: string
          template_type?: string
          updated_at?: string | null
          variables?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "automation_templates_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "automation_templates_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "venue_roster"
            referencedColumns: ["performer_id"]
          },
          {
            foreignKeyName: "automation_templates_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "venue_roster"
            referencedColumns: ["venue_id"]
          },
        ]
      }
      availability_overrides: {
        Row: {
          created_at: string | null
          date: string
          end_time: string
          id: string
          is_available: boolean | null
          meeting_type_id: string | null
          organization_id: string | null
          reason: string | null
          start_time: string
          timezone: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          date: string
          end_time: string
          id?: string
          is_available?: boolean | null
          meeting_type_id?: string | null
          organization_id?: string | null
          reason?: string | null
          start_time: string
          timezone?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          date?: string
          end_time?: string
          id?: string
          is_available?: boolean | null
          meeting_type_id?: string | null
          organization_id?: string | null
          reason?: string | null
          start_time?: string
          timezone?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "availability_overrides_meeting_type_id_fkey"
            columns: ["meeting_type_id"]
            isOneToOne: false
            referencedRelation: "meeting_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "availability_overrides_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "availability_overrides_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "venue_roster"
            referencedColumns: ["performer_id"]
          },
          {
            foreignKeyName: "availability_overrides_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "venue_roster"
            referencedColumns: ["venue_id"]
          },
        ]
      }
      availability_patterns: {
        Row: {
          buffer_after_minutes: number | null
          buffer_before_minutes: number | null
          created_at: string | null
          day_of_week: number | null
          end_time: string
          id: string
          is_active: boolean | null
          meeting_type_id: string | null
          name: string
          organization_id: string | null
          start_time: string
          timezone: string | null
          updated_at: string | null
        }
        Insert: {
          buffer_after_minutes?: number | null
          buffer_before_minutes?: number | null
          created_at?: string | null
          day_of_week?: number | null
          end_time: string
          id?: string
          is_active?: boolean | null
          meeting_type_id?: string | null
          name: string
          organization_id?: string | null
          start_time: string
          timezone?: string | null
          updated_at?: string | null
        }
        Update: {
          buffer_after_minutes?: number | null
          buffer_before_minutes?: number | null
          created_at?: string | null
          day_of_week?: number | null
          end_time?: string
          id?: string
          is_active?: boolean | null
          meeting_type_id?: string | null
          name?: string
          organization_id?: string | null
          start_time?: string
          timezone?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "availability_patterns_meeting_type_id_fkey"
            columns: ["meeting_type_id"]
            isOneToOne: false
            referencedRelation: "meeting_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "availability_patterns_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "availability_patterns_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "venue_roster"
            referencedColumns: ["performer_id"]
          },
          {
            foreignKeyName: "availability_patterns_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "venue_roster"
            referencedColumns: ["venue_id"]
          },
        ]
      }
      bid_history: {
        Row: {
          bid_amount: number
          bidder_email: string | null
          bidder_name: string
          bidder_phone: string | null
          bidding_round_id: string
          created_at: string | null
          id: string
          is_winning_bid: boolean | null
          payment_intent_id: string | null
          payment_status: string | null
          request_id: string
        }
        Insert: {
          bid_amount: number
          bidder_email?: string | null
          bidder_name: string
          bidder_phone?: string | null
          bidding_round_id: string
          created_at?: string | null
          id?: string
          is_winning_bid?: boolean | null
          payment_intent_id?: string | null
          payment_status?: string | null
          request_id: string
        }
        Update: {
          bid_amount?: number
          bidder_email?: string | null
          bidder_name?: string
          bidder_phone?: string | null
          bidding_round_id?: string
          created_at?: string | null
          id?: string
          is_winning_bid?: boolean | null
          payment_intent_id?: string | null
          payment_status?: string | null
          request_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bid_history_bidding_round_id_fkey"
            columns: ["bidding_round_id"]
            isOneToOne: false
            referencedRelation: "bidding_rounds"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bid_history_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "crowd_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      bidding_rounds: {
        Row: {
          created_at: string | null
          ends_at: string
          id: string
          organization_id: string
          processed_at: string | null
          round_number: number
          started_at: string
          status: string | null
          updated_at: string | null
          winning_bid_amount: number | null
          winning_request_id: string | null
        }
        Insert: {
          created_at?: string | null
          ends_at: string
          id?: string
          organization_id: string
          processed_at?: string | null
          round_number: number
          started_at: string
          status?: string | null
          updated_at?: string | null
          winning_bid_amount?: number | null
          winning_request_id?: string | null
        }
        Update: {
          created_at?: string | null
          ends_at?: string
          id?: string
          organization_id?: string
          processed_at?: string | null
          round_number?: number
          started_at?: string
          status?: string | null
          updated_at?: string | null
          winning_bid_amount?: number | null
          winning_request_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bidding_rounds_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bidding_rounds_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "venue_roster"
            referencedColumns: ["performer_id"]
          },
          {
            foreignKeyName: "bidding_rounds_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "venue_roster"
            referencedColumns: ["venue_id"]
          },
          {
            foreignKeyName: "bidding_rounds_winning_request_id_fkey"
            columns: ["winning_request_id"]
            isOneToOne: false
            referencedRelation: "crowd_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      blog_posts: {
        Row: {
          author: string | null
          category: string | null
          content: string
          created_at: string | null
          excerpt: string | null
          featured_image_url: string | null
          id: string
          is_featured: boolean | null
          is_published: boolean | null
          organization_id: string | null
          published_at: string | null
          seo_description: string | null
          seo_title: string | null
          slug: string
          tags: string[] | null
          title: string
          updated_at: string | null
        }
        Insert: {
          author?: string | null
          category?: string | null
          content: string
          created_at?: string | null
          excerpt?: string | null
          featured_image_url?: string | null
          id?: string
          is_featured?: boolean | null
          is_published?: boolean | null
          organization_id?: string | null
          published_at?: string | null
          seo_description?: string | null
          seo_title?: string | null
          slug: string
          tags?: string[] | null
          title: string
          updated_at?: string | null
        }
        Update: {
          author?: string | null
          category?: string | null
          content?: string
          created_at?: string | null
          excerpt?: string | null
          featured_image_url?: string | null
          id?: string
          is_featured?: boolean | null
          is_published?: boolean | null
          organization_id?: string | null
          published_at?: string | null
          seo_description?: string | null
          seo_title?: string | null
          slug?: string
          tags?: string[] | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "blog_posts_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "blog_posts_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "venue_roster"
            referencedColumns: ["performer_id"]
          },
          {
            foreignKeyName: "blog_posts_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "venue_roster"
            referencedColumns: ["venue_id"]
          },
        ]
      }
      call_leads: {
        Row: {
          booking_id: string | null
          call_duration_seconds: number | null
          call_ended_at: string | null
          call_started_at: string | null
          call_status: string | null
          caller_number_hash: string | null
          city: string | null
          conversion_value: number | null
          converted_to_booking: boolean | null
          created_at: string | null
          dj_profile_id: string | null
          id: string
          lead_id: string | null
          product_context: string | null
          recording_url: string | null
          source_page: string | null
          state: string | null
          transcription_text: string | null
          updated_at: string | null
          utm_campaign: string | null
          utm_medium: string | null
          utm_source: string | null
          virtual_number: string
        }
        Insert: {
          booking_id?: string | null
          call_duration_seconds?: number | null
          call_ended_at?: string | null
          call_started_at?: string | null
          call_status?: string | null
          caller_number_hash?: string | null
          city?: string | null
          conversion_value?: number | null
          converted_to_booking?: boolean | null
          created_at?: string | null
          dj_profile_id?: string | null
          id?: string
          lead_id?: string | null
          product_context?: string | null
          recording_url?: string | null
          source_page?: string | null
          state?: string | null
          transcription_text?: string | null
          updated_at?: string | null
          utm_campaign?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          virtual_number: string
        }
        Update: {
          booking_id?: string | null
          call_duration_seconds?: number | null
          call_ended_at?: string | null
          call_started_at?: string | null
          call_status?: string | null
          caller_number_hash?: string | null
          city?: string | null
          conversion_value?: number | null
          converted_to_booking?: boolean | null
          created_at?: string | null
          dj_profile_id?: string | null
          id?: string
          lead_id?: string | null
          product_context?: string | null
          recording_url?: string | null
          source_page?: string | null
          state?: string | null
          transcription_text?: string | null
          updated_at?: string | null
          utm_campaign?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          virtual_number?: string
        }
        Relationships: [
          {
            foreignKeyName: "call_leads_dj_profile_id_fkey"
            columns: ["dj_profile_id"]
            isOneToOne: false
            referencedRelation: "dj_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "call_leads_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      case_studies: {
        Row: {
          content: string
          created_at: string | null
          display_order: number | null
          event_date: string | null
          event_type: string | null
          excerpt: string | null
          featured_image_url: string | null
          gallery_images: string[] | null
          highlights: string[] | null
          id: string
          is_featured: boolean | null
          is_published: boolean | null
          number_of_guests: number | null
          published_at: string | null
          seo_description: string | null
          seo_keywords: string[] | null
          seo_title: string | null
          slug: string
          testimonial: Json | null
          testimonial_id: string | null
          title: string
          updated_at: string | null
          venue_address: string | null
          venue_name: string | null
        }
        Insert: {
          content: string
          created_at?: string | null
          display_order?: number | null
          event_date?: string | null
          event_type?: string | null
          excerpt?: string | null
          featured_image_url?: string | null
          gallery_images?: string[] | null
          highlights?: string[] | null
          id?: string
          is_featured?: boolean | null
          is_published?: boolean | null
          number_of_guests?: number | null
          published_at?: string | null
          seo_description?: string | null
          seo_keywords?: string[] | null
          seo_title?: string | null
          slug: string
          testimonial?: Json | null
          testimonial_id?: string | null
          title: string
          updated_at?: string | null
          venue_address?: string | null
          venue_name?: string | null
        }
        Update: {
          content?: string
          created_at?: string | null
          display_order?: number | null
          event_date?: string | null
          event_type?: string | null
          excerpt?: string | null
          featured_image_url?: string | null
          gallery_images?: string[] | null
          highlights?: string[] | null
          id?: string
          is_featured?: boolean | null
          is_published?: boolean | null
          number_of_guests?: number | null
          published_at?: string | null
          seo_description?: string | null
          seo_keywords?: string[] | null
          seo_title?: string | null
          slug?: string
          testimonial?: Json | null
          testimonial_id?: string | null
          title?: string
          updated_at?: string | null
          venue_address?: string | null
          venue_name?: string | null
        }
        Relationships: []
      }
      city_analytics: {
        Row: {
          avg_time_on_page: number | null
          booking_requests: number | null
          city_page_id: string | null
          created_at: string | null
          date: string
          estimated_booking_value: number | null
          event_type_leads: Json | null
          id: string
          inquiry_conversion_rate: number | null
          inquiry_form_views: number | null
          inquiry_submissions: number | null
          lead_to_booking_rate: number | null
          leads_generated: number | null
          page_views: number | null
          quote_requests: number | null
          tipjar_clicks: number | null
          tipjar_revenue: number | null
          traffic_sources: Json | null
          unique_visitors: number | null
          updated_at: string | null
        }
        Insert: {
          avg_time_on_page?: number | null
          booking_requests?: number | null
          city_page_id?: string | null
          created_at?: string | null
          date?: string
          estimated_booking_value?: number | null
          event_type_leads?: Json | null
          id?: string
          inquiry_conversion_rate?: number | null
          inquiry_form_views?: number | null
          inquiry_submissions?: number | null
          lead_to_booking_rate?: number | null
          leads_generated?: number | null
          page_views?: number | null
          quote_requests?: number | null
          tipjar_clicks?: number | null
          tipjar_revenue?: number | null
          traffic_sources?: Json | null
          unique_visitors?: number | null
          updated_at?: string | null
        }
        Update: {
          avg_time_on_page?: number | null
          booking_requests?: number | null
          city_page_id?: string | null
          created_at?: string | null
          date?: string
          estimated_booking_value?: number | null
          event_type_leads?: Json | null
          id?: string
          inquiry_conversion_rate?: number | null
          inquiry_form_views?: number | null
          inquiry_submissions?: number | null
          lead_to_booking_rate?: number | null
          leads_generated?: number | null
          page_views?: number | null
          quote_requests?: number | null
          tipjar_clicks?: number | null
          tipjar_revenue?: number | null
          traffic_sources?: Json | null
          unique_visitors?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "city_analytics_city_page_id_fkey"
            columns: ["city_page_id"]
            isOneToOne: false
            referencedRelation: "city_pages"
            referencedColumns: ["id"]
          },
        ]
      }
      city_dj_performance: {
        Row: {
          avg_rating: number | null
          bookings_received: number | null
          city_page_id: string | null
          city_rank: number | null
          created_at: string | null
          dj_profile_id: string | null
          event_type_performance: Json | null
          event_type_rank: Json | null
          id: string
          last_updated: string | null
          leads_generated: number | null
          page_views: number | null
          revenue_generated: number | null
          review_count: number | null
        }
        Insert: {
          avg_rating?: number | null
          bookings_received?: number | null
          city_page_id?: string | null
          city_rank?: number | null
          created_at?: string | null
          dj_profile_id?: string | null
          event_type_performance?: Json | null
          event_type_rank?: Json | null
          id?: string
          last_updated?: string | null
          leads_generated?: number | null
          page_views?: number | null
          revenue_generated?: number | null
          review_count?: number | null
        }
        Update: {
          avg_rating?: number | null
          bookings_received?: number | null
          city_page_id?: string | null
          city_rank?: number | null
          created_at?: string | null
          dj_profile_id?: string | null
          event_type_performance?: Json | null
          event_type_rank?: Json | null
          id?: string
          last_updated?: string | null
          leads_generated?: number | null
          page_views?: number | null
          revenue_generated?: number | null
          review_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "city_dj_performance_city_page_id_fkey"
            columns: ["city_page_id"]
            isOneToOne: false
            referencedRelation: "city_pages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "city_dj_performance_dj_profile_id_fkey"
            columns: ["dj_profile_id"]
            isOneToOne: false
            referencedRelation: "dj_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      city_event_pages: {
        Row: {
          ai_model_used: string | null
          average_price_range: string | null
          average_rating: number | null
          city_name: string
          city_slug: string
          comprehensive_guide: string | null
          content_generated_at: string | null
          content_updated_at: string | null
          content_version: number | null
          created_at: string | null
          dj_count: number | null
          event_type: string
          event_type_display: string
          event_type_slug: string
          faqs: Json
          full_slug: string
          hero_description: string | null
          hero_subtitle: string | null
          hero_title: string
          id: string
          introduction_text: string | null
          is_published: boolean | null
          local_insights: string | null
          meta_og_description: string | null
          meta_og_title: string | null
          popular_songs: Json | null
          pricing_section: string | null
          product_context: string | null
          review_count: number | null
          seasonal_trends: Json | null
          seo_description: string
          seo_keywords: string[] | null
          seo_title: string
          state_abbr: string
          state_name: string
          structured_data: Json | null
          timeline_section: string | null
          updated_at: string | null
          venue_recommendations: Json | null
          venue_section: string | null
          why_choose_section: string | null
        }
        Insert: {
          ai_model_used?: string | null
          average_price_range?: string | null
          average_rating?: number | null
          city_name: string
          city_slug: string
          comprehensive_guide?: string | null
          content_generated_at?: string | null
          content_updated_at?: string | null
          content_version?: number | null
          created_at?: string | null
          dj_count?: number | null
          event_type: string
          event_type_display: string
          event_type_slug: string
          faqs?: Json
          full_slug: string
          hero_description?: string | null
          hero_subtitle?: string | null
          hero_title: string
          id?: string
          introduction_text?: string | null
          is_published?: boolean | null
          local_insights?: string | null
          meta_og_description?: string | null
          meta_og_title?: string | null
          popular_songs?: Json | null
          pricing_section?: string | null
          product_context?: string | null
          review_count?: number | null
          seasonal_trends?: Json | null
          seo_description: string
          seo_keywords?: string[] | null
          seo_title: string
          state_abbr: string
          state_name: string
          structured_data?: Json | null
          timeline_section?: string | null
          updated_at?: string | null
          venue_recommendations?: Json | null
          venue_section?: string | null
          why_choose_section?: string | null
        }
        Update: {
          ai_model_used?: string | null
          average_price_range?: string | null
          average_rating?: number | null
          city_name?: string
          city_slug?: string
          comprehensive_guide?: string | null
          content_generated_at?: string | null
          content_updated_at?: string | null
          content_version?: number | null
          created_at?: string | null
          dj_count?: number | null
          event_type?: string
          event_type_display?: string
          event_type_slug?: string
          faqs?: Json
          full_slug?: string
          hero_description?: string | null
          hero_subtitle?: string | null
          hero_title?: string
          id?: string
          introduction_text?: string | null
          is_published?: boolean | null
          local_insights?: string | null
          meta_og_description?: string | null
          meta_og_title?: string | null
          popular_songs?: Json | null
          pricing_section?: string | null
          product_context?: string | null
          review_count?: number | null
          seasonal_trends?: Json | null
          seo_description?: string
          seo_keywords?: string[] | null
          seo_title?: string
          state_abbr?: string
          state_name?: string
          structured_data?: Json | null
          timeline_section?: string | null
          updated_at?: string | null
          venue_recommendations?: Json | null
          venue_section?: string | null
          why_choose_section?: string | null
        }
        Relationships: []
      }
      city_event_stats: {
        Row: {
          avg_conversion_rate: number | null
          avg_leads_per_week: number | null
          avg_response_time_seconds: number | null
          city: string
          computed_at: string | null
          created_at: string | null
          demand_supply_ratio: number | null
          demand_trend: string | null
          event_type: string
          id: string
          market_tension: string | null
          period_end: string
          period_start: string
          price_median_30d: number | null
          price_median_90d: number | null
          price_trend: string | null
          product_context: string | null
          state: string | null
          supply_trend: string | null
          total_active_djs: number | null
          total_available_djs: number | null
          total_leads_30d: number | null
          total_leads_90d: number | null
          updated_at: string | null
        }
        Insert: {
          avg_conversion_rate?: number | null
          avg_leads_per_week?: number | null
          avg_response_time_seconds?: number | null
          city: string
          computed_at?: string | null
          created_at?: string | null
          demand_supply_ratio?: number | null
          demand_trend?: string | null
          event_type: string
          id?: string
          market_tension?: string | null
          period_end: string
          period_start: string
          price_median_30d?: number | null
          price_median_90d?: number | null
          price_trend?: string | null
          product_context?: string | null
          state?: string | null
          supply_trend?: string | null
          total_active_djs?: number | null
          total_available_djs?: number | null
          total_leads_30d?: number | null
          total_leads_90d?: number | null
          updated_at?: string | null
        }
        Update: {
          avg_conversion_rate?: number | null
          avg_leads_per_week?: number | null
          avg_response_time_seconds?: number | null
          city?: string
          computed_at?: string | null
          created_at?: string | null
          demand_supply_ratio?: number | null
          demand_trend?: string | null
          event_type?: string
          id?: string
          market_tension?: string | null
          period_end?: string
          period_start?: string
          price_median_30d?: number | null
          price_median_90d?: number | null
          price_trend?: string | null
          product_context?: string | null
          state?: string | null
          supply_trend?: string | null
          total_active_djs?: number | null
          total_available_djs?: number | null
          total_leads_30d?: number | null
          total_leads_90d?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      city_pages: {
        Row: {
          ai_generated_content: Json | null
          avg_rating: number | null
          city_name: string
          city_slug: string
          content_html: string | null
          created_at: string | null
          event_type_demand: Json | null
          featured_dj_ids: string[] | null
          featured_venues: Json | null
          hero_image_url: string | null
          hero_subtitle: string | null
          hero_title: string | null
          id: string
          is_featured: boolean | null
          is_published: boolean | null
          last_ai_update: string | null
          local_tips: string[] | null
          meta_description: string | null
          meta_title: string | null
          metro_area: string | null
          og_image_url: string | null
          popular_venues: string[] | null
          priority: number | null
          product_context: string | null
          seasonal_trends: Json | null
          state: string
          state_abbr: string
          total_bookings: number | null
          total_djs: number | null
          total_reviews: number | null
          updated_at: string | null
        }
        Insert: {
          ai_generated_content?: Json | null
          avg_rating?: number | null
          city_name: string
          city_slug: string
          content_html?: string | null
          created_at?: string | null
          event_type_demand?: Json | null
          featured_dj_ids?: string[] | null
          featured_venues?: Json | null
          hero_image_url?: string | null
          hero_subtitle?: string | null
          hero_title?: string | null
          id?: string
          is_featured?: boolean | null
          is_published?: boolean | null
          last_ai_update?: string | null
          local_tips?: string[] | null
          meta_description?: string | null
          meta_title?: string | null
          metro_area?: string | null
          og_image_url?: string | null
          popular_venues?: string[] | null
          priority?: number | null
          product_context?: string | null
          seasonal_trends?: Json | null
          state: string
          state_abbr: string
          total_bookings?: number | null
          total_djs?: number | null
          total_reviews?: number | null
          updated_at?: string | null
        }
        Update: {
          ai_generated_content?: Json | null
          avg_rating?: number | null
          city_name?: string
          city_slug?: string
          content_html?: string | null
          created_at?: string | null
          event_type_demand?: Json | null
          featured_dj_ids?: string[] | null
          featured_venues?: Json | null
          hero_image_url?: string | null
          hero_subtitle?: string | null
          hero_title?: string | null
          id?: string
          is_featured?: boolean | null
          is_published?: boolean | null
          last_ai_update?: string | null
          local_tips?: string[] | null
          meta_description?: string | null
          meta_title?: string | null
          metro_area?: string | null
          og_image_url?: string | null
          popular_venues?: string[] | null
          priority?: number | null
          product_context?: string | null
          seasonal_trends?: Json | null
          state?: string
          state_abbr?: string
          total_bookings?: number | null
          total_djs?: number | null
          total_reviews?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      city_pricing_stats: {
        Row: {
          city: string
          computed_at: string | null
          created_at: string | null
          data_quality: string | null
          data_sources: Json | null
          event_type: string
          id: string
          min_sample_size: number | null
          outlier_count: number | null
          period_end: string
          period_start: string
          price_average: number | null
          price_high: number | null
          price_low: number | null
          price_median: number | null
          product_context: string | null
          sample_size: number | null
          state: string | null
          trend_direction: string | null
          trend_percentage: number | null
          updated_at: string | null
        }
        Insert: {
          city: string
          computed_at?: string | null
          created_at?: string | null
          data_quality?: string | null
          data_sources?: Json | null
          event_type: string
          id?: string
          min_sample_size?: number | null
          outlier_count?: number | null
          period_end: string
          period_start: string
          price_average?: number | null
          price_high?: number | null
          price_low?: number | null
          price_median?: number | null
          product_context?: string | null
          sample_size?: number | null
          state?: string | null
          trend_direction?: string | null
          trend_percentage?: number | null
          updated_at?: string | null
        }
        Update: {
          city?: string
          computed_at?: string | null
          created_at?: string | null
          data_quality?: string | null
          data_sources?: Json | null
          event_type?: string
          id?: string
          min_sample_size?: number | null
          outlier_count?: number | null
          period_end?: string
          period_start?: string
          price_average?: number | null
          price_high?: number | null
          price_low?: number | null
          price_median?: number | null
          product_context?: string | null
          sample_size?: number | null
          state?: string | null
          trend_direction?: string | null
          trend_percentage?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      city_venue_spotlights: {
        Row: {
          city_page_id: string | null
          created_at: string | null
          description: string | null
          display_order: number | null
          dj_count: number | null
          featured_dj_ids: string[] | null
          id: string
          is_featured: boolean | null
          updated_at: string | null
          venue_address: string | null
          venue_image_url: string | null
          venue_name: string
          venue_slug: string | null
          venue_type: string | null
        }
        Insert: {
          city_page_id?: string | null
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          dj_count?: number | null
          featured_dj_ids?: string[] | null
          id?: string
          is_featured?: boolean | null
          updated_at?: string | null
          venue_address?: string | null
          venue_image_url?: string | null
          venue_name: string
          venue_slug?: string | null
          venue_type?: string | null
        }
        Update: {
          city_page_id?: string | null
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          dj_count?: number | null
          featured_dj_ids?: string[] | null
          id?: string
          is_featured?: boolean | null
          updated_at?: string | null
          venue_address?: string | null
          venue_image_url?: string | null
          venue_name?: string
          venue_slug?: string | null
          venue_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "city_venue_spotlights_city_page_id_fkey"
            columns: ["city_page_id"]
            isOneToOne: false
            referencedRelation: "city_pages"
            referencedColumns: ["id"]
          },
        ]
      }
      communication_log: {
        Row: {
          communication_type: string
          contact_submission_id: string
          content: string
          created_at: string | null
          direction: string
          id: string
          metadata: Json | null
          organization_id: string | null
          sent_by: string | null
          sent_to: string | null
          status: string | null
          subject: string | null
          updated_at: string | null
        }
        Insert: {
          communication_type: string
          contact_submission_id: string
          content: string
          created_at?: string | null
          direction: string
          id?: string
          metadata?: Json | null
          organization_id?: string | null
          sent_by?: string | null
          sent_to?: string | null
          status?: string | null
          subject?: string | null
          updated_at?: string | null
        }
        Update: {
          communication_type?: string
          contact_submission_id?: string
          content?: string
          created_at?: string | null
          direction?: string
          id?: string
          metadata?: Json | null
          organization_id?: string | null
          sent_by?: string | null
          sent_to?: string | null
          status?: string | null
          subject?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "communication_log_contact_submission_id_fkey"
            columns: ["contact_submission_id"]
            isOneToOne: false
            referencedRelation: "contact_submissions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "communication_log_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "communication_log_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "venue_roster"
            referencedColumns: ["performer_id"]
          },
          {
            foreignKeyName: "communication_log_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "venue_roster"
            referencedColumns: ["venue_id"]
          },
        ]
      }
      contact_submissions: {
        Row: {
          assigned_to: string | null
          created_at: string | null
          email: string
          event_date: string | null
          event_time: string | null
          event_type: string
          follow_up_date: string | null
          guests: string | null
          id: string
          is_draft: boolean | null
          last_contact_date: string | null
          location: string | null
          message: string | null
          name: string
          notes: string | null
          organization_id: string | null
          phone: string | null
          priority: string | null
          status: string | null
          updated_at: string | null
          venue_address: string | null
          venue_image_fetched_at: string | null
          venue_image_url: string | null
          venue_name: string | null
          visitor_id: string | null
        }
        Insert: {
          assigned_to?: string | null
          created_at?: string | null
          email: string
          event_date?: string | null
          event_time?: string | null
          event_type: string
          follow_up_date?: string | null
          guests?: string | null
          id?: string
          is_draft?: boolean | null
          last_contact_date?: string | null
          location?: string | null
          message?: string | null
          name: string
          notes?: string | null
          organization_id?: string | null
          phone?: string | null
          priority?: string | null
          status?: string | null
          updated_at?: string | null
          venue_address?: string | null
          venue_image_fetched_at?: string | null
          venue_image_url?: string | null
          venue_name?: string | null
          visitor_id?: string | null
        }
        Update: {
          assigned_to?: string | null
          created_at?: string | null
          email?: string
          event_date?: string | null
          event_time?: string | null
          event_type?: string
          follow_up_date?: string | null
          guests?: string | null
          id?: string
          is_draft?: boolean | null
          last_contact_date?: string | null
          location?: string | null
          message?: string | null
          name?: string
          notes?: string | null
          organization_id?: string | null
          phone?: string | null
          priority?: string | null
          status?: string | null
          updated_at?: string | null
          venue_address?: string | null
          venue_image_fetched_at?: string | null
          venue_image_url?: string | null
          venue_name?: string | null
          visitor_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contact_submissions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contact_submissions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "venue_roster"
            referencedColumns: ["performer_id"]
          },
          {
            foreignKeyName: "contact_submissions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "venue_roster"
            referencedColumns: ["venue_id"]
          },
          {
            foreignKeyName: "contact_submissions_visitor_id_fkey"
            columns: ["visitor_id"]
            isOneToOne: false
            referencedRelation: "visitor_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      contacts: {
        Row: {
          address: string | null
          assigned_to: string | null
          budget_range: string | null
          calls_made_count: number | null
          campaign_source: string | null
          city: string | null
          communication_preference: string | null
          competitors_considered: string[] | null
          contract_signed_date: string | null
          contract_url: string | null
          country: string | null
          created_at: string | null
          custom_fields: Json | null
          deal_probability: number | null
          deleted_at: string | null
          deposit_amount: number | null
          deposit_paid: boolean | null
          do_not_play_list: string | null
          email_address: string | null
          emails_sent_count: number | null
          end_time: string | null
          equipment_needs: string[] | null
          event_date: string | null
          event_duration_hours: number | null
          event_feedback: string | null
          event_rating: number | null
          event_time: string | null
          event_type: string | null
          expected_close_date: string | null
          facebook_id: string | null
          facebook_profile_url: string | null
          final_price: number | null
          first_dance_song: string | null
          first_name: string | null
          follow_up_notes: string | null
          google_review_link: string | null
          guest_count: number | null
          how_heard_about_us: string | null
          id: string
          instagram_id: string | null
          instagram_profile_url: string | null
          instagram_username: string | null
          internal_notes: string | null
          last_contact_type: string | null
          last_contacted_date: string | null
          last_name: string | null
          last_review_reminder_at: string | null
          lead_quality: string | null
          lead_score: number | null
          lead_source: string | null
          lead_stage: string | null
          lead_status: string | null
          lead_temperature: string | null
          meetings_held: number | null
          messages_received_count: number | null
          messages_sent_count: number | null
          music_genres: string[] | null
          next_follow_up_date: string | null
          notes: string | null
          opt_in_status: boolean | null
          organization_id: string | null
          payment_status: string | null
          phone: string | null
          photos_provided: boolean | null
          playlist_provided: boolean | null
          preferred_language: string | null
          priority_level: string | null
          proposal_sent_date: string | null
          proposal_value: number | null
          quoted_price: number | null
          referral_contact: string | null
          referral_source: string | null
          review_completed: boolean | null
          review_left: boolean | null
          review_reminder_count: number | null
          review_requested: boolean | null
          review_requested_at: string | null
          review_url: string | null
          search_vector: unknown
          service_selection_completed: boolean | null
          service_selection_completed_at: string | null
          service_selection_sent: boolean | null
          service_selection_sent_at: string | null
          service_selection_token: string | null
          social_media_handles: Json | null
          source_domain: string | null
          special_moments: string | null
          special_requests: string | null
          state: string | null
          tags: string[] | null
          testimonial_provided: boolean | null
          testimonial_text: string | null
          updated_at: string | null
          user_id: string | null
          venue_address: string | null
          venue_name: string | null
          why_chose_us: string | null
          why_lost_deal: string | null
        }
        Insert: {
          address?: string | null
          assigned_to?: string | null
          budget_range?: string | null
          calls_made_count?: number | null
          campaign_source?: string | null
          city?: string | null
          communication_preference?: string | null
          competitors_considered?: string[] | null
          contract_signed_date?: string | null
          contract_url?: string | null
          country?: string | null
          created_at?: string | null
          custom_fields?: Json | null
          deal_probability?: number | null
          deleted_at?: string | null
          deposit_amount?: number | null
          deposit_paid?: boolean | null
          do_not_play_list?: string | null
          email_address?: string | null
          emails_sent_count?: number | null
          end_time?: string | null
          equipment_needs?: string[] | null
          event_date?: string | null
          event_duration_hours?: number | null
          event_feedback?: string | null
          event_rating?: number | null
          event_time?: string | null
          event_type?: string | null
          expected_close_date?: string | null
          facebook_id?: string | null
          facebook_profile_url?: string | null
          final_price?: number | null
          first_dance_song?: string | null
          first_name?: string | null
          follow_up_notes?: string | null
          google_review_link?: string | null
          guest_count?: number | null
          how_heard_about_us?: string | null
          id?: string
          instagram_id?: string | null
          instagram_profile_url?: string | null
          instagram_username?: string | null
          internal_notes?: string | null
          last_contact_type?: string | null
          last_contacted_date?: string | null
          last_name?: string | null
          last_review_reminder_at?: string | null
          lead_quality?: string | null
          lead_score?: number | null
          lead_source?: string | null
          lead_stage?: string | null
          lead_status?: string | null
          lead_temperature?: string | null
          meetings_held?: number | null
          messages_received_count?: number | null
          messages_sent_count?: number | null
          music_genres?: string[] | null
          next_follow_up_date?: string | null
          notes?: string | null
          opt_in_status?: boolean | null
          organization_id?: string | null
          payment_status?: string | null
          phone?: string | null
          photos_provided?: boolean | null
          playlist_provided?: boolean | null
          preferred_language?: string | null
          priority_level?: string | null
          proposal_sent_date?: string | null
          proposal_value?: number | null
          quoted_price?: number | null
          referral_contact?: string | null
          referral_source?: string | null
          review_completed?: boolean | null
          review_left?: boolean | null
          review_reminder_count?: number | null
          review_requested?: boolean | null
          review_requested_at?: string | null
          review_url?: string | null
          search_vector?: unknown
          service_selection_completed?: boolean | null
          service_selection_completed_at?: string | null
          service_selection_sent?: boolean | null
          service_selection_sent_at?: string | null
          service_selection_token?: string | null
          social_media_handles?: Json | null
          source_domain?: string | null
          special_moments?: string | null
          special_requests?: string | null
          state?: string | null
          tags?: string[] | null
          testimonial_provided?: boolean | null
          testimonial_text?: string | null
          updated_at?: string | null
          user_id?: string | null
          venue_address?: string | null
          venue_name?: string | null
          why_chose_us?: string | null
          why_lost_deal?: string | null
        }
        Update: {
          address?: string | null
          assigned_to?: string | null
          budget_range?: string | null
          calls_made_count?: number | null
          campaign_source?: string | null
          city?: string | null
          communication_preference?: string | null
          competitors_considered?: string[] | null
          contract_signed_date?: string | null
          contract_url?: string | null
          country?: string | null
          created_at?: string | null
          custom_fields?: Json | null
          deal_probability?: number | null
          deleted_at?: string | null
          deposit_amount?: number | null
          deposit_paid?: boolean | null
          do_not_play_list?: string | null
          email_address?: string | null
          emails_sent_count?: number | null
          end_time?: string | null
          equipment_needs?: string[] | null
          event_date?: string | null
          event_duration_hours?: number | null
          event_feedback?: string | null
          event_rating?: number | null
          event_time?: string | null
          event_type?: string | null
          expected_close_date?: string | null
          facebook_id?: string | null
          facebook_profile_url?: string | null
          final_price?: number | null
          first_dance_song?: string | null
          first_name?: string | null
          follow_up_notes?: string | null
          google_review_link?: string | null
          guest_count?: number | null
          how_heard_about_us?: string | null
          id?: string
          instagram_id?: string | null
          instagram_profile_url?: string | null
          instagram_username?: string | null
          internal_notes?: string | null
          last_contact_type?: string | null
          last_contacted_date?: string | null
          last_name?: string | null
          last_review_reminder_at?: string | null
          lead_quality?: string | null
          lead_score?: number | null
          lead_source?: string | null
          lead_stage?: string | null
          lead_status?: string | null
          lead_temperature?: string | null
          meetings_held?: number | null
          messages_received_count?: number | null
          messages_sent_count?: number | null
          music_genres?: string[] | null
          next_follow_up_date?: string | null
          notes?: string | null
          opt_in_status?: boolean | null
          organization_id?: string | null
          payment_status?: string | null
          phone?: string | null
          photos_provided?: boolean | null
          playlist_provided?: boolean | null
          preferred_language?: string | null
          priority_level?: string | null
          proposal_sent_date?: string | null
          proposal_value?: number | null
          quoted_price?: number | null
          referral_contact?: string | null
          referral_source?: string | null
          review_completed?: boolean | null
          review_left?: boolean | null
          review_reminder_count?: number | null
          review_requested?: boolean | null
          review_requested_at?: string | null
          review_url?: string | null
          search_vector?: unknown
          service_selection_completed?: boolean | null
          service_selection_completed_at?: string | null
          service_selection_sent?: boolean | null
          service_selection_sent_at?: string | null
          service_selection_token?: string | null
          social_media_handles?: Json | null
          source_domain?: string | null
          special_moments?: string | null
          special_requests?: string | null
          state?: string | null
          tags?: string[] | null
          testimonial_provided?: boolean | null
          testimonial_text?: string | null
          updated_at?: string | null
          user_id?: string | null
          venue_address?: string | null
          venue_name?: string | null
          why_chose_us?: string | null
          why_lost_deal?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contacts_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contacts_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "venue_roster"
            referencedColumns: ["performer_id"]
          },
          {
            foreignKeyName: "contacts_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "venue_roster"
            referencedColumns: ["venue_id"]
          },
        ]
      }
      contract_templates: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          is_default: boolean | null
          name: string
          organization_id: string | null
          template_content: string
          template_type: string | null
          updated_at: string | null
          variables: Json | null
          version: number | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          is_default?: boolean | null
          name: string
          organization_id?: string | null
          template_content: string
          template_type?: string | null
          updated_at?: string | null
          variables?: Json | null
          version?: number | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          is_default?: boolean | null
          name?: string
          organization_id?: string | null
          template_content?: string
          template_type?: string | null
          updated_at?: string | null
          variables?: Json | null
          version?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "contract_templates_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contract_templates_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "venue_roster"
            referencedColumns: ["performer_id"]
          },
          {
            foreignKeyName: "contract_templates_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "venue_roster"
            referencedColumns: ["venue_id"]
          },
        ]
      }
      contracts: {
        Row: {
          additional_terms: string | null
          cancellation_policy: string | null
          client_signature_data: string | null
          contact_id: string | null
          contract_html: string | null
          contract_number: string
          contract_pdf_url: string | null
          contract_template: string | null
          contract_type: string | null
          created_at: string | null
          custom_fields: Json | null
          deposit_amount: number | null
          deposit_percentage: number | null
          docusign_envelope_id: string | null
          effective_date: string | null
          event_date: string | null
          event_name: string | null
          event_time: string | null
          event_type: string | null
          expiration_date: string | null
          external_signature_url: string | null
          governing_state: string | null
          guest_count: number | null
          hellosign_signature_id: string | null
          id: string
          invoice_id: string | null
          is_personal: boolean | null
          notes: string | null
          organization_id: string | null
          pandadoc_document_id: string | null
          payment_schedule: Json | null
          payment_terms: string | null
          performance_details: string | null
          purpose: string | null
          quote_selection_id: string | null
          recipient_email: string | null
          recipient_name: string | null
          recipient_phone: string | null
          sender_email: string | null
          sender_name: string | null
          sent_at: string | null
          service_description: string | null
          signed_at: string | null
          signed_by_client: string | null
          signed_by_client_email: string | null
          signed_by_client_ip: string | null
          signed_by_vendor: string | null
          signed_by_vendor_at: string | null
          signing_token: string | null
          signing_token_expires_at: string | null
          status: string | null
          term_years: number | null
          total_amount: number | null
          updated_at: string | null
          vendor_signature_data: string | null
          venue_address: string | null
          venue_name: string | null
          viewed_at: string | null
        }
        Insert: {
          additional_terms?: string | null
          cancellation_policy?: string | null
          client_signature_data?: string | null
          contact_id?: string | null
          contract_html?: string | null
          contract_number: string
          contract_pdf_url?: string | null
          contract_template?: string | null
          contract_type?: string | null
          created_at?: string | null
          custom_fields?: Json | null
          deposit_amount?: number | null
          deposit_percentage?: number | null
          docusign_envelope_id?: string | null
          effective_date?: string | null
          event_date?: string | null
          event_name?: string | null
          event_time?: string | null
          event_type?: string | null
          expiration_date?: string | null
          external_signature_url?: string | null
          governing_state?: string | null
          guest_count?: number | null
          hellosign_signature_id?: string | null
          id?: string
          invoice_id?: string | null
          is_personal?: boolean | null
          notes?: string | null
          organization_id?: string | null
          pandadoc_document_id?: string | null
          payment_schedule?: Json | null
          payment_terms?: string | null
          performance_details?: string | null
          purpose?: string | null
          quote_selection_id?: string | null
          recipient_email?: string | null
          recipient_name?: string | null
          recipient_phone?: string | null
          sender_email?: string | null
          sender_name?: string | null
          sent_at?: string | null
          service_description?: string | null
          signed_at?: string | null
          signed_by_client?: string | null
          signed_by_client_email?: string | null
          signed_by_client_ip?: string | null
          signed_by_vendor?: string | null
          signed_by_vendor_at?: string | null
          signing_token?: string | null
          signing_token_expires_at?: string | null
          status?: string | null
          term_years?: number | null
          total_amount?: number | null
          updated_at?: string | null
          vendor_signature_data?: string | null
          venue_address?: string | null
          venue_name?: string | null
          viewed_at?: string | null
        }
        Update: {
          additional_terms?: string | null
          cancellation_policy?: string | null
          client_signature_data?: string | null
          contact_id?: string | null
          contract_html?: string | null
          contract_number?: string
          contract_pdf_url?: string | null
          contract_template?: string | null
          contract_type?: string | null
          created_at?: string | null
          custom_fields?: Json | null
          deposit_amount?: number | null
          deposit_percentage?: number | null
          docusign_envelope_id?: string | null
          effective_date?: string | null
          event_date?: string | null
          event_name?: string | null
          event_time?: string | null
          event_type?: string | null
          expiration_date?: string | null
          external_signature_url?: string | null
          governing_state?: string | null
          guest_count?: number | null
          hellosign_signature_id?: string | null
          id?: string
          invoice_id?: string | null
          is_personal?: boolean | null
          notes?: string | null
          organization_id?: string | null
          pandadoc_document_id?: string | null
          payment_schedule?: Json | null
          payment_terms?: string | null
          performance_details?: string | null
          purpose?: string | null
          quote_selection_id?: string | null
          recipient_email?: string | null
          recipient_name?: string | null
          recipient_phone?: string | null
          sender_email?: string | null
          sender_name?: string | null
          sent_at?: string | null
          service_description?: string | null
          signed_at?: string | null
          signed_by_client?: string | null
          signed_by_client_email?: string | null
          signed_by_client_ip?: string | null
          signed_by_vendor?: string | null
          signed_by_vendor_at?: string | null
          signing_token?: string | null
          signing_token_expires_at?: string | null
          status?: string | null
          term_years?: number | null
          total_amount?: number | null
          updated_at?: string | null
          vendor_signature_data?: string | null
          venue_address?: string | null
          venue_name?: string | null
          viewed_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contracts_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "client_payment_summary"
            referencedColumns: ["contact_id"]
          },
          {
            foreignKeyName: "contracts_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contracts_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "hot_leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contracts_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "outstanding_balances"
            referencedColumns: ["contact_id"]
          },
          {
            foreignKeyName: "contracts_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoice_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contracts_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contracts_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "overdue_invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contracts_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contracts_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "venue_roster"
            referencedColumns: ["performer_id"]
          },
          {
            foreignKeyName: "contracts_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "venue_roster"
            referencedColumns: ["venue_id"]
          },
          {
            foreignKeyName: "contracts_quote_selection_id_fkey"
            columns: ["quote_selection_id"]
            isOneToOne: false
            referencedRelation: "quote_selections"
            referencedColumns: ["id"]
          },
        ]
      }
      crowd_requests: {
        Row: {
          admin_notes: string | null
          album_art_url: string | null
          amount_paid: number | null
          amount_requested: number
          artist_rights_confirmed: boolean | null
          auction_won_at: string | null
          audio_download_error: string | null
          audio_download_status: string | null
          audio_downloaded_at: string | null
          audio_file_url: string | null
          audio_upload_fee: number | null
          bidding_enabled: boolean | null
          bidding_round_id: string | null
          created_at: string | null
          current_bid_amount: number | null
          downloaded_audio_url: string | null
          event_date: string | null
          event_id: string | null
          event_name: string | null
          event_qr_code: string | null
          fast_track_fee: number | null
          highest_bidder_email: string | null
          highest_bidder_name: string | null
          id: string
          is_artist: boolean | null
          is_auction_winner: boolean | null
          is_custom_audio: boolean | null
          is_fast_track: boolean | null
          is_next: boolean | null
          matched_play_id: string | null
          music_service_links: Json | null
          next_fee: number | null
          normalized_artist: string | null
          normalized_title: string | null
          notification_sent: boolean | null
          notification_sent_at: string | null
          organization_id: string | null
          paid_at: string | null
          payment_code: string | null
          payment_intent_id: string | null
          payment_method: string | null
          payment_status: string | null
          played_at: string | null
          posted_link: string | null
          priority_order: number | null
          recipient_message: string | null
          recipient_name: string | null
          request_message: string | null
          request_type: string
          requester_email: string | null
          requester_name: string
          requester_phone: string | null
          requester_venmo_username: string | null
          song_artist: string | null
          song_title: string | null
          source_domain: string | null
          status: string | null
          stripe_session_id: string | null
          updated_at: string | null
          visitor_id: string | null
        }
        Insert: {
          admin_notes?: string | null
          album_art_url?: string | null
          amount_paid?: number | null
          amount_requested?: number
          artist_rights_confirmed?: boolean | null
          auction_won_at?: string | null
          audio_download_error?: string | null
          audio_download_status?: string | null
          audio_downloaded_at?: string | null
          audio_file_url?: string | null
          audio_upload_fee?: number | null
          bidding_enabled?: boolean | null
          bidding_round_id?: string | null
          created_at?: string | null
          current_bid_amount?: number | null
          downloaded_audio_url?: string | null
          event_date?: string | null
          event_id?: string | null
          event_name?: string | null
          event_qr_code?: string | null
          fast_track_fee?: number | null
          highest_bidder_email?: string | null
          highest_bidder_name?: string | null
          id?: string
          is_artist?: boolean | null
          is_auction_winner?: boolean | null
          is_custom_audio?: boolean | null
          is_fast_track?: boolean | null
          is_next?: boolean | null
          matched_play_id?: string | null
          music_service_links?: Json | null
          next_fee?: number | null
          normalized_artist?: string | null
          normalized_title?: string | null
          notification_sent?: boolean | null
          notification_sent_at?: string | null
          organization_id?: string | null
          paid_at?: string | null
          payment_code?: string | null
          payment_intent_id?: string | null
          payment_method?: string | null
          payment_status?: string | null
          played_at?: string | null
          posted_link?: string | null
          priority_order?: number | null
          recipient_message?: string | null
          recipient_name?: string | null
          request_message?: string | null
          request_type: string
          requester_email?: string | null
          requester_name: string
          requester_phone?: string | null
          requester_venmo_username?: string | null
          song_artist?: string | null
          song_title?: string | null
          source_domain?: string | null
          status?: string | null
          stripe_session_id?: string | null
          updated_at?: string | null
          visitor_id?: string | null
        }
        Update: {
          admin_notes?: string | null
          album_art_url?: string | null
          amount_paid?: number | null
          amount_requested?: number
          artist_rights_confirmed?: boolean | null
          auction_won_at?: string | null
          audio_download_error?: string | null
          audio_download_status?: string | null
          audio_downloaded_at?: string | null
          audio_file_url?: string | null
          audio_upload_fee?: number | null
          bidding_enabled?: boolean | null
          bidding_round_id?: string | null
          created_at?: string | null
          current_bid_amount?: number | null
          downloaded_audio_url?: string | null
          event_date?: string | null
          event_id?: string | null
          event_name?: string | null
          event_qr_code?: string | null
          fast_track_fee?: number | null
          highest_bidder_email?: string | null
          highest_bidder_name?: string | null
          id?: string
          is_artist?: boolean | null
          is_auction_winner?: boolean | null
          is_custom_audio?: boolean | null
          is_fast_track?: boolean | null
          is_next?: boolean | null
          matched_play_id?: string | null
          music_service_links?: Json | null
          next_fee?: number | null
          normalized_artist?: string | null
          normalized_title?: string | null
          notification_sent?: boolean | null
          notification_sent_at?: string | null
          organization_id?: string | null
          paid_at?: string | null
          payment_code?: string | null
          payment_intent_id?: string | null
          payment_method?: string | null
          payment_status?: string | null
          played_at?: string | null
          posted_link?: string | null
          priority_order?: number | null
          recipient_message?: string | null
          recipient_name?: string | null
          request_message?: string | null
          request_type?: string
          requester_email?: string | null
          requester_name?: string
          requester_phone?: string | null
          requester_venmo_username?: string | null
          song_artist?: string | null
          song_title?: string | null
          source_domain?: string | null
          status?: string | null
          stripe_session_id?: string | null
          updated_at?: string | null
          visitor_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "crowd_requests_bidding_round_id_fkey"
            columns: ["bidding_round_id"]
            isOneToOne: false
            referencedRelation: "bidding_rounds"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crowd_requests_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "client_payment_summary"
            referencedColumns: ["contact_id"]
          },
          {
            foreignKeyName: "crowd_requests_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crowd_requests_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "hot_leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crowd_requests_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "outstanding_balances"
            referencedColumns: ["contact_id"]
          },
          {
            foreignKeyName: "crowd_requests_matched_play_id_fkey"
            columns: ["matched_play_id"]
            isOneToOne: false
            referencedRelation: "serato_play_history"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crowd_requests_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crowd_requests_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "venue_roster"
            referencedColumns: ["performer_id"]
          },
          {
            foreignKeyName: "crowd_requests_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "venue_roster"
            referencedColumns: ["venue_id"]
          },
          {
            foreignKeyName: "crowd_requests_visitor_id_fkey"
            columns: ["visitor_id"]
            isOneToOne: false
            referencedRelation: "visitor_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      discount_code_usage: {
        Row: {
          discount_amount: number
          discount_code_id: string
          final_amount: number
          id: string
          lead_id: string
          original_amount: number
          quote_id: string | null
          used_at: string | null
        }
        Insert: {
          discount_amount: number
          discount_code_id: string
          final_amount: number
          id?: string
          lead_id: string
          original_amount: number
          quote_id?: string | null
          used_at?: string | null
        }
        Update: {
          discount_amount?: number
          discount_code_id?: string
          final_amount?: number
          id?: string
          lead_id?: string
          original_amount?: number
          quote_id?: string | null
          used_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "discount_code_usage_discount_code_id_fkey"
            columns: ["discount_code_id"]
            isOneToOne: false
            referencedRelation: "discount_codes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_lead"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "client_payment_summary"
            referencedColumns: ["contact_id"]
          },
          {
            foreignKeyName: "fk_lead"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_lead"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "hot_leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_lead"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "outstanding_balances"
            referencedColumns: ["contact_id"]
          },
        ]
      }
      discount_codes: {
        Row: {
          active: boolean | null
          applies_to: string | null
          code: string
          created_at: string | null
          created_by: string | null
          current_uses: number | null
          deleted_at: string | null
          description: string | null
          discount_type: string
          discount_value: number
          id: string
          is_active: boolean | null
          max_uses: number | null
          min_order_amount: number | null
          organization_id: string | null
          service_types: string[] | null
          updated_at: string | null
          valid_from: string | null
          valid_until: string | null
        }
        Insert: {
          active?: boolean | null
          applies_to?: string | null
          code: string
          created_at?: string | null
          created_by?: string | null
          current_uses?: number | null
          deleted_at?: string | null
          description?: string | null
          discount_type: string
          discount_value: number
          id?: string
          is_active?: boolean | null
          max_uses?: number | null
          min_order_amount?: number | null
          organization_id?: string | null
          service_types?: string[] | null
          updated_at?: string | null
          valid_from?: string | null
          valid_until?: string | null
        }
        Update: {
          active?: boolean | null
          applies_to?: string | null
          code?: string
          created_at?: string | null
          created_by?: string | null
          current_uses?: number | null
          deleted_at?: string | null
          description?: string | null
          discount_type?: string
          discount_value?: number
          id?: string
          is_active?: boolean | null
          max_uses?: number | null
          min_order_amount?: number | null
          organization_id?: string | null
          service_types?: string[] | null
          updated_at?: string | null
          valid_from?: string | null
          valid_until?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "discount_codes_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "discount_codes_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "venue_roster"
            referencedColumns: ["performer_id"]
          },
          {
            foreignKeyName: "discount_codes_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "venue_roster"
            referencedColumns: ["venue_id"]
          },
        ]
      }
      discount_usage: {
        Row: {
          contact_id: string | null
          discount_amount: number
          discount_code_id: string | null
          final_amount: number
          id: string
          invoice_id: string | null
          organization_id: string | null
          original_amount: number
          used_at: string | null
        }
        Insert: {
          contact_id?: string | null
          discount_amount: number
          discount_code_id?: string | null
          final_amount: number
          id?: string
          invoice_id?: string | null
          organization_id?: string | null
          original_amount: number
          used_at?: string | null
        }
        Update: {
          contact_id?: string | null
          discount_amount?: number
          discount_code_id?: string | null
          final_amount?: number
          id?: string
          invoice_id?: string | null
          organization_id?: string | null
          original_amount?: number
          used_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "discount_usage_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "client_payment_summary"
            referencedColumns: ["contact_id"]
          },
          {
            foreignKeyName: "discount_usage_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "discount_usage_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "hot_leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "discount_usage_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "outstanding_balances"
            referencedColumns: ["contact_id"]
          },
          {
            foreignKeyName: "discount_usage_discount_code_id_fkey"
            columns: ["discount_code_id"]
            isOneToOne: false
            referencedRelation: "discount_codes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "discount_usage_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoice_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "discount_usage_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "discount_usage_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "overdue_invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "discount_usage_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "discount_usage_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "venue_roster"
            referencedColumns: ["performer_id"]
          },
          {
            foreignKeyName: "discount_usage_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "venue_roster"
            referencedColumns: ["venue_id"]
          },
        ]
      }
      dj_availability: {
        Row: {
          auto_blocked: boolean | null
          created_at: string | null
          date: string
          dj_profile_id: string
          id: string
          locked_by_lead_id: string | null
          locked_until: string | null
          notes: string | null
          status: string
          time_slots: Json | null
          updated_at: string | null
        }
        Insert: {
          auto_blocked?: boolean | null
          created_at?: string | null
          date: string
          dj_profile_id: string
          id?: string
          locked_by_lead_id?: string | null
          locked_until?: string | null
          notes?: string | null
          status: string
          time_slots?: Json | null
          updated_at?: string | null
        }
        Update: {
          auto_blocked?: boolean | null
          created_at?: string | null
          date?: string
          dj_profile_id?: string
          id?: string
          locked_by_lead_id?: string | null
          locked_until?: string | null
          notes?: string | null
          status?: string
          time_slots?: Json | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "dj_availability_dj_profile_id_fkey"
            columns: ["dj_profile_id"]
            isOneToOne: false
            referencedRelation: "dj_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dj_availability_locked_by_lead_id_fkey"
            columns: ["locked_by_lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      dj_badges: {
        Row: {
          badge_icon: string | null
          badge_label: string
          badge_type: string
          dj_profile_id: string
          earned_at: string | null
          expires_at: string | null
          id: string
          is_active: boolean | null
        }
        Insert: {
          badge_icon?: string | null
          badge_label: string
          badge_type: string
          dj_profile_id: string
          earned_at?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
        }
        Update: {
          badge_icon?: string | null
          badge_label?: string
          badge_type?: string
          dj_profile_id?: string
          earned_at?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "dj_badges_dj_profile_id_fkey"
            columns: ["dj_profile_id"]
            isOneToOne: false
            referencedRelation: "dj_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      dj_calls: {
        Row: {
          booking_id: string | null
          call_duration_seconds: number | null
          call_sid: string | null
          call_status: string | null
          caller_name: string | null
          caller_number: string
          consent_recorded: boolean | null
          consent_timestamp: string | null
          created_at: string
          dj_profile_id: string
          event_type: string | null
          extracted_metadata: Json | null
          id: string
          is_booked: boolean | null
          lead_score: string | null
          notes: string | null
          page_url: string | null
          product_context: string | null
          recording_duration_seconds: number | null
          recording_sid: string | null
          recording_storage_bucket: string | null
          recording_storage_path: string | null
          recording_url: string | null
          timestamp: string
          tipjar_link: string | null
          tipjar_link_sent: boolean | null
          tipjar_payment_amount: number | null
          tipjar_payment_id: string | null
          tipjar_payment_received: boolean | null
          transcription_confidence: number | null
          transcription_status: string | null
          transcription_text: string | null
          updated_at: string
          virtual_number: string
        }
        Insert: {
          booking_id?: string | null
          call_duration_seconds?: number | null
          call_sid?: string | null
          call_status?: string | null
          caller_name?: string | null
          caller_number: string
          consent_recorded?: boolean | null
          consent_timestamp?: string | null
          created_at?: string
          dj_profile_id: string
          event_type?: string | null
          extracted_metadata?: Json | null
          id?: string
          is_booked?: boolean | null
          lead_score?: string | null
          notes?: string | null
          page_url?: string | null
          product_context?: string | null
          recording_duration_seconds?: number | null
          recording_sid?: string | null
          recording_storage_bucket?: string | null
          recording_storage_path?: string | null
          recording_url?: string | null
          timestamp?: string
          tipjar_link?: string | null
          tipjar_link_sent?: boolean | null
          tipjar_payment_amount?: number | null
          tipjar_payment_id?: string | null
          tipjar_payment_received?: boolean | null
          transcription_confidence?: number | null
          transcription_status?: string | null
          transcription_text?: string | null
          updated_at?: string
          virtual_number: string
        }
        Update: {
          booking_id?: string | null
          call_duration_seconds?: number | null
          call_sid?: string | null
          call_status?: string | null
          caller_name?: string | null
          caller_number?: string
          consent_recorded?: boolean | null
          consent_timestamp?: string | null
          created_at?: string
          dj_profile_id?: string
          event_type?: string | null
          extracted_metadata?: Json | null
          id?: string
          is_booked?: boolean | null
          lead_score?: string | null
          notes?: string | null
          page_url?: string | null
          product_context?: string | null
          recording_duration_seconds?: number | null
          recording_sid?: string | null
          recording_storage_bucket?: string | null
          recording_storage_path?: string | null
          recording_url?: string | null
          timestamp?: string
          tipjar_link?: string | null
          tipjar_link_sent?: boolean | null
          tipjar_payment_amount?: number | null
          tipjar_payment_id?: string | null
          tipjar_payment_received?: boolean | null
          transcription_confidence?: number | null
          transcription_status?: string | null
          transcription_text?: string | null
          updated_at?: string
          virtual_number?: string
        }
        Relationships: [
          {
            foreignKeyName: "dj_calls_dj_profile_id_fkey"
            columns: ["dj_profile_id"]
            isOneToOne: false
            referencedRelation: "dj_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      dj_custom_domains: {
        Row: {
          created_at: string | null
          dj_profile_id: string
          dns_records: Json | null
          domain: string
          id: string
          is_active: boolean | null
          is_verified: boolean | null
          ssl_certificate_status: string | null
          updated_at: string | null
          verification_token: string | null
        }
        Insert: {
          created_at?: string | null
          dj_profile_id: string
          dns_records?: Json | null
          domain: string
          id?: string
          is_active?: boolean | null
          is_verified?: boolean | null
          ssl_certificate_status?: string | null
          updated_at?: string | null
          verification_token?: string | null
        }
        Update: {
          created_at?: string | null
          dj_profile_id?: string
          dns_records?: Json | null
          domain?: string
          id?: string
          is_active?: boolean | null
          is_verified?: boolean | null
          ssl_certificate_status?: string | null
          updated_at?: string | null
          verification_token?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "dj_custom_domains_dj_profile_id_fkey"
            columns: ["dj_profile_id"]
            isOneToOne: false
            referencedRelation: "dj_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      dj_inquiries: {
        Row: {
          auto_rejected: boolean | null
          budget_amount: number | null
          budget_range: string | null
          converted_at: string | null
          converted_to_contact_id: string | null
          created_at: string | null
          custom_fields: Json | null
          dj_profile_id: string
          event_date: string | null
          event_time: string | null
          event_type: string
          guest_count: number | null
          id: string
          inquiry_status: string | null
          lead_quality: string | null
          lead_score: number | null
          lead_temperature: string | null
          minimum_budget_met: boolean | null
          multi_inquiry_id: string | null
          notes: string | null
          planner_email: string
          planner_name: string
          planner_phone: string | null
          rejection_reason: string | null
          special_requests: string | null
          status: string | null
          updated_at: string | null
          venue_address: string | null
          venue_name: string | null
        }
        Insert: {
          auto_rejected?: boolean | null
          budget_amount?: number | null
          budget_range?: string | null
          converted_at?: string | null
          converted_to_contact_id?: string | null
          created_at?: string | null
          custom_fields?: Json | null
          dj_profile_id: string
          event_date?: string | null
          event_time?: string | null
          event_type: string
          guest_count?: number | null
          id?: string
          inquiry_status?: string | null
          lead_quality?: string | null
          lead_score?: number | null
          lead_temperature?: string | null
          minimum_budget_met?: boolean | null
          multi_inquiry_id?: string | null
          notes?: string | null
          planner_email: string
          planner_name: string
          planner_phone?: string | null
          rejection_reason?: string | null
          special_requests?: string | null
          status?: string | null
          updated_at?: string | null
          venue_address?: string | null
          venue_name?: string | null
        }
        Update: {
          auto_rejected?: boolean | null
          budget_amount?: number | null
          budget_range?: string | null
          converted_at?: string | null
          converted_to_contact_id?: string | null
          created_at?: string | null
          custom_fields?: Json | null
          dj_profile_id?: string
          event_date?: string | null
          event_time?: string | null
          event_type?: string
          guest_count?: number | null
          id?: string
          inquiry_status?: string | null
          lead_quality?: string | null
          lead_score?: number | null
          lead_temperature?: string | null
          minimum_budget_met?: boolean | null
          multi_inquiry_id?: string | null
          notes?: string | null
          planner_email?: string
          planner_name?: string
          planner_phone?: string | null
          rejection_reason?: string | null
          special_requests?: string | null
          status?: string | null
          updated_at?: string | null
          venue_address?: string | null
          venue_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "dj_inquiries_converted_to_contact_id_fkey"
            columns: ["converted_to_contact_id"]
            isOneToOne: false
            referencedRelation: "client_payment_summary"
            referencedColumns: ["contact_id"]
          },
          {
            foreignKeyName: "dj_inquiries_converted_to_contact_id_fkey"
            columns: ["converted_to_contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dj_inquiries_converted_to_contact_id_fkey"
            columns: ["converted_to_contact_id"]
            isOneToOne: false
            referencedRelation: "hot_leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dj_inquiries_converted_to_contact_id_fkey"
            columns: ["converted_to_contact_id"]
            isOneToOne: false
            referencedRelation: "outstanding_balances"
            referencedColumns: ["contact_id"]
          },
          {
            foreignKeyName: "dj_inquiries_dj_profile_id_fkey"
            columns: ["dj_profile_id"]
            isOneToOne: false
            referencedRelation: "dj_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dj_inquiries_multi_inquiry_id_fkey"
            columns: ["multi_inquiry_id"]
            isOneToOne: false
            referencedRelation: "multi_inquiries"
            referencedColumns: ["id"]
          },
        ]
      }
      dj_network_profiles: {
        Row: {
          accepts_leads: boolean | null
          auto_accept_leads: boolean | null
          average_rating: number | null
          average_response_time_hours: number | null
          bio: string | null
          booking_rate: number | null
          business_name: string
          created_at: string | null
          current_month_leads: number | null
          dj_name: string | null
          event_types: string[] | null
          featured_until: string | null
          id: string
          is_active: boolean | null
          is_featured: boolean | null
          is_verified: boolean | null
          last_lead_received_at: string | null
          lead_notification_email: boolean | null
          lead_notification_sms: boolean | null
          lead_response_time_hours: number | null
          lead_types_accepted: string[] | null
          leads_booked: number | null
          leads_contacted: number | null
          leads_received_total: number | null
          max_leads_per_month: number | null
          organization_id: string | null
          portfolio_images: string[] | null
          price_range: string | null
          public_email: string | null
          public_phone: string | null
          service_cities: string[] | null
          service_radius_miles: number | null
          service_states: string[] | null
          social_media: Json | null
          specialties: string[] | null
          starting_price: number | null
          subscription_expires_at: string | null
          subscription_status: string | null
          subscription_tier: string | null
          testimonials: Json | null
          total_events_completed: number | null
          total_reviews: number | null
          updated_at: string | null
          user_id: string | null
          video_urls: string[] | null
          website_url: string | null
          years_experience: number | null
        }
        Insert: {
          accepts_leads?: boolean | null
          auto_accept_leads?: boolean | null
          average_rating?: number | null
          average_response_time_hours?: number | null
          bio?: string | null
          booking_rate?: number | null
          business_name: string
          created_at?: string | null
          current_month_leads?: number | null
          dj_name?: string | null
          event_types?: string[] | null
          featured_until?: string | null
          id?: string
          is_active?: boolean | null
          is_featured?: boolean | null
          is_verified?: boolean | null
          last_lead_received_at?: string | null
          lead_notification_email?: boolean | null
          lead_notification_sms?: boolean | null
          lead_response_time_hours?: number | null
          lead_types_accepted?: string[] | null
          leads_booked?: number | null
          leads_contacted?: number | null
          leads_received_total?: number | null
          max_leads_per_month?: number | null
          organization_id?: string | null
          portfolio_images?: string[] | null
          price_range?: string | null
          public_email?: string | null
          public_phone?: string | null
          service_cities?: string[] | null
          service_radius_miles?: number | null
          service_states?: string[] | null
          social_media?: Json | null
          specialties?: string[] | null
          starting_price?: number | null
          subscription_expires_at?: string | null
          subscription_status?: string | null
          subscription_tier?: string | null
          testimonials?: Json | null
          total_events_completed?: number | null
          total_reviews?: number | null
          updated_at?: string | null
          user_id?: string | null
          video_urls?: string[] | null
          website_url?: string | null
          years_experience?: number | null
        }
        Update: {
          accepts_leads?: boolean | null
          auto_accept_leads?: boolean | null
          average_rating?: number | null
          average_response_time_hours?: number | null
          bio?: string | null
          booking_rate?: number | null
          business_name?: string
          created_at?: string | null
          current_month_leads?: number | null
          dj_name?: string | null
          event_types?: string[] | null
          featured_until?: string | null
          id?: string
          is_active?: boolean | null
          is_featured?: boolean | null
          is_verified?: boolean | null
          last_lead_received_at?: string | null
          lead_notification_email?: boolean | null
          lead_notification_sms?: boolean | null
          lead_response_time_hours?: number | null
          lead_types_accepted?: string[] | null
          leads_booked?: number | null
          leads_contacted?: number | null
          leads_received_total?: number | null
          max_leads_per_month?: number | null
          organization_id?: string | null
          portfolio_images?: string[] | null
          price_range?: string | null
          public_email?: string | null
          public_phone?: string | null
          service_cities?: string[] | null
          service_radius_miles?: number | null
          service_states?: string[] | null
          social_media?: Json | null
          specialties?: string[] | null
          starting_price?: number | null
          subscription_expires_at?: string | null
          subscription_status?: string | null
          subscription_tier?: string | null
          testimonials?: Json | null
          total_events_completed?: number | null
          total_reviews?: number | null
          updated_at?: string | null
          user_id?: string | null
          video_urls?: string[] | null
          website_url?: string | null
          years_experience?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "dj_network_profiles_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dj_network_profiles_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "venue_roster"
            referencedColumns: ["performer_id"]
          },
          {
            foreignKeyName: "dj_network_profiles_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "venue_roster"
            referencedColumns: ["venue_id"]
          },
        ]
      }
      dj_page_analytics: {
        Row: {
          booking_conversion_rate: number | null
          booking_requests: number | null
          created_at: string | null
          date: string
          dj_profile_id: string
          id: string
          inquiry_conversion_rate: number | null
          inquiry_form_views: number | null
          inquiry_submissions: number | null
          page_views: number | null
          quote_requests: number | null
          tipjar_clicks: number | null
          traffic_sources: Json | null
          unique_visitors: number | null
          updated_at: string | null
        }
        Insert: {
          booking_conversion_rate?: number | null
          booking_requests?: number | null
          created_at?: string | null
          date?: string
          dj_profile_id: string
          id?: string
          inquiry_conversion_rate?: number | null
          inquiry_form_views?: number | null
          inquiry_submissions?: number | null
          page_views?: number | null
          quote_requests?: number | null
          tipjar_clicks?: number | null
          traffic_sources?: Json | null
          unique_visitors?: number | null
          updated_at?: string | null
        }
        Update: {
          booking_conversion_rate?: number | null
          booking_requests?: number | null
          created_at?: string | null
          date?: string
          dj_profile_id?: string
          id?: string
          inquiry_conversion_rate?: number | null
          inquiry_form_views?: number | null
          inquiry_submissions?: number | null
          page_views?: number | null
          quote_requests?: number | null
          tipjar_clicks?: number | null
          traffic_sources?: Json | null
          unique_visitors?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "dj_page_analytics_dj_profile_id_fkey"
            columns: ["dj_profile_id"]
            isOneToOne: false
            referencedRelation: "dj_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      dj_pricing_insights: {
        Row: {
          city: string
          created_at: string | null
          dj_current_price: number | null
          dj_pricing_model: string | null
          dj_profile_id: string
          event_type: string
          id: string
          insight_text: string | null
          last_updated: string | null
          market_high: number | null
          market_low: number | null
          market_median: number | null
          market_position: string | null
          market_range_text: string | null
          position_percentage: number | null
          positioning_text: string | null
          state: string | null
          stats_snapshot_id: string | null
          updated_at: string | null
        }
        Insert: {
          city: string
          created_at?: string | null
          dj_current_price?: number | null
          dj_pricing_model?: string | null
          dj_profile_id: string
          event_type: string
          id?: string
          insight_text?: string | null
          last_updated?: string | null
          market_high?: number | null
          market_low?: number | null
          market_median?: number | null
          market_position?: string | null
          market_range_text?: string | null
          position_percentage?: number | null
          positioning_text?: string | null
          state?: string | null
          stats_snapshot_id?: string | null
          updated_at?: string | null
        }
        Update: {
          city?: string
          created_at?: string | null
          dj_current_price?: number | null
          dj_pricing_model?: string | null
          dj_profile_id?: string
          event_type?: string
          id?: string
          insight_text?: string | null
          last_updated?: string | null
          market_high?: number | null
          market_low?: number | null
          market_median?: number | null
          market_position?: string | null
          market_range_text?: string | null
          position_percentage?: number | null
          positioning_text?: string | null
          state?: string | null
          stats_snapshot_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "dj_pricing_insights_dj_profile_id_fkey"
            columns: ["dj_profile_id"]
            isOneToOne: false
            referencedRelation: "dj_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dj_pricing_insights_stats_snapshot_id_fkey"
            columns: ["stats_snapshot_id"]
            isOneToOne: false
            referencedRelation: "city_pricing_stats"
            referencedColumns: ["id"]
          },
        ]
      }
      dj_profiles: {
        Row: {
          ai_generated_content: Json | null
          availability_message: string | null
          availability_status: string | null
          bio: string | null
          booking_count: number | null
          city: string | null
          city_availability: Json | null
          city_pricing: Json | null
          city_tags: string[] | null
          cover_image_url: string | null
          created_at: string | null
          custom_cta_text: string | null
          custom_domain: string | null
          dj_name: string
          dj_slug: string
          event_types: string[] | null
          hide_djdash_branding: boolean | null
          id: string
          is_featured: boolean | null
          is_published: boolean | null
          lead_count: number | null
          mixcloud_url: string | null
          organization_id: string
          page_views: number | null
          photo_gallery_urls: string[] | null
          price_range_max: number | null
          price_range_min: number | null
          primary_city: string | null
          profile_image_url: string | null
          section_order: Json | null
          seo_description: string | null
          seo_title: string | null
          service_areas: string[] | null
          service_radius_miles: number | null
          social_links: Json | null
          soundcloud_url: string | null
          starting_price_range: string | null
          state: string | null
          tagline: string | null
          theme_colors: Json | null
          updated_at: string | null
          video_highlights: Json | null
          zip_code: string | null
        }
        Insert: {
          ai_generated_content?: Json | null
          availability_message?: string | null
          availability_status?: string | null
          bio?: string | null
          booking_count?: number | null
          city?: string | null
          city_availability?: Json | null
          city_pricing?: Json | null
          city_tags?: string[] | null
          cover_image_url?: string | null
          created_at?: string | null
          custom_cta_text?: string | null
          custom_domain?: string | null
          dj_name: string
          dj_slug: string
          event_types?: string[] | null
          hide_djdash_branding?: boolean | null
          id?: string
          is_featured?: boolean | null
          is_published?: boolean | null
          lead_count?: number | null
          mixcloud_url?: string | null
          organization_id: string
          page_views?: number | null
          photo_gallery_urls?: string[] | null
          price_range_max?: number | null
          price_range_min?: number | null
          primary_city?: string | null
          profile_image_url?: string | null
          section_order?: Json | null
          seo_description?: string | null
          seo_title?: string | null
          service_areas?: string[] | null
          service_radius_miles?: number | null
          social_links?: Json | null
          soundcloud_url?: string | null
          starting_price_range?: string | null
          state?: string | null
          tagline?: string | null
          theme_colors?: Json | null
          updated_at?: string | null
          video_highlights?: Json | null
          zip_code?: string | null
        }
        Update: {
          ai_generated_content?: Json | null
          availability_message?: string | null
          availability_status?: string | null
          bio?: string | null
          booking_count?: number | null
          city?: string | null
          city_availability?: Json | null
          city_pricing?: Json | null
          city_tags?: string[] | null
          cover_image_url?: string | null
          created_at?: string | null
          custom_cta_text?: string | null
          custom_domain?: string | null
          dj_name?: string
          dj_slug?: string
          event_types?: string[] | null
          hide_djdash_branding?: boolean | null
          id?: string
          is_featured?: boolean | null
          is_published?: boolean | null
          lead_count?: number | null
          mixcloud_url?: string | null
          organization_id?: string
          page_views?: number | null
          photo_gallery_urls?: string[] | null
          price_range_max?: number | null
          price_range_min?: number | null
          primary_city?: string | null
          profile_image_url?: string | null
          section_order?: Json | null
          seo_description?: string | null
          seo_title?: string | null
          service_areas?: string[] | null
          service_radius_miles?: number | null
          social_links?: Json | null
          soundcloud_url?: string | null
          starting_price_range?: string | null
          state?: string | null
          tagline?: string | null
          theme_colors?: Json | null
          updated_at?: string | null
          video_highlights?: Json | null
          zip_code?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "dj_profiles_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: true
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dj_profiles_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: true
            referencedRelation: "venue_roster"
            referencedColumns: ["performer_id"]
          },
          {
            foreignKeyName: "dj_profiles_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: true
            referencedRelation: "venue_roster"
            referencedColumns: ["venue_id"]
          },
        ]
      }
      dj_reviews: {
        Row: {
          contact_id: string | null
          created_at: string | null
          dj_profile_id: string
          event_date: string | null
          event_type: string | null
          headline: string | null
          id: string
          is_approved: boolean | null
          is_featured: boolean | null
          is_verified: boolean | null
          moderation_notes: string | null
          positive_notes: string[] | null
          rating: number
          review_aspects: string[] | null
          review_text: string
          reviewer_email: string | null
          reviewer_name: string
          updated_at: string | null
          venue_name: string | null
          verification_method: string | null
          verified_at: string | null
        }
        Insert: {
          contact_id?: string | null
          created_at?: string | null
          dj_profile_id: string
          event_date?: string | null
          event_type?: string | null
          headline?: string | null
          id?: string
          is_approved?: boolean | null
          is_featured?: boolean | null
          is_verified?: boolean | null
          moderation_notes?: string | null
          positive_notes?: string[] | null
          rating: number
          review_aspects?: string[] | null
          review_text: string
          reviewer_email?: string | null
          reviewer_name: string
          updated_at?: string | null
          venue_name?: string | null
          verification_method?: string | null
          verified_at?: string | null
        }
        Update: {
          contact_id?: string | null
          created_at?: string | null
          dj_profile_id?: string
          event_date?: string | null
          event_type?: string | null
          headline?: string | null
          id?: string
          is_approved?: boolean | null
          is_featured?: boolean | null
          is_verified?: boolean | null
          moderation_notes?: string | null
          positive_notes?: string[] | null
          rating?: number
          review_aspects?: string[] | null
          review_text?: string
          reviewer_email?: string | null
          reviewer_name?: string
          updated_at?: string | null
          venue_name?: string | null
          verification_method?: string | null
          verified_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "dj_reviews_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "client_payment_summary"
            referencedColumns: ["contact_id"]
          },
          {
            foreignKeyName: "dj_reviews_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dj_reviews_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "hot_leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dj_reviews_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "outstanding_balances"
            referencedColumns: ["contact_id"]
          },
          {
            foreignKeyName: "dj_reviews_dj_profile_id_fkey"
            columns: ["dj_profile_id"]
            isOneToOne: false
            referencedRelation: "dj_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      dj_routing_metrics: {
        Row: {
          acceptance_rate: number | null
          conversion_rate: number | null
          cooldown_until: string | null
          created_at: string | null
          decline_rate: number | null
          dj_profile_id: string
          id: string
          ignore_rate: number | null
          is_active: boolean | null
          is_suspended: boolean | null
          last_penalty_applied_at: string | null
          last_response_at: string | null
          last_routed_at: string | null
          penalty_decay_rate: number | null
          price_range_max: number | null
          price_range_midpoint: number | null
          price_range_min: number | null
          pricing_tier: string | null
          recent_lead_penalty: number | null
          reliability_score: number | null
          response_speed_avg_seconds: number | null
          routing_score: number | null
          routing_score_components: Json | null
          suspension_reason: string | null
          total_leads_accepted: number | null
          total_leads_declined: number | null
          total_leads_ignored: number | null
          total_leads_received: number | null
          updated_at: string | null
        }
        Insert: {
          acceptance_rate?: number | null
          conversion_rate?: number | null
          cooldown_until?: string | null
          created_at?: string | null
          decline_rate?: number | null
          dj_profile_id: string
          id?: string
          ignore_rate?: number | null
          is_active?: boolean | null
          is_suspended?: boolean | null
          last_penalty_applied_at?: string | null
          last_response_at?: string | null
          last_routed_at?: string | null
          penalty_decay_rate?: number | null
          price_range_max?: number | null
          price_range_midpoint?: number | null
          price_range_min?: number | null
          pricing_tier?: string | null
          recent_lead_penalty?: number | null
          reliability_score?: number | null
          response_speed_avg_seconds?: number | null
          routing_score?: number | null
          routing_score_components?: Json | null
          suspension_reason?: string | null
          total_leads_accepted?: number | null
          total_leads_declined?: number | null
          total_leads_ignored?: number | null
          total_leads_received?: number | null
          updated_at?: string | null
        }
        Update: {
          acceptance_rate?: number | null
          conversion_rate?: number | null
          cooldown_until?: string | null
          created_at?: string | null
          decline_rate?: number | null
          dj_profile_id?: string
          id?: string
          ignore_rate?: number | null
          is_active?: boolean | null
          is_suspended?: boolean | null
          last_penalty_applied_at?: string | null
          last_response_at?: string | null
          last_routed_at?: string | null
          penalty_decay_rate?: number | null
          price_range_max?: number | null
          price_range_midpoint?: number | null
          price_range_min?: number | null
          pricing_tier?: string | null
          recent_lead_penalty?: number | null
          reliability_score?: number | null
          response_speed_avg_seconds?: number | null
          routing_score?: number | null
          routing_score_components?: Json | null
          suspension_reason?: string | null
          total_leads_accepted?: number | null
          total_leads_declined?: number | null
          total_leads_ignored?: number | null
          total_leads_received?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "dj_routing_metrics_dj_profile_id_fkey"
            columns: ["dj_profile_id"]
            isOneToOne: true
            referencedRelation: "dj_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      dj_virtual_numbers: {
        Row: {
          call_recording_enabled: boolean | null
          created_at: string
          dj_profile_id: string
          id: string
          is_active: boolean | null
          last_call_at: string | null
          product_context: string | null
          real_phone_number: string
          rotation_weight: number | null
          total_calls: number | null
          total_duration_seconds: number | null
          transcription_enabled: boolean | null
          twilio_phone_number_sid: string
          updated_at: string
          virtual_number: string
        }
        Insert: {
          call_recording_enabled?: boolean | null
          created_at?: string
          dj_profile_id: string
          id?: string
          is_active?: boolean | null
          last_call_at?: string | null
          product_context?: string | null
          real_phone_number: string
          rotation_weight?: number | null
          total_calls?: number | null
          total_duration_seconds?: number | null
          transcription_enabled?: boolean | null
          twilio_phone_number_sid: string
          updated_at?: string
          virtual_number: string
        }
        Update: {
          call_recording_enabled?: boolean | null
          created_at?: string
          dj_profile_id?: string
          id?: string
          is_active?: boolean | null
          last_call_at?: string | null
          product_context?: string | null
          real_phone_number?: string
          rotation_weight?: number | null
          total_calls?: number | null
          total_duration_seconds?: number | null
          transcription_enabled?: boolean | null
          twilio_phone_number_sid?: string
          updated_at?: string
          virtual_number?: string
        }
        Relationships: [
          {
            foreignKeyName: "dj_virtual_numbers_dj_profile_id_fkey"
            columns: ["dj_profile_id"]
            isOneToOne: false
            referencedRelation: "dj_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      email_attachments: {
        Row: {
          content_type: string | null
          created_at: string | null
          email_id: string | null
          filename: string
          id: string
          is_processed: boolean | null
          processed_data: Json | null
          resend_attachment_id: string | null
          size_bytes: number | null
          storage_url: string | null
        }
        Insert: {
          content_type?: string | null
          created_at?: string | null
          email_id?: string | null
          filename: string
          id?: string
          is_processed?: boolean | null
          processed_data?: Json | null
          resend_attachment_id?: string | null
          size_bytes?: number | null
          storage_url?: string | null
        }
        Update: {
          content_type?: string | null
          created_at?: string | null
          email_id?: string | null
          filename?: string
          id?: string
          is_processed?: boolean | null
          processed_data?: Json | null
          resend_attachment_id?: string | null
          size_bytes?: number | null
          storage_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "email_attachments_email_id_fkey"
            columns: ["email_id"]
            isOneToOne: false
            referencedRelation: "emails"
            referencedColumns: ["id"]
          },
        ]
      }
      email_conversations: {
        Row: {
          contact_id: string | null
          created_at: string | null
          email_count: number | null
          id: string
          last_email_at: string | null
          subject: string | null
          thread_id: string | null
          updated_at: string | null
          voice_conversation_id: string | null
        }
        Insert: {
          contact_id?: string | null
          created_at?: string | null
          email_count?: number | null
          id?: string
          last_email_at?: string | null
          subject?: string | null
          thread_id?: string | null
          updated_at?: string | null
          voice_conversation_id?: string | null
        }
        Update: {
          contact_id?: string | null
          created_at?: string | null
          email_count?: number | null
          id?: string
          last_email_at?: string | null
          subject?: string | null
          thread_id?: string | null
          updated_at?: string | null
          voice_conversation_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "email_conversations_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "client_payment_summary"
            referencedColumns: ["contact_id"]
          },
          {
            foreignKeyName: "email_conversations_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_conversations_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "hot_leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_conversations_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "outstanding_balances"
            referencedColumns: ["contact_id"]
          },
          {
            foreignKeyName: "email_conversations_voice_conversation_id_fkey"
            columns: ["voice_conversation_id"]
            isOneToOne: false
            referencedRelation: "voice_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      email_inboxes: {
        Row: {
          contact_id: string | null
          created_at: string | null
          display_name: string | null
          email_address: string
          id: string
          is_active: boolean | null
          organization_id: string | null
          product_id: string | null
          updated_at: string | null
        }
        Insert: {
          contact_id?: string | null
          created_at?: string | null
          display_name?: string | null
          email_address: string
          id?: string
          is_active?: boolean | null
          organization_id?: string | null
          product_id?: string | null
          updated_at?: string | null
        }
        Update: {
          contact_id?: string | null
          created_at?: string | null
          display_name?: string | null
          email_address?: string
          id?: string
          is_active?: boolean | null
          organization_id?: string | null
          product_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "email_inboxes_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "client_payment_summary"
            referencedColumns: ["contact_id"]
          },
          {
            foreignKeyName: "email_inboxes_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_inboxes_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "hot_leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_inboxes_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "outstanding_balances"
            referencedColumns: ["contact_id"]
          },
          {
            foreignKeyName: "email_inboxes_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_inboxes_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "venue_roster"
            referencedColumns: ["performer_id"]
          },
          {
            foreignKeyName: "email_inboxes_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "venue_roster"
            referencedColumns: ["venue_id"]
          },
        ]
      }
      email_templates: {
        Row: {
          content: string
          created_at: string | null
          id: string
          is_active: boolean | null
          name: string
          organization_id: string | null
          subject: string
          template_type: string | null
          updated_at: string | null
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          organization_id?: string | null
          subject: string
          template_type?: string | null
          updated_at?: string | null
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          organization_id?: string | null
          subject?: string
          template_type?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "email_templates_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_templates_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "venue_roster"
            referencedColumns: ["performer_id"]
          },
          {
            foreignKeyName: "email_templates_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "venue_roster"
            referencedColumns: ["venue_id"]
          },
        ]
      }
      email_tracking: {
        Row: {
          clicked_at: string | null
          contact_id: string | null
          created_at: string | null
          email_id: string
          event_type: string
          id: string
          metadata: Json | null
          opened_at: string | null
          organization_id: string | null
          recipient_email: string
          sender_email: string | null
          subject: string | null
        }
        Insert: {
          clicked_at?: string | null
          contact_id?: string | null
          created_at?: string | null
          email_id: string
          event_type: string
          id?: string
          metadata?: Json | null
          opened_at?: string | null
          organization_id?: string | null
          recipient_email: string
          sender_email?: string | null
          subject?: string | null
        }
        Update: {
          clicked_at?: string | null
          contact_id?: string | null
          created_at?: string | null
          email_id?: string
          event_type?: string
          id?: string
          metadata?: Json | null
          opened_at?: string | null
          organization_id?: string | null
          recipient_email?: string
          sender_email?: string | null
          subject?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "email_tracking_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "client_payment_summary"
            referencedColumns: ["contact_id"]
          },
          {
            foreignKeyName: "email_tracking_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_tracking_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "hot_leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_tracking_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "outstanding_balances"
            referencedColumns: ["contact_id"]
          },
          {
            foreignKeyName: "email_tracking_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_tracking_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "venue_roster"
            referencedColumns: ["performer_id"]
          },
          {
            foreignKeyName: "email_tracking_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "venue_roster"
            referencedColumns: ["venue_id"]
          },
        ]
      }
      emails: {
        Row: {
          bcc_addresses: string[] | null
          body_html: string | null
          body_text: string | null
          cc_addresses: string[] | null
          created_at: string | null
          from_address: string
          id: string
          inbox_email: string
          is_archived: boolean | null
          is_read: boolean | null
          metadata: Json | null
          processed_at: string | null
          read_at: string | null
          received_at: string | null
          resend_email_id: string | null
          sent_at: string | null
          subject: string | null
          thread_id: string | null
          to_address: string
          updated_at: string | null
        }
        Insert: {
          bcc_addresses?: string[] | null
          body_html?: string | null
          body_text?: string | null
          cc_addresses?: string[] | null
          created_at?: string | null
          from_address: string
          id?: string
          inbox_email: string
          is_archived?: boolean | null
          is_read?: boolean | null
          metadata?: Json | null
          processed_at?: string | null
          read_at?: string | null
          received_at?: string | null
          resend_email_id?: string | null
          sent_at?: string | null
          subject?: string | null
          thread_id?: string | null
          to_address: string
          updated_at?: string | null
        }
        Update: {
          bcc_addresses?: string[] | null
          body_html?: string | null
          body_text?: string | null
          cc_addresses?: string[] | null
          created_at?: string | null
          from_address?: string
          id?: string
          inbox_email?: string
          is_archived?: boolean | null
          is_read?: boolean | null
          metadata?: Json | null
          processed_at?: string | null
          read_at?: string | null
          received_at?: string | null
          resend_email_id?: string | null
          sent_at?: string | null
          subject?: string | null
          thread_id?: string | null
          to_address?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      event_tickets: {
        Row: {
          checked_in: boolean | null
          checked_in_at: string | null
          checked_in_by: string | null
          created_at: string | null
          event_id: string
          id: string
          notes: string | null
          payment_method: string | null
          payment_status: string | null
          price_per_ticket: number
          purchaser_email: string
          purchaser_name: string
          purchaser_phone: string | null
          qr_code: string
          qr_code_short: string | null
          quantity: number
          stripe_payment_intent_id: string | null
          stripe_session_id: string | null
          ticket_type: string
          total_amount: number
          updated_at: string | null
        }
        Insert: {
          checked_in?: boolean | null
          checked_in_at?: string | null
          checked_in_by?: string | null
          created_at?: string | null
          event_id: string
          id?: string
          notes?: string | null
          payment_method?: string | null
          payment_status?: string | null
          price_per_ticket: number
          purchaser_email: string
          purchaser_name: string
          purchaser_phone?: string | null
          qr_code: string
          qr_code_short?: string | null
          quantity?: number
          stripe_payment_intent_id?: string | null
          stripe_session_id?: string | null
          ticket_type?: string
          total_amount: number
          updated_at?: string | null
        }
        Update: {
          checked_in?: boolean | null
          checked_in_at?: string | null
          checked_in_by?: string | null
          created_at?: string | null
          event_id?: string
          id?: string
          notes?: string | null
          payment_method?: string | null
          payment_status?: string | null
          price_per_ticket?: number
          purchaser_email?: string
          purchaser_name?: string
          purchaser_phone?: string | null
          qr_code?: string
          qr_code_short?: string | null
          quantity?: number
          stripe_payment_intent_id?: string | null
          stripe_session_id?: string | null
          ticket_type?: string
          total_amount?: number
          updated_at?: string | null
        }
        Relationships: []
      }
      events: {
        Row: {
          audio_tracking_enabled: boolean | null
          client_email: string
          client_name: string
          client_phone: string | null
          contact_id: string | null
          created_at: string | null
          deposit_amount: number | null
          deposit_paid: boolean | null
          end_time: string | null
          equipment_needed: string[] | null
          event_completed: boolean | null
          event_completed_at: string | null
          event_date: string
          event_duration: number | null
          event_name: string
          event_type: string
          final_payment_due: string | null
          final_payment_paid: boolean | null
          id: string
          number_of_guests: number | null
          organization_id: string | null
          playlist_notes: string | null
          post_event_email_sent: boolean | null
          review_request_sent: boolean | null
          special_requests: string | null
          start_time: string | null
          status: string | null
          submission_id: string | null
          timeline_notes: string | null
          total_amount: number | null
          updated_at: string | null
          venue_address: string | null
          venue_name: string | null
        }
        Insert: {
          audio_tracking_enabled?: boolean | null
          client_email: string
          client_name: string
          client_phone?: string | null
          contact_id?: string | null
          created_at?: string | null
          deposit_amount?: number | null
          deposit_paid?: boolean | null
          end_time?: string | null
          equipment_needed?: string[] | null
          event_completed?: boolean | null
          event_completed_at?: string | null
          event_date: string
          event_duration?: number | null
          event_name: string
          event_type: string
          final_payment_due?: string | null
          final_payment_paid?: boolean | null
          id?: string
          number_of_guests?: number | null
          organization_id?: string | null
          playlist_notes?: string | null
          post_event_email_sent?: boolean | null
          review_request_sent?: boolean | null
          special_requests?: string | null
          start_time?: string | null
          status?: string | null
          submission_id?: string | null
          timeline_notes?: string | null
          total_amount?: number | null
          updated_at?: string | null
          venue_address?: string | null
          venue_name?: string | null
        }
        Update: {
          audio_tracking_enabled?: boolean | null
          client_email?: string
          client_name?: string
          client_phone?: string | null
          contact_id?: string | null
          created_at?: string | null
          deposit_amount?: number | null
          deposit_paid?: boolean | null
          end_time?: string | null
          equipment_needed?: string[] | null
          event_completed?: boolean | null
          event_completed_at?: string | null
          event_date?: string
          event_duration?: number | null
          event_name?: string
          event_type?: string
          final_payment_due?: string | null
          final_payment_paid?: boolean | null
          id?: string
          number_of_guests?: number | null
          organization_id?: string | null
          playlist_notes?: string | null
          post_event_email_sent?: boolean | null
          review_request_sent?: boolean | null
          special_requests?: string | null
          start_time?: string | null
          status?: string | null
          submission_id?: string | null
          timeline_notes?: string | null
          total_amount?: number | null
          updated_at?: string | null
          venue_address?: string | null
          venue_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "events_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "client_payment_summary"
            referencedColumns: ["contact_id"]
          },
          {
            foreignKeyName: "events_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "events_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "hot_leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "events_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "outstanding_balances"
            referencedColumns: ["contact_id"]
          },
          {
            foreignKeyName: "events_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "events_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "venue_roster"
            referencedColumns: ["performer_id"]
          },
          {
            foreignKeyName: "events_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "venue_roster"
            referencedColumns: ["venue_id"]
          },
          {
            foreignKeyName: "events_submission_id_fkey"
            columns: ["submission_id"]
            isOneToOne: false
            referencedRelation: "contact_submissions"
            referencedColumns: ["id"]
          },
        ]
      }
      faqs: {
        Row: {
          answer: string
          created_at: string | null
          display_order: number | null
          id: string
          is_active: boolean | null
          organization_id: string | null
          question: string
          updated_at: string | null
        }
        Insert: {
          answer: string
          created_at?: string | null
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          organization_id?: string | null
          question: string
          updated_at?: string | null
        }
        Update: {
          answer?: string
          created_at?: string | null
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          organization_id?: string | null
          question?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "faqs_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "faqs_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "venue_roster"
            referencedColumns: ["performer_id"]
          },
          {
            foreignKeyName: "faqs_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "venue_roster"
            referencedColumns: ["venue_id"]
          },
        ]
      }
      follow_up_reminders: {
        Row: {
          completed_at: string | null
          contact_submission_id: string
          created_at: string | null
          id: string
          is_completed: boolean | null
          message: string | null
          organization_id: string | null
          reminder_date: string
          reminder_type: string
          updated_at: string | null
        }
        Insert: {
          completed_at?: string | null
          contact_submission_id: string
          created_at?: string | null
          id?: string
          is_completed?: boolean | null
          message?: string | null
          organization_id?: string | null
          reminder_date: string
          reminder_type: string
          updated_at?: string | null
        }
        Update: {
          completed_at?: string | null
          contact_submission_id?: string
          created_at?: string | null
          id?: string
          is_completed?: boolean | null
          message?: string | null
          organization_id?: string | null
          reminder_date?: string
          reminder_type?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "follow_up_reminders_contact_submission_id_fkey"
            columns: ["contact_submission_id"]
            isOneToOne: false
            referencedRelation: "contact_submissions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "follow_up_reminders_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "follow_up_reminders_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "venue_roster"
            referencedColumns: ["performer_id"]
          },
          {
            foreignKeyName: "follow_up_reminders_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "venue_roster"
            referencedColumns: ["venue_id"]
          },
        ]
      }
      followup_sent: {
        Row: {
          contact_id: string
          followup_type: string
          id: string
          metadata: Json | null
          sent_at: string | null
        }
        Insert: {
          contact_id: string
          followup_type: string
          id?: string
          metadata?: Json | null
          sent_at?: string | null
        }
        Update: {
          contact_id?: string
          followup_type?: string
          id?: string
          metadata?: Json | null
          sent_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_contact"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "client_payment_summary"
            referencedColumns: ["contact_id"]
          },
          {
            foreignKeyName: "fk_contact"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_contact"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "hot_leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_contact"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "outstanding_balances"
            referencedColumns: ["contact_id"]
          },
        ]
      }
      gallery_images: {
        Row: {
          created_at: string | null
          description: string | null
          display_order: number | null
          event_date: string | null
          event_type: string | null
          id: string
          image_url: string
          is_active: boolean | null
          is_featured: boolean | null
          organization_id: string | null
          thumbnail_url: string | null
          title: string | null
          updated_at: string | null
          venue_name: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          event_date?: string | null
          event_type?: string | null
          id?: string
          image_url: string
          is_active?: boolean | null
          is_featured?: boolean | null
          organization_id?: string | null
          thumbnail_url?: string | null
          title?: string | null
          updated_at?: string | null
          venue_name?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          event_date?: string | null
          event_type?: string | null
          id?: string
          image_url?: string
          is_active?: boolean | null
          is_featured?: boolean | null
          organization_id?: string | null
          thumbnail_url?: string | null
          title?: string | null
          updated_at?: string | null
          venue_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "gallery_images_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gallery_images_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "venue_roster"
            referencedColumns: ["performer_id"]
          },
          {
            foreignKeyName: "gallery_images_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "venue_roster"
            referencedColumns: ["venue_id"]
          },
        ]
      }
      instagram_messages: {
        Row: {
          contact_id: string | null
          created_at: string | null
          id: string
          is_lead_inquiry: boolean | null
          message_text: string | null
          message_type: string | null
          organization_id: string | null
          processed: boolean | null
          recipient_id: string | null
          sender_id: string
          timestamp: string
        }
        Insert: {
          contact_id?: string | null
          created_at?: string | null
          id?: string
          is_lead_inquiry?: boolean | null
          message_text?: string | null
          message_type?: string | null
          organization_id?: string | null
          processed?: boolean | null
          recipient_id?: string | null
          sender_id: string
          timestamp: string
        }
        Update: {
          contact_id?: string | null
          created_at?: string | null
          id?: string
          is_lead_inquiry?: boolean | null
          message_text?: string | null
          message_type?: string | null
          organization_id?: string | null
          processed?: boolean | null
          recipient_id?: string | null
          sender_id?: string
          timestamp?: string
        }
        Relationships: [
          {
            foreignKeyName: "instagram_messages_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "client_payment_summary"
            referencedColumns: ["contact_id"]
          },
          {
            foreignKeyName: "instagram_messages_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "instagram_messages_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "hot_leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "instagram_messages_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "outstanding_balances"
            referencedColumns: ["contact_id"]
          },
          {
            foreignKeyName: "instagram_messages_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "instagram_messages_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "venue_roster"
            referencedColumns: ["performer_id"]
          },
          {
            foreignKeyName: "instagram_messages_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "venue_roster"
            referencedColumns: ["venue_id"]
          },
        ]
      }
      instagram_sync_log: {
        Row: {
          completed_at: string | null
          error_message: string | null
          id: string
          leads_created: number | null
          messages_synced: number | null
          organization_id: string | null
          started_at: string | null
          sync_status: string
          sync_type: string
        }
        Insert: {
          completed_at?: string | null
          error_message?: string | null
          id?: string
          leads_created?: number | null
          messages_synced?: number | null
          organization_id?: string | null
          started_at?: string | null
          sync_status: string
          sync_type: string
        }
        Update: {
          completed_at?: string | null
          error_message?: string | null
          id?: string
          leads_created?: number | null
          messages_synced?: number | null
          organization_id?: string | null
          started_at?: string | null
          sync_status?: string
          sync_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "instagram_sync_log_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "instagram_sync_log_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "venue_roster"
            referencedColumns: ["performer_id"]
          },
          {
            foreignKeyName: "instagram_sync_log_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "venue_roster"
            referencedColumns: ["venue_id"]
          },
        ]
      }
      invoices: {
        Row: {
          amount_paid: number | null
          auto_reminders_enabled: boolean | null
          balance_due: number | null
          contact_id: string
          created_at: string | null
          deposit_amount: number | null
          deposit_paid: boolean | null
          deposit_paid_at: string | null
          discount_amount: number | null
          discount_code_id: string | null
          due_date: string
          has_payment_plan: boolean | null
          honeybook_invoice_id: string | null
          id: string
          internal_notes: string | null
          invoice_date: string
          invoice_description: string | null
          invoice_number: string
          invoice_status: string | null
          invoice_title: string | null
          last_viewed_at: string | null
          late_fee_amount: number | null
          line_items: Json | null
          notes: string | null
          organization_id: string | null
          paid_date: string | null
          payment_plan_id: string | null
          payment_terms: string | null
          project_id: string | null
          qr_code_data: string | null
          reminder_sent_count: number | null
          sent_date: string | null
          subtotal: number | null
          tax_amount: number | null
          total_amount: number
          updated_at: string | null
          view_count: number | null
        }
        Insert: {
          amount_paid?: number | null
          auto_reminders_enabled?: boolean | null
          balance_due?: number | null
          contact_id: string
          created_at?: string | null
          deposit_amount?: number | null
          deposit_paid?: boolean | null
          deposit_paid_at?: string | null
          discount_amount?: number | null
          discount_code_id?: string | null
          due_date: string
          has_payment_plan?: boolean | null
          honeybook_invoice_id?: string | null
          id?: string
          internal_notes?: string | null
          invoice_date: string
          invoice_description?: string | null
          invoice_number: string
          invoice_status?: string | null
          invoice_title?: string | null
          last_viewed_at?: string | null
          late_fee_amount?: number | null
          line_items?: Json | null
          notes?: string | null
          organization_id?: string | null
          paid_date?: string | null
          payment_plan_id?: string | null
          payment_terms?: string | null
          project_id?: string | null
          qr_code_data?: string | null
          reminder_sent_count?: number | null
          sent_date?: string | null
          subtotal?: number | null
          tax_amount?: number | null
          total_amount: number
          updated_at?: string | null
          view_count?: number | null
        }
        Update: {
          amount_paid?: number | null
          auto_reminders_enabled?: boolean | null
          balance_due?: number | null
          contact_id?: string
          created_at?: string | null
          deposit_amount?: number | null
          deposit_paid?: boolean | null
          deposit_paid_at?: string | null
          discount_amount?: number | null
          discount_code_id?: string | null
          due_date?: string
          has_payment_plan?: boolean | null
          honeybook_invoice_id?: string | null
          id?: string
          internal_notes?: string | null
          invoice_date?: string
          invoice_description?: string | null
          invoice_number?: string
          invoice_status?: string | null
          invoice_title?: string | null
          last_viewed_at?: string | null
          late_fee_amount?: number | null
          line_items?: Json | null
          notes?: string | null
          organization_id?: string | null
          paid_date?: string | null
          payment_plan_id?: string | null
          payment_terms?: string | null
          project_id?: string | null
          qr_code_data?: string | null
          reminder_sent_count?: number | null
          sent_date?: string | null
          subtotal?: number | null
          tax_amount?: number | null
          total_amount?: number
          updated_at?: string | null
          view_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "invoices_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "client_payment_summary"
            referencedColumns: ["contact_id"]
          },
          {
            foreignKeyName: "invoices_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "hot_leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "outstanding_balances"
            referencedColumns: ["contact_id"]
          },
          {
            foreignKeyName: "invoices_discount_code_id_fkey"
            columns: ["discount_code_id"]
            isOneToOne: false
            referencedRelation: "discount_codes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "venue_roster"
            referencedColumns: ["performer_id"]
          },
          {
            foreignKeyName: "invoices_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "venue_roster"
            referencedColumns: ["venue_id"]
          },
          {
            foreignKeyName: "invoices_payment_plan_id_fkey"
            columns: ["payment_plan_id"]
            isOneToOne: false
            referencedRelation: "payment_plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      late_fees: {
        Row: {
          applied_at: string | null
          created_at: string | null
          days_overdue: number
          fee_amount: number
          fee_type: string
          id: string
          installment_id: string | null
          invoice_id: string | null
          notes: string | null
          organization_id: string | null
          status: string
          waive_reason: string | null
          waived_at: string | null
          waived_by: string | null
        }
        Insert: {
          applied_at?: string | null
          created_at?: string | null
          days_overdue: number
          fee_amount: number
          fee_type: string
          id?: string
          installment_id?: string | null
          invoice_id?: string | null
          notes?: string | null
          organization_id?: string | null
          status?: string
          waive_reason?: string | null
          waived_at?: string | null
          waived_by?: string | null
        }
        Update: {
          applied_at?: string | null
          created_at?: string | null
          days_overdue?: number
          fee_amount?: number
          fee_type?: string
          id?: string
          installment_id?: string | null
          invoice_id?: string | null
          notes?: string | null
          organization_id?: string | null
          status?: string
          waive_reason?: string | null
          waived_at?: string | null
          waived_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "late_fees_installment_id_fkey"
            columns: ["installment_id"]
            isOneToOne: false
            referencedRelation: "overdue_installments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "late_fees_installment_id_fkey"
            columns: ["installment_id"]
            isOneToOne: false
            referencedRelation: "payment_installments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "late_fees_installment_id_fkey"
            columns: ["installment_id"]
            isOneToOne: false
            referencedRelation: "upcoming_payments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "late_fees_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoice_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "late_fees_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "late_fees_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "overdue_invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "late_fees_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "late_fees_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "venue_roster"
            referencedColumns: ["performer_id"]
          },
          {
            foreignKeyName: "late_fees_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "venue_roster"
            referencedColumns: ["venue_id"]
          },
        ]
      }
      lead_assignments: {
        Row: {
          assignment_priority: number | null
          created_at: string | null
          dj_profile_id: string
          exclusive_until: string | null
          id: string
          is_exclusive: boolean | null
          lead_id: string
          notification_method: string | null
          notified_at: string | null
          phase: string
          phase_expires_at: string | null
          phase_started_at: string | null
          responded_at: string | null
          response_status: string | null
          response_time_seconds: number | null
          routing_score_at_assignment: number | null
          updated_at: string | null
        }
        Insert: {
          assignment_priority?: number | null
          created_at?: string | null
          dj_profile_id: string
          exclusive_until?: string | null
          id?: string
          is_exclusive?: boolean | null
          lead_id: string
          notification_method?: string | null
          notified_at?: string | null
          phase: string
          phase_expires_at?: string | null
          phase_started_at?: string | null
          responded_at?: string | null
          response_status?: string | null
          response_time_seconds?: number | null
          routing_score_at_assignment?: number | null
          updated_at?: string | null
        }
        Update: {
          assignment_priority?: number | null
          created_at?: string | null
          dj_profile_id?: string
          exclusive_until?: string | null
          id?: string
          is_exclusive?: boolean | null
          lead_id?: string
          notification_method?: string | null
          notified_at?: string | null
          phase?: string
          phase_expires_at?: string | null
          phase_started_at?: string | null
          responded_at?: string | null
          response_status?: string | null
          response_time_seconds?: number | null
          routing_score_at_assignment?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lead_assignments_dj_profile_id_fkey"
            columns: ["dj_profile_id"]
            isOneToOne: false
            referencedRelation: "dj_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_assignments_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_distributions: {
        Row: {
          contact_id: string | null
          created_at: string | null
          distributed_at: string | null
          distribution_method: string | null
          distribution_priority: number | null
          dj_accepted_at: string | null
          dj_contacted_at: string | null
          dj_decline_reason: string | null
          dj_declined_at: string | null
          dj_profile_id: string | null
          dj_viewed_at: string | null
          id: string
          notes: string | null
          outcome: string | null
          outcome_updated_at: string | null
          updated_at: string | null
        }
        Insert: {
          contact_id?: string | null
          created_at?: string | null
          distributed_at?: string | null
          distribution_method?: string | null
          distribution_priority?: number | null
          dj_accepted_at?: string | null
          dj_contacted_at?: string | null
          dj_decline_reason?: string | null
          dj_declined_at?: string | null
          dj_profile_id?: string | null
          dj_viewed_at?: string | null
          id?: string
          notes?: string | null
          outcome?: string | null
          outcome_updated_at?: string | null
          updated_at?: string | null
        }
        Update: {
          contact_id?: string | null
          created_at?: string | null
          distributed_at?: string | null
          distribution_method?: string | null
          distribution_priority?: number | null
          dj_accepted_at?: string | null
          dj_contacted_at?: string | null
          dj_decline_reason?: string | null
          dj_declined_at?: string | null
          dj_profile_id?: string | null
          dj_viewed_at?: string | null
          id?: string
          notes?: string | null
          outcome?: string | null
          outcome_updated_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lead_distributions_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "client_payment_summary"
            referencedColumns: ["contact_id"]
          },
          {
            foreignKeyName: "lead_distributions_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_distributions_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "hot_leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_distributions_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "outstanding_balances"
            referencedColumns: ["contact_id"]
          },
          {
            foreignKeyName: "lead_distributions_dj_profile_id_fkey"
            columns: ["dj_profile_id"]
            isOneToOne: false
            referencedRelation: "active_djs_by_city"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_distributions_dj_profile_id_fkey"
            columns: ["dj_profile_id"]
            isOneToOne: false
            referencedRelation: "dj_network_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      leads: {
        Row: {
          budget_max: number | null
          budget_midpoint: number | null
          budget_min: number | null
          budget_range_text: string | null
          city: string
          converted_at: string | null
          created_at: string | null
          custom_fields: Json | null
          days_until_event: number | null
          dj_inquiry_id: string | null
          event_date: string
          event_duration_hours: number | null
          event_time: string | null
          event_type: string
          event_urgency: string | null
          first_response_at: string | null
          form_completeness: number | null
          guest_count: number | null
          id: string
          is_last_minute: boolean | null
          is_multi_dj_inquiry: boolean | null
          lead_score: number | null
          multi_inquiry_id: string | null
          notes: string | null
          planner_email: string
          planner_name: string
          planner_phone: string | null
          planner_phone_hash: string | null
          product_context: string | null
          referrer: string | null
          required_fields_missing: string[] | null
          routed_at: string | null
          routing_state: string | null
          scoring_components: Json | null
          source: string | null
          special_requests: string | null
          state: string | null
          updated_at: string | null
          utm_campaign: string | null
          utm_medium: string | null
          utm_source: string | null
          venue_address: string | null
          venue_name: string | null
          zip_code: string | null
        }
        Insert: {
          budget_max?: number | null
          budget_midpoint?: number | null
          budget_min?: number | null
          budget_range_text?: string | null
          city: string
          converted_at?: string | null
          created_at?: string | null
          custom_fields?: Json | null
          days_until_event?: number | null
          dj_inquiry_id?: string | null
          event_date: string
          event_duration_hours?: number | null
          event_time?: string | null
          event_type: string
          event_urgency?: string | null
          first_response_at?: string | null
          form_completeness?: number | null
          guest_count?: number | null
          id?: string
          is_last_minute?: boolean | null
          is_multi_dj_inquiry?: boolean | null
          lead_score?: number | null
          multi_inquiry_id?: string | null
          notes?: string | null
          planner_email: string
          planner_name: string
          planner_phone?: string | null
          planner_phone_hash?: string | null
          product_context?: string | null
          referrer?: string | null
          required_fields_missing?: string[] | null
          routed_at?: string | null
          routing_state?: string | null
          scoring_components?: Json | null
          source?: string | null
          special_requests?: string | null
          state?: string | null
          updated_at?: string | null
          utm_campaign?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          venue_address?: string | null
          venue_name?: string | null
          zip_code?: string | null
        }
        Update: {
          budget_max?: number | null
          budget_midpoint?: number | null
          budget_min?: number | null
          budget_range_text?: string | null
          city?: string
          converted_at?: string | null
          created_at?: string | null
          custom_fields?: Json | null
          days_until_event?: number | null
          dj_inquiry_id?: string | null
          event_date?: string
          event_duration_hours?: number | null
          event_time?: string | null
          event_type?: string
          event_urgency?: string | null
          first_response_at?: string | null
          form_completeness?: number | null
          guest_count?: number | null
          id?: string
          is_last_minute?: boolean | null
          is_multi_dj_inquiry?: boolean | null
          lead_score?: number | null
          multi_inquiry_id?: string | null
          notes?: string | null
          planner_email?: string
          planner_name?: string
          planner_phone?: string | null
          planner_phone_hash?: string | null
          product_context?: string | null
          referrer?: string | null
          required_fields_missing?: string[] | null
          routed_at?: string | null
          routing_state?: string | null
          scoring_components?: Json | null
          source?: string | null
          special_requests?: string | null
          state?: string | null
          updated_at?: string | null
          utm_campaign?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          venue_address?: string | null
          venue_name?: string | null
          zip_code?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "leads_dj_inquiry_id_fkey"
            columns: ["dj_inquiry_id"]
            isOneToOne: false
            referencedRelation: "dj_inquiries"
            referencedColumns: ["id"]
          },
        ]
      }
      live_events: {
        Row: {
          capacity: number | null
          cover_photo_url: string | null
          created_at: string | null
          description: string | null
          display_order: number | null
          end_time: string | null
          event_date: string
          event_id: string
          event_time: string | null
          featured_image_url: string | null
          id: string
          is_featured: boolean | null
          is_published: boolean | null
          published_at: string | null
          seo_description: string | null
          seo_keywords: string[] | null
          seo_title: string | null
          slug: string
          ticket_price: number | null
          ticketing_enabled: boolean | null
          title: string
          updated_at: string | null
          venue_address: string
          venue_name: string
          venue_url: string | null
        }
        Insert: {
          capacity?: number | null
          cover_photo_url?: string | null
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          end_time?: string | null
          event_date: string
          event_id: string
          event_time?: string | null
          featured_image_url?: string | null
          id?: string
          is_featured?: boolean | null
          is_published?: boolean | null
          published_at?: string | null
          seo_description?: string | null
          seo_keywords?: string[] | null
          seo_title?: string | null
          slug: string
          ticket_price?: number | null
          ticketing_enabled?: boolean | null
          title: string
          updated_at?: string | null
          venue_address: string
          venue_name: string
          venue_url?: string | null
        }
        Update: {
          capacity?: number | null
          cover_photo_url?: string | null
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          end_time?: string | null
          event_date?: string
          event_id?: string
          event_time?: string | null
          featured_image_url?: string | null
          id?: string
          is_featured?: boolean | null
          is_published?: boolean | null
          published_at?: string | null
          seo_description?: string | null
          seo_keywords?: string[] | null
          seo_title?: string | null
          slug?: string
          ticket_price?: number | null
          ticketing_enabled?: boolean | null
          title?: string
          updated_at?: string | null
          venue_address?: string
          venue_name?: string
          venue_url?: string | null
        }
        Relationships: []
      }
      live_stream_banned_users: {
        Row: {
          banned_by: string | null
          banned_until: string | null
          created_at: string | null
          id: string
          is_permanent: boolean | null
          reason: string | null
          stream_id: string | null
          user_id: string | null
          username: string
        }
        Insert: {
          banned_by?: string | null
          banned_until?: string | null
          created_at?: string | null
          id?: string
          is_permanent?: boolean | null
          reason?: string | null
          stream_id?: string | null
          user_id?: string | null
          username: string
        }
        Update: {
          banned_by?: string | null
          banned_until?: string | null
          created_at?: string | null
          id?: string
          is_permanent?: boolean | null
          reason?: string | null
          stream_id?: string | null
          user_id?: string | null
          username?: string
        }
        Relationships: [
          {
            foreignKeyName: "live_stream_banned_users_stream_id_fkey"
            columns: ["stream_id"]
            isOneToOne: false
            referencedRelation: "live_streams"
            referencedColumns: ["id"]
          },
        ]
      }
      live_stream_messages: {
        Row: {
          banned_by: string | null
          banned_until: string | null
          created_at: string | null
          deleted_at: string | null
          deleted_by: string | null
          id: string
          is_banned: boolean | null
          is_deleted: boolean | null
          is_moderator: boolean | null
          is_streamer: boolean | null
          message: string
          stream_id: string
          updated_at: string | null
          user_id: string | null
          username: string
        }
        Insert: {
          banned_by?: string | null
          banned_until?: string | null
          created_at?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          id?: string
          is_banned?: boolean | null
          is_deleted?: boolean | null
          is_moderator?: boolean | null
          is_streamer?: boolean | null
          message: string
          stream_id: string
          updated_at?: string | null
          user_id?: string | null
          username: string
        }
        Update: {
          banned_by?: string | null
          banned_until?: string | null
          created_at?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          id?: string
          is_banned?: boolean | null
          is_deleted?: boolean | null
          is_moderator?: boolean | null
          is_streamer?: boolean | null
          message?: string
          stream_id?: string
          updated_at?: string | null
          user_id?: string | null
          username?: string
        }
        Relationships: [
          {
            foreignKeyName: "live_stream_messages_stream_id_fkey"
            columns: ["stream_id"]
            isOneToOne: false
            referencedRelation: "live_streams"
            referencedColumns: ["id"]
          },
        ]
      }
      live_streams: {
        Row: {
          created_at: string
          id: string
          is_live: boolean | null
          ppv_price_cents: number | null
          require_auth: boolean | null
          room_name: string
          thumbnail_url: string | null
          title: string | null
          updated_at: string
          user_id: string
          username: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_live?: boolean | null
          ppv_price_cents?: number | null
          require_auth?: boolean | null
          room_name: string
          thumbnail_url?: string | null
          title?: string | null
          updated_at?: string
          user_id: string
          username: string
        }
        Update: {
          created_at?: string
          id?: string
          is_live?: boolean | null
          ppv_price_cents?: number | null
          require_auth?: boolean | null
          room_name?: string
          thumbnail_url?: string | null
          title?: string | null
          updated_at?: string
          user_id?: string
          username?: string
        }
        Relationships: []
      }
      meeting_bookings: {
        Row: {
          cancellation_reason: string | null
          cancelled_at: string | null
          client_email: string
          client_name: string
          client_phone: string | null
          confirmation_sent_at: string | null
          contact_id: string | null
          contact_submission_id: string | null
          created_at: string | null
          duration_minutes: number
          event_date: string | null
          event_type: string | null
          id: string
          meeting_date: string
          meeting_time: string
          meeting_type_id: string | null
          notes: string | null
          organization_id: string | null
          reminder_sent_at: string | null
          special_requests: string | null
          status: string | null
          timezone: string | null
          updated_at: string | null
          video_call_link: string | null
        }
        Insert: {
          cancellation_reason?: string | null
          cancelled_at?: string | null
          client_email: string
          client_name: string
          client_phone?: string | null
          confirmation_sent_at?: string | null
          contact_id?: string | null
          contact_submission_id?: string | null
          created_at?: string | null
          duration_minutes?: number
          event_date?: string | null
          event_type?: string | null
          id?: string
          meeting_date: string
          meeting_time: string
          meeting_type_id?: string | null
          notes?: string | null
          organization_id?: string | null
          reminder_sent_at?: string | null
          special_requests?: string | null
          status?: string | null
          timezone?: string | null
          updated_at?: string | null
          video_call_link?: string | null
        }
        Update: {
          cancellation_reason?: string | null
          cancelled_at?: string | null
          client_email?: string
          client_name?: string
          client_phone?: string | null
          confirmation_sent_at?: string | null
          contact_id?: string | null
          contact_submission_id?: string | null
          created_at?: string | null
          duration_minutes?: number
          event_date?: string | null
          event_type?: string | null
          id?: string
          meeting_date?: string
          meeting_time?: string
          meeting_type_id?: string | null
          notes?: string | null
          organization_id?: string | null
          reminder_sent_at?: string | null
          special_requests?: string | null
          status?: string | null
          timezone?: string | null
          updated_at?: string | null
          video_call_link?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "meeting_bookings_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "client_payment_summary"
            referencedColumns: ["contact_id"]
          },
          {
            foreignKeyName: "meeting_bookings_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meeting_bookings_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "hot_leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meeting_bookings_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "outstanding_balances"
            referencedColumns: ["contact_id"]
          },
          {
            foreignKeyName: "meeting_bookings_contact_submission_id_fkey"
            columns: ["contact_submission_id"]
            isOneToOne: false
            referencedRelation: "contact_submissions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meeting_bookings_meeting_type_id_fkey"
            columns: ["meeting_type_id"]
            isOneToOne: false
            referencedRelation: "meeting_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meeting_bookings_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meeting_bookings_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "venue_roster"
            referencedColumns: ["performer_id"]
          },
          {
            foreignKeyName: "meeting_bookings_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "venue_roster"
            referencedColumns: ["venue_id"]
          },
        ]
      }
      meeting_types: {
        Row: {
          color: string | null
          created_at: string | null
          description: string | null
          display_order: number | null
          duration_minutes: number
          id: string
          is_active: boolean | null
          name: string
          organization_id: string | null
          updated_at: string | null
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          duration_minutes?: number
          id?: string
          is_active?: boolean | null
          name: string
          organization_id?: string | null
          updated_at?: string | null
        }
        Update: {
          color?: string | null
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          duration_minutes?: number
          id?: string
          is_active?: boolean | null
          name?: string
          organization_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "meeting_types_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meeting_types_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "venue_roster"
            referencedColumns: ["performer_id"]
          },
          {
            foreignKeyName: "meeting_types_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "venue_roster"
            referencedColumns: ["venue_id"]
          },
        ]
      }
      messenger_messages: {
        Row: {
          contact_id: string | null
          created_at: string | null
          id: string
          is_lead_inquiry: boolean | null
          message_id: string | null
          message_text: string | null
          message_type: string | null
          organization_id: string | null
          processed: boolean | null
          recipient_id: string | null
          sender_id: string
          timestamp: string
        }
        Insert: {
          contact_id?: string | null
          created_at?: string | null
          id?: string
          is_lead_inquiry?: boolean | null
          message_id?: string | null
          message_text?: string | null
          message_type?: string | null
          organization_id?: string | null
          processed?: boolean | null
          recipient_id?: string | null
          sender_id: string
          timestamp: string
        }
        Update: {
          contact_id?: string | null
          created_at?: string | null
          id?: string
          is_lead_inquiry?: boolean | null
          message_id?: string | null
          message_text?: string | null
          message_type?: string | null
          organization_id?: string | null
          processed?: boolean | null
          recipient_id?: string | null
          sender_id?: string
          timestamp?: string
        }
        Relationships: [
          {
            foreignKeyName: "messenger_messages_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "client_payment_summary"
            referencedColumns: ["contact_id"]
          },
          {
            foreignKeyName: "messenger_messages_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messenger_messages_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "hot_leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messenger_messages_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "outstanding_balances"
            referencedColumns: ["contact_id"]
          },
          {
            foreignKeyName: "messenger_messages_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messenger_messages_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "venue_roster"
            referencedColumns: ["performer_id"]
          },
          {
            foreignKeyName: "messenger_messages_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "venue_roster"
            referencedColumns: ["venue_id"]
          },
        ]
      }
      messenger_sync_log: {
        Row: {
          completed_at: string | null
          error_message: string | null
          id: string
          leads_created: number | null
          messages_synced: number | null
          organization_id: string | null
          started_at: string | null
          sync_status: string
          sync_type: string
        }
        Insert: {
          completed_at?: string | null
          error_message?: string | null
          id?: string
          leads_created?: number | null
          messages_synced?: number | null
          organization_id?: string | null
          started_at?: string | null
          sync_status: string
          sync_type: string
        }
        Update: {
          completed_at?: string | null
          error_message?: string | null
          id?: string
          leads_created?: number | null
          messages_synced?: number | null
          organization_id?: string | null
          started_at?: string | null
          sync_status?: string
          sync_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "messenger_sync_log_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messenger_sync_log_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "venue_roster"
            referencedColumns: ["performer_id"]
          },
          {
            foreignKeyName: "messenger_sync_log_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "venue_roster"
            referencedColumns: ["venue_id"]
          },
        ]
      }
      multi_inquiries: {
        Row: {
          budget: number | null
          city: string | null
          created_at: string | null
          event_date: string | null
          event_time: string | null
          event_type: string
          guest_count: number | null
          id: string
          planner_email: string
          planner_name: string
          planner_phone: string | null
          product_context: string | null
          special_requests: string | null
          state: string | null
          total_djs_available: number | null
          total_djs_contacted: number | null
          total_djs_unavailable: number | null
          updated_at: string | null
          venue_address: string | null
          venue_name: string | null
        }
        Insert: {
          budget?: number | null
          city?: string | null
          created_at?: string | null
          event_date?: string | null
          event_time?: string | null
          event_type: string
          guest_count?: number | null
          id?: string
          planner_email: string
          planner_name: string
          planner_phone?: string | null
          product_context?: string | null
          special_requests?: string | null
          state?: string | null
          total_djs_available?: number | null
          total_djs_contacted?: number | null
          total_djs_unavailable?: number | null
          updated_at?: string | null
          venue_address?: string | null
          venue_name?: string | null
        }
        Update: {
          budget?: number | null
          city?: string | null
          created_at?: string | null
          event_date?: string | null
          event_time?: string | null
          event_type?: string
          guest_count?: number | null
          id?: string
          planner_email?: string
          planner_name?: string
          planner_phone?: string | null
          product_context?: string | null
          special_requests?: string | null
          state?: string | null
          total_djs_available?: number | null
          total_djs_contacted?: number | null
          total_djs_unavailable?: number | null
          updated_at?: string | null
          venue_address?: string | null
          venue_name?: string | null
        }
        Relationships: []
      }
      music_questionnaires: {
        Row: {
          big_no_songs: string | null
          ceremony_music: Json | null
          ceremony_music_type: string | null
          completed_at: string | null
          created_at: string | null
          id: string
          last_reminder_sent_at: string | null
          lead_id: string
          playlist_links: Json | null
          reminder_count: number | null
          reviewed_at: string | null
          special_dance_songs: Json | null
          special_dances: string[] | null
          started_at: string | null
          updated_at: string | null
        }
        Insert: {
          big_no_songs?: string | null
          ceremony_music?: Json | null
          ceremony_music_type?: string | null
          completed_at?: string | null
          created_at?: string | null
          id?: string
          last_reminder_sent_at?: string | null
          lead_id: string
          playlist_links?: Json | null
          reminder_count?: number | null
          reviewed_at?: string | null
          special_dance_songs?: Json | null
          special_dances?: string[] | null
          started_at?: string | null
          updated_at?: string | null
        }
        Update: {
          big_no_songs?: string | null
          ceremony_music?: Json | null
          ceremony_music_type?: string | null
          completed_at?: string | null
          created_at?: string | null
          id?: string
          last_reminder_sent_at?: string | null
          lead_id?: string
          playlist_links?: Json | null
          reminder_count?: number | null
          reviewed_at?: string | null
          special_dance_songs?: Json | null
          special_dances?: string[] | null
          started_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_lead"
            columns: ["lead_id"]
            isOneToOne: true
            referencedRelation: "client_payment_summary"
            referencedColumns: ["contact_id"]
          },
          {
            foreignKeyName: "fk_lead"
            columns: ["lead_id"]
            isOneToOne: true
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_lead"
            columns: ["lead_id"]
            isOneToOne: true
            referencedRelation: "hot_leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_lead"
            columns: ["lead_id"]
            isOneToOne: true
            referencedRelation: "outstanding_balances"
            referencedColumns: ["contact_id"]
          },
        ]
      }
      organization_members: {
        Row: {
          created_at: string | null
          id: string
          invited_at: string | null
          invited_by: string | null
          is_active: boolean | null
          joined_at: string | null
          organization_id: string
          role: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          invited_at?: string | null
          invited_by?: string | null
          is_active?: boolean | null
          joined_at?: string | null
          organization_id: string
          role: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          invited_at?: string | null
          invited_by?: string | null
          is_active?: boolean | null
          joined_at?: string | null
          organization_id?: string
          role?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_members_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_members_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "venue_roster"
            referencedColumns: ["performer_id"]
          },
          {
            foreignKeyName: "organization_members_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "venue_roster"
            referencedColumns: ["venue_id"]
          },
        ]
      }
      organizations: {
        Row: {
          artist_page_bio: string | null
          artist_page_booking_url: string | null
          artist_page_contact_email: string | null
          artist_page_contact_phone: string | null
          artist_page_cover_image_url: string | null
          artist_page_custom_css: string | null
          artist_page_enabled: boolean | null
          artist_page_gallery_images: string[] | null
          artist_page_headline: string | null
          artist_page_links: Json | null
          artist_page_profile_image_url: string | null
          artist_page_video_urls: string[] | null
          background_color: string | null
          bidding_dummy_data_aggressiveness: string | null
          bidding_dummy_data_enabled: boolean | null
          bidding_dummy_data_frequency_multiplier: number | null
          bidding_dummy_data_max_bid_multiplier: number | null
          bidding_dummy_data_scale_with_real_activity: boolean | null
          billing_covered_by_parent: boolean | null
          branding_updated_at: string | null
          created_at: string | null
          custom_domain: string | null
          custom_favicon_url: string | null
          custom_logo_url: string | null
          email_provider: string | null
          font_family: string | null
          gmail_access_token: string | null
          gmail_connected_at: string | null
          gmail_email_address: string | null
          gmail_refresh_token: string | null
          gmail_token_expiry: string | null
          google_review_link: string | null
          id: string
          is_active: boolean | null
          is_platform_owner: boolean | null
          name: string
          onboarding_completed_at: string | null
          onboarding_progress: Json | null
          organization_type: string | null
          owner_id: string
          parent_organization_id: string | null
          performer_slug: string | null
          platform_fee_fixed: number | null
          platform_fee_percentage: number | null
          primary_color: string | null
          product_context: string | null
          requests_artist_name_label: string | null
          requests_artist_name_placeholder: string | null
          requests_artist_photo_history: Json | null
          requests_artist_photo_url: string | null
          requests_artist_rights_text: string | null
          requests_audio_fee_text: string | null
          requests_audio_upload_description: string | null
          requests_audio_upload_label: string | null
          requests_bidding_enabled: boolean | null
          requests_bidding_minimum_bid: number | null
          requests_bidding_starting_bid: number | null
          requests_cover_photo_history: Json | null
          requests_cover_photo_updated_at: string | null
          requests_cover_photo_url: string | null
          requests_default_request_type: string | null
          requests_header_artist_name: string | null
          requests_header_date: string | null
          requests_header_location: string | null
          requests_is_artist_text: string | null
          requests_main_heading: string | null
          requests_manual_entry_divider: string | null
          requests_message_label: string | null
          requests_message_placeholder: string | null
          requests_music_link_help_text: string | null
          requests_music_link_label: string | null
          requests_music_link_placeholder: string | null
          requests_page_description: string | null
          requests_page_title: string | null
          requests_primary_cover_source: string | null
          requests_recipient_name_label: string | null
          requests_recipient_name_placeholder: string | null
          requests_shoutout_label: string | null
          requests_show_audio_upload: boolean | null
          requests_show_bundle_discount: boolean | null
          requests_show_fast_track: boolean | null
          requests_show_next_song: boolean | null
          requests_song_request_label: string | null
          requests_song_title_label: string | null
          requests_song_title_placeholder: string | null
          requests_start_over_text: string | null
          requests_step_1_text: string | null
          requests_step_2_text: string | null
          requests_submit_button_text: string | null
          requests_venue_photo_history: Json | null
          requests_venue_photo_url: string | null
          secondary_color: string | null
          serato_play_detection_enabled: boolean | null
          slug: string
          social_links: Json | null
          stripe_connect_account_id: string | null
          stripe_connect_charges_enabled: boolean | null
          stripe_connect_details_submitted: boolean | null
          stripe_connect_onboarding_complete: boolean | null
          stripe_connect_onboarding_url: string | null
          stripe_connect_payouts_enabled: boolean | null
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          subscription_status: string | null
          subscription_tier: string | null
          text_color: string | null
          trial_ends_at: string | null
          updated_at: string | null
          white_label_enabled: boolean | null
        }
        Insert: {
          artist_page_bio?: string | null
          artist_page_booking_url?: string | null
          artist_page_contact_email?: string | null
          artist_page_contact_phone?: string | null
          artist_page_cover_image_url?: string | null
          artist_page_custom_css?: string | null
          artist_page_enabled?: boolean | null
          artist_page_gallery_images?: string[] | null
          artist_page_headline?: string | null
          artist_page_links?: Json | null
          artist_page_profile_image_url?: string | null
          artist_page_video_urls?: string[] | null
          background_color?: string | null
          bidding_dummy_data_aggressiveness?: string | null
          bidding_dummy_data_enabled?: boolean | null
          bidding_dummy_data_frequency_multiplier?: number | null
          bidding_dummy_data_max_bid_multiplier?: number | null
          bidding_dummy_data_scale_with_real_activity?: boolean | null
          billing_covered_by_parent?: boolean | null
          branding_updated_at?: string | null
          created_at?: string | null
          custom_domain?: string | null
          custom_favicon_url?: string | null
          custom_logo_url?: string | null
          email_provider?: string | null
          font_family?: string | null
          gmail_access_token?: string | null
          gmail_connected_at?: string | null
          gmail_email_address?: string | null
          gmail_refresh_token?: string | null
          gmail_token_expiry?: string | null
          google_review_link?: string | null
          id?: string
          is_active?: boolean | null
          is_platform_owner?: boolean | null
          name: string
          onboarding_completed_at?: string | null
          onboarding_progress?: Json | null
          organization_type?: string | null
          owner_id: string
          parent_organization_id?: string | null
          performer_slug?: string | null
          platform_fee_fixed?: number | null
          platform_fee_percentage?: number | null
          primary_color?: string | null
          product_context?: string | null
          requests_artist_name_label?: string | null
          requests_artist_name_placeholder?: string | null
          requests_artist_photo_history?: Json | null
          requests_artist_photo_url?: string | null
          requests_artist_rights_text?: string | null
          requests_audio_fee_text?: string | null
          requests_audio_upload_description?: string | null
          requests_audio_upload_label?: string | null
          requests_bidding_enabled?: boolean | null
          requests_bidding_minimum_bid?: number | null
          requests_bidding_starting_bid?: number | null
          requests_cover_photo_history?: Json | null
          requests_cover_photo_updated_at?: string | null
          requests_cover_photo_url?: string | null
          requests_default_request_type?: string | null
          requests_header_artist_name?: string | null
          requests_header_date?: string | null
          requests_header_location?: string | null
          requests_is_artist_text?: string | null
          requests_main_heading?: string | null
          requests_manual_entry_divider?: string | null
          requests_message_label?: string | null
          requests_message_placeholder?: string | null
          requests_music_link_help_text?: string | null
          requests_music_link_label?: string | null
          requests_music_link_placeholder?: string | null
          requests_page_description?: string | null
          requests_page_title?: string | null
          requests_primary_cover_source?: string | null
          requests_recipient_name_label?: string | null
          requests_recipient_name_placeholder?: string | null
          requests_shoutout_label?: string | null
          requests_show_audio_upload?: boolean | null
          requests_show_bundle_discount?: boolean | null
          requests_show_fast_track?: boolean | null
          requests_show_next_song?: boolean | null
          requests_song_request_label?: string | null
          requests_song_title_label?: string | null
          requests_song_title_placeholder?: string | null
          requests_start_over_text?: string | null
          requests_step_1_text?: string | null
          requests_step_2_text?: string | null
          requests_submit_button_text?: string | null
          requests_venue_photo_history?: Json | null
          requests_venue_photo_url?: string | null
          secondary_color?: string | null
          serato_play_detection_enabled?: boolean | null
          slug: string
          social_links?: Json | null
          stripe_connect_account_id?: string | null
          stripe_connect_charges_enabled?: boolean | null
          stripe_connect_details_submitted?: boolean | null
          stripe_connect_onboarding_complete?: boolean | null
          stripe_connect_onboarding_url?: string | null
          stripe_connect_payouts_enabled?: boolean | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          subscription_status?: string | null
          subscription_tier?: string | null
          text_color?: string | null
          trial_ends_at?: string | null
          updated_at?: string | null
          white_label_enabled?: boolean | null
        }
        Update: {
          artist_page_bio?: string | null
          artist_page_booking_url?: string | null
          artist_page_contact_email?: string | null
          artist_page_contact_phone?: string | null
          artist_page_cover_image_url?: string | null
          artist_page_custom_css?: string | null
          artist_page_enabled?: boolean | null
          artist_page_gallery_images?: string[] | null
          artist_page_headline?: string | null
          artist_page_links?: Json | null
          artist_page_profile_image_url?: string | null
          artist_page_video_urls?: string[] | null
          background_color?: string | null
          bidding_dummy_data_aggressiveness?: string | null
          bidding_dummy_data_enabled?: boolean | null
          bidding_dummy_data_frequency_multiplier?: number | null
          bidding_dummy_data_max_bid_multiplier?: number | null
          bidding_dummy_data_scale_with_real_activity?: boolean | null
          billing_covered_by_parent?: boolean | null
          branding_updated_at?: string | null
          created_at?: string | null
          custom_domain?: string | null
          custom_favicon_url?: string | null
          custom_logo_url?: string | null
          email_provider?: string | null
          font_family?: string | null
          gmail_access_token?: string | null
          gmail_connected_at?: string | null
          gmail_email_address?: string | null
          gmail_refresh_token?: string | null
          gmail_token_expiry?: string | null
          google_review_link?: string | null
          id?: string
          is_active?: boolean | null
          is_platform_owner?: boolean | null
          name?: string
          onboarding_completed_at?: string | null
          onboarding_progress?: Json | null
          organization_type?: string | null
          owner_id?: string
          parent_organization_id?: string | null
          performer_slug?: string | null
          platform_fee_fixed?: number | null
          platform_fee_percentage?: number | null
          primary_color?: string | null
          product_context?: string | null
          requests_artist_name_label?: string | null
          requests_artist_name_placeholder?: string | null
          requests_artist_photo_history?: Json | null
          requests_artist_photo_url?: string | null
          requests_artist_rights_text?: string | null
          requests_audio_fee_text?: string | null
          requests_audio_upload_description?: string | null
          requests_audio_upload_label?: string | null
          requests_bidding_enabled?: boolean | null
          requests_bidding_minimum_bid?: number | null
          requests_bidding_starting_bid?: number | null
          requests_cover_photo_history?: Json | null
          requests_cover_photo_updated_at?: string | null
          requests_cover_photo_url?: string | null
          requests_default_request_type?: string | null
          requests_header_artist_name?: string | null
          requests_header_date?: string | null
          requests_header_location?: string | null
          requests_is_artist_text?: string | null
          requests_main_heading?: string | null
          requests_manual_entry_divider?: string | null
          requests_message_label?: string | null
          requests_message_placeholder?: string | null
          requests_music_link_help_text?: string | null
          requests_music_link_label?: string | null
          requests_music_link_placeholder?: string | null
          requests_page_description?: string | null
          requests_page_title?: string | null
          requests_primary_cover_source?: string | null
          requests_recipient_name_label?: string | null
          requests_recipient_name_placeholder?: string | null
          requests_shoutout_label?: string | null
          requests_show_audio_upload?: boolean | null
          requests_show_bundle_discount?: boolean | null
          requests_show_fast_track?: boolean | null
          requests_show_next_song?: boolean | null
          requests_song_request_label?: string | null
          requests_song_title_label?: string | null
          requests_song_title_placeholder?: string | null
          requests_start_over_text?: string | null
          requests_step_1_text?: string | null
          requests_step_2_text?: string | null
          requests_submit_button_text?: string | null
          requests_venue_photo_history?: Json | null
          requests_venue_photo_url?: string | null
          secondary_color?: string | null
          serato_play_detection_enabled?: boolean | null
          slug?: string
          social_links?: Json | null
          stripe_connect_account_id?: string | null
          stripe_connect_charges_enabled?: boolean | null
          stripe_connect_details_submitted?: boolean | null
          stripe_connect_onboarding_complete?: boolean | null
          stripe_connect_onboarding_url?: string | null
          stripe_connect_payouts_enabled?: boolean | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          subscription_status?: string | null
          subscription_tier?: string | null
          text_color?: string | null
          trial_ends_at?: string | null
          updated_at?: string | null
          white_label_enabled?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "organizations_parent_organization_id_fkey"
            columns: ["parent_organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organizations_parent_organization_id_fkey"
            columns: ["parent_organization_id"]
            isOneToOne: false
            referencedRelation: "venue_roster"
            referencedColumns: ["performer_id"]
          },
          {
            foreignKeyName: "organizations_parent_organization_id_fkey"
            columns: ["parent_organization_id"]
            isOneToOne: false
            referencedRelation: "venue_roster"
            referencedColumns: ["venue_id"]
          },
        ]
      }
      page_views: {
        Row: {
          browser: string | null
          device_type: string | null
          id: string
          left_at: string | null
          organization_id: string | null
          os: string | null
          page_category: string | null
          page_number: number | null
          page_path: string
          page_title: string | null
          page_url: string
          previous_page: string | null
          referrer: string | null
          referrer_domain: string | null
          scroll_depth_percent: number | null
          session_number: number | null
          time_on_page_seconds: number | null
          user_agent: string | null
          viewed_at: string
          visitor_id: string | null
        }
        Insert: {
          browser?: string | null
          device_type?: string | null
          id?: string
          left_at?: string | null
          organization_id?: string | null
          os?: string | null
          page_category?: string | null
          page_number?: number | null
          page_path: string
          page_title?: string | null
          page_url: string
          previous_page?: string | null
          referrer?: string | null
          referrer_domain?: string | null
          scroll_depth_percent?: number | null
          session_number?: number | null
          time_on_page_seconds?: number | null
          user_agent?: string | null
          viewed_at?: string
          visitor_id?: string | null
        }
        Update: {
          browser?: string | null
          device_type?: string | null
          id?: string
          left_at?: string | null
          organization_id?: string | null
          os?: string | null
          page_category?: string | null
          page_number?: number | null
          page_path?: string
          page_title?: string | null
          page_url?: string
          previous_page?: string | null
          referrer?: string | null
          referrer_domain?: string | null
          scroll_depth_percent?: number | null
          session_number?: number | null
          time_on_page_seconds?: number | null
          user_agent?: string | null
          viewed_at?: string
          visitor_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "page_views_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "page_views_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "venue_roster"
            referencedColumns: ["performer_id"]
          },
          {
            foreignKeyName: "page_views_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "venue_roster"
            referencedColumns: ["venue_id"]
          },
          {
            foreignKeyName: "page_views_visitor_id_fkey"
            columns: ["visitor_id"]
            isOneToOne: false
            referencedRelation: "visitor_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_installments: {
        Row: {
          amount: number
          created_at: string | null
          deleted_at: string | null
          due_date: string
          id: string
          installment_name: string | null
          installment_number: number
          invoice_id: string | null
          notes: string | null
          organization_id: string | null
          paid_amount: number | null
          paid_at: string | null
          payment_id: string | null
          payment_plan_id: string | null
          reminder_count: number | null
          reminder_sent_at: string | null
          status: string
          stripe_payment_intent: string | null
          updated_at: string | null
        }
        Insert: {
          amount: number
          created_at?: string | null
          deleted_at?: string | null
          due_date: string
          id?: string
          installment_name?: string | null
          installment_number: number
          invoice_id?: string | null
          notes?: string | null
          organization_id?: string | null
          paid_amount?: number | null
          paid_at?: string | null
          payment_id?: string | null
          payment_plan_id?: string | null
          reminder_count?: number | null
          reminder_sent_at?: string | null
          status?: string
          stripe_payment_intent?: string | null
          updated_at?: string | null
        }
        Update: {
          amount?: number
          created_at?: string | null
          deleted_at?: string | null
          due_date?: string
          id?: string
          installment_name?: string | null
          installment_number?: number
          invoice_id?: string | null
          notes?: string | null
          organization_id?: string | null
          paid_amount?: number | null
          paid_at?: string | null
          payment_id?: string | null
          payment_plan_id?: string | null
          reminder_count?: number | null
          reminder_sent_at?: string | null
          status?: string
          stripe_payment_intent?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payment_installments_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoice_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_installments_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_installments_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "overdue_invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_installments_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_installments_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "venue_roster"
            referencedColumns: ["performer_id"]
          },
          {
            foreignKeyName: "payment_installments_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "venue_roster"
            referencedColumns: ["venue_id"]
          },
          {
            foreignKeyName: "payment_installments_payment_id_fkey"
            columns: ["payment_id"]
            isOneToOne: false
            referencedRelation: "payments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_installments_payment_plan_id_fkey"
            columns: ["payment_plan_id"]
            isOneToOne: false
            referencedRelation: "payment_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_plans: {
        Row: {
          contact_id: string | null
          created_at: string | null
          created_by: string | null
          deleted_at: string | null
          id: string
          invoice_id: string | null
          organization_id: string | null
          plan_name: string
          plan_type: string
          status: string
          total_amount: number
          updated_at: string | null
        }
        Insert: {
          contact_id?: string | null
          created_at?: string | null
          created_by?: string | null
          deleted_at?: string | null
          id?: string
          invoice_id?: string | null
          organization_id?: string | null
          plan_name: string
          plan_type: string
          status?: string
          total_amount: number
          updated_at?: string | null
        }
        Update: {
          contact_id?: string | null
          created_at?: string | null
          created_by?: string | null
          deleted_at?: string | null
          id?: string
          invoice_id?: string | null
          organization_id?: string | null
          plan_name?: string
          plan_type?: string
          status?: string
          total_amount?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payment_plans_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "client_payment_summary"
            referencedColumns: ["contact_id"]
          },
          {
            foreignKeyName: "payment_plans_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_plans_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "hot_leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_plans_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "outstanding_balances"
            referencedColumns: ["contact_id"]
          },
          {
            foreignKeyName: "payment_plans_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoice_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_plans_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_plans_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "overdue_invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_plans_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_plans_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "venue_roster"
            referencedColumns: ["performer_id"]
          },
          {
            foreignKeyName: "payment_plans_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "venue_roster"
            referencedColumns: ["venue_id"]
          },
        ]
      }
      payment_reminders: {
        Row: {
          contact_id: string | null
          days_until_due: number | null
          email_status: string | null
          id: string
          installment_id: string | null
          invoice_id: string | null
          message: string | null
          organization_id: string | null
          payment_made: boolean | null
          payment_made_at: string | null
          reminder_type: string
          sent_at: string | null
          sent_via: string
          sms_status: string | null
          subject: string | null
        }
        Insert: {
          contact_id?: string | null
          days_until_due?: number | null
          email_status?: string | null
          id?: string
          installment_id?: string | null
          invoice_id?: string | null
          message?: string | null
          organization_id?: string | null
          payment_made?: boolean | null
          payment_made_at?: string | null
          reminder_type: string
          sent_at?: string | null
          sent_via: string
          sms_status?: string | null
          subject?: string | null
        }
        Update: {
          contact_id?: string | null
          days_until_due?: number | null
          email_status?: string | null
          id?: string
          installment_id?: string | null
          invoice_id?: string | null
          message?: string | null
          organization_id?: string | null
          payment_made?: boolean | null
          payment_made_at?: string | null
          reminder_type?: string
          sent_at?: string | null
          sent_via?: string
          sms_status?: string | null
          subject?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payment_reminders_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "client_payment_summary"
            referencedColumns: ["contact_id"]
          },
          {
            foreignKeyName: "payment_reminders_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_reminders_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "hot_leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_reminders_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "outstanding_balances"
            referencedColumns: ["contact_id"]
          },
          {
            foreignKeyName: "payment_reminders_installment_id_fkey"
            columns: ["installment_id"]
            isOneToOne: false
            referencedRelation: "overdue_installments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_reminders_installment_id_fkey"
            columns: ["installment_id"]
            isOneToOne: false
            referencedRelation: "payment_installments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_reminders_installment_id_fkey"
            columns: ["installment_id"]
            isOneToOne: false
            referencedRelation: "upcoming_payments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_reminders_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoice_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_reminders_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_reminders_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "overdue_invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_reminders_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_reminders_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "venue_roster"
            referencedColumns: ["performer_id"]
          },
          {
            foreignKeyName: "payment_reminders_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "venue_roster"
            referencedColumns: ["venue_id"]
          },
        ]
      }
      payments: {
        Row: {
          charge_notes: string | null
          contact_id: string | null
          created_at: string | null
          discount_amount: number | null
          dispute_cover: number | null
          dispute_fee: number | null
          disputed_date: string | null
          disputed_net_amount: number | null
          due_date: string | null
          fee_rate: string | null
          gratuity: number | null
          honeybook_imported: boolean | null
          honeybook_project_name: string | null
          id: string
          instant_deposit_fee: number | null
          instant_deposit_fee_rate: number | null
          invoice_id: string | null
          invoice_number: string | null
          late_fee: number | null
          loan_fee: number | null
          loan_principal: number | null
          loan_repayment: number | null
          net_amount: number | null
          non_taxable_amount: number | null
          organization_id: string | null
          payment_before_discount: number | null
          payment_method: string | null
          payment_name: string | null
          payment_notes: string | null
          payment_service_fee: number | null
          payment_status: string | null
          project_id: string | null
          refunded_amount: number | null
          service_fee_rate: number | null
          tax_amount: number | null
          tax_rate: number | null
          taxable_amount: number | null
          total_amount: number | null
          transaction_date: string | null
          transaction_fee: number | null
          updated_at: string | null
        }
        Insert: {
          charge_notes?: string | null
          contact_id?: string | null
          created_at?: string | null
          discount_amount?: number | null
          dispute_cover?: number | null
          dispute_fee?: number | null
          disputed_date?: string | null
          disputed_net_amount?: number | null
          due_date?: string | null
          fee_rate?: string | null
          gratuity?: number | null
          honeybook_imported?: boolean | null
          honeybook_project_name?: string | null
          id?: string
          instant_deposit_fee?: number | null
          instant_deposit_fee_rate?: number | null
          invoice_id?: string | null
          invoice_number?: string | null
          late_fee?: number | null
          loan_fee?: number | null
          loan_principal?: number | null
          loan_repayment?: number | null
          net_amount?: number | null
          non_taxable_amount?: number | null
          organization_id?: string | null
          payment_before_discount?: number | null
          payment_method?: string | null
          payment_name?: string | null
          payment_notes?: string | null
          payment_service_fee?: number | null
          payment_status?: string | null
          project_id?: string | null
          refunded_amount?: number | null
          service_fee_rate?: number | null
          tax_amount?: number | null
          tax_rate?: number | null
          taxable_amount?: number | null
          total_amount?: number | null
          transaction_date?: string | null
          transaction_fee?: number | null
          updated_at?: string | null
        }
        Update: {
          charge_notes?: string | null
          contact_id?: string | null
          created_at?: string | null
          discount_amount?: number | null
          dispute_cover?: number | null
          dispute_fee?: number | null
          disputed_date?: string | null
          disputed_net_amount?: number | null
          due_date?: string | null
          fee_rate?: string | null
          gratuity?: number | null
          honeybook_imported?: boolean | null
          honeybook_project_name?: string | null
          id?: string
          instant_deposit_fee?: number | null
          instant_deposit_fee_rate?: number | null
          invoice_id?: string | null
          invoice_number?: string | null
          late_fee?: number | null
          loan_fee?: number | null
          loan_principal?: number | null
          loan_repayment?: number | null
          net_amount?: number | null
          non_taxable_amount?: number | null
          organization_id?: string | null
          payment_before_discount?: number | null
          payment_method?: string | null
          payment_name?: string | null
          payment_notes?: string | null
          payment_service_fee?: number | null
          payment_status?: string | null
          project_id?: string | null
          refunded_amount?: number | null
          service_fee_rate?: number | null
          tax_amount?: number | null
          tax_rate?: number | null
          taxable_amount?: number | null
          total_amount?: number | null
          transaction_date?: string | null
          transaction_fee?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payments_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "client_payment_summary"
            referencedColumns: ["contact_id"]
          },
          {
            foreignKeyName: "payments_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "hot_leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "outstanding_balances"
            referencedColumns: ["contact_id"]
          },
          {
            foreignKeyName: "payments_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoice_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "overdue_invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "venue_roster"
            referencedColumns: ["performer_id"]
          },
          {
            foreignKeyName: "payments_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "venue_roster"
            referencedColumns: ["venue_id"]
          },
          {
            foreignKeyName: "payments_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      pending_ai_responses: {
        Row: {
          ai_response: string | null
          created_at: string | null
          error_message: string | null
          id: string
          organization_id: string | null
          original_message: string
          original_message_id: string | null
          phone_number: string
          processed_at: string | null
          scheduled_for: string
          status: string | null
          updated_at: string | null
        }
        Insert: {
          ai_response?: string | null
          created_at?: string | null
          error_message?: string | null
          id?: string
          organization_id?: string | null
          original_message: string
          original_message_id?: string | null
          phone_number: string
          processed_at?: string | null
          scheduled_for: string
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          ai_response?: string | null
          created_at?: string | null
          error_message?: string | null
          id?: string
          organization_id?: string | null
          original_message?: string
          original_message_id?: string | null
          phone_number?: string
          processed_at?: string | null
          scheduled_for?: string
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pending_ai_responses_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pending_ai_responses_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "venue_roster"
            referencedColumns: ["performer_id"]
          },
          {
            foreignKeyName: "pending_ai_responses_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "venue_roster"
            referencedColumns: ["venue_id"]
          },
        ]
      }
      ppv_tokens: {
        Row: {
          amount_cents: number
          created_at: string
          id: string
          stream_id: string
          token: string
          used: boolean | null
          used_at: string | null
        }
        Insert: {
          amount_cents: number
          created_at?: string
          id?: string
          stream_id: string
          token: string
          used?: boolean | null
          used_at?: string | null
        }
        Update: {
          amount_cents?: number
          created_at?: string
          id?: string
          stream_id?: string
          token?: string
          used?: boolean | null
          used_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ppv_tokens_stream_id_fkey"
            columns: ["stream_id"]
            isOneToOne: false
            referencedRelation: "live_streams"
            referencedColumns: ["id"]
          },
        ]
      }
      preferred_vendors: {
        Row: {
          address: string | null
          business_name: string
          business_type: string
          city: string | null
          contact_name: string | null
          created_at: string | null
          description: string | null
          email: string | null
          id: string
          is_active: boolean | null
          is_featured: boolean | null
          organization_id: string | null
          partnership_level: string | null
          phone: string | null
          services_offered: string[] | null
          state: string | null
          updated_at: string | null
          website: string | null
          zip_code: string | null
        }
        Insert: {
          address?: string | null
          business_name: string
          business_type: string
          city?: string | null
          contact_name?: string | null
          created_at?: string | null
          description?: string | null
          email?: string | null
          id?: string
          is_active?: boolean | null
          is_featured?: boolean | null
          organization_id?: string | null
          partnership_level?: string | null
          phone?: string | null
          services_offered?: string[] | null
          state?: string | null
          updated_at?: string | null
          website?: string | null
          zip_code?: string | null
        }
        Update: {
          address?: string | null
          business_name?: string
          business_type?: string
          city?: string | null
          contact_name?: string | null
          created_at?: string | null
          description?: string | null
          email?: string | null
          id?: string
          is_active?: boolean | null
          is_featured?: boolean | null
          organization_id?: string | null
          partnership_level?: string | null
          phone?: string | null
          services_offered?: string[] | null
          state?: string | null
          updated_at?: string | null
          website?: string | null
          zip_code?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "preferred_vendors_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "preferred_vendors_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "venue_roster"
            referencedColumns: ["performer_id"]
          },
          {
            foreignKeyName: "preferred_vendors_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "venue_roster"
            referencedColumns: ["venue_id"]
          },
        ]
      }
      preferred_venues: {
        Row: {
          address: string
          amenities: string[] | null
          capacity_max: number | null
          capacity_min: number | null
          city: string
          contact_name: string | null
          created_at: string | null
          description: string | null
          email: string | null
          id: string
          is_active: boolean | null
          is_featured: boolean | null
          organization_id: string | null
          phone: string | null
          pricing_notes: string | null
          state: string | null
          updated_at: string | null
          venue_name: string
          venue_type: string
          website: string | null
          zip_code: string | null
        }
        Insert: {
          address: string
          amenities?: string[] | null
          capacity_max?: number | null
          capacity_min?: number | null
          city: string
          contact_name?: string | null
          created_at?: string | null
          description?: string | null
          email?: string | null
          id?: string
          is_active?: boolean | null
          is_featured?: boolean | null
          organization_id?: string | null
          phone?: string | null
          pricing_notes?: string | null
          state?: string | null
          updated_at?: string | null
          venue_name: string
          venue_type: string
          website?: string | null
          zip_code?: string | null
        }
        Update: {
          address?: string
          amenities?: string[] | null
          capacity_max?: number | null
          capacity_min?: number | null
          city?: string
          contact_name?: string | null
          created_at?: string | null
          description?: string | null
          email?: string | null
          id?: string
          is_active?: boolean | null
          is_featured?: boolean | null
          organization_id?: string | null
          phone?: string | null
          pricing_notes?: string | null
          state?: string | null
          updated_at?: string | null
          venue_name?: string
          venue_type?: string
          website?: string | null
          zip_code?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "preferred_venues_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "preferred_venues_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "venue_roster"
            referencedColumns: ["performer_id"]
          },
          {
            foreignKeyName: "preferred_venues_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "venue_roster"
            referencedColumns: ["venue_id"]
          },
        ]
      }
      pricing_config: {
        Row: {
          addons: Json | null
          config_type: string
          corporate_basics_price: number | null
          corporate_breakdowns: Json | null
          corporate_package1_price: number | null
          corporate_package2_price: number | null
          created_at: string | null
          id: string
          organization_id: string | null
          package1_a_la_carte_price: number
          package1_breakdown: Json | null
          package1_price: number
          package2_a_la_carte_price: number
          package2_breakdown: Json | null
          package2_price: number
          package3_a_la_carte_price: number
          package3_breakdown: Json | null
          package3_price: number
          school_basics_price: number | null
          school_breakdowns: Json | null
          school_package1_price: number | null
          school_package2_price: number | null
          updated_at: string | null
        }
        Insert: {
          addons?: Json | null
          config_type?: string
          corporate_basics_price?: number | null
          corporate_breakdowns?: Json | null
          corporate_package1_price?: number | null
          corporate_package2_price?: number | null
          created_at?: string | null
          id?: string
          organization_id?: string | null
          package1_a_la_carte_price?: number
          package1_breakdown?: Json | null
          package1_price?: number
          package2_a_la_carte_price?: number
          package2_breakdown?: Json | null
          package2_price?: number
          package3_a_la_carte_price?: number
          package3_breakdown?: Json | null
          package3_price?: number
          school_basics_price?: number | null
          school_breakdowns?: Json | null
          school_package1_price?: number | null
          school_package2_price?: number | null
          updated_at?: string | null
        }
        Update: {
          addons?: Json | null
          config_type?: string
          corporate_basics_price?: number | null
          corporate_breakdowns?: Json | null
          corporate_package1_price?: number | null
          corporate_package2_price?: number | null
          created_at?: string | null
          id?: string
          organization_id?: string | null
          package1_a_la_carte_price?: number
          package1_breakdown?: Json | null
          package1_price?: number
          package2_a_la_carte_price?: number
          package2_breakdown?: Json | null
          package2_price?: number
          package3_a_la_carte_price?: number
          package3_breakdown?: Json | null
          package3_price?: number
          school_basics_price?: number | null
          school_breakdowns?: Json | null
          school_package1_price?: number | null
          school_package2_price?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pricing_config_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pricing_config_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "venue_roster"
            referencedColumns: ["performer_id"]
          },
          {
            foreignKeyName: "pricing_config_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "venue_roster"
            referencedColumns: ["venue_id"]
          },
        ]
      }
      pricing_history: {
        Row: {
          city: string
          created_at: string | null
          event_type: string
          id: string
          period_end: string | null
          period_start: string | null
          price_high: number | null
          price_low: number | null
          price_median: number | null
          product_context: string | null
          sample_size: number | null
          snapshot_date: string
          state: string | null
        }
        Insert: {
          city: string
          created_at?: string | null
          event_type: string
          id?: string
          period_end?: string | null
          period_start?: string | null
          price_high?: number | null
          price_low?: number | null
          price_median?: number | null
          product_context?: string | null
          sample_size?: number | null
          snapshot_date: string
          state?: string | null
        }
        Update: {
          city?: string
          created_at?: string | null
          event_type?: string
          id?: string
          period_end?: string | null
          period_start?: string | null
          price_high?: number | null
          price_low?: number | null
          price_median?: number | null
          product_context?: string | null
          sample_size?: number | null
          snapshot_date?: string
          state?: string | null
        }
        Relationships: []
      }
      qr_scans: {
        Row: {
          converted: boolean | null
          converted_at: string | null
          created_at: string
          event_qr_code: string
          id: string
          ip_address: string | null
          is_qr_scan: boolean | null
          organization_id: string | null
          referrer: string | null
          request_id: string | null
          scanned_at: string
          session_id: string | null
          updated_at: string
          user_agent: string | null
          visitor_id: string | null
        }
        Insert: {
          converted?: boolean | null
          converted_at?: string | null
          created_at?: string
          event_qr_code: string
          id?: string
          ip_address?: string | null
          is_qr_scan?: boolean | null
          organization_id?: string | null
          referrer?: string | null
          request_id?: string | null
          scanned_at?: string
          session_id?: string | null
          updated_at?: string
          user_agent?: string | null
          visitor_id?: string | null
        }
        Update: {
          converted?: boolean | null
          converted_at?: string | null
          created_at?: string
          event_qr_code?: string
          id?: string
          ip_address?: string | null
          is_qr_scan?: boolean | null
          organization_id?: string | null
          referrer?: string | null
          request_id?: string | null
          scanned_at?: string
          session_id?: string | null
          updated_at?: string
          user_agent?: string | null
          visitor_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "qr_scans_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "qr_scans_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "venue_roster"
            referencedColumns: ["performer_id"]
          },
          {
            foreignKeyName: "qr_scans_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "venue_roster"
            referencedColumns: ["venue_id"]
          },
          {
            foreignKeyName: "qr_scans_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "crowd_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "qr_scans_visitor_id_fkey"
            columns: ["visitor_id"]
            isOneToOne: false
            referencedRelation: "visitor_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      questionnaire_submission_log: {
        Row: {
          created_at: string | null
          error_details: Json | null
          error_message: string | null
          error_stack: string | null
          error_type: string | null
          id: string
          idempotency_key: string | null
          ip_address: string | null
          is_complete: boolean | null
          lead_id: string
          organization_id: string | null
          questionnaire_id: string | null
          queue_id: string | null
          recovered_at: string | null
          recovery_method: string | null
          recovery_notes: string | null
          request_data: Json
          request_headers: Json | null
          request_timestamp: string | null
          response_data: Json | null
          response_status: number | null
          response_timestamp: string | null
          submission_status: string
          updated_at: string | null
          user_agent: string | null
          verification_error: string | null
          verification_status: string | null
          verified_at: string | null
        }
        Insert: {
          created_at?: string | null
          error_details?: Json | null
          error_message?: string | null
          error_stack?: string | null
          error_type?: string | null
          id?: string
          idempotency_key?: string | null
          ip_address?: string | null
          is_complete?: boolean | null
          lead_id: string
          organization_id?: string | null
          questionnaire_id?: string | null
          queue_id?: string | null
          recovered_at?: string | null
          recovery_method?: string | null
          recovery_notes?: string | null
          request_data: Json
          request_headers?: Json | null
          request_timestamp?: string | null
          response_data?: Json | null
          response_status?: number | null
          response_timestamp?: string | null
          submission_status: string
          updated_at?: string | null
          user_agent?: string | null
          verification_error?: string | null
          verification_status?: string | null
          verified_at?: string | null
        }
        Update: {
          created_at?: string | null
          error_details?: Json | null
          error_message?: string | null
          error_stack?: string | null
          error_type?: string | null
          id?: string
          idempotency_key?: string | null
          ip_address?: string | null
          is_complete?: boolean | null
          lead_id?: string
          organization_id?: string | null
          questionnaire_id?: string | null
          queue_id?: string | null
          recovered_at?: string | null
          recovery_method?: string | null
          recovery_notes?: string | null
          request_data?: Json
          request_headers?: Json | null
          request_timestamp?: string | null
          response_data?: Json | null
          response_status?: number | null
          response_timestamp?: string | null
          submission_status?: string
          updated_at?: string | null
          user_agent?: string | null
          verification_error?: string | null
          verification_status?: string | null
          verified_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "questionnaire_submission_log_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "client_payment_summary"
            referencedColumns: ["contact_id"]
          },
          {
            foreignKeyName: "questionnaire_submission_log_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "questionnaire_submission_log_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "hot_leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "questionnaire_submission_log_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "outstanding_balances"
            referencedColumns: ["contact_id"]
          },
          {
            foreignKeyName: "questionnaire_submission_log_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "questionnaire_submission_log_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "venue_roster"
            referencedColumns: ["performer_id"]
          },
          {
            foreignKeyName: "questionnaire_submission_log_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "venue_roster"
            referencedColumns: ["venue_id"]
          },
          {
            foreignKeyName: "questionnaire_submission_log_questionnaire_id_fkey"
            columns: ["questionnaire_id"]
            isOneToOne: false
            referencedRelation: "music_questionnaires"
            referencedColumns: ["id"]
          },
        ]
      }
      quote_analytics: {
        Row: {
          created_at: string | null
          event_type: string
          id: string
          metadata: Json | null
          organization_id: string | null
          quote_id: string
          time_spent: number | null
        }
        Insert: {
          created_at?: string | null
          event_type: string
          id?: string
          metadata?: Json | null
          organization_id?: string | null
          quote_id: string
          time_spent?: number | null
        }
        Update: {
          created_at?: string | null
          event_type?: string
          id?: string
          metadata?: Json | null
          organization_id?: string | null
          quote_id?: string
          time_spent?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "quote_analytics_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quote_analytics_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "venue_roster"
            referencedColumns: ["performer_id"]
          },
          {
            foreignKeyName: "quote_analytics_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "venue_roster"
            referencedColumns: ["venue_id"]
          },
          {
            foreignKeyName: "quote_analytics_quote_id_fkey"
            columns: ["quote_id"]
            isOneToOne: false
            referencedRelation: "client_payment_summary"
            referencedColumns: ["contact_id"]
          },
          {
            foreignKeyName: "quote_analytics_quote_id_fkey"
            columns: ["quote_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quote_analytics_quote_id_fkey"
            columns: ["quote_id"]
            isOneToOne: false
            referencedRelation: "hot_leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quote_analytics_quote_id_fkey"
            columns: ["quote_id"]
            isOneToOne: false
            referencedRelation: "outstanding_balances"
            referencedColumns: ["contact_id"]
          },
        ]
      }
      quote_page_views: {
        Row: {
          contact_id: string
          created_at: string | null
          event_type: string
          id: string
          metadata: Json | null
          quote_id: string
        }
        Insert: {
          contact_id: string
          created_at?: string | null
          event_type: string
          id?: string
          metadata?: Json | null
          quote_id: string
        }
        Update: {
          contact_id?: string
          created_at?: string | null
          event_type?: string
          id?: string
          metadata?: Json | null
          quote_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_contact"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "client_payment_summary"
            referencedColumns: ["contact_id"]
          },
          {
            foreignKeyName: "fk_contact"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_contact"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "hot_leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_contact"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "outstanding_balances"
            referencedColumns: ["contact_id"]
          },
        ]
      }
      quote_selections: {
        Row: {
          addons: Json | null
          contract_id: string | null
          created_at: string | null
          custom_addons: Json | null
          custom_line_items: Json | null
          deposit_amount: number | null
          deposit_due_date: string | null
          discount_amount: number | null
          discount_code: string | null
          discount_note: string | null
          discount_type: string | null
          discount_value: number | null
          id: string
          invoice_id: string | null
          is_custom_price: boolean | null
          lead_id: string
          organization_id: string | null
          package_id: string
          package_name: string
          package_price: number
          paid_at: string | null
          payment_intent_id: string | null
          payment_status: string | null
          remaining_balance_due_date: string | null
          show_line_item_prices: boolean | null
          signature: string | null
          signed_at: string | null
          status: string | null
          total_price: number
          updated_at: string | null
        }
        Insert: {
          addons?: Json | null
          contract_id?: string | null
          created_at?: string | null
          custom_addons?: Json | null
          custom_line_items?: Json | null
          deposit_amount?: number | null
          deposit_due_date?: string | null
          discount_amount?: number | null
          discount_code?: string | null
          discount_note?: string | null
          discount_type?: string | null
          discount_value?: number | null
          id?: string
          invoice_id?: string | null
          is_custom_price?: boolean | null
          lead_id: string
          organization_id?: string | null
          package_id: string
          package_name: string
          package_price: number
          paid_at?: string | null
          payment_intent_id?: string | null
          payment_status?: string | null
          remaining_balance_due_date?: string | null
          show_line_item_prices?: boolean | null
          signature?: string | null
          signed_at?: string | null
          status?: string | null
          total_price: number
          updated_at?: string | null
        }
        Update: {
          addons?: Json | null
          contract_id?: string | null
          created_at?: string | null
          custom_addons?: Json | null
          custom_line_items?: Json | null
          deposit_amount?: number | null
          deposit_due_date?: string | null
          discount_amount?: number | null
          discount_code?: string | null
          discount_note?: string | null
          discount_type?: string | null
          discount_value?: number | null
          id?: string
          invoice_id?: string | null
          is_custom_price?: boolean | null
          lead_id?: string
          organization_id?: string | null
          package_id?: string
          package_name?: string
          package_price?: number
          paid_at?: string | null
          payment_intent_id?: string | null
          payment_status?: string | null
          remaining_balance_due_date?: string | null
          show_line_item_prices?: boolean | null
          signature?: string | null
          signed_at?: string | null
          status?: string | null
          total_price?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "quote_selections_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contract_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quote_selections_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quote_selections_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoice_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quote_selections_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quote_selections_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "overdue_invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quote_selections_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quote_selections_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "venue_roster"
            referencedColumns: ["performer_id"]
          },
          {
            foreignKeyName: "quote_selections_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "venue_roster"
            referencedColumns: ["venue_id"]
          },
        ]
      }
      received_emails: {
        Row: {
          archived: boolean | null
          attachments: Json | null
          bcc_emails: string[] | null
          cc_emails: string[] | null
          created_at: string | null
          deleted: boolean | null
          flagged: boolean | null
          from_email: string
          from_name: string | null
          headers: Json | null
          html_body: string | null
          id: string
          message_id: string | null
          organization_id: string | null
          read: boolean | null
          received_at: string
          reply_to: string | null
          resend_email_id: string
          snooze_until: string | null
          snoozed: boolean | null
          spam_score: number | null
          subject: string | null
          text_body: string | null
          to_emails: string[]
          updated_at: string | null
        }
        Insert: {
          archived?: boolean | null
          attachments?: Json | null
          bcc_emails?: string[] | null
          cc_emails?: string[] | null
          created_at?: string | null
          deleted?: boolean | null
          flagged?: boolean | null
          from_email: string
          from_name?: string | null
          headers?: Json | null
          html_body?: string | null
          id?: string
          message_id?: string | null
          organization_id?: string | null
          read?: boolean | null
          received_at: string
          reply_to?: string | null
          resend_email_id: string
          snooze_until?: string | null
          snoozed?: boolean | null
          spam_score?: number | null
          subject?: string | null
          text_body?: string | null
          to_emails: string[]
          updated_at?: string | null
        }
        Update: {
          archived?: boolean | null
          attachments?: Json | null
          bcc_emails?: string[] | null
          cc_emails?: string[] | null
          created_at?: string | null
          deleted?: boolean | null
          flagged?: boolean | null
          from_email?: string
          from_name?: string | null
          headers?: Json | null
          html_body?: string | null
          id?: string
          message_id?: string | null
          organization_id?: string | null
          read?: boolean | null
          received_at?: string
          reply_to?: string | null
          resend_email_id?: string
          snooze_until?: string | null
          snoozed?: boolean | null
          spam_score?: number | null
          subject?: string | null
          text_body?: string | null
          to_emails?: string[]
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "received_emails_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "received_emails_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "venue_roster"
            referencedColumns: ["performer_id"]
          },
          {
            foreignKeyName: "received_emails_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "venue_roster"
            referencedColumns: ["venue_id"]
          },
        ]
      }
      serato_connections: {
        Row: {
          app_version: string | null
          connected_at: string | null
          connection_ip: string | null
          created_at: string | null
          detection_method: string | null
          disconnected_at: string | null
          dj_id: string
          id: string
          is_connected: boolean | null
          last_heartbeat: string | null
          organization_id: string | null
          platform: string | null
          updated_at: string | null
        }
        Insert: {
          app_version?: string | null
          connected_at?: string | null
          connection_ip?: string | null
          created_at?: string | null
          detection_method?: string | null
          disconnected_at?: string | null
          dj_id: string
          id?: string
          is_connected?: boolean | null
          last_heartbeat?: string | null
          organization_id?: string | null
          platform?: string | null
          updated_at?: string | null
        }
        Update: {
          app_version?: string | null
          connected_at?: string | null
          connection_ip?: string | null
          created_at?: string | null
          detection_method?: string | null
          disconnected_at?: string | null
          dj_id?: string
          id?: string
          is_connected?: boolean | null
          last_heartbeat?: string | null
          organization_id?: string | null
          platform?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "serato_connections_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "serato_connections_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "venue_roster"
            referencedColumns: ["performer_id"]
          },
          {
            foreignKeyName: "serato_connections_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "venue_roster"
            referencedColumns: ["venue_id"]
          },
        ]
      }
      serato_play_history: {
        Row: {
          artist: string
          bpm: number | null
          created_at: string | null
          deck: string | null
          detection_method: string | null
          dj_id: string
          id: string
          matched_at: string | null
          matched_request_id: string | null
          normalized_artist: string | null
          normalized_title: string | null
          organization_id: string | null
          played_at: string
          source_file: string | null
          title: string
        }
        Insert: {
          artist: string
          bpm?: number | null
          created_at?: string | null
          deck?: string | null
          detection_method?: string | null
          dj_id: string
          id?: string
          matched_at?: string | null
          matched_request_id?: string | null
          normalized_artist?: string | null
          normalized_title?: string | null
          organization_id?: string | null
          played_at: string
          source_file?: string | null
          title: string
        }
        Update: {
          artist?: string
          bpm?: number | null
          created_at?: string | null
          deck?: string | null
          detection_method?: string | null
          dj_id?: string
          id?: string
          matched_at?: string | null
          matched_request_id?: string | null
          normalized_artist?: string | null
          normalized_title?: string | null
          organization_id?: string | null
          played_at?: string
          source_file?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "serato_play_history_matched_request_id_fkey"
            columns: ["matched_request_id"]
            isOneToOne: false
            referencedRelation: "crowd_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "serato_play_history_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "serato_play_history_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "venue_roster"
            referencedColumns: ["performer_id"]
          },
          {
            foreignKeyName: "serato_play_history_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "venue_roster"
            referencedColumns: ["venue_id"]
          },
        ]
      }
      service_selection_tokens: {
        Row: {
          contact_id: string | null
          created_at: string | null
          expires_at: string
          id: string
          is_used: boolean | null
          organization_id: string | null
          token: string
          used_at: string | null
        }
        Insert: {
          contact_id?: string | null
          created_at?: string | null
          expires_at: string
          id?: string
          is_used?: boolean | null
          organization_id?: string | null
          token: string
          used_at?: string | null
        }
        Update: {
          contact_id?: string | null
          created_at?: string | null
          expires_at?: string
          id?: string
          is_used?: boolean | null
          organization_id?: string | null
          token?: string
          used_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "service_selection_tokens_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "client_payment_summary"
            referencedColumns: ["contact_id"]
          },
          {
            foreignKeyName: "service_selection_tokens_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_selection_tokens_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "hot_leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_selection_tokens_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "outstanding_balances"
            referencedColumns: ["contact_id"]
          },
          {
            foreignKeyName: "service_selection_tokens_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_selection_tokens_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "venue_roster"
            referencedColumns: ["performer_id"]
          },
          {
            foreignKeyName: "service_selection_tokens_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "venue_roster"
            referencedColumns: ["venue_id"]
          },
        ]
      }
      service_selections: {
        Row: {
          add_ons: Json | null
          admin_notes: string | null
          after_party: boolean | null
          budget_range: string | null
          ceremony_music: boolean | null
          cocktail_hour: boolean | null
          contact_id: string | null
          estimated_price: number | null
          event_date: string | null
          event_duration_hours: number | null
          event_time: string | null
          event_type: string | null
          guest_count: number | null
          id: string
          music_preferences: string | null
          organization_id: string | null
          package_selected: string | null
          reception: boolean | null
          services_selected: Json | null
          special_requests: string | null
          status: string | null
          submitted_at: string | null
          token_id: string | null
          updated_at: string | null
          venue_address: string | null
          venue_name: string | null
        }
        Insert: {
          add_ons?: Json | null
          admin_notes?: string | null
          after_party?: boolean | null
          budget_range?: string | null
          ceremony_music?: boolean | null
          cocktail_hour?: boolean | null
          contact_id?: string | null
          estimated_price?: number | null
          event_date?: string | null
          event_duration_hours?: number | null
          event_time?: string | null
          event_type?: string | null
          guest_count?: number | null
          id?: string
          music_preferences?: string | null
          organization_id?: string | null
          package_selected?: string | null
          reception?: boolean | null
          services_selected?: Json | null
          special_requests?: string | null
          status?: string | null
          submitted_at?: string | null
          token_id?: string | null
          updated_at?: string | null
          venue_address?: string | null
          venue_name?: string | null
        }
        Update: {
          add_ons?: Json | null
          admin_notes?: string | null
          after_party?: boolean | null
          budget_range?: string | null
          ceremony_music?: boolean | null
          cocktail_hour?: boolean | null
          contact_id?: string | null
          estimated_price?: number | null
          event_date?: string | null
          event_duration_hours?: number | null
          event_time?: string | null
          event_type?: string | null
          guest_count?: number | null
          id?: string
          music_preferences?: string | null
          organization_id?: string | null
          package_selected?: string | null
          reception?: boolean | null
          services_selected?: Json | null
          special_requests?: string | null
          status?: string | null
          submitted_at?: string | null
          token_id?: string | null
          updated_at?: string | null
          venue_address?: string | null
          venue_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "service_selections_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "client_payment_summary"
            referencedColumns: ["contact_id"]
          },
          {
            foreignKeyName: "service_selections_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_selections_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "hot_leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_selections_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "outstanding_balances"
            referencedColumns: ["contact_id"]
          },
          {
            foreignKeyName: "service_selections_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_selections_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "venue_roster"
            referencedColumns: ["performer_id"]
          },
          {
            foreignKeyName: "service_selections_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "venue_roster"
            referencedColumns: ["venue_id"]
          },
          {
            foreignKeyName: "service_selections_token_id_fkey"
            columns: ["token_id"]
            isOneToOne: false
            referencedRelation: "service_selection_tokens"
            referencedColumns: ["id"]
          },
        ]
      }
      services: {
        Row: {
          base_price: number | null
          category: string
          created_at: string | null
          description: string | null
          display_order: number | null
          features: string[] | null
          id: string
          is_active: boolean | null
          is_featured: boolean | null
          organization_id: string | null
          price_notes: string | null
          service_name: string
          updated_at: string | null
        }
        Insert: {
          base_price?: number | null
          category: string
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          features?: string[] | null
          id?: string
          is_active?: boolean | null
          is_featured?: boolean | null
          organization_id?: string | null
          price_notes?: string | null
          service_name: string
          updated_at?: string | null
        }
        Update: {
          base_price?: number | null
          category?: string
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          features?: string[] | null
          id?: string
          is_active?: boolean | null
          is_featured?: boolean | null
          organization_id?: string | null
          price_notes?: string | null
          service_name?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "services_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "services_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "venue_roster"
            referencedColumns: ["performer_id"]
          },
          {
            foreignKeyName: "services_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "venue_roster"
            referencedColumns: ["venue_id"]
          },
        ]
      }
      sms_conversations: {
        Row: {
          ai_model: string | null
          ai_response_time_ms: number | null
          ai_tokens_used: number | null
          contact_id: string | null
          conversation_session_id: string | null
          conversation_status: string | null
          created_at: string | null
          customer_id: string | null
          direction: string
          error_message: string | null
          id: string
          last_message_at: string | null
          last_message_from: string | null
          message_content: string
          message_status: string | null
          message_type: string | null
          messages: Json | null
          organization_id: string | null
          phone_number: string
          processed_at: string | null
          resolved_at: string | null
          twilio_message_sid: string | null
          updated_at: string | null
        }
        Insert: {
          ai_model?: string | null
          ai_response_time_ms?: number | null
          ai_tokens_used?: number | null
          contact_id?: string | null
          conversation_session_id?: string | null
          conversation_status?: string | null
          created_at?: string | null
          customer_id?: string | null
          direction: string
          error_message?: string | null
          id?: string
          last_message_at?: string | null
          last_message_from?: string | null
          message_content: string
          message_status?: string | null
          message_type?: string | null
          messages?: Json | null
          organization_id?: string | null
          phone_number: string
          processed_at?: string | null
          resolved_at?: string | null
          twilio_message_sid?: string | null
          updated_at?: string | null
        }
        Update: {
          ai_model?: string | null
          ai_response_time_ms?: number | null
          ai_tokens_used?: number | null
          contact_id?: string | null
          conversation_session_id?: string | null
          conversation_status?: string | null
          created_at?: string | null
          customer_id?: string | null
          direction?: string
          error_message?: string | null
          id?: string
          last_message_at?: string | null
          last_message_from?: string | null
          message_content?: string
          message_status?: string | null
          message_type?: string | null
          messages?: Json | null
          organization_id?: string | null
          phone_number?: string
          processed_at?: string | null
          resolved_at?: string | null
          twilio_message_sid?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sms_conversations_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "client_payment_summary"
            referencedColumns: ["contact_id"]
          },
          {
            foreignKeyName: "sms_conversations_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sms_conversations_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "hot_leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sms_conversations_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "outstanding_balances"
            referencedColumns: ["contact_id"]
          },
          {
            foreignKeyName: "sms_conversations_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sms_conversations_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "venue_roster"
            referencedColumns: ["performer_id"]
          },
          {
            foreignKeyName: "sms_conversations_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "venue_roster"
            referencedColumns: ["venue_id"]
          },
        ]
      }
      songs_played: {
        Row: {
          audio_sample_duration_seconds: number | null
          auto_marked_as_played: boolean | null
          contact_id: string | null
          created_at: string | null
          event_id: string | null
          id: string
          is_false_positive: boolean | null
          is_manual_entry: boolean | null
          matched_crowd_request_id: string | null
          notes: string | null
          organization_id: string | null
          recognition_confidence: number | null
          recognition_response: Json | null
          recognition_service: string | null
          recognition_timestamp: string | null
          song_artist: string
          song_title: string
          updated_at: string | null
          verified_at: string | null
          verified_by_user_id: string | null
        }
        Insert: {
          audio_sample_duration_seconds?: number | null
          auto_marked_as_played?: boolean | null
          contact_id?: string | null
          created_at?: string | null
          event_id?: string | null
          id?: string
          is_false_positive?: boolean | null
          is_manual_entry?: boolean | null
          matched_crowd_request_id?: string | null
          notes?: string | null
          organization_id?: string | null
          recognition_confidence?: number | null
          recognition_response?: Json | null
          recognition_service?: string | null
          recognition_timestamp?: string | null
          song_artist: string
          song_title: string
          updated_at?: string | null
          verified_at?: string | null
          verified_by_user_id?: string | null
        }
        Update: {
          audio_sample_duration_seconds?: number | null
          auto_marked_as_played?: boolean | null
          contact_id?: string | null
          created_at?: string | null
          event_id?: string | null
          id?: string
          is_false_positive?: boolean | null
          is_manual_entry?: boolean | null
          matched_crowd_request_id?: string | null
          notes?: string | null
          organization_id?: string | null
          recognition_confidence?: number | null
          recognition_response?: Json | null
          recognition_service?: string | null
          recognition_timestamp?: string | null
          song_artist?: string
          song_title?: string
          updated_at?: string | null
          verified_at?: string | null
          verified_by_user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "songs_played_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "client_payment_summary"
            referencedColumns: ["contact_id"]
          },
          {
            foreignKeyName: "songs_played_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "songs_played_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "hot_leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "songs_played_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "outstanding_balances"
            referencedColumns: ["contact_id"]
          },
          {
            foreignKeyName: "songs_played_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "songs_played_matched_crowd_request_id_fkey"
            columns: ["matched_crowd_request_id"]
            isOneToOne: false
            referencedRelation: "crowd_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      stream_alert_configs: {
        Row: {
          alert_duration_ms: number | null
          alert_token: string | null
          background_image_url: string | null
          built_in_sound: string | null
          created_at: string
          font_color: string | null
          goal_amount: number | null
          goal_current: number | null
          goal_enabled: boolean | null
          goal_title: string | null
          id: string
          layout_position: string | null
          pointer_events_disabled: boolean | null
          show_branding: boolean | null
          sound_enabled: boolean | null
          sound_file_url: string | null
          sound_volume: number | null
          theme: string | null
          ticker_count: number | null
          ticker_enabled: boolean | null
          tts_enabled: boolean | null
          tts_provider: string | null
          tts_voice: string | null
          updated_at: string
          user_id: string
          username: string | null
        }
        Insert: {
          alert_duration_ms?: number | null
          alert_token?: string | null
          background_image_url?: string | null
          built_in_sound?: string | null
          created_at?: string
          font_color?: string | null
          goal_amount?: number | null
          goal_current?: number | null
          goal_enabled?: boolean | null
          goal_title?: string | null
          id?: string
          layout_position?: string | null
          pointer_events_disabled?: boolean | null
          show_branding?: boolean | null
          sound_enabled?: boolean | null
          sound_file_url?: string | null
          sound_volume?: number | null
          theme?: string | null
          ticker_count?: number | null
          ticker_enabled?: boolean | null
          tts_enabled?: boolean | null
          tts_provider?: string | null
          tts_voice?: string | null
          updated_at?: string
          user_id: string
          username?: string | null
        }
        Update: {
          alert_duration_ms?: number | null
          alert_token?: string | null
          background_image_url?: string | null
          built_in_sound?: string | null
          created_at?: string
          font_color?: string | null
          goal_amount?: number | null
          goal_current?: number | null
          goal_enabled?: boolean | null
          goal_title?: string | null
          id?: string
          layout_position?: string | null
          pointer_events_disabled?: boolean | null
          show_branding?: boolean | null
          sound_enabled?: boolean | null
          sound_file_url?: string | null
          sound_volume?: number | null
          theme?: string | null
          ticker_count?: number | null
          ticker_enabled?: boolean | null
          tts_enabled?: boolean | null
          tts_provider?: string | null
          tts_voice?: string | null
          updated_at?: string
          user_id?: string
          username?: string | null
        }
        Relationships: []
      }
      stream_alert_events: {
        Row: {
          created_at: string
          displayed_at: string | null
          event_data: Json
          event_type: string
          id: string
          status: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          displayed_at?: string | null
          event_data: Json
          event_type: string
          id?: string
          status?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          displayed_at?: string | null
          event_data?: Json
          event_type?: string
          id?: string
          status?: string | null
          user_id?: string
        }
        Relationships: []
      }
      stream_recent_donors: {
        Row: {
          amount: number | null
          created_at: string
          donor_name: string
          event_type: string
          id: string
          user_id: string
        }
        Insert: {
          amount?: number | null
          created_at?: string
          donor_name: string
          event_type: string
          id?: string
          user_id: string
        }
        Update: {
          amount?: number | null
          created_at?: string
          donor_name?: string
          event_type?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      success_page_views: {
        Row: {
          created_at: string
          id: string
          ip_address: string | null
          is_first_view: boolean | null
          organization_id: string | null
          referrer: string | null
          request_id: string
          session_id: string | null
          updated_at: string
          user_agent: string | null
          viewed_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          ip_address?: string | null
          is_first_view?: boolean | null
          organization_id?: string | null
          referrer?: string | null
          request_id: string
          session_id?: string | null
          updated_at?: string
          user_agent?: string | null
          viewed_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          ip_address?: string | null
          is_first_view?: boolean | null
          organization_id?: string | null
          referrer?: string | null
          request_id?: string
          session_id?: string | null
          updated_at?: string
          user_agent?: string | null
          viewed_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "success_page_views_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "success_page_views_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "venue_roster"
            referencedColumns: ["performer_id"]
          },
          {
            foreignKeyName: "success_page_views_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "venue_roster"
            referencedColumns: ["venue_id"]
          },
          {
            foreignKeyName: "success_page_views_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "crowd_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      testimonials: {
        Row: {
          client_name: string
          created_at: string | null
          event_date: string | null
          event_type: string
          id: string
          is_active: boolean | null
          is_featured: boolean | null
          location: string
          organization_id: string | null
          rating: number | null
          testimonial_text: string
          updated_at: string | null
        }
        Insert: {
          client_name: string
          created_at?: string | null
          event_date?: string | null
          event_type: string
          id?: string
          is_active?: boolean | null
          is_featured?: boolean | null
          location: string
          organization_id?: string | null
          rating?: number | null
          testimonial_text: string
          updated_at?: string | null
        }
        Update: {
          client_name?: string
          created_at?: string | null
          event_date?: string | null
          event_type?: string
          id?: string
          is_active?: boolean | null
          is_featured?: boolean | null
          location?: string
          organization_id?: string | null
          rating?: number | null
          testimonial_text?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "testimonials_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "testimonials_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "venue_roster"
            referencedColumns: ["performer_id"]
          },
          {
            foreignKeyName: "testimonials_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "venue_roster"
            referencedColumns: ["venue_id"]
          },
        ]
      }
      venue_invitations: {
        Row: {
          accepted_at: string | null
          created_at: string | null
          expires_at: string | null
          id: string
          invitation_token: string
          invited_by: string
          invited_email: string
          performer_name: string | null
          performer_slug: string
          status: string | null
          updated_at: string | null
          venue_organization_id: string
        }
        Insert: {
          accepted_at?: string | null
          created_at?: string | null
          expires_at?: string | null
          id?: string
          invitation_token?: string
          invited_by: string
          invited_email: string
          performer_name?: string | null
          performer_slug: string
          status?: string | null
          updated_at?: string | null
          venue_organization_id: string
        }
        Update: {
          accepted_at?: string | null
          created_at?: string | null
          expires_at?: string | null
          id?: string
          invitation_token?: string
          invited_by?: string
          invited_email?: string
          performer_name?: string | null
          performer_slug?: string
          status?: string | null
          updated_at?: string | null
          venue_organization_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "venue_invitations_venue_organization_id_fkey"
            columns: ["venue_organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "venue_invitations_venue_organization_id_fkey"
            columns: ["venue_organization_id"]
            isOneToOne: false
            referencedRelation: "venue_roster"
            referencedColumns: ["performer_id"]
          },
          {
            foreignKeyName: "venue_invitations_venue_organization_id_fkey"
            columns: ["venue_organization_id"]
            isOneToOne: false
            referencedRelation: "venue_roster"
            referencedColumns: ["venue_id"]
          },
        ]
      }
      visitor_sessions: {
        Row: {
          city: string | null
          contact_id: string | null
          contact_submission_id: string | null
          country: string | null
          created_at: string
          email: string | null
          fingerprint: string
          first_seen_at: string
          has_made_payment: boolean | null
          has_made_song_request: boolean | null
          has_submitted_form: boolean | null
          id: string
          ip_address: string | null
          landing_page: string | null
          language: string | null
          last_seen_at: string
          name: string | null
          organization_id: string | null
          phone: string | null
          platform: string | null
          referrer: string | null
          region: string | null
          screen_resolution: string | null
          timezone: string | null
          total_page_views: number | null
          total_sessions: number | null
          updated_at: string
          user_agent: string | null
          utm_campaign: string | null
          utm_content: string | null
          utm_medium: string | null
          utm_source: string | null
          utm_term: string | null
        }
        Insert: {
          city?: string | null
          contact_id?: string | null
          contact_submission_id?: string | null
          country?: string | null
          created_at?: string
          email?: string | null
          fingerprint: string
          first_seen_at?: string
          has_made_payment?: boolean | null
          has_made_song_request?: boolean | null
          has_submitted_form?: boolean | null
          id?: string
          ip_address?: string | null
          landing_page?: string | null
          language?: string | null
          last_seen_at?: string
          name?: string | null
          organization_id?: string | null
          phone?: string | null
          platform?: string | null
          referrer?: string | null
          region?: string | null
          screen_resolution?: string | null
          timezone?: string | null
          total_page_views?: number | null
          total_sessions?: number | null
          updated_at?: string
          user_agent?: string | null
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
        }
        Update: {
          city?: string | null
          contact_id?: string | null
          contact_submission_id?: string | null
          country?: string | null
          created_at?: string
          email?: string | null
          fingerprint?: string
          first_seen_at?: string
          has_made_payment?: boolean | null
          has_made_song_request?: boolean | null
          has_submitted_form?: boolean | null
          id?: string
          ip_address?: string | null
          landing_page?: string | null
          language?: string | null
          last_seen_at?: string
          name?: string | null
          organization_id?: string | null
          phone?: string | null
          platform?: string | null
          referrer?: string | null
          region?: string | null
          screen_resolution?: string | null
          timezone?: string | null
          total_page_views?: number | null
          total_sessions?: number | null
          updated_at?: string
          user_agent?: string | null
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "visitor_sessions_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "client_payment_summary"
            referencedColumns: ["contact_id"]
          },
          {
            foreignKeyName: "visitor_sessions_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "visitor_sessions_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "hot_leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "visitor_sessions_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "outstanding_balances"
            referencedColumns: ["contact_id"]
          },
          {
            foreignKeyName: "visitor_sessions_contact_submission_id_fkey"
            columns: ["contact_submission_id"]
            isOneToOne: false
            referencedRelation: "contact_submissions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "visitor_sessions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "visitor_sessions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "venue_roster"
            referencedColumns: ["performer_id"]
          },
          {
            foreignKeyName: "visitor_sessions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "venue_roster"
            referencedColumns: ["venue_id"]
          },
        ]
      }
      voice_conversations: {
        Row: {
          contact_id: string | null
          context: Json | null
          conversation_type: string
          created_at: string | null
          id: string
          last_interaction_at: string | null
          messages: Json | null
          phone_number: string | null
          room_name: string | null
          session_id: string
          started_at: string | null
          status: string | null
          summary: string | null
          updated_at: string | null
        }
        Insert: {
          contact_id?: string | null
          context?: Json | null
          conversation_type: string
          created_at?: string | null
          id?: string
          last_interaction_at?: string | null
          messages?: Json | null
          phone_number?: string | null
          room_name?: string | null
          session_id: string
          started_at?: string | null
          status?: string | null
          summary?: string | null
          updated_at?: string | null
        }
        Update: {
          contact_id?: string | null
          context?: Json | null
          conversation_type?: string
          created_at?: string | null
          id?: string
          last_interaction_at?: string | null
          messages?: Json | null
          phone_number?: string | null
          room_name?: string | null
          session_id?: string
          started_at?: string | null
          status?: string | null
          summary?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "voice_conversations_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "client_payment_summary"
            referencedColumns: ["contact_id"]
          },
          {
            foreignKeyName: "voice_conversations_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "voice_conversations_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "hot_leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "voice_conversations_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "outstanding_balances"
            referencedColumns: ["contact_id"]
          },
        ]
      }
    }
    Views: {
      active_djs_by_city: {
        Row: {
          average_rating: number | null
          business_name: string | null
          city: string | null
          dj_name: string | null
          id: string | null
          is_featured: boolean | null
          is_verified: boolean | null
          organization_id: string | null
          starting_price: number | null
          state: string | null
          total_reviews: number | null
          user_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "dj_network_profiles_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dj_network_profiles_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "venue_roster"
            referencedColumns: ["performer_id"]
          },
          {
            foreignKeyName: "dj_network_profiles_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "venue_roster"
            referencedColumns: ["venue_id"]
          },
        ]
      }
      client_payment_summary: {
        Row: {
          avg_days_late: number | null
          contact_id: string | null
          email_address: string | null
          first_name: string | null
          first_payment_date: string | null
          last_name: string | null
          last_payment_date: string | null
          payment_methods_used: string | null
          total_net_received: number | null
          total_paid: number | null
          total_payments: number | null
          total_tips: number | null
        }
        Relationships: []
      }
      contacts_summary: {
        Row: {
          avg_lead_score: number | null
          booked_events: number | null
          follow_ups_due: number | null
          new_leads: number | null
          total_booked_value: number | null
          total_contacts: number | null
          upcoming_events: number | null
          user_id: string | null
        }
        Relationships: []
      }
      contract_summary: {
        Row: {
          client_name: string | null
          contract_number: string | null
          created_at: string | null
          email_address: string | null
          event_date: string | null
          event_name: string | null
          id: string | null
          signed_at: string | null
          status: string | null
          total_amount: number | null
        }
        Relationships: []
      }
      conversation_summaries: {
        Row: {
          ai_responses: number | null
          conversation_session_id: string | null
          conversation_start: string | null
          customer_messages: string[] | null
          event_date: string | null
          event_type: string | null
          first_name: string | null
          inbound_messages: number | null
          last_message: string | null
          last_name: string | null
          lead_status: string | null
          message_count: number | null
          outbound_messages: number | null
          phone_number: string | null
        }
        Relationships: []
      }
      customer_timeline: {
        Row: {
          description: string | null
          event_id: string | null
          event_time: string | null
          event_type: string | null
          metadata: Json | null
          organization_id: string | null
          title: string | null
          visitor_id: string | null
        }
        Relationships: []
      }
      hot_leads: {
        Row: {
          address: string | null
          assigned_to: string | null
          budget_range: string | null
          calls_made_count: number | null
          campaign_source: string | null
          city: string | null
          communication_preference: string | null
          competitors_considered: string[] | null
          contract_signed_date: string | null
          contract_url: string | null
          country: string | null
          created_at: string | null
          custom_fields: Json | null
          deal_probability: number | null
          deleted_at: string | null
          deposit_amount: number | null
          deposit_paid: boolean | null
          do_not_play_list: string | null
          email_address: string | null
          emails_sent_count: number | null
          equipment_needs: string[] | null
          event_date: string | null
          event_duration_hours: number | null
          event_feedback: string | null
          event_rating: number | null
          event_time: string | null
          event_type: string | null
          expected_close_date: string | null
          final_price: number | null
          first_dance_song: string | null
          first_name: string | null
          follow_up_notes: string | null
          guest_count: number | null
          how_heard_about_us: string | null
          id: string | null
          internal_notes: string | null
          last_contact_type: string | null
          last_contacted_date: string | null
          last_name: string | null
          lead_quality: string | null
          lead_score: number | null
          lead_source: string | null
          lead_stage: string | null
          lead_status: string | null
          lead_temperature: string | null
          meetings_held: number | null
          messages_received_count: number | null
          messages_sent_count: number | null
          music_genres: string[] | null
          next_follow_up_date: string | null
          notes: string | null
          opt_in_status: boolean | null
          payment_status: string | null
          phone: string | null
          photos_provided: boolean | null
          playlist_provided: boolean | null
          preferred_language: string | null
          priority_level: string | null
          proposal_sent_date: string | null
          proposal_value: number | null
          quoted_price: number | null
          referral_contact: string | null
          referral_source: string | null
          review_left: boolean | null
          review_requested: boolean | null
          search_vector: unknown
          social_media_handles: Json | null
          special_moments: string | null
          special_requests: string | null
          state: string | null
          tags: string[] | null
          testimonial_provided: boolean | null
          testimonial_text: string | null
          updated_at: string | null
          user_id: string | null
          venue_address: string | null
          venue_name: string | null
          why_chose_us: string | null
          why_lost_deal: string | null
        }
        Insert: {
          address?: string | null
          assigned_to?: string | null
          budget_range?: string | null
          calls_made_count?: number | null
          campaign_source?: string | null
          city?: string | null
          communication_preference?: string | null
          competitors_considered?: string[] | null
          contract_signed_date?: string | null
          contract_url?: string | null
          country?: string | null
          created_at?: string | null
          custom_fields?: Json | null
          deal_probability?: number | null
          deleted_at?: string | null
          deposit_amount?: number | null
          deposit_paid?: boolean | null
          do_not_play_list?: string | null
          email_address?: string | null
          emails_sent_count?: number | null
          equipment_needs?: string[] | null
          event_date?: string | null
          event_duration_hours?: number | null
          event_feedback?: string | null
          event_rating?: number | null
          event_time?: string | null
          event_type?: string | null
          expected_close_date?: string | null
          final_price?: number | null
          first_dance_song?: string | null
          first_name?: string | null
          follow_up_notes?: string | null
          guest_count?: number | null
          how_heard_about_us?: string | null
          id?: string | null
          internal_notes?: string | null
          last_contact_type?: string | null
          last_contacted_date?: string | null
          last_name?: string | null
          lead_quality?: string | null
          lead_score?: number | null
          lead_source?: string | null
          lead_stage?: string | null
          lead_status?: string | null
          lead_temperature?: string | null
          meetings_held?: number | null
          messages_received_count?: number | null
          messages_sent_count?: number | null
          music_genres?: string[] | null
          next_follow_up_date?: string | null
          notes?: string | null
          opt_in_status?: boolean | null
          payment_status?: string | null
          phone?: string | null
          photos_provided?: boolean | null
          playlist_provided?: boolean | null
          preferred_language?: string | null
          priority_level?: string | null
          proposal_sent_date?: string | null
          proposal_value?: number | null
          quoted_price?: number | null
          referral_contact?: string | null
          referral_source?: string | null
          review_left?: boolean | null
          review_requested?: boolean | null
          search_vector?: unknown
          social_media_handles?: Json | null
          special_moments?: string | null
          special_requests?: string | null
          state?: string | null
          tags?: string[] | null
          testimonial_provided?: boolean | null
          testimonial_text?: string | null
          updated_at?: string | null
          user_id?: string | null
          venue_address?: string | null
          venue_name?: string | null
          why_chose_us?: string | null
          why_lost_deal?: string | null
        }
        Update: {
          address?: string | null
          assigned_to?: string | null
          budget_range?: string | null
          calls_made_count?: number | null
          campaign_source?: string | null
          city?: string | null
          communication_preference?: string | null
          competitors_considered?: string[] | null
          contract_signed_date?: string | null
          contract_url?: string | null
          country?: string | null
          created_at?: string | null
          custom_fields?: Json | null
          deal_probability?: number | null
          deleted_at?: string | null
          deposit_amount?: number | null
          deposit_paid?: boolean | null
          do_not_play_list?: string | null
          email_address?: string | null
          emails_sent_count?: number | null
          equipment_needs?: string[] | null
          event_date?: string | null
          event_duration_hours?: number | null
          event_feedback?: string | null
          event_rating?: number | null
          event_time?: string | null
          event_type?: string | null
          expected_close_date?: string | null
          final_price?: number | null
          first_dance_song?: string | null
          first_name?: string | null
          follow_up_notes?: string | null
          guest_count?: number | null
          how_heard_about_us?: string | null
          id?: string | null
          internal_notes?: string | null
          last_contact_type?: string | null
          last_contacted_date?: string | null
          last_name?: string | null
          lead_quality?: string | null
          lead_score?: number | null
          lead_source?: string | null
          lead_stage?: string | null
          lead_status?: string | null
          lead_temperature?: string | null
          meetings_held?: number | null
          messages_received_count?: number | null
          messages_sent_count?: number | null
          music_genres?: string[] | null
          next_follow_up_date?: string | null
          notes?: string | null
          opt_in_status?: boolean | null
          payment_status?: string | null
          phone?: string | null
          photos_provided?: boolean | null
          playlist_provided?: boolean | null
          preferred_language?: string | null
          priority_level?: string | null
          proposal_sent_date?: string | null
          proposal_value?: number | null
          quoted_price?: number | null
          referral_contact?: string | null
          referral_source?: string | null
          review_left?: boolean | null
          review_requested?: boolean | null
          search_vector?: unknown
          social_media_handles?: Json | null
          special_moments?: string | null
          special_requests?: string | null
          state?: string | null
          tags?: string[] | null
          testimonial_provided?: boolean | null
          testimonial_text?: string | null
          updated_at?: string | null
          user_id?: string | null
          venue_address?: string | null
          venue_name?: string | null
          why_chose_us?: string | null
          why_lost_deal?: string | null
        }
        Relationships: []
      }
      invoice_summary: {
        Row: {
          amount_paid: number | null
          balance_due: number | null
          contact_id: string | null
          days_overdue: number | null
          due_date: string | null
          email_address: string | null
          event_date: string | null
          event_type: string | null
          first_name: string | null
          id: string | null
          invoice_date: string | null
          invoice_number: string | null
          invoice_status: string | null
          invoice_title: string | null
          last_name: string | null
          last_payment_date: string | null
          organization_id: string | null
          paid_date: string | null
          payment_count: number | null
          phone: string | null
          project_id: string | null
          project_name: string | null
          sent_date: string | null
          status_color: string | null
          total_amount: number | null
        }
        Relationships: [
          {
            foreignKeyName: "invoices_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "client_payment_summary"
            referencedColumns: ["contact_id"]
          },
          {
            foreignKeyName: "invoices_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "hot_leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "outstanding_balances"
            referencedColumns: ["contact_id"]
          },
          {
            foreignKeyName: "invoices_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "venue_roster"
            referencedColumns: ["performer_id"]
          },
          {
            foreignKeyName: "invoices_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "venue_roster"
            referencedColumns: ["venue_id"]
          },
          {
            foreignKeyName: "invoices_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      monthly_invoice_stats: {
        Row: {
          avg_invoice_amount: number | null
          invoice_count: number | null
          month: string | null
          overdue_count: number | null
          paid_count: number | null
          total_collected: number | null
          total_invoiced: number | null
          total_outstanding: number | null
        }
        Relationships: []
      }
      monthly_revenue: {
        Row: {
          effective_fee_rate: number | null
          gross_revenue: number | null
          month: string | null
          net_revenue: number | null
          sales_tax_collected: number | null
          tips_collected: number | null
          total_fees: number | null
          transaction_count: number | null
        }
        Relationships: []
      }
      outstanding_balances: {
        Row: {
          balance_due: number | null
          completed_payments: number | null
          contact_id: string | null
          email_address: string | null
          event_date: string | null
          event_type: string | null
          first_name: string | null
          last_name: string | null
          last_payment_date: string | null
          next_payment_due: string | null
          overdue_payments: number | null
          pending_payments: number | null
          phone: string | null
          project_value: number | null
          total_paid: number | null
        }
        Relationships: []
      }
      overdue_installments: {
        Row: {
          amount: number | null
          contact_id: string | null
          created_at: string | null
          days_overdue: number | null
          deleted_at: string | null
          due_date: string | null
          email_address: string | null
          first_name: string | null
          id: string | null
          installment_name: string | null
          installment_number: number | null
          invoice_id: string | null
          invoice_number: string | null
          last_name: string | null
          notes: string | null
          paid_amount: number | null
          paid_at: string | null
          payment_id: string | null
          payment_plan_id: string | null
          phone: string | null
          plan_name: string | null
          reminder_count: number | null
          reminder_sent_at: string | null
          status: string | null
          stripe_payment_intent: string | null
          updated_at: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payment_installments_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoice_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_installments_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_installments_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "overdue_invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_installments_payment_id_fkey"
            columns: ["payment_id"]
            isOneToOne: false
            referencedRelation: "payments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_installments_payment_plan_id_fkey"
            columns: ["payment_plan_id"]
            isOneToOne: false
            referencedRelation: "payment_plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_plans_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "client_payment_summary"
            referencedColumns: ["contact_id"]
          },
          {
            foreignKeyName: "payment_plans_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_plans_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "hot_leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_plans_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "outstanding_balances"
            referencedColumns: ["contact_id"]
          },
        ]
      }
      overdue_invoices: {
        Row: {
          amount_overdue: number | null
          amount_paid: number | null
          auto_reminders_enabled: boolean | null
          balance_due: number | null
          contact_id: string | null
          created_at: string | null
          days_overdue: number | null
          deposit_amount: number | null
          deposit_paid: boolean | null
          deposit_paid_at: string | null
          discount_amount: number | null
          discount_code_id: string | null
          due_date: string | null
          email_address: string | null
          first_name: string | null
          has_payment_plan: boolean | null
          honeybook_invoice_id: string | null
          id: string | null
          internal_notes: string | null
          invoice_date: string | null
          invoice_description: string | null
          invoice_number: string | null
          invoice_status: string | null
          invoice_title: string | null
          last_name: string | null
          last_viewed_at: string | null
          late_fee_amount: number | null
          line_items: Json | null
          notes: string | null
          organization_id: string | null
          paid_date: string | null
          payment_plan_id: string | null
          payment_terms: string | null
          phone: string | null
          project_id: string | null
          qr_code_data: string | null
          reminder_sent_count: number | null
          sent_date: string | null
          subtotal: number | null
          tax_amount: number | null
          total_amount: number | null
          updated_at: string | null
          view_count: number | null
        }
        Relationships: [
          {
            foreignKeyName: "invoices_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "client_payment_summary"
            referencedColumns: ["contact_id"]
          },
          {
            foreignKeyName: "invoices_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "hot_leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "outstanding_balances"
            referencedColumns: ["contact_id"]
          },
          {
            foreignKeyName: "invoices_discount_code_id_fkey"
            columns: ["discount_code_id"]
            isOneToOne: false
            referencedRelation: "discount_codes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "venue_roster"
            referencedColumns: ["performer_id"]
          },
          {
            foreignKeyName: "invoices_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "venue_roster"
            referencedColumns: ["venue_id"]
          },
          {
            foreignKeyName: "invoices_payment_plan_id_fkey"
            columns: ["payment_plan_id"]
            isOneToOne: false
            referencedRelation: "payment_plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_method_stats: {
        Row: {
          avg_fee_per_transaction: number | null
          avg_transaction_size: number | null
          effective_fee_rate: number | null
          payment_method: string | null
          total_fees_paid: number | null
          total_net_received: number | null
          total_volume: number | null
          transaction_count: number | null
        }
        Relationships: []
      }
      upcoming_payments: {
        Row: {
          amount: number | null
          contact_id: string | null
          created_at: string | null
          days_until_due: number | null
          deleted_at: string | null
          due_date: string | null
          email_address: string | null
          first_name: string | null
          id: string | null
          installment_name: string | null
          installment_number: number | null
          invoice_id: string | null
          invoice_number: string | null
          last_name: string | null
          notes: string | null
          paid_amount: number | null
          paid_at: string | null
          payment_id: string | null
          payment_plan_id: string | null
          plan_name: string | null
          reminder_count: number | null
          reminder_sent_at: string | null
          status: string | null
          stripe_payment_intent: string | null
          updated_at: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payment_installments_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoice_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_installments_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_installments_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "overdue_invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_installments_payment_id_fkey"
            columns: ["payment_id"]
            isOneToOne: false
            referencedRelation: "payments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_installments_payment_plan_id_fkey"
            columns: ["payment_plan_id"]
            isOneToOne: false
            referencedRelation: "payment_plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_plans_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "client_payment_summary"
            referencedColumns: ["contact_id"]
          },
          {
            foreignKeyName: "payment_plans_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_plans_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "hot_leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_plans_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "outstanding_balances"
            referencedColumns: ["contact_id"]
          },
        ]
      }
      venue_roster: {
        Row: {
          is_active: boolean | null
          performer_email: string | null
          performer_full_name: string | null
          performer_full_slug: string | null
          performer_id: string | null
          performer_joined_at: string | null
          performer_name: string | null
          performer_slug: string | null
          venue_id: string | null
          venue_name: string | null
          venue_slug: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      backfill_event_contact_links: {
        Args: never
        Returns: {
          contact_id: string
          event_id: string
          match_type: string
        }[]
      }
      backfill_missing_records: {
        Args: never
        Returns: {
          contact_id: string
          created_contract: boolean
          created_invoice: boolean
          created_quote: boolean
        }[]
      }
      calculate_late_fee: {
        Args: {
          p_amount: number
          p_days_overdue: number
          p_fee_type?: string
          p_fee_value?: number
        }
        Returns: number
      }
      calculate_percentile: {
        Args: { percentile: number; values_array: number[] }
        Returns: number
      }
      check_performer_parent_access: {
        Args: { org_id: string; user_id: string }
        Returns: boolean
      }
      check_venue_child_access: {
        Args: { org_id: string; user_id: string }
        Returns: boolean
      }
      cleanup_expired_tokens: { Args: never; Returns: number }
      cleanup_old_pending_responses: { Args: never; Returns: undefined }
      expire_old_venue_invitations: { Args: never; Returns: undefined }
      extract_call_metadata: {
        Args: { transcript_text: string }
        Returns: Json
      }
      find_orphaned_contacts: {
        Args: never
        Returns: {
          contact_id: string
          email: string
          first_name: string
          has_contract: boolean
          has_event: boolean
          has_invoice: boolean
          has_quote: boolean
          last_name: string
        }[]
      }
      find_pricing_mismatches: {
        Args: never
        Returns: {
          contact_id: string
          contact_name: string
          contact_price: number
          contract_total: number
          invoice_total: number
          mismatch_type: string
          quote_total: number
        }[]
      }
      find_status_inconsistencies: {
        Args: never
        Returns: {
          contact_id: string
          contact_lead_status: string
          contact_name: string
          contact_payment_status: string
          contract_status: string
          invoice_status: string
          issue: string
        }[]
      }
      find_unlinked_events: {
        Args: never
        Returns: {
          client_email: string
          event_date: string
          event_id: string
          event_name: string
          suggested_contact_id: string
          suggested_contact_name: string
        }[]
      }
      force_sync_all_contacts: {
        Args: never
        Returns: {
          contact_id: string
          synced_contracts: number
          synced_events: number
          synced_invoices: number
        }[]
      }
      generate_contract_number: { Args: never; Returns: string }
      generate_conversation_session: { Args: never; Returns: string }
      generate_invoice_number: { Args: never; Returns: string }
      generate_payment_code: { Args: never; Returns: string }
      generate_selection_token: { Args: never; Returns: string }
      get_active_bidding_round: {
        Args: { p_organization_id: string }
        Returns: {
          ends_at: string
          id: string
          organization_id: string
          round_number: number
          started_at: string
          status: string
          time_remaining_seconds: number
        }[]
      }
      get_admin_role: {
        Args: { user_email: string }
        Returns: {
          email: string
          full_name: string
          id: string
          is_active: boolean
          last_login: string
          role: string
          user_id: string
        }[]
      }
      get_available_time_slots: {
        Args: {
          p_date: string
          p_meeting_type_id?: string
          p_timezone?: string
        }
        Returns: {
          is_available: boolean
          reason: string
          time_slot: string
        }[]
      }
      get_customer_timeline: {
        Args: { p_limit?: number; p_visitor_id: string }
        Returns: {
          description: string
          event_id: string
          event_time: string
          event_type: string
          metadata: Json
          organization_id: string
          title: string
          visitor_id: string
        }[]
      }
      get_customer_timeline_by_contact: {
        Args: { p_email?: string; p_limit?: number; p_phone?: string }
        Returns: {
          description: string
          event_id: string
          event_time: string
          event_type: string
          metadata: Json
          organization_id: string
          title: string
          visitor_id: string
        }[]
      }
      get_dj_virtual_number: {
        Args: { p_dj_profile_id: string }
        Returns: string
      }
      get_highest_bid: {
        Args: { p_request_id: string; p_round_id: string }
        Returns: {
          bid_amount: number
          bidder_email: string
          bidder_name: string
          created_at: string
        }[]
      }
      get_or_create_contract_for_quote: {
        Args: { p_contact_id: string; p_org_id?: string; p_quote_id: string }
        Returns: string
      }
      get_or_create_conversation_session: {
        Args: { phone_num: string }
        Returns: string
      }
      get_or_create_visitor: {
        Args: {
          p_fingerprint: string
          p_ip_address?: string
          p_landing_page?: string
          p_language?: string
          p_organization_id?: string
          p_platform?: string
          p_referrer?: string
          p_screen_resolution?: string
          p_timezone?: string
          p_user_agent?: string
          p_utm_campaign?: string
          p_utm_medium?: string
          p_utm_source?: string
        }
        Returns: string
      }
      increment_contact_message_count: {
        Args: { count_type: string; phone_num: string }
        Returns: undefined
      }
      is_current_user_admin: { Args: never; Returns: boolean }
      is_discount_valid: {
        Args: { p_code: string; p_order_amount: number }
        Returns: boolean
      }
      is_platform_admin:
        | { Args: never; Returns: boolean }
        | { Args: { user_email: string }; Returns: boolean }
      link_visitor_to_contact: {
        Args: {
          p_contact_id?: string
          p_contact_submission_id?: string
          p_email?: string
          p_name?: string
          p_phone?: string
          p_visitor_id: string
        }
        Returns: undefined
      }
      mark_overdue_payments: { Args: never; Returns: undefined }
      normalize_price_to_4hour: {
        Args: { duration_hours?: number; price: number; pricing_model: string }
        Returns: number
      }
      normalize_track_string: { Args: { str: string }; Returns: string }
      record_page_view: {
        Args: {
          p_device_type?: string
          p_organization_id?: string
          p_page_category?: string
          p_page_path: string
          p_page_title?: string
          p_page_url: string
          p_referrer?: string
          p_user_agent?: string
          p_visitor_id: string
        }
        Returns: string
      }
      sync_all_quotes_to_contracts: {
        Args: never
        Returns: {
          contract_id: string
          quote_id: string
          synced: boolean
        }[]
      }
      sync_all_quotes_to_invoices: {
        Args: never
        Returns: {
          invoice_id: string
          quote_id: string
          synced: boolean
        }[]
      }
      sync_quote_selection_to_contract: {
        Args: { p_quote_selection_id: string }
        Returns: boolean
      }
      sync_quote_selection_to_invoice: {
        Args: { p_quote_selection_id: string }
        Returns: boolean
      }
      to_title_case: { Args: { input_text: string }; Returns: string }
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
