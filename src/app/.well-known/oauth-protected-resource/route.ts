import { NextResponse } from 'next/server'

import { getProtectedResourceMetadata } from '@/libs/mcp/metadata'

export const GET = (): NextResponse =>
  NextResponse.json(getProtectedResourceMetadata())
