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
      appointments: {
        Row: {
          business_id: string
          confirmation_code: string | null
          contact_id: string | null
          conversation_id: string | null
          created_at: string | null
          duration_minutes: number | null
          id: string
          notes: string | null
          reminder_response: string | null
          reminder_response_at: string | null
          reminder_sent_at: string | null
          scheduled_at: string
          service_type: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          business_id: string
          confirmation_code?: string | null
          contact_id?: string | null
          conversation_id?: string | null
          created_at?: string | null
          duration_minutes?: number | null
          id?: string
          notes?: string | null
          reminder_response?: string | null
          reminder_response_at?: string | null
          reminder_sent_at?: string | null
          scheduled_at: string
          service_type?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          business_id?: string
          confirmation_code?: string | null
          contact_id?: string | null
          conversation_id?: string | null
          created_at?: string | null
          duration_minutes?: number | null
          id?: string
          notes?: string | null
          reminder_response?: string | null
          reminder_response_at?: string | null
          reminder_sent_at?: string | null
          scheduled_at?: string
          service_type?: string | null
          status?: string | null
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
            foreignKeyName: "appointments_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      assessments: {
        Row: {
          business_name: string
          created_at: string
          employees: number
          goals: string
          id: string
          industry: string
          pain_points: string[]
          revenue_range: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          business_name: string
          created_at?: string
          employees: number
          goals: string
          id?: string
          industry: string
          pain_points: string[]
          revenue_range: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          business_name?: string
          created_at?: string
          employees?: number
          goals?: string
          id?: string
          industry?: string
          pain_points?: string[]
          revenue_range?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      business_staff: {
        Row: {
          business_id: string
          created_at: string
          id: string
          role: Database["public"]["Enums"]["business_role"]
          user_id: string
        }
        Insert: {
          business_id: string
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["business_role"]
          user_id: string
        }
        Update: {
          business_id?: string
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["business_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "business_staff_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      businesses: {
        Row: {
          ai_instructions: string | null
          ai_language: string | null
          ai_personality: Json | null
          business_hours: Json | null
          created_at: string | null
          custom_tools: string[] | null
          forward_to_phones: string[]
          greeting_messages: Json | null
          id: string
          industry_type: string | null
          knowledge_base: Json | null
          name: string
          notification_email_from: string | null
          owner_email: string | null
          owner_notification_channels: string[] | null
          owner_phone: string | null
          owner_user_id: string | null
          quiet_hours_end: string | null
          quiet_hours_start: string | null
          services: string[] | null
          subscription_plan: string | null
          subscription_status: string | null
          timezone: string | null
          twilio_phone_number: string | null
          twilio_phone_number_sid: string | null
          twilio_settings: Json | null
          updated_at: string | null
        }
        Insert: {
          ai_instructions?: string | null
          ai_language?: string | null
          ai_personality?: Json | null
          business_hours?: Json | null
          created_at?: string | null
          custom_tools?: string[] | null
          forward_to_phones?: string[]
          greeting_messages?: Json | null
          id?: string
          industry_type?: string | null
          knowledge_base?: Json | null
          name: string
          notification_email_from?: string | null
          owner_email?: string | null
          owner_notification_channels?: string[] | null
          owner_phone?: string | null
          owner_user_id?: string | null
          quiet_hours_end?: string | null
          quiet_hours_start?: string | null
          services?: string[] | null
          subscription_plan?: string | null
          subscription_status?: string | null
          timezone?: string | null
          twilio_phone_number?: string | null
          twilio_phone_number_sid?: string | null
          twilio_settings?: Json | null
          updated_at?: string | null
        }
        Update: {
          ai_instructions?: string | null
          ai_language?: string | null
          ai_personality?: Json | null
          business_hours?: Json | null
          created_at?: string | null
          custom_tools?: string[] | null
          forward_to_phones?: string[]
          greeting_messages?: Json | null
          id?: string
          industry_type?: string | null
          knowledge_base?: Json | null
          name?: string
          notification_email_from?: string | null
          owner_email?: string | null
          owner_notification_channels?: string[] | null
          owner_phone?: string | null
          owner_user_id?: string | null
          quiet_hours_end?: string | null
          quiet_hours_start?: string | null
          services?: string[] | null
          subscription_plan?: string | null
          subscription_status?: string | null
          timezone?: string | null
          twilio_phone_number?: string | null
          twilio_phone_number_sid?: string | null
          twilio_settings?: Json | null
          updated_at?: string | null
        }
        Relationships: []
      }
      calls: {
        Row: {
          business_id: string
          call_status: string
          call_summary: Json | null
          caller_phone: string
          contact_id: string | null
          created_at: string | null
          duration_seconds: number | null
          id: string
          manual_notes: string | null
          textback_sent: boolean | null
          textback_sent_at: string | null
          twilio_call_sid: string | null
          was_answered: boolean | null
        }
        Insert: {
          business_id: string
          call_status: string
          call_summary?: Json | null
          caller_phone: string
          contact_id?: string | null
          created_at?: string | null
          duration_seconds?: number | null
          id?: string
          manual_notes?: string | null
          textback_sent?: boolean | null
          textback_sent_at?: string | null
          twilio_call_sid?: string | null
          was_answered?: boolean | null
        }
        Update: {
          business_id?: string
          call_status?: string
          call_summary?: Json | null
          caller_phone?: string
          contact_id?: string | null
          created_at?: string | null
          duration_seconds?: number | null
          id?: string
          manual_notes?: string | null
          textback_sent?: boolean | null
          textback_sent_at?: string | null
          twilio_call_sid?: string | null
          was_answered?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "calls_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "calls_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
        ]
      }
      contact_submissions: {
        Row: {
          amount_lost: string | null
          company: string | null
          created_at: string
          date_occurred: string | null
          email: string
          first_name: string
          fraud_type: string | null
          id: string
          interested_in_class_action: boolean | null
          is_urgent: boolean | null
          last_name: string
          message: string
          phone: string | null
          previously_contacted: boolean | null
          uploaded_files: Json | null
          urgency_description: string | null
        }
        Insert: {
          amount_lost?: string | null
          company?: string | null
          created_at?: string
          date_occurred?: string | null
          email: string
          first_name: string
          fraud_type?: string | null
          id?: string
          interested_in_class_action?: boolean | null
          is_urgent?: boolean | null
          last_name: string
          message: string
          phone?: string | null
          previously_contacted?: boolean | null
          uploaded_files?: Json | null
          urgency_description?: string | null
        }
        Update: {
          amount_lost?: string | null
          company?: string | null
          created_at?: string
          date_occurred?: string | null
          email?: string
          first_name?: string
          fraud_type?: string | null
          id?: string
          interested_in_class_action?: boolean | null
          is_urgent?: boolean | null
          last_name?: string
          message?: string
          phone?: string | null
          previously_contacted?: boolean | null
          uploaded_files?: Json | null
          urgency_description?: string | null
        }
        Relationships: []
      }
      contacts: {
        Row: {
          business_id: string
          created_at: string | null
          email: string | null
          id: string
          name: string | null
          notes: string | null
          opted_out: boolean | null
          opted_out_at: string | null
          phone_number: string
          tags: string[] | null
          updated_at: string | null
        }
        Insert: {
          business_id: string
          created_at?: string | null
          email?: string | null
          id?: string
          name?: string | null
          notes?: string | null
          opted_out?: boolean | null
          opted_out_at?: string | null
          phone_number: string
          tags?: string[] | null
          updated_at?: string | null
        }
        Update: {
          business_id?: string
          created_at?: string | null
          email?: string | null
          id?: string
          name?: string | null
          notes?: string | null
          opted_out?: boolean | null
          opted_out_at?: string | null
          phone_number?: string
          tags?: string[] | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contacts_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      conversations: {
        Row: {
          business_id: string
          call_id: string | null
          contact_id: string
          created_at: string | null
          id: string
          status: string | null
          updated_at: string | null
        }
        Insert: {
          business_id: string
          call_id?: string | null
          contact_id: string
          created_at?: string | null
          id?: string
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          business_id?: string
          call_id?: string | null
          contact_id?: string
          created_at?: string | null
          id?: string
          status?: string | null
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
            foreignKeyName: "conversations_call_id_fkey"
            columns: ["call_id"]
            isOneToOne: false
            referencedRelation: "calls"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversations_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
        ]
      }
      inquiries: {
        Row: {
          business_id: string
          contact_id: string | null
          conversation_id: string | null
          created_at: string | null
          id: string
          owner_notified: boolean | null
          owner_notified_at: string | null
          priority: string | null
          status: string | null
          summary: string
          updated_at: string | null
        }
        Insert: {
          business_id: string
          contact_id?: string | null
          conversation_id?: string | null
          created_at?: string | null
          id?: string
          owner_notified?: boolean | null
          owner_notified_at?: string | null
          priority?: string | null
          status?: string | null
          summary: string
          updated_at?: string | null
        }
        Update: {
          business_id?: string
          contact_id?: string | null
          conversation_id?: string | null
          created_at?: string | null
          id?: string
          owner_notified?: boolean | null
          owner_notified_at?: string | null
          priority?: string | null
          status?: string | null
          summary?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "inquiries_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inquiries_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inquiries_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      message_templates: {
        Row: {
          business_id: string
          category: string | null
          content: string
          created_at: string | null
          id: string
          is_active: boolean | null
          name: string
          updated_at: string | null
          variables: string[] | null
        }
        Insert: {
          business_id: string
          category?: string | null
          content: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          updated_at?: string | null
          variables?: string[] | null
        }
        Update: {
          business_id?: string
          category?: string | null
          content?: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          updated_at?: string | null
          variables?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "message_templates_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          ai_generated: boolean | null
          content: string
          conversation_id: string
          created_at: string | null
          direction: string
          id: string
          twilio_message_sid: string | null
        }
        Insert: {
          ai_generated?: boolean | null
          content: string
          conversation_id: string
          created_at?: string | null
          direction: string
          id?: string
          twilio_message_sid?: string | null
        }
        Update: {
          ai_generated?: boolean | null
          content?: string
          conversation_id?: string
          created_at?: string | null
          direction?: string
          id?: string
          twilio_message_sid?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      owner_notifications: {
        Row: {
          business_id: string
          channel: string
          content: string
          created_at: string | null
          delivered: boolean | null
          id: string
          notification_type: string
          related_appointment_id: string | null
          related_call_id: string | null
          related_inquiry_id: string | null
        }
        Insert: {
          business_id: string
          channel: string
          content: string
          created_at?: string | null
          delivered?: boolean | null
          id?: string
          notification_type: string
          related_appointment_id?: string | null
          related_call_id?: string | null
          related_inquiry_id?: string | null
        }
        Update: {
          business_id?: string
          channel?: string
          content?: string
          created_at?: string | null
          delivered?: boolean | null
          id?: string
          notification_type?: string
          related_appointment_id?: string | null
          related_call_id?: string | null
          related_inquiry_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "owner_notifications_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "owner_notifications_related_appointment_id_fkey"
            columns: ["related_appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "owner_notifications_related_call_id_fkey"
            columns: ["related_call_id"]
            isOneToOne: false
            referencedRelation: "calls"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "owner_notifications_related_inquiry_id_fkey"
            columns: ["related_inquiry_id"]
            isOneToOne: false
            referencedRelation: "inquiries"
            referencedColumns: ["id"]
          },
        ]
      }
      port_requests: {
        Row: {
          account_number: string | null
          account_pin: string | null
          actual_port_date: string | null
          authorized_rep_email: string | null
          authorized_representative: string | null
          business_id: string
          city: string | null
          country: string | null
          created_at: string | null
          customer_name: string | null
          document_sids: string[] | null
          id: string
          notification_emails: string[] | null
          phone_number: string
          port_in_request_sid: string | null
          rejection_reason: string | null
          state: string | null
          status: string | null
          street: string | null
          target_port_date: string | null
          updated_at: string | null
          uploaded_documents: Json | null
          zip: string | null
        }
        Insert: {
          account_number?: string | null
          account_pin?: string | null
          actual_port_date?: string | null
          authorized_rep_email?: string | null
          authorized_representative?: string | null
          business_id: string
          city?: string | null
          country?: string | null
          created_at?: string | null
          customer_name?: string | null
          document_sids?: string[] | null
          id?: string
          notification_emails?: string[] | null
          phone_number: string
          port_in_request_sid?: string | null
          rejection_reason?: string | null
          state?: string | null
          status?: string | null
          street?: string | null
          target_port_date?: string | null
          updated_at?: string | null
          uploaded_documents?: Json | null
          zip?: string | null
        }
        Update: {
          account_number?: string | null
          account_pin?: string | null
          actual_port_date?: string | null
          authorized_rep_email?: string | null
          authorized_representative?: string | null
          business_id?: string
          city?: string | null
          country?: string | null
          created_at?: string | null
          customer_name?: string | null
          document_sids?: string[] | null
          id?: string
          notification_emails?: string[] | null
          phone_number?: string
          port_in_request_sid?: string | null
          rejection_reason?: string | null
          state?: string | null
          status?: string | null
          street?: string | null
          target_port_date?: string | null
          updated_at?: string | null
          uploaded_documents?: Json | null
          zip?: string | null
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
      assign_admin_role: {
        Args: { target_user_id: string }
        Returns: undefined
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin: { Args: { user_id?: string }; Returns: boolean }
      is_business_owner: {
        Args: { _business_id: string; _user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
      business_role: "manager" | "staff"
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
      app_role: ["admin", "moderator", "user"],
      business_role: ["manager", "staff"],
    },
  },
} as const
