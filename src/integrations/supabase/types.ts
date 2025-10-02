export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      appointments: {
        Row: {
          client_id: string | null
          created_at: string
          date: string
          description: string | null
          end_time: string | null
          id: string
          notes: string | null
          service_id: string | null
          start_time: string
          status: Database["public"]["Enums"]["appointment_status"]
          title: string
          type: Database["public"]["Enums"]["appointment_type"]
          updated_at: string
        }
        Insert: {
          client_id?: string | null
          created_at?: string
          date: string
          description?: string | null
          end_time?: string | null
          id?: string
          notes?: string | null
          service_id?: string | null
          start_time: string
          status?: Database["public"]["Enums"]["appointment_status"]
          title: string
          type?: Database["public"]["Enums"]["appointment_type"]
          updated_at?: string
        }
        Update: {
          client_id?: string | null
          created_at?: string
          date?: string
          description?: string | null
          end_time?: string | null
          id?: string
          notes?: string | null
          service_id?: string | null
          start_time?: string
          status?: Database["public"]["Enums"]["appointment_status"]
          title?: string
          type?: Database["public"]["Enums"]["appointment_type"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "appointments_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      clients: {
        Row: {
          address: string
          created_at: string
          email: string
          id: string
          name: string
          status: Database["public"]["Enums"]["client_status"]
          updated_at: string
          work_type: string
        }
        Insert: {
          address: string
          created_at?: string
          email: string
          id?: string
          name: string
          status?: Database["public"]["Enums"]["client_status"]
          updated_at?: string
          work_type: string
        }
        Update: {
          address?: string
          created_at?: string
          email?: string
          id?: string
          name?: string
          status?: Database["public"]["Enums"]["client_status"]
          updated_at?: string
          work_type?: string
        }
        Relationships: []
      }
      equipment: {
        Row: {
          client_id: string
          created_at: string
          id: string
          model: string
          name: string
          notes: string | null
          serial_number: string | null
          status: Database["public"]["Enums"]["equipment_status"]
          type: string
          updated_at: string
        }
        Insert: {
          client_id: string
          created_at?: string
          id?: string
          model: string
          name: string
          notes?: string | null
          serial_number?: string | null
          status?: Database["public"]["Enums"]["equipment_status"]
          type: string
          updated_at?: string
        }
        Update: {
          client_id?: string
          created_at?: string
          id?: string
          model?: string
          name?: string
          notes?: string | null
          serial_number?: string | null
          status?: Database["public"]["Enums"]["equipment_status"]
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "equipment_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      expenses: {
        Row: {
          category: string
          created_at: string
          description: string
          due_date: string
          id: string
          is_paid: boolean
          notes: string | null
          updated_at: string
          value: number
        }
        Insert: {
          category: string
          created_at?: string
          description: string
          due_date: string
          id?: string
          is_paid?: boolean
          notes?: string | null
          updated_at?: string
          value: number
        }
        Update: {
          category?: string
          created_at?: string
          description?: string
          due_date?: string
          id?: string
          is_paid?: boolean
          notes?: string | null
          updated_at?: string
          value?: number
        }
        Relationships: []
      }
      financial_data: {
        Row: {
          created_at: string
          id: string
          monthly_data: Json
          period_end: string
          period_start: string
          summary: Json
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          monthly_data?: Json
          period_end: string
          period_start: string
          summary?: Json
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          monthly_data?: Json
          period_end?: string
          period_start?: string
          summary?: Json
          updated_at?: string
        }
        Relationships: []
      }
      installments: {
        Row: {
          amount: number
          created_at: string
          due_date: string
          id: string
          paid_date: string | null
          parcel_number: number
          service_id: string
          status: Database["public"]["Enums"]["installment_status"]
          updated_at: string
        }
        Insert: {
          amount: number
          created_at?: string
          due_date: string
          id?: string
          paid_date?: string | null
          parcel_number: number
          service_id: string
          status?: Database["public"]["Enums"]["installment_status"]
          updated_at?: string
        }
        Update: {
          amount?: number
          created_at?: string
          due_date?: string
          id?: string
          paid_date?: string | null
          parcel_number?: number
          service_id?: string
          status?: Database["public"]["Enums"]["installment_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "installments_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      materials: {
        Row: {
          created_at: string
          description: string
          id: string
          model: string
          purchase_price: number
          purchase_sites: string
          return_value: number
          selling_price: number
          status: Database["public"]["Enums"]["material_status"]
          stock: number | null
          type: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description: string
          id?: string
          model: string
          purchase_price?: number
          purchase_sites: string
          return_value?: number
          selling_price?: number
          status?: Database["public"]["Enums"]["material_status"]
          stock?: number | null
          type: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string
          id?: string
          model?: string
          purchase_price?: number
          purchase_sites?: string
          return_value?: number
          selling_price?: number
          status?: Database["public"]["Enums"]["material_status"]
          stock?: number | null
          type?: string
          updated_at?: string
        }
        Relationships: []
      }
      order_materials: {
        Row: {
          created_at: string
          id: string
          material_id: string
          order_id: string
          price_snapshot: number
          quantity: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          material_id: string
          order_id: string
          price_snapshot?: number
          quantity?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          material_id?: string
          order_id?: string
          price_snapshot?: number
          quantity?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "order_materials_material_id_fkey"
            columns: ["material_id"]
            isOneToOne: false
            referencedRelation: "materials"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_materials_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          created_at: string
          estimated_delivery_time: string
          id: string
          notes: string | null
          order_code: string
          related_service_id: string | null
          status: Database["public"]["Enums"]["order_status"]
          store: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          estimated_delivery_time: string
          id?: string
          notes?: string | null
          order_code: string
          related_service_id?: string | null
          status?: Database["public"]["Enums"]["order_status"]
          store: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          estimated_delivery_time?: string
          id?: string
          notes?: string | null
          order_code?: string
          related_service_id?: string | null
          status?: Database["public"]["Enums"]["order_status"]
          store?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "orders_related_service_id_fkey"
            columns: ["related_service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount: number
          created_at: string
          id: string
          notes: string | null
          payment_date: string
          payment_method: Database["public"]["Enums"]["payment_method"]
          service_id: string
          updated_at: string
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          notes?: string | null
          payment_date: string
          payment_method?: Database["public"]["Enums"]["payment_method"]
          service_id: string
          updated_at?: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          notes?: string | null
          payment_date?: string
          payment_method?: Database["public"]["Enums"]["payment_method"]
          service_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          client_id: string | null
          created_at: string
          email: string
          id: string
          is_active: boolean
          last_login: string | null
          name: string
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string
        }
        Insert: {
          client_id?: string | null
          created_at?: string
          email: string
          id: string
          is_active?: boolean
          last_login?: string | null
          name: string
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Update: {
          client_id?: string | null
          created_at?: string
          email?: string
          id?: string
          is_active?: boolean
          last_login?: string | null
          name?: string
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Relationships: []
      }
      service_materials: {
        Row: {
          created_at: string
          id: string
          material_id: string
          price_snapshot: number
          quantity: number
          service_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          material_id: string
          price_snapshot?: number
          quantity?: number
          service_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          material_id?: string
          price_snapshot?: number
          quantity?: number
          service_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "service_materials_material_id_fkey"
            columns: ["material_id"]
            isOneToOne: false
            referencedRelation: "materials"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_materials_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      service_technicians: {
        Row: {
          created_at: string
          id: string
          service_id: string
          technician_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          service_id: string
          technician_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          service_id?: string
          technician_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "service_technicians_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_technicians_technician_id_fkey"
            columns: ["technician_id"]
            isOneToOne: false
            referencedRelation: "technicians"
            referencedColumns: ["id"]
          },
        ]
      }
      services: {
        Row: {
          client_id: string
          created_at: string
          date: string
          description: string | null
          equipment_id: string | null
          id: string
          is_installment_payment: boolean
          name: string
          notes: string | null
          payment_status: Database["public"]["Enums"]["payment_status"]
          pickup_delivery_price: number
          roi: number
          service_number: string | null
          service_price: number
          service_status: Database["public"]["Enums"]["service_status"]
          service_types: Json | null
          total_value: number
          updated_at: string
          visit_type: Database["public"]["Enums"]["service_visit_type"]
          warranty_period: number | null
        }
        Insert: {
          client_id: string
          created_at?: string
          date: string
          description?: string | null
          equipment_id?: string | null
          id?: string
          is_installment_payment?: boolean
          name: string
          notes?: string | null
          payment_status?: Database["public"]["Enums"]["payment_status"]
          pickup_delivery_price?: number
          roi?: number
          service_number?: string | null
          service_price?: number
          service_status?: Database["public"]["Enums"]["service_status"]
          service_types?: Json | null
          total_value?: number
          updated_at?: string
          visit_type?: Database["public"]["Enums"]["service_visit_type"]
          warranty_period?: number | null
        }
        Update: {
          client_id?: string
          created_at?: string
          date?: string
          description?: string | null
          equipment_id?: string | null
          id?: string
          is_installment_payment?: boolean
          name?: string
          notes?: string | null
          payment_status?: Database["public"]["Enums"]["payment_status"]
          pickup_delivery_price?: number
          roi?: number
          service_number?: string | null
          service_price?: number
          service_status?: Database["public"]["Enums"]["service_status"]
          service_types?: Json | null
          total_value?: number
          updated_at?: string
          visit_type?: Database["public"]["Enums"]["service_visit_type"]
          warranty_period?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "services_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "services_equipment_id_fkey"
            columns: ["equipment_id"]
            isOneToOne: false
            referencedRelation: "equipment"
            referencedColumns: ["id"]
          },
        ]
      }
      settings: {
        Row: {
          created_at: string
          id: string
          key: string
          updated_at: string
          value: Json
        }
        Insert: {
          created_at?: string
          id?: string
          key: string
          updated_at?: string
          value?: Json
        }
        Update: {
          created_at?: string
          id?: string
          key?: string
          updated_at?: string
          value?: Json
        }
        Relationships: []
      }
      technicians: {
        Row: {
          created_at: string
          id: string
          name: string
          specialty: string
          status: Database["public"]["Enums"]["technician_status"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          specialty: string
          status?: Database["public"]["Enums"]["technician_status"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          specialty?: string
          status?: Database["public"]["Enums"]["technician_status"]
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_current_user_role: {
        Args: Record<PropertyKey, never>
        Returns: Database["public"]["Enums"]["user_role"]
      }
    }
    Enums: {
      appointment_status: "scheduled" | "completed" | "cancelled"
      appointment_type: "service" | "meeting" | "personal" | "other"
      client_status: "active" | "inactive"
      equipment_status: "operational" | "needs_service" | "decommissioned"
      installment_status: "pending" | "paid" | "canceled"
      material_status: "available" | "unavailable"
      order_status: "delivered" | "inRoute" | "paid"
      payment_method: "cash" | "credit" | "debit" | "transfer" | "other"
      payment_status: "paid" | "unpaid" | "pending" | "partial"
      service_status: "completed" | "inProgress" | "pending" | "cancelled"
      service_visit_type: "novo" | "retorno"
      technician_status: "active" | "inactive"
      user_role: "admin" | "technician" | "client"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      appointment_status: ["scheduled", "completed", "cancelled"],
      appointment_type: ["service", "meeting", "personal", "other"],
      client_status: ["active", "inactive"],
      equipment_status: ["operational", "needs_service", "decommissioned"],
      installment_status: ["pending", "paid", "canceled"],
      material_status: ["available", "unavailable"],
      order_status: ["delivered", "inRoute", "paid"],
      payment_method: ["cash", "credit", "debit", "transfer", "other"],
      payment_status: ["paid", "unpaid", "pending", "partial"],
      service_status: ["completed", "inProgress", "pending", "cancelled"],
      service_visit_type: ["novo", "retorno"],
      technician_status: ["active", "inactive"],
      user_role: ["admin", "technician", "client"],
    },
  },
} as const
