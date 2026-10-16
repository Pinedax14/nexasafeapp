export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: '14.18';
  };
  public: {
    Tables: {
      alertas: {
        Row: {
          cancelable_hasta: string;
          cerrada_en: string | null;
          cerrada_por: string | null;
          clasificacion: Database['public']['Enums']['clasificacion_alerta'] | null;
          creada_en: string;
          estado: Database['public']['Enums']['estado_alerta'];
          id: string;
          nota: string | null;
          notificada_en: string | null;
          protegido_id: string;
          tipo: Database['public']['Enums']['tipo_alerta'];
          trayecto_id: string | null;
        };
        Insert: {
          cancelable_hasta?: string;
          cerrada_en?: string | null;
          cerrada_por?: string | null;
          clasificacion?: Database['public']['Enums']['clasificacion_alerta'] | null;
          creada_en?: string;
          estado?: Database['public']['Enums']['estado_alerta'];
          id?: string;
          nota?: string | null;
          notificada_en?: string | null;
          protegido_id: string;
          tipo?: Database['public']['Enums']['tipo_alerta'];
          trayecto_id?: string | null;
        };
        Update: {
          cancelable_hasta?: string;
          cerrada_en?: string | null;
          cerrada_por?: string | null;
          clasificacion?: Database['public']['Enums']['clasificacion_alerta'] | null;
          creada_en?: string;
          estado?: Database['public']['Enums']['estado_alerta'];
          id?: string;
          nota?: string | null;
          notificada_en?: string | null;
          protegido_id?: string;
          tipo?: Database['public']['Enums']['tipo_alerta'];
          trayecto_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'alertas_protegido_id_fkey';
            columns: ['protegido_id'];
            isOneToOne: false;
            referencedRelation: 'protegidos';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'alertas_trayecto_id_fkey';
            columns: ['trayecto_id'];
            isOneToOne: false;
            referencedRelation: 'trayectos';
            referencedColumns: ['id'];
          },
        ];
      };
      audit_log: {
        Row: {
          accion: string;
          actor_id: string | null;
          creado_en: string;
          entidad: string;
          entidad_id: string | null;
          id: number;
        };
        Insert: {
          accion: string;
          actor_id?: string | null;
          creado_en?: string;
          entidad: string;
          entidad_id?: string | null;
          id?: never;
        };
        Update: {
          accion?: string;
          actor_id?: string | null;
          creado_en?: string;
          entidad?: string;
          entidad_id?: string | null;
          id?: never;
        };
        Relationships: [];
      };
      colegios: {
        Row: {
          creado_en: string;
          id: string;
          nit: string;
          nombre: string;
        };
        Insert: {
          creado_en?: string;
          id?: string;
          nit: string;
          nombre: string;
        };
        Update: {
          creado_en?: string;
          id?: string;
          nit?: string;
          nombre?: string;
        };
        Relationships: [];
      };
      consentimientos: {
        Row: {
          aceptado_en: string;
          guardian_id: string;
          id: string;
          protegido_id: string;
          tipo: Database['public']['Enums']['tipo_consentimiento'];
          version_politica: string;
        };
        Insert: {
          aceptado_en?: string;
          guardian_id: string;
          id?: string;
          protegido_id: string;
          tipo: Database['public']['Enums']['tipo_consentimiento'];
          version_politica: string;
        };
        Update: {
          aceptado_en?: string;
          guardian_id?: string;
          id?: string;
          protegido_id?: string;
          tipo?: Database['public']['Enums']['tipo_consentimiento'];
          version_politica?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'consentimientos_guardian_id_fkey';
            columns: ['guardian_id'];
            isOneToOne: false;
            referencedRelation: 'guardianes';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'consentimientos_protegido_id_fkey';
            columns: ['protegido_id'];
            isOneToOne: false;
            referencedRelation: 'protegidos';
            referencedColumns: ['id'];
          },
        ];
      };
      contactos_apoyo: {
        Row: {
          aceptada_en: string | null;
          alcance_visibilidad: Database['public']['Enums']['alcance_visibilidad'];
          creado_en: string;
          guardian_id: string;
          id: string;
          nombre: string | null;
          protegido_id: string;
          token_hash: string;
          usuario_id: string | null;
          vence_en: string;
        };
        Insert: {
          aceptada_en?: string | null;
          alcance_visibilidad?: Database['public']['Enums']['alcance_visibilidad'];
          creado_en?: string;
          guardian_id: string;
          id?: string;
          nombre?: string | null;
          protegido_id: string;
          token_hash: string;
          usuario_id?: string | null;
          vence_en?: string;
        };
        Update: {
          aceptada_en?: string | null;
          alcance_visibilidad?: Database['public']['Enums']['alcance_visibilidad'];
          creado_en?: string;
          guardian_id?: string;
          id?: string;
          nombre?: string | null;
          protegido_id?: string;
          token_hash?: string;
          usuario_id?: string | null;
          vence_en?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'contactos_apoyo_guardian_id_fkey';
            columns: ['guardian_id'];
            isOneToOne: false;
            referencedRelation: 'guardianes';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'contactos_apoyo_protegido_id_fkey';
            columns: ['protegido_id'];
            isOneToOne: false;
            referencedRelation: 'protegidos';
            referencedColumns: ['id'];
          },
        ];
      };
      dispositivos_push: {
        Row: {
          actualizado_en: string;
          token: string;
          usuario_id: string;
        };
        Insert: {
          actualizado_en?: string;
          token: string;
          usuario_id: string;
        };
        Update: {
          actualizado_en?: string;
          token?: string;
          usuario_id?: string;
        };
        Relationships: [];
      };
      eventos_incidente: {
        Row: {
          actor_id: string | null;
          alerta_id: string;
          creado_en: string;
          detalle: string | null;
          id: number;
          tipo_evento: Database['public']['Enums']['tipo_evento_incidente'];
        };
        Insert: {
          actor_id?: string | null;
          alerta_id: string;
          creado_en?: string;
          detalle?: string | null;
          id?: never;
          tipo_evento: Database['public']['Enums']['tipo_evento_incidente'];
        };
        Update: {
          actor_id?: string | null;
          alerta_id?: string;
          creado_en?: string;
          detalle?: string | null;
          id?: never;
          tipo_evento?: Database['public']['Enums']['tipo_evento_incidente'];
        };
        Relationships: [
          {
            foreignKeyName: 'eventos_incidente_alerta_id_fkey';
            columns: ['alerta_id'];
            isOneToOne: false;
            referencedRelation: 'alertas';
            referencedColumns: ['id'];
          },
        ];
      };
      guardianes: {
        Row: {
          creado_en: string;
          email: string;
          id: string;
          nombre: string;
        };
        Insert: {
          creado_en?: string;
          email: string;
          id: string;
          nombre: string;
        };
        Update: {
          creado_en?: string;
          email?: string;
          id?: string;
          nombre?: string;
        };
        Relationships: [];
      };
      personal_institucion: {
        Row: {
          activo: boolean;
          cargo: string | null;
          colegio_id: string;
          creado_en: string;
          id: string;
          nombre: string;
        };
        Insert: {
          activo?: boolean;
          cargo?: string | null;
          colegio_id: string;
          creado_en?: string;
          id: string;
          nombre: string;
        };
        Update: {
          activo?: boolean;
          cargo?: string | null;
          colegio_id?: string;
          creado_en?: string;
          id?: string;
          nombre?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'personal_institucion_colegio_id_fkey';
            columns: ['colegio_id'];
            isOneToOne: false;
            referencedRelation: 'colegios';
            referencedColumns: ['id'];
          },
        ];
      };
      posiciones: {
        Row: {
          alerta_id: string | null;
          capturada_en: string;
          id: number;
          precision_m: number;
          protegido_id: string;
          recibida_en: string;
          trayecto_id: string | null;
          ubicacion_cifrada: string;
        };
        Insert: {
          alerta_id?: string | null;
          capturada_en: string;
          id?: never;
          precision_m: number;
          protegido_id: string;
          recibida_en?: string;
          trayecto_id?: string | null;
          ubicacion_cifrada: string;
        };
        Update: {
          alerta_id?: string | null;
          capturada_en?: string;
          id?: never;
          precision_m?: number;
          protegido_id?: string;
          recibida_en?: string;
          trayecto_id?: string | null;
          ubicacion_cifrada?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'posiciones_alerta_id_fkey';
            columns: ['alerta_id'];
            isOneToOne: false;
            referencedRelation: 'alertas';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'posiciones_protegido_id_fkey';
            columns: ['protegido_id'];
            isOneToOne: false;
            referencedRelation: 'protegidos';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'posiciones_trayecto_id_fkey';
            columns: ['trayecto_id'];
            isOneToOne: false;
            referencedRelation: 'trayectos';
            referencedColumns: ['id'];
          },
        ];
      };
      protegidos: {
        Row: {
          colegio_id: string;
          creado_en: string;
          documento_cifrado: string;
          documento_huella: string;
          estado: Database['public']['Enums']['estado_protegido'];
          foto_path: string | null;
          guardian_id: string;
          id: string;
          nombre: string;
          pin_bloqueado_hasta: string | null;
          pin_hash: string | null;
          pin_intentos_fallidos: number;
          usuario_id: string | null;
          validado_en: string | null;
          validado_por: string | null;
        };
        Insert: {
          colegio_id: string;
          creado_en?: string;
          documento_cifrado: string;
          documento_huella: string;
          estado?: Database['public']['Enums']['estado_protegido'];
          foto_path?: string | null;
          guardian_id: string;
          id?: string;
          nombre: string;
          pin_bloqueado_hasta?: string | null;
          pin_hash?: string | null;
          pin_intentos_fallidos?: number;
          usuario_id?: string | null;
          validado_en?: string | null;
          validado_por?: string | null;
        };
        Update: {
          colegio_id?: string;
          creado_en?: string;
          documento_cifrado?: string;
          documento_huella?: string;
          estado?: Database['public']['Enums']['estado_protegido'];
          foto_path?: string | null;
          guardian_id?: string;
          id?: string;
          nombre?: string;
          pin_bloqueado_hasta?: string | null;
          pin_hash?: string | null;
          pin_intentos_fallidos?: number;
          usuario_id?: string | null;
          validado_en?: string | null;
          validado_por?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'protegidos_colegio_id_fkey';
            columns: ['colegio_id'];
            isOneToOne: false;
            referencedRelation: 'colegios';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'protegidos_guardian_id_fkey';
            columns: ['guardian_id'];
            isOneToOne: false;
            referencedRelation: 'guardianes';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'protegidos_validado_por_fkey';
            columns: ['validado_por'];
            isOneToOne: false;
            referencedRelation: 'personal_institucion';
            referencedColumns: ['id'];
          },
        ];
      };
      rutas: {
        Row: {
          actualizado_en: string;
          corredor_m: number;
          creado_en: string;
          duracion_esperada_min: number;
          geometria: unknown;
          id: string;
          protegido_id: string;
          sentido: Database['public']['Enums']['sentido_ruta'];
        };
        Insert: {
          actualizado_en?: string;
          corredor_m?: number;
          creado_en?: string;
          duracion_esperada_min: number;
          geometria: unknown;
          id?: string;
          protegido_id: string;
          sentido: Database['public']['Enums']['sentido_ruta'];
        };
        Update: {
          actualizado_en?: string;
          corredor_m?: number;
          creado_en?: string;
          duracion_esperada_min?: number;
          geometria?: unknown;
          id?: string;
          protegido_id?: string;
          sentido?: Database['public']['Enums']['sentido_ruta'];
        };
        Relationships: [
          {
            foreignKeyName: 'rutas_protegido_id_fkey';
            columns: ['protegido_id'];
            isOneToOne: false;
            referencedRelation: 'protegidos';
            referencedColumns: ['id'];
          },
        ];
      };
      trayectos: {
        Row: {
          estado: Database['public']['Enums']['estado_trayecto'];
          fin_en: string | null;
          id: string;
          inicio_en: string;
          protegido_id: string;
          ruta_id: string;
        };
        Insert: {
          estado?: Database['public']['Enums']['estado_trayecto'];
          fin_en?: string | null;
          id?: string;
          inicio_en?: string;
          protegido_id: string;
          ruta_id: string;
        };
        Update: {
          estado?: Database['public']['Enums']['estado_trayecto'];
          fin_en?: string | null;
          id?: string;
          inicio_en?: string;
          protegido_id?: string;
          ruta_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'trayectos_protegido_id_fkey';
            columns: ['protegido_id'];
            isOneToOne: false;
            referencedRelation: 'protegidos';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'trayectos_ruta_id_fkey';
            columns: ['ruta_id'];
            isOneToOne: false;
            referencedRelation: 'rutas';
            referencedColumns: ['id'];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      aceptar_invitacion: { Args: { p_token: string }; Returns: string };
      borrar_dispositivo: { Args: { p_token: string }; Returns: undefined };
      cancelar_alerta_verificada: {
        Args: {
          p_actor_id: string;
          p_alerta_id: string;
          p_protegido_id: string;
        };
        Returns: boolean;
      };
      cerrar_alerta: {
        Args: {
          p_alerta_id: string;
          p_clasificacion: Database['public']['Enums']['clasificacion_alerta'];
          p_nota: string;
        };
        Returns: undefined;
      };
      crear_invitacion: {
        Args: { p_protegido_id: string };
        Returns: {
          id: string;
          token: string;
          vence_en: string;
        }[];
      };
      disparar_alerta: {
        Args: never;
        Returns: {
          cancelable_hasta: string;
          creada_en: string;
          estado: Database['public']['Enums']['estado_alerta'];
          id: string;
        }[];
      };
      guardar_ruta: {
        Args: {
          p_corredor_m: number;
          p_duracion_min: number;
          p_geojson: Json;
          p_protegido_id: string;
          p_sentido: Database['public']['Enums']['sentido_ruta'];
        };
        Returns: string;
      };
      iniciar_trayecto: { Args: { p_ruta_id: string }; Returns: string };
      listar_alertas: {
        Args: { p_solo_activas: boolean };
        Returns: {
          cancelable_hasta: string;
          cerrada_en: string;
          clasificacion: Database['public']['Enums']['clasificacion_alerta'];
          creada_en: string;
          estado: Database['public']['Enums']['estado_alerta'];
          id: string;
          menor: string;
          protegido_id: string;
        }[];
      };
      obtener_bitacora: {
        Args: { p_alerta_id: string };
        Returns: {
          actor: string;
          creado_en: string;
          detalle: string;
          tipo_evento: Database['public']['Enums']['tipo_evento_incidente'];
        }[];
      };
      obtener_protegido: {
        Args: { p_protegido_id: string };
        Returns: {
          colegio_id: string;
          documento: string;
          estado: Database['public']['Enums']['estado_protegido'];
          foto_path: string;
          id: string;
          nombre: string;
        }[];
      };
      obtener_rutas: {
        Args: { p_protegido_id: string };
        Returns: {
          actualizado_en: string;
          corredor_m: number;
          duracion_esperada_min: number;
          geojson: Json;
          id: string;
          sentido: Database['public']['Enums']['sentido_ruta'];
        }[];
      };
      obtener_ultima_posicion: {
        Args: { p_protegido_id: string };
        Returns: {
          alerta_id: string;
          lat: number;
          lng: number;
          precision_m: number;
          recibida_en: string;
          trayecto_id: string;
        }[];
      };
      pin_huella_documento: { Args: { p_documento: string }; Returns: string };
      pin_ip_bloqueada: { Args: { p_ip: string }; Returns: boolean };
      pin_registrar_fallo_ip: { Args: { p_ip: string }; Returns: undefined };
      registrar_dispositivo: { Args: { p_token: string }; Returns: undefined };
      registrar_posicion: {
        Args: {
          p_capturada_en: string;
          p_lat: number;
          p_lng: number;
          p_precision_m: number;
        };
        Returns: {
          aceptada: boolean;
          alerta_activa: boolean;
          trayecto_activo: boolean;
          trayecto_cerrado: boolean;
        }[];
      };
      registrar_protegido: {
        Args: {
          p_colegio_id: string;
          p_documento: string;
          p_foto_path: string;
          p_nombre: string;
          p_version_politica: string;
        };
        Returns: string;
      };
      responder_alerta: { Args: { p_alerta_id: string }; Returns: undefined };
      resumen_alertas_colegio: {
        Args: { p_dias: number };
        Returns: {
          clasificacion: string;
          dia: string;
          total: number;
        }[];
      };
      tomar_alerta_para_aviso: {
        Args: { p_alerta_id: string };
        Returns: {
          menor: string;
          tokens: string[];
        }[];
      };
      validar_protegido: {
        Args: { p_protegido_id: string };
        Returns: undefined;
      };
      ver_invitacion: {
        Args: { p_token: string };
        Returns: {
          guardian: string;
          menor: string;
        }[];
      };
      version_politica_vigente: { Args: never; Returns: string };
    };
    Enums: {
      alcance_visibilidad: 'SOLO_ALERTAS';
      clasificacion_alerta: 'FALSA_ALARMA' | 'SITUACION_RESUELTA' | 'REMITIDA_A_AUTORIDAD';
      estado_alerta: 'ENVIADA' | 'CANCELADA' | 'ATENDIDA' | 'CERRADA';
      estado_protegido: 'PENDIENTE_VALIDACION' | 'ACTIVO' | 'INACTIVO';
      estado_trayecto: 'EN_CURSO' | 'CERRADO';
      sentido_ruta: 'CASA_COLEGIO' | 'COLEGIO_CASA';
      tipo_alerta: 'MANUAL_BOTON';
      tipo_consentimiento: 'OTORGADO' | 'REVOCADO';
      tipo_evento_incidente: 'DISPARADA' | 'CANCELADA' | 'NOTIFICADA' | 'VOY_EN_CAMINO' | 'CERRADA';
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, 'public'>];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    ? (DefaultSchema['Tables'] & DefaultSchema['Views'])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema['Tables'] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema['Tables'] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    keyof DefaultSchema['Enums'] | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums']
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums'][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema['Enums']
    ? DefaultSchema['Enums'][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    keyof DefaultSchema['CompositeTypes'] | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes']
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes'][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema['CompositeTypes']
    ? DefaultSchema['CompositeTypes'][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {
      alcance_visibilidad: ['SOLO_ALERTAS'],
      clasificacion_alerta: ['FALSA_ALARMA', 'SITUACION_RESUELTA', 'REMITIDA_A_AUTORIDAD'],
      estado_alerta: ['ENVIADA', 'CANCELADA', 'ATENDIDA', 'CERRADA'],
      estado_protegido: ['PENDIENTE_VALIDACION', 'ACTIVO', 'INACTIVO'],
      estado_trayecto: ['EN_CURSO', 'CERRADO'],
      sentido_ruta: ['CASA_COLEGIO', 'COLEGIO_CASA'],
      tipo_alerta: ['MANUAL_BOTON'],
      tipo_consentimiento: ['OTORGADO', 'REVOCADO'],
      tipo_evento_incidente: ['DISPARADA', 'CANCELADA', 'NOTIFICADA', 'VOY_EN_CAMINO', 'CERRADA'],
    },
  },
} as const;
