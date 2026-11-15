// Seals a small JSON value (the member's Kroger tokens) for an httpOnly cookie with AES-GCM, so
// the tokens never sit in the database and can't be read or changed in the browser. The key is
// derived from a server secret. Uses Web Crypto, which Node and the edge both have.

const encoder = new TextEncoder()
const decoder = new TextDecoder()
const IV_BYTES = 12

const toBase64Url = (bytes: Uint8Array): string =>
  btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')

const fromBase64Url = (value: string): Uint8Array => {
  const base64 = value.replace(/-/g, '+').replace(/_/g, '/')
  const binary = atob(base64.padEnd(Math.ceil(base64.length / 4) * 4, '='))
  return Uint8Array.from(binary, (char) => char.charCodeAt(0))
}

const keyFor = async (secret: string): Promise<CryptoKey> => {
  const digest = await crypto.subtle.digest('SHA-256', encoder.encode(secret))
  return crypto.subtle.importKey('raw', digest, 'AES-GCM', false, ['encrypt', 'decrypt'])
}

export const sealValue = async (value: unknown, secret: string): Promise<string> => {
  const iv = crypto.getRandomValues(new Uint8Array(IV_BYTES))
  const sealed = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    await keyFor(secret),
    encoder.encode(JSON.stringify(value))
  )
  return `${toBase64Url(iv)}.${toBase64Url(new Uint8Array(sealed))}`
}

// Undefined for anything tampered with, sealed under another secret, or not ours at all
export const unsealValue = async (
  sealed: string,
  secret: string
): Promise<unknown> => {
  const [iv, data] = sealed.split('.')
  if (!iv || !data) return undefined
  try {
    const opened = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: fromBase64Url(iv) },
      await keyFor(secret),
      fromBase64Url(data)
    )
    return JSON.parse(decoder.decode(opened))
  } catch {
    return undefined
  }
}
