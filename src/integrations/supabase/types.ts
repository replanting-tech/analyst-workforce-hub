export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      analyst_schedule: {
        Row: {
          analyst_id: string
          created_at: string | null
          id: string
          shift_date: string
          shift_end: string
          shift_start: string
          status: string | null
          timezone: string | null
          updated_at: string | null
        }
        Insert: {
          analyst_id: string
          created_at?: string | null
          id?: string
          shift_date: string
          shift_end: string
          shift_start: string
          status?: string | null
          timezone?: string | null
          updated_at?: string | null
        }
        Update: {
          analyst_id?: string
          created_at?: string | null
          id?: string
          shift_date?: string
          shift_end?: string
          shift_start?: string
          status?: string | null
          timezone?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "analyst_schedule_analyst_id_fkey"
            columns: ["analyst_id"]
            isOneToOne: false
            referencedRelation: "analysts"
            referencedColumns: ["id"]
          },
        ]
      }
      analyst_workload: {
        Row: {
          active_incidents: number | null
          analyst_id: string
          closed_incidents: number | null
          date: string
          id: string
          total_incidents: number | null
          updated_at: string | null
        }
        Insert: {
          active_incidents?: number | null
          analyst_id: string
          closed_incidents?: number | null
          date?: string
          id?: string
          total_incidents?: number | null
          updated_at?: string | null
        }
        Update: {
          active_incidents?: number | null
          analyst_id?: string
          closed_incidents?: number | null
          date?: string
          id?: string
          total_incidents?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "analyst_workload_analyst_id_fkey"
            columns: ["analyst_id"]
            isOneToOne: false
            referencedRelation: "analysts"
            referencedColumns: ["id"]
          },
        ]
      }
      analysts: {
        Row: {
          availability: string | null
          code: string
          created_at: string | null
          email: string
          id: string
          name: string
          status: string | null
          updated_at: string | null
        }
        Insert: {
          availability?: string | null
          code: string
          created_at?: string | null
          email: string
          id?: string
          name: string
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          availability?: string | null
          code?: string
          created_at?: string | null
          email?: string
          id?: string
          name?: string
          status?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      customers: {
        Row: {
          created_at: string | null
          customer_name: string
          id: string
          timezone: string | null
          updated_at: string | null
          workspace_name: string
        }
        Insert: {
          created_at?: string | null
          customer_name: string
          id?: string
          timezone?: string | null
          updated_at?: string | null
          workspace_name: string
        }
        Update: {
          created_at?: string | null
          customer_name?: string
          id?: string
          timezone?: string | null
          updated_at?: string | null
          workspace_name?: string
        }
        Relationships: []
      }
      incident_status_log: {
        Row: {
          change_reason: string | null
          changed_at: string | null
          changed_by: string | null
          id: string
          incident_id: string
          new_analyst_id: string | null
          new_status: string
          old_analyst_id: string | null
          old_status: string | null
        }
        Insert: {
          change_reason?: string | null
          changed_at?: string | null
          changed_by?: string | null
          id?: string
          incident_id: string
          new_analyst_id?: string | null
          new_status: string
          old_analyst_id?: string | null
          old_status?: string | null
        }
        Update: {
          change_reason?: string | null
          changed_at?: string | null
          changed_by?: string | null
          id?: string
          incident_id?: string
          new_analyst_id?: string | null
          new_status?: string
          old_analyst_id?: string | null
          old_status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "incident_status_log_incident_id_fkey"
            columns: ["incident_id"]
            isOneToOne: false
            referencedRelation: "incidents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "incident_status_log_incident_id_fkey"
            columns: ["incident_id"]
            isOneToOne: false
            referencedRelation: "v_incident_sla_details"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "incident_status_log_incident_id_fkey"
            columns: ["incident_id"]
            isOneToOne: false
            referencedRelation: "v_sla_breach_alerts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "incident_status_log_new_analyst_id_fkey"
            columns: ["new_analyst_id"]
            isOneToOne: false
            referencedRelation: "analysts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "incident_status_log_old_analyst_id_fkey"
            columns: ["old_analyst_id"]
            isOneToOne: false
            referencedRelation: "analysts"
            referencedColumns: ["id"]
          },
        ]
      }
      incidents: {
        Row: {
          analyst_id: string | null
          closed_time: string | null
          created_at: string | null
          creation_time: string
          customer_id: string
          customer_notification: string | null
          id: string
          incident_id: string
          incident_number: string
          incident_url: string | null
          jira_ticket_id: string | null
          priority: string
          raw_logs: string | null
          sla_target_time: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          analyst_id?: string | null
          closed_time?: string | null
          created_at?: string | null
          creation_time: string
          customer_id: string
          customer_notification?: string | null
          id?: string
          incident_id: string
          incident_number: string
          incident_url?: string | null
          jira_ticket_id?: string | null
          priority: string
          raw_logs?: string | null
          sla_target_time?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          analyst_id?: string | null
          closed_time?: string | null
          created_at?: string | null
          creation_time?: string
          customer_id?: string
          customer_notification?: string | null
          id?: string
          incident_id?: string
          incident_number?: string
          incident_url?: string | null
          jira_ticket_id?: string | null
          priority?: string
          raw_logs?: string | null
          sla_target_time?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "incidents_analyst_id_fkey"
            columns: ["analyst_id"]
            isOneToOne: false
            referencedRelation: "analysts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "incidents_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      request_changes: {
        Row: {
          analyst_id: string | null
          assets: string | null
          created_at: string
          id: number
          incident_number: string | null
          jira_ticket_id: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          analyst_id?: string | null
          assets?: string | null
          created_at?: string
          id?: number
          incident_number?: string | null
          jira_ticket_id?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          analyst_id?: string | null
          assets?: string | null
          created_at?: string
          id?: number
          incident_number?: string | null
          jira_ticket_id?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "request_changes_analyst_id_fkey"
            columns: ["analyst_id"]
            isOneToOne: false
            referencedRelation: "analysts"
            referencedColumns: ["code"]
          },
          {
            foreignKeyName: "request_changes_analyst_id_fkey"
            columns: ["analyst_id"]
            isOneToOne: false
            referencedRelation: "v_analyst_schedule_today"
            referencedColumns: ["code"]
          },
          {
            foreignKeyName: "request_changes_analyst_id_fkey"
            columns: ["analyst_id"]
            isOneToOne: false
            referencedRelation: "v_analyst_workload_summary"
            referencedColumns: ["code"]
          },
          {
            foreignKeyName: "request_changes_analyst_id_fkey"
            columns: ["analyst_id"]
            isOneToOne: false
            referencedRelation: "v_incident_sla_details"
            referencedColumns: ["analyst_code"]
          },
          {
            foreignKeyName: "request_changes_analyst_id_fkey"
            columns: ["analyst_id"]
            isOneToOne: false
            referencedRelation: "v_incidents"
            referencedColumns: ["analyst_code"]
          },
          {
            foreignKeyName: "request_changes_analyst_id_fkey"
            columns: ["analyst_id"]
            isOneToOne: false
            referencedRelation: "v_sla_breach_alerts"
            referencedColumns: ["analyst_code"]
          },
          {
            foreignKeyName: "request_changes_incident_number_fkey"
            columns: ["incident_number"]
            isOneToOne: false
            referencedRelation: "incidents"
            referencedColumns: ["incident_number"]
          },
          {
            foreignKeyName: "request_changes_incident_number_fkey"
            columns: ["incident_number"]
            isOneToOne: false
            referencedRelation: "v_incident_sla_details"
            referencedColumns: ["incident_number"]
          },
          {
            foreignKeyName: "request_changes_incident_number_fkey"
            columns: ["incident_number"]
            isOneToOne: false
            referencedRelation: "v_incidents"
            referencedColumns: ["incident_number"]
          },
        ]
      }
      request_changes_indicators: {
        Row: {
          created_at: string | null
          description: string | null
          id: number
          request_changes_id: number | null
          status: string
          type: string
          value: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: number
          request_changes_id?: number | null
          status?: string
          type?: string
          value: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: number
          request_changes_id?: number | null
          status?: string
          type?: string
          value?: string
        }
        Relationships: [
          {
            foreignKeyName: "request_changes_indicators_request_changes_id_fkey"
            columns: ["request_changes_id"]
            isOneToOne: false
            referencedRelation: "request_changes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "request_changes_indicators_request_changes_id_fkey"
            columns: ["request_changes_id"]
            isOneToOne: false
            referencedRelation: "v_request_changes_indicators"
            referencedColumns: ["id"]
          },
        ]
      }
      sla_alerts: {
        Row: {
          alert_time: string
          alert_type: string
          error_message: string | null
          id: string
          incident_id: string
          is_sent: boolean | null
          sent_at: string | null
        }
        Insert: {
          alert_time: string
          alert_type: string
          error_message?: string | null
          id?: string
          incident_id: string
          is_sent?: boolean | null
          sent_at?: string | null
        }
        Update: {
          alert_time?: string
          alert_type?: string
          error_message?: string | null
          id?: string
          incident_id?: string
          is_sent?: boolean | null
          sent_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sla_alerts_incident_id_fkey"
            columns: ["incident_id"]
            isOneToOne: false
            referencedRelation: "incidents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sla_alerts_incident_id_fkey"
            columns: ["incident_id"]
            isOneToOne: false
            referencedRelation: "v_incident_sla_details"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sla_alerts_incident_id_fkey"
            columns: ["incident_id"]
            isOneToOne: false
            referencedRelation: "v_sla_breach_alerts"
            referencedColumns: ["id"]
          },
        ]
      }
      sla_config: {
        Row: {
          created_at: string | null
          customer_id: string
          id: string
          priority: string
          resolution_minutes: number
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          customer_id: string
          id?: string
          priority: string
          resolution_minutes: number
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          customer_id?: string
          id?: string
          priority?: string
          resolution_minutes?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sla_config_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      v_resolution_minutes: {
        Row: {
          resolution_minutes: number | null
        }
        Insert: {
          resolution_minutes?: number | null
        }
        Update: {
          resolution_minutes?: number | null
        }
        Relationships: []
      }
    }
    Views: {
      v_analyst_schedule_today: {
        Row: {
          availability: string | null
          code: string | null
          name: string | null
          schedule_status: string | null
          shift_end: string | null
          shift_start: string | null
          timezone: string | null
        }
        Relationships: []
      }
      v_analyst_workload_summary: {
        Row: {
          availability: string | null
          code: string | null
          current_active_incidents: number | null
          email: string | null
          name: string | null
          today_closed_incidents: number | null
          today_total_incidents: number | null
          workload_updated_at: string | null
        }
        Relationships: []
      }
      v_incident_sla_details: {
        Row: {
          analyst_code: string | null
          analyst_name: string | null
          closed_time: string | null
          created_at: string | null
          creation_time: string | null
          customer_name: string | null
          customer_notification: string | null
          id: string | null
          incident_id: string | null
          incident_number: string | null
          incident_url: string | null
          jira_ticket_id: string | null
          priority: string | null
          resolution_minutes: number | null
          sla_remaining_formatted: string | null
          sla_remaining_seconds: number | null
          sla_status: string | null
          sla_target_time: string | null
          status: string | null
          updated_at: string | null
          workspace_name: string | null
        }
        Relationships: []
      }
      v_incidents: {
        Row: {
          analyst_code: string | null
          analyst_email: string | null
          analyst_name: string | null
          created_at: string | null
          creation_time: string | null
          customer_id: string | null
          customer_name: string | null
          customer_notification: string | null
          incident_id: string | null
          incident_number: string | null
          incident_url: string | null
          jira_ticket_id: string | null
          priority: string | null
          raw_logs: string | null
          sla_target_time: string | null
          status: string | null
          updated_at: string | null
          workspace_name: string | null
        }
        Relationships: [
          {
            foreignKeyName: "incidents_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      v_request_changes_indicators: {
        Row: {
          created_at: string | null
          description: string | null
          id: number | null
          incident_id: string | null
          jira_ticket_id: string | null
          status: string | null
          type: string | null
          value: string | null
        }
        Relationships: [
          {
            foreignKeyName: "request_changes_incident_number_fkey"
            columns: ["incident_id"]
            isOneToOne: false
            referencedRelation: "incidents"
            referencedColumns: ["incident_number"]
          },
          {
            foreignKeyName: "request_changes_incident_number_fkey"
            columns: ["incident_id"]
            isOneToOne: false
            referencedRelation: "v_incident_sla_details"
            referencedColumns: ["incident_number"]
          },
          {
            foreignKeyName: "request_changes_incident_number_fkey"
            columns: ["incident_id"]
            isOneToOne: false
            referencedRelation: "v_incidents"
            referencedColumns: ["incident_number"]
          },
        ]
      }
      v_sla_breach_alerts: {
        Row: {
          alert_already_sent: boolean | null
          alert_type: string | null
          analyst_code: string | null
          analyst_name: string | null
          customer_name: string | null
          id: string | null
          incident_id: string | null
          priority: string | null
          sla_remaining_seconds: number | null
          sla_target_time: string | null
          workspace_name: string | null
        }
        Relationships: []
      }
      v_sla_dashboard: {
        Row: {
          customer_name: string | null
          priority: string | null
          sla_breach: number | null
          sla_compliance_percentage: number | null
          sla_met: number | null
          sla_ongoing: number | null
          total_incidents: number | null
          workspace_name: string | null
        }
        Relationships: []
      }
      v_sla_totals: {
        Row: {
          sla_breach_total: number | null
          sla_met_total: number | null
          sla_ongoing_total: number | null
          total_incidents_total: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      assign_incident_to_available_analyst: {
        Args: { p_incident_id: string; p_changed_by?: string }
        Returns: Json
      }
      calculate_sla_remaining_seconds: {
        Args: {
          p_sla_target_time: string
          p_status: string
          p_closed_time?: string
        }
        Returns: number
      }
      create_analyst_schedule: {
        Args: {
          p_analyst_code: string
          p_shift_date: string
          p_shift_start: string
          p_shift_end: string
          p_timezone?: string
        }
        Returns: Json
      }
      create_incident: {
        Args:
          | {
              p_incident_id: string
              p_workspace_name: string
              p_priority: string
              p_creation_time: string
              p_analyst_code?: string
            }
          | {
              p_incident_id: string
              p_workspace_name: string
              p_priority: string
              p_creation_time: string
              p_jira_ticket_id?: string
              p_analyst_code?: string
            }
          | {
              p_incident_id: string
              p_workspace_name: string
              p_priority: string
              p_creation_time: string
              p_jira_ticket_id?: string
              p_analyst_code?: string
              p_raw_logs?: string
            }
          | {
              p_incident_id: string
              p_workspace_name: string
              p_priority: string
              p_creation_time: string
              p_jira_ticket_id?: string
              p_analyst_name?: string
              p_raw_logs?: string
              p_incident_url?: string
              p_incident_number?: string
            }
        Returns: Json
      }
      create_request_change: {
        Args: {
          p_incident_id: string
          p_jira_ticket_id: string
          p_analyst_name: string
          p_assets: string
        }
        Returns: Json
      }
      format_time_remaining: {
        Args: { seconds: number }
        Returns: string
      }
      get_pending_alerts: {
        Args: Record<PropertyKey, never>
        Returns: {
          incident_id: string
          azure_incident_id: string
          customer_name: string
          analyst_code: string
          priority: string
          alert_type: string
          sla_remaining_seconds: number
          sla_target_time: string
        }[]
      }
      get_sla_status: {
        Args: {
          p_sla_target_time: string
          p_status: string
          p_closed_time?: string
        }
        Returns: string
      }
      mark_alert_sent: {
        Args: {
          p_incident_id: string
          p_alert_type: string
          p_error_message?: string
        }
        Returns: Json
      }
      update_analyst_workload: {
        Args: { p_analyst_id: string; p_date?: string }
        Returns: undefined
      }
      update_incident_status: {
        Args: {
          p_incident_id: string
          p_new_status?: string
          p_analyst_code?: string
          p_jira_ticket_id?: string
          p_customer_notification?: string
          p_changed_by?: string
        }
        Returns: Json
      }
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
