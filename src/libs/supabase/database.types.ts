export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
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
  public: {
    Tables: {
      ingredients: {
        Row: {
          category: string | null
          group_name: string | null
          id: string
          name: string | null
          note: string | null
          position: number
          quantity: number | null
          raw_text: string
          recipe_id: string
          search: unknown
          unit: string | null
        }
        ComputedFields: never
        Insert: {
          category?: string | null
          group_name?: string | null
          id?: string
          name?: string | null
          note?: string | null
          position: number
          quantity?: number | null
          raw_text: string
          recipe_id: string
          search?: never
          unit?: string | null
        }
        Update: {
          category?: string | null
          group_name?: string | null
          id?: string
          name?: string | null
          note?: string | null
          position?: number
          quantity?: number | null
          raw_text?: string
          recipe_id?: string
          search?: never
          unit?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'ingredients_recipe_id_fkey'
            columns: ['recipe_id']
            isOneToOne: false
            referencedRelation: 'recipes'
            referencedColumns: ['id']
          },
        ]
      }
      recipe_notes: {
        Row: {
          body_md: string
          id: string
          kind: Database['public']['Enums']['note_kind']
          position: number
          recipe_id: string
        }
        ComputedFields: never
        Insert: {
          body_md: string
          id?: string
          kind: Database['public']['Enums']['note_kind']
          position: number
          recipe_id: string
        }
        Update: {
          body_md?: string
          id?: string
          kind?: Database['public']['Enums']['note_kind']
          position?: number
          recipe_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'recipe_notes_recipe_id_fkey'
            columns: ['recipe_id']
            isOneToOne: false
            referencedRelation: 'recipes'
            referencedColumns: ['id']
          },
        ]
      }
      recipe_nutrition: {
        Row: {
          calories: number
          carbs_g: number
          fat_g: number
          id: string
          is_default: boolean
          kind: Database['public']['Enums']['nutrition_kind']
          label: string
          position: number
          protein_g: number
          recipe_id: string
        }
        ComputedFields: never
        Insert: {
          calories: number
          carbs_g: number
          fat_g: number
          id?: string
          is_default?: boolean
          kind: Database['public']['Enums']['nutrition_kind']
          label: string
          position?: number
          protein_g: number
          recipe_id: string
        }
        Update: {
          calories?: number
          carbs_g?: number
          fat_g?: number
          id?: string
          is_default?: boolean
          kind?: Database['public']['Enums']['nutrition_kind']
          label?: string
          position?: number
          protein_g?: number
          recipe_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'recipe_nutrition_recipe_id_fkey'
            columns: ['recipe_id']
            isOneToOne: false
            referencedRelation: 'recipes'
            referencedColumns: ['id']
          },
        ]
      }
      recipe_revisions: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          recipe_id: string
          snapshot: NonNullable<Json>
        }
        ComputedFields: never
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          recipe_id: string
          snapshot: NonNullable<Json>
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          recipe_id?: string
          snapshot?: NonNullable<Json>
        }
        Relationships: [
          {
            foreignKeyName: 'recipe_revisions_recipe_id_fkey'
            columns: ['recipe_id']
            isOneToOne: false
            referencedRelation: 'recipes'
            referencedColumns: ['id']
          },
        ]
      }
      recipe_tags: {
        Row: {
          recipe_id: string
          tag_id: string
        }
        ComputedFields: never
        Insert: {
          recipe_id: string
          tag_id: string
        }
        Update: {
          recipe_id?: string
          tag_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'recipe_tags_recipe_id_fkey'
            columns: ['recipe_id']
            isOneToOne: false
            referencedRelation: 'recipes'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'recipe_tags_tag_id_fkey'
            columns: ['tag_id']
            isOneToOne: false
            referencedRelation: 'tags'
            referencedColumns: ['id']
          },
        ]
      }
      recipes: {
        Row: {
          access: Database['public']['Enums']['recipe_access']
          cook_minutes: number
          cost_tier: number
          created_at: string
          difficulty: number
          id: string
          image_url: string | null
          prep_minutes: number
          search: unknown
          servings: number
          slug: string
          status: Database['public']['Enums']['recipe_status']
          summary: string
          title: string
          updated_at: string
        }
        ComputedFields: never
        Insert: {
          access?: Database['public']['Enums']['recipe_access']
          cook_minutes: number
          cost_tier: number
          created_at?: string
          difficulty: number
          id?: string
          image_url?: string | null
          prep_minutes: number
          search?: never
          servings: number
          slug: string
          status?: Database['public']['Enums']['recipe_status']
          summary: string
          title: string
          updated_at?: string
        }
        Update: {
          access?: Database['public']['Enums']['recipe_access']
          cook_minutes?: number
          cost_tier?: number
          created_at?: string
          difficulty?: number
          id?: string
          image_url?: string | null
          prep_minutes?: number
          search?: never
          servings?: number
          slug?: string
          status?: Database['public']['Enums']['recipe_status']
          summary?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      steps: {
        Row: {
          body_md: string
          duration_minutes: number | null
          id: string
          phase: Database['public']['Enums']['step_phase']
          position: number
          recipe_id: string
        }
        ComputedFields: never
        Insert: {
          body_md: string
          duration_minutes?: number | null
          id?: string
          phase: Database['public']['Enums']['step_phase']
          position: number
          recipe_id: string
        }
        Update: {
          body_md?: string
          duration_minutes?: number | null
          id?: string
          phase?: Database['public']['Enums']['step_phase']
          position?: number
          recipe_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'steps_recipe_id_fkey'
            columns: ['recipe_id']
            isOneToOne: false
            referencedRelation: 'recipes'
            referencedColumns: ['id']
          },
        ]
      }
      tags: {
        Row: {
          id: string
          kind: Database['public']['Enums']['tag_kind']
          name: string
        }
        ComputedFields: never
        Insert: {
          id?: string
          kind: Database['public']['Enums']['tag_kind']
          name: string
        }
        Update: {
          id?: string
          kind?: Database['public']['Enums']['tag_kind']
          name?: string
        }
        Relationships: []
      }
      users: {
        Row: {
          auth_id: string
          avatar_url: string | null
          created_at: string
          email: string
          first_name: string | null
          id: string
          last_name: string | null
          role: Database['public']['Enums']['user_role']
          updated_at: string
        }
        ComputedFields: never
        Insert: {
          auth_id: string
          avatar_url?: string | null
          created_at?: string
          email: string
          first_name?: string | null
          id?: string
          last_name?: string | null
          role?: Database['public']['Enums']['user_role']
          updated_at?: string
        }
        Update: {
          auth_id?: string
          avatar_url?: string | null
          created_at?: string
          email?: string
          first_name?: string | null
          id?: string
          last_name?: string | null
          role?: Database['public']['Enums']['user_role']
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      import_recipe: { Args: { p_recipe: Json }; Returns: string }
      is_owner: { Args: Record<PropertyKey, never>; Returns: boolean }
      recipe_snapshot: { Args: { p_recipe_id: string }; Returns: Json }
    }
    Enums: {
      note_kind: 'make_or_break' | 'fixes' | 'levers' | 'tip'
      nutrition_kind: 'makeover' | 'traditional'
      recipe_access: 'free' | 'premium'
      recipe_status: 'draft' | 'published'
      step_phase: 'prep' | 'cook'
      tag_kind: 'category' | 'method' | 'attribute'
      user_role: 'client' | 'developer' | 'admin' | 'super_admin'
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, 'public'>]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema['Tables'] &
        DefaultSchema['Views'])
    ? (DefaultSchema['Tables'] &
        DefaultSchema['Views'])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema['Tables'] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema['Tables'] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    keyof DefaultSchema['Enums'] | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums']
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums'][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema['Enums']
    ? DefaultSchema['Enums'][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema['CompositeTypes']
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes']
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes'][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema['CompositeTypes']
    ? DefaultSchema['CompositeTypes'][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      note_kind: ['make_or_break', 'fixes', 'levers', 'tip'],
      nutrition_kind: ['makeover', 'traditional'],
      recipe_access: ['free', 'premium'],
      recipe_status: ['draft', 'published'],
      step_phase: ['prep', 'cook'],
      tag_kind: ['category', 'method', 'attribute'],
      user_role: ['client', 'developer', 'admin', 'super_admin'],
    },
  },
} as const
