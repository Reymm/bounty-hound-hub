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
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      Bounties: {
        Row: {
          amount: number | null
          category: string | null
          created_at: string
          deadline: string | null
          description: string | null
          escrow_amount: number | null
          escrow_status: string | null
          id: string
          images: string[] | null
          location: string | null
          poster_id: string | null
          shipping_details: Json | null
          shipping_status:
            | Database["public"]["Enums"]["shipping_status_type"]
            | null
          status: string
          subcategory: string | null
          tags: string[] | null
          target_price_max: number | null
          target_price_min: number | null
          title: string
          verification_requirements: string[] | null
          view_count: number | null
        }
        Insert: {
          amount?: number | null
          category?: string | null
          created_at?: string
          deadline?: string | null
          description?: string | null
          escrow_amount?: number | null
          escrow_status?: string | null
          id?: string
          images?: string[] | null
          location?: string | null
          poster_id?: string | null
          shipping_details?: Json | null
          shipping_status?:
            | Database["public"]["Enums"]["shipping_status_type"]
            | null
          status?: string
          subcategory?: string | null
          tags?: string[] | null
          target_price_max?: number | null
          target_price_min?: number | null
          title: string
          verification_requirements?: string[] | null
          view_count?: number | null
        }
        Update: {
          amount?: number | null
          category?: string | null
          created_at?: string
          deadline?: string | null
          description?: string | null
          escrow_amount?: number | null
          escrow_status?: string | null
          id?: string
          images?: string[] | null
          location?: string | null
          poster_id?: string | null
          shipping_details?: Json | null
          shipping_status?:
            | Database["public"]["Enums"]["shipping_status_type"]
            | null
          status?: string
          subcategory?: string | null
          tags?: string[] | null
          target_price_max?: number | null
          target_price_min?: number | null
          title?: string
          verification_requirements?: string[] | null
          view_count?: number | null
        }
        Relationships: []
      }
      claim_reports: {
        Row: {
          created_at: string | null
          id: string
          reason: string
          reporter_id: string
          status: string | null
          submission_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          reason: string
          reporter_id: string
          status?: string | null
          submission_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          reason?: string
          reporter_id?: string
          status?: string | null
          submission_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "claim_reports_submission_id_fkey"
            columns: ["submission_id"]
            isOneToOne: false
            referencedRelation: "Submissions"
            referencedColumns: ["id"]
          },
        ]
      }
      escrow_transactions: {
        Row: {
          amount: number
          bounty_id: string | null
          created_at: string
          currency: string
          id: string
          platform_fee_amount: number | null
          poster_id: string
          status: string
          stripe_payment_intent_id: string
          total_charged_amount: number | null
          updated_at: string
        }
        Insert: {
          amount: number
          bounty_id?: string | null
          created_at?: string
          currency?: string
          id?: string
          platform_fee_amount?: number | null
          poster_id: string
          status?: string
          stripe_payment_intent_id: string
          total_charged_amount?: number | null
          updated_at?: string
        }
        Update: {
          amount?: number
          bounty_id?: string | null
          created_at?: string
          currency?: string
          id?: string
          platform_fee_amount?: number | null
          poster_id?: string
          status?: string
          stripe_payment_intent_id?: string
          total_charged_amount?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "escrow_transactions_bounty_id_fkey"
            columns: ["bounty_id"]
            isOneToOne: false
            referencedRelation: "Bounties"
            referencedColumns: ["id"]
          },
        ]
      }
      kyc_verifications: {
        Row: {
          created_at: string
          id: string
          status: string
          stripe_verification_session_id: string | null
          updated_at: string
          user_id: string
          verification_type: string | null
          verified_at: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          status?: string
          stripe_verification_session_id?: string | null
          updated_at?: string
          user_id: string
          verification_type?: string | null
          verified_at?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          status?: string
          stripe_verification_session_id?: string | null
          updated_at?: string
          user_id?: string
          verification_type?: string | null
          verified_at?: string | null
        }
        Relationships: []
      }
      messages: {
        Row: {
          attachment_url: string | null
          bounty_id: string | null
          content: string
          created_at: string
          id: string
          is_read: boolean
          recipient_id: string
          sender_id: string
          updated_at: string
        }
        Insert: {
          attachment_url?: string | null
          bounty_id?: string | null
          content: string
          created_at?: string
          id?: string
          is_read?: boolean
          recipient_id: string
          sender_id: string
          updated_at?: string
        }
        Update: {
          attachment_url?: string | null
          bounty_id?: string | null
          content?: string
          created_at?: string
          id?: string
          is_read?: boolean
          recipient_id?: string
          sender_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_bounty_id_fkey"
            columns: ["bounty_id"]
            isOneToOne: false
            referencedRelation: "Bounties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_recipient_id_fkey"
            columns: ["recipient_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          average_rating: number | null
          bio: string | null
          created_at: string | null
          full_name: string | null
          id: string
          is_support_admin: boolean
          is_suspended: boolean | null
          kyc_verified: boolean | null
          kyc_verified_at: string | null
          reputation_score: number | null
          suspended_until: string | null
          total_failed_claims: number | null
          total_ratings_given: number | null
          total_ratings_received: number | null
          total_successful_claims: number | null
          updated_at: string | null
          username: string | null
        }
        Insert: {
          avatar_url?: string | null
          average_rating?: number | null
          bio?: string | null
          created_at?: string | null
          full_name?: string | null
          id: string
          is_support_admin?: boolean
          is_suspended?: boolean | null
          kyc_verified?: boolean | null
          kyc_verified_at?: string | null
          reputation_score?: number | null
          suspended_until?: string | null
          total_failed_claims?: number | null
          total_ratings_given?: number | null
          total_ratings_received?: number | null
          total_successful_claims?: number | null
          updated_at?: string | null
          username?: string | null
        }
        Update: {
          avatar_url?: string | null
          average_rating?: number | null
          bio?: string | null
          created_at?: string | null
          full_name?: string | null
          id?: string
          is_support_admin?: boolean
          is_suspended?: boolean | null
          kyc_verified?: boolean | null
          kyc_verified_at?: string | null
          reputation_score?: number | null
          suspended_until?: string | null
          total_failed_claims?: number | null
          total_ratings_given?: number | null
          total_ratings_received?: number | null
          total_successful_claims?: number | null
          updated_at?: string | null
          username?: string | null
        }
        Relationships: []
      }
      security_audit_log: {
        Row: {
          action: string
          created_at: string | null
          id: string
          new_values: Json | null
          old_values: Json | null
          record_id: string | null
          table_name: string
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string | null
          id?: string
          new_values?: Json | null
          old_values?: Json | null
          record_id?: string | null
          table_name: string
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string | null
          id?: string
          new_values?: Json | null
          old_values?: Json | null
          record_id?: string | null
          table_name?: string
          user_id?: string | null
        }
        Relationships: []
      }
      Submissions: {
        Row: {
          bounty_id: string
          created_at: string | null
          hunter_id: string
          id: string
          image_url: string | null
          message: string | null
          proof_urls: string[] | null
          rejection_reason: string | null
          reported_as_spam: boolean | null
          requires_approval: boolean | null
          status: string | null
        }
        Insert: {
          bounty_id: string
          created_at?: string | null
          hunter_id: string
          id?: string
          image_url?: string | null
          message?: string | null
          proof_urls?: string[] | null
          rejection_reason?: string | null
          reported_as_spam?: boolean | null
          requires_approval?: boolean | null
          status?: string | null
        }
        Update: {
          bounty_id?: string
          created_at?: string | null
          hunter_id?: string
          id?: string
          image_url?: string | null
          message?: string | null
          proof_urls?: string[] | null
          rejection_reason?: string | null
          reported_as_spam?: boolean | null
          requires_approval?: boolean | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_submissions_bounty"
            columns: ["bounty_id"]
            isOneToOne: false
            referencedRelation: "Bounties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "Submissions_bounty_id_fkey"
            columns: ["bounty_id"]
            isOneToOne: false
            referencedRelation: "Bounties"
            referencedColumns: ["id"]
          },
        ]
      }
      support_messages: {
        Row: {
          attachment_urls: string[] | null
          created_at: string
          id: string
          is_admin_reply: boolean
          message: string
          sender_id: string
          ticket_id: string
        }
        Insert: {
          attachment_urls?: string[] | null
          created_at?: string
          id?: string
          is_admin_reply?: boolean
          message: string
          sender_id: string
          ticket_id: string
        }
        Update: {
          attachment_urls?: string[] | null
          created_at?: string
          id?: string
          is_admin_reply?: boolean
          message?: string
          sender_id?: string
          ticket_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "support_messages_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "support_tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      support_tickets: {
        Row: {
          assigned_to: string | null
          bounty_id: string | null
          created_at: string
          created_by: string
          description: string
          id: string
          internal_notes: string | null
          priority: Database["public"]["Enums"]["support_ticket_priority"]
          resolved_at: string | null
          status: Database["public"]["Enums"]["support_ticket_status"]
          submission_id: string | null
          title: string
          type: Database["public"]["Enums"]["support_ticket_type"]
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          bounty_id?: string | null
          created_at?: string
          created_by: string
          description: string
          id?: string
          internal_notes?: string | null
          priority?: Database["public"]["Enums"]["support_ticket_priority"]
          resolved_at?: string | null
          status?: Database["public"]["Enums"]["support_ticket_status"]
          submission_id?: string | null
          title: string
          type: Database["public"]["Enums"]["support_ticket_type"]
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          bounty_id?: string | null
          created_at?: string
          created_by?: string
          description?: string
          id?: string
          internal_notes?: string | null
          priority?: Database["public"]["Enums"]["support_ticket_priority"]
          resolved_at?: string | null
          status?: Database["public"]["Enums"]["support_ticket_status"]
          submission_id?: string | null
          title?: string
          type?: Database["public"]["Enums"]["support_ticket_type"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "support_tickets_bounty_id_fkey"
            columns: ["bounty_id"]
            isOneToOne: false
            referencedRelation: "Bounties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "support_tickets_submission_id_fkey"
            columns: ["submission_id"]
            isOneToOne: false
            referencedRelation: "Submissions"
            referencedColumns: ["id"]
          },
        ]
      }
      user_ratings: {
        Row: {
          bounty_id: string
          created_at: string
          id: string
          rated_user_id: string
          rater_id: string
          rating: number
          rating_type: string
          review_text: string | null
          updated_at: string
        }
        Insert: {
          bounty_id: string
          created_at?: string
          id?: string
          rated_user_id: string
          rater_id: string
          rating: number
          rating_type: string
          review_text?: string | null
          updated_at?: string
        }
        Update: {
          bounty_id?: string
          created_at?: string
          id?: string
          rated_user_id?: string
          rater_id?: string
          rating?: number
          rating_type?: string
          review_text?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      user_reports: {
        Row: {
          admin_notes: string | null
          bounty_id: string | null
          created_at: string
          description: string
          id: string
          report_type: Database["public"]["Enums"]["user_report_type"]
          reported_user_id: string
          reporter_id: string
          resolved_at: string | null
          status: string
          updated_at: string
        }
        Insert: {
          admin_notes?: string | null
          bounty_id?: string | null
          created_at?: string
          description: string
          id?: string
          report_type: Database["public"]["Enums"]["user_report_type"]
          reported_user_id: string
          reporter_id: string
          resolved_at?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          admin_notes?: string | null
          bounty_id?: string | null
          created_at?: string
          description?: string
          id?: string
          report_type?: Database["public"]["Enums"]["user_report_type"]
          reported_user_id?: string
          reporter_id?: string
          resolved_at?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      admin_send_message: {
        Args: {
          attachment_urls_param?: string[]
          message_param: string
          ticket_id_param: string
        }
        Returns: string
      }
      admin_update_user_status: {
        Args: {
          new_is_support_admin?: boolean
          new_is_suspended?: boolean
          new_suspended_until?: string
          target_user_id: string
        }
        Returns: undefined
      }
      can_user_claim_bounty: {
        Args: { bounty_id: string; user_id: string }
        Returns: boolean
      }
      can_view_shipping_details: {
        Args: { bounty_id: string }
        Returns: boolean
      }
      get_admin_ticket_details: {
        Args: { ticket_id_param: string }
        Returns: {
          assigned_to: string
          bounty_id: string
          bounty_title: string
          created_at: string
          created_by: string
          creator_email: string
          creator_username: string
          description: string
          id: string
          internal_notes: string
          priority: Database["public"]["Enums"]["support_ticket_priority"]
          resolved_at: string
          status: Database["public"]["Enums"]["support_ticket_status"]
          submission_id: string
          submission_message: string
          title: string
          type: Database["public"]["Enums"]["support_ticket_type"]
          updated_at: string
        }[]
      }
      get_admin_ticket_overview: {
        Args: never
        Returns: {
          assigned_to: string
          bounty_id: string
          bounty_title: string
          created_at: string
          created_by: string
          creator_email: string
          description: string
          id: string
          internal_notes: string
          last_message_at: string
          last_message_preview: string
          message_count: number
          priority: Database["public"]["Enums"]["support_ticket_priority"]
          resolved_at: string
          status: Database["public"]["Enums"]["support_ticket_status"]
          submission_id: string
          title: string
          type: Database["public"]["Enums"]["support_ticket_type"]
          updated_at: string
        }[]
      }
      get_admin_user_reports: {
        Args: never
        Returns: {
          admin_notes: string
          bounty_id: string
          bounty_title: string
          created_at: string
          description: string
          id: string
          report_type: Database["public"]["Enums"]["user_report_type"]
          reported_user_email: string
          reported_user_id: string
          reporter_email: string
          reporter_id: string
          resolved_at: string
          status: string
          updated_at: string
        }[]
      }
      get_public_profile_data: {
        Args: { profile_id: string }
        Returns: {
          avatar_url: string
          average_rating: number
          id: string
          reputation_score: number
          total_ratings_received: number
          total_successful_claims: number
          username: string
        }[]
      }
      get_user_conversations: {
        Args: never
        Returns: {
          bounty_id: string
          last_message: string
          last_message_at: string
          participant_1: string
          participant_2: string
          unread_count: number
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      increment_bounty_views: {
        Args: { bounty_id: string }
        Returns: undefined
      }
      increment_bounty_views_secure: {
        Args: { bounty_id: string }
        Returns: undefined
      }
      is_support_admin: { Args: { user_id?: string }; Returns: boolean }
      mark_message_as_read: { Args: { message_id: string }; Returns: boolean }
      recalculate_user_rating: {
        Args: { user_id_param: string }
        Returns: undefined
      }
      update_submission_status: {
        Args: {
          new_status: string
          rejection_reason?: string
          submission_id: string
        }
        Returns: boolean
      }
      update_user_reputation: {
        Args: { bounty_amount: number; rating: number; user_id: string }
        Returns: undefined
      }
    }
    Enums: {
      app_role: "hunter" | "poster"
      shipping_status_type:
        | "not_requested"
        | "requested"
        | "provided"
        | "not_provided"
      support_ticket_priority: "low" | "medium" | "high" | "critical"
      support_ticket_status:
        | "open"
        | "in_progress"
        | "waiting_for_user"
        | "resolved"
        | "closed"
      support_ticket_type:
        | "platform_issue"
        | "bounty_dispute"
        | "submission_dispute"
        | "payment_issue"
        | "account_issue"
        | "bug_report"
        | "feature_request"
        | "other"
      user_report_type:
        | "fraud"
        | "harassment"
        | "spam"
        | "inappropriate_behavior"
        | "non_delivery"
        | "other"
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
      app_role: ["hunter", "poster"],
      shipping_status_type: [
        "not_requested",
        "requested",
        "provided",
        "not_provided",
      ],
      support_ticket_priority: ["low", "medium", "high", "critical"],
      support_ticket_status: [
        "open",
        "in_progress",
        "waiting_for_user",
        "resolved",
        "closed",
      ],
      support_ticket_type: [
        "platform_issue",
        "bounty_dispute",
        "submission_dispute",
        "payment_issue",
        "account_issue",
        "bug_report",
        "feature_request",
        "other",
      ],
      user_report_type: [
        "fraud",
        "harassment",
        "spam",
        "inappropriate_behavior",
        "non_delivery",
        "other",
      ],
    },
  },
} as const
