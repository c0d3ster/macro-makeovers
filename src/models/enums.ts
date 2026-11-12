import { pgEnum } from 'drizzle-orm/pg-core'

import { UserRole } from '@/graphql/schema/user'

// User role enum for database
export const userRoleEnum = pgEnum('user_role', [
  UserRole.Client,
  UserRole.Developer,
  UserRole.Admin,
  UserRole.SuperAdmin,
])

// Recipe enums. Values mirror the Postgres enums in supabase/migrations.
export const recipeStatusEnum = pgEnum('recipe_status', ['draft', 'published'])
export const recipeAccessEnum = pgEnum('recipe_access', ['free', 'premium'])
export const recipeCourseEnum = pgEnum('recipe_course', [
  'breakfast',
  'appetizer',
  'main',
  'side',
  'sauce',
])
export const nutritionKindEnum = pgEnum('nutrition_kind', [
  'makeover',
  'traditional',
])
export const stepPhaseEnum = pgEnum('step_phase', ['prep', 'cook'])
export const noteKindEnum = pgEnum('note_kind', [
  'make_or_break',
  'fixes',
  'levers',
  'tip',
  'nutrition_intro',
  'nutrition_analysis',
])
export const tagKindEnum = pgEnum('tag_kind', [
  'category',
  'method',
  'attribute',
])
