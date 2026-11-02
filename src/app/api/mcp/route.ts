import 'reflect-metadata'

import type { NextRequest } from 'next/server'

import { WebStandardStreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js'
import { NextResponse } from 'next/server'

import { verifyAccessToken } from '@/libs/mcp/accessToken'
import { getProtectedResourceMetadataUrl } from '@/libs/mcp/metadata'
import { createRecipeMcpServer } from '@/libs/mcp/recipeMcpServer'

// A refused request points the client at the metadata that leads it to Supabase's OAuth flow
const reject = (status: 401 | 403, error: string): NextResponse =>
  NextResponse.json(
    { error },
    {
      status,
      headers: {
        'WWW-Authenticate': `Bearer resource_metadata="${getProtectedResourceMetadataUrl()}"`,
      },
    }
  )

export const POST = async (request: NextRequest): Promise<Response> => {
  const check = await verifyAccessToken(request.headers.get('authorization'))
  if (!check.ok) {
    return check.reason === 'forbidden'
      ? reject(403, 'Only the site owner can use this server.')
      : reject(401, 'Sign in required.')
  }

  const server = createRecipeMcpServer({
    req: request,
    authId: check.authId,
    token: check.token,
  })
  // Stateless: a fresh server and transport per request, with JSON replies instead of streams
  const transport = new WebStandardStreamableHTTPServerTransport({
    sessionIdGenerator: undefined,
    enableJsonResponse: true,
  })
  await server.connect(transport)

  return transport.handleRequest(request)
}

// No server-initiated streams, so only POST is supported
const methodNotAllowed = (): NextResponse =>
  new NextResponse(null, { status: 405, headers: { Allow: 'POST' } })

export const GET = methodNotAllowed
export const DELETE = methodNotAllowed
