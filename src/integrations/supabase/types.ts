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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      appointments: {
        Row: {
          created_at: string
          created_by: string | null
          doctor_id: string
          duration_minutes: number
          id: string
          notes: string | null
          patient_id: string
          payment_method: string | null
          payment_reference: string | null
          price: number | null
          reason: string | null
          scheduled_at: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          doctor_id: string
          duration_minutes?: number
          id?: string
          notes?: string | null
          patient_id: string
          payment_method?: string | null
          payment_reference?: string | null
          price?: number | null
          reason?: string | null
          scheduled_at: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          doctor_id?: string
          duration_minutes?: number
          id?: string
          notes?: string | null
          patient_id?: string
          payment_method?: string | null
          payment_reference?: string | null
          price?: number | null
          reason?: string | null
          scheduled_at?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "appointments_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      clinical_notes: {
        Row: {
          attachments: Json
          author_id: string | null
          content: string
          created_at: string
          id: string
          note_date: string
          patient_id: string
          title: string
          updated_at: string
        }
        Insert: {
          attachments?: Json
          author_id?: string | null
          content?: string
          created_at?: string
          id?: string
          note_date?: string
          patient_id: string
          title: string
          updated_at?: string
        }
        Update: {
          attachments?: Json
          author_id?: string | null
          content?: string
          created_at?: string
          id?: string
          note_date?: string
          patient_id?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "clinical_notes_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      consultation_consumables: {
        Row: {
          consultation_id: string
          created_at: string
          id: string
          item_name: string
          quantity: number
          unit: string | null
        }
        Insert: {
          consultation_id: string
          created_at?: string
          id?: string
          item_name: string
          quantity?: number
          unit?: string | null
        }
        Update: {
          consultation_id?: string
          created_at?: string
          id?: string
          item_name?: string
          quantity?: number
          unit?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "consultation_consumables_consultation_id_fkey"
            columns: ["consultation_id"]
            isOneToOne: false
            referencedRelation: "consultations"
            referencedColumns: ["id"]
          },
        ]
      }
      consultations: {
        Row: {
          abdomen: string | null
          acetic_acid_test: string | null
          acetic_clock_position: string | null
          acetic_relative_position: string | null
          alarm_signs: string | null
          appointment_id: string
          blood_pressure: string | null
          bmi: number | null
          breasts: string | null
          complementary_exams: string | null
          contact_channel: string | null
          created_at: string
          diagnosis: string | null
          doctor_id: string | null
          edema: string | null
          extremities: string | null
          fetal_heart_rate: number | null
          fetal_movements: string | null
          fetal_weight: number | null
          gestational_age: string | null
          gynecological: string | null
          head_neck: string | null
          heart_rate: number | null
          height_cm: number | null
          id: string
          indications: string | null
          is_first_visit: boolean
          lugol_clock_position: string | null
          lugol_relative_position: string | null
          lugol_test: string | null
          neurological: string | null
          next_appointment_date: string | null
          obstetric_bp: string | null
          patient_id: string
          plan: string | null
          presentation: string | null
          respiratory_rate: number | null
          skin: string | null
          subjective_exam: string | null
          temperature: number | null
          updated_at: string
          uterine_height: number | null
          visit_type: Database["public"]["Enums"]["visit_type_enum"]
          weight_kg: number | null
        }
        Insert: {
          abdomen?: string | null
          acetic_acid_test?: string | null
          acetic_clock_position?: string | null
          acetic_relative_position?: string | null
          alarm_signs?: string | null
          appointment_id: string
          blood_pressure?: string | null
          bmi?: number | null
          breasts?: string | null
          complementary_exams?: string | null
          contact_channel?: string | null
          created_at?: string
          diagnosis?: string | null
          doctor_id?: string | null
          edema?: string | null
          extremities?: string | null
          fetal_heart_rate?: number | null
          fetal_movements?: string | null
          fetal_weight?: number | null
          gestational_age?: string | null
          gynecological?: string | null
          head_neck?: string | null
          heart_rate?: number | null
          height_cm?: number | null
          id?: string
          indications?: string | null
          is_first_visit?: boolean
          lugol_clock_position?: string | null
          lugol_relative_position?: string | null
          lugol_test?: string | null
          neurological?: string | null
          next_appointment_date?: string | null
          obstetric_bp?: string | null
          patient_id: string
          plan?: string | null
          presentation?: string | null
          respiratory_rate?: number | null
          skin?: string | null
          subjective_exam?: string | null
          temperature?: number | null
          updated_at?: string
          uterine_height?: number | null
          visit_type?: Database["public"]["Enums"]["visit_type_enum"]
          weight_kg?: number | null
        }
        Update: {
          abdomen?: string | null
          acetic_acid_test?: string | null
          acetic_clock_position?: string | null
          acetic_relative_position?: string | null
          alarm_signs?: string | null
          appointment_id?: string
          blood_pressure?: string | null
          bmi?: number | null
          breasts?: string | null
          complementary_exams?: string | null
          contact_channel?: string | null
          created_at?: string
          diagnosis?: string | null
          doctor_id?: string | null
          edema?: string | null
          extremities?: string | null
          fetal_heart_rate?: number | null
          fetal_movements?: string | null
          fetal_weight?: number | null
          gestational_age?: string | null
          gynecological?: string | null
          head_neck?: string | null
          heart_rate?: number | null
          height_cm?: number | null
          id?: string
          indications?: string | null
          is_first_visit?: boolean
          lugol_clock_position?: string | null
          lugol_relative_position?: string | null
          lugol_test?: string | null
          neurological?: string | null
          next_appointment_date?: string | null
          obstetric_bp?: string | null
          patient_id?: string
          plan?: string | null
          presentation?: string | null
          respiratory_rate?: number | null
          skin?: string | null
          subjective_exam?: string | null
          temperature?: number | null
          updated_at?: string
          uterine_height?: number | null
          visit_type?: Database["public"]["Enums"]["visit_type_enum"]
          weight_kg?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "consultations_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "consultations_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      lab_results: {
        Row: {
          appointment_id: string
          created_at: string
          created_by: string | null
          file_url: string | null
          id: string
          patient_id: string
          result: string | null
          result_date: string | null
          status: string
          test_type: string
          updated_at: string
        }
        Insert: {
          appointment_id: string
          created_at?: string
          created_by?: string | null
          file_url?: string | null
          id?: string
          patient_id: string
          result?: string | null
          result_date?: string | null
          status?: string
          test_type: string
          updated_at?: string
        }
        Update: {
          appointment_id?: string
          created_at?: string
          created_by?: string | null
          file_url?: string | null
          id?: string
          patient_id?: string
          result?: string | null
          result_date?: string | null
          status?: string
          test_type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "lab_results_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lab_results_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      patients: {
        Row: {
          address: string | null
          assigned_doctor_id: string | null
          birth_date: string | null
          birthplace: string | null
          consultation_reason: string | null
          created_at: string
          created_by: string | null
          current_illness: string | null
          document_id: string | null
          education_level: string | null
          email: string | null
          ethnicity: string | null
          family_history: Json | null
          first_visit_date: string | null
          full_name: string
          gynecological_data: Json | null
          historia_number: string | null
          id: string
          marital_status: string | null
          notes: string | null
          obstetric_data: Json | null
          occupation: string | null
          personal_history: Json | null
          phone: string | null
          status: string
          updated_at: string
        }
        Insert: {
          address?: string | null
          assigned_doctor_id?: string | null
          birth_date?: string | null
          birthplace?: string | null
          consultation_reason?: string | null
          created_at?: string
          created_by?: string | null
          current_illness?: string | null
          document_id?: string | null
          education_level?: string | null
          email?: string | null
          ethnicity?: string | null
          family_history?: Json | null
          first_visit_date?: string | null
          full_name: string
          gynecological_data?: Json | null
          historia_number?: string | null
          id?: string
          marital_status?: string | null
          notes?: string | null
          obstetric_data?: Json | null
          occupation?: string | null
          personal_history?: Json | null
          phone?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          address?: string | null
          assigned_doctor_id?: string | null
          birth_date?: string | null
          birthplace?: string | null
          consultation_reason?: string | null
          created_at?: string
          created_by?: string | null
          current_illness?: string | null
          document_id?: string | null
          education_level?: string | null
          email?: string | null
          ethnicity?: string | null
          family_history?: Json | null
          first_visit_date?: string | null
          full_name?: string
          gynecological_data?: Json | null
          historia_number?: string | null
          id?: string
          marital_status?: string | null
          notes?: string | null
          obstetric_data?: Json | null
          occupation?: string | null
          personal_history?: Json | null
          phone?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string
          full_name: string
          id: string
          specialty: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email?: string
          full_name?: string
          id: string
          specialty?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          specialty?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      prescription_templates: {
        Row: {
          id: string
          title: string
          indications: string
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          indications: string
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          indications?: string
          created_by?: string | null
          created_at?: string
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
      app_role: "admin" | "doctor"
      visit_type_enum:
        | "CONTROL"
        | "EMERGENCIA"
        | "CONSULTA_NUEVA"
        | "POST_TRATAMIENTO"
        | "OTRO"
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
      app_role: ["admin", "doctor"],
      visit_type_enum: [
        "CONTROL",
        "EMERGENCIA",
        "CONSULTA_NUEVA",
        "POST_TRATAMIENTO",
        "OTRO",
      ],
    },
  },
} as const
