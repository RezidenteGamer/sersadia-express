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
      admin_permissions: {
        Row: {
          id: string
          permission: Database["public"]["Enums"]["admin_permission"]
          user_id: string
        }
        Insert: {
          id?: string
          permission: Database["public"]["Enums"]["admin_permission"]
          user_id: string
        }
        Update: {
          id?: string
          permission?: Database["public"]["Enums"]["admin_permission"]
          user_id?: string
        }
        Relationships: []
      }
      admin_wallpaper_preferences: {
        Row: {
          id: string
          updated_at: string
          user_id: string
          wallpaper_config: Json
        }
        Insert: {
          id?: string
          updated_at?: string
          user_id: string
          wallpaper_config: Json
        }
        Update: {
          id?: string
          updated_at?: string
          user_id?: string
          wallpaper_config?: Json
        }
        Relationships: []
      }
      banners: {
        Row: {
          created_at: string
          display_order: number
          id: string
          image_url: string
          is_active: boolean
          redirect_url: string | null
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          display_order?: number
          id?: string
          image_url: string
          is_active?: boolean
          redirect_url?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          display_order?: number
          id?: string
          image_url?: string
          is_active?: boolean
          redirect_url?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      checkin_settings: {
        Row: {
          id: string
          tolerance_after_minutes: number
          tolerance_before_minutes: number
          updated_at: string
        }
        Insert: {
          id?: string
          tolerance_after_minutes?: number
          tolerance_before_minutes?: number
          updated_at?: string
        }
        Update: {
          id?: string
          tolerance_after_minutes?: number
          tolerance_before_minutes?: number
          updated_at?: string
        }
        Relationships: []
      }
      checkins: {
        Row: {
          admin_id: string
          checked_in_at: string
          id: string
          reservation_id: string
        }
        Insert: {
          admin_id: string
          checked_in_at?: string
          id?: string
          reservation_id: string
        }
        Update: {
          admin_id?: string
          checked_in_at?: string
          id?: string
          reservation_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "checkins_reservation_id_fkey"
            columns: ["reservation_id"]
            isOneToOne: true
            referencedRelation: "reservations"
            referencedColumns: ["id"]
          },
        ]
      }
      locations: {
        Row: {
          available_end_time: string
          available_start_time: string
          capacity: number
          created_at: string
          description: string | null
          display_order: number
          id: string
          images: string[] | null
          is_active: boolean
          name: string
          price_fixed: number | null
          price_fixed_member: number | null
          price_per_hour: number
          price_per_hour_member: number | null
          rules: string | null
          time_slots: Json | null
          updated_at: string
        }
        Insert: {
          available_end_time?: string
          available_start_time?: string
          capacity?: number
          created_at?: string
          description?: string | null
          display_order?: number
          id?: string
          images?: string[] | null
          is_active?: boolean
          name: string
          price_fixed?: number | null
          price_fixed_member?: number | null
          price_per_hour?: number
          price_per_hour_member?: number | null
          rules?: string | null
          time_slots?: Json | null
          updated_at?: string
        }
        Update: {
          available_end_time?: string
          available_start_time?: string
          capacity?: number
          created_at?: string
          description?: string | null
          display_order?: number
          id?: string
          images?: string[] | null
          is_active?: boolean
          name?: string
          price_fixed?: number | null
          price_fixed_member?: number | null
          price_per_hour?: number
          price_per_hour_member?: number | null
          rules?: string | null
          time_slots?: Json | null
          updated_at?: string
        }
        Relationships: []
      }
      members: {
        Row: {
          cpf: string | null
          created_at: string
          email: string | null
          id: string
          is_active: boolean
          mbrf_id: string | null
          name: string
          notes: string | null
          phone: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          cpf?: string | null
          created_at?: string
          email?: string | null
          id?: string
          is_active?: boolean
          mbrf_id?: string | null
          name: string
          notes?: string | null
          phone?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          cpf?: string | null
          created_at?: string
          email?: string | null
          id?: string
          is_active?: boolean
          mbrf_id?: string | null
          name?: string
          notes?: string | null
          phone?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "members_user_id_fkey"
            columns: ["user_id"]
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
          is_read: boolean
          message: string
          title: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_read?: boolean
          message: string
          title: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_read?: boolean
          message?: string
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      payments: {
        Row: {
          amount: number
          created_at: string
          id: string
          is_paid: boolean
          mp_payment_id: string | null
          notes: string | null
          paid_at: string | null
          payment_method: string | null
          reservation_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          is_paid?: boolean
          mp_payment_id?: string | null
          notes?: string | null
          paid_at?: string | null
          payment_method?: string | null
          reservation_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          is_paid?: boolean
          mp_payment_id?: string | null
          notes?: string | null
          paid_at?: string | null
          payment_method?: string | null
          reservation_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_reservation_id_fkey"
            columns: ["reservation_id"]
            isOneToOne: false
            referencedRelation: "reservations"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string
          full_name: string
          id: string
          mbrf_id: string | null
          phone: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email: string
          full_name: string
          id: string
          mbrf_id?: string | null
          phone?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          mbrf_id?: string | null
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      reservation_logs: {
        Row: {
          action: string
          admin_id: string | null
          created_at: string
          details: string | null
          id: string
          reservation_id: string
        }
        Insert: {
          action: string
          admin_id?: string | null
          created_at?: string
          details?: string | null
          id?: string
          reservation_id: string
        }
        Update: {
          action?: string
          admin_id?: string | null
          created_at?: string
          details?: string | null
          id?: string
          reservation_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reservation_logs_reservation_id_fkey"
            columns: ["reservation_id"]
            isOneToOne: false
            referencedRelation: "reservations"
            referencedColumns: ["id"]
          },
        ]
      }
      reservations: {
        Row: {
          admin_notes: string | null
          code: string
          created_at: string
          end_time: string
          id: string
          location_id: string
          reservation_date: string
          start_time: string
          status: Database["public"]["Enums"]["reservation_status"]
          total_price: number
          updated_at: string
          user_id: string
          user_notes: string | null
        }
        Insert: {
          admin_notes?: string | null
          code?: string
          created_at?: string
          end_time: string
          id?: string
          location_id: string
          reservation_date: string
          start_time: string
          status?: Database["public"]["Enums"]["reservation_status"]
          total_price?: number
          updated_at?: string
          user_id: string
          user_notes?: string | null
        }
        Update: {
          admin_notes?: string | null
          code?: string
          created_at?: string
          end_time?: string
          id?: string
          location_id?: string
          reservation_date?: string
          start_time?: string
          status?: Database["public"]["Enums"]["reservation_status"]
          total_price?: number
          updated_at?: string
          user_id?: string
          user_notes?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reservations_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
        ]
      }
      support_messages: {
        Row: {
          created_at: string
          id: string
          is_internal: boolean
          is_read: boolean
          message: string
          sender_id: string
          ticket_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_internal?: boolean
          is_read?: boolean
          message: string
          sender_id: string
          ticket_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_internal?: boolean
          is_read?: boolean
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
          admin_id: string | null
          created_at: string
          id: string
          rating: number | null
          status: Database["public"]["Enums"]["support_ticket_status"]
          subject: string
          updated_at: string
          user_id: string
        }
        Insert: {
          admin_id?: string | null
          created_at?: string
          id?: string
          rating?: number | null
          status?: Database["public"]["Enums"]["support_ticket_status"]
          subject: string
          updated_at?: string
          user_id: string
        }
        Update: {
          admin_id?: string | null
          created_at?: string
          id?: string
          rating?: number | null
          status?: Database["public"]["Enums"]["support_ticket_status"]
          subject?: string
          updated_at?: string
          user_id?: string
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
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
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
      has_permission: {
        Args: {
          _permission: Database["public"]["Enums"]["admin_permission"]
          _user_id: string
        }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin: { Args: { _user_id: string }; Returns: boolean }
    }
    Enums: {
      admin_permission:
        | "manage_locations"
        | "manage_reservations"
        | "manage_users"
        | "manage_payments"
        | "manage_checkin"
        | "view_reports"
        | "manage_support"
      app_role: "admin" | "user"
      reservation_status:
        | "pending"
        | "confirmed"
        | "rejected"
        | "cancelled_by_user"
        | "cancelled_by_admin"
        | "expired"
        | "presence_confirmed"
      support_ticket_status: "waiting" | "in_progress" | "resolved" | "closed"
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
      admin_permission: [
        "manage_locations",
        "manage_reservations",
        "manage_users",
        "manage_payments",
        "manage_checkin",
        "view_reports",
        "manage_support",
      ],
      app_role: ["admin", "user"],
      reservation_status: [
        "pending",
        "confirmed",
        "rejected",
        "cancelled_by_user",
        "cancelled_by_admin",
        "expired",
        "presence_confirmed",
      ],
      support_ticket_status: ["waiting", "in_progress", "resolved", "closed"],
    },
  },
} as const
