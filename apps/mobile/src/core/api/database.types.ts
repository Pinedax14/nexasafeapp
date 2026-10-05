export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: '14.18';
  };
  public: {
    Tables: {
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
      protegidos: {
        Row: {
          colegio_id: string;
          creado_en: string;
          documento_cifrado: string;
          estado: Database['public']['Enums']['estado_protegido'];
          foto_path: string | null;
          guardian_id: string;
          id: string;
          nombre: string;
          pin_hash: string | null;
          validado_en: string | null;
          validado_por: string | null;
        };
        Insert: {
          colegio_id: string;
          creado_en?: string;
          documento_cifrado: string;
          estado?: Database['public']['Enums']['estado_protegido'];
          foto_path?: string | null;
          guardian_id: string;
          id?: string;
          nombre: string;
          pin_hash?: string | null;
          validado_en?: string | null;
          validado_por?: string | null;
        };
        Update: {
          colegio_id?: string;
          creado_en?: string;
          documento_cifrado?: string;
          estado?: Database['public']['Enums']['estado_protegido'];
          foto_path?: string | null;
          guardian_id?: string;
          id?: string;
          nombre?: string;
          pin_hash?: string | null;
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
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
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
      validar_protegido: {
        Args: { p_protegido_id: string };
        Returns: undefined;
      };
      version_politica_vigente: { Args: never; Returns: string };
    };
    Enums: {
      estado_protegido: 'PENDIENTE_VALIDACION' | 'ACTIVO' | 'INACTIVO';
      tipo_consentimiento: 'OTORGADO' | 'REVOCADO';
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
      estado_protegido: ['PENDIENTE_VALIDACION', 'ACTIVO', 'INACTIVO'],
      tipo_consentimiento: ['OTORGADO', 'REVOCADO'],
    },
  },
} as const;
