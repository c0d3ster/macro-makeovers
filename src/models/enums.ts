import { pgEnum } from 'drizzle-orm/pg-core'

import { UserRole } from '@/graphql/schema/user'

// User role enum for database
export const userRoleEnum = pgEnum('user_role', [
  UserRole.Client,
  UserRole.Developer,
  UserRole.Admin,
  UserRole.SuperAdmin,
])
