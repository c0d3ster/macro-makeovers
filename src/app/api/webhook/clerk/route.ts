import 'reflect-metadata'

import type { NextRequest } from 'next/server'

import { eq } from 'drizzle-orm'
import { headers } from 'next/headers'
import { NextResponse } from 'next/server'
import { Webhook } from 'svix'

import { db } from '@/libs/DB'
import { logger } from '@/libs/Logger'
import { users } from '@/models'

export async function POST(request: NextRequest) {
  logger.info('Webhook POST request received', {
    url: request.url,
    method: request.method,
    userAgent: request.headers.get('user-agent'),
  })

  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET

  if (!WEBHOOK_SECRET) {
    logger.error('CLERK_WEBHOOK_SECRET not configured')
    return NextResponse.json(
      { error: 'Server misconfiguration' },
      { status: 500 }
    )
  }

  // Get the headers
  const headerPayload = await headers()
  const svix_id = headerPayload.get('svix-id')
  const svix_timestamp = headerPayload.get('svix-timestamp')
  const svix_signature = headerPayload.get('svix-signature')

  // If there are no headers, error out
  if (!svix_id || !svix_timestamp || !svix_signature) {
    logger.warn('Webhook missing required headers', {
      has_id: Boolean(svix_id),
      has_timestamp: Boolean(svix_timestamp),
      has_signature: Boolean(svix_signature),
    })
    return new Response('Error occurred -- no svix headers', {
      status: 400,
    })
  }

  // Get the body
  const payload = await request.text()

  // Create a new Svix instance with your secret.
  const wh = new Webhook(WEBHOOK_SECRET)

  let evt: any

  // Verify the payload with the headers
  try {
    evt = wh.verify(payload, {
      'svix-id': svix_id,
      'svix-timestamp': svix_timestamp,
      'svix-signature': svix_signature,
    })
  } catch (err) {
    logger.error('Webhook verification failed', { error: err, svix_id })
    return new Response('Error occurred', {
      status: 400,
    })
  }

  // Get the ID and type
  const { id } = evt.data
  const eventType = evt.type

  logger.info('Webhook received', { id, eventType })

  if (eventType === 'user.created') {
    const { id: clerkId, email_addresses, first_name, last_name } = evt.data

    const email = email_addresses?.[0]?.email_address

    if (!email) {
      logger.warn('User creation failed: email is required', { clerkId })
      return NextResponse.json(
        { error: 'Email is required for user creation' },
        { status: 422 }
      )
    }

    try {
      await db
        .insert(users)
        .values({
          clerkId,
          email,
          firstName: first_name || null,
          lastName: last_name || null,
        })
        .onConflictDoUpdate({
          target: users.clerkId, // Only update if same clerkId
          set: {
            email,
            firstName: first_name || null,
            lastName: last_name || null,
            updatedAt: new Date(),
          },
        })
      logger.info('User upserted in database', { clerkId })
    } catch (error) {
      logger.error('Error upserting user in database', { error, clerkId })
      return NextResponse.json(
        { error: 'Failed to upsert user record' },
        { status: 500 }
      )
    }
  }

  if (eventType === 'user.updated') {
    const { id: clerkId, email_addresses, first_name, last_name } = evt.data

    const email = email_addresses?.[0]?.email_address
    try {
      const updateSet: Partial<typeof users.$inferSelect> = {
        firstName: first_name || null,
        lastName: last_name || null,
        updatedAt: new Date(),
      }
      if (email) updateSet.email = email

      const result = await db
        .update(users)
        .set(updateSet)
        .where(eq(users.clerkId, clerkId))

      if (!result.rowCount || result.rowCount === 0) {
        logger.warn('User not found for update', { clerkId })
        return NextResponse.json({ error: 'User not found' }, { status: 404 })
      }

      logger.info('User updated in database', { clerkId })
    } catch (error) {
      logger.error('Error updating user in database', { error, clerkId })
      return NextResponse.json(
        { error: 'Failed to update user record' },
        { status: 500 }
      )
    }
  }

  if (eventType === 'user.deleted') {
    const { id: clerkId } = evt.data

    try {
      await db.delete(users).where(eq(users.clerkId, clerkId))
      logger.info('User deleted from database', { clerkId })
    } catch (error) {
      logger.error('Error deleting user from database', { error, clerkId })
      return NextResponse.json(
        { error: 'Failed to delete user record' },
        { status: 500 }
      )
    }
  }

  logger.info('Webhook processed successfully', { eventType, id })
  return NextResponse.json({ success: true }, { status: 200 })
}
