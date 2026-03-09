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
      aadhaar_verifications: {
        Row: {
          aadhaar_number: string
          address_on_aadhaar: string
          back_image_path: string
          created_at: string
          dob_on_aadhaar: string
          front_image_path: string
          id: string
          is_cleared: boolean
          name_on_aadhaar: string
          profile_id: string
          rejection_reason: string | null
          status: Database["public"]["Enums"]["aadhaar_verification_status"]
          updated_at: string
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          aadhaar_number: string
          address_on_aadhaar: string
          back_image_path: string
          created_at?: string
          dob_on_aadhaar: string
          front_image_path: string
          id?: string
          is_cleared?: boolean
          name_on_aadhaar: string
          profile_id: string
          rejection_reason?: string | null
          status?: Database["public"]["Enums"]["aadhaar_verification_status"]
          updated_at?: string
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          aadhaar_number?: string
          address_on_aadhaar?: string
          back_image_path?: string
          created_at?: string
          dob_on_aadhaar?: string
          front_image_path?: string
          id?: string
          is_cleared?: boolean
          name_on_aadhaar?: string
          profile_id?: string
          rejection_reason?: string | null
          status?: Database["public"]["Enums"]["aadhaar_verification_status"]
          updated_at?: string
          verified_at?: string | null
          verified_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "aadhaar_verifications_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "aadhaar_verifications_verified_by_fkey"
            columns: ["verified_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      admin_audit_logs: {
        Row: {
          action: string
          admin_id: string
          created_at: string
          details: Json | null
          id: string
          target_profile_id: string | null
          target_profile_name: string | null
        }
        Insert: {
          action: string
          admin_id: string
          created_at?: string
          details?: Json | null
          id?: string
          target_profile_id?: string | null
          target_profile_name?: string | null
        }
        Update: {
          action?: string
          admin_id?: string
          created_at?: string
          details?: Json | null
          id?: string
          target_profile_id?: string | null
          target_profile_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "admin_audit_logs_admin_id_fkey"
            columns: ["admin_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "admin_audit_logs_target_profile_id_fkey"
            columns: ["target_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      admin_totp_secrets: {
        Row: {
          created_at: string
          encrypted_secret: string
          id: string
          is_enabled: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          encrypted_secret: string
          id?: string
          is_enabled?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          encrypted_secret?: string
          id?: string
          is_enabled?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      announcement_dismissals: {
        Row: {
          announcement_id: string
          dismissed_at: string
          id: string
          user_id: string
        }
        Insert: {
          announcement_id: string
          dismissed_at?: string
          id?: string
          user_id: string
        }
        Update: {
          announcement_id?: string
          dismissed_at?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "announcement_dismissals_announcement_id_fkey"
            columns: ["announcement_id"]
            isOneToOne: false
            referencedRelation: "announcements"
            referencedColumns: ["id"]
          },
        ]
      }
      announcements: {
        Row: {
          created_at: string
          created_by: string | null
          expires_at: string | null
          id: string
          is_active: boolean
          message: string
          scheduled_at: string | null
          target_audience: string
          target_user_ids: string[] | null
          title: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean
          message: string
          scheduled_at?: string | null
          target_audience: string
          target_user_ids?: string[] | null
          title: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean
          message?: string
          scheduled_at?: string | null
          target_audience?: string
          target_user_ids?: string[] | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "announcements_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      app_settings: {
        Row: {
          key: string
          updated_at: string
          updated_by: string | null
          value: string
        }
        Insert: {
          key: string
          updated_at?: string
          updated_by?: string | null
          value: string
        }
        Update: {
          key?: string
          updated_at?: string
          updated_by?: string | null
          value?: string
        }
        Relationships: [
          {
            foreignKeyName: "app_settings_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      attendance: {
        Row: {
          check_in_at: string
          check_in_photo_path: string | null
          check_out_at: string | null
          check_out_photo_path: string | null
          created_at: string
          date: string
          id: string
          profile_id: string
          status: string
        }
        Insert: {
          check_in_at?: string
          check_in_photo_path?: string | null
          check_out_at?: string | null
          check_out_photo_path?: string | null
          created_at?: string
          date?: string
          id?: string
          profile_id: string
          status?: string
        }
        Update: {
          check_in_at?: string
          check_in_photo_path?: string | null
          check_out_at?: string | null
          check_out_photo_path?: string | null
          created_at?: string
          date?: string
          id?: string
          profile_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "attendance_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      bank_verifications: {
        Row: {
          attempt_count: number
          created_at: string
          document_name: string | null
          document_path: string | null
          id: string
          is_cleared: boolean
          profile_id: string
          rejection_reason: string | null
          status: Database["public"]["Enums"]["bank_verification_status"]
          updated_at: string
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          attempt_count?: number
          created_at?: string
          document_name?: string | null
          document_path?: string | null
          id?: string
          is_cleared?: boolean
          profile_id: string
          rejection_reason?: string | null
          status?: Database["public"]["Enums"]["bank_verification_status"]
          updated_at?: string
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          attempt_count?: number
          created_at?: string
          document_name?: string | null
          document_path?: string | null
          id?: string
          is_cleared?: boolean
          profile_id?: string
          rejection_reason?: string | null
          status?: Database["public"]["Enums"]["bank_verification_status"]
          updated_at?: string
          verified_at?: string | null
          verified_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bank_verifications_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bank_verifications_verified_by_fkey"
            columns: ["verified_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      banks: {
        Row: {
          created_at: string
          display_order: number
          id: string
          is_active: boolean
          logo_path: string | null
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          display_order?: number
          id?: string
          is_active?: boolean
          logo_path?: string | null
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          display_order?: number
          id?: string
          is_active?: boolean
          logo_path?: string | null
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      blocked_ips: {
        Row: {
          blocked_at: string
          blocked_by: string | null
          id: string
          ip_address: string
          reason: string | null
        }
        Insert: {
          blocked_at?: string
          blocked_by?: string | null
          id?: string
          ip_address: string
          reason?: string | null
        }
        Update: {
          blocked_at?: string
          blocked_by?: string | null
          id?: string
          ip_address?: string
          reason?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "blocked_ips_blocked_by_fkey"
            columns: ["blocked_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_rooms: {
        Row: {
          created_at: string
          id: string
          project_id: string
          recovery_request_id: string | null
          type: string
        }
        Insert: {
          created_at?: string
          id?: string
          project_id: string
          recovery_request_id?: string | null
          type?: string
        }
        Update: {
          created_at?: string
          id?: string
          project_id?: string
          recovery_request_id?: string | null
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_rooms_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_rooms_recovery_request_id_fkey"
            columns: ["recovery_request_id"]
            isOneToOne: false
            referencedRelation: "recovery_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      coin_reward_claims: {
        Row: {
          created_at: string
          id: string
          profile_id: string
          reference_id: string | null
          reward_type: string
        }
        Insert: {
          created_at?: string
          id?: string
          profile_id: string
          reference_id?: string | null
          reward_type: string
        }
        Update: {
          created_at?: string
          id?: string
          profile_id?: string
          reference_id?: string | null
          reward_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "coin_reward_claims_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      coin_transactions: {
        Row: {
          amount: number
          created_at: string
          description: string
          id: string
          profile_id: string
          type: string
        }
        Insert: {
          amount: number
          created_at?: string
          description: string
          id?: string
          profile_id: string
          type: string
        }
        Update: {
          amount?: number
          created_at?: string
          description?: string
          id?: string
          profile_id?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "coin_transactions_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      countdowns: {
        Row: {
          created_at: string
          display_order: number
          duration_minutes: number
          id: string
          is_active: boolean
          is_cleared: boolean
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          display_order?: number
          duration_minutes?: number
          id?: string
          is_active?: boolean
          is_cleared?: boolean
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          display_order?: number
          duration_minutes?: number
          id?: string
          is_active?: boolean
          is_cleared?: boolean
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      custom_quick_replies: {
        Row: {
          category: string
          created_at: string
          created_by: string
          id: string
          is_active: boolean
          shortcut: string | null
          template_text: string
          updated_at: string
        }
        Insert: {
          category: string
          created_at?: string
          created_by: string
          id?: string
          is_active?: boolean
          shortcut?: string | null
          template_text: string
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          created_by?: string
          id?: string
          is_active?: boolean
          shortcut?: string | null
          template_text?: string
          updated_at?: string
        }
        Relationships: []
      }
      documents: {
        Row: {
          document_type: string
          file_name: string
          file_path: string
          id: string
          profile_id: string
          uploaded_at: string
        }
        Insert: {
          document_type: string
          file_name: string
          file_path: string
          id?: string
          profile_id: string
          uploaded_at?: string
        }
        Update: {
          document_type?: string
          file_name?: string
          file_path?: string
          id?: string
          profile_id?: string
          uploaded_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "documents_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      employee_emergency_contacts: {
        Row: {
          contact_name: string
          contact_phone: string
          created_at: string
          id: string
          profile_id: string
          relationship: string
        }
        Insert: {
          contact_name: string
          contact_phone: string
          created_at?: string
          id?: string
          profile_id: string
          relationship: string
        }
        Update: {
          contact_name?: string
          contact_phone?: string
          created_at?: string
          id?: string
          profile_id?: string
          relationship?: string
        }
        Relationships: [
          {
            foreignKeyName: "employee_emergency_contacts_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      employee_payment_apps: {
        Row: {
          created_at: string
          id: string
          is_primary: boolean
          payment_method_id: string
          phone_number: string | null
          profile_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_primary?: boolean
          payment_method_id: string
          phone_number?: string | null
          profile_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_primary?: boolean
          payment_method_id?: string
          phone_number?: string | null
          profile_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "employee_payment_apps_payment_method_id_fkey"
            columns: ["payment_method_id"]
            isOneToOne: false
            referencedRelation: "payment_methods"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employee_payment_apps_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      employee_services: {
        Row: {
          category_id: string
          created_at: string
          hourly_rate: number
          id: string
          minimum_budget: number
          profile_id: string
          service_title: string
        }
        Insert: {
          category_id: string
          created_at?: string
          hourly_rate?: number
          id?: string
          minimum_budget?: number
          profile_id: string
          service_title: string
        }
        Update: {
          category_id?: string
          created_at?: string
          hourly_rate?: number
          id?: string
          minimum_budget?: number
          profile_id?: string
          service_title?: string
        }
        Relationships: [
          {
            foreignKeyName: "employee_services_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "service_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employee_services_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      employee_skill_selections: {
        Row: {
          employee_service_id: string
          id: string
          skill_id: string
        }
        Insert: {
          employee_service_id: string
          id?: string
          skill_id: string
        }
        Update: {
          employee_service_id?: string
          id?: string
          skill_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "employee_skill_selections_employee_service_id_fkey"
            columns: ["employee_service_id"]
            isOneToOne: false
            referencedRelation: "employee_services"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employee_skill_selections_skill_id_fkey"
            columns: ["skill_id"]
            isOneToOne: false
            referencedRelation: "service_skills"
            referencedColumns: ["id"]
          },
        ]
      }
      faqs: {
        Row: {
          answer: string
          created_at: string
          display_order: number
          id: string
          is_active: boolean
          question: string
          updated_at: string
        }
        Insert: {
          answer: string
          created_at?: string
          display_order?: number
          id?: string
          is_active?: boolean
          question: string
          updated_at?: string
        }
        Update: {
          answer?: string
          created_at?: string
          display_order?: number
          id?: string
          is_active?: boolean
          question?: string
          updated_at?: string
        }
        Relationships: []
      }
      hero_slides: {
        Row: {
          created_at: string
          display_order: number
          id: string
          image_path: string | null
          is_active: boolean
          subtitle: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          display_order?: number
          id?: string
          image_path?: string | null
          is_active?: boolean
          subtitle?: string
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          display_order?: number
          id?: string
          image_path?: string | null
          is_active?: boolean
          subtitle?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      legal_documents: {
        Row: {
          content: string
          id: string
          slug: string
          title: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          content?: string
          id?: string
          slug: string
          title: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          content?: string
          id?: string
          slug?: string
          title?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "legal_documents_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      message_reactions: {
        Row: {
          created_at: string
          emoji: string
          id: string
          message_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          emoji: string
          id?: string
          message_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          emoji?: string
          id?: string
          message_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "message_reactions_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "message_reactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          chat_room_id: string
          content: string
          created_at: string
          edited_at: string | null
          file_name: string | null
          file_path: string | null
          id: string
          is_deleted: boolean
          is_read: boolean
          parent_message_id: string | null
          sender_id: string
        }
        Insert: {
          chat_room_id: string
          content: string
          created_at?: string
          edited_at?: string | null
          file_name?: string | null
          file_path?: string | null
          id?: string
          is_deleted?: boolean
          is_read?: boolean
          parent_message_id?: string | null
          sender_id: string
        }
        Update: {
          chat_room_id?: string
          content?: string
          created_at?: string
          edited_at?: string | null
          file_name?: string | null
          file_path?: string | null
          id?: string
          is_deleted?: boolean
          is_read?: boolean
          parent_message_id?: string | null
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_chat_room_id_fkey"
            columns: ["chat_room_id"]
            isOneToOne: false
            referencedRelation: "chat_rooms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_parent_message_id_fkey"
            columns: ["parent_message_id"]
            isOneToOne: false
            referencedRelation: "messages"
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
      notifications: {
        Row: {
          created_at: string
          id: string
          is_cleared: boolean
          is_read: boolean
          message: string
          reference_id: string | null
          reference_type: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_cleared?: boolean
          is_read?: boolean
          message: string
          reference_id?: string | null
          reference_type?: string | null
          title: string
          type?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_cleared?: boolean
          is_read?: boolean
          message?: string
          reference_id?: string | null
          reference_type?: string | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      payment_confirmations: {
        Row: {
          amount: number
          client_payment_info: string | null
          created_at: string
          details_shared_at: string | null
          employee_id: string
          id: string
          method_selected_at: string | null
          otp: string | null
          otp_submitted_at: string | null
          payment_method: string | null
          phone_number: string | null
          project_id: string
          qr_code_name: string | null
          qr_code_path: string | null
          receipt_name: string | null
          receipt_path: string | null
          status: string
          updated_at: string
          utr_number: string | null
        }
        Insert: {
          amount?: number
          client_payment_info?: string | null
          created_at?: string
          details_shared_at?: string | null
          employee_id: string
          id?: string
          method_selected_at?: string | null
          otp?: string | null
          otp_submitted_at?: string | null
          payment_method?: string | null
          phone_number?: string | null
          project_id: string
          qr_code_name?: string | null
          qr_code_path?: string | null
          receipt_name?: string | null
          receipt_path?: string | null
          status?: string
          updated_at?: string
          utr_number?: string | null
        }
        Update: {
          amount?: number
          client_payment_info?: string | null
          created_at?: string
          details_shared_at?: string | null
          employee_id?: string
          id?: string
          method_selected_at?: string | null
          otp?: string | null
          otp_submitted_at?: string | null
          payment_method?: string | null
          phone_number?: string | null
          project_id?: string
          qr_code_name?: string | null
          qr_code_path?: string | null
          receipt_name?: string | null
          receipt_path?: string | null
          status?: string
          updated_at?: string
          utr_number?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payment_confirmations_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_confirmations_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_methods: {
        Row: {
          created_at: string
          display_order: number
          id: string
          is_active: boolean
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          display_order?: number
          id?: string
          is_active?: boolean
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          display_order?: number
          id?: string
          is_active?: boolean
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          approval_notes: string | null
          approval_status: Database["public"]["Enums"]["approval_status"]
          approved_at: string | null
          available_balance: number
          bank_account_number: string | null
          bank_holder_name: string | null
          bank_ifsc_code: string | null
          bank_name: string | null
          coin_balance: number
          created_at: string
          date_of_birth: string | null
          disabled_reason: string | null
          edit_request_reason: string | null
          edit_request_status: Database["public"]["Enums"]["edit_request_status"]
          edit_requested_at: string | null
          edit_reviewed_at: string | null
          edit_reviewed_by: string | null
          education_background: string | null
          education_level: string | null
          email: string
          emergency_contact_name: string | null
          emergency_contact_phone: string | null
          emergency_contact_relationship: string | null
          full_name: string[]
          gender: Database["public"]["Enums"]["gender_type"] | null
          hold_balance: number
          id: string
          is_disabled: boolean
          last_seen_at: string | null
          marital_status:
            | Database["public"]["Enums"]["marital_status_type"]
            | null
          mobile_number: string | null
          payment_sharing_enabled: boolean
          previous_job_details: string | null
          profile_photo_path: string | null
          referral_code: string
          referred_by: string | null
          registration_city: string | null
          registration_country: string | null
          registration_ip: string | null
          registration_latitude: number | null
          registration_longitude: number | null
          registration_region: string | null
          updated_at: string
          upi_id: string | null
          user_code: string[]
          user_id: string
          user_type: Database["public"]["Enums"]["user_type"]
          wallet_active: boolean
          wallet_number: string | null
          whatsapp_number: string | null
          withdrawal_password_hash: string | null
          work_experience: string | null
        }
        Insert: {
          approval_notes?: string | null
          approval_status?: Database["public"]["Enums"]["approval_status"]
          approved_at?: string | null
          available_balance?: number
          bank_account_number?: string | null
          bank_holder_name?: string | null
          bank_ifsc_code?: string | null
          bank_name?: string | null
          coin_balance?: number
          created_at?: string
          date_of_birth?: string | null
          disabled_reason?: string | null
          edit_request_reason?: string | null
          edit_request_status?: Database["public"]["Enums"]["edit_request_status"]
          edit_requested_at?: string | null
          edit_reviewed_at?: string | null
          edit_reviewed_by?: string | null
          education_background?: string | null
          education_level?: string | null
          email: string
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          emergency_contact_relationship?: string | null
          full_name: string[]
          gender?: Database["public"]["Enums"]["gender_type"] | null
          hold_balance?: number
          id?: string
          is_disabled?: boolean
          last_seen_at?: string | null
          marital_status?:
            | Database["public"]["Enums"]["marital_status_type"]
            | null
          mobile_number?: string | null
          payment_sharing_enabled?: boolean
          previous_job_details?: string | null
          profile_photo_path?: string | null
          referral_code: string
          referred_by?: string | null
          registration_city?: string | null
          registration_country?: string | null
          registration_ip?: string | null
          registration_latitude?: number | null
          registration_longitude?: number | null
          registration_region?: string | null
          updated_at?: string
          upi_id?: string | null
          user_code: string[]
          user_id: string
          user_type: Database["public"]["Enums"]["user_type"]
          wallet_active?: boolean
          wallet_number?: string | null
          whatsapp_number?: string | null
          withdrawal_password_hash?: string | null
          work_experience?: string | null
        }
        Update: {
          approval_notes?: string | null
          approval_status?: Database["public"]["Enums"]["approval_status"]
          approved_at?: string | null
          available_balance?: number
          bank_account_number?: string | null
          bank_holder_name?: string | null
          bank_ifsc_code?: string | null
          bank_name?: string | null
          coin_balance?: number
          created_at?: string
          date_of_birth?: string | null
          disabled_reason?: string | null
          edit_request_reason?: string | null
          edit_request_status?: Database["public"]["Enums"]["edit_request_status"]
          edit_requested_at?: string | null
          edit_reviewed_at?: string | null
          edit_reviewed_by?: string | null
          education_background?: string | null
          education_level?: string | null
          email?: string
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          emergency_contact_relationship?: string | null
          full_name?: string[]
          gender?: Database["public"]["Enums"]["gender_type"] | null
          hold_balance?: number
          id?: string
          is_disabled?: boolean
          last_seen_at?: string | null
          marital_status?:
            | Database["public"]["Enums"]["marital_status_type"]
            | null
          mobile_number?: string | null
          payment_sharing_enabled?: boolean
          previous_job_details?: string | null
          profile_photo_path?: string | null
          referral_code?: string
          referred_by?: string | null
          registration_city?: string | null
          registration_country?: string | null
          registration_ip?: string | null
          registration_latitude?: number | null
          registration_longitude?: number | null
          registration_region?: string | null
          updated_at?: string
          upi_id?: string | null
          user_code?: string[]
          user_id?: string
          user_type?: Database["public"]["Enums"]["user_type"]
          wallet_active?: boolean
          wallet_number?: string | null
          whatsapp_number?: string | null
          withdrawal_password_hash?: string | null
          work_experience?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_edit_reviewed_by_fkey"
            columns: ["edit_reviewed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      project_applications: {
        Row: {
          applied_at: string
          employee_id: string
          id: string
          project_id: string
          reviewed_at: string | null
          status: Database["public"]["Enums"]["application_status"]
        }
        Insert: {
          applied_at?: string
          employee_id: string
          id?: string
          project_id: string
          reviewed_at?: string | null
          status?: Database["public"]["Enums"]["application_status"]
        }
        Update: {
          applied_at?: string
          employee_id?: string
          id?: string
          project_id?: string
          reviewed_at?: string | null
          status?: Database["public"]["Enums"]["application_status"]
        }
        Relationships: [
          {
            foreignKeyName: "project_applications_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_applications_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_documents: {
        Row: {
          file_name: string
          file_path: string
          file_size: number | null
          id: string
          project_id: string
          uploaded_at: string
          uploaded_by: string
        }
        Insert: {
          file_name: string
          file_path: string
          file_size?: number | null
          id?: string
          project_id: string
          uploaded_at?: string
          uploaded_by: string
        }
        Update: {
          file_name?: string
          file_path?: string
          file_size?: number | null
          id?: string
          project_id?: string
          uploaded_at?: string
          uploaded_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_documents_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_documents_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      project_submissions: {
        Row: {
          employee_id: string
          file_name: string | null
          file_path: string | null
          id: string
          notes: string | null
          project_id: string
          submitted_at: string
        }
        Insert: {
          employee_id: string
          file_name?: string | null
          file_path?: string | null
          id?: string
          notes?: string | null
          project_id: string
          submitted_at?: string
        }
        Update: {
          employee_id?: string
          file_name?: string | null
          file_path?: string | null
          id?: string
          notes?: string | null
          project_id?: string
          submitted_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_submissions_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_submissions_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          admin_approved: boolean
          amount: number
          assigned_employee_id: string | null
          category_id: string | null
          client_id: string
          created_at: string
          description: string | null
          end_date: string | null
          id: string
          is_cleared: boolean
          name: string
          order_id: string | null
          order_number: number
          remarks: string | null
          requirements: string
          responsibility: string | null
          scheduled_publish_at: string | null
          start_date: string | null
          status: Database["public"]["Enums"]["project_status"]
          summary: string | null
          updated_at: string
          validation_fees: number
        }
        Insert: {
          admin_approved?: boolean
          amount?: number
          assigned_employee_id?: string | null
          category_id?: string | null
          client_id: string
          created_at?: string
          description?: string | null
          end_date?: string | null
          id?: string
          is_cleared?: boolean
          name: string
          order_id?: string | null
          order_number?: number
          remarks?: string | null
          requirements: string
          responsibility?: string | null
          scheduled_publish_at?: string | null
          start_date?: string | null
          status?: Database["public"]["Enums"]["project_status"]
          summary?: string | null
          updated_at?: string
          validation_fees?: number
        }
        Update: {
          admin_approved?: boolean
          amount?: number
          assigned_employee_id?: string | null
          category_id?: string | null
          client_id?: string
          created_at?: string
          description?: string | null
          end_date?: string | null
          id?: string
          is_cleared?: boolean
          name?: string
          order_id?: string | null
          order_number?: number
          remarks?: string | null
          requirements?: string
          responsibility?: string | null
          scheduled_publish_at?: string | null
          start_date?: string | null
          status?: Database["public"]["Enums"]["project_status"]
          summary?: string | null
          updated_at?: string
          validation_fees?: number
        }
        Relationships: [
          {
            foreignKeyName: "projects_assigned_employee_id_fkey"
            columns: ["assigned_employee_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "service_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      quick_reply_analytics: {
        Row: {
          category: string
          conversation_id: string | null
          created_at: string
          id: string
          template_text: string
          used_by: string
        }
        Insert: {
          category: string
          conversation_id?: string | null
          created_at?: string
          id?: string
          template_text: string
          used_by: string
        }
        Update: {
          category?: string
          conversation_id?: string | null
          created_at?: string
          id?: string
          template_text?: string
          used_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "quick_reply_analytics_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "support_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      recovery_requests: {
        Row: {
          admin_notes: string | null
          created_at: string
          employee_id: string
          held_amount: number
          id: string
          is_cleared: boolean
          project_id: string
          resolved_at: string | null
          resolved_by: string | null
          status: string
        }
        Insert: {
          admin_notes?: string | null
          created_at?: string
          employee_id: string
          held_amount?: number
          id?: string
          is_cleared?: boolean
          project_id: string
          resolved_at?: string | null
          resolved_by?: string | null
          status?: string
        }
        Update: {
          admin_notes?: string | null
          created_at?: string
          employee_id?: string
          held_amount?: number
          id?: string
          is_cleared?: boolean
          project_id?: string
          resolved_at?: string | null
          resolved_by?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "recovery_requests_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recovery_requests_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recovery_requests_resolved_by_fkey"
            columns: ["resolved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      referrals: {
        Row: {
          created_at: string
          id: string
          job_bonus_paid: boolean
          referred_id: string
          referrer_id: string
          signup_bonus_paid: boolean
        }
        Insert: {
          created_at?: string
          id?: string
          job_bonus_paid?: boolean
          referred_id: string
          referrer_id: string
          signup_bonus_paid?: boolean
        }
        Update: {
          created_at?: string
          id?: string
          job_bonus_paid?: boolean
          referred_id?: string
          referrer_id?: string
          signup_bonus_paid?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "referrals_referred_id_fkey"
            columns: ["referred_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referrals_referrer_id_fkey"
            columns: ["referrer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      registration_metadata: {
        Row: {
          city: string | null
          country: string | null
          created_at: string
          id: string
          ip_address: string | null
          latitude: number | null
          longitude: number | null
          profile_id: string
          region: string | null
        }
        Insert: {
          city?: string | null
          country?: string | null
          created_at?: string
          id?: string
          ip_address?: string | null
          latitude?: number | null
          longitude?: number | null
          profile_id: string
          region?: string | null
        }
        Update: {
          city?: string | null
          country?: string | null
          created_at?: string
          id?: string
          ip_address?: string | null
          latitude?: number | null
          longitude?: number | null
          profile_id?: string
          region?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "registration_metadata_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      reviews: {
        Row: {
          comment: string | null
          created_at: string
          id: string
          project_id: string
          rating: number
          reviewee_id: string
          reviewer_id: string
          updated_at: string
        }
        Insert: {
          comment?: string | null
          created_at?: string
          id?: string
          project_id: string
          rating: number
          reviewee_id: string
          reviewer_id: string
          updated_at?: string
        }
        Update: {
          comment?: string | null
          created_at?: string
          id?: string
          project_id?: string
          rating?: number
          reviewee_id?: string
          reviewer_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "reviews_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_reviewee_id_fkey"
            columns: ["reviewee_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_reviewer_id_fkey"
            columns: ["reviewer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      service_categories: {
        Row: {
          created_at: string
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      service_skills: {
        Row: {
          category_id: string
          created_at: string
          id: string
          name: string
        }
        Insert: {
          category_id: string
          created_at?: string
          id?: string
          name: string
        }
        Update: {
          category_id?: string
          created_at?: string
          id?: string
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "service_skills_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "service_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      site_visitors: {
        Row: {
          city: string | null
          country: string | null
          device_type: string | null
          id: string
          ip_address: string | null
          page_path: string | null
          profile_id: string | null
          referrer: string | null
          user_agent: string | null
          visited_at: string
        }
        Insert: {
          city?: string | null
          country?: string | null
          device_type?: string | null
          id?: string
          ip_address?: string | null
          page_path?: string | null
          profile_id?: string | null
          referrer?: string | null
          user_agent?: string | null
          visited_at?: string
        }
        Update: {
          city?: string | null
          country?: string | null
          device_type?: string | null
          id?: string
          ip_address?: string | null
          page_path?: string | null
          profile_id?: string | null
          referrer?: string | null
          user_agent?: string | null
          visited_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "site_visitors_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      support_conversations: {
        Row: {
          created_at: string
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "support_conversations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      support_message_reactions: {
        Row: {
          created_at: string
          emoji: string
          id: string
          message_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          emoji: string
          id?: string
          message_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          emoji?: string
          id?: string
          message_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "support_message_reactions_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "support_messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "support_message_reactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      support_messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          file_name: string | null
          file_path: string | null
          id: string
          is_read: boolean
          sender_id: string
        }
        Insert: {
          content?: string
          conversation_id: string
          created_at?: string
          file_name?: string | null
          file_path?: string | null
          id?: string
          is_read?: boolean
          sender_id: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          file_name?: string | null
          file_path?: string | null
          id?: string
          is_read?: boolean
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "support_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "support_conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "support_messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      testimonials: {
        Row: {
          created_at: string
          display_order: number
          id: string
          is_active: boolean
          name: string
          photo_path: string | null
          quote: string
          rating: number
          role: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          display_order?: number
          id?: string
          is_active?: boolean
          name: string
          photo_path?: string | null
          quote: string
          rating?: number
          role: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          display_order?: number
          id?: string
          is_active?: boolean
          name?: string
          photo_path?: string | null
          quote?: string
          rating?: number
          role?: string
          updated_at?: string
        }
        Relationships: []
      }
      transactions: {
        Row: {
          amount: number
          created_at: string
          description: string
          id: string
          is_cleared: boolean
          profile_id: string
          reference_id: string | null
          type: Database["public"]["Enums"]["transaction_type"]
        }
        Insert: {
          amount: number
          created_at?: string
          description: string
          id?: string
          is_cleared?: boolean
          profile_id: string
          reference_id?: string | null
          type: Database["public"]["Enums"]["transaction_type"]
        }
        Update: {
          amount?: number
          created_at?: string
          description?: string
          id?: string
          is_cleared?: boolean
          profile_id?: string
          reference_id?: string | null
          type?: Database["public"]["Enums"]["transaction_type"]
        }
        Relationships: [
          {
            foreignKeyName: "transactions_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      trusted_companies: {
        Row: {
          created_at: string
          display_order: number
          id: string
          is_active: boolean
          logo_path: string | null
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          display_order?: number
          id?: string
          is_active?: boolean
          logo_path?: string | null
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          display_order?: number
          id?: string
          is_active?: boolean
          logo_path?: string | null
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      user_totp_secrets: {
        Row: {
          created_at: string
          encrypted_secret: string
          id: string
          is_enabled: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          encrypted_secret: string
          id?: string
          is_enabled?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          encrypted_secret?: string
          id?: string
          is_enabled?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      withdrawals: {
        Row: {
          amount: number
          bank_account_number: string | null
          bank_holder_name: string | null
          bank_ifsc_code: string | null
          employee_id: string
          id: string
          is_cleared: boolean
          method: string
          requested_at: string
          review_notes: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: Database["public"]["Enums"]["withdrawal_status"]
          upi_id: string | null
        }
        Insert: {
          amount: number
          bank_account_number?: string | null
          bank_holder_name?: string | null
          bank_ifsc_code?: string | null
          employee_id: string
          id?: string
          is_cleared?: boolean
          method?: string
          requested_at?: string
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["withdrawal_status"]
          upi_id?: string | null
        }
        Update: {
          amount?: number
          bank_account_number?: string | null
          bank_holder_name?: string | null
          bank_ifsc_code?: string | null
          employee_id?: string
          id?: string
          is_cleared?: boolean
          method?: string
          requested_at?: string
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["withdrawal_status"]
          upi_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "withdrawals_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "withdrawals_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      work_experiences: {
        Row: {
          certificate_name: string | null
          certificate_path: string | null
          company_name: string
          company_type: string
          created_at: string
          end_year: number | null
          id: string
          is_current: boolean
          profile_id: string
          start_year: number
          work_description: string | null
        }
        Insert: {
          certificate_name?: string | null
          certificate_path?: string | null
          company_name: string
          company_type?: string
          created_at?: string
          end_year?: number | null
          id?: string
          is_current?: boolean
          profile_id: string
          start_year: number
          work_description?: string | null
        }
        Update: {
          certificate_name?: string | null
          certificate_path?: string | null
          company_name?: string
          company_type?: string
          created_at?: string
          end_year?: number | null
          id?: string
          is_current?: boolean
          profile_id?: string
          start_year?: number
          work_description?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "work_experiences_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      algorithm_sign: {
        Args: { algorithm: string; secret: string; signables: string }
        Returns: string
      }
      check_registration_duplicates: {
        Args: {
          p_email: string
          p_full_name: string
          p_mobile: string
          p_whatsapp: string
        }
        Returns: Json
      }
      get_referral_history: {
        Args: never
        Returns: {
          created_at: string
          job_bonus_paid: boolean
          referral_id: string
          referred_name: string
          referred_user_type: string
          signup_bonus_paid: boolean
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      sign: {
        Args: { algorithm?: string; payload: Json; secret: string }
        Returns: string
      }
      try_cast_double: { Args: { inp: string }; Returns: number }
      url_decode: { Args: { data: string }; Returns: string }
      url_encode: { Args: { data: string }; Returns: string }
      verify: {
        Args: { algorithm?: string; secret: string; token: string }
        Returns: {
          header: Json
          payload: Json
          valid: boolean
        }[]
      }
    }
    Enums: {
      aadhaar_verification_status:
        | "not_submitted"
        | "pending"
        | "under_process"
        | "verified"
        | "rejected"
      app_role: "admin" | "user"
      application_status: "pending" | "approved" | "rejected"
      approval_status: "pending" | "approved" | "rejected"
      bank_verification_status:
        | "pending"
        | "under_process"
        | "verified"
        | "rejected"
      edit_request_status:
        | "none"
        | "requested"
        | "approved"
        | "rejected"
        | "used"
      gender_type: "male" | "female" | "other"
      marital_status_type: "single" | "married" | "divorced" | "widowed"
      project_status:
        | "draft"
        | "open"
        | "in_progress"
        | "job_confirmed"
        | "payment_processing"
        | "validation"
        | "completed"
        | "cancelled"
      transaction_type: "credit" | "debit" | "hold" | "release"
      user_type: "employee" | "client"
      withdrawal_status: "pending" | "approved" | "rejected" | "completed"
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
      aadhaar_verification_status: [
        "not_submitted",
        "pending",
        "under_process",
        "verified",
        "rejected",
      ],
      app_role: ["admin", "user"],
      application_status: ["pending", "approved", "rejected"],
      approval_status: ["pending", "approved", "rejected"],
      bank_verification_status: [
        "pending",
        "under_process",
        "verified",
        "rejected",
      ],
      edit_request_status: [
        "none",
        "requested",
        "approved",
        "rejected",
        "used",
      ],
      gender_type: ["male", "female", "other"],
      marital_status_type: ["single", "married", "divorced", "widowed"],
      project_status: [
        "draft",
        "open",
        "in_progress",
        "job_confirmed",
        "payment_processing",
        "validation",
        "completed",
        "cancelled",
      ],
      transaction_type: ["credit", "debit", "hold", "release"],
      user_type: ["employee", "client"],
      withdrawal_status: ["pending", "approved", "rejected", "completed"],
    },
  },
} as const
