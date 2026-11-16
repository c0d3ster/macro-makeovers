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
      cart_handoffs: {
        Row: {
          created_at: string
          error_code: string | null
          grocer: string
          id: string
          item_count: number
          outcome: string
          unmatched_count: number
          user_id: string | null
        }
        ComputedFields: never
        Insert: {
          created_at?: string
          error_code?: string | null
          grocer: string
          id?: string
          item_count: number
          outcome: string
          unmatched_count: number
          user_id?: string | null
        }
        Update: {
          created_at?: string
          error_code?: string | null
          grocer?: string
          id?: string
          item_count?: number
          outcome?: string
          unmatched_count?: number
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'cart_handoffs_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'users'
            referencedColumns: ['id']
          },
        ]
      }
      email_subscribers: {
        Row: {
          confirmation_sent_at: string | null
          confirmed_at: string | null
          created_at: string
          email: string
          id: string
          signup_campaign: string | null
          signup_medium: string | null
          signup_path: string | null
          signup_source: string | null
          status: Database['public']['Enums']['email_subscriber_status']
          token: string
          unsubscribed_at: string | null
          updated_at: string
          user_id: string | null
        }
        ComputedFields: never
        Insert: {
          confirmation_sent_at?: string | null
          confirmed_at?: string | null
          created_at?: string
          email: string
          id?: string
          signup_campaign?: string | null
          signup_medium?: string | null
          signup_path?: string | null
          signup_source?: string | null
          status?: Database['public']['Enums']['email_subscriber_status']
          token: string
          unsubscribed_at?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          confirmation_sent_at?: string | null
          confirmed_at?: string | null
          created_at?: string
          email?: string
          id?: string
          signup_campaign?: string | null
          signup_medium?: string | null
          signup_path?: string | null
          signup_source?: string | null
          status?: Database['public']['Enums']['email_subscriber_status']
          token?: string
          unsubscribed_at?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'email_subscribers_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'users'
            referencedColumns: ['id']
          },
        ]
      }
      ingredients: {
        Row: {
          category: string | null
          group_name: string | null
          id: string
          name: string | null
          note: string | null
          only_builds: string[]
          position: number
          quantity: number | null
          raw_text: string
          recipe_id: string
          search: unknown
          skip_builds: string[]
          unit: string | null
        }
        ComputedFields: never
        Insert: {
          category?: string | null
          group_name?: string | null
          id?: string
          name?: string | null
          note?: string | null
          only_builds?: string[]
          position: number
          quantity?: number | null
          raw_text: string
          recipe_id: string
          search?: never
          skip_builds?: string[]
          unit?: string | null
        }
        Update: {
          category?: string | null
          group_name?: string | null
          id?: string
          name?: string | null
          note?: string | null
          only_builds?: string[]
          position?: number
          quantity?: number | null
          raw_text?: string
          recipe_id?: string
          search?: never
          skip_builds?: string[]
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
      member_grocer: {
        Row: {
          grocer: string
          store_id: string | null
          store_name: string | null
          updated_at: string
          user_id: string
          zip: string | null
        }
        ComputedFields: never
        Insert: {
          grocer: string
          store_id?: string | null
          store_name?: string | null
          updated_at?: string
          user_id: string
          zip?: string | null
        }
        Update: {
          grocer?: string
          store_id?: string | null
          store_name?: string | null
          updated_at?: string
          user_id?: string
          zip?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'member_grocer_user_id_fkey'
            columns: ['user_id']
            isOneToOne: true
            referencedRelation: 'users'
            referencedColumns: ['id']
          },
        ]
      }
      recipe_builds: {
        Row: {
          calories: number
          carbs_g: number
          cook_minutes: number | null
          cost_tier: number | null
          course: Database['public']['Enums']['recipe_course'] | null
          difficulty: number | null
          fat_g: number
          id: string
          image_is_placeholder: boolean
          image_url: string | null
          is_default: boolean
          key: string
          label: string
          listed: boolean
          note_md: string | null
          position: number
          prep_minutes: number | null
          protein_g: number
          recipe_id: string
          swap: NonNullable<Json>
          title: string | null
        }
        ComputedFields: never
        Insert: {
          calories: number
          carbs_g: number
          cook_minutes?: number | null
          cost_tier?: number | null
          course?: Database['public']['Enums']['recipe_course'] | null
          difficulty?: number | null
          fat_g: number
          id?: string
          image_is_placeholder?: boolean
          image_url?: string | null
          is_default?: boolean
          key: string
          label: string
          listed?: boolean
          note_md?: string | null
          position?: number
          prep_minutes?: number | null
          protein_g: number
          recipe_id: string
          swap?: NonNullable<Json>
          title?: string | null
        }
        Update: {
          calories?: number
          carbs_g?: number
          cook_minutes?: number | null
          cost_tier?: number | null
          course?: Database['public']['Enums']['recipe_course'] | null
          difficulty?: number | null
          fat_g?: number
          id?: string
          image_is_placeholder?: boolean
          image_url?: string | null
          is_default?: boolean
          key?: string
          label?: string
          listed?: boolean
          note_md?: string | null
          position?: number
          prep_minutes?: number | null
          protein_g?: number
          recipe_id?: string
          swap?: NonNullable<Json>
          title?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'recipe_builds_recipe_id_fkey'
            columns: ['recipe_id']
            isOneToOne: false
            referencedRelation: 'recipes'
            referencedColumns: ['id']
          },
        ]
      }
      recipe_components: {
        Row: {
          amount: string | null
          component_build: string | null
          component_id: string
          id: string
          note_md: string | null
          only_builds: string[]
          position: number
          recipe_id: string
          servings_per_serving: number
          skip_builds: string[]
        }
        ComputedFields: never
        Insert: {
          amount?: string | null
          component_build?: string | null
          component_id: string
          id?: string
          note_md?: string | null
          only_builds?: string[]
          position: number
          recipe_id: string
          servings_per_serving?: number
          skip_builds?: string[]
        }
        Update: {
          amount?: string | null
          component_build?: string | null
          component_id?: string
          id?: string
          note_md?: string | null
          only_builds?: string[]
          position?: number
          recipe_id?: string
          servings_per_serving?: number
          skip_builds?: string[]
        }
        Relationships: [
          {
            foreignKeyName: 'recipe_components_component_id_fkey'
            columns: ['component_id']
            isOneToOne: false
            referencedRelation: 'recipes'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'recipe_components_recipe_id_fkey'
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
          only_builds: string[]
          position: number
          recipe_id: string
          skip_builds: string[]
        }
        ComputedFields: never
        Insert: {
          body_md: string
          id?: string
          kind: Database['public']['Enums']['note_kind']
          only_builds?: string[]
          position: number
          recipe_id: string
          skip_builds?: string[]
        }
        Update: {
          body_md?: string
          id?: string
          kind?: Database['public']['Enums']['note_kind']
          only_builds?: string[]
          position?: number
          recipe_id?: string
          skip_builds?: string[]
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
          course: Database['public']['Enums']['recipe_course']
          created_at: string
          difficulty: number
          id: string
          image_is_placeholder: boolean
          image_url: string | null
          makes: string | null
          prep_minutes: number
          search: unknown
          serving_size: string | null
          servings: number
          slug: string
          spice_level: number | null
          status: Database['public']['Enums']['recipe_status']
          summary: string
          title: string
          updated_at: string
          variant_of: string | null
        }
        ComputedFields: never
        Insert: {
          access?: Database['public']['Enums']['recipe_access']
          cook_minutes: number
          cost_tier: number
          course?: Database['public']['Enums']['recipe_course']
          created_at?: string
          difficulty: number
          id?: string
          image_is_placeholder?: boolean
          image_url?: string | null
          makes?: string | null
          prep_minutes: number
          search?: never
          serving_size?: string | null
          servings: number
          slug: string
          spice_level?: number | null
          status?: Database['public']['Enums']['recipe_status']
          summary: string
          title: string
          updated_at?: string
          variant_of?: string | null
        }
        Update: {
          access?: Database['public']['Enums']['recipe_access']
          cook_minutes?: number
          cost_tier?: number
          course?: Database['public']['Enums']['recipe_course']
          created_at?: string
          difficulty?: number
          id?: string
          image_is_placeholder?: boolean
          image_url?: string | null
          makes?: string | null
          prep_minutes?: number
          search?: never
          serving_size?: string | null
          servings?: number
          slug?: string
          spice_level?: number | null
          status?: Database['public']['Enums']['recipe_status']
          summary?: string
          title?: string
          updated_at?: string
          variant_of?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'recipes_variant_of_fkey'
            columns: ['variant_of']
            isOneToOne: false
            referencedRelation: 'recipes'
            referencedColumns: ['id']
          },
        ]
      }
      steps: {
        Row: {
          body_md: string
          duration_minutes: number | null
          id: string
          only_builds: string[]
          phase: Database['public']['Enums']['step_phase']
          position: number
          recipe_id: string
          skip_builds: string[]
        }
        ComputedFields: never
        Insert: {
          body_md: string
          duration_minutes?: number | null
          id?: string
          only_builds?: string[]
          phase: Database['public']['Enums']['step_phase']
          position: number
          recipe_id: string
          skip_builds?: string[]
        }
        Update: {
          body_md?: string
          duration_minutes?: number | null
          id?: string
          only_builds?: string[]
          phase?: Database['public']['Enums']['step_phase']
          position?: number
          recipe_id?: string
          skip_builds?: string[]
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
      stripe_events: {
        Row: {
          id: string
          processed_at: string
          type: string
        }
        ComputedFields: never
        Insert: {
          id: string
          processed_at?: string
          type: string
        }
        Update: {
          id?: string
          processed_at?: string
          type?: string
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          cancel_at_period_end: boolean
          created_at: string
          current_period_end: string | null
          id: string
          past_due_since: string | null
          source: Database['public']['Enums']['subscription_source']
          status: Database['public']['Enums']['subscription_status']
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          updated_at: string
          user_id: string
        }
        ComputedFields: never
        Insert: {
          cancel_at_period_end?: boolean
          created_at?: string
          current_period_end?: string | null
          id?: string
          past_due_since?: string | null
          source?: Database['public']['Enums']['subscription_source']
          status: Database['public']['Enums']['subscription_status']
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          cancel_at_period_end?: boolean
          created_at?: string
          current_period_end?: string | null
          id?: string
          past_due_since?: string | null
          source?: Database['public']['Enums']['subscription_source']
          status?: Database['public']['Enums']['subscription_status']
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'subscriptions_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'users'
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
          signup_campaign: string | null
          signup_landing_path: string | null
          signup_medium: string | null
          signup_referrer: string | null
          signup_source: string | null
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
          signup_campaign?: string | null
          signup_landing_path?: string | null
          signup_medium?: string | null
          signup_referrer?: string | null
          signup_source?: string | null
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
          signup_campaign?: string | null
          signup_landing_path?: string | null
          signup_medium?: string | null
          signup_referrer?: string | null
          signup_source?: string | null
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_paid_access: { Args: Record<PropertyKey, never>; Returns: boolean }
      is_owner: { Args: Record<PropertyKey, never>; Returns: boolean }
    }
    Enums: {
      email_subscriber_status: 'pending' | 'confirmed' | 'unsubscribed'
      note_kind:
        | 'make_or_break'
        | 'fixes'
        | 'levers'
        | 'tip'
        | 'nutrition_intro'
        | 'nutrition_analysis'
      nutrition_kind: 'makeover' | 'traditional'
      recipe_access: 'free' | 'premium'
      recipe_course: 'breakfast' | 'appetizer' | 'main' | 'side' | 'sauce'
      recipe_status: 'draft' | 'published'
      step_phase: 'prep' | 'cook'
      subscription_source: 'stripe' | 'partner'
      subscription_status:
        | 'incomplete'
        | 'incomplete_expired'
        | 'trialing'
        | 'active'
        | 'past_due'
        | 'canceled'
        | 'unpaid'
        | 'paused'
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
      email_subscriber_status: ['pending', 'confirmed', 'unsubscribed'],
      note_kind: [
        'make_or_break',
        'fixes',
        'levers',
        'tip',
        'nutrition_intro',
        'nutrition_analysis',
      ],
      nutrition_kind: ['makeover', 'traditional'],
      recipe_access: ['free', 'premium'],
      recipe_course: ['breakfast', 'appetizer', 'main', 'side', 'sauce'],
      recipe_status: ['draft', 'published'],
      step_phase: ['prep', 'cook'],
      subscription_source: ['stripe', 'partner'],
      subscription_status: [
        'incomplete',
        'incomplete_expired',
        'trialing',
        'active',
        'past_due',
        'canceled',
        'unpaid',
        'paused',
      ],
      tag_kind: ['category', 'method', 'attribute'],
      user_role: ['client', 'developer', 'admin', 'super_admin'],
    },
  },
} as const
