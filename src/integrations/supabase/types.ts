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
          has_milestones: boolean | null
          hunter_purchases_item: boolean | null
          id: string
          images: string[] | null
          location: string | null
          milestone_data: Json | null
          poster_id: string | null
          requires_shipping: boolean | null
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
          updated_at: string
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
          has_milestones?: boolean | null
          hunter_purchases_item?: boolean | null
          id?: string
          images?: string[] | null
          location?: string | null
          milestone_data?: Json | null
          poster_id?: string | null
          requires_shipping?: boolean | null
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
          updated_at?: string
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
          has_milestones?: boolean | null
          hunter_purchases_item?: boolean | null
          id?: string
          images?: string[] | null
          location?: string | null
          milestone_data?: Json | null
          poster_id?: string | null
          requires_shipping?: boolean | null
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
          updated_at?: string
          verification_requirements?: string[] | null
          view_count?: number | null
        }
        Relationships: []
      }
      bounty_comments: {
        Row: {
          bounty_id: string
          content: string
          created_at: string
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          bounty_id: string
          content: string
          created_at?: string
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          bounty_id?: string
          content?: string
          created_at?: string
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bounty_comments_bounty_id_fkey"
            columns: ["bounty_id"]
            isOneToOne: false
            referencedRelation: "Bounties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bounty_comments_bounty_id_fkey"
            columns: ["bounty_id"]
            isOneToOne: false
            referencedRelation: "bounties_secure"
            referencedColumns: ["id"]
          },
        ]
      }
      bounty_milestones: {
        Row: {
          amount: number
          bounty_id: string
          completed_at: string | null
          created_at: string | null
          description: string | null
          id: string
          order_index: number
          status: string
          submission_id: string | null
          title: string
        }
        Insert: {
          amount: number
          bounty_id: string
          completed_at?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          order_index: number
          status?: string
          submission_id?: string | null
          title: string
        }
        Update: {
          amount?: number
          bounty_id?: string
          completed_at?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          order_index?: number
          status?: string
          submission_id?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "bounty_milestones_bounty_id_fkey"
            columns: ["bounty_id"]
            isOneToOne: false
            referencedRelation: "Bounties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bounty_milestones_bounty_id_fkey"
            columns: ["bounty_id"]
            isOneToOne: false
            referencedRelation: "bounties_secure"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bounty_milestones_submission_id_fkey"
            columns: ["submission_id"]
            isOneToOne: false
            referencedRelation: "Submissions"
            referencedColumns: ["id"]
          },
        ]
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
          cancellation_fee_amount: number | null
          cancelled_at: string | null
          capture_error: string | null
          capture_lock_id: string | null
          capture_locked_at: string | null
          capture_status: string | null
          captured_at: string | null
          card_saved_at: string | null
          charge_attempted_at: string | null
          charge_failed_reason: string | null
          created_at: string
          currency: string
          eligible_at: string | null
          hunter_country: string | null
          hunter_payout_email: string | null
          id: string
          manual_payout_reference: string | null
          manual_payout_sent_at: string | null
          manual_payout_status: string | null
          payout_freeze: boolean | null
          payout_freeze_reason: string | null
          payout_hold_overridden: boolean | null
          payout_hold_overridden_at: string | null
          payout_hold_overridden_by: string | null
          payout_method: string | null
          payout_sent_amount: number | null
          payout_sent_by_admin_user_id: string | null
          platform_fee_amount: number | null
          poster_id: string
          refund_amount: number | null
          refund_reference: string | null
          refunded_at: string | null
          status: string
          stripe_fee_amount: number | null
          stripe_payment_intent_id: string
          stripe_payment_method_id: string | null
          stripe_setup_intent_id: string | null
          total_charge_amount: number | null
          total_charged_amount: number | null
          updated_at: string
        }
        Insert: {
          amount: number
          bounty_id?: string | null
          cancellation_fee_amount?: number | null
          cancelled_at?: string | null
          capture_error?: string | null
          capture_lock_id?: string | null
          capture_locked_at?: string | null
          capture_status?: string | null
          captured_at?: string | null
          card_saved_at?: string | null
          charge_attempted_at?: string | null
          charge_failed_reason?: string | null
          created_at?: string
          currency?: string
          eligible_at?: string | null
          hunter_country?: string | null
          hunter_payout_email?: string | null
          id?: string
          manual_payout_reference?: string | null
          manual_payout_sent_at?: string | null
          manual_payout_status?: string | null
          payout_freeze?: boolean | null
          payout_freeze_reason?: string | null
          payout_hold_overridden?: boolean | null
          payout_hold_overridden_at?: string | null
          payout_hold_overridden_by?: string | null
          payout_method?: string | null
          payout_sent_amount?: number | null
          payout_sent_by_admin_user_id?: string | null
          platform_fee_amount?: number | null
          poster_id: string
          refund_amount?: number | null
          refund_reference?: string | null
          refunded_at?: string | null
          status?: string
          stripe_fee_amount?: number | null
          stripe_payment_intent_id: string
          stripe_payment_method_id?: string | null
          stripe_setup_intent_id?: string | null
          total_charge_amount?: number | null
          total_charged_amount?: number | null
          updated_at?: string
        }
        Update: {
          amount?: number
          bounty_id?: string | null
          cancellation_fee_amount?: number | null
          cancelled_at?: string | null
          capture_error?: string | null
          capture_lock_id?: string | null
          capture_locked_at?: string | null
          capture_status?: string | null
          captured_at?: string | null
          card_saved_at?: string | null
          charge_attempted_at?: string | null
          charge_failed_reason?: string | null
          created_at?: string
          currency?: string
          eligible_at?: string | null
          hunter_country?: string | null
          hunter_payout_email?: string | null
          id?: string
          manual_payout_reference?: string | null
          manual_payout_sent_at?: string | null
          manual_payout_status?: string | null
          payout_freeze?: boolean | null
          payout_freeze_reason?: string | null
          payout_hold_overridden?: boolean | null
          payout_hold_overridden_at?: string | null
          payout_hold_overridden_by?: string | null
          payout_method?: string | null
          payout_sent_amount?: number | null
          payout_sent_by_admin_user_id?: string | null
          platform_fee_amount?: number | null
          poster_id?: string
          refund_amount?: number | null
          refund_reference?: string | null
          refunded_at?: string | null
          status?: string
          stripe_fee_amount?: number | null
          stripe_payment_intent_id?: string
          stripe_payment_method_id?: string | null
          stripe_setup_intent_id?: string | null
          total_charge_amount?: number | null
          total_charged_amount?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "escrow_transactions_bounty_id_fkey"
            columns: ["bounty_id"]
            isOneToOne: true
            referencedRelation: "Bounties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "escrow_transactions_bounty_id_fkey"
            columns: ["bounty_id"]
            isOneToOne: true
            referencedRelation: "bounties_secure"
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
            foreignKeyName: "messages_bounty_id_fkey"
            columns: ["bounty_id"]
            isOneToOne: false
            referencedRelation: "bounties_secure"
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
            foreignKeyName: "messages_recipient_id_fkey"
            columns: ["recipient_id"]
            isOneToOne: false
            referencedRelation: "profiles_secure"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles_secure"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          bounty_id: string | null
          created_at: string | null
          id: string
          is_read: boolean | null
          message: string
          submission_id: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          bounty_id?: string | null
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          message: string
          submission_id?: string | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          bounty_id?: string | null
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          message?: string
          submission_id?: string | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_bounty"
            columns: ["bounty_id"]
            isOneToOne: false
            referencedRelation: "Bounties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_bounty"
            columns: ["bounty_id"]
            isOneToOne: false
            referencedRelation: "bounties_secure"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_submission"
            columns: ["submission_id"]
            isOneToOne: false
            referencedRelation: "Submissions"
            referencedColumns: ["id"]
          },
        ]
      }
      partner_applications: {
        Row: {
          admin_notes: string | null
          audience_size: string | null
          business_name: string | null
          created_at: string
          email: string
          id: string
          message: string
          name: string
          reviewed_at: string | null
          reviewed_by: string | null
          social_media_handles: string | null
          status: string
          website_url: string | null
        }
        Insert: {
          admin_notes?: string | null
          audience_size?: string | null
          business_name?: string | null
          created_at?: string
          email: string
          id?: string
          message: string
          name: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          social_media_handles?: string | null
          status?: string
          website_url?: string | null
        }
        Update: {
          admin_notes?: string | null
          audience_size?: string | null
          business_name?: string | null
          created_at?: string
          email?: string
          id?: string
          message?: string
          name?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          social_media_handles?: string | null
          status?: string
          website_url?: string | null
        }
        Relationships: []
      }
      partner_payouts: {
        Row: {
          amount: number
          bounties_count: number | null
          confirmed_at: string | null
          created_at: string
          created_by: string | null
          id: string
          notes: string | null
          partner_id: string
          payment_method: string
          payment_reference: string | null
          payout_email: string | null
          period_end: string | null
          period_start: string | null
          processed_at: string | null
          sent_at: string | null
          status: string
        }
        Insert: {
          amount: number
          bounties_count?: number | null
          confirmed_at?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          notes?: string | null
          partner_id: string
          payment_method?: string
          payment_reference?: string | null
          payout_email?: string | null
          period_end?: string | null
          period_start?: string | null
          processed_at?: string | null
          sent_at?: string | null
          status?: string
        }
        Update: {
          amount?: number
          bounties_count?: number | null
          confirmed_at?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          notes?: string | null
          partner_id?: string
          payment_method?: string
          payment_reference?: string | null
          payout_email?: string | null
          period_end?: string | null
          period_start?: string | null
          processed_at?: string | null
          sent_at?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "partner_payouts_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "partner_payouts_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles_secure"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "partner_payouts_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "partner_payouts_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "profiles_secure"
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
          is_partner: boolean | null
          is_support_admin: boolean
          is_suspended: boolean | null
          kyc_verified: boolean | null
          kyc_verified_at: string | null
          partner_attribution_expires_at: string | null
          partner_commission_percent: number | null
          partner_flat_fee_cents: number | null
          partner_name: string | null
          payout_country: string | null
          payout_email: string | null
          referral_code: string | null
          referral_credits: number | null
          referred_by: string | null
          region: string | null
          reputation_score: number | null
          stripe_connect_account_id: string | null
          stripe_connect_charges_enabled: boolean | null
          stripe_connect_details_submitted: boolean | null
          stripe_connect_onboarding_complete: boolean | null
          stripe_connect_payouts_enabled: boolean | null
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
          is_partner?: boolean | null
          is_support_admin?: boolean
          is_suspended?: boolean | null
          kyc_verified?: boolean | null
          kyc_verified_at?: string | null
          partner_attribution_expires_at?: string | null
          partner_commission_percent?: number | null
          partner_flat_fee_cents?: number | null
          partner_name?: string | null
          payout_country?: string | null
          payout_email?: string | null
          referral_code?: string | null
          referral_credits?: number | null
          referred_by?: string | null
          region?: string | null
          reputation_score?: number | null
          stripe_connect_account_id?: string | null
          stripe_connect_charges_enabled?: boolean | null
          stripe_connect_details_submitted?: boolean | null
          stripe_connect_onboarding_complete?: boolean | null
          stripe_connect_payouts_enabled?: boolean | null
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
          is_partner?: boolean | null
          is_support_admin?: boolean
          is_suspended?: boolean | null
          kyc_verified?: boolean | null
          kyc_verified_at?: string | null
          partner_attribution_expires_at?: string | null
          partner_commission_percent?: number | null
          partner_flat_fee_cents?: number | null
          partner_name?: string | null
          payout_country?: string | null
          payout_email?: string | null
          referral_code?: string | null
          referral_credits?: number | null
          referred_by?: string | null
          region?: string | null
          reputation_score?: number | null
          stripe_connect_account_id?: string | null
          stripe_connect_charges_enabled?: boolean | null
          stripe_connect_details_submitted?: boolean | null
          stripe_connect_onboarding_complete?: boolean | null
          stripe_connect_payouts_enabled?: boolean | null
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
      referrals: {
        Row: {
          converted_at: string | null
          created_at: string
          first_bounty_completed_at: string | null
          id: string
          referral_code: string
          referred_id: string | null
          referrer_id: string
          reward_amount: number | null
          reward_credited: boolean | null
          reward_credited_at: string | null
          status: string
        }
        Insert: {
          converted_at?: string | null
          created_at?: string
          first_bounty_completed_at?: string | null
          id?: string
          referral_code: string
          referred_id?: string | null
          referrer_id: string
          reward_amount?: number | null
          reward_credited?: boolean | null
          reward_credited_at?: string | null
          status?: string
        }
        Update: {
          converted_at?: string | null
          created_at?: string
          first_bounty_completed_at?: string | null
          id?: string
          referral_code?: string
          referred_id?: string | null
          referrer_id?: string
          reward_amount?: number | null
          reward_credited?: boolean | null
          reward_credited_at?: string | null
          status?: string
        }
        Relationships: []
      }
      saved_bounties: {
        Row: {
          bounty_id: string
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          bounty_id: string
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          bounty_id?: string
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "saved_bounties_bounty_id_fkey"
            columns: ["bounty_id"]
            isOneToOne: false
            referencedRelation: "Bounties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "saved_bounties_bounty_id_fkey"
            columns: ["bounty_id"]
            isOneToOne: false
            referencedRelation: "bounties_secure"
            referencedColumns: ["id"]
          },
        ]
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
          accepted_at: string | null
          bounty_id: string
          created_at: string | null
          delivered_at: string | null
          dispute_opened: boolean | null
          dispute_opened_at: string | null
          dispute_reason: string | null
          hunter_id: string
          id: string
          image_url: string | null
          message: string | null
          proof_urls: string[] | null
          rejection_reason: string | null
          reported_as_spam: boolean | null
          requires_approval: boolean | null
          revision_notes: string | null
          revision_requested: boolean | null
          shipped_at: string | null
          status: string | null
          tracking_number: string | null
          updated_at: string
        }
        Insert: {
          accepted_at?: string | null
          bounty_id: string
          created_at?: string | null
          delivered_at?: string | null
          dispute_opened?: boolean | null
          dispute_opened_at?: string | null
          dispute_reason?: string | null
          hunter_id: string
          id?: string
          image_url?: string | null
          message?: string | null
          proof_urls?: string[] | null
          rejection_reason?: string | null
          reported_as_spam?: boolean | null
          requires_approval?: boolean | null
          revision_notes?: string | null
          revision_requested?: boolean | null
          shipped_at?: string | null
          status?: string | null
          tracking_number?: string | null
          updated_at?: string
        }
        Update: {
          accepted_at?: string | null
          bounty_id?: string
          created_at?: string | null
          delivered_at?: string | null
          dispute_opened?: boolean | null
          dispute_opened_at?: string | null
          dispute_reason?: string | null
          hunter_id?: string
          id?: string
          image_url?: string | null
          message?: string | null
          proof_urls?: string[] | null
          rejection_reason?: string | null
          reported_as_spam?: boolean | null
          requires_approval?: boolean | null
          revision_notes?: string | null
          revision_requested?: boolean | null
          shipped_at?: string | null
          status?: string | null
          tracking_number?: string | null
          updated_at?: string
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
            foreignKeyName: "fk_submissions_bounty"
            columns: ["bounty_id"]
            isOneToOne: false
            referencedRelation: "bounties_secure"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "Submissions_bounty_id_fkey"
            columns: ["bounty_id"]
            isOneToOne: false
            referencedRelation: "Bounties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "Submissions_bounty_id_fkey"
            columns: ["bounty_id"]
            isOneToOne: false
            referencedRelation: "bounties_secure"
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
            foreignKeyName: "support_tickets_bounty_id_fkey"
            columns: ["bounty_id"]
            isOneToOne: false
            referencedRelation: "bounties_secure"
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
      bounties_secure: {
        Row: {
          amount: number | null
          category: string | null
          created_at: string | null
          deadline: string | null
          description: string | null
          escrow_amount: number | null
          escrow_status: string | null
          has_milestones: boolean | null
          hunter_purchases_item: boolean | null
          id: string | null
          images: string[] | null
          location: string | null
          milestone_data: Json | null
          poster_id: string | null
          requires_shipping: boolean | null
          shipping_details: Json | null
          shipping_status:
            | Database["public"]["Enums"]["shipping_status_type"]
            | null
          status: string | null
          subcategory: string | null
          tags: string[] | null
          target_price_max: number | null
          target_price_min: number | null
          title: string | null
          updated_at: string | null
          verification_requirements: string[] | null
          view_count: number | null
        }
        Insert: {
          amount?: number | null
          category?: string | null
          created_at?: string | null
          deadline?: string | null
          description?: string | null
          escrow_amount?: number | null
          escrow_status?: string | null
          has_milestones?: boolean | null
          hunter_purchases_item?: boolean | null
          id?: string | null
          images?: string[] | null
          location?: string | null
          milestone_data?: Json | null
          poster_id?: string | null
          requires_shipping?: boolean | null
          shipping_details?: never
          shipping_status?:
            | Database["public"]["Enums"]["shipping_status_type"]
            | null
          status?: string | null
          subcategory?: string | null
          tags?: string[] | null
          target_price_max?: number | null
          target_price_min?: number | null
          title?: string | null
          updated_at?: string | null
          verification_requirements?: string[] | null
          view_count?: number | null
        }
        Update: {
          amount?: number | null
          category?: string | null
          created_at?: string | null
          deadline?: string | null
          description?: string | null
          escrow_amount?: number | null
          escrow_status?: string | null
          has_milestones?: boolean | null
          hunter_purchases_item?: boolean | null
          id?: string | null
          images?: string[] | null
          location?: string | null
          milestone_data?: Json | null
          poster_id?: string | null
          requires_shipping?: boolean | null
          shipping_details?: never
          shipping_status?:
            | Database["public"]["Enums"]["shipping_status_type"]
            | null
          status?: string | null
          subcategory?: string | null
          tags?: string[] | null
          target_price_max?: number | null
          target_price_min?: number | null
          title?: string | null
          updated_at?: string | null
          verification_requirements?: string[] | null
          view_count?: number | null
        }
        Relationships: []
      }
      profiles_secure: {
        Row: {
          avatar_url: string | null
          average_rating: number | null
          bio: string | null
          created_at: string | null
          full_name: string | null
          id: string | null
          is_support_admin: boolean | null
          is_suspended: boolean | null
          kyc_verified: boolean | null
          kyc_verified_at: string | null
          payout_country: string | null
          payout_email: string | null
          region: string | null
          reputation_score: number | null
          stripe_connect_account_id: string | null
          stripe_connect_charges_enabled: boolean | null
          stripe_connect_details_submitted: boolean | null
          stripe_connect_onboarding_complete: boolean | null
          stripe_connect_payouts_enabled: boolean | null
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
          id?: string | null
          is_support_admin?: boolean | null
          is_suspended?: boolean | null
          kyc_verified?: boolean | null
          kyc_verified_at?: string | null
          payout_country?: never
          payout_email?: never
          region?: string | null
          reputation_score?: number | null
          stripe_connect_account_id?: never
          stripe_connect_charges_enabled?: never
          stripe_connect_details_submitted?: never
          stripe_connect_onboarding_complete?: never
          stripe_connect_payouts_enabled?: never
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
          id?: string | null
          is_support_admin?: boolean | null
          is_suspended?: boolean | null
          kyc_verified?: boolean | null
          kyc_verified_at?: string | null
          payout_country?: never
          payout_email?: never
          region?: string | null
          reputation_score?: number | null
          stripe_connect_account_id?: never
          stripe_connect_charges_enabled?: never
          stripe_connect_details_submitted?: never
          stripe_connect_onboarding_complete?: never
          stripe_connect_payouts_enabled?: never
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
    }
    Functions: {
      acquire_capture_lock: {
        Args: {
          p_escrow_id: string
          p_lock_id: string
          p_lock_timeout_minutes?: number
        }
        Returns: {
          escrow_id: string
          lock_id: string
          message: string
          payment_intent_id: string
          success: boolean
        }[]
      }
      admin_send_message: {
        Args: {
          attachment_urls_param?: string[]
          message_param: string
          ticket_id_param: string
        }
        Returns: string
      }
      admin_set_partner_status: {
        Args: {
          p_is_partner: boolean
          p_partner_attribution_expires_at?: string
          p_partner_commission_percent?: number
          p_partner_flat_fee_cents?: number
          p_partner_name?: string
          target_user_id: string
        }
        Returns: undefined
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
      calculate_cancellation_fee: {
        Args: { bounty_id_param: string; cancellation_time?: string }
        Returns: number
      }
      can_user_claim_bounty: {
        Args: { bounty_id: string; user_id: string }
        Returns: boolean
      }
      can_view_shipping_details: {
        Args: { p_bounty_id: string }
        Returns: boolean
      }
      generate_referral_code: { Args: never; Returns: string }
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
      get_completed_bounties_showcase: {
        Args: { limit_count?: number }
        Returns: {
          amount: number
          category: string
          completed_at: string
          hunter_name: string
          id: string
          images: string[]
          poster_name: string
          title: string
        }[]
      }
      get_partner_pending_earnings: {
        Args: { p_partner_id: string }
        Returns: {
          bounties_count: number
          last_payout_at: string
          paid_earnings: number
          pending_earnings: number
          total_earnings: number
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
        Args: { p_bounty_id: string }
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
      user_has_submission_for_bounty: {
        Args: { p_bounty_id: string; p_user_id: string }
        Returns: boolean
      }
      user_is_bounty_poster: {
        Args: { p_bounty_id: string; p_user_id: string }
        Returns: boolean
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
