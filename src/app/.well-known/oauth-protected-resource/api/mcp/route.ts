import { NextResponse } from 'next/server'

import { getProtectedResourceMetadata } from '@/libs/mcp/metadata'

// RFC 9728 puts the metadata for a resource with a path at the well-known URL plus that path.
// Same document as the root one, for clients that look here first.
export const GET = (): NextResponse =>
  NextResponse.json(getProtectedResourceMetadata())
