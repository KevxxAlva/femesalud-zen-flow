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
      catalogo_medicamentos: {
        Row: {
          concentracion: string | null
          id_medicamento: number
          nombre_comercial: string | null
          nombre_generico: string
          presentacion: string | null
        }
        Insert: {
          concentracion?: string | null
          id_medicamento?: number
          nombre_comercial?: string | null
          nombre_generico: string
          presentacion?: string | null
        }
        Update: {
          concentracion?: string | null
          id_medicamento?: number
          nombre_comercial?: string | null
          nombre_generico?: string
          presentacion?: string | null
        }
        Relationships: []
      }
      citas: {
        Row: {
          estado: string | null
          fecha_hora: string
          id_cita: number
          id_medico: number | null
          id_paciente: number | null
          motivo: string | null
        }
        Insert: {
          estado?: string | null
          fecha_hora: string
          id_cita?: number
          id_medico?: number | null
          id_paciente?: number | null
          motivo?: string | null
        }
        Update: {
          estado?: string | null
          fecha_hora?: string
          id_cita?: number
          id_medico?: number | null
          id_paciente?: number | null
          motivo?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "citas_id_medico_fkey"
            columns: ["id_medico"]
            isOneToOne: false
            referencedRelation: "medicos"
            referencedColumns: ["id_medico"]
          },
          {
            foreignKeyName: "citas_id_paciente_fkey"
            columns: ["id_paciente"]
            isOneToOne: false
            referencedRelation: "pacientes"
            referencedColumns: ["id_paciente"]
          },
        ]
      }
      consultas: {
        Row: {
          diagnostico: string | null
          fecha_hora: string | null
          id_cita: number | null
          id_consulta: number
          id_historia: number | null
          id_medico: number | null
          motivo_consulta: string | null
          notas_medicas: string | null
          peso_kg: number | null
          presion_arterial: string | null
          sintomas: string | null
          temperatura_c: number | null
        }
        Insert: {
          diagnostico?: string | null
          fecha_hora?: string | null
          id_cita?: number | null
          id_consulta?: number
          id_historia?: number | null
          id_medico?: number | null
          motivo_consulta?: string | null
          notas_medicas?: string | null
          peso_kg?: number | null
          presion_arterial?: string | null
          sintomas?: string | null
          temperatura_c?: number | null
        }
        Update: {
          diagnostico?: string | null
          fecha_hora?: string | null
          id_cita?: number | null
          id_consulta?: number
          id_historia?: number | null
          id_medico?: number | null
          motivo_consulta?: string | null
          notas_medicas?: string | null
          peso_kg?: number | null
          presion_arterial?: string | null
          sintomas?: string | null
          temperatura_c?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "consultas_id_cita_fkey"
            columns: ["id_cita"]
            isOneToOne: true
            referencedRelation: "citas"
            referencedColumns: ["id_cita"]
          },
          {
            foreignKeyName: "consultas_id_historia_fkey"
            columns: ["id_historia"]
            isOneToOne: false
            referencedRelation: "historias_clinicas"
            referencedColumns: ["id_historia"]
          },
          {
            foreignKeyName: "consultas_id_medico_fkey"
            columns: ["id_medico"]
            isOneToOne: false
            referencedRelation: "medicos"
            referencedColumns: ["id_medico"]
          },
        ]
      }
      detalles_factura: {
        Row: {
          cantidad: number | null
          id_detalle: number
          id_factura: number | null
          id_servicio: number | null
          precio_unitario: number
          subtotal: number
        }
        Insert: {
          cantidad?: number | null
          id_detalle?: number
          id_factura?: number | null
          id_servicio?: number | null
          precio_unitario: number
          subtotal: number
        }
        Update: {
          cantidad?: number | null
          id_detalle?: number
          id_factura?: number | null
          id_servicio?: number | null
          precio_unitario?: number
          subtotal?: number
        }
        Relationships: [
          {
            foreignKeyName: "detalles_factura_id_factura_fkey"
            columns: ["id_factura"]
            isOneToOne: false
            referencedRelation: "facturas"
            referencedColumns: ["id_factura"]
          },
          {
            foreignKeyName: "detalles_factura_id_servicio_fkey"
            columns: ["id_servicio"]
            isOneToOne: false
            referencedRelation: "servicios"
            referencedColumns: ["id_servicio"]
          },
        ]
      }
      detalles_receta: {
        Row: {
          dosis: string | null
          duracion_dias: number | null
          frecuencia: string | null
          id_detalle_receta: number
          id_medicamento: number | null
          id_receta: number | null
          indicaciones_adicionales: string | null
        }
        Insert: {
          dosis?: string | null
          duracion_dias?: number | null
          frecuencia?: string | null
          id_detalle_receta?: number
          id_medicamento?: number | null
          id_receta?: number | null
          indicaciones_adicionales?: string | null
        }
        Update: {
          dosis?: string | null
          duracion_dias?: number | null
          frecuencia?: string | null
          id_detalle_receta?: number
          id_medicamento?: number | null
          id_receta?: number | null
          indicaciones_adicionales?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "detalles_receta_id_medicamento_fkey"
            columns: ["id_medicamento"]
            isOneToOne: false
            referencedRelation: "catalogo_medicamentos"
            referencedColumns: ["id_medicamento"]
          },
          {
            foreignKeyName: "detalles_receta_id_receta_fkey"
            columns: ["id_receta"]
            isOneToOne: false
            referencedRelation: "recetas"
            referencedColumns: ["id_receta"]
          },
        ]
      }
      especialidades: {
        Row: {
          id_especialidad: number
          nombre: string
        }
        Insert: {
          id_especialidad?: number
          nombre: string
        }
        Update: {
          id_especialidad?: number
          nombre?: string
        }
        Relationships: []
      }
      examenes_laboratorio: {
        Row: {
          archivo_adjunto: string | null
          fecha_resultado: string | null
          id_consulta: number | null
          id_examen: number
          resultados_texto: string | null
          tipo_examen: string
        }
        Insert: {
          archivo_adjunto?: string | null
          fecha_resultado?: string | null
          id_consulta?: number | null
          id_examen?: number
          resultados_texto?: string | null
          tipo_examen: string
        }
        Update: {
          archivo_adjunto?: string | null
          fecha_resultado?: string | null
          id_consulta?: number | null
          id_examen?: number
          resultados_texto?: string | null
          tipo_examen?: string
        }
        Relationships: [
          {
            foreignKeyName: "examenes_laboratorio_id_consulta_fkey"
            columns: ["id_consulta"]
            isOneToOne: false
            referencedRelation: "consultas"
            referencedColumns: ["id_consulta"]
          },
        ]
      }
      facturas: {
        Row: {
          estado_pago: string | null
          fecha_emision: string | null
          id_factura: number
          id_paciente: number | null
          impuestos: number | null
          monto_cubierto_seguro: number | null
          monto_paciente: number
          subtotal: number
          total_general: number
        }
        Insert: {
          estado_pago?: string | null
          fecha_emision?: string | null
          id_factura?: number
          id_paciente?: number | null
          impuestos?: number | null
          monto_cubierto_seguro?: number | null
          monto_paciente: number
          subtotal: number
          total_general: number
        }
        Update: {
          estado_pago?: string | null
          fecha_emision?: string | null
          id_factura?: number
          id_paciente?: number | null
          impuestos?: number | null
          monto_cubierto_seguro?: number | null
          monto_paciente?: number
          subtotal?: number
          total_general?: number
        }
        Relationships: [
          {
            foreignKeyName: "facturas_id_paciente_fkey"
            columns: ["id_paciente"]
            isOneToOne: false
            referencedRelation: "pacientes"
            referencedColumns: ["id_paciente"]
          },
        ]
      }
      historias_clinicas: {
        Row: {
          actualizado_en: string | null
          alergias: string | null
          antecedentes_familiares: string | null
          enfermedades_cronicas: string | null
          id_historia: number
          id_paciente: number | null
          tipo_sangre: string | null
        }
        Insert: {
          actualizado_en?: string | null
          alergias?: string | null
          antecedentes_familiares?: string | null
          enfermedades_cronicas?: string | null
          id_historia?: number
          id_paciente?: number | null
          tipo_sangre?: string | null
        }
        Update: {
          actualizado_en?: string | null
          alergias?: string | null
          antecedentes_familiares?: string | null
          enfermedades_cronicas?: string | null
          id_historia?: number
          id_paciente?: number | null
          tipo_sangre?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "historias_clinicas_id_paciente_fkey"
            columns: ["id_paciente"]
            isOneToOne: true
            referencedRelation: "pacientes"
            referencedColumns: ["id_paciente"]
          },
        ]
      }
      horarios_medicos: {
        Row: {
          dia_semana: number | null
          hora_fin: string | null
          hora_inicio: string | null
          id_horario: number
          id_medico: number | null
        }
        Insert: {
          dia_semana?: number | null
          hora_fin?: string | null
          hora_inicio?: string | null
          id_horario?: number
          id_medico?: number | null
        }
        Update: {
          dia_semana?: number | null
          hora_fin?: string | null
          hora_inicio?: string | null
          id_horario?: number
          id_medico?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "horarios_medicos_id_medico_fkey"
            columns: ["id_medico"]
            isOneToOne: false
            referencedRelation: "medicos"
            referencedColumns: ["id_medico"]
          },
        ]
      }
      medicos: {
        Row: {
          apellido: string
          email: string | null
          estado: boolean | null
          id_especialidad: number | null
          id_medico: number
          id_usuario: number | null
          nombre: string
          numero_licencia: string | null
          telefono: string | null
        }
        Insert: {
          apellido: string
          email?: string | null
          estado?: boolean | null
          id_especialidad?: number | null
          id_medico?: number
          id_usuario?: number | null
          nombre: string
          numero_licencia?: string | null
          telefono?: string | null
        }
        Update: {
          apellido?: string
          email?: string | null
          estado?: boolean | null
          id_especialidad?: number | null
          id_medico?: number
          id_usuario?: number | null
          nombre?: string
          numero_licencia?: string | null
          telefono?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "medicos_id_especialidad_fkey"
            columns: ["id_especialidad"]
            isOneToOne: false
            referencedRelation: "especialidades"
            referencedColumns: ["id_especialidad"]
          },
          {
            foreignKeyName: "medicos_id_usuario_fkey"
            columns: ["id_usuario"]
            isOneToOne: true
            referencedRelation: "usuarios"
            referencedColumns: ["id_usuario"]
          },
        ]
      }
      pacientes: {
        Row: {
          apellido: string
          contacto_emergencia: string | null
          creado_en: string | null
          direccion: string | null
          documento_identidad: string
          email: string | null
          fecha_nacimiento: string | null
          genero: string | null
          id_paciente: number
          nombre: string
          telefono: string | null
        }
        Insert: {
          apellido: string
          contacto_emergencia?: string | null
          creado_en?: string | null
          direccion?: string | null
          documento_identidad: string
          email?: string | null
          fecha_nacimiento?: string | null
          genero?: string | null
          id_paciente?: number
          nombre: string
          telefono?: string | null
        }
        Update: {
          apellido?: string
          contacto_emergencia?: string | null
          creado_en?: string | null
          direccion?: string | null
          documento_identidad?: string
          email?: string | null
          fecha_nacimiento?: string | null
          genero?: string | null
          id_paciente?: number
          nombre?: string
          telefono?: string | null
        }
        Relationships: []
      }
      pagos: {
        Row: {
          fecha_pago: string | null
          id_factura: number | null
          id_pago: number
          metodo_pago: string | null
          monto_pagado: number
        }
        Insert: {
          fecha_pago?: string | null
          id_factura?: number | null
          id_pago?: number
          metodo_pago?: string | null
          monto_pagado: number
        }
        Update: {
          fecha_pago?: string | null
          id_factura?: number | null
          id_pago?: number
          metodo_pago?: string | null
          monto_pagado?: number
        }
        Relationships: [
          {
            foreignKeyName: "pagos_id_factura_fkey"
            columns: ["id_factura"]
            isOneToOne: false
            referencedRelation: "facturas"
            referencedColumns: ["id_factura"]
          },
        ]
      }
      polizas_pacientes: {
        Row: {
          activa: boolean | null
          id_paciente: number | null
          id_poliza: number
          id_seguro: number | null
          numero_poliza: string
          tipo_cobertura: string | null
        }
        Insert: {
          activa?: boolean | null
          id_paciente?: number | null
          id_poliza?: number
          id_seguro?: number | null
          numero_poliza: string
          tipo_cobertura?: string | null
        }
        Update: {
          activa?: boolean | null
          id_paciente?: number | null
          id_poliza?: number
          id_seguro?: number | null
          numero_poliza?: string
          tipo_cobertura?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "polizas_pacientes_id_paciente_fkey"
            columns: ["id_paciente"]
            isOneToOne: false
            referencedRelation: "pacientes"
            referencedColumns: ["id_paciente"]
          },
          {
            foreignKeyName: "polizas_pacientes_id_seguro_fkey"
            columns: ["id_seguro"]
            isOneToOne: false
            referencedRelation: "seguros_medicos"
            referencedColumns: ["id_seguro"]
          },
        ]
      }
      recetas: {
        Row: {
          fecha_emision: string | null
          id_consulta: number | null
          id_receta: number
        }
        Insert: {
          fecha_emision?: string | null
          id_consulta?: number | null
          id_receta?: number
        }
        Update: {
          fecha_emision?: string | null
          id_consulta?: number | null
          id_receta?: number
        }
        Relationships: [
          {
            foreignKeyName: "recetas_id_consulta_fkey"
            columns: ["id_consulta"]
            isOneToOne: false
            referencedRelation: "consultas"
            referencedColumns: ["id_consulta"]
          },
        ]
      }
      roles: {
        Row: {
          descripcion: string | null
          id_rol: number
          nombre_rol: string
        }
        Insert: {
          descripcion?: string | null
          id_rol?: number
          nombre_rol: string
        }
        Update: {
          descripcion?: string | null
          id_rol?: number
          nombre_rol?: string
        }
        Relationships: []
      }
      seguros_medicos: {
        Row: {
          detalles_cobertura: string | null
          id_seguro: number
          nombre_aseguradora: string
          telefono_contacto: string | null
        }
        Insert: {
          detalles_cobertura?: string | null
          id_seguro?: number
          nombre_aseguradora: string
          telefono_contacto?: string | null
        }
        Update: {
          detalles_cobertura?: string | null
          id_seguro?: number
          nombre_aseguradora?: string
          telefono_contacto?: string | null
        }
        Relationships: []
      }
      servicios: {
        Row: {
          codigo_medico: string | null
          costo_base: number
          descripcion: string | null
          id_servicio: number
          nombre_servicio: string
        }
        Insert: {
          codigo_medico?: string | null
          costo_base: number
          descripcion?: string | null
          id_servicio?: number
          nombre_servicio: string
        }
        Update: {
          codigo_medico?: string | null
          costo_base?: number
          descripcion?: string | null
          id_servicio?: number
          nombre_servicio?: string
        }
        Relationships: []
      }
      usuarios: {
        Row: {
          auth_id: string | null
          contrasena_hash: string
          creado_en: string | null
          estado: boolean | null
          id_rol: number | null
          id_usuario: number
          nombre_usuario: string
        }
        Insert: {
          auth_id?: string | null
          contrasena_hash: string
          creado_en?: string | null
          estado?: boolean | null
          id_rol?: number | null
          id_usuario?: number
          nombre_usuario: string
        }
        Update: {
          auth_id?: string | null
          contrasena_hash?: string
          creado_en?: string | null
          estado?: boolean | null
          id_rol?: number | null
          id_usuario?: number
          nombre_usuario?: string
        }
        Relationships: [
          {
            foreignKeyName: "usuarios_id_rol_fkey"
            columns: ["id_rol"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id_rol"]
          },
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

