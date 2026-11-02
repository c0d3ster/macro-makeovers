import { Env, requireEnv } from '@/libs/Env'
import { getBaseUrl } from '@/utils/Env'

const MCP_PATH = '/api/mcp'

type ProtectedResourceMetadata = {
  resource: string
  authorization_servers: string[]
  bearer_methods_supported: string[]
  resource_name: string
}

// The URL to paste into Claude's connector dialog. It is also the resource the metadata names.
const getMcpResourceUrl = (): string => `${getBaseUrl()}${MCP_PATH}`

// Sent in the WWW-Authenticate header so a client that was refused knows where to look next
export const getProtectedResourceMetadataUrl = (): string =>
  `${getBaseUrl()}/.well-known/oauth-protected-resource`

// Supabase Auth issues the tokens, so it is the authorization server
const getAuthorizationServerUrl = (): string =>
  `${requireEnv.NEXT_PUBLIC_SUPABASE_URL()}/auth/v1`

// RFC 9728 protected resource metadata, which is how an MCP client finds the authorization server
export const getProtectedResourceMetadata = (): ProtectedResourceMetadata => ({
  resource: getMcpResourceUrl(),
  authorization_servers: [getAuthorizationServerUrl()],
  bearer_methods_supported: ['header'],
  resource_name: `${Env.NEXT_PUBLIC_BRAND_NAME} recipe import`,
})
