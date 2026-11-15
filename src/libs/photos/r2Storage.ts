import { AwsClient } from 'aws4fetch'

// What any R2 call needs. The bucket may be public (photos) or private (the book).
export type R2Bucket = {
  accountId: string
  accessKeyId: string
  secretAccessKey: string
  bucket: string
}

export type R2Config = R2Bucket & {
  publicUrl: string
}

type FetchLike = typeof fetch

const clientFor = ({ accessKeyId, secretAccessKey }: R2Bucket): AwsClient =>
  new AwsClient({ accessKeyId, secretAccessKey, service: 's3', region: 'auto' })

const objectUrl = ({ accountId, bucket }: R2Bucket, key: string): string =>
  `https://${accountId}.r2.cloudflarestorage.com/${bucket}/${key}`

// Writes one object to R2 over its S3 API
export const putR2Object = async (
  bucket: R2Bucket,
  key: string,
  bytes: Uint8Array<ArrayBuffer>,
  contentType: string,
  fetchImpl: FetchLike = fetch
): Promise<void> => {
  const signed = await clientFor(bucket).sign(objectUrl(bucket, key), {
    method: 'PUT',
    headers: { 'Content-Type': contentType },
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
}

// Uploads a photo and returns the public URL of the object
export const uploadToR2 = async (
  config: R2Config,
  key: string,
  bytes: Uint8Array<ArrayBuffer>,
  fetchImpl: FetchLike = fetch
): Promise<string> => {
  await putR2Object(config, key, bytes, 'image/jpeg', fetchImpl)
  return `${config.publicUrl.replace(/\/+$/, '')}/${key}`
}

type PresignOptions = {
  expiresInSeconds: number
  // Saved under this name instead of opening in the tab
  downloadName?: string
}

// A short-lived link to one object in a private bucket. Signing is local: no request to R2.
export const presignR2Get = async (
  bucket: R2Bucket,
  key: string,
  { expiresInSeconds, downloadName }: PresignOptions
): Promise<string> => {
  const url = new URL(objectUrl(bucket, key))
  url.searchParams.set('X-Amz-Expires', String(expiresInSeconds))
  if (downloadName) {
    url.searchParams.set(
      'response-content-disposition',
      `attachment; filename="${downloadName}"`
    )
  }
  const signed = await clientFor(bucket).sign(url.toString(), {
    method: 'GET',
    aws: { signQuery: true },
  })
  return signed.url
}
