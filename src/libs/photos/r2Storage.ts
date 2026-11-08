import { AwsClient } from 'aws4fetch'

export type R2Config = {
  accountId: string
  accessKeyId: string
  secretAccessKey: string
  bucket: string
  publicUrl: string
}

type FetchLike = typeof fetch

// Uploads to Cloudflare R2 over its S3 API and returns the public URL of the object.
export const uploadToR2 = async (
  config: R2Config,
  key: string,
  bytes: Uint8Array<ArrayBuffer>,
  fetchImpl: FetchLike = fetch
): Promise<string> => {
  const client = new AwsClient({
    accessKeyId: config.accessKeyId,
    secretAccessKey: config.secretAccessKey,
    service: 's3',
    region: 'auto',
  })
  const endpoint = `https://${config.accountId}.r2.cloudflarestorage.com/${config.bucket}/${key}`
  const signed = await client.sign(endpoint, {
    method: 'PUT',
    headers: { 'Content-Type': 'image/jpeg' },
    body: bytes,
  })
  // Sent as the bytes, not as the signed Request. Its body is a stream, which fetch sends without
  // a Content-Length, and R2 refuses that with 411 Length Required.
  const response = await fetchImpl(signed.url, {
    method: 'PUT',
    headers: signed.headers,
    body: bytes,
  })
  if (!response.ok) {
    // R2 explains a refusal in an XML <Message>, which says far more than the status alone
    const body = await response.text().catch(() => '')
    const reason = /<Message>(.*?)<\/Message>/.exec(body)?.[1]
    throw new Error(
      `R2 upload failed with ${response.status}${reason ? `: ${reason}` : ''}`
    )
  }
  return `${config.publicUrl.replace(/\/+$/, '')}/${key}`
}
