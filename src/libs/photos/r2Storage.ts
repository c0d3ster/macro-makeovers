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
  bytes: Uint8Array,
  fetchImpl: FetchLike = fetch
): Promise<string> => {
  const client = new AwsClient({
    accessKeyId: config.accessKeyId,
    secretAccessKey: config.secretAccessKey,
    service: 's3',
    region: 'auto',
  })
  const endpoint = `https://${config.accountId}.r2.cloudflarestorage.com/${config.bucket}/${key}`
  // Sign with aws4fetch, send with the injected fetch
  const signed = await client.sign(endpoint, {
    method: 'PUT',
    headers: { 'Content-Type': 'image/png' },
    body: bytes,
  })
  const response = await fetchImpl(signed)
  if (!response.ok) {
    throw new Error(`R2 upload failed with ${response.status}`)
  }
  return `${config.publicUrl.replace(/\/+$/, '')}/${key}`
}
