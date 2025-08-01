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
      contacts: {
        Row: {
          id: string
          user_id: string | null
          first_name: string | null
          last_name: string | null
          phone: string | null
          email_address: string | null
          address: string | null
          city: string | null
          state: string | null
          country: string | null
          event_type: string | null
          event_date: string | null
          event_time: string | null
          venue_name: string | null
          venue_address: string | null
          guest_count: number | null
          event_duration_hours: number | null
          budget_range: string | null
          quoted_price: number | null
          final_price: number | null
          deposit_amount: number | null
          deposit_paid: boolean | null
          payment_status: string | null
          lead_status: string | null
          lead_source: string | null
          lead_stage: string | null
          lead_temperature: string | null
          lead_quality: string | null
          lead_score: number | null
          communication_preference: string | null
          opt_in_status: boolean | null
          preferred_language: string | null
          last_contacted_date: string | null
          last_contact_type: string | null
          next_follow_up_date: string | null
          follow_up_notes: string | null
          music_genres: string[] | null
          special_requests: string | null
          equipment_needs: string[] | null
          playlist_provided: boolean | null
          do_not_play_list: string | null
          first_dance_song: string | null
          special_moments: string | null
          referral_source: string | null
          referral_contact: string | null
          campaign_source: string | null
          how_heard_about_us: string | null
          social_media_handles: Json | null
          assigned_to: string | null
          priority_level: string | null
          deal_probability: number | null
          expected_close_date: string | null
          proposal_sent_date: string | null
          proposal_value: number | null
          contract_signed_date: string | null
          contract_url: string | null
          messages_sent_count: number | null
          messages_received_count: number | null
          emails_sent_count: number | null
          calls_made_count: number | null
          meetings_held: number | null
          notes: string | null
          internal_notes: string | null
          tags: string[] | null
          custom_fields: Json | null
          competitors_considered: string[] | null
          why_chose_us: string | null
          why_lost_deal: string | null
          event_feedback: string | null
          event_rating: number | null
          testimonial_provided: boolean | null
          testimonial_text: string | null
          photos_provided: boolean | null
          review_requested: boolean | null
          review_left: boolean | null
          created_at: string
          updated_at: string
          deleted_at: string | null
          search_vector: unknown | null
        }
        Insert: {
          id?: string
          user_id?: string | null
          first_name?: string | null
          last_name?: string | null
          phone?: string | null
          email_address?: string | null
          address?: string | null
          city?: string | null
          state?: string | null
          country?: string | null
          event_type?: string | null
          event_date?: string | null
          event_time?: string | null
          venue_name?: string | null
          venue_address?: string | null
          guest_count?: number | null
          event_duration_hours?: number | null
          budget_range?: string | null
          quoted_price?: number | null
          final_price?: number | null
          deposit_amount?: number | null
          deposit_paid?: boolean | null
          payment_status?: string | null
          lead_status?: string | null
          lead_source?: string | null
          lead_stage?: string | null
          lead_temperature?: string | null
          lead_quality?: string | null
          lead_score?: number | null
          communication_preference?: string | null
          opt_in_status?: boolean | null
          preferred_language?: string | null
          last_contacted_date?: string | null
          last_contact_type?: string | null
          next_follow_up_date?: string | null
          follow_up_notes?: string | null
          music_genres?: string[] | null
          special_requests?: string | null
          equipment_needs?: string[] | null
          playlist_provided?: boolean | null
          do_not_play_list?: string | null
          first_dance_song?: string | null
          special_moments?: string | null
          referral_source?: string | null
          referral_contact?: string | null
          campaign_source?: string | null
          how_heard_about_us?: string | null
          social_media_handles?: Json | null
          assigned_to?: string | null
          priority_level?: string | null
          deal_probability?: number | null
          expected_close_date?: string | null
          proposal_sent_date?: string | null
          proposal_value?: number | null
          contract_signed_date?: string | null
          contract_url?: string | null
          messages_sent_count?: number | null
          messages_received_count?: number | null
          emails_sent_count?: number | null
          calls_made_count?: number | null
          meetings_held?: number | null
          notes?: string | null
          internal_notes?: string | null
          tags?: string[] | null
          custom_fields?: Json | null
          competitors_considered?: string[] | null
          why_chose_us?: string | null
          why_lost_deal?: string | null
          event_feedback?: string | null
          event_rating?: number | null
          testimonial_provided?: boolean | null
          testimonial_text?: string | null
          photos_provided?: boolean | null
          review_requested?: boolean | null
          review_left?: boolean | null
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
          search_vector?: unknown | null
        }
        Update: {
          id?: string
          user_id?: string | null
          first_name?: string | null
          last_name?: string | null
          phone?: string | null
          email_address?: string | null
          address?: string | null
          city?: string | null
          state?: string | null
          country?: string | null
          event_type?: string | null
          event_date?: string | null
          event_time?: string | null
          venue_name?: string | null
          venue_address?: string | null
          guest_count?: number | null
          event_duration_hours?: number | null
          budget_range?: string | null
          quoted_price?: number | null
          final_price?: number | null
          deposit_amount?: number | null
          deposit_paid?: boolean | null
          payment_status?: string | null
          lead_status?: string | null
          lead_source?: string | null
          lead_stage?: string | null
          lead_temperature?: string | null
          lead_quality?: string | null
          lead_score?: number | null
          communication_preference?: string | null
          opt_in_status?: boolean | null
          preferred_language?: string | null
          last_contacted_date?: string | null
          last_contact_type?: string | null
          next_follow_up_date?: string | null
          follow_up_notes?: string | null
          music_genres?: string[] | null
          special_requests?: string | null
          equipment_needs?: string[] | null
          playlist_provided?: boolean | null
          do_not_play_list?: string | null
          first_dance_song?: string | null
          special_moments?: string | null
          referral_source?: string | null
          referral_contact?: string | null
          campaign_source?: string | null
          how_heard_about_us?: string | null
          social_media_handles?: Json | null
          assigned_to?: string | null
          priority_level?: string | null
          deal_probability?: number | null
          expected_close_date?: string | null
          proposal_sent_date?: string | null
          proposal_value?: number | null
          contract_signed_date?: string | null
          contract_url?: string | null
          messages_sent_count?: number | null
          messages_received_count?: number | null
          emails_sent_count?: number | null
          calls_made_count?: number | null
          meetings_held?: number | null
          notes?: string | null
          internal_notes?: string | null
          tags?: string[] | null
          custom_fields?: Json | null
          competitors_considered?: string[] | null
          why_chose_us?: string | null
          why_lost_deal?: string | null
          event_feedback?: string | null
          event_rating?: number | null
          testimonial_provided?: boolean | null
          testimonial_text?: string | null
          photos_provided?: boolean | null
          review_requested?: boolean | null
          review_left?: boolean | null
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
          search_vector?: unknown | null
        }
        Relationships: [
          {
            foreignKeyName: "contacts_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contacts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      admin_settings: {
        Row: {
          id: string
          user_id: string | null
          setting_key: string
          setting_value: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          setting_key: string
          setting_value?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          setting_key?: string
          setting_value?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "admin_settings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      customers: {
        Row: {
          id: string
          stripe_customer_id: string | null
        }
        Insert: {
          id: string
          stripe_customer_id?: string | null
        }
        Update: {
          id?: string
          stripe_customer_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "customers_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      prices: {
        Row: {
          active: boolean | null
          currency: string | null
          id: string
          interval: Database["public"]["Enums"]["pricing_plan_interval"] | null
          interval_count: number | null
          product_id: string | null
          trial_period_days: number | null
          type: Database["public"]["Enums"]["pricing_type"] | null
          unit_amount: number | null
        }
        Insert: {
          active?: boolean | null
          currency?: string | null
          id: string
          interval?: Database["public"]["Enums"]["pricing_plan_interval"] | null
          interval_count?: number | null
          product_id?: string | null
          trial_period_days?: number | null
          type?: Database["public"]["Enums"]["pricing_type"] | null
          unit_amount?: number | null
        }
        Update: {
          active?: boolean | null
          currency?: string | null
          id?: string
          interval?: Database["public"]["Enums"]["pricing_plan_interval"] | null
          interval_count?: number | null
          product_id?: string | null
          trial_period_days?: number | null
          type?: Database["public"]["Enums"]["pricing_type"] | null
          unit_amount?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "prices_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          }
        ]
      }
      products: {
        Row: {
          active: boolean | null
          description: string | null
          id: string
          image: string | null
          metadata: Json | null
          name: string | null
        }
        Insert: {
          active?: boolean | null
          description?: string | null
          id: string
          image?: string | null
          metadata?: Json | null
          name?: string | null
        }
        Update: {
          active?: boolean | null
          description?: string | null
          id?: string
          image?: string | null
          metadata?: Json | null
          name?: string | null
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          cancel_at: string | null
          cancel_at_period_end: boolean | null
          canceled_at: string | null
          created: string
          current_period_end: string
          current_period_start: string
          ended_at: string | null
          id: string
          metadata: Json | null
          price_id: string | null
          quantity: number | null
          status: Database["public"]["Enums"]["subscription_status"] | null
          trial_end: string | null
          trial_start: string | null
          user_id: string
        }
        Insert: {
          cancel_at?: string | null
          cancel_at_period_end?: boolean | null
          canceled_at?: string | null
          created?: string
          current_period_end?: string
          current_period_start?: string
          ended_at?: string | null
          id: string
          metadata?: Json | null
          price_id?: string | null
          quantity?: number | null
          status?: Database["public"]["Enums"]["subscription_status"] | null
          trial_end?: string | null
          trial_start?: string | null
          user_id: string
        }
        Update: {
          cancel_at?: string | null
          cancel_at_period_end?: boolean | null
          canceled_at?: string | null
          created?: string
          current_period_end?: string
          current_period_start?: string
          ended_at?: string | null
          id?: string
          metadata?: Json | null
          price_id?: string | null
          quantity?: number | null
          status?: Database["public"]["Enums"]["subscription_status"] | null
          trial_end?: string | null
          trial_start?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_price_id_fkey"
            columns: ["price_id"]
            isOneToOne: false
            referencedRelation: "prices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscriptions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      blog_posts: {
        Row: {
          id: string
          title: string
          slug: string
          excerpt: string | null
          content: string
          category: string | null
          tags: string[] | null
          author: string | null
          is_published: boolean
          is_featured: boolean
          seo_title: string | null
          seo_description: string | null
          featured_image_url: string | null
          published_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          slug: string
          excerpt?: string | null
          content: string
          category?: string | null
          tags?: string[] | null
          author?: string | null
          is_published?: boolean
          is_featured?: boolean
          seo_title?: string | null
          seo_description?: string | null
          featured_image_url?: string | null
          published_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          slug?: string
          excerpt?: string | null
          content?: string
          category?: string | null
          tags?: string[] | null
          author?: string | null
          is_published?: boolean
          is_featured?: boolean
          seo_title?: string | null
          seo_description?: string | null
          featured_image_url?: string | null
          published_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      users: {
        Row: {
          avatar_url: string | null
          billing_address: Json | null
          full_name: string | null
          id: string
          payment_method: Json | null
        }
        Insert: {
          avatar_url?: string | null
          billing_address?: Json | null
          full_name?: string | null
          id: string
          payment_method?: Json | null
        }
        Update: {
          avatar_url?: string | null
          billing_address?: Json | null
          full_name?: string | null
          id?: string
          payment_method?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "users_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      api_keys: {
        Row: {
          id: string
          user_id: string | null
          twilio_sid: string | null
          twilio_auth_token: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          twilio_sid?: string | null
          twilio_auth_token?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          twilio_sid?: string | null
          twilio_auth_token?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "api_keys_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      messages: {
        Row: {
          id: string
          user_id: string | null
          contact_id: string | null
          content: string
          direction: string
          status: string | null
          twilio_message_sid: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          contact_id?: string | null
          content: string
          direction: string
          status?: string | null
          twilio_message_sid?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          contact_id?: string | null
          content?: string
          direction?: string
          status?: string | null
          twilio_message_sid?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          }
        ]
      }
      user_settings: {
        Row: {
          id: string
          user_id: string | null
          sms_assistant_enabled: boolean | null
          sms_assistant_prompt: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          sms_assistant_enabled?: boolean | null
          sms_assistant_prompt?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          sms_assistant_enabled?: boolean | null
          sms_assistant_prompt?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_settings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      pricing_plan_interval: "day" | "week" | "month" | "year"
      pricing_type: "one_time" | "recurring"
      subscription_status:
        | "trialing"
        | "active"
        | "canceled"
        | "incomplete"
        | "incomplete_expired"
        | "past_due"
        | "unpaid"
        | "paused"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (Database["public"]["Tables"] & Database["public"]["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (Database["public"]["Tables"] &
      Database["public"]["Views"])
  ? (Database["public"]["Tables"] &
      Database["public"]["Views"])[PublicTableNameOrOptions] extends {
      Row: infer R
    }
    ? R
    : never
  : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof Database["public"]["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof Database["public"]["Tables"]
  ? Database["public"]["Tables"][PublicTableNameOrOptions] extends {
      Insert: infer I
    }
    ? I
    : never
  : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof Database["public"]["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof Database["public"]["Tables"]
  ? Database["public"]["Tables"][PublicTableNameOrOptions] extends {
      Update: infer U
    }
    ? U
    : never
  : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof Database["public"]["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof Database["public"]["Enums"]
  ? Database["public"]["Enums"][PublicEnumNameOrOptions]
  : never

